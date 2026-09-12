import re
from typing import List, Dict, Any, Optional

DEFAULT_FILLER_WORDS = [
    "um", "uh", "like", "basically", "actually", "you know", "i mean", "sort of", "kind of", "so to speak"
]


class SpeakingAnalyzer:
    """
    Analyzes spoken text transcript cadence, configurable filler words, speaking pace (WPM), 
    response duration, and structural pause characteristics.
    """

    def __init__(self, filler_words: Optional[List[str]] = None):
        self.filler_words = filler_words or DEFAULT_FILLER_WORDS

    def analyze_transcript(
        self, transcript: str, duration_sec: Optional[float] = None
    ) -> Dict[str, Any]:
        if not transcript or not transcript.strip():
            return {
                "words_per_minute": 0,
                "filler_words_count": 0,
                "filler_words_found": [],
                "response_duration_sec": 0,
                "answer_length_words": 0,
                "speaking_pace_rating": "N/A",
                "pause_frequency": "Normal"
            }

        cleaned = transcript.strip()
        words = re.findall(r"\b\w+\b", cleaned.lower())
        word_count = len(words)

        # Estimate duration if not explicitly provided (average ~135 WPM)
        est_duration = duration_sec if (duration_sec and duration_sec > 0) else max(5.0, round((word_count / 135.0) * 60.0, 1))
        
        wpm = round((word_count / est_duration) * 60.0) if est_duration > 0 else 135

        # Detect filler words & phrases
        filler_count = 0
        detected_fillers = []

        lower_transcript = cleaned.lower()
        for filler in self.filler_words:
            # Match word boundary for single words and exact substring for multi-word phrases
            if " " in filler:
                matches = re.findall(re.escape(filler), lower_transcript)
            else:
                matches = re.findall(rf"\b{re.escape(filler)}\b", lower_transcript)

            if matches:
                count = len(matches)
                filler_count += count
                detected_fillers.append(filler)

        # Rate speaking pace objectively
        if wpm < 100:
            pace_rating = "Slower Pace"
        elif wpm > 170:
            pace_rating = "Fast Pace"
        else:
            pace_rating = "Optimal Pace"

        # Estimate structural pauses based on punctuation count (commas, periods, ellipses)
        punctuation_count = len(re.findall(r"[,;.]", transcript))
        pause_freq = "Moderate"
        if punctuation_count > (word_count / 6):
            pause_freq = "Frequent Pauses"
        elif punctuation_count < (word_count / 25):
            pause_freq = "Continuous Flow"

        return {
            "words_per_minute": wpm,
            "filler_words_count": filler_count,
            "filler_words_found": list(dict.fromkeys(detected_fillers)),
            "response_duration_sec": est_duration,
            "answer_length_words": word_count,
            "speaking_pace_rating": pace_rating,
            "pause_frequency": pause_freq,
        }


speaking_analyzer = SpeakingAnalyzer()
