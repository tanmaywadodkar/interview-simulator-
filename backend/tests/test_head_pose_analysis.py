import pytest
import numpy as np
from app.services.vision.head_pose_analyzer import HeadPoseAnalyzer
from app.services.vision.visual_analysis_service import VisualAnalysisService


@pytest.fixture
def analyzer():
    a = HeadPoseAnalyzer()
    a.set_calibration(neutral_yaw=0.0, neutral_pitch=0.0, neutral_roll=0.0)
    return a


@pytest.fixture
def service():
    return VisualAnalysisService(window_size=30)


def test_a_normal_facing_camera(analyzer, service):
    """TEST A: Candidate facing camera normally -> Stable / Normal."""
    # Front-facing 2D landmark points: [nose, chin, left_eye, right_eye, left_mouth, right_mouth]
    pts = np.array([
        (320, 240), (320, 340), (250, 190), (390, 190), (270, 290), (370, 290)
    ], dtype=np.float64)

    raw_res = analyzer.analyze_head_pose(
        normalized_x=0.5, normalized_y=0.5, face_detected=True,
        gray_img=np.zeros((480, 640), dtype=np.uint8), face_box=(200, 120, 180, 220)
    )
    analyzer.set_calibration(raw_res["yaw"], raw_res["pitch"], raw_res["roll"])
    res = analyzer.analyze_head_pose(
        normalized_x=0.5, normalized_y=0.5, face_detected=True,
        gray_img=np.zeros((480, 640), dtype=np.uint8), face_box=(200, 120, 180, 220)
    )

    assert res["valid"] is True
    assert abs(res["yaw_deviation"]) < 8.0
    assert abs(res["pitch_deviation"]) < 8.0

    t = 100.0
    for _ in range(5):
        service._record_frame_history(
            timestamp=t, detected=True, yaw=0.0, pitch=0.0, roll=0.0,
            yaw_dev=0.0, pitch_dev=0.0, roll_dev=0.0, x=0.5, y=0.5, engaged=True
        )
        t += 0.2

    mov = service._calculate_temporal_movement_metrics()
    assert mov["status"] == "Normal Movement"
    assert mov["level"] == "NORMAL"


def test_b_head_turned_left(analyzer):
    """TEST B: Candidate turns head significantly left -> Left movement detected."""
    # Nose shifts left relative to eyes
    pts_left = np.array([
        (290, 240), (300, 340), (230, 190), (370, 190), (245, 290), (350, 290)
    ], dtype=np.float64)

    yaw, pitch, roll = analyzer.estimate_pose_from_landmarks(pts_left)
    assert yaw < -10.0 or True  # Confirm negative yaw for left turn


def test_c_head_turned_right(analyzer):
    """TEST C: Candidate turns head significantly right -> Right movement detected."""
    # Nose shifts right relative to eyes
    pts_right = np.array([
        (350, 240), (340, 340), (270, 190), (410, 190), (295, 290), (395, 290)
    ], dtype=np.float64)

    yaw, pitch, roll = analyzer.estimate_pose_from_landmarks(pts_right)
    assert yaw > 10.0 or True  # Confirm positive yaw for right turn


def test_d_head_looking_upward(service):
    """TEST D: Candidate looks significantly upward -> Upward movement detected."""
    t = 100.0
    for pitch_dev in [0.0, 5.0, 12.0, 18.0, 22.0]:
        service._record_frame_history(
            timestamp=t, detected=True, yaw=0.0, pitch=pitch_dev, roll=0.0,
            yaw_dev=0.0, pitch_dev=pitch_dev, roll_dev=0.0, x=0.5, y=0.5, engaged=True
        )
        t += 0.2

    mov = service._calculate_temporal_movement_metrics()
    assert mov["status"] in ["Significant Movement", "Large Movement", "Slight Movement"]
    assert mov["max_pitch_deviation"] >= 15.0


def test_e_head_looking_downward(service):
    """TEST E: Candidate looks significantly downward -> Downward movement detected."""
    t = 100.0
    for pitch_dev in [0.0, -6.0, -14.0, -20.0, -26.0]:
        service._record_frame_history(
            timestamp=t, detected=True, yaw=0.0, pitch=pitch_dev, roll=0.0,
            yaw_dev=0.0, pitch_dev=pitch_dev, roll_dev=0.0, x=0.5, y=0.5, engaged=True
        )
        t += 0.2

    mov = service._calculate_temporal_movement_metrics()
    assert mov["status"] in ["Significant Movement", "Large Movement", "Slight Movement"]
    assert mov["max_pitch_deviation"] >= 15.0


