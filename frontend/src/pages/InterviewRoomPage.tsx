import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Camera, CameraOff, MessageSquare, PhoneOff, Send, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { InterviewSession, AnswerEvaluation, FrameAnalysisResult } from '../types/interview';
import { InterviewerAvatar } from '../components/InterviewerAvatar';
import { CameraFeed } from '../components/CameraFeed';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useCameraStream } from '../hooks/useCameraStream';
import { submitAnswer, getNextQuestion, finishInterview, sendFrameAnalysis } from '../services/api';

interface InterviewRoomPageProps {
  session: InterviewSession;
  onFinish: (report: any) => void;
}

export const InterviewRoomPage: React.FC<InterviewRoomPageProps> = ({ session, onFinish }) => {
  const [currentQuestion, setCurrentQuestion] = useState(session.current_question);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showEndModal, setShowEndModal] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<AnswerEvaluation | null>(null);
  const [showEvalToast, setShowEvalToast] = useState(false);
  const [manualText, setManualText] = useState('');
  const [analysisData, setAnalysisData] = useState<FrameAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    isListening,
    transcript,
    setTranscript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const {
    videoRef,
    stream,
    isCameraActive,
    error: cameraError,
    startCamera,
    stopCamera,
    captureFrameBase64,
  } = useCameraStream();

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Frame processing loop for vision analysis metrics
  useEffect(() => {
    if (!isCameraActive) return;

    const interval = setInterval(async () => {
      const frameBase64 = captureFrameBase64();
      if (frameBase64 && session.id) {
        try {
          const res = await sendFrameAnalysis(session.id, frameBase64);
          setAnalysisData(res);
        } catch (e) {
          // ignore transient frame failure
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isCameraActive, session.id, captureFrameBase64]);

  const fullCandidateAnswer = (transcript + ' ' + manualText).trim();

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSubmitAnswer = async () => {
    if (!fullCandidateAnswer) {
      setErrorMsg('Please speak into your microphone or type a response before submitting.');
      return;
    }

    if (isListening) stopListening();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const evalRes = await submitAnswer(session.id, fullCandidateAnswer);
      setLastEvaluation(evalRes);
      setShowEvalToast(true);

      const nextRes = await getNextQuestion(session.id);
      
      if (nextRes.completed || currentStep >= session.total_questions) {
        setTimeout(async () => {
          const report = await finishInterview(session.id);
          onFinish(report);
        }, 1500);
      } else if (nextRes.current_question) {
        setTimeout(() => {
          setCurrentQuestion(nextRes.current_question);
          setCurrentStep((prev) => prev + 1);
          resetTranscript();
          setManualText('');
          setIsAiSpeaking(true);
          setShowEvalToast(false);
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit response.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmEndInterview = async () => {
    if (isListening) stopListening();
    setIsSubmitting(true);
    setShowEndModal(false);
    try {
      const report = await finishInterview(session.id);
      onFinish(report);
    } catch (err) {
      console.error('Error ending interview:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 animate-fadeIn">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-white px-4 py-3 border border-[#D9D9D4] rounded-sm text-xs shadow-strata">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D5B]" />
          <span className="font-bold text-[#202124] text-sm">Interview Room</span>
          <span className="text-[#6B6B6B] hidden sm:inline">• {session.role} ({session.interview_type} Assessment)</span>
        </div>

        <div className="flex items-center gap-3 font-semibold text-[#202124]">
          <span className="px-2.5 py-1 bg-[#F5F5F3] border border-[#D9D9D4] rounded-sm">
            Question {currentStep} of {session.total_questions}
          </span>
        </div>
      </div>

      {/* Main Video-Call Layout Grid: Candidate Video Primary (70%), AI Interviewer Panel (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[460px]">
        
        {/* Candidate Live Video Container (Majority of Screen) */}
        <div className="lg:col-span-8 h-full">
          <CameraFeed
            videoRef={videoRef}
            stream={stream}
            isCameraActive={isCameraActive}
            onToggleCamera={isCameraActive ? stopCamera : startCamera}
            isListening={isListening}
            onToggleMic={handleToggleMic}
            analysisData={analysisData}
            cameraError={cameraError}
          />
        </div>

        {/* AI Interviewer Secondary Panel */}
        <div className="lg:col-span-4 h-full">
          <InterviewerAvatar
            questionText={currentQuestion?.question || 'Preparing prompt...'}
            currentStep={currentStep}
            totalQuestions={session.total_questions}
            role={session.role}
            isAiSpeaking={isAiSpeaking}
            isThinking={isSubmitting}
            onSpeechEnd={() => setIsAiSpeaking(false)}
          />
        </div>
      </div>

      {/* Evaluation Toast Feedback */}
      {showEvalToast && lastEvaluation && (
        <div className="p-3.5 bg-[#ECF5F2] border border-[#A7D7C5] rounded-sm text-xs text-[#2E7D5B] flex items-center justify-between shadow-strata font-medium">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4" /> Answer Evaluated ({lastEvaluation.score} / 10)
          </div>
          <span className="text-[#2F6B5F] font-semibold">Preparing next question...</span>
        </div>
      )}

      {/* Candidate Response Transcript */}
      {showTranscript && (
        <div className="bg-white p-4 border border-[#D9D9D4] rounded-sm space-y-3 text-xs shadow-strata">
          <div className="flex items-center justify-between text-[#6B6B6B] font-bold uppercase tracking-wider text-[11px]">
            <span>Candidate Answer Transcript</span>
            <button
              onClick={() => { resetTranscript(); setManualText(''); }}
              className="text-[#6B6B6B] hover:text-[#202124] flex items-center gap-1 font-normal lowercase transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> clear transcript
            </button>
          </div>

          <div className="p-3 bg-[#F5F5F3] border border-[#D9D9D4] rounded-sm min-h-[50px] max-h-[120px] overflow-y-auto">
            {fullCandidateAnswer ? (
              <p className="text-[#202124] font-sans leading-relaxed">
                "{fullCandidateAnswer}"
                {interimTranscript && <span className="text-[#2F6B5F] italic"> {interimTranscript}</span>}
              </p>
            ) : (
              <p className="text-[#6B6B6B] italic">
                {isListening ? 'Listening to your microphone... Speak clearly.' : 'Microphone unmuted. Click "Unmute Mic" below to start speaking.'}
              </p>
            )}
          </div>

          <input
            type="text"
            placeholder="Optionally edit or type additional response text..."
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            className="strata-input w-full px-3.5 py-2 text-xs"
          />

          {errorMsg && (
            <p className="text-[#B54747] text-xs flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
            </p>
          )}
        </div>
      )}

      {/* Bottom Control Bar */}
      <div className="bg-white p-3.5 border border-[#D9D9D4] rounded-sm flex flex-wrap items-center justify-between gap-3 shadow-strata">
        
        {/* Left Toggles: Mic, Camera, Transcript */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMic}
            className={`px-4 py-2.5 rounded-sm border text-xs font-semibold flex items-center gap-2 transition-all ${
              isListening
                ? 'bg-[#2E7D5B] border-[#2E7D5B] text-white shadow-sm'
                : 'bg-[#F5F5F3] border-[#D9D9D4] text-[#202124] hover:bg-[#ECECE9]'
            }`}
          >
            {isListening ? <Mic className="w-4 h-4 animate-bounce" /> : <MicOff className="w-4 h-4 text-[#6B6B6B]" />}
            <span>{isListening ? 'Mic Active' : 'Unmute Mic'}</span>
          </button>

          <button
            onClick={isCameraActive ? stopCamera : startCamera}
            className={`px-4 py-2.5 rounded-sm border text-xs font-semibold flex items-center gap-2 transition-all ${
              isCameraActive
                ? 'bg-[#F5F5F3] border-[#D9D9D4] text-[#202124] hover:bg-[#ECECE9]'
                : 'bg-[#FDF2F2] border-[#F5C2C2] text-[#B54747]'
            }`}
          >
            {isCameraActive ? <Camera className="w-4 h-4 text-[#2E7D5B]" /> : <CameraOff className="w-4 h-4" />}
            <span>{isCameraActive ? 'Camera On' : 'Turn On'}</span>
          </button>

          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className={`p-2.5 rounded-sm border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showTranscript
                ? 'bg-[#ECF5F2] text-[#2F6B5F] border-[#A7D7C5]'
                : 'bg-[#F5F5F3] border-[#D9D9D4] text-[#6B6B6B] hover:text-[#202124]'
            }`}
            title="Toggle Transcript Display"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Transcript</span>
          </button>
        </div>

        {/* Right Actions: Submit & End Interview */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmitAnswer}
            disabled={isSubmitting || !fullCandidateAnswer}
            className="px-6 py-2.5 strata-button-primary text-xs flex items-center gap-2 disabled:opacity-40"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Evaluating...
              </span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit Answer</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowEndModal(true)}
            className="px-3.5 py-2.5 bg-[#FDF2F2] hover:bg-[#FBE4E4] border border-[#F5C2C2] text-[#B54747] text-xs font-semibold rounded-sm flex items-center gap-1.5 transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">End Interview</span>
          </button>
        </div>

      </div>

      {/* End Interview Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#D9D9D4] rounded max-w-sm w-full p-6 space-y-4 shadow-strata-md">
            <div className="flex items-center justify-between border-b border-[#D9D9D4] pb-3">
              <h3 className="text-base font-bold text-[#202124]">End this interview?</h3>
              <button onClick={() => setShowEndModal(false)} className="text-[#6B6B6B] hover:text-[#202124]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Are you sure you want to end this interview session now? A performance assessment report will be generated for your responses so far.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D9D9D4]">
              <button
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2 strata-button-secondary text-xs"
              >
                Continue Interview
              </button>
              <button
                onClick={handleConfirmEndInterview}
                className="px-4 py-2 bg-[#B54747] hover:bg-[#963737] text-white text-xs font-bold rounded-sm transition-colors"
              >
                End Interview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
