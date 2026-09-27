from typing import Optional, List, Dict
from pydantic import BaseModel


class FrameAnalysisRequest(BaseModel):
    interview_id: Optional[str] = "default"
    frame_base64: Optional[str] = None
    audio_chunk_base64: Optional[str] = None


class HeadPoseCalibrationRequest(BaseModel):
    interview_id: Optional[str] = "default"
    frames: List[Dict[str, float]] = []
    neutral_yaw: Optional[float] = None
    neutral_pitch: Optional[float] = None
    neutral_roll: Optional[float] = None


class HeadPoseCalibrationResponse(BaseModel):
    calibrated: bool = True
    neutral_yaw: float = 0.0
    neutral_pitch: float = 0.0
    neutral_roll: float = 0.0
    frame_count: int = 0
    message: str = "Head pose calibrated successfully"


class FramingDetails(BaseModel):
    status: str = "GOOD"
    position: str = "CENTER"


class EyeContactDetails(BaseModel):
    status: str = "LOOKING_TOWARD_CAMERA"
    ratio: float = 0.85


class HeadPoseDetails(BaseModel):
    yaw: float = 0.0
    pitch: float = 0.0
    roll: float = 0.0
    yaw_deviation: float = 0.0
    pitch_deviation: float = 0.0
    roll_deviation: float = 0.0
    classification: str = "CENTER"


class HeadMovementDetails(BaseModel):
    status: str = "Normal Movement"
    level: str = "NORMAL"
    movement_score: int = 95
    orientation: str = "CENTER"
    movement_state: str = "STABLE"
    movement_event_active: bool = False
    movement_event_count: int = 0
    delta_yaw: float = 0.0
    delta_pitch: float = 0.0
    delta_roll: float = 0.0
    delta_magnitude: float = 0.0
    shake_count: int = 0
    tilt_detected: bool = False
    movement_events: int = 0
    events_per_minute: float = 0.0
    max_yaw_deviation: float = 0.0
    max_pitch_deviation: float = 0.0
    max_roll_deviation: float = 0.0
    avg_yaw_deviation: float = 0.0
    avg_pitch_deviation: float = 0.0
    avg_roll_deviation: float = 0.0


class FrameAnalysisResponse(BaseModel):
    analysis_available: bool = True
    score_available: bool = True
    face_detected: bool = False
    face_count: int = 0
    multiple_faces_detected: bool = False
    face_center_x: float = 0.0
    face_center_y: float = 0.0
    head_pose: str = "Not Detected"
    eye_contact_ratio: float = 0.0
    hand_movement_detected: bool = False
    posture_status: str = "Not Detected"
    confidence_signal: float = 0.0
    is_demo: bool = False
    visual_score: Optional[int] = None
    score_interpretation: Optional[str] = None
    framing: Optional[FramingDetails] = None
    eye_contact: Optional[EyeContactDetails] = None
    head_pose_details: Optional[HeadPoseDetails] = None
    head_movement: Optional[HeadMovementDetails] = None
    feedback: Optional[List[str]] = None


class CommunicationAnalysisRequest(BaseModel):
    transcript: str
    duration_seconds: Optional[float] = None
    pauses: Optional[List[float]] = None
    interview_type: Optional[str] = "General"
    role: Optional[str] = None


class CommunicationAnalysisResponse(BaseModel):
    communication_score: int
    speaking_rate_wpm: float
    answer_duration_seconds: float
    filler_word_count: int
    filler_rate: float
    filler_words: Dict[str, int]
    most_frequently_used_fillers: List[str]
    pause_count: int
    average_pause_seconds: float
    longest_pause_seconds: float
    pause_behavior_type: str
    repetition_score: int
    repetition_severity: str
    score_breakdown: Dict[str, int]
    pace_classification: str
    feedback: List[str]
