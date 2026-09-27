import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PrivacyModal } from './components/PrivacyModal';
import { LandingPage } from './pages/LandingPage';
import { SetupPage } from './pages/SetupPage';
import { CameraCheckPage } from './pages/CameraCheckPage';
import { InterviewRoomPage } from './pages/InterviewRoomPage';
import { ReportPage } from './pages/ReportPage';
import { HistoryPage } from './pages/HistoryPage';
import { InterviewSetupPayload, InterviewSession, PerformanceReport } from './types/interview';
import { startInterview } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'setup' | 'camera_check' | 'interview' | 'report' | 'history'>('landing');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<InterviewSetupPayload | null>(null);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [currentReport, setCurrentReport] = useState<PerformanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSetupSubmit = (payload: InterviewSetupPayload) => {
    setPendingPayload(payload);
    setActiveTab('camera_check');
  };

  const handleCameraCheckContinue = async () => {
    if (!pendingPayload) return;
    try {
      setIsLoading(true);
      const session = await startInterview(pendingPayload);
      setCurrentSession(session);
      setActiveTab('interview');
    } catch (err: any) {
      alert(err.message || 'Could not start interview session. Ensure FastAPI backend is running on http://127.0.0.1:8000');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterviewFinished = (report: PerformanceReport) => {
    setCurrentReport(report);
    setActiveTab('report');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F3] text-[#202124] font-sans selection:bg-[#2F6B5F] selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab === 'camera_check' ? 'setup' : activeTab}
        onNavigate={(tab) => setActiveTab(tab)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'landing' && (
          <LandingPage
            onStartInterview={() => setActiveTab('setup')}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
          />
        )}

        {activeTab === 'setup' && (
          <SetupPage
            onStart={handleSetupSubmit}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'camera_check' && pendingPayload && (
          <CameraCheckPage
            role={pendingPayload.role}
            interviewType={pendingPayload.interview_type}
            onContinue={handleCameraCheckContinue}
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
