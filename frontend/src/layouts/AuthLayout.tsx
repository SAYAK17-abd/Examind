import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AcademicLogo } from '../components/common/AcademicLogo';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#080C17]">
      {/* Left Hero Branding Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F172A] via-[#162038] to-[#080C17] p-12 text-white flex-col justify-between relative overflow-hidden border-r border-slate-800/80">
        {/* Background decorative blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-8">
            <AcademicLogo size="lg" />
          </div>

          <div className="space-y-6 max-w-lg mt-12">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white">
              Next-generation assessment, powered by rigorous AI evaluation and OCR.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Standardized rubric evaluation, multi-criterion scoring, automated OCR answer sheet processing,
              and cross-submission similarity detection built for modern institutions.
            </p>

            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-provider OCR pipeline for physical & digital answer sheets</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Concept-driven semantic grading with teacher audit overrides</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-time backend-synchronized timed test execution</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Institutional Security & Privacy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI Multi-Signal Engine Ready</span>
          </div>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="flex lg:hidden items-center justify-center mb-8">
            <AcademicLogo size="md" />
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
};
