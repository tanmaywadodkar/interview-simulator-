import React, { useState, useEffect } from 'react';
import { History, Calendar, Trash2, ArrowRight, Play } from 'lucide-react';
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
    if (window.confirm('Delete this interview record permanently from your local database?')) {
      try {
        await deleteInterview(interviewId);
        setHistoryList((prev) => prev.filter((item) => item.id !== interviewId));
      } catch (err) {
        alert('Failed to delete interview session.');
      }
    }
  };

  // Compute stats summary
  const completedSessions = historyList.filter((i) => i.overall_score > 0);
  const avgScore = completedSessions.length > 0 
    ? Math.round(completedSessions.reduce((acc, curr) => acc + curr.overall_score, 0) / completedSessions.length)
    : 0;
  const bestScore = completedSessions.length > 0
    ? Math.max(...completedSessions.map((i) => i.overall_score))
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#D9D9D4] pb-6">
        <div>
          <span className="text-xs font-bold text-[#2F6B5F] uppercase tracking-widest block mb-1">Candidate Dashboard</span>
          <h1 className="text-3xl font-normal text-[#202124] tracking-tight">Interview Performance History</h1>
          <p className="text-xs text-[#6B6B6B]">Review completed sessions, scores, and historical progress.</p>
        </div>

        <button
          onClick={onStartNew}
          className="px-5 py-2.5 strata-button-primary text-xs flex items-center gap-2"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Start New Interview</span>
        </button>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 border border-[#D9D9D4] rounded shadow-strata space-y-1">
          <span className="text-xs text-[#6B6B6B] uppercase tracking-wider font-semibold">Interviews Completed</span>
          <p className="text-3xl font-extrabold text-[#202124]">{completedSessions.length}</p>
        </div>

        <div className="bg-white p-5 border border-[#D9D9D4] rounded shadow-strata space-y-1">
          <span className="text-xs text-[#6B6B6B] uppercase tracking-wider font-semibold">Average Performance</span>
          <p className="text-3xl font-extrabold text-[#2F6B5F]">{avgScore > 0 ? `${avgScore} / 100` : '—'}</p>
        </div>

        <div className="bg-white p-5 border border-[#D9D9D4] rounded shadow-strata space-y-1">
          <span className="text-xs text-[#6B6B6B] uppercase tracking-wider font-semibold">Highest Score</span>
          <p className="text-3xl font-extrabold text-[#2E7D5B]">{bestScore > 0 ? `${bestScore} / 100` : '—'}</p>
        </div>
      </div>

      {/* Main Table / Recent Interviews */}
      {isLoading ? (
        <div className="py-20 text-center text-[#6B6B6B] space-y-3">
          <div className="w-8 h-8 border-2 border-[#2F6B5F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Loading past interview records...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded bg-[#FDF2F2] border border-[#F5C2C2] text-[#B54747] text-center text-xs font-medium">
          {error}
        </div>
      ) : historyList.length === 0 ? (
        <div className="bg-white rounded p-12 text-center space-y-4 border border-[#D9D9D4] shadow-strata">
          <div className="w-16 h-16 rounded-full bg-[#F5F5F3] border border-[#D9D9D4] flex items-center justify-center mx-auto text-[#6B6B6B]">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#202124]">No Interview Records Found</h3>
          <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
            You haven't completed any interview sessions yet. Start your first practice interview to track metrics over time.
          </p>
          <button
            onClick={onStartNew}
            className="px-6 py-3 strata-button-primary text-xs inline-flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" /> Start Practice Interview
          </button>
        </div>
      ) : (
        <div className="bg-white rounded border border-[#D9D9D4] overflow-hidden shadow-strata">
          <div className="px-6 py-4 border-b border-[#D9D9D4] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#202124] uppercase tracking-widest">Recent Sessions</h3>
            <span className="text-xs text-[#6B6B6B]">{historyList.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F3] text-[#6B6B6B] font-semibold uppercase tracking-wider border-b border-[#D9D9D4]">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Target Role</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Questions</th>
                  <th className="px-6 py-3">Overall Score</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D9D4] text-[#202124] font-medium">
                {historyList.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenReport(item.id)}
                    className="hover:bg-[#FAFAFA] cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-[#6B6B6B]">
                      {item.started_at ? new Date(item.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                    </td>
                    <td className="px-6 py-4 font-bold whitespace-nowrap">{item.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-sm bg-[#F5F5F3] border border-[#D9D9D4] text-[#6B6B6B] text-[11px]">
                        {item.interview_type} ({item.difficulty})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#6B6B6B]">{item.total_questions} Questions</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.overall_score > 0 ? (
                        <span className="font-bold text-[#2F6B5F] text-sm">{item.overall_score} / 100</span>
                      ) : (
                        <span className="text-[#B7791F] text-xs font-semibold">In Progress</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenReport(item.id)}
                          className="px-3 py-1.5 strata-button-secondary text-xs inline-flex items-center gap-1"
                        >
                          <span>View Report</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, item.id)}
                          className="p-1.5 text-[#6B6B6B] hover:text-[#B54747] transition-colors"
                          title="Delete Session Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
