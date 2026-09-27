import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { InterviewSetupPayload, InterviewType, JobRole, ExperienceLevel, DifficultyLevel } from '../types/interview';

interface SetupPageProps {
  onStart: (payload: InterviewSetupPayload) => void;
  isLoading: boolean;
}

export const SetupPage: React.FC<SetupPageProps> = ({ onStart, isLoading }) => {
  const [interviewType, setInterviewType] = useState<InterviewType>('Technical');
  const [role, setRole] = useState<JobRole>('Software Engineer');
  const [customRole, setCustomRole] = useState('');
  const [experience, setExperience] = useState<ExperienceLevel>('Intermediate');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [totalQuestions, setTotalQuestions] = useState<number>(5);

  const [skills, setSkills] = useState('');
  const [projects, setProjects] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = role === 'Custom' ? (customRole.trim() || 'Custom Professional') : role;
    
    onStart({
      role: finalRole,
      interview_type: interviewType,
      experience,
      difficulty,
      total_questions: Number(totalQuestions),
      skills: skills.trim() || undefined,
      projects: projects.trim() || undefined,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="text-center space-y-2 border-b border-[#D9D9D4] pb-6">
        <span className="text-xs font-bold text-[#2F6B5F] uppercase tracking-widest">Session Configuration</span>
        <h1 className="text-3xl font-normal text-[#202124] tracking-tight">Set Up Your Interview</h1>
        <p className="text-xs text-[#6B6B6B] max-w-lg mx-auto">
          Configure role, difficulty, and optional profile background to tailor the AI interviewer questions.
        </p>
      </div>

      {/* Minimalist Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#D9D9D4] rounded p-6 sm:p-8 space-y-8 shadow-strata">
        
        {/* Field Group 1: Interview Type */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-[#202124] block">
            Interview Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(['Technical', 'HR', 'Behavioral', 'General'] as InterviewType[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setInterviewType(t)}
                className={`py-2.5 px-3 rounded-sm border text-xs font-semibold transition-all ${
                  interviewType === t
                    ? 'bg-[#2F6B5F] border-[#2F6B5F] text-white shadow-sm'
                    : 'bg-[#F5F5F3] border-[#D9D9D4] text-[#6B6B6B] hover:border-[#BFBFB8] hover:text-[#202124]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Field Group 2: Target Job Role */}
        <div className="space-y-3 border-t border-[#D9D9D4] pt-6">
          <label className="text-xs font-bold uppercase tracking-wider text-[#202124] block">
            Target Job Role
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {(['Software Engineer', 'Data Scientist', 'AI/ML Engineer', 'Web Developer', 'Custom'] as JobRole[]).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`py-2.5 px-3 rounded-sm border text-xs font-semibold transition-all ${
                  role === r
                    ? 'bg-[#2F6B5F] border-[#2F6B5F] text-white shadow-sm'
                    : 'bg-[#F5F5F3] border-[#D9D9D4] text-[#6B6B6B] hover:border-[#BFBFB8] hover:text-[#202124]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {role === 'Custom' && (
            <input
              type="text"
              placeholder="Enter custom role title (e.g., Cloud Architect)"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="w-full mt-2 strata-input px-3.5 py-2 text-xs"
              required
            />
          )}
        </div>

        {/* Field Group 3: Experience & Difficulty */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-[#D9D9D4] pt-6">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#202124] block">
              Experience Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Fresher', 'Beginner', 'Intermediate', 'Experienced'] as ExperienceLevel[]).map((exp) => (
                <button
                  type="button"
                  key={exp}
                  onClick={() => setExperience(exp)}
                  className={`py-2 px-3 rounded-sm border text-xs font-semibold transition-all ${
                    experience === exp
                      ? 'bg-[#2F6B5F] border-[#2F6B5F] text-white'
                      : 'bg-[#F5F5F3] border-[#D9D9D4] text-[#6B6B6B] hover:border-[#BFBFB8]'
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#202124] block">
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((diff) => (
                <button
                  type="button"
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`py-2 px-3 rounded-sm border text-xs font-semibold transition-all ${
                    difficulty === diff
                      ? 'bg-[#2F6B5F] border-[#2F6B5F] text-white'
                      : 'bg-[#F5F5F3] border-[#D9D9D4] text-[#6B6B6B] hover:border-[#BFBFB8]'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Field Group 4: Number of Questions */}
        <div className="space-y-3 border-t border-[#D9D9D4] pt-6">
          <label className="text-xs font-bold uppercase tracking-wider text-[#202124] block">
            Number of Questions
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[5, 10, 15].map((num) => (
              <button
                type="button"
                key={num}
                onClick={() => setTotalQuestions(num)}
                className={`py-2.5 px-3 rounded-sm border text-xs font-semibold transition-all ${
                  totalQuestions === num
                    ? 'bg-[#2F6B5F] border-[#2F6B5F] text-white shadow-sm'
                    : 'bg-[#F5F5F3] border-[#D9D9D4] text-[#6B6B6B] hover:border-[#BFBFB8]'
                }`}
              >
                {num} Questions (~{num * 3} mins)
              </button>
            ))}
          </div>
        </div>

        {/* Field Group 5: Optional Background Context */}
        <div className="border-t border-[#D9D9D4] pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[#202124] block">
              Optional Candidate Background
            </label>
            <span className="text-[11px] text-[#6B6B6B]">Improves technical question accuracy</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Key Technical Skills (e.g., Python, FastAPI, React)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="strata-input w-full px-3.5 py-2.5 text-xs"
            />
            <input
              type="text"
              placeholder="Key Projects (e.g., REST API backend)"
              value={projects}
              onChange={(e) => setProjects(e.target.value)}
              className="strata-input w-full px-3.5 py-2.5 text-xs"
            />
          </div>
        </div>

        {/* Primary CTA */}
        <div className="pt-4 border-t border-[#D9D9D4]">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 strata-button-primary text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Initializing Session...
              </span>
            ) : (
              <>
                <span>Continue to Camera Check</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
