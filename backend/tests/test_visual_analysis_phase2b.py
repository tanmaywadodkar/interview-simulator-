import pytest
import time
import base64
import numpy as np
import cv2
from app.services.vision.face_analyzer import FaceAnalyzer
from app.services.vision.framing_analyzer import FramingAnalyzer
from app.services.vision.eye_contact_analyzer import EyeContactAnalyzer
from app.services.vision.head_pose_analyzer import HeadPoseAnalyzer
from app.services.vision.visual_analysis_service import VisualAnalysisService


def create_synthetic_image(width=640, height=480, draw_face=True, face_center=(320, 240), face_radius=70, draw_second_face=False):
    """
    Utility helper creating a clean synthetic OpenCV image for testing vision pipelines.
    """
    img = np.ones((height, width, 3), dtype=np.uint8) * 240  # Light gray background

    if draw_face:
        cx, cy = face_center
        cv2.ellipse(img, (cx, cy), (face_radius, int(face_radius * 1.2)), 0, 0, 360, (180, 180, 180), -1)
        cv2.ellipse(img, (cx, cy), (face_radius, int(face_radius * 1.2)), 0, 0, 360, (50, 50, 50), 2)
        eye_y = cy - int(face_radius * 0.3)
        eye_offset = int(face_radius * 0.35)
        cv2.circle(img, (cx - eye_offset, eye_y), int(face_radius * 0.2), (30, 30, 30), -1)
        cv2.circle(img, (cx + eye_offset, eye_y), int(face_radius * 0.2), (30, 30, 30), -1)

    if draw_second_face:
        cx2, cy2 = face_center[0] + 150, face_center[1]
        cv2.ellipse(img, (cx2, cy2), (face_radius, int(face_radius * 1.2)), 0, 0, 360, (180, 180, 180), -1)

    _, encoded = cv2.imencode(".jpg", img)
    return base64.b64encode(encoded.tobytes()).decode("utf-8")


def test_empty_frame_detection():
    empty_img_b64 = create_synthetic_image(draw_face=False)
    service = VisualAnalysisService(window_size=5)
    res = service.analyze_frame_base64(empty_img_b64)

    assert res["analysis_available"] is True
    assert res["face_detected"] is False
    assert res["face_count"] == 0
    assert res["score_available"] is False


def test_invalid_frame_data():
    service = VisualAnalysisService(window_size=5)
    res = service.analyze_frame_base64("not_valid_base64_image_content_12345")

    assert res["analysis_available"] is False
    assert res["score_available"] is False
    assert res["face_detected"] is False


def test_centered_framing():
    analyzer = FramingAnalyzer()
    res = analyzer.analyze_framing(face_box=(200, 120, 180, 220), frame_dimensions=(640, 480))

    assert res["position"] == "CENTER"
    assert res["status"] == "GOOD"
    assert res["is_centered"] is True


def test_face_near_frame_edge():
    analyzer = FramingAnalyzer()
    res = analyzer.analyze_framing(face_box=(2, 10, 180, 220), frame_dimensions=(640, 480))

    assert res["status"] == "PARTIALLY_OUT_OF_FRAME"


def test_eye_contact_looking_toward_camera():
    analyzer = EyeContactAnalyzer()
    res = analyzer.analyze_eye_contact(
        gray_img=np.zeros((480, 640), dtype=np.uint8),
        face_box=(200, 120, 180, 220),
        normalized_x=0.5,
        normalized_y=0.45,
    )

    assert res["status"] == "LOOKING_TOWARD_CAMERA"
    assert res["camera_engaged"] is True
    assert res["ratio"] >= 0.70


def test_eye_contact_looking_away():
    analyzer = EyeContactAnalyzer()
    res = analyzer.analyze_eye_contact(
        gray_img=np.zeros((480, 640), dtype=np.uint8),
        face_box=(50, 120, 180, 220),
        normalized_x=0.20,
        normalized_y=0.45,
    )

    assert res["status"] == "LOOKING_AWAY"
    assert res["camera_engaged"] is False
    assert res["ratio"] <= 0.30


# ==============================================================================
# SECTION 20 — HEAD MOVEMENT SPECIFIC BUG FIX TEST CASES
# ==============================================================================

def test_static_head_movement():
    """TEST 1 — STATIC HEAD (yaw: 0, 1, 2, 1, 2) -> NORMAL."""
    service = VisualAnalysisService(window_size=10)
    t = 100.0
    for yaw in [0.0, 1.0, 2.0, 1.0, 2.0]:
        service._record_frame_history(timestamp=t, detected=True, yaw=yaw, pitch=0.0, roll=0.0, x=0.5, y=0.5, engaged=True)
        t += 1.0

    metrics = service._calculate_movement_metrics()
    assert metrics["status"] in ["Normal Movement", "NORMAL"]
    assert metrics["level"] == "NORMAL"
    assert metrics["movement_events"] == 0


def test_small_natural_head_movement():
    """TEST 2 — SMALL NATURAL MOVEMENT (yaw: 0, 4, 7, 5, 8) -> NORMAL or SLIGHT."""
    service = VisualAnalysisService(window_size=10)
    t = 100.0
    for yaw in [0.0, 4.0, 7.0, 5.0, 8.0]:
        service._record_frame_history(timestamp=t, detected=True, yaw=yaw, pitch=1.0, roll=0.0, x=0.5, y=0.5, engaged=True)
        t += 1.0

    metrics = service._calculate_movement_metrics()
    assert metrics["level"] in ["NORMAL", "SLIGHT"]


