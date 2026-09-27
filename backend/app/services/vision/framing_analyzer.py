from typing import Dict, Any, Optional, Tuple


class FramingAnalyzer:
    """
    Evaluates candidate camera framing and face positioning relative to video dimensions.
    Normalizes coordinates relative to frame width and height.
    """

    def __init__(
        self,
        x_min: float = 0.35,
        x_max: float = 0.65,
        y_min: float = 0.25,
        y_max: float = 0.75,
        too_close_ratio: float = 0.45,
        too_far_ratio: float = 0.04,
    ):
        self.x_min = x_min
        self.x_max = x_max
        self.y_min = y_min
        self.y_max = y_max
        self.too_close_ratio = too_close_ratio
        self.too_far_ratio = too_far_ratio

    def analyze_framing(
        self,
        face_box: Optional[Tuple[int, int, int, int]],
        frame_dimensions: Optional[Tuple[int, int]],
    ) -> Dict[str, Any]:
        """
        Analyzes normalized position and sizing of face within frame boundaries.
        """
        if not face_box or not frame_dimensions:
            return {
                "status": "NOT_DETECTED",
                "position": "CENTER",
                "normalized_x": 0.0,
                "normalized_y": 0.0,
                "area_ratio": 0.0,
                "is_centered": False,
            }

        x, y, w, h = face_box
        width, height = frame_dimensions

        if width <= 0 or height <= 0:
            return {
                "status": "NOT_DETECTED",
                "position": "CENTER",
                "normalized_x": 0.0,
                "normalized_y": 0.0,
                "area_ratio": 0.0,
                "is_centered": False,
            }

        center_x = (x + w / 2.0) / float(width)
        center_y = (y + h / 2.0) / float(height)
        area_ratio = (w * h) / float(width * height)

        normalized_x = round(max(0.0, min(1.0, center_x)), 3)
        normalized_y = round(max(0.0, min(1.0, center_y)), 3)
        area_ratio = round(max(0.0, min(1.0, area_ratio)), 3)

        # Check frame edge touch
        edge_threshold = 5
        is_partially_out = (
            x <= edge_threshold
            or y <= edge_threshold
            or (x + w) >= (width - edge_threshold)
            or (y + h) >= (height - edge_threshold)
        )

        # Determine Position Classification
        if self.x_min <= normalized_x <= self.x_max and self.y_min <= normalized_y <= self.y_max:
            position = "CENTER"
            is_centered = True
        elif normalized_x < self.x_min:
            position = "LEFT"
            is_centered = False
        elif normalized_x > self.x_max:
            position = "RIGHT"
            is_centered = False
        elif normalized_y < self.y_min:
            position = "HIGH"
            is_centered = False
        else:
            position = "LOW"
            is_centered = False

        # Determine Framing Status
        if is_partially_out:
            status = "PARTIALLY_OUT_OF_FRAME"
        elif area_ratio > self.too_close_ratio:
            status = "TOO_CLOSE"
        elif area_ratio < self.too_far_ratio:
            status = "TOO_FAR"
        else:
            status = "GOOD"

        return {
            "status": status,
            "position": position,
            "normalized_x": normalized_x,
            "normalized_y": normalized_y,
            "area_ratio": area_ratio,
            "is_centered": is_centered,
        }


framing_analyzer = FramingAnalyzer()
