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
    duration_seconds: Optional[float] = None
    pauses: Optional[List[float]] = None


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
    speaking_speed_wpm: float = 138.0
    filler_words_count: int = 2
    eye_contact_percentage: Optional[float] = 85.0
    face_visibility_percentage: Optional[float] = 95.5
    hand_visibility_percentage: Optional[float] = 89.0
    hand_movement_intensity: str = "Moderate"
    posture_score: Optional[float] = 8.8
    posture_status: str = "Good Alignment"
    is_simulated_demo: bool = False

    # Phase 2A Speaking & Communication additions
    communication_score: Optional[int] = 78
    average_pause_seconds: Optional[float] = 1.1
    longest_pause_seconds: Optional[float] = 2.4
    answer_duration_seconds: Optional[float] = 102.0
    feedback: Optional[List[str]] = Field(default_factory=list)

    # Phase 2B Visual & Head Pose additions
    visual_presentation_score: Optional[int] = 85
    camera_framing_status: Optional[str] = "Good"
    head_movement_level: Optional[str] = "Stable"
    visual_insights: Optional[List[str]] = Field(default_factory=list)
    is_insufficient_data: bool = False
    data_status: str = "VALID"


class QuestionCommunicationReport(BaseModel):
    eye_contact_percentage: float
    face_visibility_percentage: float
    words_per_minute: int
    speaking_pace_rating: str
    filler_words_count: int
    filler_words_found: List[str]
    hand_movement_intensity: str
    posture_status: str

    # Phase 2A Speaking & Communication additions
    communication_score: Optional[int] = None
    answer_duration_seconds: Optional[float] = None
    average_pause_seconds: Optional[float] = None
    longest_pause_seconds: Optional[float] = None
    pause_behavior_type: Optional[str] = None
    repetition_score: Optional[int] = None
    feedback: Optional[List[str]] = None


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
    communication: QuestionCommunicationReport


class CategoryScores(BaseModel):
    interview_performance: float
    answer_quality: float
    technical_knowledge: float
    communication: float
    visual_presentation: float


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