def test_head_turn_movement():
    """TEST 3 — HEAD TURN (yaw: 0, 5, 12, 24, 30) -> MODERATE, LARGE, or EXCESSIVE."""
    service = VisualAnalysisService(window_size=10)
    t = 100.0
    for yaw in [0.0, 5.0, 12.0, 24.0, 30.0]:
        service._record_frame_history(timestamp=t, detected=True, yaw=yaw, pitch=0.0, roll=0.0, x=0.5, y=0.5, engaged=True)
        t += 1.0

    metrics = service._calculate_movement_metrics()
    assert metrics["status"] in ["Large Movement", "Significant Movement", "MODERATE", "EXCESSIVE"]
    assert metrics["max_yaw_change"] >= 12.0 or metrics["max_yaw_deviation"] >= 12.0


def test_head_shake_movement():
    """
    TEST 4 — HEAD SHAKE (yaw: -5, +20, -22, +25, -18) -> EXCESSIVE / Large Movement.
    CRITICAL SUCCESS CRITERION: Must NOT report NORMAL when head is shaking!
    """
    service = VisualAnalysisService(window_size=10)
    t = 100.0
    for yaw in [-5.0, 20.0, -22.0, 25.0, -18.0]:
        service._record_frame_history(timestamp=t, detected=True, yaw=yaw, pitch=0.0, roll=0.0, x=0.5, y=0.5, engaged=True)
        t += 1.0

    metrics = service._calculate_movement_metrics()
    assert metrics["status"] in ["Large Movement", "Significant Movement", "EXCESSIVE"]
    assert metrics["status"] not in ["Normal Movement", "NORMAL"]


def test_nodding_movement():
    """TEST 5 — NOD (pitch: 0, -8, -14, -7, 0) -> SLIGHT or MODERATE."""
    service = VisualAnalysisService(window_size=10)
    t = 100.0
    for pitch in [0.0, -8.0, -14.0, -7.0, 0.0]:
        service._record_frame_history(timestamp=t, detected=True, yaw=0.0, pitch=pitch, roll=0.0, x=0.5, y=0.5, engaged=True)
        t += 1.0

    metrics = service._calculate_movement_metrics()
    assert metrics["status"] not in ["Large Movement", "EXCESSIVE"]


def test_no_face_movement_handling():
    """TEST 6 — NO FACE -> head movement should be Unavailable."""
    service = VisualAnalysisService(window_size=10)
    service._record_frame_history(timestamp=100.0, detected=False, yaw=0.0, pitch=0.0, roll=0.0, x=0.0, y=0.0, engaged=False)

    metrics = service._calculate_movement_metrics()
    assert metrics["status"] == "Unavailable"
    assert metrics["level"] == "INSUFFICIENT_DATA"


def test_insufficient_data():
    """TEST 7 — INSUFFICIENT DATA (Single frame) -> valid single frame returns Normal Movement."""
    service = VisualAnalysisService(window_size=10)
    service._record_frame_history(timestamp=100.0, detected=True, yaw=5.0, pitch=2.0, roll=0.0, x=0.5, y=0.5, engaged=True)

    metrics = service._calculate_movement_metrics()
    assert metrics["status"] in ["Normal Movement", "NORMAL"]


def test_variable_frame_interval():
    """TEST 8 — VARIABLE FRAME INTERVAL -> movement calculation still works with irregular timestamps."""
    service = VisualAnalysisService(window_size=10)
    time_offsets = [0.0, 0.4, 1.2, 1.9, 3.5]
    yaws = [0.0, 18.0, -15.0, 20.0, 0.0]

    for t, yaw in zip(time_offsets, yaws):
        service._record_frame_history(timestamp=100.0 + t, detected=True, yaw=yaw, pitch=0.0, roll=0.0, x=0.5, y=0.5, engaged=True)

    metrics = service._calculate_movement_metrics()
    assert metrics["status"] in ["Large Movement", "Significant Movement", "MODERATE", "EXCESSIVE"]


def test_return_to_center_movement():
    """
    TEST 9 — RETURN TO CENTER (yaw: 0, 25, 0) -> significant movement detected.
    Do NOT classify as NORMAL just because final orientation is CENTER!
    """
    service = VisualAnalysisService(window_size=10)
    t = 100.0
    for yaw in [0.0, 25.0, 0.0]:
        service._record_frame_history(timestamp=t, detected=True, yaw=yaw, pitch=0.0, roll=0.0, x=0.5, y=0.5, engaged=True)
        t += 1.0

    metrics = service._calculate_movement_metrics()
    assert metrics["status"] in ["Large Movement", "Significant Movement", "MODERATE", "EXCESSIVE"]


def test_long_answer_duration_normalization():
    """
    TEST 10 — LONG ANSWER -> events_per_minute prevents long answers with a few natural movements from being penalized.
    """
    service = VisualAnalysisService(window_size=30)
    for i in range(30):
        t = float(i * 4)
        yaw = 20.0 if i in [5, 20] else 2.0
        service._record_frame_history(timestamp=t, detected=True, yaw=yaw, pitch=0.0, roll=0.0, x=0.5, y=0.5, engaged=True)

    metrics = service._calculate_movement_metrics()
    assert metrics["status"] != "Large Movement"
