import re
from typing import List, Dict, Any, Optional

DEFAULT_MIN_PAUSE_THRESHOLD = 0.8


class PauseAnalyzer:
    """
    Analyzes pause duration, frequency, pause classifications (short, moderate, long),
    and distinguishes strategic pauses from hesitation pauses.
    """

    def __init__(self, min_pause_threshold: float = DEFAULT_MIN_PAUSE_THRESHOLD):
        self.min_pause_threshold = min_pause_threshold

    def analyze(
        self,
        pauses_sec: Optional[List[float]] = None,
        duration_seconds: Optional[float] = None,
        transcript: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Calculates pause metrics and pause classification behavior.
        If explicit pause durations are missing, estimates structural pauses from punctuation.
        """
        valid_pauses: List[float] = []

        if pauses_sec and isinstance(pauses_sec, list) and len(pauses_sec) > 0:
            valid_pauses = [p for p in pauses_sec if p >= self.min_pause_threshold]
        elif transcript and transcript.strip():
            # Fallback pause estimation using punctuation marks (commas, periods, ellipses)
            punct_matches = re.findall(r"[,;.]", transcript)
            words = re.findall(r"\b\w+\b", transcript)
            # Assign structural pause duration estimates
            valid_pauses = [1.0 for _ in punct_matches if len(words) > 10]

        total_pause_count = len(valid_pauses)
        
        if total_pause_count > 0:
            total_silence = round(sum(valid_pauses), 2)
            avg_pause = round(total_silence / total_pause_count, 2)
            longest_pause = round(max(valid_pauses), 2)
        else:
            total_silence = 0.0
            avg_pause = 0.0
            longest_pause = 0.0

        total_duration = duration_seconds if (duration_seconds and duration_seconds > 0) else (total_silence + 10.0)
        speaking_time = max(0.0, round(total_duration - total_silence, 2))

        # Classify individual pauses
        short_pauses = [p for p in valid_pauses if 0.8 <= p <= 1.5]
        moderate_pauses = [p for p in valid_pauses if 1.5 < p <= 3.0]
        long_pauses = [p for p in valid_pauses if p > 3.0]

        # Determine pause management classification
        if len(long_pauses) >= 3 or (total_pause_count > 8 and avg_pause > 2.0):
            behavior_type = "Frequent hesitation pauses"
        elif len(short_pauses) + len(moderate_pauses) >= 1:
            behavior_type = "Natural strategic pauses"
        else:
            behavior_type = "Continuous speaking"

        return {
            "pause_count": total_pause_count,
            "average_pause_seconds": avg_pause,
            "longest_pause_seconds": longest_pause,
            "total_silence_seconds": total_silence,
            "total_speaking_seconds": speaking_time,
            "short_pauses_count": len(short_pauses),
            "moderate_pauses_count": len(moderate_pauses),
            "long_pauses_count": len(long_pauses),
            "pause_behavior_type": behavior_type,
        }


pause_analyzer = PauseAnalyzer()
