import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherService } from '../../services/teacherService';
import { SubmissionSummaryResponse, ExamResponse } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { formatDate, formatDateTime } from '../../utils/date';
import { getConfidenceBadgeColor } from '../../utils/format';
import { getStatusBadgeClass } from '../../utils/grade';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../api/client';
import {
  FileCheck2,
  Search,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Eye,
  Filter,
  ArrowLeft,
} from 'lucide-react';

export const SubmissionMonitoring: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<SubmissionSummaryResponse[]>([]);
  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number>(examId ? Number(examId) : 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyReviewRequired, setOnlyReviewRequired] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await teacherService.getExams({ page: 0, size: 50 });
        const list = res.content || [];
        setExams(list);
        if (!selectedExamId && list.length > 0) {
          setSelectedExamId(list[0].id);
        }
      } catch (err) {
        toast.error(extractErrorMessage(err), 'Failed to fetch exam list');
      }
    };

    fetchExams();
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;

    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const res = await teacherService.getSubmissions(selectedExamId, { page: 0, size: 50 });
        setSubmissions(res.content || []);
      } catch (err) {
        toast.error(extractErrorMessage(err), 'Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [selectedExamId, toast]);

  const currentExam = exams.find((e) => e.id === selectedExamId);

  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch =
      (s.studentName && s.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.studentEmail && s.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesReview = onlyReviewRequired ? s.requiresReview : true;

    return matchesSearch && matchesReview;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      <Breadcrumb
        items={[
          { label: 'Teacher Dashboard', path: '/teacher' },
          { label: 'Submissions & Review' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Submission Monitoring & Review
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time student test submissions, view AI confidence reliability, and review low-confidence assessments.
          </p>
        </div>

        {/* Exam Selector */}
        {exams.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Exam:</span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(Number(e.target.value))}
              className="text-xs font-semibold rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} ({exam.subject})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Search student name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-xl">
            <input
              type="checkbox"
              checked={onlyReviewRequired}
              onChange={(e) => setOnlyReviewRequired(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Only Review Required ({submissions.filter((s) => s.requiresReview).length})
            </span>
          </label>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" label="Loading student submissions..." className="py-20" />
      ) : filteredSubmissions.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No submissions found"
          description="There are currently no student submissions matching your filter criteria."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4 pl-6">Student</th>
                  <th className="p-4">Submission Status</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">AI Confidence</th>
                  <th className="p-4">Submitted At</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => {
                  const conf = getConfidenceBadgeColor(sub.confidence);

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-900">
                        <div>
                          <span>{sub.studentName || `Student #${sub.studentId}`}</span>
                          <span className="text-[11px] text-slate-400 font-normal block">
                            {sub.studentEmail || `ID: ${sub.studentId}`}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadgeClass(
                              sub.status
                            )}`}
                          >
                            {sub.status}
                          </span>
                          {sub.requiresReview && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> Review
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 font-semibold text-slate-800">
                        {sub.obtainedMarks !== undefined && sub.obtainedMarks !== null ? (
                          <span>
                            {sub.obtainedMarks} / {sub.totalMarks || 100}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Pending</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${conf.bg} ${conf.text} ${conf.border}`}
                        >
                          {conf.label}
                        </span>
                      </td>

                      <td className="p-4 text-slate-500 text-[11px]">
                        {sub.submittedAt ? formatDateTime(sub.submittedAt) : 'In Progress'}
                      </td>

                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {sub.evaluationId ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigate(`/teacher/evaluations/${sub.evaluationId}`)}
                              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                            >
                              Review AI
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/teacher/submissions/${sub.id}`)}
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
