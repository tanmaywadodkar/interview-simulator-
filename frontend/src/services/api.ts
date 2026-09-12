import {
  InterviewSetupPayload,
  InterviewSession,
  AnswerEvaluation,
  PerformanceReport,
  FrameAnalysisResult
} from '../types/interview';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchHealthStatus() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function startInterview(payload: InterviewSetupPayload): Promise<InterviewSession> {
  const res = await fetch(`${API_BASE}/interview/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to start interview session');
  }
  return res.json();
}

export async function submitAnswer(interviewId: string, transcript: string): Promise<AnswerEvaluation> {
  const res = await fetch(`${API_BASE}/interview/${interviewId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to submit candidate answer');
  }
  return res.json();
}

export async function getNextQuestion(interviewId: string): Promise<{
  completed: boolean;
  current_question: InterviewSession['current_question'];
}> {
  const res = await fetch(`${API_BASE}/interview/${interviewId}/next-question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to get next question');
  }
  return res.json();
}

export async function finishInterview(interviewId: string): Promise<PerformanceReport> {
  const res = await fetch(`${API_BASE}/interview/${interviewId}/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to finish interview');
  }
  return res.json();
}

export async function getPerformanceReport(interviewId: string): Promise<PerformanceReport> {
  const res = await fetch(`${API_BASE}/interview/${interviewId}/report`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to load report');
  }
  return res.json();
}

export async function getInterviewHistory() {
  const res = await fetch(`${API_BASE}/interview/history`);
  if (!res.ok) throw new Error('Failed to load history');
  return res.json();
}

export async function deleteInterview(interviewId: string) {
  const res = await fetch(`${API_BASE}/interview/${interviewId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete interview session');
  return res.json();
}

export async function sendFrameAnalysis(interviewId: string, frameBase64: string): Promise<FrameAnalysisResult> {
  const res = await fetch(`${API_BASE}/analysis/frame`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interview_id: interviewId, frame_base64: frameBase64 }),
  });
  if (!res.ok) {
    throw new Error('Frame analysis request failed');
  }
  return res.json();
}
