import React, { useState, useEffect } from 'react';
import { History, Calendar, Award, Trash2, ArrowRight, Play, ShieldAlert, Sparkles } from 'lucide-react';
import { getInterviewHistory, getPerformanceReport, deleteInterview } from '../services/api';
import { PerformanceReport } from '../types/interview';

interface HistoryPageProps {
  onSelectReport: (report: PerformanceReport) => void;
  onStartNew: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onSelectReport, onStartNew }) => {
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const data = await getInterviewHistory();
      setHistoryList(data);
    } catch (err: any) {
      setError('Failed to load interview history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleOpenReport = async (interviewId: string) => {
    try {
      const report = await getPerformanceReport(interviewId);
      onSelectReport(report);
    } catch (err) {
      alert('Could not load report details.');
    }
  };

  const handleDelete = async (e: React.MouseEvent, interviewId: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this interview record permanently from your local SQLite database?')) {
      try {
        await deleteInterview(interviewId);
        setHistoryList((prev) => prev.filter((item) => item.id !== interviewId));
      } catch (err) {
        alert('Failed to delete interview session.');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5" /> INTERVIEW RECORDS
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Interview History & Analytics</h1>
          <p className="text-xs text-slate-400">Review past interview performances and track score progression</p>
        </div>

        <button
          onClick={onStartNew}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Start New Interview</span>
        </button>
      </div>

      {/* History List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Loading past interview sessions...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-center text-xs">
          {error}
        </div>
      ) : historyList.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-4 border border-slate-800">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Interview History Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You haven't completed any interview sessions yet. Start your first dynamic AI interview session today!
          </p>
          <button
            onClick={onStartNew}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg inline-flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" /> Start Practice Interview
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {historyList.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenReport(item.id)}
              className="glass-card p-5 rounded-2xl border border-slate-800/80 hover:border-indigo-500/50 cursor-pointer transition-all hover:scale-[1.01] group flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                    {item.role}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                      {item.interview_type}
                    </span>
                    <span>• {item.difficulty}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-extrabold text-emerald-400 block font-sans">
                    {item.overall_score > 0 ? `${item.overall_score}/100` : 'In Progress'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{item.started_at ? new Date(item.started_at).toLocaleDateString() : 'Recent'}</span>
                  <span>({item.total_questions} Questions)</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Interview Privacy Data"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <span className="text-indigo-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Report <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
