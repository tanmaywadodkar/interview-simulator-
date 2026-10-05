import re
from typing import Dict, Any, Optional

DEFAULT_WPM_THRESHOLDS = {
    "very_slow": 90,
    "slow": 120,
    "optimal_high": 160,
    "fast_high": 190,
}


class SpeechAnalyzer:
    """
    Analyzes spoken answer duration, word count, speaking speed (WPM),
    and classifies pace into configurable interview ranges.
    """

    def __init__(self, thresholds: Optional[Dict[str, float]] = None):
        self.thresholds = thresholds or DEFAULT_WPM_THRESHOLDS

    def calculate_wpm(self, total_words: int, duration_seconds: Optional[float]) -> Optional[float]:
        """
        Calculates Words Per Minute (WPM) based on actual speaking duration.
        """
        if not duration_seconds or duration_seconds <= 0 or total_words <= 0:
            return None
        duration_minutes = duration_seconds / 60.0
        return round(total_words / duration_minutes, 1)

    def classify_wpm(self, wpm: Optional[float]) -> str:
        """
        Classifies speaking pace into structured interview ranges.
        """
        if wpm is None or wpm <= 0:
            return "Insufficient data"
        if wpm < self.thresholds["very_slow"]:
            return "Very slow"
        elif self.thresholds["very_slow"] <= wpm < self.thresholds["slow"]:
            return "Slow / deliberate"
        elif self.thresholds["slow"] <= wpm <= self.thresholds["optimal_high"]:
            return "Good interview pace"
        elif self.thresholds["optimal_high"] < wpm <= self.thresholds["fast_high"]:
            return "Fast"
        else:
            return "Very fast"

    def analyze(
        self, transcript: str, duration_seconds: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Extracts word count, speaking speed (WPM), and pace classification.
        Handles empty transcripts and zero/invalid durations gracefully.
        """
        if not transcript or not transcript.strip():
            return {
                "total_words": 0,
                "duration_seconds": round(duration_seconds, 1) if (duration_seconds and duration_seconds > 0) else 0.0,
                "speaking_rate_wpm": None,
                "pace_classification": "Insufficient data",
            }

        cleaned = transcript.strip()
        words = re.findall(r"\b\w+\b", cleaned.lower())
        total_words = len(words)

        # Use actual duration if provided (>0), otherwise estimate assuming average 135 WPM
        if duration_seconds and duration_seconds > 0:
            actual_duration = round(duration_seconds, 1)
        else:
            actual_duration = max(3.0, round((total_words / 135.0) * 60.0, 1))

        wpm = self.calculate_wpm(total_words, actual_duration)
        classification = self.classify_wpm(wpm)

        return {
            "total_words": total_words,
            "duration_seconds": actual_duration,
            "speaking_rate_wpm": wpm,
            "pace_classification": classification,
        }


speech_analyzer = SpeechAnalyzer()
