import React, { useState, useEffect } from 'react';
import { User, AlertCircle, Terminal } from 'lucide-react';
import { CameraPreview } from './CameraPreview';
import { FrameAnalysisResult } from '../types/interview';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  isListening: boolean;
  onToggleMic: () => void;
  analysisData: FrameAnalysisResult | null;
  cameraError: string | null;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  videoRef,
  stream,
  isCameraActive,
  onToggleCamera,
  isListening,
  onToggleMic,
  analysisData,
  cameraError,
}) => {
  const [showDevDebug, setShowDevDebug] = useState<boolean>(false);

  // Keyboard shortcut 'd' to toggle dev mode telemetry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' && (e.ctrlKey || e.altKey)) {
        setShowDevDebug((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const poseDetails = analysisData?.head_pose_details;
  const movDetails = analysisData?.head_movement;

  // Determine unobtrusive Head Position label
  const getHeadPositionLabel = () => {
    if (!analysisData?.face_detected || poseDetails?.classification === 'UNAVAILABLE') {
      return { text: 'Unavailable', color: 'bg-stone-500' };
    }
    const movState = movDetails?.movement_state || 'STABLE';
    const isEventActive = movDetails?.movement_event_active || false;
    const orient = movDetails?.orientation || poseDetails?.classification || 'CENTER';

    let orientStr = 'Center';
    if (orient === 'RIGHT') orientStr = 'Turned Right';
    else if (orient === 'LEFT') orientStr = 'Turned Left';
    else if (orient === 'UP') orientStr = 'Looking Up';
    else if (orient === 'DOWN') orientStr = 'Looking Down';
    else if (orient === 'TILT') orientStr = 'Head Tilted';

    if (isEventActive || movState === 'SIGNIFICANT_MOVEMENT') {
      return { text: `${orientStr} (Moving)`, color: 'bg-[#B7791F]' };
    }
    if (movState === 'MODERATE_MOVEMENT' || movState === 'SMALL_MOVEMENT') {
      return { text: `${orientStr} (Slight)`, color: 'bg-sky-400' };
    }
    return { text: `${orientStr} (Stable)`, color: 'bg-[#2E7D5B]' };
  };

  const headPos = getHeadPositionLabel();

  return (
    <div className="bg-[#202124] rounded border border-[#D9D9D4] overflow-hidden relative flex flex-col justify-between h-full min-h-[360px] shadow-strata group">
      
      {/* 16:9 Video Stream Container */}
      <div className="relative w-full h-full min-h-[320px] flex items-center justify-center bg-[#202124]">
        {isCameraActive && stream ? (
          <CameraPreview
            stream={stream}
            isActive={isCameraActive}
            videoRefOut={videoRef}
            className="w-full h-full min-h-[320px]"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 text-stone-400">
            <div className="w-16 h-16 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-400">
              <User className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-200">Camera Off</p>
              <p className="text-xs text-stone-400 max-w-xs mt-1">
                Turn on your camera for live assessment recording
              </p>
            </div>
          </div>
        )}

        {/* Camera Error Alert */}
        {cameraError && (
          <div className="absolute top-3 left-3 right-3 p-2.5 rounded-sm bg-[#FDF2F2] border border-[#F5C2C2] text-[#B54747] text-xs flex items-center gap-2 z-20 font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Camera Status Badge & Dev Mode Toggle (Bottom Left) */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 z-20">
          <div className="px-3 py-1.5 rounded-sm bg-black/75 backdrop-blur text-white text-xs font-semibold flex items-center gap-2">
            {isCameraActive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#2E7D5B]" />
                <span>Camera On</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#B54747]" />
                <span>Camera Off</span>
              </>
            )}
          </div>

          <button
            onClick={() => setShowDevDebug(!showDevDebug)}
            className={`px-2.5 py-1.5 rounded-sm backdrop-blur text-[11px] font-semibold flex items-center gap-1 transition-colors border ${
              showDevDebug
                ? 'bg-[#2F6B5F] text-white border-[#A7D7C5]'
                : 'bg-black/75 text-stone-300 border-white/10 hover:text-white'
            }`}
            title="Toggle Dev Debug Telemetry (Ctrl+D)"
          >
            <Terminal className="w-3 h-3" /> Dev Debug
          </button>
        </div>

        {/* Live Vision & Unobtrusive Head Position Indicator */}
        {isCameraActive && (
          <div className="absolute top-3 right-3 z-20 pointer-events-none flex flex-col items-end gap-1.5">
            {analysisData?.analysis_available === false ? (
              <span className="px-2.5 py-1 rounded-sm bg-black/75 backdrop-blur text-stone-400 text-[11px] font-semibold border border-white/10 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-500" /> Visual analysis unavailable
              </span>
            ) : analysisData?.multiple_faces_detected ? (
              <span className="px-2.5 py-1 rounded-sm bg-[#FFF9EB] text-[#B7791F] text-[11px] font-semibold border border-[#FFE0B2] flex items-center gap-1.5 shadow">
                <AlertCircle className="w-3.5 h-3.5" /> Only one person should be visible
              </span>
            ) : analysisData?.face_detected ? (
              <div className="flex items-center gap-2">
                {/* Face Badge */}
                <span className="px-2.5 py-1 rounded-sm bg-black/75 backdrop-blur text-[#2E7D5B] text-[11px] font-semibold border border-white/10 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D5B]" /> Face Detected
                </span>

                {/* Unobtrusive Head Position Indicator */}
                <span className="px-2.5 py-1 rounded-sm bg-black/75 backdrop-blur text-white text-[11px] font-semibold border border-white/10 flex items-center gap-1.5">
                  Head Position: <span className={`w-1.5 h-1.5 rounded-full ${headPos.color}`} /> {headPos.text}
                </span>
              </div>
            ) : (
              <span className="px-2.5 py-1 rounded-sm bg-black/75 backdrop-blur text-[#B7791F] text-[11px] font-semibold border border-white/10 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B7791F]" /> Face Not Detected
              </span>
            )}
          </div>
        )}

        {/* Development-Only Debug Telemetry Overlay */}
        {showDevDebug && (
          <div className="absolute bottom-12 left-3 z-30 p-3 bg-black/90 backdrop-blur border border-stone-700 text-stone-200 rounded-sm text-[11px] font-mono space-y-1 w-72 shadow-2xl">
            <div className="text-[#A7D7C5] font-bold text-[10px] uppercase border-b border-stone-700 pb-1 mb-1 flex justify-between">
              <span>Head Pose Telemetry</span>
              <span>DEV MODE</span>
            </div>
            <div className="flex justify-between">
              <span>Pose (Y/P/R):</span> <span>{poseDetails?.yaw?.toFixed(1) || '0.0'}° / {poseDetails?.pitch?.toFixed(1) || '0.0'}° / {poseDetails?.roll?.toFixed(1) || '0.0'}°</span>
            </div>
            <div className="flex justify-between">
              <span>Baseline Dev:</span> <span>{poseDetails?.yaw_deviation !== undefined ? `${poseDetails.yaw_deviation > 0 ? '+' : ''}${poseDetails.yaw_deviation.toFixed(1)}°` : '0.0°'}</span>
            </div>
            <div className="text-stone-400 border-t border-stone-800 pt-1 mt-1 font-semibold text-[10px] uppercase">
              Frame-to-Frame Deltas:
            </div>
            <div className="flex justify-between">
              <span>Delta (Y/P/R):</span> <span>{movDetails?.delta_yaw?.toFixed(1) || '0.0'}° / {movDetails?.delta_pitch?.toFixed(1) || '0.0'}° / {movDetails?.delta_roll?.toFixed(1) || '0.0'}°</span>
            </div>
            <div className="flex justify-between">
              <span>Delta Mag:</span> <span className={(movDetails?.delta_magnitude || 0) >= 3.5 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>{movDetails?.delta_magnitude?.toFixed(2) || '0.00'}°</span>
            </div>
            <div className="text-stone-400 border-t border-stone-800 pt-1 mt-1 font-semibold text-[10px] uppercase">
              State & Event Tracking:
            </div>
            <div className="flex justify-between">
              <span>Orientation:</span> <span className="text-sky-300 font-bold">{movDetails?.orientation || poseDetails?.classification || 'CENTER'}</span>
            </div>
            <div className="flex justify-between">
              <span>Movement State:</span> <span className={(movDetails?.movement_state || 'STABLE') === 'STABLE' ? 'text-emerald-400' : 'text-amber-400 font-bold'}>{movDetails?.movement_state || 'STABLE'}</span>
            </div>
            <div className="flex justify-between">
              <span>Event Active:</span> <span className={movDetails?.movement_event_active ? 'text-amber-400 font-bold animate-pulse' : 'text-stone-400'}>{movDetails?.movement_event_active ? 'YES' : 'NO'}</span>
            </div>
            <div className="flex justify-between">
              <span>Event Count:</span> <span className="text-white font-bold">{movDetails?.movement_event_count ?? movDetails?.movement_events ?? 0}</span>
            </div>
          </div>
        )}

        {/* Microphone Active Indicator */}
        {isListening && (
          <div className="absolute bottom-3 right-3 z-20 px-3 py-1.5 rounded-sm bg-[#2E7D5B] text-white text-xs font-semibold flex items-center gap-1.5 shadow">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>Mic Active</span>
          </div>
        )}
      </div>

    </div>
  );
};
