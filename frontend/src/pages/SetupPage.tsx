import React, { useState } from 'react';
import { Play, Sparkles, User, Briefcase, FileText, ChevronRight, Settings2, Code, Layers } from 'lucide-react';
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

  // Optional Candidate Context
  const [resumeSummary, setResumeSummary] = useState('');
  const [skills, setSkills] = useState('');
  const [projects, setProjects] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = role === 'Custom' ? (customRole.trim() || 'Custom Professional') : role;
    
    onStart({
      role: finalRole,
      interview_type: interviewType,
      experience,
      difficulty,
      total_questions: Number(totalQuestions),
      resume_summary: resumeSummary.trim() || undefined,
      skills: skills.trim() || undefined,
      projects: projects.trim() || undefined,
      job_description: jobDescription.trim() || undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Settings2 className="w-4 h-4" /> INTERVIEW CONFIGURATION
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Customize Your AI Interview
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Tailor the position, difficulty, and optional resume details so the AI interviewer asks relevant, real-world questions.
        </p>
      </div>

      {/* Main Setup Form */}
      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-8 shadow-2xl">
        
        {/* 1. INTERVIEW TYPE */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" /> 1. Select Interview Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['Technical', 'HR', 'Behavioral', 'General'] as InterviewType[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setInterviewType(t)}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  interviewType === t
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 2. JOB ROLE */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-400" /> 2. Target Job Role
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(['Software Engineer', 'Data Scientist', 'AI/ML Engineer', 'Web Developer', 'Custom'] as JobRole[]).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  role === r
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {role === 'Custom' && (
            <input
              type="text"
              placeholder="Enter custom job title (e.g. DevOps Engineer, Product Manager)"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          )}
        </div>

        {/* 3. EXPERIENCE LEVEL & DIFFICULTY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              3. Experience Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Fresher', 'Beginner', 'Intermediate', 'Experienced'] as ExperienceLevel[]).map((exp) => (
                <button
                  type="button"
                  key={exp}
                  onClick={() => setExperience(exp)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    experience === exp
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              4. Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((diff) => (
                <button
                  type="button"
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    difficulty === diff
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5. NUMBER OF QUESTIONS */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            5. Number of Questions
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[5, 10, 15].map((num) => (
              <button
                type="button"
                key={num}
                onClick={() => setTotalQuestions(num)}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  totalQuestions === num
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {num} Questions ({num * 3} mins approx)
              </button>
            ))}
          </div>
        </div>

        {/* OPTIONAL PROFILE CONTEXT */}
        <div className="border-t border-slate-800/80 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> Optional Profile Context
            </h3>
            <span className="text-xs text-slate-500">Helps AI generate deep technical questions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Key Technical Skills</label>
              <input
                type="text"
                placeholder="e.g. Python, FastAPI, React, PostgreSQL, Docker"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Key Projects</label>
              <input
                type="text"
                placeholder="e.g. E-commerce API backend, ML model for disease classification"
                value={projects}
                onChange={(e) => setProjects(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Resume Summary / Work Experience</label>
            <textarea
              rows={3}
              placeholder="Paste a short summary of your background, experience, or achievements..."
              value={resumeSummary}
              onChange={(e) => setResumeSummary(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Initializing AI Session...
              </span>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Begin AI Interview</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
