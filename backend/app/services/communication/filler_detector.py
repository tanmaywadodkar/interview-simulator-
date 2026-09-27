import re
from typing import List, Dict, Any, Optional

DEFAULT_FILLER_WORDS = [
    "um", "uh", "er", "like", "basically", "actually", "you know", "i mean", "sort of", "kind of"
]


class FillerDetector:
    """
    Detects filler words and phrases using word-boundary-aware regex matching.
    Ensures substrings like 'like' do not match 'likely' or 'likewise'.
    """

    def __init__(self, filler_words: Optional[List[str]] = None):
        self.filler_words = [w.lower() for w in (filler_words or DEFAULT_FILLER_WORDS)]

    def analyze(self, transcript: str) -> Dict[str, Any]:
        """
        Analyzes transcript text and calculates filler count, rate, and word breakdown.
        """
        if not transcript or not transcript.strip():
            return {
                "filler_word_count": 0,
                "filler_rate": 0.0,
                "filler_words_used": {},
                "most_frequently_used": [],
            }

        cleaned = transcript.strip()
        words = re.findall(r"\b\w+\b", cleaned.lower())
        total_words = len(words)

        lower_transcript = cleaned.lower()
        filler_counts: Dict[str, int] = {}
        total_fillers = 0

        for filler in self.filler_words:
            # Word-boundary matching for both single words and multi-word phrases
            pattern = rf"\b{re.escape(filler)}\b"
            matches = re.findall(pattern, lower_transcript)
            if matches:
                count = len(matches)
                filler_counts[filler] = count
                total_fillers += count

        filler_rate = round((total_fillers / total_words) * 100.0, 2) if total_words > 0 else 0.0

        # Sort filler words by frequency descending
        sorted_fillers = sorted(filler_counts.items(), key=lambda item: item[1], reverse=True)
        most_frequently_used = [item[0] for item in sorted_fillers]

        return {
            "filler_word_count": total_fillers,
            "filler_rate": filler_rate,
            "filler_words_used": filler_counts,
            "most_frequently_used": most_frequently_used,
        }


filler_detector = FillerDetector()
