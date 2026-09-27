import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.db.database import Base, engine
from app.services.vision import FaceAnalyzer, HandAnalyzer, PoseAnalyzer, SpeakingAnalyzer, speaking_analyzer


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield


def test_speaking_analyzer_filler_words():
    analyzer = SpeakingAnalyzer(filler_words=["basically", "like", "you know", "um"])
    transcript = "Basically, I used Python and FastAPI, um, because like it was very fast, you know."
    res = analyzer.analyze_transcript(transcript, duration_sec=30.0)

    assert res["words_per_minute"] > 0
    assert res["filler_words_count"] == 4
    assert "basically" in res["filler_words_found"]
    assert "like" in res["filler_words_found"]
    assert "um" in res["filler_words_found"]
    assert "you know" in res["filler_words_found"]
    assert res["answer_length_words"] > 10


def test_face_and_pose_analyzers():
    face_analyzer = FaceAnalyzer()
    res_face = face_analyzer._fallback_response()
    assert res_face["face_detected"] is False
    assert "eye_contact_ratio" in res_face

    pose_analyzer = PoseAnalyzer()
    res_pose = pose_analyzer.analyze_pose(face_center_y=0.45, face_center_x=0.5)
    assert res_pose["posture_status"] == "Good Alignment"
    assert res_pose["posture_score"] > 8.0

    res_slouch = pose_analyzer.analyze_pose(face_center_y=0.75, face_center_x=0.5)
    assert res_slouch["posture_status"] == "Slouching"


def test_hand_analyzer():
    hand_analyzer = HandAnalyzer()
    res_hand = hand_analyzer.analyze_hand_presence(b"fake_bytes")
    assert res_hand["hand_detected"] is True
    assert "movement_intensity" in res_hand


def test_full_communication_flow():
    with TestClient(app) as client:
        # Start interview
        res_start = client.post("/api/interview/start", json={
            "role": "Data Scientist",
            "interview_type": "Technical",
            "experience": "Intermediate",
            "difficulty": "Medium",
            "total_questions": 1,
        })
        assert res_start.status_code == 200
        interview_id = res_start.json()["id"]

        # Submit answer containing filler words
        ans_res = client.post(f"/api/interview/{interview_id}/answer", json={
            "transcript": "Basically I built a random forest model and, like, achieved 92 percent accuracy."
        })
        assert ans_res.status_code == 200

        # Finish interview & verify 5-category scorecard & question communication details
        fin_res = client.post(f"/api/interview/{interview_id}/finish")
        assert fin_res.status_code == 200
        report = fin_res.json()

        assert "category_scores" in report
        cats = report["category_scores"]
        assert "interview_performance" in cats
        assert "answer_quality" in cats
        assert "technical_knowledge" in cats
        assert "communication" in cats
        assert "visual_presentation" in cats

        assert len(report["questions_detail"]) == 1
        q_comm = report["questions_detail"][0]["communication"]
        assert q_comm["words_per_minute"] > 0
        assert q_comm["filler_words_count"] > 0
        assert "basically" in q_comm["filler_words_found"] or "like" in q_comm["filler_words_found"]
