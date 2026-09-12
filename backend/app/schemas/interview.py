from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class InterviewCreate(BaseModel):
    role: str = Field(..., json_schema_extra={"example": "Software Engineer"})
    interview_type: str = Field(default="Technical", json_schema_extra={"example": "Technical"})
    experience: str = Field(default="Intermediate", json_schema_extra={"example": "Intermediate"})
    difficulty: str = Field(default="Medium", json_schema_extra={"example": "Medium"})
    total_questions: int = Field(default=5, ge=1, le=15)
    resume_summary: Optional[str] = None
    skills: Optional[str] = None
    projects: Optional[str] = None
    job_description: Optional[str] = None


class AnswerSubmit(BaseModel):
    transcript: str = Field(..., min_length=1)


class QuestionResponse(BaseModel):
    id: str
    interview_id: str
    question: str
    order: int
    category: Optional[str] = "General"

    model_config = ConfigDict(from_attributes=True)


class AnswerEvaluationSchema(BaseModel):
    score: float
    relevance: float
    clarity: float
    technical_accuracy: float
    structure: float
    strengths: List[str] = []
    improvements: List[str] = []
    follow_up_needed: bool = False
    sample_improved_answer: Optional[str] = None


class AnswerResponse(BaseModel):
    id: str
    question_id: str
    transcript: str
    score: Optional[float] = None
    evaluation: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class QuestionWithAnswerResponse(BaseModel):
    id: str
    question: str
    order: int
    category: Optional[str] = None
    answer: Optional[AnswerResponse] = None

    model_config = ConfigDict(from_attributes=True)


class InterviewResponse(BaseModel):
    id: str
    role: str
    interview_type: str
    experience: str
    difficulty: str
    total_questions: int
    status: str
    current_question: Optional[QuestionResponse] = None
    overall_score: Optional[float] = None
    started_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CommunicationMetricsSummary(BaseModel):
    speaking_speed_wpm: float = 140.0
    filler_words_count: int = 2
    eye_contact_percentage: float = 85.0
    face_visibility_percentage: float = 95.0
    posture_score: float = 8.5
    is_simulated_demo: bool = True


class QuestionDetailReport(BaseModel):
    question_id: str
    order: int
    category: str
    question: str
    transcript: str
    score: float
    relevance: float
    clarity: float
    technical_accuracy: float
    structure: float
    strengths: List[str]
    improvements: List[str]
    sample_improved_answer: str


class CategoryScores(BaseModel):
    answer_quality: float
    technical_knowledge: float
    communication: float
    clarity: float
    confidence: float
    structure: float


class PerformanceReportResponse(BaseModel):
    interview_id: str
    role: str
    interview_type: str
    experience: str
    difficulty: str
    total_questions: int
    completed_at: datetime
    overall_score: float
    category_scores: CategoryScores
    what_you_did_well: List[str]
    what_you_should_improve: List[str]
    ai_interviewer_summary: str
    most_important_improvement: str
    questions_detail: List[QuestionDetailReport]
    communication_metrics: CommunicationMetricsSummary
