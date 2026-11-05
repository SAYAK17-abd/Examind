export function getGradeBadgeClass(grade?: string): string {
  switch (grade?.toUpperCase()) {
    case 'A+':
    case 'A':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'B+':
    case 'B':
      return 'bg-amber-400/15 text-amber-300 border-amber-400/30';
    case 'C+':
    case 'C':
      return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    case 'D':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'F':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

export function getStatusBadgeClass(status?: string): string {
  switch (status?.toUpperCase()) {
    case 'PUBLISHED':
    case 'ACTIVE':
    case 'EVALUATED':
    case 'PASSED':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'SUBMITTED':
    case 'IN_PROGRESS':
    case 'PENDING':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'DRAFT':
    case 'ARCHIVED':
      return 'bg-slate-800 text-slate-300 border-slate-700';
    case 'BLOCKED':
    case 'EXPIRED':
    case 'OVERRIDDEN':
    case 'FAILED':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}
