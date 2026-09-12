import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PrivacyModal } from './components/PrivacyModal';
import { LandingPage } from './pages/LandingPage';
import { SetupPage } from './pages/SetupPage';
import { InterviewRoomPage } from './pages/InterviewRoomPage';
import { ReportPage } from './pages/ReportPage';
import { HistoryPage } from './pages/HistoryPage';
import { InterviewSetupPayload, InterviewSession, PerformanceReport } from './types/interview';
import { startInterview } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'setup' | 'interview' | 'report' | 'history'>('landing');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [currentReport, setCurrentReport] = useState<PerformanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartInterviewSession = async (payload: InterviewSetupPayload) => {
    try {
      setIsLoading(true);
      const session = await startInterview(payload);
      setCurrentSession(session);
      setActiveTab('interview');
    } catch (err: any) {
      alert(err.message || 'Could not start interview session. Ensure FastAPI backend is running on http://localhost:8000');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterviewFinished = (report: PerformanceReport) => {
    setCurrentReport(report);
    setActiveTab('report');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onNavigate={(tab) => setActiveTab(tab)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      {/* Main Page View router */}
      <main className="flex-1">
        {activeTab === 'landing' && (
          <LandingPage
            onStartInterview={() => setActiveTab('setup')}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
          />
        )}

        {activeTab === 'setup' && (
          <SetupPage
            onStart={handleStartInterviewSession}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'interview' && currentSession && (
          <InterviewRoomPage
            session={currentSession}
            onFinish={handleInterviewFinished}
          />
        )}

        {activeTab === 'report' && currentReport && (
          <ReportPage
            report={currentReport}
            onBackToSetup={() => setActiveTab('setup')}
            onViewHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPage
            onSelectReport={(report) => {
              setCurrentReport(report);
              setActiveTab('report');
            }}
            onStartNew={() => setActiveTab('setup')}
          />
        )}
      </main>

      {/* Global Footer */}
      <Footer onOpenPrivacy={() => setIsPrivacyOpen(true)} />

      {/* Privacy Notice Modal */}
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

    </div>
  );
}

export default App;
