import React from 'react';
import { Shield, X, Eye, Mic, Server, CheckCircle2 } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-[#D9D9D4] rounded max-w-2xl w-full p-6 shadow-strata-md relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D9D9D4] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-[#F5F5F3] text-[#2F6B5F] border border-[#D9D9D4]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#202124]">Privacy & Ethics Standards</h3>
              <p className="text-xs text-[#6B6B6B]">Transmitted camera and audio data principles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#6B6B6B] hover:text-[#202124] hover:bg-[#F5F5F3] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs text-[#6B6B6B]">
          
          <div className="p-4 rounded bg-[#F5F5F3] border border-[#D9D9D4] space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-[#202124]">
              <Mic className="w-4 h-4 text-[#2F6B5F]" /> Camera & Microphone Permissions
            </div>
            <p className="leading-relaxed">
              Your camera and microphone are accessed strictly with explicit browser permission during live interview sessions. Raw video files are not saved to server disk.
            </p>
          </div>

          <div className="p-4 rounded bg-[#F5F5F3] border border-[#D9D9D4] space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-[#202124]">
              <Eye className="w-4 h-4 text-[#2F6B5F]" /> Visual Communication Metrics
            </div>
            <p className="leading-relaxed">
              Computer vision algorithms evaluate geometric metrics (such as head positioning and eye contact ratios) solely for professional presentation feedback.
            </p>
            <div className="p-2.5 rounded bg-[#FEF8EC] border border-[#FAD79E] text-[#B7791F] text-[11px] font-medium mt-2">
              ⚠️ Disclaimer: This system does NOT infer, evaluate, or diagnose emotions, psychological traits, mental health, or personal characteristics.
            </div>
          </div>

          <div className="p-4 rounded bg-[#F5F5F3] border border-[#D9D9D4] space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-[#202124]">
              <Server className="w-4 h-4 text-[#2F6B5F]" /> Data Storage & Local Control
            </div>
            <p className="leading-relaxed">
              Transcripts and assessment reports are stored securely in your local SQLite database instance. You can delete any session record from your candidate dashboard at any time.
            </p>
          </div>

          <div className="pt-2">
            <h4 className="font-semibold text-[#202124] mb-2 text-xs uppercase tracking-wider">Privacy Commitments</h4>
            <ul className="space-y-1.5 text-xs text-[#6B6B6B]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D5B] flex-shrink-0" />
                No raw video recording files stored on server disks
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D5B] flex-shrink-0" />
                No selling or sharing of candidate transcripts
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D5B] flex-shrink-0" />
                One-click local session deletion for complete data removal
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 border-t border-[#D9D9D4] pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 strata-button-primary text-xs"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
