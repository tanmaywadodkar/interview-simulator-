import React from 'react';
import { Shield } from 'lucide-react';

interface FooterProps {
  onOpenPrivacy: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy }) => {
  return (
    <footer className="w-full bg-white border-t border-[#D9D9D4] py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6B6B]">
        
        {/* Left Branding */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2F6B5F]" />
          <span className="font-bold text-[#202124]">AI Interviewer</span>
          <span>— Interview Assessment Platform</span>
        </div>

        {/* Right Links & Attribution */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onOpenPrivacy}
            className="hover:text-[#202124] transition-colors flex items-center gap-1 font-medium"
          >
            <Shield className="w-3.5 h-3.5 text-[#2F6B5F]" /> Privacy & Data Policy
          </button>
          <span>•</span>
          <span>Design reference: <a href="https://html5up.net" target="_blank" rel="noopener noreferrer" className="hover:underline text-[#2F6B5F]">HTML5 UP (CCA 3.0)</a></span>
        </div>

      </div>
    </footer>
  );
};
