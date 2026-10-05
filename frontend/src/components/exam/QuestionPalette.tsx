import React from 'react';
import { cn } from '../../utils/cn';
import { Bookmark } from 'lucide-react';

export interface QuestionPaletteProps {
  totalQuestions: number;
  currentIndex: number;
  answeredIndices: Set<number>;
  flaggedIndices: Set<number>;
  onSelectQuestion: (index: number) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  totalQuestions,
  currentIndex,
  answeredIndices,
  flaggedIndices,
  onSelectQuestion,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Questions ({answeredIndices.size}/{totalQuestions})
        </h4>
      </div>

      {/* Grid of numbers */}
      <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
        {Array.from({ length: totalQuestions }, (_, i) => {
          const isCurrent = i === currentIndex;
          const isAnswered = answeredIndices.has(i);
          const isFlagged = flaggedIndices.has(i);

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectQuestion(i)}
              className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all',
                isCurrent && 'ring-2 ring-indigo-600 ring-offset-2',
                isAnswered
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                isFlagged && !isAnswered && 'border-2 border-amber-400 bg-amber-50 text-amber-900'
              )}
              aria-label={`Go to question ${i + 1}`}
            >
              <span>{i + 1}</span>
              {isFlagged && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
                  <Bookmark className="w-2.5 h-2.5 fill-current" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Palette Legend */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-indigo-600" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
          <span>Unanswered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-400" />
          <span>Flagged</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded ring-2 ring-indigo-600 ring-offset-1 bg-white" />
          <span>Current</span>
        </div>
      </div>
    </div>
  );
};
