import React, { useState } from 'react';
import { ScoreCard } from '../components/ScoreCard';
import { PerformanceReport } from '../types/interview';
import { CheckCircle2, AlertTriangle, Lightbulb, ChevronDown, ChevronUp, ArrowLeft, BarChart2, Eye, Mic, Activity, Info, Video, Layers, Hand } from 'lucide-react';

interface ReportPageProps {
  report: PerformanceReport;
  onBackToSetup: () => void;
  onViewHistory: () => void;
}

export const ReportPage: React.FC<ReportPageProps> = ({ report, onBackToSetup, onViewHistory }) => {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(
    report.questions_detail[0]?.question_id || null
  );

  const toggleExpand = (id: string) => {
    setExpandedQuestion((prev) => (prev === id ? null : id));
  };

  const cats = report.category_scores;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* Navigation Top Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToSetup}
          className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Start New Interview
        </button>

        <button
          onClick={onViewHistory}
          className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          View Interview History
        </button>
      </div>

      {/* OVERALL SCORE CARD */}
      <ScoreCard
        overallScore={report.overall_score}
        role={report.role}
        interviewType={report.interview_type}
      />

      {/* DISTINCT 5-CATEGORY SCORECARDS */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" /> Distinct Assessment Categories
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="glass-card p-4 rounded-2xl border border-indigo-500/30 text-center space-y-1">
            <span className="text-[11px] font-medium text-indigo-300 block">Interview Performance</span>
            <span className="text-2xl font-extrabold text-indigo-400">
              {cats.interview_performance || report.overall_score}/100
            </span>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-800 text-center space-y-1">
            <span className="text-[11px] font-medium text-slate-400 block">Answer Quality</span>
            <span className="text-2xl font-extrabold text-blue-400">
              {cats.answer_quality}/100
            </span>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-800 text-center space-y-1">
            <span className="text-[11px] font-medium text-slate-400 block">Technical Knowledge</span>
            <span className="text-2xl font-extrabold text-emerald-400">
              {cats.technical_knowledge}/100
            </span>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-800 text-center space-y-1">
            <span className="text-[11px] font-medium text-slate-400 block">Communication</span>
            <span className="text-2xl font-extrabold text-purple-400">
              {cats.communication}/100
            </span>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-800 text-center space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium text-slate-400 block">Visual Presentation</span>
            <span className="text-2xl font-extrabold text-amber-400">
              {cats.visual_presentation}/100
            </span>
          </div>
        </div>
      </div>

      {/* AI SUMMARY & TOP RECOMMENDATION */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* AI Executive Summary */}
        <div className="md:col-span-7 glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" /> AI Interviewer Executive Summary
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            "{report.ai_interviewer_summary}"
          </p>
        </div>

        {/* Top Recommendation */}
        <div className="md:col-span-5 glass-panel rounded-2xl p-6 border border-amber-500/30 bg-amber-500/5 space-y-3">
          <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" /> Most Important Improvement
          </h3>
          <p className="text-xs sm:text-sm text-amber-200/90 font-medium leading-relaxed">
            {report.most_important_improvement}
          </p>
        </div>
      </div>

      {/* STRENGTHS & IMPROVEMENTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* What You Did Well */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> What You Did Well
          </h3>
          <ul className="space-y-2.5">
            {report.what_you_did_well.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What You Should Improve */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" /> What You Should Improve
          </h3>
          <ul className="space-y-2.5">
            {report.what_you_should_improve.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* FINAL COMMUNICATION PERFORMANCE REPORT */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" /> Communication & Visual Performance
          </h3>
          {report.communication_metrics.is_simulated_demo && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold flex items-center gap-1">
              <Info className="w-3 h-3" /> Estimated / Demo Analysis
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1">
              <Eye className="w-3.5 h-3.5 text-blue-400" /> Eye Contact
            </span>
            <span className="text-lg font-bold text-white">
              {report.communication_metrics.eye_contact_percentage}%
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1">
              <Mic className="w-3.5 h-3.5 text-indigo-400" /> Speaking Pace
            </span>
            <span className="text-lg font-bold text-white">
              ~{report.communication_metrics.speaking_speed_wpm} WPM
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1">
              <Mic className="w-3.5 h-3.5 text-rose-400" /> Filler Words
            </span>
            <span className="text-lg font-bold text-white">
              {report.communication_metrics.filler_words_count}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1">
              <Hand className="w-3.5 h-3.5 text-purple-400" /> Hand Movement
            </span>
            <span className="text-lg font-bold text-white">
              {report.communication_metrics.hand_movement_intensity}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1">
              <Video className="w-3.5 h-3.5 text-emerald-400" /> Face Visibility
            </span>
            <span className="text-lg font-bold text-white">
              {report.communication_metrics.face_visibility_percentage}%
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1">
              <Activity className="w-3.5 h-3.5 text-amber-400" /> Posture Alignment
            </span>
            <span className="text-lg font-bold text-white">
              {report.communication_metrics.posture_status}
            </span>
          </div>
        </div>
      </div>

      {/* QUESTION-BY-QUESTION DETAILED BREAKDOWN */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white">Question-by-Question Breakdown</h3>

        <div className="space-y-4">
          {report.questions_detail.map((q) => {
            const isExpanded = expandedQuestion === q.question_id;
            return (
              <div
                key={q.question_id}
                className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden transition-all"
              >
                {/* Header Row */}
                <button
                  onClick={() => toggleExpand(q.question_id)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-900/60 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-400">Question {q.order}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {q.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-100">{q.question}</h4>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-sm font-extrabold text-emerald-400 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      {q.score} / 10
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 space-y-4 text-xs">
                    
                    {/* Candidate Transcript */}
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Your Answer Transcript:</span>
                      <p className="p-3 rounded-lg bg-slate-950 text-slate-200 italic font-sans leading-relaxed">
                        "{q.transcript}"
                      </p>
                    </div>

                    {/* Content Evaluation Scores */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-medium">
                      <div className="p-2 rounded-lg bg-slate-950">Relevance: <span className="text-white font-bold">{q.relevance}/10</span></div>
                      <div className="p-2 rounded-lg bg-slate-950">Clarity: <span className="text-white font-bold">{q.clarity}/10</span></div>
                      <div className="p-2 rounded-lg bg-slate-950">Technical Accuracy: <span className="text-white font-bold">{q.technical_accuracy}/10</span></div>
                      <div className="p-2 rounded-lg bg-slate-950">Structure: <span className="text-white font-bold">{q.structure}/10</span></div>
                    </div>

                    {/* Question-Specific Communication Breakdown */}
                    {q.communication && (
                      <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 space-y-2">
                        <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-indigo-400" /> Question Communication Metrics:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 text-[11px]">
                          <div>Pace: <span className="font-bold text-white">{q.communication.words_per_minute} WPM ({q.communication.speaking_pace_rating})</span></div>
                          <div>Fillers: <span className="font-bold text-white">{q.communication.filler_words_count} ({q.communication.filler_words_found.join(', ') || 'None'})</span></div>
                          <div>Eye Contact: <span className="font-bold text-white">~{q.communication.eye_contact_percentage}%</span></div>
                          <div>Posture: <span className="font-bold text-white">{q.communication.posture_status}</span></div>
                        </div>
                      </div>
                    )}

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                        <span className="font-bold text-emerald-400">Key Strength:</span>
                        <ul className="list-disc list-inside text-slate-300 space-y-1">
                          {q.strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>

                      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1">
                        <span className="font-bold text-amber-400">Improvement Suggestion:</span>
                        <ul className="list-disc list-inside text-slate-300 space-y-1">
                          {q.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                        </ul>
                      </div>
                    </div>

                    {/* Sample Improved Answer */}
                    <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 space-y-1">
                      <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-indigo-400" /> Example Ideal Response:
                      </span>
                      <p className="text-slate-300 leading-relaxed font-sans">
                        {q.sample_improved_answer}
                      </p>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <button
          onClick={onBackToSetup}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all"
        >
          Practice Another Interview
        </button>

        <button
          onClick={onViewHistory}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
        >
          View Dashboard & History
        </button>
      </div>

    </div>
  );
};
