from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.interview import Interview, Question, Answer, CommunicationMetrics
from app.models.user import User
from app.schemas.interview import InterviewCreate


def get_or_create_default_user(db: Session) -> User:
    user = db.query(User).first()
    if not user:
        user = User(name="Candidate User", email="candidate@example.com")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def create_interview(db: Session, interview_in: InterviewCreate) -> Interview:
    user = get_or_create_default_user(db)
    interview = Interview(
        user_id=user.id,
        role=interview_in.role,
        interview_type=interview_in.interview_type,
        experience=interview_in.experience,
        difficulty=interview_in.difficulty,
        total_questions=interview_in.total_questions,
        resume_summary=interview_in.resume_summary,
        skills=interview_in.skills,
        projects=interview_in.projects,
        job_description=interview_in.job_description,
        status="in_progress",
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)
    return interview


def get_interview(db: Session, interview_id: str) -> Optional[Interview]:
    return db.query(Interview).filter(Interview.id == interview_id).first()


def add_question(db: Session, interview_id: str, question_text: str, order: int, category: str = "General") -> Question:
    q = Question(
        interview_id=interview_id,
        question=question_text,
        order=order,
        category=category,
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


def add_answer(db: Session, question_id: str, transcript: str, score: float, evaluation: Dict[str, Any]) -> Answer:
    answer = db.query(Answer).filter(Answer.question_id == question_id).first()
    if answer:
        answer.transcript = transcript
        answer.score = score
        answer.evaluation = evaluation
    else:
        answer = Answer(
            question_id=question_id,
            transcript=transcript,
            score=score,
            evaluation=evaluation,
        )
        db.add(answer)
    db.commit()
    db.refresh(answer)
    return answer


def finish_interview(db: Session, interview_id: str, overall_score: float, report_summary: Dict[str, Any]) -> Interview:
    interview = get_interview(db, interview_id)
    if interview:
        interview.status = "completed"
        interview.overall_score = overall_score
        interview.report_summary = report_summary
        interview.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(interview)
    return interview


def record_communication_metric(db: Session, interview_id: str, name: str, value: float) -> CommunicationMetrics:
    metric = CommunicationMetrics(
        interview_id=interview_id,
        metric_name=name,
        metric_value=value,
    )
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return metric


def get_interview_history(db: Session, limit: int = 50) -> List[Interview]:
    return (
        db.query(Interview)
        .order_by(Interview.started_at.desc())
        .limit(limit)
        .all()
    )


def delete_interview(db: Session, interview_id: str) -> bool:
    interview = get_interview(db, interview_id)
    if interview:
        db.delete(interview)
        db.commit()
        return True
    return False
