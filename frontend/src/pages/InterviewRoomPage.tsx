import React, { useState, useEffect } from 'react';
import { Play, Mic, MicOff, Send, PhoneOff, Sparkles, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
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
  const [lastEvaluation, setLastEvaluation] = useState<AnswerEvaluation | null>(null);
  const [showEvalToast, setShowEvalToast] = useState(false);
  const [manualText, setManualText] = useState('');
  const [analysisData, setAnalysisData] = useState<FrameAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Custom Hooks
  const {
    isListening,
    transcript,
    setTranscript,
    interimTranscript,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const {
    videoRef,
    isCameraActive,
    error: cameraError,
    startCamera,
    stopCamera,
    captureFrameBase64,
  } = useCameraStream();

  // Start camera automatically on room enter
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
    }, 4000);

    return () => clearInterval(interval);
  }, [isCameraActive, session.id]);

  // Combine speech transcript and typed fallback text
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
      setErrorMsg('Please speak into your microphone or type an answer before submitting.');
      return;
    }

    if (isListening) stopListening();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Submit answer for evaluation
      const evalRes = await submitAnswer(session.id, fullCandidateAnswer);
      setLastEvaluation(evalRes);
      setShowEvalToast(true);

      // 2. Fetch next dynamic question or finish session
      const nextRes = await getNextQuestion(session.id);
      
      if (nextRes.completed || currentStep >= session.total_questions) {
        // Complete interview
        setTimeout(async () => {
          const report = await finishInterview(session.id);
          onFinish(report);
        }, 2000);
      } else if (nextRes.current_question) {
        setTimeout(() => {
          setCurrentQuestion(nextRes.current_question);
          setCurrentStep((prev) => prev + 1);
          resetTranscript();
          setManualText('');
          setIsAiSpeaking(true);
          setShowEvalToast(false);
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to evaluate answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndInterviewEarly = async () => {
    if (window.confirm('Are you sure you want to end the interview early?')) {
      if (isListening) stopListening();
      setIsSubmitting(true);
      try {
        const report = await finishInterview(session.id);
        onFinish(report);
      } catch (err) {
        console.error('Error ending early:', err);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6 animate-fadeIn">
      
      {/* Top Status Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              LIVE INTERVIEW SESSION
            </h2>
            <p className="text-xs text-slate-400">
              Role: <span className="text-slate-200 font-semibold">{session.role}</span> ({session.interview_type} • {session.difficulty})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleEndInterviewEarly}
            className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <PhoneOff className="w-4 h-4" /> End Interview
          </button>
        </div>
      </div>

      {/* Main Grid — AI Avatar & Candidate Video */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[420px]">
        
        {/* AI Interviewer Avatar Column */}
        <div className="lg:col-span-7">
          <InterviewerAvatar
            questionText={currentQuestion?.question || 'Preparing your interview question...'}
            currentStep={currentStep}
            totalQuestions={session.total_questions}
            role={session.role}
            isAiSpeaking={isAiSpeaking}
            onSpeechEnd={() => setIsAiSpeaking(false)}
          />
        </div>

        {/* Candidate Video Camera Column */}
        <div className="lg:col-span-5">
          <CameraFeed
            videoRef={videoRef}
            isCameraActive={isCameraActive}
            onToggleCamera={isCameraActive ? stopCamera : startCamera}
            isListening={isListening}
            onToggleMic={handleToggleMic}
            analysisData={analysisData}
            cameraError={cameraError}
            transcriptText={fullCandidateAnswer}
          />
        </div>
      </div>

      {/* Evaluation Toast feedback overlay */}
      {showEvalToast && lastEvaluation && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/40 text-slate-200 space-y-2 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>Answer Evaluated! Score: {lastEvaluation.score} / 10</span>
            </div>
            <span className="text-xs text-indigo-400 font-semibold animate-pulse">
              Generating follow-up question...
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
            <div className="p-2 rounded-lg bg-slate-950">Relevance: <span className="font-bold text-white">{lastEvaluation.relevance}/10</span></div>
            <div className="p-2 rounded-lg bg-slate-950">Clarity: <span className="font-bold text-white">{lastEvaluation.clarity}/10</span></div>
            <div className="p-2 rounded-lg bg-slate-950">Technical: <span className="font-bold text-white">{lastEvaluation.technical_accuracy}/10</span></div>
            <div className="p-2 rounded-lg bg-slate-950">Structure: <span className="font-bold text-white">{lastEvaluation.structure}/10</span></div>
          </div>
        </div>
      )}

      {/* Candidate Live Speech & Answer Recording Bar */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className={`w-4 h-4 ${isListening ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Candidate Response Transcript
            </span>
          </div>
          <button
            onClick={handleToggleMic}
            className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              isListening
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
            }`}
          >
            {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            <span>{isListening ? 'Microphone Active' : 'Start Mic Recording'}</span>
          </button>
        </div>

        {/* Live speech readout display */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 min-h-[90px] max-h-[160px] overflow-y-auto space-y-2">
          {fullCandidateAnswer ? (
            <p className="text-sm text-slate-100 font-sans leading-relaxed">
              "{fullCandidateAnswer}"
              {interimTranscript && <span className="text-indigo-400 italic"> {interimTranscript}</span>}
            </p>
          ) : (
            <p className="text-xs text-slate-500 italic">
              {isListening 
                ? 'Listening to your voice... Speak clearly into your microphone.' 
                : 'Microphone is inactive. Click "Start Mic Recording" above or type your response below.'}
            </p>
          )}
        </div>

        {/* Fallback Manual Text Input */}
        <div>
          <input
            type="text"
            placeholder="Optionally edit or add text manually before submitting..."
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            onClick={() => { resetTranscript(); setManualText(''); }}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Clear Response Text
          </button>

          <button
            onClick={handleSubmitAnswer}
            disabled={isSubmitting || !fullCandidateAnswer}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-40"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Evaluating & Generating Next Question...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Answer</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
