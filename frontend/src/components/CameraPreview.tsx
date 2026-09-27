import React, { useEffect, useRef } from 'react';

interface CameraPreviewProps {
  stream: MediaStream | null;
  isActive: boolean;
  className?: string;
  videoRefOut?: React.RefObject<HTMLVideoElement | null>;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  stream,
  isActive,
  className = '',
  videoRefOut,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const activeRef = videoRefOut || localVideoRef;

  useEffect(() => {
    const video = activeRef.current;
    if (!video || !stream || !isActive) return;

    // Attach stream to video DOM element after element has mounted
    video.srcObject = stream;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Webcam video auto-play prevented or delayed:', err);
      });
    }

    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [stream, isActive]);

  if (!isActive || !stream) {
    return null;
  }

  return (
    <video
      ref={activeRef as React.RefObject<HTMLVideoElement>}
      autoPlay
      playsInline
      muted
      className={`w-full h-full object-cover transform -scale-x-100 ${className}`}
    />
  );
};
