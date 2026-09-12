import json
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.utils.logger import logger


class AIInterviewerService:
    """
    Core AI Interviewer Service responsible for dynamically orchestrating dynamic follow-up 
    and role-specific questions based on interview history, candidate profile, and candidate answers.
    """

    async def generate_first_question(
        self,
        role: str,
        interview_type: str,
        experience: str,
        difficulty: str,
        resume_summary: Optional[str] = None,
        skills: Optional[str] = None,
        projects: Optional[str] = None,
        job_description: Optional[str] = None
    ) -> str:
        """
        Generate the tailored introductory question for the interview.
        """
        if not settings.is_demo_mode() and settings.AI_API_KEY:
            try:
                question = await self._generate_first_question_llm(
                    role, interview_type, experience, difficulty, resume_summary, skills, projects, job_description
                )
                if question:
                    return question
            except Exception as e:
                logger.warning(f"LLM First Question generation failed, falling back to smart engine: {str(e)}")

        return self._generate_first_question_smart(
            role, interview_type, experience, difficulty, resume_summary, skills, projects
        )

    async def generate_next_question(
        self,
        role: str,
        interview_type: str,
        experience: str,
        difficulty: str,
        current_step: int,
        total_questions: int,
        history: List[Dict[str, Any]],
        last_answer: str,
        last_question: str,
        last_evaluation: Optional[Dict[str, Any]] = None,
        resume_summary: Optional[str] = None,
        skills: Optional[str] = None,
        projects: Optional[str] = None
    ) -> str:
        """
        Dynamically determine the next question based on candidate's previous answer, current stage, and profile context.
        """
        if not settings.is_demo_mode() and settings.AI_API_KEY:
            try:
                question = await self._generate_next_question_llm(
                    role, interview_type, experience, difficulty, current_step, total_questions,
                    history, last_answer, last_question, last_evaluation, resume_summary, skills, projects
                )
                if question:
                    return question
            except Exception as e:
                logger.warning(f"LLM Next Question generation failed, falling back to smart engine: {str(e)}")

        return self._generate_next_question_smart(
            role, interview_type, experience, difficulty, current_step, total_questions,
            last_answer, last_question, last_evaluation, projects, skills
        )

    async def _generate_first_question_llm(
        self, role: str, interview_type: str, experience: str, difficulty: str,
        resume_summary: Optional[str], skills: Optional[str], projects: Optional[str], job_description: Optional[str]
    ) -> str:
        prompt = f"""
You are a top-tier senior AI interviewer conducting a realistic {interview_type} interview for a {experience} level candidate applying for the position of {role} (Difficulty: {difficulty}).

Candidate Info:
- Resume Summary: {resume_summary or 'Not provided'}
- Skills: {skills or 'Standard role skills'}
- Key Projects: {projects or 'Not specified'}
- Job Description: {job_description or 'Standard industry role'}

Generate ONLY the exact introductory question to ask the candidate to kick off the interview. Keep it direct, encouraging, and clear without extra preamble.
"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.AI_MODEL}:generateContent?key={settings.AI_API_KEY}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
            if resp.status_code == 200:
                res_data = resp.json()
                text = res_data['candidates'][0]['content']['parts'][0]['text'].strip()
                return text.replace('"', '')
        return ""

    async def _generate_next_question_llm(
        self, role: str, interview_type: str, experience: str, difficulty: str,
        current_step: int, total_questions: int, history: List[Dict[str, Any]],
        last_answer: str, last_question: str, last_evaluation: Optional[Dict[str, Any]],
        resume_summary: Optional[str], skills: Optional[str], projects: Optional[str]
    ) -> str:
        prompt = f"""
You are a senior interviewer conducting a {interview_type} interview for a {experience} {role} position.
Progress: Question {current_step} of {total_questions}.

Previous Question: "{last_question}"
Candidate Answer: "{last_answer}"
Answer Evaluation: {json.dumps(last_evaluation or {})}

Candidate context:
- Skills: {skills or 'N/A'}
- Projects: {projects or 'N/A'}

