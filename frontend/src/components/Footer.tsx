import React from 'react';
import { Bot, Shield, Code, Cpu } from 'lucide-react';

interface FooterProps {
  onOpenPrivacy: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy }) => {
  return (
    <footer className="w-full bg-[#070a11] border-t border-slate-800/80 pt-12 pb-8 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">AI Interview Simulator</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              An intelligent, dynamic interview preparation platform designed to help software engineers, data scientists, and technical professionals practice real-time interviews with AI-driven answer evaluation and non-diagnostic communication metric insights.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
              <span className="flex items-center gap-1.5"><Cpu className="w-4 h-4 text-indigo-400" /> Python FastAPI Engine</span>
              <span className="flex items-center gap-1.5"><Code className="w-4 h-4 text-blue-400" /> React + OpenCV Architecture</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Supported Roles</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Software Engineer</li>
              <li>AI / ML Engineer</li>
              <li>Data Scientist</li>
              <li>Web Developer</li>
              <li>Custom Technical & HR Roles</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Privacy & Security</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button onClick={onOpenPrivacy} className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Privacy Notice
                </button>
              </li>
              <li>Local Browser Audio Processing</li>
              <li>No Persistent Video Storage</li>
              <li>Instant History Wipe Available</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 AI Interview Simulator. Built for high-performance practice.</p>
          <div className="flex items-center gap-4">
            <button onClick={onOpenPrivacy} className="hover:text-slate-300">Privacy & Terms</button>
            <span>•</span>
            <span className="text-indigo-400">Python 3.11+ / FastAPI</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
