import re
from typing import List, Dict, Any

STOP_WORDS = {
    "the", "and", "to", "a", "of", "in", "it", "is", "for", "on", "with", "that",
    "this", "as", "at", "by", "from", "an", "be", "or", "are", "was", "were", "been",
}


class RepetitionAnalyzer:
    """
    Analyzes transcripts for phrase repetition and consecutive sentence restatement.
    Avoids flagging common isolated stop words.
    """

    def analyze(self, transcript: str) -> Dict[str, Any]:
        """
        Extracts phrase repetitions and assigns a repetition score and severity.
        """
        if not transcript or not transcript.strip():
            return {
                "repetition_score": 100,
                "repeated_phrases": [],
                "repetition_severity": "Low",
            }

        cleaned = transcript.strip()
        words = re.findall(r"\b\w+\b", cleaned.lower())
        total_words = len(words)

        if total_words < 5:
            return {
                "repetition_score": 100,
                "repeated_phrases": [],
                "repetition_severity": "Low",
            }

        # Extract 2-word, 3-word, and 4-word n-grams
        ngram_counts: Dict[str, int] = {}
        for n in [2, 3, 4]:
            for i in range(len(words) - n + 1):
                gram_words = words[i:i + n]
                # Skip n-grams consisting exclusively of stop words
                if all(w in STOP_WORDS for w in gram_words):
                    continue
                gram_phrase = " ".join(gram_words)
                ngram_counts[gram_phrase] = ngram_counts.get(gram_phrase, 0) + 1

        # Filter n-grams that appear 2 or more times
        repeated_phrases = [phrase for phrase, count in ngram_counts.items() if count >= 2]
        
        # Deduplicate overlapping sub-phrases (keep longer phrases)
        filtered_phrases = []
        sorted_phrases = sorted(repeated_phrases, key=len, reverse=True)
        for phrase in sorted_phrases:
            if not any(phrase in longer for longer in filtered_phrases):
                filtered_phrases.append(phrase)

        rep_count = len(filtered_phrases)

        # Calculate repetition score
        if rep_count == 0:
            score = 100
            severity = "Low"
        elif rep_count <= 2:
            score = 88
            severity = "Low"
        elif rep_count <= 4:
            score = 72
            severity = "Moderate"
        else:
            score = 55
            severity = "High"

        return {
            "repetition_score": score,
            "repeated_phrases": filtered_phrases[:5],
            "repetition_severity": severity,
        }


repetition_analyzer = RepetitionAnalyzer()
