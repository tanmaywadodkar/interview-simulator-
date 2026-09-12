from typing import Optional
from pydantic import BaseModel


class FrameAnalysisRequest(BaseModel):
    interview_id: str
    frame_base64: Optional[str] = None
    audio_chunk_base64: Optional[str] = None


class FrameAnalysisResponse(BaseModel):
    face_detected: bool
    face_count: int
    face_center_x: float
    face_center_y: float
    head_pose: str  # "Centered", "Looking Away", "Tilted"
    eye_contact_ratio: float
    hand_movement_detected: bool
    posture_status: str  # "Good", "Leaning", "Slouching"
    confidence_signal: float
    is_demo: bool = True
