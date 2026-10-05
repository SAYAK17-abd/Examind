import React, { useState, useEffect } from 'react';
import { formatSecondsToTimer, calculateRemainingSeconds } from '../../utils/date';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ExamTimerProps {
  dueAt: string;
  initialRemainingSeconds?: number;
  onExpire: () => void;
}

export const ExamTimer: React.FC<ExamTimerProps> = ({
  dueAt,
  initialRemainingSeconds,
  onExpire,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    calculateRemainingSeconds(dueAt, initialRemainingSeconds)
  );

  useEffect(() => {
    // Initial sync
    setSecondsLeft(calculateRemainingSeconds(dueAt, initialRemainingSeconds));

    const interval = setInterval(() => {
      const remaining = calculateRemainingSeconds(dueAt);
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [dueAt, initialRemainingSeconds, onExpire]);

  const isCritical = secondsLeft <= 60;
  const isWarning = secondsLeft <= 300 && !isCritical;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold tracking-wider transition-all shadow-sm',
        isCritical && 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse ring-2 ring-rose-400',
        isWarning && 'bg-amber-50 text-amber-700 border-amber-300',
        !isCritical && !isWarning && 'bg-white text-slate-800 border-slate-200'
      )}
      role="timer"
      aria-live="polite"
    >
      {isCritical ? (
        <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
      ) : (
        <Clock className={cn('w-4 h-4', isWarning ? 'text-amber-600' : 'text-indigo-600')} />
      )}
      <span>{formatSecondsToTimer(secondsLeft)}</span>
      {isCritical && <span className="text-[10px] uppercase font-sans font-extrabold">Final Minute</span>}
    </div>
  );
};
