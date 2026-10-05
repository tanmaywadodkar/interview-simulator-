from typing import Dict, Any, Optional, List
from app.services.communication.speech_analyzer import speech_analyzer
from app.services.communication.filler_detector import filler_detector
from app.services.communication.pause_analyzer import pause_analyzer
from app.services.communication.repetition_analyzer import repetition_analyzer

# Configurable Scoring Weights
DEFAULT_WEIGHTS = {
    "speaking_pace": 0.25,
    "filler_control": 0.25,
    "pause_management": 0.20,
    "clarity_repetition": 0.15,
    "answer_fluency": 0.15,
}


class CommunicationService:
    """
    Central Communication & Speech Analysis Coordinator.
    Extracts WPM, filler rate, pause patterns, repetition, transparent scoring, and metric-driven feedback.
    """

    def __init__(self, weights: Optional[Dict[str, float]] = None):
        self.weights = weights or DEFAULT_WEIGHTS

    def analyze_communication(
        self,
        transcript: str,
        duration_seconds: Optional[float] = None,
        pauses_sec: Optional[List[float]] = None,
        interview_type: Optional[str] = "General",
        role: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Runs comprehensive communication evaluation on candidate spoken response.
        """
        # 1. Run Individual Analyzers
        speech_res = speech_analyzer.analyze(transcript, duration_seconds)
        filler_res = filler_detector.analyze(transcript)
        pause_res = pause_analyzer.analyze(pauses_sec, duration_seconds, transcript)
        rep_res = repetition_analyzer.analyze(transcript)

        wpm = speech_res["speaking_rate_wpm"]
        duration = speech_res["duration_seconds"]
        
        if wpm is None:
            return {
                "communication_score": None,
                "speaking_rate_wpm": None,
                "answer_duration_seconds": duration if duration and duration > 0 else None,
                "filler_word_count": None,
                "filler_rate": None,
                "filler_words": [],
                "most_frequently_used_fillers": [],
                "pause_count": None,
                "average_pause_seconds": None,
                "longest_pause_seconds": None,
                "pause_behavior_type": "Insufficient data",
                "repetition_score": None,
                "repetition_severity": "Insufficient data",
                "score_breakdown": None,
                "pace_classification": "Insufficient data",
                "feedback": ["No spoken transcript detected. Insufficient data for communication analysis."],
            }
            
        filler_count = filler_res["filler_word_count"]
        filler_rate = filler_res["filler_rate"]

        # 2. Transparent Component Scoring (0-100 scale)

        # Speaking Pace Score (25%)
        if 120 <= wpm <= 160:
            pace_score = 95
        elif 90 <= wpm < 120:
            pace_score = 82
        elif 160 < wpm <= 190:
            pace_score = 80
        elif wpm < 90:
            pace_score = 65
        else: # > 190
            pace_score = 60

        # Filler Control Score (25%)
        if filler_rate <= 1.0:
            filler_score = 98
        elif filler_rate <= 3.0:
            filler_score = 88
        elif filler_rate <= 5.0:
            filler_score = 75
        elif filler_rate <= 8.0:
            filler_score = 62
        else:
            filler_score = 45

        # Pause Management Score (20%)
        if pause_res["pause_behavior_type"] == "Natural strategic pauses":
            pause_score = 92
        elif pause_res["pause_behavior_type"] == "Continuous speaking":
            pause_score = 80
        else: # Frequent hesitation pauses
            pause_score = 65

        # Clarity & Repetition Score (15%)
        clarity_score = rep_res["repetition_score"]

        # Answer Fluency Score (15%)
        fluency_score = round((pace_score * 0.4 + filler_score * 0.4 + pause_score * 0.2), 1)

        # 3. Overall Weighted Communication Score
        overall_score = round(
            pace_score * self.weights["speaking_pace"] +
            filler_score * self.weights["filler_control"] +
            pause_score * self.weights["pause_management"] +
            clarity_score * self.weights["clarity_repetition"] +
            fluency_score * self.weights["answer_fluency"]
        )
        overall_score = max(0, min(100, overall_score))

        score_breakdown = {
            "speaking_pace": round(pace_score),
            "filler_control": round(filler_score),
            "pause_management": round(pause_score),
            "clarity": round(clarity_score),
            "fluency": round(fluency_score),
        }

        # 4. Generate Metric-Driven Actionable Feedback
        feedback: List[str] = []

        # WPM Feedback
        if wpm > 180:
            feedback.append(f"Your speaking pace was fast ({wpm} WPM). Slow down slightly during key points so the interviewer can follow your reasoning.")
        elif wpm < 100:
            feedback.append(f"Your speaking pace was slow ({wpm} WPM). Increase your pace slightly for higher engagement.")
        else:
            feedback.append(f"Your speaking pace ({wpm} WPM) was well controlled and appropriate for interviews.")

        # Filler Words Feedback
        if filler_count > 0:
            top_fillers = ", ".join([f"'{f}'" for f in filler_res["most_frequently_used"][:3]])
            if filler_rate > 5.0:
                feedback.append(f"You used filler words frequently ({filler_rate}% rate), particularly {top_fillers}. Replace them with a brief pause before continuing.")
            elif filler_rate > 2.0:
                feedback.append(f"Filler word usage ({filler_count} total, including {top_fillers}) was noticeable. Try reducing fillers.")
            else:
                feedback.append(f"Filler word usage was minimal ({filler_count} detected). Good filler control.")
        else:
            feedback.append("Zero filler words detected. Outstanding verbal control.")

        # Pause Feedback
        if pause_res["pause_behavior_type"] == "Natural strategic pauses":
            feedback.append(f"Your pauses (average {pause_res['average_pause_seconds']} sec) were natural and well-placed.")
        elif pause_res["pause_behavior_type"] == "Frequent hesitation pauses":
            feedback.append(f"Frequent long pauses ({pause_res['long_pauses_count']} long pauses) were detected. Practice structuring your thoughts before answering.")

        # Repetition Feedback
        if rep_res["repeated_phrases"]:
            phrases_str = ", ".join([f"'{p}' font" for p in rep_res["repeated_phrases"][:2]])
            feedback.append(f"Mild phrase repetition detected ({phrases_str}). Vary your sentence structure.")

        return {
            "communication_score": overall_score,
            "speaking_rate_wpm": wpm,
            "answer_duration_seconds": duration,
            "filler_word_count": filler_count,
            "filler_rate": filler_rate,
            "filler_words": filler_res["filler_words_used"],
            "most_frequently_used_fillers": filler_res["most_frequently_used"],
            "pause_count": pause_res["pause_count"],
            "average_pause_seconds": pause_res["average_pause_seconds"],
            "longest_pause_seconds": pause_res["longest_pause_seconds"],
            "pause_behavior_type": pause_res["pause_behavior_type"],
            "repetition_score": rep_res["repetition_score"],
            "repetition_severity": rep_res["repetition_severity"],
            "score_breakdown": score_breakdown,
            "pace_classification": speech_res["pace_classification"],
            "feedback": feedback,
        }


communication_service = CommunicationService()
