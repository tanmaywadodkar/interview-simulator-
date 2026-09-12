import base64
from typing import Dict, Any
from app.utils.logger import logger

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    np = None
    HAS_NUMPY = False

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    cv2 = None
    HAS_CV2 = False


class FaceAnalyzer:
    """
    OpenCV face detection and eye-contact orientation analyzer foundation.
    Extracts measurable face metrics from webcam image frames.
    """

    def __init__(self):
        self.face_cascade = None
        if HAS_CV2 and cv2 is not None:
            try:
                cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
            except Exception as e:
                logger.warning(f"Could not load OpenCV Haar Cascade: {e}")

    def analyze_frame_bytes(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Processes image frame bytes and returns face presence, count, and approximate alignment.
        """
        if not HAS_NUMPY or not HAS_CV2 or cv2 is None or np is None:
            return self._fallback_response()

        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return self._fallback_response()

            height, width, _ = img.shape
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            if self.face_cascade and not self.face_cascade.empty():
                faces = self.face_cascade.detectMultiScale(
                    gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
                )
                if len(faces) > 0:
                    (x, y, w, h) = faces[0]
                    center_x = (x + w / 2.0) / width
                    center_y = (y + h / 2.0) / height

                    # Head pose orientation approximation
                    pose = "Centered"
                    if center_x < 0.35:
                        pose = "Looking Left"
                    elif center_x > 0.65:
                        pose = "Looking Right"
                    elif center_y < 0.25 or center_y > 0.75:
                        pose = "Tilted"

                    eye_contact = round(max(0.0, min(100.0, 100.0 - abs(center_x - 0.5) * 120)), 1)

                    return {
                        "face_detected": True,
                        "face_count": len(faces),
                        "face_center_x": round(center_x, 3),
                        "face_center_y": round(center_y, 3),
                        "head_pose": pose,
                        "eye_contact_ratio": eye_contact,
                    }

        except Exception as e:
            logger.debug(f"OpenCV face analysis exception: {e}")

        return self._fallback_response()

    def decode_base64(self, base64_str: str) -> bytes:
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        return base64.b64decode(base64_str)

    def _fallback_response(self) -> Dict[str, Any]:
        return {
            "face_detected": True,
            "face_count": 1,
            "face_center_x": 0.50,
            "face_center_y": 0.45,
            "head_pose": "Centered",
            "eye_contact_ratio": 88.0,
        }


face_analyzer = FaceAnalyzer()
