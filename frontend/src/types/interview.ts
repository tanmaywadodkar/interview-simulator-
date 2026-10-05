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
  score: number | null;
  relevance: number | null;
  clarity: number | null;
  technical_accuracy: number | null;
  structure: number | null;
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
  speaking_speed_wpm?: number | null;
  filler_words_count?: number | null;
  eye_contact_percentage?: number;
  face_visibility_percentage?: number;
  hand_visibility_percentage?: number;
  hand_movement_intensity: string;
  posture_score?: number;
  posture_status: string;
  is_simulated_demo: boolean;
  communication_score?: number | null;
  average_pause_seconds?: number | null;
  longest_pause_seconds?: number | null;
  answer_duration_seconds?: number | null;
  feedback?: string[];
  visual_presentation_score?: number;
  camera_framing_status?: string;
  head_movement_level?: string;
  visual_insights?: string[];
  is_insufficient_data?: boolean;
  data_status?: string;
}

export interface QuestionCommunicationReport {
  eye_contact_percentage: number;
  face_visibility_percentage: number;
  words_per_minute?: number | null;
  speaking_pace_rating: string;
  filler_words_count?: number | null;
  filler_words_found: string[];
  hand_movement_intensity: string;
  posture_status: string;
  communication_score?: number | null;
  answer_duration_seconds?: number | null;
  average_pause_seconds?: number | null;
  longest_pause_seconds?: number | null;
  pause_behavior_type?: string;
  repetition_score?: number | null;
  feedback?: string[];
  visual_score?: number;
  camera_framing_status?: string;
}

export interface QuestionDetailReport {
  question_id: string;
  order: number;
  category: string;
  question: string;
  transcript: string;
  score: number | null;
  relevance: number | null;
  clarity: number | null;
  technical_accuracy: number | null;
  structure: number | null;
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
  analysis_available?: boolean;
  score_available?: boolean;
  multiple_faces_detected?: boolean;
  visual_score?: number;
  score_interpretation?: string;
  framing?: {
    status: string;
    position: string;
  };
  eye_contact?: {
    status: string;
    ratio: number;
  };
  head_pose_details?: {
    yaw: number;
    pitch: number;
    roll: number;
    yaw_deviation?: number;
    pitch_deviation?: number;
    roll_deviation?: number;
    classification: string;
  };
  head_movement?: {
    status?: string;
    level: string;
    movement_score?: number;
    orientation?: string;
    movement_state?: string;
    movement_event_active?: boolean;
    movement_event_count?: number;
    delta_yaw?: number;
    delta_pitch?: number;
    delta_roll?: number;
    delta_magnitude?: number;
    shake_count?: number;
    tilt_detected?: boolean;
    movement_events: number;
    max_yaw_deviation?: number;
    max_pitch_deviation?: number;
    max_roll_deviation?: number;
    avg_yaw_deviation?: number;
    avg_pitch_deviation?: number;
    avg_roll_deviation?: number;
  };
  feedback?: string[];
}

