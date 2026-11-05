import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import { ResultSummaryResponse } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { formatDate } from '../../utils/date';
import { getGradeBadgeClass } from '../../utils/grade';
import { Award, ArrowRight, CheckCircle2, XCircle, Calendar, Sparkles } from 'lucide-react';

export const StudentResultsList: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<ResultSummaryResponse[]>([]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await studentService.getResults({ page: 0, size: 50 });
        setResults(res.content || []);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-150">
      <Breadcrumb
        items={[{ label: 'Student Dashboard', path: '/student' }, { label: 'Results & Feedback' }]}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-[#0B101D] via-[#0F172A] to-[#070B14] border border-slate-800 shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-xs font-bold text-amber-300 border border-amber-400/25 mb-2">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Evaluation Registry
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Evaluated Results</h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Review detailed question-by-question scoring, AI feedback, and teacher evaluations.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" label="Loading examination results..." className="py-20" />
      ) : results.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No results found"
          description="You do not have any published examination results yet. Take an exam to receive AI feedback."
          actionLabel="Browse Available Exams"
          onAction={() => navigate('/student/exams')}
        />
      ) : (
        <div className="space-y-3">
          {results.map((res) => (
            <div key={res.id} className="banger-card rounded-3xl overflow-hidden border border-slate-800 bg-[#0B101D] p-5 shadow-xl hover:border-slate-700 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-white">{res.examTitle}</h3>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border ${getGradeBadgeClass(
                        res.grade
                      )}`}
                    >
                      Grade {res.grade}
                    </span>
                    {res.passed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/25">
                        <CheckCircle2 className="w-3 h-3" /> Pass
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-md border border-rose-500/25">
                        <XCircle className="w-3 h-3" /> Needs Improvement
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="font-bold text-white font-mono">
                      Score: <strong className="text-amber-300">{res.obtainedMarks}</strong> / {res.totalMarks} ({res.percentage}%)
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {formatDate(res.publishedAt)}
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/student/results/${res.id}`)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  View Full Report
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
