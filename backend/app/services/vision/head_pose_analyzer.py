import math
from typing import Dict, Any, Optional, Tuple, List
import numpy as np

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    cv2 = None
    HAS_CV2 = False


# Canonical 3D Face Model Points (in millimeters, centered at nose tip)
MODEL_POINTS_3D = np.array([
    (0.0, 0.0, 0.0),          # 1. Nose tip
    (0.0, -330.0, -65.0),     # 2. Chin tip
    (-225.0, 170.0, -135.0),  # 3. Left eye outer corner
    (225.0, 170.0, -135.0),   # 4. Right eye outer corner
    (-150.0, -150.0, -125.0), # 5. Left mouth corner
    (150.0, -150.0, -125.0)   # 6. Right mouth corner
], dtype=np.float64)


class HeadPoseAnalyzer:
    """
    3D Facial Landmark-Based Head Pose Estimator.
    Uses facial feature geometry and solvePnP camera pose estimation to compute
    accurate 3D Euler angles (Yaw, Pitch, Roll) relative to a calibrated neutral baseline.
    """

    def __init__(self):
        self.neutral_yaw: float = 0.0
        self.neutral_pitch: float = 0.0
        self.neutral_roll: float = 0.0
        self.is_calibrated: bool = False

    def set_calibration(self, neutral_yaw: float, neutral_pitch: float, neutral_roll: float):
        """Sets the baseline neutral pose angles for the candidate."""
        self.neutral_yaw = round(float(neutral_yaw), 2)
        self.neutral_pitch = round(float(neutral_pitch), 2)
        self.neutral_roll = round(float(neutral_roll), 2)
        self.is_calibrated = True

    def calibrate_from_frames(self, pose_frames: List[Dict[str, float]]) -> Dict[str, Any]:
        """
        Calibrates neutral baseline from 15-30 valid landmark pose frames.
        Uses median values to eliminate outliers.
        """
        if not pose_frames:
            return {
                "calibrated": False,
                "neutral_yaw": 0.0,
                "neutral_pitch": 0.0,
                "neutral_roll": 0.0,
                "frame_count": 0,
                "message": "No valid pose frames provided for calibration.",
            }

        yaws = [f.get("yaw", 0.0) for f in pose_frames if "yaw" in f]
        pitches = [f.get("pitch", 0.0) for f in pose_frames if "pitch" in f]
        rolls = [f.get("roll", 0.0) for f in pose_frames if "roll" in f]

        if not yaws:
            return {
                "calibrated": False,
                "neutral_yaw": 0.0,
                "neutral_pitch": 0.0,
                "neutral_roll": 0.0,
                "frame_count": 0,
                "message": "Insufficient valid landmark frames for calibration.",
            }

        med_yaw = float(np.median(yaws))
        med_pitch = float(np.median(pitches))
        med_roll = float(np.median(rolls))

        self.set_calibration(med_yaw, med_pitch, med_roll)

        return {
            "calibrated": True,
            "neutral_yaw": self.neutral_yaw,
            "neutral_pitch": self.neutral_pitch,
            "neutral_roll": self.neutral_roll,
            "frame_count": len(yaws),
            "message": "Head pose baseline calibrated successfully.",
        }

    def estimate_pose_from_landmarks(
        self,
        image_points_2d: np.ndarray,
        frame_width: int = 640,
        frame_height: int = 480
    ) -> Tuple[float, float, float]:
        """
        Estimates (yaw, pitch, roll) in degrees from 6 2D facial landmark image points using solvePnP.
        image_points_2d order: [nose_tip, chin, left_eye, right_eye, left_mouth, right_mouth]
        """
        if not HAS_CV2 or cv2 is None or image_points_2d is None or len(image_points_2d) < 6:
            return 0.0, 0.0, 0.0

        focal_length = float(frame_width)
        center = (frame_width / 2.0, frame_height / 2.0)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)

        dist_coeffs = np.zeros((4, 1), dtype=np.float64)

        try:
            success, rvec, tvec = cv2.solvePnP(
                MODEL_POINTS_3D,
                image_points_2d.astype(np.float64),
                camera_matrix,
                dist_coeffs,
                flags=cv2.SOLVEPNP_ITERATIVE
            )

            if not success:
                return 0.0, 0.0, 0.0

            rmat, _ = cv2.Rodrigues(rvec)

            # Compute Euler angles from 3x3 rotation matrix
            sy = math.sqrt(rmat[0, 0] * rmat[0, 0] + rmat[1, 0] * rmat[1, 0])
            singular = sy < 1e-6

            if not singular:
                pitch_rad = math.atan2(rmat[2, 1], rmat[2, 2])
                yaw_rad = math.atan2(-rmat[2, 0], sy)
                roll_rad = math.atan2(rmat[1, 0], rmat[0, 0])
            else:
                pitch_rad = math.atan2(-rmat[1, 2], rmat[1, 1])
                yaw_rad = math.atan2(-rmat[2, 0], sy)
                roll_rad = 0.0

            pitch = math.degrees(pitch_rad)
            yaw = math.degrees(yaw_rad)
            roll = math.degrees(roll_rad)

            # Normalize angles to standard camera coordinate space
            # Yaw: + = turn right, - = turn left
            # Pitch: + = look up, - = look down
            # Roll: + = tilt right, - = tilt left
            if pitch > 90:
                pitch = 180.0 - pitch
            elif pitch < -90:
                pitch = -180.0 - pitch

            if roll > 90:
                roll = 180.0 - roll
            elif roll < -90:
                roll = -180.0 - roll

            return round(yaw, 1), round(pitch, 1), round(roll, 1)

        except Exception:
            return 0.0, 0.0, 0.0

    def extract_landmarks_from_face(
        self,
        gray_img: np.ndarray,
        face_box: Tuple[int, int, int, int]
    ) -> Optional[np.ndarray]:
        """
        Extracts 6 key facial landmarks (nose, chin, left eye, right eye, left mouth, right mouth)
        from face bounding box using facial geometry and ROI feature detection.
        """
        if gray_img is None or face_box is None:
            return None

        x, y, w, h = face_box
        if w < 30 or h < 30:
            return None

        # 1. Left eye region (upper-left quadrant of face ROI)
        left_eye_x = int(x + w * 0.30)
        left_eye_y = int(y + h * 0.35)

        # 2. Right eye region (upper-right quadrant of face ROI)
        right_eye_x = int(x + w * 0.70)
        right_eye_y = int(y + h * 0.35)

        # Refine eye positions using OpenCV eye cascade if available
        if HAS_CV2 and cv2 is not None:
            try:
                eye_cascade_path = cv2.data.haarcascades + 'haarcascade_eye.xml'
                eye_cascade = cv2.CascadeClassifier(eye_cascade_path)
                if eye_cascade and not eye_cascade.empty():
                    # Left eye ROI
                    l_roi = gray_img[max(0, int(y + h*0.2)):min(gray_img.shape[0], int(y + h*0.5)),
                                     max(0, int(x + w*0.1)):min(gray_img.shape[1], int(x + w*0.5))]
                    eyes_l = eye_cascade.detectMultiScale(l_roi)
                    if len(eyes_l) > 0:
                        ex, ey, ew, eh = eyes_l[0]
                        left_eye_x = int(x + w*0.1 + ex + ew/2.0)
                        left_eye_y = int(y + h*0.2 + ey + eh/2.0)

                    # Right eye ROI
                    r_roi = gray_img[max(0, int(y + h*0.2)):min(gray_img.shape[0], int(y + h*0.5)),
                                     max(0, int(x + w*0.5)):min(gray_img.shape[1], int(x + w*0.9))]
                    eyes_r = eye_cascade.detectMultiScale(r_roi)
                    if len(eyes_r) > 0:
                        ex, ey, ew, eh = eyes_r[0]
                        right_eye_x = int(x + w*0.5 + ex + ew/2.0)
                        right_eye_y = int(y + h*0.2 + ey + eh/2.0)
            except Exception:
                pass

        # 3. Nose tip (midway between eyes, slightly lower)
        nose_x = int((left_eye_x + right_eye_x) / 2.0)
        nose_y = int(y + h * 0.55)

        # 4. Chin (bottom center of face box)
        chin_x = int(x + w * 0.50)
        chin_y = int(y + h * 0.92)

        # 5. Left mouth corner
        left_mouth_x = int(x + w * 0.32)
        left_mouth_y = int(y + h * 0.75)

        # 6. Right mouth corner
        right_mouth_x = int(x + w * 0.68)
        right_mouth_y = int(y + h * 0.75)

        return np.array([
            [nose_x, nose_y],
            [chin_x, chin_y],
            [left_eye_x, left_eye_y],
            [right_eye_x, right_eye_y],
            [left_mouth_x, left_mouth_y],
            [right_mouth_x, right_mouth_y]
        ], dtype=np.float64)

    def analyze_head_pose(
        self,
        normalized_x: float = 0.5,
        normalized_y: float = 0.5,
        face_detected: bool = True,
        gray_img: Optional[np.ndarray] = None,
        face_box: Optional[Tuple[int, int, int, int]] = None,
        frame_dimensions: Optional[Tuple[int, int]] = None,
    ) -> Dict[str, Any]:
        """
        Calculates 3D head pose (yaw, pitch, roll), deviations from neutral baseline, and orientation classification.
        Enforces: If face_detected is False, return classification="UNAVAILABLE", valid=False.
        """
        if not face_detected or gray_img is None or face_box is None:
            return {
                "yaw": 0.0,
                "pitch": 0.0,
                "roll": 0.0,
                "neutral_yaw": self.neutral_yaw,
                "neutral_pitch": self.neutral_pitch,
                "neutral_roll": self.neutral_roll,
                "yaw_deviation": 0.0,
                "pitch_deviation": 0.0,
                "roll_deviation": 0.0,
                "classification": "UNAVAILABLE",
                "valid": False,
            }

        w_frame = frame_dimensions[0] if frame_dimensions else 640
        h_frame = frame_dimensions[1] if frame_dimensions else 480

        landmarks = self.extract_landmarks_from_face(gray_img, face_box)
        if landmarks is not None:
            raw_yaw, raw_pitch, raw_roll = self.estimate_pose_from_landmarks(
                landmarks, frame_width=w_frame, frame_height=h_frame
            )
        else:
            # Fallback estimation from face box geometry ratio if landmark extraction fails
            raw_yaw = round((normalized_x - 0.5) * 50.0, 1)
            raw_pitch = round((0.45 - normalized_y) * 40.0, 1)
            raw_roll = 0.0

        # Calculate deviation relative to calibrated neutral baseline
        yaw_dev = round(raw_yaw - self.neutral_yaw, 1)
        pitch_dev = round(raw_pitch - self.neutral_pitch, 1)
        roll_dev = round(raw_roll - self.neutral_roll, 1)

        abs_yaw = abs(yaw_dev)
        abs_pitch = abs(pitch_dev)
        abs_roll = abs(roll_dev)
        max_dev = max(abs_yaw, abs_pitch, abs_roll)

        # Orientation classification based on baseline deviation position
        if max_dev < 10.0:
            classification = "CENTER"
        elif abs_yaw >= abs_pitch and abs_yaw >= abs_roll:
            classification = "RIGHT" if yaw_dev > 0 else "LEFT"
        elif abs_pitch >= abs_roll:
            classification = "UP" if pitch_dev > 0 else "DOWN"
        else:
            classification = "TILT"

        return {
            "yaw": raw_yaw,
            "pitch": raw_pitch,
            "roll": raw_roll,
            "neutral_yaw": self.neutral_yaw,
            "neutral_pitch": self.neutral_pitch,
            "neutral_roll": self.neutral_roll,
            "yaw_deviation": yaw_dev,
            "pitch_deviation": pitch_dev,
            "roll_deviation": roll_dev,
            "classification": classification,
            "valid": True,
        }


head_pose_analyzer = HeadPoseAnalyzer()
