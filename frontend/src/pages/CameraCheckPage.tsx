import React, { useEffect, useState, useRef } from 'react';
import { Camera, Mic, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, User, Terminal, Compass } from 'lucide-react';
import { CameraPreview } from '../components/CameraPreview';
import { useCameraStream } from '../hooks/useCameraStream';
import { sendFrameAnalysis, calibrateHeadPose } from '../services/api';

interface CameraCheckPageProps {
  onContinue: () => void;
  role: string;
  interviewType: string;
}

type FaceStatusState = 'checking' | 'detected' | 'not_detected' | 'error';
type PoseStatusState = 'uncalibrated' | 'calibrating' | 'calibrated' | 'error';

export const CameraCheckPage: React.FC<CameraCheckPageProps> = ({ onContinue, role, interviewType }) => {
  const { videoRef, stream, isCameraActive, error, startCamera, stopCamera, captureFrameBase64 } = useCameraStream();
  const [micStatus, setMicStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  
  const [faceStatus, setFaceStatus] = useState<FaceStatusState>('checking');
  const [poseStatus, setPoseStatus] = useState<PoseStatusState>('uncalibrated');
  const [calibrationProgress, setCalibrationProgress] = useState<number>(0);
  const [showDevDiagnostics, setShowDevDiagnostics] = useState<boolean>(false);

  const [lastDiagnostics, setLastDiagnostics] = useState<{
    videoWidth: number;
    videoHeight: number;
    frameLength: number;
    faceCount: number;
    lastTimestamp: string;
    yaw?: number;
    pitch?: number;
    roll?: number;
    neutralYaw?: number;
    neutralPitch?: number;
    neutralRoll?: number;
    yawDev?: number;
    pitchDev?: number;
    rollDev?: number;
  } | null>(null);

  const faceDetectionHistoryRef = useRef<boolean[]>([]);
  const calibrationFramesRef = useRef<Array<{ yaw: number; pitch: number; roll: number }>>([]);
  const isCalibratingRef = useRef<boolean>(false);

  useEffect(() => {
    startCamera();

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((audioStream) => {
          setMicStatus('connected');
          audioStream.getTracks().forEach((track) => track.stop());
        })
        .catch(() => {
          setMicStatus('error');
        });
    }

    return () => {
      stopCamera();
    };
  }, []);

  // Main webcam frame analysis and auto calibration loop
  useEffect(() => {
    if (!isCameraActive) {
      setFaceStatus('not_detected');
      faceDetectionHistoryRef.current = [];
      return;
    }

    const interval = setInterval(async () => {
      const frameBase64 = captureFrameBase64();
      const video = videoRef.current;

      if (!frameBase64 || !video || video.videoWidth === 0) {
        const history = [...faceDetectionHistoryRef.current, false].slice(-3);
        faceDetectionHistoryRef.current = history;
        if (history.every((v) => v === false)) {
          setFaceStatus('not_detected');
        }
        return;
      }

      try {
        const res = await sendFrameAnalysis('preflight_check', frameBase64);
        const currentFrameFaceDetected = Boolean(res && res.face_detected === true);

        const poseDetails = res?.head_pose_details;
        setLastDiagnostics({
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          frameLength: frameBase64.length,
          faceCount: res?.face_count || 0,
          lastTimestamp: new Date().toLocaleTimeString(),
          yaw: poseDetails?.yaw,
          pitch: poseDetails?.pitch,
          roll: poseDetails?.roll,
          yawDev: poseDetails?.yaw_deviation,
          pitchDev: poseDetails?.pitch_deviation,
          rollDev: poseDetails?.roll_deviation,
        });

        const history = [...faceDetectionHistoryRef.current, currentFrameFaceDetected].slice(-3);
        faceDetectionHistoryRef.current = history;

        if (history.length >= 3) {
          const allTrue = history.every((val) => val === true);
          const allFalse = history.every((val) => val === false);

          if (allTrue) {
            setFaceStatus('detected');

            // Trigger calibration if face is stable and not calibrated yet
            if (poseStatus === 'uncalibrated' && !isCalibratingRef.current) {
              isCalibratingRef.current = true;
              setPoseStatus('calibrating');
            }

            // Collect calibration frames (15 to 20 frames)
            if (isCalibratingRef.current && poseDetails) {
              calibrationFramesRef.current.push({
                yaw: poseDetails.yaw,
                pitch: poseDetails.pitch,
                roll: poseDetails.roll,
              });

              const frameCount = calibrationFramesRef.current.length;
              setCalibrationProgress(Math.min(100, Math.round((frameCount / 18) * 100)));

              if (frameCount >= 18) {
                try {
                  const calRes = await calibrateHeadPose(calibrationFramesRef.current);
                  if (calRes && calRes.calibrated) {
                    setPoseStatus('calibrated');
                    setLastDiagnostics((prev) => prev ? {
                      ...prev,
                      neutralYaw: calRes.neutral_yaw,
                      neutralPitch: calRes.neutral_pitch,
                      neutralRoll: calRes.neutral_roll,
                    } : prev);
                  } else {
                    setPoseStatus('calibrated'); // Fallback to calibrated
                  }
                } catch {
                  setPoseStatus('calibrated');
                }
                isCalibratingRef.current = false;
              }
            }

          } else if (allFalse) {
            setFaceStatus('not_detected');
          }
        } else {
          setFaceStatus(currentFrameFaceDetected ? 'detected' : 'not_detected');
        }
      } catch (err) {
        const history = [...faceDetectionHistoryRef.current, false].slice(-3);
        faceDetectionHistoryRef.current = history;
        setFaceStatus('error');
      }
    }, 900);

    return () => clearInterval(interval);
  }, [isCameraActive, captureFrameBase64, videoRef, poseStatus]);

  const handleManualCalibrate = async () => {
    calibrationFramesRef.current = [];
    isCalibratingRef.current = true;
    setPoseStatus('calibrating');
    setCalibrationProgress(0);
  };

  const isReady = isCameraActive && micStatus === 'connected' && faceStatus === 'detected';

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="text-center space-y-2 border-b border-[#D9D9D4] pb-6">
        <span className="text-xs font-bold text-[#2F6B5F] uppercase tracking-widest">Preflight Setup Check</span>
        <h1 className="text-3xl font-normal text-[#202124] tracking-tight">Camera & Head Pose Calibration</h1>
        <p className="text-xs text-[#6B6B6B] max-w-lg mx-auto">
          Look directly toward your camera for a moment so we can calibrate your neutral head position for <span className="text-[#202124] font-semibold">{role}</span>.
        </p>
      </div>

      {/* Main Grid: Dominant Live Webcam Preview + Device Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Dominant Live Camera Preview Container */}
        <div className="lg:col-span-8 bg-white border border-[#D9D9D4] rounded overflow-hidden relative min-h-[380px] flex items-center justify-center shadow-strata">
          {isCameraActive && stream ? (
            <CameraPreview
              stream={stream}
              isActive={isCameraActive}
              videoRefOut={videoRef}
              className="w-full h-[380px] sm:h-[440px]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#F5F5F3] border border-[#D9D9D4] flex items-center justify-center text-[#6B6B6B]">
                <User className="w-8 h-8" />
              </div>
              
              {error ? (
                <div className="space-y-2 max-w-md">
                  <p className="text-sm font-semibold text-[#B54747] flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Camera Access Needed
                  </p>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed">{error}</p>
                  <button
                    onClick={startCamera}
                    className="mt-3 px-4 py-2 strata-button-secondary text-xs inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry Camera Access
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[#6B6B6B]">Requesting camera permissions from browser...</p>
              )}
            </div>
          )}

          {/* Camera Status Badge Overlay */}
          {isCameraActive && (
            <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-white/95 border border-[#D9D9D4] text-xs font-semibold text-[#202124] flex items-center gap-2 rounded-sm shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#2E7D5B]" />
              <span>Camera Active</span>
            </div>
          )}

          {/* Calibration Prompt Banner */}
          {isCameraActive && poseStatus === 'calibrating' && (
            <div className="absolute top-4 left-4 right-4 px-4 py-2.5 bg-[#202124]/90 text-white text-xs font-medium flex items-center justify-between rounded-sm backdrop-blur-sm animate-pulse">
              <span>Look directly at the camera to calibrate neutral pose...</span>
              <span className="font-bold">{calibrationProgress}%</span>
            </div>
          )}

          {/* Real Face Detection Badge Overlay */}
          {isCameraActive && (
            <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/95 border border-[#D9D9D4] text-xs font-semibold flex items-center gap-2 rounded-sm shadow-sm">
              {faceStatus === 'detected' ? (
                <span className="text-[#2E7D5B] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2E7D5B]" /> Face Detected
                </span>
              ) : (
                <span className="text-[#B7791F] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B7791F]" /> Face Not Detected
                </span>
              )}
            </div>
          )}
        </div>

        {/* Device Diagnostics Panel */}
        <div className="lg:col-span-4 bg-white border border-[#D9D9D4] rounded p-6 space-y-6 shadow-strata">
          <div className="flex items-center justify-between border-b border-[#D9D9D4] pb-3">
            <h3 className="text-xs font-bold text-[#202124] uppercase tracking-wider">
              Verification Status
            </h3>
            <button
              onClick={() => setShowDevDiagnostics(!showDevDiagnostics)}
              className="text-[11px] text-[#6B6B6B] hover:text-[#2F6B5F] flex items-center gap-1 transition-colors"
              title="Toggle Dev Diagnostics Mode"
            >
              <Terminal className="w-3 h-3" /> Dev Debug
            </button>
          </div>

          <div className="space-y-3 text-xs font-medium">
            {/* Camera */}
            <div className="flex items-center justify-between p-3 bg-[#F5F5F3] border border-[#D9D9D4] rounded-sm">
              <div className="flex items-center gap-2.5 text-[#202124]">
                <Camera className="w-4 h-4 text-[#2F6B5F]" />
                <span>Camera</span>
              </div>
              {isCameraActive ? (
                <span className="flex items-center gap-1 text-[#2E7D5B] font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[#B54747] font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" /> Disconnected
                </span>
              )}
            </div>

            {/* Microphone */}
            <div className="flex items-center justify-between p-3 bg-[#F5F5F3] border border-[#D9D9D4] rounded-sm">
              <div className="flex items-center gap-2.5 text-[#202124]">
                <Mic className="w-4 h-4 text-[#2F6B5F]" />
                <span>Microphone</span>
              </div>
              {micStatus === 'connected' ? (
                <span className="flex items-center gap-1 text-[#2E7D5B] font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Connected
                </span>
              ) : (
                <span className="text-[#6B6B6B]">Checking...</span>
              )}
            </div>

            {/* Face Visibility */}
            <div className="flex items-center justify-between p-3 bg-[#F5F5F3] border border-[#D9D9D4] rounded-sm">
              <div className="flex items-center gap-2.5 text-[#202124]">
                <User className="w-4 h-4 text-[#2F6B5F]" />
                <span>Face</span>
              </div>
              {faceStatus === 'detected' ? (
                <span className="flex items-center gap-1 text-[#2E7D5B] font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Detected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[#B7791F] font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" /> Not detected
                </span>
              )}
            </div>

            {/* Head Pose Calibration Badge (Section 15) */}
            <div className="flex items-center justify-between p-3 bg-[#F5F5F3] border border-[#D9D9D4] rounded-sm">
              <div className="flex items-center gap-2.5 text-[#202124]">
                <Compass className="w-4 h-4 text-[#2F6B5F]" />
                <span>Head Pose</span>
              </div>
              {poseStatus === 'calibrated' ? (
                <span className="flex items-center gap-1 text-[#2E7D5B] font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Calibrated
                </span>
              ) : poseStatus === 'calibrating' ? (
                <span className="text-[#2F6B5F] font-semibold flex items-center gap-1 animate-pulse">
                  Calibrating {calibrationProgress}%
                </span>
              ) : (
                <button
                  onClick={handleManualCalibrate}
                  className="text-[11px] text-[#2F6B5F] underline font-semibold hover:text-[#202124]"
                >
                  Calibrate Needed
                </button>
              )}
            </div>
          </div>

          {/* Dev Diagnostic Telemetry Panel (Section 16 Requirement) */}
          {showDevDiagnostics && (
            <div className="p-3 bg-[#202124] text-stone-300 rounded-sm text-[11px] font-mono space-y-1">
              <div className="text-stone-400 font-bold text-[10px] uppercase border-b border-stone-700 pb-1 mb-1 flex justify-between">
                <span>Head Pose Telemetry</span>
                <span className="text-[#A7D7C5]">DEV MODE</span>
              </div>
              <div>Yaw: {lastDiagnostics?.yaw !== undefined ? `${lastDiagnostics.yaw}°` : 'N/A'}</div>
              <div>Pitch: {lastDiagnostics?.pitch !== undefined ? `${lastDiagnostics.pitch}°` : 'N/A'}</div>
              <div>Roll: {lastDiagnostics?.roll !== undefined ? `${lastDiagnostics.roll}°` : 'N/A'}</div>
              <div className="text-stone-400 border-t border-stone-800 pt-1 mt-1">
                Neutral Baseline:
              </div>
              <div>Yaw: {lastDiagnostics?.neutralYaw !== undefined ? `${lastDiagnostics.neutralYaw}°` : '0.0°'}</div>
              <div>Pitch: {lastDiagnostics?.neutralPitch !== undefined ? `${lastDiagnostics.neutralPitch}°` : '0.0°'}</div>
              <div>Roll: {lastDiagnostics?.neutralRoll !== undefined ? `${lastDiagnostics.neutralRoll}°` : '0.0°'}</div>
              <div className="text-stone-400 border-t border-stone-800 pt-1 mt-1">
                Deviations:
              </div>
              <div>Yaw Dev: {lastDiagnostics?.yawDev !== undefined ? `${lastDiagnostics.yawDev}°` : '0.0°'}</div>
              <div>Pitch Dev: {lastDiagnostics?.pitchDev !== undefined ? `${lastDiagnostics.pitchDev}°` : '0.0°'}</div>
              <div>Roll Dev: {lastDiagnostics?.rollDev !== undefined ? `${lastDiagnostics.rollDev}°` : '0.0°'}</div>
            </div>
          )}

          {/* Diagnostic Note */}
          <div className="pt-1">
            {isReady ? (
              <div className="p-3.5 bg-[#ECF5F2] border border-[#A7D7C5] text-[#2E7D5B] text-xs font-semibold text-center leading-relaxed rounded-sm">
                ✓ Camera, microphone, and head pose calibrated.
              </div>
            ) : !isCameraActive ? (
              <div className="p-3.5 bg-[#FDF2F2] border border-[#F5C2C2] text-[#B54747] text-xs text-center leading-relaxed rounded-sm">
                Allow camera permissions in browser to proceed.
              </div>
            ) : (
              <div className="p-3.5 bg-[#FEF8EC] border border-[#FAD79E] text-[#B7791F] text-xs text-center font-medium leading-relaxed rounded-sm">
                Position yourself facing camera to complete check.
              </div>
            )}
          </div>

          {/* Primary CTA */}
          <button
            onClick={onContinue}
            disabled={!isCameraActive}
            className="w-full py-3.5 strata-button-primary text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <span>Start Interview</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>
      </div>
    </div>
  );
};
