export type InterviewType = 'HR' | 'Technical' | 'Behavioral' | 'General';
export type JobRole = 'Software Engineer' | 'Data Scientist' | 'AI/ML Engineer' | 'Web Developer' | 'Custom';
export type ExperienceLevel = 'Fresher' | 'Beginner' | 'Intermediate' | 'Experienced';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface InterviewSetupPayload {
  role: string;
  interview_type: InterviewType;
  experience: ExperienceLevel;
  difficulty: DifficultyLevel;
  total_questions: number;
  resume_summary?: string;
  skills?: string;
  projects?: string;
  job_description?: string;
}

export interface QuestionData {
  id: string;
  interview_id: string;
  question: string;
  order: number;
  category?: string;
}

export interface AnswerEvaluation {
  score: number;
  relevance: number;
  clarity: number;
  technical_accuracy: number;
  structure: number;
  strengths: string[];
  improvements: string[];
  follow_up_needed: boolean;
  sample_improved_answer?: string;
}

export interface InterviewSession {
  id: string;
  role: string;
  interview_type: InterviewType;
  experience: ExperienceLevel;
  difficulty: DifficultyLevel;
  total_questions: number;
  status: 'in_progress' | 'completed';
  current_question: QuestionData | null;
  overall_score?: number;
  started_at: string;
  completed_at?: string;
}

export interface CategoryScores {
  interview_performance: number;
  answer_quality: number;
  technical_knowledge: number;
  communication: number;
  visual_presentation: number;
}

export interface CommunicationMetrics {
  speaking_speed_wpm: number;
  filler_words_count: number;
  eye_contact_percentage: number;
  face_visibility_percentage: number;
  hand_visibility_percentage: number;
  hand_movement_intensity: string;
  posture_score: number;
  posture_status: string;
  is_simulated_demo: boolean;
}

export interface QuestionCommunicationReport {
  eye_contact_percentage: number;
  face_visibility_percentage: number;
  words_per_minute: number;
  speaking_pace_rating: string;
  filler_words_count: number;
  filler_words_found: string[];
  hand_movement_intensity: string;
  posture_status: string;
}

export interface QuestionDetailReport {
  question_id: string;
  order: number;
  category: string;
  question: string;
  transcript: string;
  score: number;
  relevance: number;
  clarity: number;
  technical_accuracy: number;
  structure: number;
  strengths: string[];
  improvements: string[];
  sample_improved_answer: string;
  communication: QuestionCommunicationReport;
}

export interface PerformanceReport {
  interview_id: string;
  role: string;
  interview_type: string;
  experience: string;
  difficulty: string;
  total_questions: number;
  completed_at: string;
  overall_score: number;
  category_scores: CategoryScores;
  what_you_did_well: string[];
  what_you_should_improve: string[];
  ai_interviewer_summary: string;
  most_important_improvement: string;
  questions_detail: QuestionDetailReport[];
  communication_metrics: CommunicationMetrics;
}

export interface FrameAnalysisResult {
  face_detected: boolean;
  face_count: number;
  face_center_x: number;
  face_center_y: number;
  head_pose: string;
  eye_contact_ratio: number;
  hand_movement_detected: boolean;
  posture_status: string;
  confidence_signal: number;
  is_demo: boolean;
}