Rules:
1. Do NOT repeat previous questions.
2. If the candidate mentioned a specific tool, framework, dataset, algorithm, or scenario in their previous answer, ask a direct follow-up probing deeper into that specific detail.
3. If this is nearing the final questions (Question {total_questions}), ask a high-level situational, behavioral, or architectural closing question.
4. Output ONLY the question text.
"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.AI_MODEL}:generateContent?key={settings.AI_API_KEY}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
            if resp.status_code == 200:
                res_data = resp.json()
                text = res_data['candidates'][0]['content']['parts'][0]['text'].strip()
                return text.replace('"', '')
        return ""

    def _generate_first_question_smart(
        self, role: str, interview_type: str, experience: str, difficulty: str,
        resume_summary: Optional[str], skills: Optional[str], projects: Optional[str]
    ) -> str:
        if projects and len(projects.strip()) > 5:
            return f"Welcome! I see from your background that you worked on {projects.split(',')[0].strip()}. Could you walk me through the architectural decisions and key outcomes of that project?"
        
        if skills and len(skills.strip()) > 3:
            return f"Welcome to your {role} interview! Given your expertise in {skills.split(',')[0].strip()}, could you introduce yourself and highlight a recent project where you applied these skills?"

        role_lower = role.lower()
        if "data" in role_lower or "ml" in role_lower or "ai" in role_lower:
            return f"Welcome to your {interview_type} interview for the {role} role. To start, please introduce yourself and tell me about a recent machine learning or data pipeline project you developed."
        elif "web" in role_lower or "frontend" in role_lower or "fullstack" in role_lower:
            return f"Welcome! As a {role} candidate, could you introduce yourself and describe a web application you recently built, detailing your choice of tech stack?"
        else:
            return f"Welcome to your {interview_type} interview for the {role} position. Could you introduce yourself and walk me through your background and relevant technical experience?"

    def _generate_next_question_smart(
        self, role: str, interview_type: str, experience: str, difficulty: str,
        current_step: int, total_questions: int, last_answer: str, last_question: str,
        last_evaluation: Optional[Dict[str, Any]], projects: Optional[str], skills: Optional[str]
    ) -> str:
        ans_lower = last_answer.lower()
        q_lower = last_question.lower()

        # Dynamic follow-up keyword extraction
        if "model" in ans_lower or "dataset" in ans_lower or "classification" in ans_lower or "predict" in ans_lower:
            return "That's interesting. What dataset did you use, and how did you handle data preprocessing, class imbalance, or model evaluation metrics?"
        elif "api" in ans_lower or "backend" in ans_lower or "database" in ans_lower or "fastapi" in ans_lower:
            return "Could you elaborate on how you structured the database queries, handled authentication, and ensured low API latency under high traffic?"
        elif "react" in ans_lower or "frontend" in ans_lower or "ui" in ans_lower or "state" in ans_lower:
            return "Great. How did you manage application state, minimize re-renders, and optimize performance for a smooth user experience?"
        elif "team" in ans_lower or "conflict" in ans_lower or "deadline" in ans_lower or "stakeholder" in ans_lower:
            return "When unexpected requirement changes or tight deadlines occurred during that project, how did you reprioritize tasks and communicate with stakeholders?"
        elif "challenge" in ans_lower or "bug" in ans_lower or "issue" in ans_lower or "failed" in ans_lower:
            return "How did you systematically debug that problem, what tools did you use, and what measures did you put in place to prevent it from happening again?"

        # Stage-based dynamic progression
        if current_step == total_questions:
            return f"To wrap up our interview today, looking back at your career so far as a {role}, what is the most valuable lesson you've learned from a technical failure or difficult project?"
        elif current_step == total_questions - 1:
            return f"How do you stay updated with emerging technologies and tools in the {role} domain, and how do you evaluate whether to adopt a new technology in a production system?"
        elif "project" in q_lower or current_step == 2:
            return f"What was the single biggest technical challenge you encountered during implementation, and how did you solve it?"
        else:
            return f"How do you ensure code quality, test coverage, and smooth deployment when delivering software for a {experience} level {role} role?"


ai_interviewer_service = AIInterviewerService()
