import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onStartInterview: () => void;
  onOpenPrivacy: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartInterview, onOpenPrivacy }) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  // IntersectionObserver refs for scroll reveal elements
  const previewRef = useRef<HTMLDivElement | null>(null);
  const featuresHeaderRef = useRef<HTMLDivElement | null>(null);
  const featureListRef = useRef<HTMLDivElement | null>(null);
  const privacyRef = useRef<HTMLDivElement | null>(null);

  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isFeaturesHeaderVisible, setIsFeaturesHeaderVisible] = useState(false);
  const [isFeatureListVisible, setIsFeatureListVisible] = useState(false);
  const [isPrivacyVisible, setIsPrivacyVisible] = useState(false);

  // Scroll progress listener for top 2px progress indicator
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver setup for refined reveal animations
  useEffect(() => {
    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.15,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target === previewRef.current) setIsPreviewVisible(true);
          if (entry.target === featuresHeaderRef.current) setIsFeaturesHeaderVisible(true);
          if (entry.target === featureListRef.current) setIsFeatureListVisible(true);
          if (entry.target === privacyRef.current) setIsPrivacyVisible(true);
        }
      });
    }, observerOptions);

    if (previewRef.current) observer.observe(previewRef.current);
    if (featuresHeaderRef.current) observer.observe(featuresHeaderRef.current);
    if (featureListRef.current) observer.observe(featureListRef.current);
    if (privacyRef.current) observer.observe(privacyRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-20 pb-20 relative">
      
      {/* Subtle 2px Top Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-[2px] bg-[#2F6B5F] z-50 transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* EDITORIAL HERO SECTION (Staggered Entrance Animation) */}
      <section className="pt-20 pb-10 max-w-3xl mx-auto px-4 text-center space-y-6">
        
        {/* Tagline */}
        <div className="inline-block text-xs uppercase tracking-widest font-bold text-[#2F6B5F] border-b-2 border-[#2F6B5F] pb-1 animate-fadeIn">
          AI Interview Assessment Platform
        </div>

        {/* Heading — Stagger 0ms */}
        <h1 
          className="text-4xl sm:text-5xl font-normal text-[#202124] tracking-tight leading-tight transition-all duration-700 ease-out"
          style={{
            animation: 'heroSlideUp 700ms ease-out forwards',
          }}
        >
          Practice Interviews.<br />
          <span className="font-bold text-[#202124]">Perform With Confidence.</span>
        </h1>

        {/* Subtitle — Stagger 100ms */}
        <p 
          className="text-base sm:text-lg text-[#6B6B6B] max-w-xl mx-auto leading-relaxed transition-all duration-700 ease-out"
          style={{
            animation: 'heroSlideUp 700ms ease-out 100ms forwards',
            opacity: 0,
          }}
        >
          Practice realistic interviews with an adaptive AI interviewer and receive structured feedback on your answers and communication.
        </p>

        {/* CTA Buttons — Stagger 200ms */}
        <div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 transition-all duration-700 ease-out"
          style={{
            animation: 'heroSlideUp 700ms ease-out 200ms forwards',
            opacity: 0,
          }}
        >
          <button
            onClick={onStartInterview}
            className="w-full sm:w-auto px-8 py-3.5 strata-button-primary text-sm flex items-center justify-center gap-2 group"
          >
            <span>Start an Interview</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-3.5 strata-button-secondary text-sm flex items-center justify-center"
          >
            View How It Works
          </a>
        </div>
      </section>

      {/* CLEAN PRODUCT PREVIEW FRAME (Scroll Reveal + Subtle Scale Entrance) */}
      <section 
        ref={previewRef}
        className="max-w-4xl mx-auto px-4 transition-all duration-700 ease-out"
        style={{
          opacity: isPreviewVisible ? 1 : 0,
          transform: isPreviewVisible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.98)',
        }}
      >
        <div className="bg-white border border-[#D9D9D4] rounded shadow-strata-md overflow-hidden hover:translate-y-[-2px] transition-transform duration-300">
          {/* Header Bar */}
          <div className="bg-[#F5F5F3] px-5 py-3 border-b border-[#D9D9D4] flex items-center justify-between text-xs text-[#6B6B6B]">
            <div className="flex items-center gap-2 font-medium text-[#202124]">
              <span className="w-2 h-2 rounded-full bg-[#2E7D5B]" />
              <span>Interview Room — Live Candidate Assessment</span>
            </div>
            <span className="text-[11px] font-semibold text-[#2F6B5F] uppercase tracking-wider">
              Question 3 of 5
            </span>
          </div>

          {/* Interactive UI Mock Window */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-5 bg-[#FAFAFA]">
            {/* Left Mock Video Area */}
            <div className="md:col-span-8 bg-[#202124] rounded h-60 flex flex-col justify-between p-4 relative">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-black/60 text-white text-[11px] font-medium flex items-center gap-1.5 rounded-sm">
                  <span className="w-2 h-2 rounded-full bg-[#2E7D5B]" /> Candidate Stream
                </span>
                <span className="px-2.5 py-0.5 bg-[#2E7D5B]/20 text-[#2E7D5B] text-[10px] font-semibold rounded-sm border border-[#2E7D5B]/30">
                  Face ✓ Detected
                </span>
              </div>
              <div className="text-center text-stone-400 text-xs py-8">
                [ 16:9 Real-Time Webcam Stream ]
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-[#2E7D5B] text-white text-[11px] font-semibold rounded-sm">
                  Camera On
                </span>
                <span className="px-2.5 py-1 bg-white/10 text-stone-200 text-[11px] font-semibold rounded-sm">
                  Mic Listening
                </span>
              </div>
            </div>

            {/* Right AI Panel Mock */}
            <div className="md:col-span-4 bg-white border border-[#D9D9D4] rounded p-4 flex flex-col justify-between space-y-4">
              <div>
                <div className="border-b border-[#D9D9D4] pb-2.5 flex items-center justify-between">
                  <span className="font-bold text-xs text-[#202124]">AI Interviewer</span>
                  <span className="text-[10px] text-[#2E7D5B] font-semibold uppercase tracking-wider">Listening...</span>
                </div>
                <div className="pt-3 space-y-1.5">
                  <span className="text-[10px] font-semibold text-[#2F6B5F] uppercase tracking-wider">Question 3</span>
                  <p className="text-xs text-[#202124] leading-relaxed">
                    "Tell me about a challenging technical problem you solved and how you structured your approach."
                  </p>
                </div>
              </div>
              <div className="p-2 bg-[#F5F5F3] border border-[#D9D9D4] text-[11px] text-[#6B6B6B] rounded-sm">
                ● Live speech-to-text response active
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STRATA-INSPIRED FEATURE SECTION (Scroll Reveal + Feature Stagger) */}
      <section id="features" className="max-w-4xl mx-auto px-4 space-y-10 pt-8 border-t border-[#D9D9D4]">
        
        {/* Section Heading Reveal */}
        <div 
          ref={featuresHeaderRef}
          className="text-center space-y-2 transition-all duration-600 ease-out"
          style={{
            opacity: isFeaturesHeaderVisible ? 1 : 0,
            transform: isFeaturesHeaderVisible ? 'translateY(0)' : 'translateY(16px)',
          }}
        >
          <h2 className="text-2xl font-normal text-[#202124] tracking-tight">Structured Assessment Capabilities</h2>
          <p className="text-xs text-[#6B6B6B] max-w-md mx-auto">
            Everything required to evaluate candidate technical clarity, answer structure, and presentation.
          </p>
        </div>

        {/* 4 Feature Cards Staggered Reveal */}
        <div 
          ref={featureListRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          
          <div 
            className="space-y-2 border-l-2 border-[#2F6B5F] pl-4 transition-all duration-600 ease-out"
            style={{
              opacity: isFeatureListVisible ? 1 : 0,
              transform: isFeatureListVisible ? 'translateY(0)' : 'translateY(16px)',
              transitionDelay: '0ms',
            }}
          >
            <h3 className="font-bold text-[#202124] text-base">Adaptive Interviews</h3>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              The AI adjusts follow-up questions in real-time based on your answers, target job role, and experience level.
            </p>
          </div>

          <div 
            className="space-y-2 border-l-2 border-[#2F6B5F] pl-4 transition-all duration-600 ease-out"
            style={{
              opacity: isFeatureListVisible ? 1 : 0,
              transform: isFeatureListVisible ? 'translateY(0)' : 'translateY(16px)',
              transitionDelay: '100ms',
            }}
          >
            <h3 className="font-bold text-[#202124] text-base">Answer Evaluation</h3>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Detailed assessment of answer relevance, technical accuracy, clarity, and STAR response structure.
            </p>
          </div>

          <div 
            className="space-y-2 border-l-2 border-[#2F6B5F] pl-4 transition-all duration-600 ease-out"
            style={{
              opacity: isFeatureListVisible ? 1 : 0,
              transform: isFeatureListVisible ? 'translateY(0)' : 'translateY(16px)',
              transitionDelay: '200ms',
            }}
          >
            <h3 className="font-bold text-[#202124] text-base">Communication Feedback</h3>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Review observable speaking speed (WPM), filler word usage, and camera presentation alignment metrics.
            </p>
          </div>

          <div 
            className="space-y-2 border-l-2 border-[#2F6B5F] pl-4 transition-all duration-600 ease-out"
            style={{
              opacity: isFeatureListVisible ? 1 : 0,
              transform: isFeatureListVisible ? 'translateY(0)' : 'translateY(16px)',
              transitionDelay: '300ms',
            }}
          >
            <h3 className="font-bold text-[#202124] text-base">Performance History</h3>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Compare overall interview scores and track performance improvement over time on your dashboard.
            </p>
          </div>

        </div>
      </section>

      {/* PRIVACY POLICY & FINAL CTA SECTION */}
      <section 
        ref={privacyRef}
        className="max-w-2xl mx-auto px-4 transition-all duration-600 ease-out"
        style={{
          opacity: isPrivacyVisible ? 1 : 0,
          transform: isPrivacyVisible ? 'translateY(0)' : 'translateY(16px)',
        }}
      >
        <div className="bg-white p-6 border border-[#D9D9D4] rounded flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6B6B]">
          <div className="space-y-1">
            <span className="font-bold text-[#202124] block">Privacy & Data Security</span>
            <span>Microphone and webcam feeds are evaluated locally. Video files are never stored on server disk.</span>
          </div>

          <button
            onClick={onOpenPrivacy}
            className="px-4 py-2 strata-button-secondary text-xs whitespace-nowrap"
          >
            Privacy Policy
          </button>
        </div>
      </section>

      {/* Inline Keyframe Styles for Hero Entrance */}
      <style>{`
        @keyframes heroSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *, ::before, ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

    </div>
  );
};
