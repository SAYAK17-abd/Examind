export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function getConfidenceBadgeColor(confidence?: number | null): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  if (confidence === undefined || confidence === null) {
    return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', label: 'N/A' };
  }
  const pct = confidence > 1 ? confidence : Math.round(confidence * 100);
  if (pct >= 85) {
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: `${pct}% High` };
  }
  if (pct >= 65) {
    return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: `${pct}% Moderate` };
  }
  return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: `${pct}% Low` };
}
