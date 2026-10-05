import React from 'react';
import { Outlet } from 'react-router-dom';
import { GraduationCap, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Left Hero Branding Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Background decorative blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-700 shadow-xl">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">EXAMIND</span>
              <p className="text-xs text-indigo-200">AI-Powered Examination & Assessment Intelligence</p>
            </div>
          </div>

          <div className="space-y-6 max-w-lg mt-12">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
              Next-generation assessment, powered by rigorous AI evaluation and OCR.
            </h1>
            <p className="text-sm text-indigo-200 leading-relaxed">
              Standardized rubric evaluation, multi-criterion scoring, automated OCR answer sheet processing,
              and cross-submission similarity detection built for modern institutions.
            </p>

            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3 text-xs text-indigo-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-provider OCR pipeline for physical & digital answer sheets</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-indigo-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Concept-driven semantic grading with teacher audit overrides</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-indigo-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-time backend-synchronized timed test execution</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-indigo-700/50 flex items-center justify-between text-xs text-indigo-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Enterprise Grade Security</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI Models Ready</span>
          </div>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-xl font-black text-slate-900">EXAMIND</span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
};
