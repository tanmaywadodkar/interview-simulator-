from app.api.health import router as health_router
from app.api.interview import router as interview_router
from app.api.analysis import router as analysis_router

__all__ = ["health_router", "interview_router", "analysis_router"]
