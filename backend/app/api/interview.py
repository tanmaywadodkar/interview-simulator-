from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import crud
from app.schemas.interview import (
    InterviewCreate,
    InterviewResponse,
    QuestionResponse,
    AnswerSubmit,
    AnswerEvaluationSchema,
    PerformanceReportResponse,
    CategoryScores,
    QuestionDetailReport,
    CommunicationMetricsSummary,
)
from app.services import ai_interviewer_service, answer_evaluator, speech_service, analysis_service
from app.utils.logger import logger

router = APIRouter(prefix="/interview", tags=["Interview"])


@router.post("/start", response_model=InterviewResponse)
async def start_interview(payload: InterviewCreate, db: Session = Depends(get_db)):
    """
    Initialize a new interview, persist candidate parameters, and generate the introductory question.
    """
    try:
        interview = crud.create_interview(db, payload)
        first_q_text = await ai_interviewer_service.generate_first_question(
            role=interview.role,
            interview_type=interview.interview_type,
            experience=interview.experience,
            difficulty=interview.difficulty,
            resume_summary=interview.resume_summary,
            skills=interview.skills,
            projects=interview.projects,
            job_description=interview.job_description,
        )

        q1 = crud.add_question(
            db=db,
            interview_id=interview.id,
            question_text=first_q_text,
            order=1,
            category=interview.interview_type
        )

        return InterviewResponse(
            id=interview.id,
            role=interview.role,
            interview_type=interview.interview_type,
            experience=interview.experience,
            difficulty=interview.difficulty,
            total_questions=interview.total_questions,
            status=interview.status,
            current_question=QuestionResponse.model_validate(q1),
            started_at=interview.started_at,
        )
    except Exception as e:
        logger.error(f"Error starting interview: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initialize interview session.")


@router.get("/history", response_model=List[Dict[str, Any]])
def get_interview_history(db: Session = Depends(get_db)):
    """
    Retrieve past interview sessions dashboard.
    """
    interviews = crud.get_interview_history(db)
    result = []
    for i in interviews:
        result.append({
            "id": i.id,
            "role": i.role,
            "interview_type": i.interview_type,
            "experience": i.experience,
            "difficulty": i.difficulty,
            "total_questions": i.total_questions,
            "status": i.status,
            "overall_score": i.overall_score or 0.0,
            "started_at": i.started_at.isoformat() if i.started_at else None,
            "completed_at": i.completed_at.isoformat() if i.completed_at else None,
        })
    return result