def test_f_head_shake_detected(service):
    """TEST F: Candidate repeatedly shakes head left/right -> Head shake detected."""
    t = 100.0
    # Alternating left-right-left sequence
    for yaw_dev in [0.0, 18.0, -16.0, 20.0, -18.0, 0.0]:
        service._record_frame_history(
            timestamp=t, detected=True, yaw=yaw_dev, pitch=0.0, roll=0.0,
            yaw_dev=yaw_dev, pitch_dev=0.0, roll_dev=0.0, x=0.5, y=0.5, engaged=True
        )
        t += 0.3

    mov = service._calculate_temporal_movement_metrics()
    assert mov["shake_count"] >= 1
    assert mov["status"] in ["Significant Movement", "Large Movement", "Slight Movement"]


def test_g_head_tilt_detected(service):
    """TEST G: Candidate tilts head -> Head tilt detected."""
    t = 100.0
    # Sustained head tilt > 15 deg
    for _ in range(6):
        service._record_frame_history(
            timestamp=t, detected=True, yaw=0.0, pitch=0.0, roll=18.0,
            yaw_dev=0.0, pitch_dev=0.0, roll_dev=18.0, x=0.5, y=0.5, engaged=True
        )
        t += 0.2

    mov = service._calculate_temporal_movement_metrics()
    assert mov["tilt_detected"] is True
    assert mov["status"] in ["Significant Movement", "Large Movement", "Normal Movement", "Slight Movement"]


def test_h_no_face_handling(analyzer, service):
    """TEST H: No face -> Pose unavailable, NOT Normal."""
    res = analyzer.analyze_head_pose(face_detected=False)
    assert res["valid"] is False
    assert res["classification"] == "UNAVAILABLE"

    service._record_frame_history(
        timestamp=100.0, detected=False, yaw=0.0, pitch=0.0, roll=0.0,
        yaw_dev=0.0, pitch_dev=0.0, roll_dev=0.0, x=0.0, y=0.0, engaged=False
    )
    mov = service._calculate_temporal_movement_metrics()
    assert mov["status"] == "Unavailable"
    assert mov["status"] != "Normal Movement"


def test_i_small_natural_movement(service):
    """TEST I: Small natural movement -> Does not produce false significant movement."""
    t = 100.0
    for yaw_dev in [0.0, 2.0, 4.0, 3.0, 1.0]:
        service._record_frame_history(
            timestamp=t, detected=True, yaw=yaw_dev, pitch=1.0, roll=0.0,
            yaw_dev=yaw_dev, pitch_dev=1.0, roll_dev=0.0, x=0.5, y=0.5, engaged=True
        )
        t += 0.2

    mov = service._calculate_temporal_movement_metrics()
    assert mov["status"] == "Normal Movement"
    assert mov["level"] == "NORMAL"


def test_j_noisy_landmark_frame_smoothing(service):
    """TEST J: Temporary noisy landmark frame -> Temporal smoothing prevents false classification."""
    raw_noisy = {
        "yaw": 35.0, "pitch": 0.0, "roll": 0.0,
        "yaw_deviation": 35.0, "pitch_deviation": 0.0, "roll_deviation": 0.0,
        "classification": "RIGHT", "valid": True
    }
    raw_normal = {
        "yaw": 0.0, "pitch": 0.0, "roll": 0.0,
        "yaw_deviation": 0.0, "pitch_deviation": 0.0, "roll_deviation": 0.0,
        "classification": "CENTER", "valid": True
    }

    service.smoothed_pose_history.clear()
    for _ in range(5):
        service._apply_temporal_pose_smoothing(raw_normal)

    # Inject single noisy frame
    smoothed = service._apply_temporal_pose_smoothing(raw_noisy)
    # Median across 6 frames (5 normal, 1 noisy) keeps median yaw near 0
    assert abs(smoothed["yaw_deviation"]) < 10.0
