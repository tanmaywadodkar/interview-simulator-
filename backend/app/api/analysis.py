from fastapi import APIRouter
from app.schemas.analysis import (
    FrameAnalysisRequest,
    FrameAnalysisResponse,
    CommunicationAnalysisRequest,
    CommunicationAnalysisResponse,
    HeadPoseCalibrationRequest,
    HeadPoseCalibrationResponse,
)
from app.services.analysis_service import analysis_service
from app.services.communication.communication_service import communication_service

router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.post("/frame", response_model=FrameAnalysisResponse)
async def analyze_frame(payload: FrameAnalysisRequest):
    """
    Process incoming webcam frame base64 and return computer vision communication metrics.
    """
    return analysis_service.process_frame(payload.frame_base64)


@router.post("/calibrate-head-pose", response_model=HeadPoseCalibrationResponse)
async def calibrate_head_pose(payload: HeadPoseCalibrationRequest):
    """
    Calibrates neutral head pose baseline angles (yaw, pitch, roll).
    """
    return analysis_service.calibrate_head_pose(payload)


@router.post("/communication", response_model=CommunicationAnalysisResponse)
async def analyze_communication(payload: CommunicationAnalysisRequest):
    """
    Process spoken answer transcript and timing data to generate measurable communication metrics.
    """
    res = communication_service.analyze_communication(
        transcript=payload.transcript,
        duration_seconds=payload.duration_seconds,
        pauses_sec=payload.pauses,
        interview_type=payload.interview_type,
        role=payload.role,
    )
    return CommunicationAnalysisResponse(**res)
