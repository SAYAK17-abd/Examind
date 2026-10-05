export function getGradeBadgeClass(grade?: string): string {
  switch (grade?.toUpperCase()) {
    case 'A+':
    case 'A':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'B+':
    case 'B':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'C+':
    case 'C':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'D':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'F':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export function getStatusBadgeClass(status?: string): string {
  switch (status?.toUpperCase()) {
    case 'PUBLISHED':
    case 'ACTIVE':
    case 'EVALUATED':
    case 'PASSED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'SUBMITTED':
    case 'IN_PROGRESS':
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'DRAFT':
    case 'ARCHIVED':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'BLOCKED':
    case 'EXPIRED':
    case 'OVERRIDDEN':
    case 'FAILED':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}
