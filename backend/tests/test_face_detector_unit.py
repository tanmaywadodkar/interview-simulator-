import pytest
import numpy as np
import cv2
import base64
from app.services.vision.face_analyzer import face_analyzer


def test_face_analyzer_empty_frame():
    # 1. Test empty/blank black image (no face)
    black_img = np.zeros((240, 320, 3), dtype=np.uint8)
    _, buffer = cv2.imencode('.jpg', black_img)
    
    res = face_analyzer.analyze_frame_bytes(buffer.tobytes())
    assert res["face_detected"] is False
    assert res["face_count"] == 0
    assert res["head_pose"] == "Not Detected"


def test_face_analyzer_synthetic_face():
    # 2. Test synthetic face drawing (head circle, eyes, nose, mouth)
    img = np.ones((400, 400, 3), dtype=np.uint8) * 200
    
    # Draw head structure matching OpenCV Haar cascade features
    cv2.circle(img, (200, 200), 100, (120, 120, 120), -1) # Head
    cv2.circle(img, (160, 170), 15, (0, 0, 0), -1)       # Left eye
    cv2.circle(img, (240, 170), 15, (0, 0, 0), -1)       # Right eye
    cv2.line(img, (200, 190), (200, 220), (0, 0, 0), 5)  # Nose
    cv2.ellipse(img, (200, 240), (40, 15), 0, 0, 180, (0, 0, 0), 5) # Mouth

    _, buffer = cv2.imencode('.jpg', img)
    res = face_analyzer.analyze_frame_bytes(buffer.tobytes())
    
    # Ensure analyzer executes without crashing and returns valid structure
    assert "face_detected" in res
    assert "face_count" in res
    assert "head_pose" in res
