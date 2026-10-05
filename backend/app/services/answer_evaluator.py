import json
import httpx
from typing import Dict, Any, List
from app.core.config import settings
from app.utils.logger import logger


class AnswerEvaluator:
    """
    Evaluates candidate answers dynamically based on interview context, candidate profile, 
    and answer content across multiple assessment dimensions.
    """

    async def evaluate_answer(
        self,
        question: str,
        transcript: str,
        role: str,
        experience: str,
        difficulty: str,
        interview_type: str
    ) -> Dict[str, Any]:
        """
        Evaluate candidate's answer and return structured scoring JSON.
        """
        if not transcript or len(transcript.strip()) < 5:
            return {
                "score": None,
                "relevance": None,
                "clarity": None,
                "technical_accuracy": None,
                "structure": None,
                "strengths": ["Insufficient data"],
                "improvements": ["No meaningful answer was provided. Ensure you respond clearly to the question."],
                "follow_up_needed": False,
                "sample_improved_answer": "No answer recorded."
            }

        # Use LLM API if key is available and not forced demo mode
        if not settings.is_demo_mode() and settings.AI_API_KEY:
            try:
                llm_eval = await self._evaluate_with_llm(
                    question, transcript, role, experience, difficulty, interview_type
                )
                if llm_eval:
                    return llm_eval
            except Exception as e:
                logger.warning(f"LLM Answer Evaluation failed, falling back to smart heuristic evaluator: {str(e)}")

        return self._evaluate_heuristic(question, transcript, role, experience, difficulty, interview_type)

    async def _evaluate_with_llm(
        self,
        question: str,
        transcript: str,
        role: str,
        experience: str,
        difficulty: str,
        interview_type: str
    ) -> Dict[str, Any]:
        prompt = f"""
You are an expert technical interviewer evaluating a job candidate for a {experience} {role} position in a {difficulty} {interview_type} interview.

Question asked: "{question}"
Candidate's response: "{transcript}"

Evaluate the answer on a scale from 1 to 10 across these dimensions:
1. Relevance
2. Clarity
3. Technical Accuracy
4. Structure (STAR method or clear logical flow)

Return strictly valid JSON with the following schema:
{{
  "score": 8.2,
  "relevance": 9.0,
  "clarity": 8.0,
  "technical_accuracy": 8.0,
  "structure": 7.5,
  "strengths": ["Point 1", "Point 2"],
  "improvements": ["Point 1", "Point 2"],
  "follow_up_needed": true,
  "sample_improved_answer": "Concise high-quality reference answer here"
}}
"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.AI_MODEL}:generateContent?key={settings.AI_API_KEY}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                url,
                json={"contents": [{"parts": [{"text": prompt}]}]}
            )
            if resp.status_code == 200:
                res_data = resp.json()
                text_content = res_data['candidates'][0]['content']['parts'][0]['text']
                # extract json block
                start_idx = text_content.find('{')
                end_idx = text_content.rfind('}') + 1
                if start_idx != -1 and end_idx != -1:
                    json_str = text_content[start_idx:end_idx]
                    parsed = json.loads(json_str)
                    return parsed
        return {}

    def _evaluate_heuristic(
        self,
        question: str,
        transcript: str,
        role: str,
        experience: str,
        difficulty: str,
        interview_type: str
    ) -> Dict[str, Any]:
        word_count = len(transcript.split())
        words = transcript.lower().split()
        
        # Keywords detection based on interview type & role
        tech_terms = ["architecture", "design", "algorithm", "database", "pipeline", "model", "performance", "system", "scale", "optimize", "testing", "deploy", "code", "data", "api", "framework"]
        star_terms = ["situation", "task", "action", "result", "because", "achieved", "learned", "team", "challenge", "solved", "metrics", "improved"]
        
        has_tech = sum(1 for w in words if w in tech_terms)
        has_star = sum(1 for w in words if w in star_terms)

        # Base scores
        relevance = 7.5 if word_count >= 15 else 5.5
        clarity = 8.0 if word_count in range(25, 200) else (6.0 if word_count < 25 else 7.0)
        
        if interview_type.lower() == "technical":
            tech_acc = min(10.0, 6.0 + (has_tech * 0.8))
        else:
            tech_acc = 8.0

        structure = min(10.0, 6.0 + (has_star * 0.7))
        
        # Difficulty penalty / boost adjustment
        diff_adj = 0.0
        if difficulty.lower() == "hard":
            diff_adj = -0.5
        elif difficulty.lower() == "easy":
            diff_adj = 0.5

        overall_score = round(max(3.0, min(10.0, (relevance + clarity + tech_acc + structure) / 4.0 + diff_adj)), 1)

        strengths = []
        improvements = []

        if word_count > 30:
            strengths.append("Provided a detailed explanation with good length.")
        else:
            improvements.append("Expand on your answers by providing specific examples and context.")

        if has_tech > 0 or interview_type.lower() == "technical":
            strengths.append(f"Demonstrated domain familiarity relevant to {role}.")
        
        if has_star > 0:
            strengths.append("Used practical, action-oriented wording to explain outcomes.")
        else:
            improvements.append("Structure your response using the STAR method (Situation, Task, Action, Result).")

        if len(strengths) == 0:
            strengths.append("Direct answer to the question.")
        if len(improvements) == 0:
            improvements.append("Quantify results with specific numbers or metrics where possible.")

        follow_up = overall_score < 7.5 or "project" in question.lower() or "challenge" in question.lower()

        sample_answer = (
            f"When addressing this scenario in a {role} role, I recommend organizing your answer as follows: "
            f"First state the primary requirement or objective, describe your specific technical/operational strategy, "
            f"and conclude with the quantifiable impact or lesson learned."
        )

        return {
            "score": overall_score,
            "relevance": round(min(10.0, max(1.0, relevance + diff_adj)), 1),
            "clarity": round(min(10.0, max(1.0, clarity)), 1),
            "technical_accuracy": round(min(10.0, max(1.0, tech_acc)), 1),
            "structure": round(min(10.0, max(1.0, structure)), 1),
            "strengths": strengths,
            "improvements": improvements,
            "follow_up_needed": follow_up,
            "sample_improved_answer": sample_answer
        }


answer_evaluator = AnswerEvaluator()
