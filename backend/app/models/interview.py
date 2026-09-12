import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    role = Column(String, nullable=False)
    interview_type = Column(String, nullable=False)  # HR, Technical, Behavioral, General
    experience = Column(String, nullable=False)      # Fresher, Beginner, Intermediate, Experienced
    difficulty = Column(String, nullable=False)      # Easy, Medium, Hard
    total_questions = Column(Integer, default=5)
    status = Column(String, default="in_progress")   # in_progress, completed
    
    # Candidate profile context
    resume_summary = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)
    projects = Column(Text, nullable=True)
    job_description = Column(Text, nullable=True)

    overall_score = Column(Float, nullable=True)
    report_summary = Column(JSON, nullable=True)
    
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="interviews")
    questions = relationship("Question", back_populates="interview", cascade="all, delete-orphan", order_by="Question.order")
    metrics = relationship("CommunicationMetrics", back_populates="interview", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    interview_id = Column(String, ForeignKey("interviews.id"), nullable=False)
    question = Column(Text, nullable=False)
    order = Column(Integer, nullable=False)
    category = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    interview = relationship("Interview", back_populates="questions")
    answer = relationship("Answer", back_populates="question", uselist=False, cascade="all, delete-orphan")
    metrics = relationship("CommunicationMetrics", back_populates="question", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    transcript = Column(Text, nullable=False)
    score = Column(Float, nullable=True)
    evaluation = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    question = relationship("Question", back_populates="answer")


class CommunicationMetrics(Base):
    __tablename__ = "communication_metrics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    interview_id = Column(String, ForeignKey("interviews.id"), nullable=False)
    question_id = Column(String, ForeignKey("questions.id"), nullable=True)
    metric_name = Column(String, nullable=False)
    metric_value = Column(Float, nullable=False)
    metric_text = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    interview = relationship("Interview", back_populates="metrics")
    question = relationship("Question", back_populates="metrics")
