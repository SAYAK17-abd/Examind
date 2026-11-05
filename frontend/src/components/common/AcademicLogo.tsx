import React from 'react';

interface AcademicLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const AcademicLogo: React.FC<AcademicLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-8 h-8 p-1.5 rounded-xl',
    md: 'w-10 h-10 p-2 rounded-xl',
    lg: 'w-14 h-14 p-2.5 rounded-2xl',
  };

  const svgSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-9 h-9',
  };

  const titleSizes = {
    sm: 'text-base font-extrabold tracking-tight',
    md: 'text-lg font-extrabold tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Education Emblem: Graduation Cap + Open Book + AI Wisdom Node */}
      <div className="relative group cursor-pointer">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500/30 via-indigo-500/20 to-blue-500/30 blur-md opacity-70 group-hover:opacity-100 transition duration-500"></div>
        
        <div className={`relative ${iconSizes[size]} bg-gradient-to-br from-[#1E294B] via-[#141C33] to-[#0A0E1A] flex items-center justify-center border border-amber-400/30 shadow-xl shadow-black/40`}>
          <svg className={`${svgSizes[size]} text-amber-300 drop-shadow-[0_2px_8px_rgba(234,179,8,0.4)]`} viewBox="0 0 48 48" fill="none">
            {/* Mortarboard Cap Top */}
            <path d="M24 6L4 16L24 26L44 16L24 6Z" fill="url(#goldGrad)" stroke="#FDE047" strokeWidth="1.8" strokeLinejoin="round"/>
            {/* Mortarboard Cap Base */}
            <path d="M12 20.5V29C12 29 16 34 24 34C32 34 36 29 36 29V20.5" stroke="#FDE047" strokeWidth="1.8" strokeLinecap="round"/>
            {/* Tassel Hanging with AI Wisdom Spark */}
            <path d="M40 18V30" stroke="#60A5FA" strokeWidth="1.6" strokeLinecap="round"/>
            <circle cx="40" cy="32" r="2.2" fill="#60A5FA" stroke="#93C5FD" strokeWidth="1"/>
            {/* Open Book Base */}
            <path d="M14 38C17.5 36.5 21 37 24 39C27 37 30.5 36.5 34 38V44C30.5 42.5 27 43 24 45C21 43 17.5 42.5 14 44V38Z" fill="#1E293B" stroke="#CBD5E1" strokeWidth="1.5" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="goldGrad" x1="4" y1="6" x2="44" y2="26" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F59E0B"/>
                <stop offset="0.5" stopColor="#FBBF24"/>
                <stop offset="1" stopColor="#D97706"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1.5">
          <h1 className={`${titleSizes[size]} text-white flex items-center`}>
            <span>EXAM</span><span className="text-amber-400">IND</span>
          </h1>
          <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/25 tracking-wide">
            2.0
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[11px] text-slate-400 tracking-tight leading-none mt-0.5">
            AI Examination & Institutional Evaluation
          </p>
        )}
      </div>
    </div>
  );
};

