import math
import time
from typing import Dict, Any, Optional, List
from collections import deque
import numpy as np
from app.utils.logger import logger
from app.services.vision.face_analyzer import face_analyzer
from app.services.vision.framing_analyzer import framing_analyzer
from app.services.vision.eye_contact_analyzer import eye_contact_analyzer
from app.services.vision.head_pose_analyzer import head_pose_analyzer, HeadPoseAnalyzer

DEFAULT_VISUAL_WEIGHTS = {
    "face_presence": 0.20,
    "eye_contact": 0.35,
    "head_pose": 0.20,
    "camera_framing": 0.15,
    "head_movement": 0.10,
}

# Delta thresholds for Sample-to-Sample Movement (Degrees per sample)
DELTA_STABLE_THRESHOLD = 2.5
DELTA_SMALL_THRESHOLD = 5.0
DELTA_MODERATE_THRESHOLD = 10.0

EVENT_TRIGGER_DELTA = 3.5
EVENT_COOLDOWN_SEC = 1.5

SHAKE_MIN_AMPLITUDE_DEG = 8.0
TILT_SUSTAINED_THRESHOLD_DEG = 15.0
TILT_MIN_FRAMES = 4

SMOOTHING_WINDOW_SIZE = 7


class VisualAnalysisService:
    """
    Central Visual Presentation & Eye Contact Analysis Service.
    Enforces strict separation between Head Orientation (Position) and Actual Head Movement (Sample Delta).
    Uses discrete movement event state machines with temporal hysteresis and cooldowns.
    """

    def __init__(self, weights: Optional[Dict[str, float]] = None, window_size: int = 100):
        self.weights = weights or DEFAULT_VISUAL_WEIGHTS
        self.window_size = window_size
        self.history = deque(maxlen=window_size)
        self.smoothed_pose_history = deque(maxlen=SMOOTHING_WINDOW_SIZE)
        self.smoothed_delta_history = deque(maxlen=SMOOTHING_WINDOW_SIZE)

        # Discrete Movement Event State Machine
        self.movement_event_active: bool = False
        self.movement_event_count: int = 0
        self.last_event_start_time: float = 0.0
        self.high_delta_consecutive_count: int = 0
        self.low_delta_consecutive_count: int = 0

    def analyze_frame_base64(self, base64_frame: Optional[str], timestamp: Optional[float] = None) -> Dict[str, Any]:
        if not base64_frame:
            return self._build_unavailable_response(reason="No image data provided")

        curr_time = timestamp if timestamp is not None else time.time()

        try:
            image_bytes = face_analyzer.decode_base64(base64_frame)
            face_res = face_analyzer.analyze_frame_bytes(image_bytes)

            if not face_res.get("analysis_available", False):
                return self._build_unavailable_response(reason="Visual analysis temporarily unavailable")

            if face_res.get("multiple_faces_detected", False):
                return {
                    "analysis_available": True,
                    "score_available": False,
                    "face_detected": True,
                    "face_count": face_res.get("face_count", 2),
                    "multiple_faces_detected": True,
                    "framing": {"status": "MULTIPLE_FACES", "position": "UNCERTAIN"},
                    "eye_contact": {"status": "UNCERTAIN", "ratio": 0.0},
                    "head_pose": {
                        "yaw": 0.0, "pitch": 0.0, "roll": 0.0,
                        "neutral_yaw": 0.0, "neutral_pitch": 0.0, "neutral_roll": 0.0,
                        "yaw_deviation": 0.0, "pitch_deviation": 0.0, "roll_deviation": 0.0,
                        "classification": "UNAVAILABLE"
                    },
                    "head_movement": {
                        "status": "Insufficient data",
                        "level": "INSUFFICIENT_DATA",
                        "movement_state": "UNAVAILABLE",
                        "movement_score": 0,
                        "movement_event_active": False,
                        "movement_event_count": self.movement_event_count,
                        "delta_yaw": 0.0, "delta_pitch": 0.0, "delta_roll": 0.0, "delta_magnitude": 0.0,
                        "shake_count": 0, "tilt_detected": False, "movement_events": self.movement_event_count,
                    },
                    "visual_score": None,
                    "score_interpretation": "Multiple faces detected",
                    "feedback": ["Only one person should be visible during the interview."],
                }

            if not face_res.get("face_detected", False):
                self._record_frame_history(
                    timestamp=curr_time,
                    detected=False,
                    yaw=0.0, pitch=0.0, roll=0.0,
                    yaw_dev=0.0, pitch_dev=0.0, roll_dev=0.0,
                    delta_yaw=0.0, delta_pitch=0.0, delta_roll=0.0, delta_mag=0.0,
                    movement_state="UNAVAILABLE",
                    x=0.0, y=0.0, engaged=False,
                )
                return {
                    "analysis_available": True,
                    "score_available": False,
                    "face_detected": False,
                    "face_count": 0,
                    "multiple_faces_detected": False,
                    "framing": {"status": "NOT_DETECTED", "position": "CENTER"},
                    "eye_contact": {"status": "UNCERTAIN", "ratio": 0.0},
                    "head_pose": {
                        "yaw": 0.0, "pitch": 0.0, "roll": 0.0,
                        "neutral_yaw": 0.0, "neutral_pitch": 0.0, "neutral_roll": 0.0,
                        "yaw_deviation": 0.0, "pitch_deviation": 0.0, "roll_deviation": 0.0,
                        "classification": "UNAVAILABLE"
                    },
                    "head_movement": {
                        "status": "Insufficient data",
                        "level": "INSUFFICIENT_DATA",
                        "movement_state": "UNAVAILABLE",
                        "movement_score": 0,
                        "movement_event_active": False,
                        "movement_event_count": self.movement_event_count,
                        "delta_yaw": 0.0, "delta_pitch": 0.0, "delta_roll": 0.0, "delta_magnitude": 0.0,
                        "shake_count": 0, "tilt_detected": False, "movement_events": self.movement_event_count,
                    },
                    "visual_score": None,
                    "score_interpretation": "Face not detected in frame",
                    "feedback": ["Position yourself clearly in front of the camera."],
                }

            framing_res = framing_analyzer.analyze_framing(
                face_res.get("face_box"), face_res.get("frame_dimensions")
            )

            eye_res = eye_contact_analyzer.analyze_eye_contact(
                face_res.get("gray_image"),
                face_res.get("face_box"),
                framing_res["normalized_x"],
                framing_res["normalized_y"],
            )

            raw_pose = head_pose_analyzer.analyze_head_pose(
                normalized_x=framing_res["normalized_x"],
                normalized_y=framing_res["normalized_y"],
                face_detected=True,
                gray_img=face_res.get("gray_image"),
                face_box=face_res.get("face_box"),
                frame_dimensions=face_res.get("frame_dimensions"),
            )

            smoothed_pose = self._apply_temporal_pose_smoothing(raw_pose)

            # Calculate Sample-to-Sample Delta (Velocity between consecutive valid frames)
            deltas = self._calculate_sample_delta(smoothed_pose)
            smoothed_deltas = self._apply_delta_smoothing(deltas)

            # Update discrete movement event state machine
            mov_state_info = self._update_movement_event_state(curr_time, smoothed_deltas)

            # Record frame in session history
            self._record_frame_history(
                timestamp=curr_time,
                detected=True,
                yaw=smoothed_pose["yaw"],
                pitch=smoothed_pose["pitch"],
                roll=smoothed_pose["roll"],
                yaw_dev=smoothed_pose["yaw_deviation"],
                pitch_dev=smoothed_pose["pitch_deviation"],
                roll_dev=smoothed_pose["roll_deviation"],
                delta_yaw=smoothed_deltas["delta_yaw"],
                delta_pitch=smoothed_deltas["delta_pitch"],
                delta_roll=smoothed_deltas["delta_roll"],
                delta_mag=smoothed_deltas["delta_magnitude"],
                movement_state=mov_state_info["movement_state"],
                x=framing_res["normalized_x"],
                y=framing_res["normalized_y"],
                engaged=eye_res["camera_engaged"],
            )

            movement_info = self._calculate_temporal_movement_metrics(smoothed_deltas, mov_state_info)
            smoothed_eye_ratio = self._calculate_smoothed_eye_ratio(eye_res["ratio"])

            presence_score = 100.0
            eye_score = smoothed_eye_ratio * 100.0

            if smoothed_pose["classification"] == "CENTER":
                pose_score = 95.0
            elif smoothed_pose["classification"] in ["LEFT", "RIGHT", "UP", "DOWN"]:
                pose_score = 85.0
            else:
                pose_score = 75.0

            if framing_res["status"] == "GOOD":
                framing_score = 95.0
            elif framing_res["status"] in ["TOO_CLOSE", "TOO_FAR"]:
                framing_score = 75.0
            else:
                framing_score = 60.0

            movement_score = float(movement_info.get("movement_score", 95))

            visual_score = round(
                presence_score * self.weights["face_presence"]
                + eye_score * self.weights["eye_contact"]
                + pose_score * self.weights["head_pose"]
                + framing_score * self.weights["camera_framing"]
                + movement_score * self.weights["head_movement"]
            )
            visual_score = max(0, min(100, visual_score))

            if visual_score >= 90:
                interpretation = "Excellent visual presentation"
            elif visual_score >= 75:
                interpretation = "Good visual presentation"
            elif visual_score >= 60:
                interpretation = "Needs some improvement"
            else:
                interpretation = "Needs significant improvement"

            feedback = self._generate_visual_feedback(
                smoothed_eye_ratio, framing_res, smoothed_pose, movement_info
            )

            return {
                "analysis_available": True,
                "score_available": True,
                "face_detected": True,
                "face_count": 1,
                "multiple_faces_detected": False,
                "visual_score": visual_score,
                "score_interpretation": interpretation,
                "framing": framing_res,
                "eye_contact": {
                    "status": eye_res["status"],
                    "ratio": round(smoothed_eye_ratio, 2),
                },
                "head_pose": smoothed_pose,
                "head_movement": movement_info,
                "score_breakdown": {
                    "face_presence": round(presence_score),
                    "eye_contact": round(eye_score),
                    "head_pose": round(pose_score),
                    "camera_framing": round(framing_score),
                    "head_movement": round(movement_score),
                },
                "feedback": feedback,
            }

        except Exception as e:
            logger.debug(f"Visual analysis exception: {e}")
            return self._build_unavailable_response(reason="Error processing visual frame")

    def _apply_temporal_pose_smoothing(self, raw_pose: Dict[str, Any]) -> Dict[str, Any]:
        self.smoothed_pose_history.append(raw_pose)

        if len(self.smoothed_pose_history) < 3:
            return raw_pose

        yaws = [p["yaw"] for p in self.smoothed_pose_history]
        pitches = [p["pitch"] for p in self.smoothed_pose_history]
        rolls = [p["roll"] for p in self.smoothed_pose_history]
        yaw_devs = [p["yaw_deviation"] for p in self.smoothed_pose_history]
        pitch_devs = [p["pitch_deviation"] for p in self.smoothed_pose_history]
        roll_devs = [p["roll_deviation"] for p in self.smoothed_pose_history]

        med_yaw = round(float(np.median(yaws)), 1)
        med_pitch = round(float(np.median(pitches)), 1)
        med_roll = round(float(np.median(rolls)), 1)

        med_yaw_dev = round(float(np.median(yaw_devs)), 1)
        med_pitch_dev = round(float(np.median(pitch_devs)), 1)
        med_roll_dev = round(float(np.median(roll_devs)), 1)

        abs_y = abs(med_yaw_dev)
        abs_p = abs(med_pitch_dev)
        abs_r = abs(med_roll_dev)
        max_dev = max(abs_y, abs_p, abs_r)

        if max_dev < 10.0:
            classification = "CENTER"
        elif abs_y >= abs_p and abs_y >= abs_r:
            classification = "RIGHT" if med_yaw_dev > 0 else "LEFT"
        elif abs_p >= abs_r:
            classification = "UP" if med_pitch_dev > 0 else "DOWN"
        else:
            classification = "TILT"

        return {
            "yaw": med_yaw,
            "pitch": med_pitch,
            "roll": med_roll,
            "neutral_yaw": raw_pose.get("neutral_yaw", 0.0),
            "neutral_pitch": raw_pose.get("neutral_pitch", 0.0),
            "neutral_roll": raw_pose.get("neutral_roll", 0.0),
            "yaw_deviation": med_yaw_dev,
            "pitch_deviation": med_pitch_dev,
            "roll_deviation": med_roll_dev,
            "classification": classification,
            "valid": True,
        }

    def _calculate_sample_delta(self, current_pose: Dict[str, Any]) -> Dict[str, float]:
        """Calculates sample-to-sample angular changes between consecutive valid frames."""
        valid_history = [f for f in self.history if f["detected"]]
        if not valid_history:
            return {"delta_yaw": 0.0, "delta_pitch": 0.0, "delta_roll": 0.0, "delta_magnitude": 0.0}

        prev = valid_history[-1]
        dy = abs(current_pose["yaw"] - prev["yaw"])
        dp = abs(current_pose["pitch"] - prev["pitch"])
        dr = abs(current_pose["roll"] - prev["roll"])
        dmag = math.sqrt(dy * dy + dp * dp + dr * dr)

        return {
            "delta_yaw": round(dy, 1),
            "delta_pitch": round(dp, 1),
            "delta_roll": round(dr, 1),
            "delta_magnitude": round(dmag, 1),
        }

    def _apply_delta_smoothing(self, deltas: Dict[str, float]) -> Dict[str, float]:
        """Smooths delta velocity using rolling median filter."""
        self.smoothed_delta_history.append(deltas)
        if len(self.smoothed_delta_history) < 3:
            return deltas

        d_yaws = [d["delta_yaw"] for d in self.smoothed_delta_history]
        d_pitches = [d["delta_pitch"] for d in self.smoothed_delta_history]
        d_rolls = [d["delta_roll"] for d in self.smoothed_delta_history]
        d_mags = [d["delta_magnitude"] for d in self.smoothed_delta_history]

        return {
            "delta_yaw": round(float(np.median(d_yaws)), 1),
            "delta_pitch": round(float(np.median(d_pitches)), 1),
            "delta_roll": round(float(np.median(d_rolls)), 1),
            "delta_magnitude": round(float(np.median(d_mags)), 1),
        }

    def _update_movement_event_state(self, curr_time: float, deltas: Dict[str, float]) -> Dict[str, Any]:
        """
        Updates Discrete Movement Event State Machine with hysteresis and cooldown.
        STRICT RULE: Absolute orientation (turned head) does NOT trigger movement! Only sample delta triggers movement!
        """
        dmag = deltas["delta_magnitude"]

        # Hysteresis counter for starting event
        if dmag >= EVENT_TRIGGER_DELTA:
            self.high_delta_consecutive_count += 1
            self.low_delta_consecutive_count = 0
        else:
            self.low_delta_consecutive_count += 1
            self.high_delta_consecutive_count = 0

        # Movement Event Start Trigger: delta >= 3.5 deg for >= 2 consecutive frames and cooldown expired (1.5s)
        time_since_last_event = curr_time - self.last_event_start_time
        if (
            not self.movement_event_active
            and self.high_delta_consecutive_count >= 2
            and time_since_last_event >= EVENT_COOLDOWN_SEC
        ):
            self.movement_event_active = True
            self.movement_event_count += 1
            self.last_event_start_time = curr_time

        # Movement Event End Trigger: delta < 2.5 deg for >= 2 consecutive frames
        if self.movement_event_active and self.low_delta_consecutive_count >= 2:
            self.movement_event_active = False

        # Classify current Movement State based on sample delta magnitude
        if dmag < DELTA_STABLE_THRESHOLD:
            mov_state = "STABLE"
        elif dmag < DELTA_SMALL_THRESHOLD:
            mov_state = "SMALL_MOVEMENT"
        elif dmag < DELTA_MODERATE_THRESHOLD:
            mov_state = "MODERATE_MOVEMENT"
        else:
            mov_state = "SIGNIFICANT_MOVEMENT"

        return {
            "movement_state": mov_state,
            "movement_event_active": self.movement_event_active,
            "movement_event_count": self.movement_event_count,
        }

    def _record_frame_history(
        self,
        timestamp: float,
        detected: bool,
        yaw: float = 0.0,
        pitch: float = 0.0,
        roll: float = 0.0,
        yaw_dev: float = 0.0,
        pitch_dev: float = 0.0,
        roll_dev: float = 0.0,
        delta_yaw: float = 0.0,
        delta_pitch: float = 0.0,
        delta_roll: float = 0.0,
        delta_mag: float = 0.0,
        movement_state: str = "STABLE",
        x: float = 0.5,
        y: float = 0.5,
        engaged: bool = True,
    ):
        if detected:
            if yaw_dev == 0.0 and yaw != 0.0:
                yaw_dev = abs(yaw - head_pose_analyzer.neutral_yaw)
            if pitch_dev == 0.0 and pitch != 0.0:
                pitch_dev = abs(pitch - head_pose_analyzer.neutral_pitch)
            if roll_dev == 0.0 and roll != 0.0:
                roll_dev = abs(roll - head_pose_analyzer.neutral_roll)

            if delta_mag == 0.0:
                valid_history = [f for f in self.history if f["detected"]]
                if valid_history:
                    prev = valid_history[-1]
                    dy = abs(yaw - prev["yaw"])
                    dp = abs(pitch - prev["pitch"])
                    dr = abs(roll - prev["roll"])
                    dmag = math.sqrt(dy * dy + dp * dp + dr * dr)
                    if dmag > 0.0:
                        delta_yaw = round(dy, 1)
                        delta_pitch = round(dp, 1)
                        delta_roll = round(dr, 1)
                        delta_mag = round(dmag, 1)
                        mov_state_info = self._update_movement_event_state(
                            timestamp,
                            {"delta_yaw": delta_yaw, "delta_pitch": delta_pitch, "delta_roll": delta_roll, "delta_magnitude": delta_mag}
                        )
                        movement_state = mov_state_info["movement_state"]

        self.history.append({
            "timestamp": timestamp,
            "detected": detected,
            "yaw": yaw,
            "pitch": pitch,
            "roll": roll,
            "yaw_dev": yaw_dev,
            "pitch_dev": pitch_dev,
            "roll_dev": roll_dev,
            "delta_yaw": delta_yaw,
            "delta_pitch": delta_pitch,
            "delta_roll": delta_roll,
            "delta_mag": delta_mag,
            "movement_state": movement_state,
            "x": x,
            "y": y,
            "engaged": engaged,
        })

    def _calculate_smoothed_eye_ratio(self, current_ratio: float) -> float:
        if not self.history:
            return current_ratio
        valid_frames = [f for f in self.history if f["detected"]]
        if not valid_frames:
            return current_ratio
        engaged_count = sum(1 for f in valid_frames if f["engaged"])
        return round(engaged_count / float(len(valid_frames)), 2)

    def _calculate_temporal_movement_metrics(
        self,
        deltas: Optional[Dict[str, float]] = None,
        mov_state_info: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        valid_frames = [f for f in self.history if f["detected"]]

        if deltas is None:
            if valid_frames:
                latest = valid_frames[-1]
                deltas = {
                    "delta_yaw": latest.get("delta_yaw", 0.0),
                    "delta_pitch": latest.get("delta_pitch", 0.0),
                    "delta_roll": latest.get("delta_roll", 0.0),
                    "delta_magnitude": latest.get("delta_mag", 0.0),
                }
            else:
                deltas = {"delta_yaw": 0.0, "delta_pitch": 0.0, "delta_roll": 0.0, "delta_magnitude": 0.0}

        if mov_state_info is None:
            mov_state_info = {
                "movement_state": "STABLE" if not valid_frames else valid_frames[-1].get("movement_state", "STABLE"),
                "movement_event_active": self.movement_event_active,
                "movement_event_count": self.movement_event_count,
            }

        if not valid_frames:
            return {
                "status": "Unavailable",
                "level": "INSUFFICIENT_DATA",
                "movement_state": "UNAVAILABLE",
                "movement_score": 0,
                "movement_event_active": False,
                "movement_event_count": 0,
                "delta_yaw": 0.0, "delta_pitch": 0.0, "delta_roll": 0.0, "delta_magnitude": 0.0,
                "shake_count": 0, "tilt_detected": False, "movement_events": 0,
            }

        yaw_devs = [abs(f["yaw_dev"]) for f in valid_frames]
        pitch_devs = [abs(f["pitch_dev"]) for f in valid_frames]
        roll_devs = [abs(f["roll_dev"]) for f in valid_frames]

        max_yaw_dev = round(float(max(yaw_devs)), 1)
        max_pitch_dev = round(float(max(pitch_devs)), 1)
        max_roll_dev = round(float(max(roll_devs)), 1)

        avg_yaw_dev = round(float(sum(yaw_devs) / len(yaw_devs)), 1)
        avg_pitch_dev = round(float(sum(pitch_devs) / len(pitch_devs)), 1)
        avg_roll_dev = round(float(sum(roll_devs) / len(roll_devs)), 1)

        # Shake & Tilt detectors
        raw_yaw_devs = [f["yaw_dev"] for f in valid_frames]
        timestamps = [f["timestamp"] for f in valid_frames]
        shake_count = 0
        for i in range(1, len(raw_yaw_devs) - 1):
            t_diff = timestamps[i + 1] - timestamps[i - 1]
            if t_diff <= 3.0:
                d1 = raw_yaw_devs[i] - raw_yaw_devs[i - 1]
                d2 = raw_yaw_devs[i + 1] - raw_yaw_devs[i]
                if (d1 >= SHAKE_MIN_AMPLITUDE_DEG and d2 <= -SHAKE_MIN_AMPLITUDE_DEG) or \
                   (d1 <= -SHAKE_MIN_AMPLITUDE_DEG and d2 >= SHAKE_MIN_AMPLITUDE_DEG):
                    shake_count += 1

        sustained_tilt_frames = sum(1 for r in roll_devs if r >= TILT_SUSTAINED_THRESHOLD_DEG)
        tilt_detected = sustained_tilt_frames >= TILT_MIN_FRAMES

        # Current Movement State text
        mov_state = mov_state_info["movement_state"]
        if mov_state == "STABLE":
            status = "Normal Movement"
            level = "NORMAL"
            score = 95
        elif mov_state == "SMALL_MOVEMENT":
            status = "Slight Movement"
            level = "SLIGHT"
            score = 85
        elif mov_state == "MODERATE_MOVEMENT":
            status = "Significant Movement"
            level = "MODERATE"
            score = 70
        else:
            status = "Large Movement"
            level = "EXCESSIVE"
            score = 55

        return {
            "status": status,
            "level": level,
            "movement_state": mov_state,
            "movement_score": int(score),
            "movement_event_active": mov_state_info["movement_event_active"],
            "movement_event_count": mov_state_info["movement_event_count"],
            "delta_yaw": deltas["delta_yaw"],
            "delta_pitch": deltas["delta_pitch"],
            "delta_roll": deltas["delta_roll"],
            "delta_magnitude": deltas["delta_magnitude"],
            "shake_count": shake_count,
            "tilt_detected": tilt_detected,
            "movement_events": mov_state_info["movement_event_count"],
            "max_yaw_deviation": max_yaw_dev,
            "max_pitch_deviation": max_pitch_dev,
            "max_roll_deviation": max_roll_dev,
            "max_yaw_change": max_yaw_dev,
            "max_pitch_change": max_pitch_dev,
            "max_roll_change": max_roll_dev,
            "avg_yaw_deviation": avg_yaw_dev,
            "avg_pitch_deviation": avg_pitch_dev,
            "avg_roll_deviation": avg_roll_dev,
        }

    def _generate_visual_feedback(
        self,
        eye_ratio: float,
        framing: Dict[str, Any],
        pose: Dict[str, Any],
        movement: Dict[str, Any],
    ) -> List[str]:
        feedback = []

        if eye_ratio >= 0.70:
            feedback.append("Estimated camera engagement was strong throughout the response.")
        elif eye_ratio >= 0.50:
            feedback.append("Estimated eye contact was moderate. Try looking toward the camera when explaining key points.")
        else:
            feedback.append("Estimated eye contact dropped during parts of the response.")

        if framing["status"] == "GOOD":
            feedback.append("Camera framing was appropriate.")
        elif framing["status"] == "TOO_CLOSE":
            feedback.append("Positioned close to camera; move back slightly.")
        elif framing["status"] == "TOO_FAR":
            feedback.append("Positioned far from camera; move closer.")

        mov_state = movement.get("movement_state", "STABLE")
        if mov_state == "STABLE":
            feedback.append("Head movement remained stable and natural.")
        elif mov_state == "SMALL_MOVEMENT":
            feedback.append("Slight natural head movement observed.")
        elif mov_state == "MODERATE_MOVEMENT":
            feedback.append("Noticeable head movement or tilt detected.")
        else:
            feedback.append("Frequent or large head movements detected. Try maintaining head stability.")

        return feedback

    def _calculate_movement_metrics(self) -> Dict[str, Any]:
        valid_frames = [f for f in self.history if f["detected"]]
        deltas = {"delta_yaw": 0.0, "delta_pitch": 0.0, "delta_roll": 0.0, "delta_magnitude": 0.0}
        if valid_history := [f for f in self.history if f["detected"]]:
            latest = valid_history[-1]
            deltas = {
                "delta_yaw": latest.get("delta_yaw", 0.0),
                "delta_pitch": latest.get("delta_pitch", 0.0),
                "delta_roll": latest.get("delta_roll", 0.0),
                "delta_magnitude": latest.get("delta_mag", 0.0),
            }
        mov_info = {
            "movement_state": "STABLE" if not valid_frames else valid_frames[-1].get("movement_state", "STABLE"),
            "movement_event_active": self.movement_event_active,
            "movement_event_count": self.movement_event_count,
        }
        return self._calculate_temporal_movement_metrics(deltas, mov_info)

    def get_session_summary(self) -> Dict[str, Any]:
        """
        Synthesizes evidence-based session metrics across all valid frames recorded during the interview.
        Evaluates stable_percentage = (stable_samples / total_valid_samples) * 100:
        - stable_percentage >= 75.0% -> Mostly stable
        - 50.0% <= stable_percentage < 75.0% -> Occasional movement
        - 25.0% <= stable_percentage < 50.0% -> Frequent movement
        - < 25.0% -> Excessive movement
        - 0 valid samples -> Insufficient data
        """
        valid_frames = [f for f in self.history if f["detected"]]

        if not valid_frames:
            return {
                "category": "Insufficient data",
                "head_movement_level": "Insufficient data",
                "insufficient_data": True,
                "stable_percentage": 0.0,
                "shake_count": 0,
                "tilt_detected": False,
                "movement_event_count": 0,
                "avg_yaw_dev": 0.0, "avg_pitch_dev": 0.0, "avg_roll_dev": 0.0,
                "max_yaw_dev": 0.0, "max_pitch_dev": 0.0, "max_roll_dev": 0.0,
                "visual_insights": ["Not enough valid interview data was collected to reliably assess head movement."],
            }

        total_valid = len(valid_frames)
        stable_count = sum(1 for f in valid_frames if f.get("movement_state") == "STABLE")
        small_mov_count = sum(1 for f in valid_frames if f.get("movement_state") == "SMALL_MOVEMENT")
        mod_mov_count = sum(1 for f in valid_frames if f.get("movement_state") == "MODERATE_MOVEMENT")
        sig_mov_count = sum(1 for f in valid_frames if f.get("movement_state") == "SIGNIFICANT_MOVEMENT")

        stable_pct = round((stable_count / float(total_valid)) * 100.0, 1)

        yaw_devs = [abs(f["yaw_dev"]) for f in valid_frames]
        pitch_devs = [abs(f["pitch_dev"]) for f in valid_frames]
        roll_devs = [abs(f["roll_dev"]) for f in valid_frames]

        max_yaw = round(float(max(yaw_devs)), 1)
        max_pitch = round(float(max(pitch_devs)), 1)
        max_roll = round(float(max(roll_devs)), 1)

        avg_yaw = round(float(sum(yaw_devs) / len(yaw_devs)), 1)
        avg_pitch = round(float(sum(pitch_devs) / len(pitch_devs)), 1)
        avg_roll = round(float(sum(roll_devs) / len(roll_devs)), 1)

        raw_yaw_devs = [f["yaw_dev"] for f in valid_frames]
        timestamps = [f["timestamp"] for f in valid_frames]
        shake_count = 0
        for i in range(1, len(raw_yaw_devs) - 1):
            t_diff = timestamps[i + 1] - timestamps[i - 1]
            if t_diff <= 3.0:
                d1 = raw_yaw_devs[i] - raw_yaw_devs[i - 1]
                d2 = raw_yaw_devs[i + 1] - raw_yaw_devs[i]
                if (d1 >= SHAKE_MIN_AMPLITUDE_DEG and d2 <= -SHAKE_MIN_AMPLITUDE_DEG) or \
                   (d1 <= -SHAKE_MIN_AMPLITUDE_DEG and d2 >= SHAKE_MIN_AMPLITUDE_DEG):
                    shake_count += 1

        sustained_tilt = sum(1 for r in roll_devs if r >= TILT_SUSTAINED_THRESHOLD_DEG) >= TILT_MIN_FRAMES

        # Section 7 Evidence-Based Classification
        if stable_pct >= 75.0:
            category = "Mostly stable"
        elif stable_pct >= 50.0:
            category = "Occasional movement"
        elif stable_pct >= 25.0:
            category = "Frequent movement"
        else:
            category = "Excessive movement"

        insights = [
            f"✓ Face detected across {total_valid} analyzed frames ({stable_pct}% stable posture).",
        ]
        if category in ["Mostly stable", "Occasional movement"]:
            insights.append(f"✓ Head position remained mostly stable ({self.movement_event_count} discrete movement events).")
        else:
            insights.append(f"⚠ {category} detected ({self.movement_event_count} discrete movement events, max yaw deviation {max_yaw}°). Try keeping head steady.")

        return {
            "category": category,
            "head_movement_level": category,
            "insufficient_data": False,
            "stable_percentage": stable_pct,
            "shake_count": shake_count,
            "tilt_detected": sustained_tilt,
            "movement_event_count": self.movement_event_count,
            "avg_yaw_dev": avg_yaw, "avg_pitch_dev": avg_pitch, "avg_roll_dev": avg_roll,
            "max_yaw_dev": max_yaw, "max_pitch_dev": max_pitch, "max_roll_dev": max_roll,
            "visual_insights": insights,
        }

    def _build_unavailable_response(self, reason: str) -> Dict[str, Any]:
        return {
            "analysis_available": False,
            "score_available": False,
            "face_detected": False,
            "face_count": 0,
            "multiple_faces_detected": False,
            "visual_score": None,
            "score_interpretation": reason,
            "framing": {"status": "NOT_DETECTED", "position": "CENTER"},
            "eye_contact": {"status": "UNCERTAIN", "ratio": 0.0},
            "head_pose": {
                "yaw": 0.0, "pitch": 0.0, "roll": 0.0,
                "neutral_yaw": 0.0, "neutral_pitch": 0.0, "neutral_roll": 0.0,
                "yaw_deviation": 0.0, "pitch_deviation": 0.0, "roll_deviation": 0.0,
                "classification": "UNAVAILABLE"
            },
            "head_movement": {
                "status": "Insufficient data",
                "level": "INSUFFICIENT_DATA",
                "movement_state": "UNAVAILABLE",
                "movement_score": 0,
                "movement_event_active": False,
                "movement_event_count": self.movement_event_count,
                "delta_yaw": 0.0, "delta_pitch": 0.0, "delta_roll": 0.0, "delta_magnitude": 0.0,
                "shake_count": 0, "tilt_detected": False, "movement_events": self.movement_event_count,
            },
            "feedback": ["Visual analysis temporarily unavailable."],
        }


visual_analysis_service = VisualAnalysisService()
