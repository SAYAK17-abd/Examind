import React from 'react';
import { CheckCircle2, Loader2, Clock, AlertCircle } from 'lucide-react';

export type SaveState = 'saved' | 'saving' | 'unsaved' | 'error';

export interface AutosaveIndicatorProps {
  state: SaveState;
  lastSavedAt?: string;
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({ state, lastSavedAt }) => {
  if (state === 'saving') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Save failed (retrying)</span>
      </div>
    );
  }

  if (state === 'unsaved') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
        <Clock className="w-3.5 h-3.5" />
        <span>Unsaved changes</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span>{lastSavedAt ? `Saved at ${lastSavedAt}` : 'Saved'}</span>
    </div>
  );
};
