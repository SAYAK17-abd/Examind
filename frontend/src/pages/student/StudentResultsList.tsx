import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import { ResultSummaryResponse } from '../../types';
import { Card, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { formatDate } from '../../utils/date';
import { getGradeBadgeClass } from '../../utils/grade';
import { Award, ArrowRight, CheckCircle2, XCircle, Calendar } from 'lucide-react';

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
    <div className="space-y-6 animate-in fade-in duration-150">
      <Breadcrumb
        items={[{ label: 'Student Dashboard', path: '/student' }, { label: 'Results & Feedback' }]}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Evaluated Results</h1>
          <p className="text-xs text-slate-500 mt-0.5">
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
            <Card key={res.id} hover className="overflow-hidden">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">{res.examTitle}</h3>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getGradeBadgeClass(
                        res.grade
                      )}`}
                    >
                      Grade {res.grade}
                    </span>
                    {res.passed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Pass
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <XCircle className="w-3 h-3" /> Needs Improvement
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      Score: {res.obtainedMarks} / {res.totalMarks} ({res.percentage}%)
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
