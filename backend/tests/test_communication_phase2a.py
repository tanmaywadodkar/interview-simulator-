import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.communication import (
    communication_service,
    speech_analyzer,
    filler_detector,
    pause_analyzer,
    repetition_analyzer,
)


def test_1_normal_answer():
    transcript = "In my previous role as a software engineer, I designed a microservice architecture using Python and FastAPI."
    res = communication_service.analyze_communication(transcript, duration_seconds=10.0)
    assert res["communication_score"] > 70
    assert res["speaking_rate_wpm"] > 90
    assert res["filler_word_count"] == 0
    assert len(res["feedback"]) > 0


def test_2_fillers_detected():
    transcript = "Um, basically, I used React and, like, you know, it was very effective."
    res = filler_detector.analyze(transcript)
    assert res["filler_word_count"] >= 4
    assert "um" in res["filler_words_used"]
    assert "basically" in res["filler_words_used"]
    assert "like" in res["filler_words_used"]
    assert "you know" in res["filler_words_used"]


def test_3_filler_substrings_not_matched():
    # "likely" and "likewise" must NOT be counted as filler word "like"
    transcript = "It is likely that we will likewise adopt this pattern in the future."
    res = filler_detector.analyze(transcript)
    assert res["filler_words_used"].get("like", 0) == 0
    assert res["filler_word_count"] == 0


def test_4_fast_answer_wpm():
    # 50 words in 10 seconds -> 300 WPM (Very fast)
    words = "word " * 50
    res = speech_analyzer.analyze(words, duration_seconds=10.0)
    assert res["speaking_rate_wpm"] == 300.0
    assert res["pace_classification"] == "Very fast"


def test_5_slow_answer_wpm():
    # 9 words in 12 seconds -> 45 WPM (Very slow)
    transcript = "I worked on a simple backend project last year."
    res = speech_analyzer.analyze(transcript, duration_seconds=12.0)
    assert res["speaking_rate_wpm"] == 45.0
    assert res["pace_classification"] == "Very slow"


def test_6_repeated_phrase_detected():
    transcript = "We implemented the cache layer we implemented the cache layer to reduce database latency."
    res = repetition_analyzer.analyze(transcript)
    assert len(res["repeated_phrases"]) > 0
    assert "implemented the cache layer" in res["repeated_phrases"][0]


def test_7_normal_stop_words_not_flagged_as_repetition():
    transcript = "The data was sent to the server and the server responded with the output to the client."
    res = repetition_analyzer.analyze(transcript)
    assert res["repetition_severity"] in ["Low", "Moderate"]
    assert res["repetition_score"] >= 70


def test_8_empty_transcript_handling():
    res = communication_service.analyze_communication("", duration_seconds=10.0)
    assert res["communication_score"] >= 0
    assert res["speaking_rate_wpm"] == 0.0
    assert res["filler_word_count"] == 0
    assert "No spoken transcript detected." in res["feedback"]


def test_9_zero_or_negative_duration_handling():
    transcript = "I am a full stack developer experienced in Python and React."
    # Should not raise ZeroDivisionError
    res = speech_analyzer.analyze(transcript, duration_seconds=0.0)
    assert res["speaking_rate_wpm"] > 0
    assert res["duration_seconds"] > 0

    res_neg = speech_analyzer.analyze(transcript, duration_seconds=-5.0)
    assert res_neg["speaking_rate_wpm"] > 0


def test_10_missing_pause_data_handling():
    transcript = "We developed an automated pipeline to handle high throughput requests efficiently."
    # Pass pauses=None
    res = pause_analyzer.analyze(pauses_sec=None, duration_seconds=15.0, transcript=transcript)
    assert "pause_count" in res
    assert "pause_behavior_type" in res

    full_res = communication_service.analyze_communication(transcript, duration_seconds=15.0, pauses_sec=None)
    assert full_res["communication_score"] > 0


def test_api_communication_endpoint():
    with TestClient(app) as client:
        res = client.post("/api/analysis/communication", json={
            "transcript": "Basically I built a microservice architecture and like achieved 99 percent uptime.",
            "duration_seconds": 15.0,
            "pauses": [1.2, 2.0]
        })
        assert res.status_code == 200
        data = res.json()
        assert "communication_score" in data
        assert "speaking_rate_wpm" in data
        assert data["filler_word_count"] >= 2
        assert len(data["feedback"]) > 0
