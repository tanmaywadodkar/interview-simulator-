from typing import Dict, Any


class PostureAnalyzer:
    """
    Posture analysis architecture for candidate camera feedback.
    Evaluates posture alignment (Good, Leaning, Slouching).
    """

    def analyze_posture(self, face_center_y: float) -> Dict[str, Any]:
        if face_center_y > 0.65:
            status = "Slouching"
            score = 6.5
        elif face_center_y < 0.25:
            status = "Leaning Close"
            score = 7.5
        else:
            status = "Good Alignment"
            score = 9.0

        return {
            "posture_status": status,
            "posture_score": score
        }


posture_analyzer = PostureAnalyzer()
