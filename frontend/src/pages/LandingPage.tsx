import React from 'react';
import { Play, Sparkles, Shield, Cpu, Award, Mic, CheckCircle2, ArrowRight, Video, FileText, Zap, BarChart2 } from 'lucide-react';

interface LandingPageProps {
  onStartInterview: () => void;
  onOpenPrivacy: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartInterview, onOpenPrivacy }) => {
  return (
    <div className="space-y-24 pb-20">
      
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-16 overflow-hidden">
        {/* Glow background accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 text-indigo-400 text-xs font-semibold shadow-lg">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>AI-POWERED INTERVIEW SIMULATOR 1.0</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
            Practice Interviews.{' '}
            <span className="text-gradient">Improve How You Perform.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            An AI-powered interview simulator that conducts realistic interviews and gives personalized feedback on your answers and communication.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onStartInterview}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Interview Now</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-base flex items-center justify-center gap-2 transition-all"
            >
              <span>How It Works</span>
            </a>
          </div>

          {/* Feature Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-400 border-t border-slate-800/80 max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Dynamic AI Follow-ups
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Real-time Speech-to-Text
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400" /> Non-verbal Camera HUD
            </div>
          </div>
        </div>
      </section>

      {/* AI INTERVIEWER PREVIEW SECTION */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800/80 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                <Video className="w-3.5 h-3.5" /> Interactive Room Experience
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Feels like a real technical interview.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                The AI reads your candidate profile, asks tailored technical & behavioral questions, listens through your microphone, and asks dynamic follow-ups based on your exact answers.
              </p>
              <button
                onClick={onStartInterview}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all flex items-center gap-2"
              >
                <span>Try Demo Interview</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mock Room UI Card */}
            <div className="lg:col-span-7 bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-inner space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-slate-200">AI Senior Tech Lead</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-md bg-slate-900 text-indigo-400 border border-slate-800 font-mono">
                  Question 2 / 5
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-sm text-slate-200 leading-relaxed">
                "Interesting. What dataset did you use for training your model, and how did you address class imbalance in your pipeline?"
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-indigo-400 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 animate-bounce" /> Live Candidate Transcript:
                </div>
                <p className="italic text-slate-300">
                  "I used a custom dataset of 15,000 images and applied SMOTE alongside focal loss to handle severe class imbalance..."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">How It Works</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            From setup to performance report in four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-2xl space-y-3 relative border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-extrabold">
              1
            </div>
            <h3 className="font-bold text-white text-base">Select Role & Setup</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose your role (Software Engineer, Data Scientist, etc.), experience level, difficulty, and optionally paste your resume.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3 relative border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-extrabold">
              2
            </div>
            <h3 className="font-bold text-white text-base">Answer via Microphone</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Speak naturally into your microphone. Web Speech API converts your voice to text in real time.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3 relative border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-extrabold">
              3
            </div>
            <h3 className="font-bold text-white text-base">Dynamic AI Follow-ups</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The AI interviewer evaluates your answer on relevance, technical accuracy, and structure, then asks targeted follow-ups.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3 relative border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold">
              4
            </div>
            <h3 className="font-bold text-white text-base">Performance Report</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Get an overall score out of 100, category breakdowns, strengths, areas to improve, and sample ideal answers.
            </p>
          </div>
        </div>
      </section>

      {/* PERFORMANCE REPORT PREVIEW SECTION */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="glass-panel rounded-3xl p-8 border border-slate-800 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
                <BarChart2 className="w-3.5 h-3.5" /> Actionable Analytics
              </div>
              <h2 className="text-2xl font-bold text-white">Comprehensive Performance Reports</h2>
              <p className="text-xs text-slate-400">Detailed question-by-question scoring and communication feedback</p>
            </div>

            <div className="px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3">
              <span className="text-3xl font-extrabold">82</span>
              <div className="text-xs">
                <div className="font-bold">Overall Score</div>
                <div className="text-slate-400">Out of 100</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="font-semibold text-emerald-400 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4" /> What You Did Well
              </h4>
              <p className="text-xs text-slate-300">
                Provided strong technical explanations and demonstrated architecture familiarity for the software engineering role.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="font-semibold text-amber-400 flex items-center gap-1.5 text-xs">
                <Zap className="w-4 h-4" /> Key Area to Improve
              </h4>
              <p className="text-xs text-slate-300">
                Structure your responses consistently using the STAR framework to emphasize quantifiable project results.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="font-semibold text-indigo-400 flex items-center gap-1.5 text-xs">
                <Video className="w-4 h-4" /> Communication Metrics
              </h4>
              <p className="text-xs text-slate-300">
                Maintained 85% eye contact ratio with steady speaking cadence (~140 WPM) throughout the interview session.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL BOTTOM CTA */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-6">
        <h2 className="text-3xl font-extrabold text-white">Ready to test your interview skills?</h2>
        <p className="text-sm text-slate-400">No credit card required. Works out of the box in Demo Mode.</p>
        <button
          onClick={onStartInterview}
          className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-xl shadow-indigo-600/30 inline-flex items-center gap-3 transition-all hover:scale-105"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Launch AI Interview Room</span>
        </button>
      </section>

    </div>
  );
};
