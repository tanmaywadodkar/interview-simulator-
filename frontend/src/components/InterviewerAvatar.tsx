import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, Bot } from 'lucide-react';

interface InterviewerAvatarProps {
  questionText: string;
  currentStep: number;
  totalQuestions: number;
  role: string;
  isAiSpeaking: boolean;
  onSpeechEnd?: () => void;
}

export const InterviewerAvatar: React.FC<InterviewerAvatarProps> = ({
  questionText,
  currentStep,
  totalQuestions,
  role,
  isAiSpeaking,
  onSpeechEnd,
}) => {
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Synthesize speech using Web Speech Synthesis API if available
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

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header info */}
      <div className="flex items-center justify-between z-10 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center p-0.5">
              <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            {isAiSpeaking && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-ping" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">AI Senior Interviewer</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {role}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isAiSpeaking ? 'Speaking question...' : 'Listening to your response'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTts}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
              ttsEnabled 
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-600/30'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title={ttsEnabled ? 'Disable Voice Readout' : 'Enable Voice Readout'}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{ttsEnabled ? 'Audio On' : 'Muted'}</span>
          </button>

          <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-300">
            Question {currentStep} / {totalQuestions}
          </span>
        </div>
      </div>

      {/* Main Avatar Graphic & Speaking Animation */}
      <div className="my-auto py-6 flex flex-col items-center justify-center text-center z-10">
        <div className="relative mb-6">
          <div className={`w-28 h-28 rounded-3xl bg-slate-900/90 border-2 flex items-center justify-center transition-all ${
            isAiSpeaking ? 'border-indigo-500 pulse-glow shadow-indigo-500/20' : 'border-slate-800'
          }`}>
            <Bot className={`w-14 h-14 ${isAiSpeaking ? 'text-indigo-400 scale-110' : 'text-slate-500'} transition-transform duration-300`} />
          </div>

          {/* Animated audio wave bars when speaking */}
          {isAiSpeaking && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-slate-900 rounded-full border border-indigo-500/40">
              <span className="w-1 h-3 bg-indigo-400 rounded-full animate-pulse" />
              <span className="w-1 h-5 bg-indigo-400 rounded-full animate-pulse delay-75" />
              <span className="w-1 h-2 bg-indigo-400 rounded-full animate-pulse delay-150" />
              <span className="w-1 h-4 bg-indigo-400 rounded-full animate-pulse delay-100" />
            </div>
          )}
        </div>

        {/* Display Current Question */}
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-2 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Current Interview Prompt
          </p>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-100 leading-relaxed font-sans">
            "{questionText}"
          </h2>
        </div>
      </div>

      {/* Bottom hint bar */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span>Dynamic follow-up generated based on your candidate profile</span>
        </div>
        <span className="hidden sm:inline text-slate-500">Press microphone below to start answering</span>
      </div>
    </div>
  );
};
