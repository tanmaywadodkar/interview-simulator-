import React from 'react';
import { Shield, User } from 'lucide-react';

interface NavbarProps {
  activeTab: 'landing' | 'setup' | 'interview' | 'report' | 'history';
  onNavigate: (tab: 'landing' | 'setup' | 'history') => void;
  onOpenPrivacy: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onNavigate, onOpenPrivacy }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#D9D9D4]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Header — Clicking navigates to Home */}
        <div 
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 cursor-pointer group"
          title="Return to Home"
        >
          <div className="w-2.5 h-6 rounded-full bg-[#2F6B5F]" />
          <div>
            <span className="font-bold text-base text-[#202124] tracking-tight block leading-none">
              AI Interviewer
            </span>
            <span className="text-xs text-[#6B6B6B] font-normal leading-tight mt-0.5 block">
              Interview Assessment Platform
            </span>
          </div>
        </div>

        {/* Minimalist Navigation Bar */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => onNavigate('landing')}
            className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'landing'
                ? 'text-[#2F6B5F] border-b-2 border-[#2F6B5F] pb-0.5' 
                : 'text-[#6B6B6B] hover:text-[#202124]'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => onNavigate('history')}
            className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'history'
                ? 'text-[#2F6B5F] border-b-2 border-[#2F6B5F] pb-0.5' 
                : 'text-[#6B6B6B] hover:text-[#202124]'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => onNavigate('setup')}
            className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'setup' || activeTab === 'interview'
                ? 'text-[#2F6B5F] border-b-2 border-[#2F6B5F] pb-0.5' 
                : 'text-[#6B6B6B] hover:text-[#202124]'
            }`}
          >
            Start Interview
          </button>

          <button
            onClick={() => onNavigate('history')}
            className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'history'
                ? 'text-[#2F6B5F] border-b-2 border-[#2F6B5F] pb-0.5' 
                : 'text-[#6B6B6B] hover:text-[#202124]'
            }`}
          >
            History
          </button>
        </nav>

        {/* Right Tools & User Profile */}
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenPrivacy}
            className="p-1.5 text-[#6B6B6B] hover:text-[#202124] transition-colors"
            title="Privacy & Data Control"
          >
            <Shield className="w-4 h-4" />
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#D9D9D4]">
            <div className="w-7 h-7 rounded-full bg-[#F5F5F3] border border-[#D9D9D4] text-[#2F6B5F] flex items-center justify-center text-xs font-bold">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium text-[#202124]">Profile</span>
          </div>

          <button
            onClick={() => onNavigate('setup')}
            className="md:hidden px-3 py-1.5 rounded bg-[#2F6B5F] text-white text-xs font-semibold"
          >
            Start
          </button>
        </div>
      </div>
    </header>
  );
};
