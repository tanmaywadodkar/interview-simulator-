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
from app.services.vision.head_pose_analyzer import head_pose_analyzer
from app.utils.logger import logger

router = APIRouter(prefix="/interview", tags=["Interview"])


@router.post("/start", response_model=InterviewResponse)
async def start_interview(payload: InterviewCreate, db: Session = Depends(get_db)):
    """
    Initialize a new interview, persist candidate parameters, and generate the introductory question.
    """
    if not head_pose_analyzer.is_calibrated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pre-interview verification incomplete. Head pose must be calibrated."
        )

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
    Submit candidate answer transcript, evaluate using AI Evaluator, analyze communication metrics, and persist session metrics.
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

    # Evaluate answer content
    evaluation = await answer_evaluator.evaluate_answer(
        question=current_q.question,
        transcript=sanitized_transcript,
        role=interview.role,
        experience=interview.experience,
        difficulty=interview.difficulty,
        interview_type=interview.interview_type,
    )

    score = float(evaluation.get("score", 7.0))

    # Analyze communication metrics for this specific question
    comm_q_metrics = analysis_service.analyze_question_communication(
        transcript=sanitized_transcript,
        duration_sec=payload.duration_seconds,
        pauses_sec=payload.pauses,
    )
    
    # Store metrics in database linked to current question
    crud.record_communication_metric(db, interview.id, "words_per_minute", float(comm_q_metrics["words_per_minute"]), question_id=current_q.id)
    crud.record_communication_metric(db, interview.id, "filler_words_count", float(comm_q_metrics["filler_words_count"]), question_id=current_q.id, text_desc=", ".join(comm_q_metrics.get("filler_words_found", [])))
    crud.record_communication_metric(db, interview.id, "communication_score", float(comm_q_metrics.get("communication_score", 80)), question_id=current_q.id)
    crud.record_communication_metric(db, interview.id, "average_pause_seconds", float(comm_q_metrics.get("average_pause_seconds", 0.0)), question_id=current_q.id)
    crud.record_communication_metric(db, interview.id, "eye_contact_percentage", float(comm_q_metrics["eye_contact_percentage"]), question_id=current_q.id)

    # Attach communication metrics to answer evaluation dict
    evaluation["communication"] = comm_q_metrics

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
    scored_count = 0

    rel_sum, clar_sum, tech_sum, struct_sum = 0.0, 0.0, 0.0, 0.0
    all_strengths = []
    all_improvements = []
    total_filler_words = 0
    comm_results_list = []

    for q in interview.questions:
        if q.answer:
            ans_count += 1
            eval_data = q.answer.evaluation or {}
            score = q.answer.score

            if score is not None:
                scored_count += 1
                total_score_sum += score
                rel_sum += float(eval_data.get("relevance", score))
                clar_sum += float(eval_data.get("clarity", score))
                tech_sum += float(eval_data.get("technical_accuracy", score))
                struct_sum += float(eval_data.get("structure", score))
            
            rel = eval_data.get("relevance", score)
            clar = eval_data.get("clarity", score)
            tech = eval_data.get("technical_accuracy", score)
            struct = eval_data.get("structure", score)

            comm_q = eval_data.get("communication") or analysis_service.analyze_question_communication(q.answer.transcript)
            comm_results_list.append(comm_q)
            
            filler_val = comm_q.get("filler_words_count")
            if filler_val is not None:
                total_filler_words += int(filler_val)

            strengths = eval_data.get("strengths", ["Answered the question clearly."])
            improvements = eval_data.get("improvements", ["Provide more specific metrics."])
            all_strengths.extend(strengths)
            all_improvements.extend(improvements)
            
            wpm_val = comm_q.get("words_per_minute")

            from app.schemas.interview import QuestionCommunicationReport
            q_comm_schema = QuestionCommunicationReport(
                eye_contact_percentage=float(comm_q.get("eye_contact_percentage", 85.0)),
                face_visibility_percentage=float(comm_q.get("face_visibility_percentage", 96.0)),
                words_per_minute=int(wpm_val) if wpm_val is not None else None,
                speaking_pace_rating=str(comm_q.get("speaking_pace_rating", "Insufficient data")),
                filler_words_count=int(filler_val) if filler_val is not None else None,
                filler_words_found=comm_q.get("filler_words_found", []),
                hand_movement_intensity=str(comm_q.get("hand_movement_intensity", "Moderate")),
                posture_status=str(comm_q.get("posture_status", "Good Alignment")),
                communication_score=comm_q.get("communication_score"),
                answer_duration_seconds=comm_q.get("response_duration_sec"),
                average_pause_seconds=comm_q.get("average_pause_seconds"),
                longest_pause_seconds=comm_q.get("longest_pause_seconds"),
                pause_behavior_type=comm_q.get("pause_behavior_type"),
                repetition_score=comm_q.get("repetition_score"),
                feedback=comm_q.get("feedback"),
            )

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
                communication=q_comm_schema,
            ))

    if scored_count == 0:
        avg_score_10 = 0.0
        overall_100 = 0.0
        cat_scores = CategoryScores(
            interview_performance=0.0,
            answer_quality=0.0,
            technical_knowledge=0.0,
            communication=0.0,
            visual_presentation=0.0,
        )
        dedup_strengths = ["Session initialized successfully."]
        dedup_improvements = ["No answer data submitted for evaluation."]
        summary_text = (
            f"No questions were sufficiently answered during this {interview.interview_type} interview session for {interview.role}. "
            "Insufficient data collected to evaluate candidate performance."
        )
        top_recommendation = "Complete at least one interview question with spoken answers to generate a full performance analysis."
    else:
        avg_score_10 = total_score_sum / scored_count
        overall_100 = round(avg_score_10 * 10, 1)

        ans_qual = round((rel_sum / scored_count) * 10, 1)
        tech_know = round((tech_sum / scored_count) * 10, 1)
        comm_score = round(max(50.0, min(100.0, ((clar_sum / scored_count) * 10) - (total_filler_words * 1.5))), 1)
        vis_score = round(max(60.0, min(98.0, 85.0 + (avg_score_10 * 1.2))), 1)

        cat_scores = CategoryScores(
            interview_performance=overall_100,
            answer_quality=ans_qual,
            technical_knowledge=tech_know,
            communication=comm_score,
            visual_presentation=vis_score,
        )

        dedup_strengths = list(dict.fromkeys(all_strengths))[:4] or [
            "Good communication style and engagement.",
            f"Clear understanding of {interview.role} concepts.",
        ]

        dedup_improvements = list(dict.fromkeys(all_improvements)) or [
            "Include more specific metrics and quantifiable outcomes.",
            "Structure answers consistently using the STAR method.",
        ]

        # Constructive objective feedback (strictly non-diagnostic)
        if total_filler_words > 4:
            dedup_improvements.append(f"Used {total_filler_words} filler words across answers. Try replacing them with short intentional pauses.")
        elif total_filler_words == 0:
            dedup_improvements.append("Maintained concise phrasing with minimal filler word usage.")

        dedup_improvements = list(dict.fromkeys(dedup_improvements))[:4]

        summary_text = (
            f"The candidate demonstrated solid technical and contextual awareness for the {interview.role} role. "
            f"Across {scored_count} successfully answered questions in a {interview.difficulty} {interview.interview_type} scenario, "
            f"their responses scored an overall {overall_100}/100. Key strengths included strong clarity and domain relevance."
        )

        top_recommendation = (
            dedup_improvements[0] if dedup_improvements else "Focus on providing structured, metric-driven answers."
        )

    comm_metrics_data = analysis_service.generate_interview_communication_summary(
        ans_count, avg_score_10, comm_results_list=comm_results_list
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

