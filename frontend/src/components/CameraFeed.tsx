import React, { useEffect, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, User, Eye, Activity, AlertCircle } from 'lucide-react';
import { FrameAnalysisResult } from '../types/interview';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  isListening: boolean;
  onToggleMic: () => void;
  analysisData: FrameAnalysisResult | null;
  cameraError: string | null;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  videoRef,
  isCameraActive,
  onToggleCamera,
  isListening,
  onToggleMic,
  analysisData,
  cameraError,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col justify-between h-full relative overflow-hidden group">
      
      {/* Video Container */}
      <div className="relative w-full h-full min-h-[240px] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
        
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
                Enable camera for non-verbal eye-contact and posture analysis
              </p>
            </div>
          </div>
        )}

        {/* Camera Permission Alert */}
        {cameraError && (
          <div className="absolute top-3 left-3 right-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2 z-20">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Vision Analytics HUD Overlays */}
        {isCameraActive && analysisData && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-20 pointer-events-none">
            <div className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-medium text-slate-200 flex items-center gap-1.5 shadow-md">
              <span className={`w-2 h-2 rounded-full ${analysisData.face_detected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{analysisData.face_detected ? 'Face Detected' : 'Align Face'}</span>
            </div>

            <div className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-medium text-slate-200 flex items-center gap-1.5 shadow-md">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Eye Contact: {analysisData.eye_contact_ratio}%</span>
            </div>

            <div className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-medium text-slate-200 flex items-center gap-1.5 shadow-md">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>{analysisData.posture_status}</span>
            </div>
          </div>
        )}

        {/* Microphone Active Indicator Badge */}
        {isListening && (
          <div className="absolute bottom-3 left-3 z-20 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-lg animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Recording Voice Answer...</span>
          </div>
        )}
      </div>

      {/* Control Buttons Bar */}
      <div className="mt-4 flex items-center justify-between z-10">
        <div className="text-xs text-slate-400 font-medium">Candidate Video</div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCamera}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
              isCameraActive
                ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
            }`}
          >
            {isCameraActive ? <Camera className="w-4 h-4 text-emerald-400" /> : <CameraOff className="w-4 h-4" />}
            <span>{isCameraActive ? 'Camera On' : 'Turn On'}</span>
          </button>

          <button
            onClick={onToggleMic}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
              isListening
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500'
            }`}
          >
            {isListening ? <Mic className="w-4 h-4 animate-bounce" /> : <MicOff className="w-4 h-4" />}
            <span>{isListening ? 'Mute Mic' : 'Start Mic'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
