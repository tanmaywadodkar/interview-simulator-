from fastapi import APIRouter
from app.schemas.analysis import FrameAnalysisRequest, FrameAnalysisResponse
from app.services.analysis_service import analysis_service

router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.post("/frame", response_model=FrameAnalysisResponse)
async def analyze_frame(payload: FrameAnalysisRequest):
    """
    Process incoming webcam frame base64 and return computer vision communication metrics.
    """
    return analysis_service.process_frame(payload.frame_base64)
