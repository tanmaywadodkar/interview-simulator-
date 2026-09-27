from typing import Dict, Any, Optional, Tuple
from app.utils.logger import logger

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    cv2 = None
    HAS_CV2 = False


class EyeContactAnalyzer:
    """
    Estimates approximate camera engagement and eye contact.
    Categorizes status into LOOKING_TOWARD_CAMERA, LOOKING_AWAY, or UNCERTAIN.
    Does NOT claim exact gaze measurement or internal emotion detection.
    """

    def __init__(self):
        self.eye_cascade = None
        if HAS_CV2 and cv2 is not None:
            try:
                cascade_path = cv2.data.haarcascades + 'haarcascade_eye.xml'
                self.eye_cascade = cv2.CascadeClassifier(cascade_path)
            except Exception as e:
                logger.warning(f"Could not load OpenCV Eye Cascade: {e}")

    def analyze_eye_contact(
        self,
        gray_img: Optional[Any],
        face_box: Optional[Tuple[int, int, int, int]],
        normalized_x: float = 0.5,
        normalized_y: float = 0.5,
    ) -> Dict[str, Any]:
        """
        Processes face ROI to estimate approximate eye contact / camera engagement.
        """
        if gray_img is None or not face_box or not HAS_CV2 or cv2 is None:
            return {
                "status": "UNCERTAIN",
                "ratio": 0.0,
                "camera_engaged": False,
                "valid_frame": False,
                "details": "Insufficient image data or face not present",
            }

        x, y, w, h = face_box

        # Extract upper half of face box for eye region
        roi_h = int(h * 0.55)
        if roi_h <= 10 or w <= 10 or y + roi_h > gray_img.shape[0] or x + w > gray_img.shape[1]:
            return {
                "status": "UNCERTAIN",
                "ratio": 0.0,
                "camera_engaged": False,
                "valid_frame": False,
                "details": "Face ROI out of frame bounds",
            }

        roi_gray = gray_img[y : y + roi_h, x : x + w]

        eyes = []
        if self.eye_cascade and not self.eye_cascade.empty():
            try:
                eyes = self.eye_cascade.detectMultiScale(
                    roi_gray, scaleFactor=1.1, minNeighbors=4, minSize=(15, 15)
                )
            except Exception:
                eyes = []

        if len(eyes) > 0:
            # Calculate average horizontal center of detected eyes relative to face ROI
            avg_eye_x = sum(e[0] + e[2] / 2.0 for e in eyes) / float(len(eyes))
            relative_eye_x = avg_eye_x / float(w)

            # Check if gaze/eyes are centered within upper face box
            if 0.30 <= relative_eye_x <= 0.70 and 0.35 <= normalized_x <= 0.65:
                return {
                    "status": "LOOKING_TOWARD_CAMERA",
                    "ratio": 0.85,
                    "camera_engaged": True,
                    "valid_frame": True,
                    "details": f"{len(eyes)} eye(s) detected and centered",
                }
            else:
                return {
                    "status": "LOOKING_AWAY",
                    "ratio": 0.25,
                    "camera_engaged": False,
                    "valid_frame": True,
                    "details": f"Eyes detected off-center (relative_x={round(relative_eye_x, 2)})",
                }

        # Fallback estimation when eye landmarks are obscured or uncertain
        if 0.42 <= normalized_x <= 0.58 and 0.30 <= normalized_y <= 0.65:
            # Frontal face orientation suggests likely camera engagement
            return {
                "status": "LOOKING_TOWARD_CAMERA",
                "ratio": 0.75,
                "camera_engaged": True,
                "valid_frame": True,
                "details": "Face centered and frontal (landmarks inferred)",
            }
        elif normalized_x < 0.30 or normalized_x > 0.70 or normalized_y < 0.20 or normalized_y > 0.80:
            # Turned away or looking far off-camera
            return {
                "status": "LOOKING_AWAY",
                "ratio": 0.20,
                "camera_engaged": False,
                "valid_frame": True,
                "details": "Head turned away from camera",
            }
        else:
            # Uncertain / insufficient signal quality
            return {
                "status": "UNCERTAIN",
                "ratio": 0.50,
                "camera_engaged": False,
                "valid_frame": False,
                "details": "Uncertain landmark detection",
            }


eye_contact_analyzer = EyeContactAnalyzer()
