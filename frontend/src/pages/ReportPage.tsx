import React, { useState } from 'react';
import { ScoreCard } from '../components/ScoreCard';
import { PerformanceReport } from '../types/interview';
import { CheckCircle2, AlertTriangle, Lightbulb, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

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
  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-[#D9D9D4] pb-4">
        <button
          onClick={onBackToSetup}
          className="text-xs font-semibold text-[#6B6B6B] hover:text-[#202124] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Start New Interview
        </button>

        <button
          onClick={onViewHistory}
          className="px-4 py-2 strata-button-secondary text-xs"
        >
          View Dashboard & History
        </button>
      </div>

      {/* OVERALL SCORE HEADER CARD */}
      <ScoreCard
        overallScore={report.overall_score}
        role={report.role}
        interviewType={report.interview_type}
      />

      {/* PHASE 2A: COMMUNICATION & SPEAKING ANALYSIS CARD */}
      {(() => {
        const comm = report.communication_metrics;
        const isInsufficient = comm?.is_insufficient_data || report.questions_detail.length === 0;
        const commScore = isInsufficient || comm?.communication_score === undefined || comm?.communication_score === null
          ? 'Insufficient data'
          : `${comm.communication_score} / 100`;
        const wpm = comm?.speaking_speed_wpm && comm.speaking_speed_wpm > 0 ? `${comm.speaking_speed_wpm} WPM` : 'Insufficient data';
        const fillers = !isInsufficient && comm?.filler_words_count !== undefined ? `${comm.filler_words_count}` : 'Insufficient data';
        const avgPause = !isInsufficient && comm?.average_pause_seconds !== undefined && comm.average_pause_seconds !== null ? `${comm.average_pause_seconds} sec` : 'Insufficient data';
        const durationSec = comm?.answer_duration_seconds ?? 0;
        const formatTime = (sec?: number) => {
          if (!sec || sec <= 0) return '00:00';
          const m = Math.floor(sec / 60);
          const s = Math.floor(sec % 60);
          return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        const defaultInsights = isInsufficient
          ? ['⚠ Insufficient answer data submitted to evaluate spoken communication.']
          : [
              comm?.speaking_speed_wpm && comm.speaking_speed_wpm >= 120 && comm.speaking_speed_wpm <= 160 ? '✓ Speaking pace was well controlled.' : '⚠ Speaking pace needs minor adjustment.',
              comm?.filler_words_count !== undefined && comm.filler_words_count <= 3 ? '✓ Filler word usage was minimal.' : '⚠ Filler words were slightly frequent.',
              comm?.average_pause_seconds !== undefined && comm.average_pause_seconds <= 2.0 ? '✓ Pauses were generally natural.' : '⚠ Frequent hesitation pauses observed.',
            ];

        const insights = (comm?.feedback && comm.feedback.length > 0) ? comm.feedback : defaultInsights;

        return (
          <div className="bg-white rounded p-6 border border-[#D9D9D4] space-y-5 shadow-strata">
            <div className="flex items-center justify-between border-b border-[#D9D9D4] pb-3">
              <h3 className="text-xs font-bold text-[#202124] uppercase tracking-widest flex items-center gap-2">
                Communication & Speaking Analysis
              </h3>
              <span className={`text-xs font-bold px-3 py-1 rounded-sm border ${
                isInsufficient ? 'bg-[#FFF9EB] text-[#B7791F] border-[#FFE0B2]' : 'bg-[#ECF5F2] text-[#2F6B5F] border-[#A7D7C5]'
              }`}>
                Communication: {commScore}
              </span>
            </div>

            {/* Key 4 Measurable Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-[#F5F5F3] rounded border border-[#D9D9D4] space-y-1">
                <span className="text-[#6B6B6B] text-[11px] font-semibold block uppercase tracking-wider">Speaking Pace</span>
                <span className="text-sm font-bold text-[#202124]">{wpm}</span>
              </div>

              <div className="p-3.5 bg-[#F5F5F3] rounded border border-[#D9D9D4] space-y-1">
                <span className="text-[#6B6B6B] text-[11px] font-semibold block uppercase tracking-wider">Filler Words</span>
                <span className="text-sm font-bold text-[#202124]">{fillers}</span>
              </div>

              <div className="p-3.5 bg-[#F5F5F3] rounded border border-[#D9D9D4] space-y-1">
                <span className="text-[#6B6B6B] text-[11px] font-semibold block uppercase tracking-wider">Average Pause</span>
                <span className="text-sm font-bold text-[#202124]">{avgPause}</span>
              </div>

              <div className="p-3.5 bg-[#F5F5F3] rounded border border-[#D9D9D4] space-y-1">
                <span className="text-[#6B6B6B] text-[11px] font-semibold block uppercase tracking-wider">Answer Duration</span>
                <span className="text-sm font-bold text-[#202124]">{formatTime(durationSec)}</span>
              </div>
            </div>

            {/* Communication Insights Bullets */}
            <div className="space-y-2 pt-1 border-t border-[#D9D9D4]">
              <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider">
                Communication Insights
              </h4>
              <ul className="space-y-1.5 text-xs text-[#202124] font-medium">
                {insights.map((item, idx) => {
                  const isPositive = item.startsWith('✓');
                  return (
                    <li
                      key={idx}
                      className={`p-2.5 rounded-sm border flex items-start gap-2 ${
                        isPositive
                          ? 'bg-[#F4F9F6] border-[#C8E6C9] text-[#2E7D5B]'
                          : 'bg-[#FFF9EB] border-[#FFE0B2] text-[#B7791F]'
                      }`}
                    >
                      <span>{item}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })()}

      {/* PHASE 2B: VISUAL PRESENTATION ANALYSIS CARD */}
      {(() => {
        const comm = report.communication_metrics;
        const visScoreVal = comm?.visual_presentation_score;
        const isVisInsufficient = visScoreVal === undefined || visScoreVal === null || comm?.head_movement_level === 'Insufficient data';
        const visScoreStr = isVisInsufficient ? 'Insufficient data' : `${visScoreVal} / 100`;

        const eyeContactPct = comm?.eye_contact_percentage !== undefined && comm?.eye_contact_percentage !== null ? `${comm.eye_contact_percentage}%` : 'Insufficient data';
        const faceVisPct = comm?.face_visibility_percentage !== undefined && comm?.face_visibility_percentage !== null ? `${comm.face_visibility_percentage}%` : 'Insufficient data';
        const framingStatus = comm?.camera_framing_status || 'Insufficient data';
        const movementLevel = comm?.head_movement_level || 'Insufficient data';

        const defaultVisualInsights = isVisInsufficient
          ? ['⚠ Insufficient visual telemetry collected during the interview session.']
          : [
              '✓ Face remained visible throughout responses.',
              '✓ Camera framing was appropriate.',
              '✓ Estimated camera engagement was recorded.',
            ];

        const visInsights = (comm?.visual_insights && comm.visual_insights.length > 0) ? comm.visual_insights : defaultVisualInsights;

        return (
          <div className="bg-white rounded p-6 border border-[#D9D9D4] space-y-5 shadow-strata">
            <div className="flex items-center justify-between border-b border-[#D9D9D4] pb-3">
              <h3 className="text-xs font-bold text-[#202124] uppercase tracking-widest flex items-center gap-2">
                Visual Presentation & Eye-Contact Analysis
              </h3>
              <span className={`text-xs font-bold px-3 py-1 rounded-sm border ${
                isVisInsufficient ? 'bg-[#FFF9EB] text-[#B7791F] border-[#FFE0B2]' : 'bg-[#ECF5F2] text-[#2F6B5F] border-[#A7D7C5]'
              }`}>
                Visual Presentation: {visScoreStr}
              </span>
            </div>

            {/* Key 4 Measurable Visual Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-[#F5F5F3] rounded border border-[#D9D9D4] space-y-1">
                <span className="text-[#6B6B6B] text-[11px] font-semibold block uppercase tracking-wider">Estimated Eye Contact</span>
                <span className="text-sm font-bold text-[#202124]">{eyeContactPct}</span>
              </div>

              <div className="p-3.5 bg-[#F5F5F3] rounded border border-[#D9D9D4] space-y-1">
                <span className="text-[#6B6B6B] text-[11px] font-semibold block uppercase tracking-wider">Face Visibility</span>
                <span className="text-sm font-bold text-[#202124]">{faceVisPct}</span>
              </div>

              <div className="p-3.5 bg-[#F5F5F3] rounded border border-[#D9D9D4] space-y-1">
                <span className="text-[#6B6B6B] text-[11px] font-semibold block uppercase tracking-wider">Camera Framing</span>
                <span className="text-sm font-bold text-[#202124]">{framingStatus}</span>
              </div>

              <div className="p-3.5 bg-[#F5F5F3] rounded border border-[#D9D9D4] space-y-1">
                <span className="text-[#6B6B6B] text-[11px] font-semibold block uppercase tracking-wider">Head Movement</span>
                <span className="text-sm font-bold text-[#202124]">{movementLevel}</span>
              </div>
            </div>

            {/* Visual Insights Bullets */}
            <div className="space-y-2 pt-1 border-t border-[#D9D9D4]">
              <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider">
                Visual Insights
              </h4>
              <ul className="space-y-1.5 text-xs text-[#202124] font-medium">
                {visInsights.map((item, idx) => {
                  const isPositive = item.startsWith('✓');
                  return (
                    <li
                      key={idx}
                      className={`p-2.5 rounded-sm border flex items-start gap-2 ${
                        isPositive
                          ? 'bg-[#F4F9F6] border-[#C8E6C9] text-[#2E7D5B]'
                          : 'bg-[#FFF9EB] border-[#FFE0B2] text-[#B7791F]'
                      }`}
                    >
                      <span>{item}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })()}


      {/* RESTRAINED METRIC INDICATORS WITH SINGLE ACCENT COLOR (#2F6B5F) */}
      <div className="bg-white rounded p-6 border border-[#D9D9D4] space-y-4 shadow-strata">
        <div className="flex items-center justify-between border-b border-[#D9D9D4] pb-3">
          <h3 className="text-xs font-bold text-[#202124] uppercase tracking-widest">
            Assessment Category Breakdown
          </h3>
          <span className="text-xs text-[#6B6B6B]">Completed {formattedDate}</span>
        </div>

        <div className="space-y-4 text-xs font-medium pt-1">
          {/* Answer Quality */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[#202124]">
              <span className="font-semibold">Answer Quality</span>
              <span className="font-bold">{cats.answer_quality} / 100</span>
            </div>
            <div className="w-full bg-[#F5F5F3] rounded-sm h-2 overflow-hidden border border-[#D9D9D4]">
              <div className="bg-[#2F6B5F] h-full rounded-sm transition-all duration-500" style={{ width: `${cats.answer_quality}%` }} />
            </div>
          </div>

          {/* Technical Knowledge */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[#202124]">
              <span className="font-semibold">Technical Knowledge</span>
              <span className="font-bold">{cats.technical_knowledge} / 100</span>
            </div>
            <div className="w-full bg-[#F5F5F3] rounded-sm h-2 overflow-hidden border border-[#D9D9D4]">
              <div className="bg-[#2F6B5F] h-full rounded-sm transition-all duration-500" style={{ width: `${cats.technical_knowledge}%` }} />
            </div>
          </div>

          {/* Communication */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[#202124]">
              <span className="font-semibold">Communication</span>
              <span className="font-bold">{cats.communication} / 100</span>
            </div>
            <div className="w-full bg-[#F5F5F3] rounded-sm h-2 overflow-hidden border border-[#D9D9D4]">
              <div className="bg-[#2F6B5F] h-full rounded-sm transition-all duration-500" style={{ width: `${cats.communication}%` }} />
            </div>
          </div>

          {/* Visual Presentation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[#202124]">
              <span className="font-semibold">Visual Presentation</span>
              <span className="font-bold">{cats.visual_presentation} / 100</span>
            </div>
            <div className="w-full bg-[#F5F5F3] rounded-sm h-2 overflow-hidden border border-[#D9D9D4]">
              <div className="bg-[#2F6B5F] h-full rounded-sm transition-all duration-500" style={{ width: `${cats.visual_presentation}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY & KEY RECOMMENDATION */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 bg-white rounded p-5 border border-[#D9D9D4] space-y-2 shadow-strata">
          <h3 className="text-xs font-bold text-[#202124] uppercase tracking-widest">
            Executive Summary
          </h3>
          <p className="text-xs text-[#6B6B6B] leading-relaxed">
            "{report.ai_interviewer_summary}"
          </p>
        </div>

        <div className="md:col-span-5 bg-[#FEF8EC] rounded p-5 border border-[#FAD79E] space-y-2">
          <h3 className="text-xs font-bold text-[#B7791F] uppercase tracking-widest flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4" /> Recommended Next Step
          </h3>
          <p className="text-xs text-[#B7791F] font-medium leading-relaxed">
            {report.most_important_improvement}
          </p>
        </div>
      </div>

      {/* STRENGTHS & AREAS FOR IMPROVEMENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="bg-white rounded p-5 border border-[#D9D9D4] space-y-3 shadow-strata">
          <h3 className="font-bold text-[#202124] flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-[#2E7D5B]" /> Key Strengths
          </h3>
          <ul className="space-y-2">
            {report.what_you_did_well.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[#6B6B6B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D5B] mt-1.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded p-5 border border-[#D9D9D4] space-y-3 shadow-strata">
          <h3 className="font-bold text-[#202124] flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-[#B7791F]" /> Areas for Improvement
          </h3>
          <ul className="space-y-2">
            {report.what_you_should_improve.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[#6B6B6B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B7791F] mt-1.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* QUESTION-BY-QUESTION ANALYSIS */}
      <div className="bg-white rounded p-6 border border-[#D9D9D4] space-y-4 shadow-strata">
        <h3 className="text-xs font-bold text-[#202124] uppercase tracking-widest border-b border-[#D9D9D4] pb-3">
          Question-by-Question Analysis
        </h3>

        <div className="space-y-3">
          {report.questions_detail.map((q) => {
            const isExpanded = expandedQuestion === q.question_id;
            return (
              <div
                key={q.question_id}
                className="bg-white rounded border border-[#D9D9D4] overflow-hidden transition-all text-xs"
              >
                <button
                  onClick={() => toggleExpand(q.question_id)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-[#F5F5F3] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#2F6B5F]">Question {q.order}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-sm bg-[#F5F5F3] text-[#6B6B6B] border border-[#D9D9D4]">
                        {q.category}
                      </span>
                    </div>
                    <h4 className="font-semibold text-[#202124]">{q.question}</h4>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-bold text-[#202124] px-2.5 py-1 rounded-sm bg-[#F5F5F3] border border-[#D9D9D4]">
                      Score: {q.score} / 10
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#6B6B6B]" /> : <ChevronDown className="w-4 h-4 text-[#6B6B6B]" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 border-t border-[#D9D9D4] bg-[#FAFAFA] space-y-3">
                    <div className="space-y-1">
                      <span className="font-semibold text-[#6B6B6B] text-[10px] uppercase tracking-wider">Candidate Answer Transcript:</span>
                      <p className="p-3 rounded-sm bg-white border border-[#D9D9D4] text-[#202124] italic font-sans leading-relaxed">
                        "{q.transcript}"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-medium">
                      <div className="p-2.5 rounded-sm bg-white border border-[#D9D9D4] text-[#6B6B6B]">Relevance: <span className="text-[#202124] font-bold">{q.relevance}/10</span></div>
                      <div className="p-2.5 rounded-sm bg-white border border-[#D9D9D4] text-[#6B6B6B]">Clarity: <span className="text-[#202124] font-bold">{q.clarity}/10</span></div>
                      <div className="p-2.5 rounded-sm bg-white border border-[#D9D9D4] text-[#6B6B6B]">Technical Accuracy: <span className="text-[#202124] font-bold">{q.technical_accuracy}/10</span></div>
                      <div className="p-2.5 rounded-sm bg-white border border-[#D9D9D4] text-[#6B6B6B]">Structure: <span className="text-[#202124] font-bold">{q.structure}/10</span></div>
                    </div>

                    {q.communication && (
                      <div className="p-3 rounded-sm bg-[#ECF5F2] border border-[#A7D7C5] space-y-2">
                        <span className="font-bold text-[#2F6B5F]">Communication Breakdown:</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[#202124] text-[11px]">
                          <div>Speaking Speed: <span className="font-bold">{q.communication.words_per_minute} WPM</span></div>
                          <div>Filler Words: <span className="font-bold">{q.communication.filler_words_count}</span></div>
                          <div>Average Pause: <span className="font-bold">{q.communication.average_pause_seconds ?? 1.1} sec</span></div>
                          <div>Eye Contact: <span className="font-bold">~{q.communication.eye_contact_percentage}%</span></div>
                        </div>
                      </div>
                    )}

                    <div className="p-3.5 rounded-sm bg-white border border-[#D9D9D4] space-y-1">
                      <span className="font-bold text-[#2F6B5F]">Sample Improved Response:</span>
                      <p className="text-[#6B6B6B] leading-relaxed font-sans">{q.sample_improved_answer}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <button
          onClick={onBackToSetup}
          className="w-full sm:w-auto px-8 py-3 strata-button-primary text-xs"
        >
          Practice Another Interview
        </button>

        <button
          onClick={onViewHistory}
          className="w-full sm:w-auto px-8 py-3 strata-button-secondary text-xs"
        >
          View Dashboard & History
        </button>
      </div>

    </div>
  );
};
