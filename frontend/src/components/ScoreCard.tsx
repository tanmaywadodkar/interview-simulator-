import React from 'react';
import { Trophy } from 'lucide-react';

interface ScoreCardProps {
  overallScore: number;
  role: string;
  interviewType: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ overallScore, role, interviewType }) => {
  return (
    <div className="bg-white rounded p-6 border border-[#D9D9D4] flex flex-col md:flex-row items-center justify-between gap-6 shadow-strata">
      
      {/* Left Details */}
      <div className="space-y-2 text-center md:text-left">
        <div className="inline-block text-xs uppercase tracking-widest font-bold text-[#2F6B5F] border-b border-[#2F6B5F] pb-0.5">
          Interview Performance Report
        </div>
        <h2 className="text-2xl sm:text-3xl font-normal text-[#202124] tracking-tight">
          Performance Assessment
        </h2>
        <p className="text-xs sm:text-sm text-[#6B6B6B]">
          Target Role: <span className="text-[#202124] font-semibold">{role}</span> ({interviewType} Assessment)
        </p>
      </div>

      {/* Main Score Presentation */}
      <div className="flex items-center gap-4">
        <div className="w-32 h-32 rounded border border-[#D9D9D4] bg-[#F5F5F3] flex flex-col items-center justify-center p-2">
          <span className="text-4xl font-extrabold text-[#202124] tracking-tight font-sans">
            {overallScore}
          </span>
          <span className="text-[11px] uppercase tracking-widest font-semibold text-[#6B6B6B] mt-1">
            Out of 100
          </span>
        </div>
      </div>
    </div>
  );
};
