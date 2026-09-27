import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, UserCheck } from 'lucide-react';

interface InterviewerAvatarProps {
  questionText: string;
  currentStep: number;
  totalQuestions: number;
  role: string;
  isAiSpeaking: boolean;
  isThinking?: boolean;
  onSpeechEnd?: () => void;
}

export const InterviewerAvatar: React.FC<InterviewerAvatarProps> = ({
  questionText,
  currentStep,
  totalQuestions,
  role,
  isAiSpeaking,
  isThinking = false,
  onSpeechEnd,
}) => {
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Web Speech Synthesis audio readout
  useEffect(() => {
    if (!questionText || !ttsEnabled) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(questionText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        if (onSpeechEnd) onSpeechEnd();
      };
      
      window.speechSynthesis.speak(utterance);
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [questionText, ttsEnabled]);

  const toggleTts = () => {
    if (ttsEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setTtsEnabled(!ttsEnabled);
  };

  const getStatusText = () => {
    if (isThinking) return 'Thinking...';
    if (isAiSpeaking) return 'Speaking...';
    return 'Listening...';
  };

  const getStatusStyle = () => {
    if (isThinking) return 'bg-[#FEF8EC] text-[#B7791F] border-[#FAD79E]';
    if (isAiSpeaking) return 'bg-[#ECF5F2] text-[#2F6B5F] border-[#A7D7C5]';
    return 'bg-[#ECF5F2] text-[#2E7D5B] border-[#A7D7C5]';
  };

  return (
    <div className="bg-white rounded border border-[#D9D9D4] p-6 flex flex-col justify-between h-full shadow-strata">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#D9D9D4] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#F5F5F3] border border-[#D9D9D4] flex items-center justify-center text-[#2F6B5F]">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#202124]">AI Interviewer</h3>
            <p className="text-xs text-[#6B6B6B]">{role}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <span className={`px-2.5 py-0.5 rounded-sm text-xs font-semibold uppercase tracking-wider border ${getStatusStyle()}`}>
            {getStatusText()}
          </span>

          <button
            onClick={toggleTts}
            className="p-1 rounded border border-[#D9D9D4] bg-[#F5F5F3] text-[#6B6B6B] hover:text-[#202124] text-xs transition-colors"
            title={ttsEnabled ? 'Mute Audio Readout' : 'Enable Audio Readout'}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4 text-[#2F6B5F]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Question Display */}
      <div className="my-auto py-6 space-y-3">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-bold text-[#2F6B5F]">
          <Sparkles className="w-3.5 h-3.5" /> Question {currentStep} of {totalQuestions}
        </div>
        <h2 className="text-base sm:text-lg font-normal text-[#202124] leading-relaxed font-sans">
          "{questionText}"
        </h2>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-[#D9D9D4] text-[11px] text-[#6B6B6B] flex items-center justify-between font-medium">
        <span>Adaptive context active</span>
        <span>Audio readout: {ttsEnabled ? 'On' : 'Muted'}</span>
      </div>

    </div>
  );
};
