import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.db.database import Base, engine


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield


from app.services.vision.head_pose_analyzer import head_pose_analyzer

def test_full_interview_flow():
    head_pose_analyzer.set_calibration(0.0, 0.0, 0.0)
    with TestClient(app) as client:
        # 1. Start interview
        payload = {
            "role": "Software Engineer",
            "interview_type": "Technical",
            "experience": "Intermediate",
            "difficulty": "Medium",
            "total_questions": 2,
            "skills": "Python, FastAPI, React",
            "projects": "AI Chatbot"
        }
        res_start = client.post("/api/interview/start", json=payload)
        assert res_start.status_code == 200
        data_start = res_start.json()
        assert "id" in data_start
        interview_id = data_start["id"]
        assert data_start["status"] == "in_progress"
        assert data_start["current_question"] is not None

        # 2. Get interview details
        res_get = client.get(f"/api/interview/{interview_id}")
        assert res_get.status_code == 200
        assert res_get.json()["id"] == interview_id

        # 3. Submit answer to question 1
        ans_payload = {
            "transcript": "I built an AI chatbot application using Python and FastAPI for high performance backend API routing."
        }
        res_ans = client.post(f"/api/interview/{interview_id}/answer", json=ans_payload)
        assert res_ans.status_code == 200
        ans_data = res_ans.json()
        assert "score" in ans_data
        assert ans_data["score"] > 0.0
        assert len(ans_data["strengths"]) > 0

        # 4. Request next question
        res_next = client.post(f"/api/interview/{interview_id}/next-question")
        assert res_next.status_code == 200
        next_data = res_next.json()
        assert next_data["completed"] is False
        assert next_data["current_question"]["order"] == 2

        # 5. Submit answer to question 2
        ans_payload2 = {
            "transcript": "I handled scalability by using asynchronous request processing and database connection pooling."
        }
        res_ans2 = client.post(f"/api/interview/{interview_id}/answer", json=ans_payload2)
        assert res_ans2.status_code == 200

        # 6. Finish interview
        res_finish = client.post(f"/api/interview/{interview_id}/finish")
        assert res_finish.status_code == 200
        report_data = res_finish.json()
        assert report_data["overall_score"] >= 0.0
        assert "category_scores" in report_data
        assert len(report_data["questions_detail"]) == 2

        # 7. Retrieve report endpoint
        res_rep = client.get(f"/api/interview/{interview_id}/report")
        assert res_rep.status_code == 200
        assert res_rep.json()["interview_id"] == interview_id

        # 8. Check history list
        res_hist = client.get("/api/interview/history")
        assert res_hist.status_code == 200
        assert any(item["id"] == interview_id for item in res_hist.json())

        # 9. Delete interview
        res_del = client.delete(f"/api/interview/{interview_id}")
        assert res_del.status_code == 200


def test_invalid_interview_id():
    with TestClient(app) as client:
        res = client.get("/api/interview/non-existent-id-12345")
        assert res.status_code == 404
