import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-bold text-slate-300 tracking-wide">
            {label}
            {props.required && <span className="text-amber-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-xl shadow-sm">
          <textarea
            id={textareaId}
            ref={ref}
            rows={props.rows || 4}
            className={cn(
              'block w-full rounded-xl border border-slate-700/80 bg-[#070B14] px-3.5 py-2.5 text-sm text-white transition-all',
              'placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/40 shadow-inner',
              error
                ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/30'
                : 'border-slate-700/80 focus:border-amber-400 focus:ring-amber-400/30',
              props.disabled && 'bg-slate-900/60 text-slate-500 border-slate-800 cursor-not-allowed',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