@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview_details(interview_id: str, db: Session = Depends(get_db)):
    interview = crud.get_interview(db, interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    latest_q = None
    if interview.questions:
        latest_q = QuestionResponse.model_validate(interview.questions[-1])

    return InterviewResponse(
        id=interview.id,
        role=interview.role,
        interview_type=interview.interview_type,
        experience=interview.experience,
        difficulty=interview.difficulty,
        total_questions=interview.total_questions,
        status=interview.status,
        current_question=latest_q,
        overall_score=interview.overall_score,
        started_at=interview.started_at,
        completed_at=interview.completed_at,
    )


@router.post("/{interview_id}/answer", response_model=AnswerEvaluationSchema)
async def submit_answer(interview_id: str, payload: AnswerSubmit, db: Session = Depends(get_db)):
    """
    Submit candidate answer transcript, evaluate using AI Evaluator, and save evaluation.
    """
    interview = crud.get_interview(db, interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    if not interview.questions:
        raise HTTPException(status_code=400, detail="No active question found for this interview.")

    current_q = interview.questions[-1]

    sanitized_transcript = speech_service.process_transcript(payload.transcript)
    if not sanitized_transcript:
        raise HTTPException(status_code=400, detail="Answer transcript cannot be empty.")

    evaluation = await answer_evaluator.evaluate_answer(
        question=current_q.question,
        transcript=sanitized_transcript,
        role=interview.role,
        experience=interview.experience,
        difficulty=interview.difficulty,
        interview_type=interview.interview_type,
    )

    score = float(evaluation.get("score", 7.0))

    crud.add_answer(
        db=db,
        question_id=current_q.id,
        transcript=sanitized_transcript,
        score=score,
        evaluation=evaluation,
    )

    return AnswerEvaluationSchema(
        score=score,
        relevance=float(evaluation.get("relevance", 7.0)),
        clarity=float(evaluation.get("clarity", 7.0)),
        technical_accuracy=float(evaluation.get("technical_accuracy", 7.0)),
        structure=float(evaluation.get("structure", 7.0)),
        strengths=evaluation.get("strengths", []),
        improvements=evaluation.get("improvements", []),
        follow_up_needed=evaluation.get("follow_up_needed", False),
        sample_improved_answer=evaluation.get("sample_improved_answer", None),
    )


@router.post("/{interview_id}/next-question", response_model=Dict[str, Any])
async def generate_next_question(interview_id: str, db: Session = Depends(get_db)):
    """
    Dynamically determine and generate the next interview question based on history and candidate performance.
    """
    interview = crud.get_interview(db, interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    current_q_count = len(interview.questions)
    if current_q_count >= interview.total_questions:
        return {
            "status": "completed",
            "message": "Maximum question limit reached for this session.",
            "completed": True,
            "current_question": None
        }

    last_q = interview.questions[-1]
    last_ans = last_q.answer.transcript if (last_q and last_q.answer) else ""
    last_eval = last_q.answer.evaluation if (last_q and last_q.answer) else None

    # Construct conversation history snippet
    history = []
    for q in interview.questions:
        history.append({
            "order": q.order,
            "question": q.question,
            "answer": q.answer.transcript if q.answer else "",
        })

    next_q_text = await ai_interviewer_service.generate_next_question(
        role=interview.role,
        interview_type=interview.interview_type,
        experience=interview.experience,
        difficulty=interview.difficulty,
        current_step=current_q_count + 1,
        total_questions=interview.total_questions,
        history=history,
        last_answer=last_ans,
        last_question=last_q.question if last_q else "",
        last_evaluation=last_eval,
        resume_summary=interview.resume_summary,
        skills=interview.skills,
        projects=interview.projects,
    )

    new_q = crud.add_question(
        db=db,
        interview_id=interview.id,
        question_text=next_q_text,
        order=current_q_count + 1,
        category=interview.interview_type
    )

    return {
        "status": "in_progress",
        "completed": False,
        "current_question": QuestionResponse.model_validate(new_q)
    }


@router.post("/{interview_id}/finish", response_model=PerformanceReportResponse)
async def finish_interview(interview_id: str, db: Session = Depends(get_db)):
    """
    Finalize the interview session and synthesize final performance report.
    """
    interview = crud.get_interview(db, interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    report = _build_performance_report(interview)
    crud.finish_interview(db, interview.id, report.overall_score, report.model_dump(mode="json"))
    return report


@router.get("/{interview_id}/report", response_model=PerformanceReportResponse)
def get_performance_report(interview_id: str, db: Session = Depends(get_db)):
    interview = crud.get_interview(db, interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    if interview.report_summary:
        return PerformanceReportResponse(**interview.report_summary)

    report = _build_performance_report(interview)
    crud.finish_interview(db, interview.id, report.overall_score, report.model_dump(mode="json"))
    return report


@router.delete("/{interview_id}")
def delete_interview(interview_id: str, db: Session = Depends(get_db)):
    success = crud.delete_interview(db, interview_id)
    if not success:
        raise HTTPException(status_code=404, detail="Interview not found")
    return {"message": "Interview deleted successfully for privacy compliance."}


def _build_performance_report(interview) -> PerformanceReportResponse:
    questions_detail = []
    total_score_sum = 0.0
    ans_count = 0

    rel_sum, clar_sum, tech_sum, struct_sum = 0.0, 0.0, 0.0, 0.0
    all_strengths = []
    all_improvements = []

    for q in interview.questions:
        if q.answer and q.answer.score is not None:
            ans_count += 1
            eval_data = q.answer.evaluation or {}
            score = q.answer.score
            total_score_sum += score

            rel = float(eval_data.get("relevance", score))
            clar = float(eval_data.get("clarity", score))
            tech = float(eval_data.get("technical_accuracy", score))
            struct = float(eval_data.get("structure", score))

            rel_sum += rel
            clar_sum += clar
            tech_sum += tech
            struct_sum += struct

            strengths = eval_data.get("strengths", ["Answered the question clearly."])
            improvements = eval_data.get("improvements", ["Provide more specific metrics."])
            all_strengths.extend(strengths)
            all_improvements.extend(improvements)

            questions_detail.append(QuestionDetailReport(
                question_id=q.id,
                order=q.order,
                category=q.category or interview.interview_type,
                question=q.question,
                transcript=q.answer.transcript,
                score=score,
                relevance=rel,
                clarity=clar,
                technical_accuracy=tech,
                structure=struct,
                strengths=strengths,
                improvements=improvements,
                sample_improved_answer=eval_data.get(
                    "sample_improved_answer",
                    f"A structured response focusing on {interview.role} best practices and concrete results."
                ),
            ))

    if ans_count == 0:
        avg_score_10 = 7.0
        overall_100 = 70.0
        cat_scores = CategoryScores(
            answer_quality=70.0,
            technical_knowledge=70.0,
            communication=75.0,
            clarity=70.0,
            confidence=72.0,
            structure=68.0,
        )
    else:
        avg_score_10 = total_score_sum / ans_count
        overall_100 = round(avg_score_10 * 10, 1)
        cat_scores = CategoryScores(
            answer_quality=round((rel_sum / ans_count) * 10, 1),
            technical_knowledge=round((tech_sum / ans_count) * 10, 1),
            communication=round(((clar_sum + rel_sum) / (2 * ans_count)) * 10, 1),
            clarity=round((clar_sum / ans_count) * 10, 1),
            confidence=round((avg_score_10 * 9.8), 1),
            structure=round((struct_sum / ans_count) * 10, 1),
        )

    dedup_strengths = list(dict.fromkeys(all_strengths))[:4] or [
        "Good communication style and engagement.",
        f"Clear understanding of {interview.role} concepts.",
    ]
    dedup_improvements = list(dict.fromkeys(all_improvements))[:4] or [
        "Include more specific metrics and quantifiable outcomes.",
        "Structure answers consistently using the STAR method.",
    ]

    comm_metrics_data = analysis_service.generate_interview_communication_summary(ans_count, avg_score_10)

    summary_text = (
        f"The candidate demonstrated solid technical and contextual awareness for the {interview.role} role. "
        f"Across {ans_count} answered questions in a {interview.difficulty} {interview.interview_type} scenario, "
        f"their responses scored an overall {overall_100}/100. Key strengths included strong clarity and domain relevance."
    )

    top_recommendation = (
        dedup_improvements[0] if dedup_improvements else "Focus on providing structured, metric-driven answers."
    )

    return PerformanceReportResponse(
        interview_id=interview.id,
        role=interview.role,
        interview_type=interview.interview_type,
        experience=interview.experience,
        difficulty=interview.difficulty,
        total_questions=interview.total_questions,
        completed_at=interview.completed_at or interview.started_at,
        overall_score=overall_100,
        category_scores=cat_scores,
        what_you_did_well=dedup_strengths,
        what_you_should_improve=dedup_improvements,
        ai_interviewer_summary=summary_text,
        most_important_improvement=top_recommendation,
        questions_detail=questions_detail,
        communication_metrics=CommunicationMetricsSummary(**comm_metrics_data)
    )
