import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { teacherService } from '../../services/teacherService';
import { ExamResponse, SubmissionSummaryResponse } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../utils/date';
import { useToast } from '../../hooks/useToast';
import {
  Layers,
  FileCheck2,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Clock,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [pendingReviews, setPendingReviews] = useState<SubmissionSummaryResponse[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const examsRes = await teacherService.getExams({ page: 0, size: 10 });
        setExams(examsRes.content || []);

        // Fetch submissions for first exam if available to display pending review queue
        if (examsRes.content && examsRes.content.length > 0) {
          const firstExamId = examsRes.content[0].id;
          const subsRes = await teacherService.getSubmissions(firstExamId, { page: 0, size: 10 });
          setPendingReviews((subsRes.content || []).filter((s) => s.requiresReview || s.status === 'SUBMITTED'));
        }
      } catch {
        // Handle gracefully
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const totalExams = exams.length;
  const publishedExams = exams.filter((e) => e.status === 'PUBLISHED').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 rounded-3xl p-8 text-white shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-indigo-200 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Instructor Portal
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome, Professor {user?.lastName || user?.firstName || ''}
          </h1>
          <p className="text-xs md:text-sm text-indigo-200 mt-1 max-w-xl">
            Manage course examinations, configure rubric criteria, monitor AI evaluations, and audit student scores.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            onClick={() => navigate('/teacher/analytics')}
          >
            Analytics & Reports
          </Button>
          <Button
            variant="primary"
            className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-none font-bold"
            onClick={() => navigate('/teacher/exams/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create New Exam
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Exams</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{totalExams}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Under your management</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Published</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{publishedExams}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Live to students</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Review</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingReviews.length}</h3>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">Low confidence / flagged</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Grading Engine</p>
              <h3 className="text-2xl font-black text-indigo-600 mt-1">100%</h3>
              <p className="text-[11px] text-indigo-600 font-medium mt-0.5">OCR + Semantic Active</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Sparkles className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Exams List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Course Examinations</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Quickly edit rubrics, publish tests, or inspect submissions</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/teacher/exams')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                All Exams
              </Button>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-100">
              {loading ? (
                <LoadingSpinner size="md" className="py-12" />
              ) : exams.length === 0 ? (
                <EmptyState
                  title="No exams created"
                  description="Start by creating your first exam with questions and evaluation rubrics."
                  actionLabel="Create Exam"
                  onAction={() => navigate('/teacher/exams/new')}
                />
              ) : (
                exams.slice(0, 5).map((exam) => (
                  <div key={exam.id} className="p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{exam.title}</span>
                        <Badge
                          variant={exam.status === 'PUBLISHED' ? 'success' : 'neutral'}
                          size="sm"
                          dot
                        >
                          {exam.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{exam.subject}</span>
                        <span>{exam.durationMinutes} mins</span>
                        <span>{exam.totalMarks} Marks</span>
                        <span>{formatDate(exam.startTime)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/teacher/exams/${exam.id}/questions`)}
                      >
                        Questions
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/teacher/exams/${exam.id}/submissions`)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Submissions
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Review Queue (1 col) */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>AI Submissions Queue</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Submissions flagged for instructor audit</p>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {pendingReviews.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No flagged submissions requiring review at this time.
                </div>
              ) : (
                pendingReviews.map((sub) => (
                  <div key={sub.id} className="p-4 space-y-2 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{sub.studentName || 'Student'}</p>
                        <p className="text-[11px] text-slate-500">{sub.examTitle}</p>
                      </div>
                      <Badge variant="warning" size="sm">
                        Audit
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[11px] text-slate-500">
                        Score: {sub.obtainedMarks ?? 0} / {sub.totalMarks ?? 100}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (sub.evaluationId) {
                            navigate(`/teacher/evaluations/${sub.evaluationId}`);
                          } else {
                            navigate(`/teacher/submissions/${sub.id}`);
                          }
                        }}
                        className="text-indigo-600 hover:text-indigo-800 text-[11px]"
                      >
                        Review AI
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
