import React from 'react';
import { Trophy, Star, CheckCircle, TrendingUp } from 'lucide-react';

interface ScoreCardProps {
  overallScore: number;
  role: string;
  interviewType: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ overallScore, role, interviewType }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 65) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
      
      {/* Left Details */}
      <div className="space-y-2 text-center md:text-left z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Trophy className="w-3.5 h-3.5" /> Performance Assessment Complete
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Overall Interview Score
        </h2>
        <p className="text-sm text-slate-400">
          Evaluated for <span className="text-slate-200 font-semibold">{role}</span> ({interviewType} Interview)
        </p>
      </div>

      {/* Main Score Circular Badge */}
      <div className="flex items-center gap-4 z-10">
        <div className={`w-32 h-32 rounded-3xl border-2 flex flex-col items-center justify-center p-2 shadow-2xl transition-transform hover:scale-105 ${getScoreColor(overallScore)}`}>
          <span className="text-4xl font-extrabold tracking-tight font-sans">
            {overallScore}
          </span>
          <span className="text-xs uppercase tracking-wider font-semibold opacity-80 mt-0.5">
            Out of 100
          </span>
        </div>
      </div>
    </div>
  );
};
