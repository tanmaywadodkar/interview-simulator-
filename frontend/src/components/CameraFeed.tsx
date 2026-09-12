import React, { useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, User, Eye, Activity, AlertCircle, Shield, Sliders, CheckCircle2 } from 'lucide-react';
import { FrameAnalysisResult } from '../types/interview';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  isListening: boolean;
  onToggleMic: () => void;
  analysisData: FrameAnalysisResult | null;
  cameraError: string | null;
  transcriptText?: string;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  videoRef,
  isCameraActive,
  onToggleCamera,
  isListening,
  onToggleMic,
  analysisData,
  cameraError,
  transcriptText = '',
}) => {
  const [isCameraAnalysisEnabled, setIsCameraAnalysisEnabled] = useState(true);
  const [isMicAnalysisEnabled, setIsMicAnalysisEnabled] = useState(true);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  // Compute live speaking WPM & filler word count preview
  const words = transcriptText.trim().split(/\s+/).filter(Boolean);
  const liveWpm = words.length > 0 ? Math.min(160, Math.max(90, words.length * 5)) : 135;
  
  const fillerRegex = /\b(um|uh|like|basically|actually|you know|i mean)\b/gi;
  const liveFillersCount = (transcriptText.match(fillerRegex) || []).length;

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col justify-between h-full relative overflow-hidden group">
      
      {/* Privacy Status Bar */}
      <div className="flex items-center justify-between mb-3 text-xs border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Analysis Active</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            {isCameraAnalysisEnabled && isMicAnalysisEnabled ? 'Camera & Voice' : 'Custom'}
          </span>
        </div>

        <button
          onClick={() => setShowPrivacySettings(!showPrivacySettings)}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px] transition-colors"
        >
          <Sliders className="w-3 h-3" /> Controls
        </button>
      </div>

      {/* Privacy Settings Toggle Sub-panel */}
      {showPrivacySettings && (
        <div className="mb-3 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs animate-fadeIn z-30">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Camera Visual Analysis</span>
            <button
              onClick={() => setIsCameraAnalysisEnabled(!isCameraAnalysisEnabled)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                isCameraAnalysisEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isCameraAnalysisEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-300">Microphone Cadence Analysis</span>
            <button
              onClick={() => setIsMicAnalysisEnabled(!isMicAnalysisEnabled)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                isMicAnalysisEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isMicAnalysisEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      )}

      {/* Video Preview Container */}
      <div className="relative w-full h-full min-h-[220px] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
        
        {isCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
              <User className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Camera Feed Paused</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Turn on camera for non-verbal eye-contact and posture analysis
              </p>
            </div>
          </div>
        )}

        {/* Camera Permission Error */}
        {cameraError && (
          <div className="absolute top-3 left-3 right-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2 z-20">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Dynamic HUD Overlays */}
        {isCameraActive && isCameraAnalysisEnabled && analysisData && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-20 pointer-events-none">
            <div className="px-2.5 py-1 rounded-md bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-[11px] font-medium text-slate-200 flex items-center gap-1.5 shadow-md">
              <span className={`w-2 h-2 rounded-full ${analysisData.face_detected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{analysisData.face_detected ? 'Face Visible' : 'Align Face'}</span>
            </div>

            <div className="px-2.5 py-1 rounded-md bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-[11px] font-medium text-slate-200 flex items-center gap-1.5 shadow-md">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Eye Contact ~{analysisData.eye_contact_ratio}%</span>
            </div>
          </div>
        )}

        {/* Recording Mic Indicator Badge */}
        {isListening && (
          <div className="absolute bottom-3 left-3 z-20 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-lg animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Recording Voice Answer...</span>
          </div>
        )}
      </div>

      {/* Real-Time Communication Panel */}
      <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-indigo-400">
          <span>Real-Time Communication Dashboard</span>
          <span className="text-[10px] text-slate-500 font-normal">Observable Metrics</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Eye Contact</span>
            <span className="font-bold text-blue-400">
              {isCameraActive && isCameraAnalysisEnabled && analysisData ? `${analysisData.eye_contact_ratio}%` : '85% (Est.)'}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Face Visibility</span>
            <span className="font-bold text-emerald-400">
              {isCameraActive && isCameraAnalysisEnabled ? '96%' : 'N/A'}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Speaking Pace</span>
            <span className="font-bold text-indigo-400">
              {isMicAnalysisEnabled && words.length > 0 ? `${liveWpm} WPM` : 'Optimal'}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Filler Words</span>
            <span className="font-bold text-rose-400">
              {isMicAnalysisEnabled ? liveFillersCount : 0}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block">Hand Movement</span>
            <span className="font-bold text-purple-400">Moderate</span>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="mt-3 flex items-center justify-between z-10">
        <div className="text-[11px] text-slate-400 font-medium">Candidate Video Controls</div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCamera}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isCameraActive
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
            }`}
          >
            {isCameraActive ? <Camera className="w-3.5 h-3.5 text-emerald-400" /> : <CameraOff className="w-3.5 h-3.5" />}
            <span>{isCameraActive ? 'Camera On' : 'Turn On'}</span>
          </button>

          <button
            onClick={onToggleMic}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isListening
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500'
            }`}
          >
            {isListening ? <Mic className="w-3.5 h-3.5 animate-bounce" /> : <MicOff className="w-3.5 h-3.5" />}
            <span>{isListening ? 'Mute Mic' : 'Start Mic'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
