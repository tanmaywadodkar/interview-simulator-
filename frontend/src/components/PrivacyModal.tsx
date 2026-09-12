import React from 'react';
import { Shield, X, Lock, Eye, Mic, Server, CheckCircle2 } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111827] border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Privacy & Ethics Policy</h3>
              <p className="text-xs text-slate-400">Transmitted and analyzed data standards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 text-sm text-slate-300">
          
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-indigo-400">
              <Mic className="w-4 h-4" /> Camera & Microphone Permissions
            </div>
            <p className="text-xs text-slate-400">
              Your webcam and microphone are accessed only with your explicit browser permission during live interview sessions. Raw video feeds are never saved to disk by default.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-blue-400">
              <Eye className="w-4 h-4" /> Visual & Communication Metrics Notice
            </div>
            <p className="text-xs text-slate-400">
              Computer vision features analyze basic geometric metrics (such as head alignment and eye-contact ratios) solely for professional communication feedback.
            </p>
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mt-2 font-medium">
              ⚠️ Important Disclaimer: This platform does NOT evaluate, infer, or diagnose psychological conditions, emotional state, mental health, or sensitive personal characteristics.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <Server className="w-4 h-4" /> Data Storage & Local Control
            </div>
            <p className="text-xs text-slate-400">
              Interview transcripts and evaluations are stored in your local SQLite database instance. You maintain full ownership and can delete any interview session at any time directly from the History dashboard.
            </p>
          </div>

          <div className="pt-2">
            <h4 className="font-semibold text-white mb-2 text-xs uppercase tracking-wider">Our Privacy Commitments</h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                No raw video recordings stored on server disks
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                No selling or sharing of candidate transcripts
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                One-click local session deletion for full data removal
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-800 pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
