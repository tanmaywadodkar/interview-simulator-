from typing import Dict, Any


class PoseAnalyzer:
    """
    Observable Posture & Pose Alignment Analyzer.
    Evaluates body visibility, sitting alignment, and shoulder/head balance.
    """

    def analyze_pose(self, face_center_y: float = 0.45, face_center_x: float = 0.5) -> Dict[str, Any]:
        """
        Calculates observable body posture status and stability score.
        """
        is_centered = 0.35 <= face_center_x <= 0.65

        if face_center_y > 0.62:
            status = "Slouching"
            score = 6.5
            note = "Head position is lower in frame. Consider sitting upright for optimal camera alignment."
        elif face_center_y < 0.22:
            status = "Leaning Close"
            score = 7.5
            note = "Leaning close to camera. Maintain a natural distance."
        elif not is_centered:
            status = "Off-Center"
            score = 7.8
            note = "Positioned to one side of the camera frame."
        else:
            status = "Good Alignment"
            score = 9.2
            note = "Centered upright posture with stable head and shoulder position."

        return {
            "posture_status": status,
            "posture_score": score,
            "head_shoulder_aligned": is_centered and (0.25 <= face_center_y <= 0.60),
            "posture_feedback_note": note,
        }


pose_analyzer = PoseAnalyzer()
