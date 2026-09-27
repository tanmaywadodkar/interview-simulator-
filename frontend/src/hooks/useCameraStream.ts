import { useState, useEffect, useRef, useCallback } from 'react';

export function useCameraStream() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Stop previous stream tracks if active
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera getUserMedia error:', err);
      setIsCameraActive(false);
      setStream(null);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera detected. Please connect a webcam.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera unavailable. Please check that another application is not using your webcam.');
      } else {
        setError('Unable to access webcam. Please check your device media permissions.');
      }
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const captureFrameBase64 = useCallback((): string | null => {
    if (!videoRef.current || !isCameraActive) return null;
    try {
      const video = videoRef.current;
      if (
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        return null;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      if (!dataUrl || dataUrl.length < 100) return null;
      return dataUrl;
    } catch (err) {
      return null;
    }
  }, [isCameraActive]);

  return {
    videoRef,
    stream,
    isCameraActive,
    error,
    startCamera,
    stopCamera,
    captureFrameBase64,
  };
}
