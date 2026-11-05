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
  Camera,
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
      <div className="banger-card p-8 rounded-3xl relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#162038] to-[#0B101D] border border-amber-400/20">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-xs font-bold text-amber-300 border border-amber-400/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Instructor Portal
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Welcome, Professor {user?.lastName || user?.firstName || 'Instructor'}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1.5 max-w-xl leading-relaxed">
              Manage course examinations, configure rubric criteria, monitor AI evaluations, and audit student scores.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate('/teacher/scan')}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-400/30 transition shadow-sm flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4 text-amber-400" />
              Scan Sheets (OCR)
            </button>
            <button
              onClick={() => navigate('/teacher/exams/new')}
              className="px-5 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Create New Exam
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="banger-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Exams</p>
            <h3 className="text-3xl font-black text-white mt-1">{totalExams}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Under your management</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="banger-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Published</p>
            <h3 className="text-3xl font-black text-emerald-400 mt-1">{publishedExams}</h3>
            <p className="text-[11px] text-emerald-400/80 font-semibold mt-0.5">Live to students</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="banger-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Review</p>
            <h3 className="text-3xl font-black text-amber-400 mt-1">{pendingReviews.length}</h3>
            <p className="text-[11px] text-amber-400/80 font-medium mt-0.5">Low confidence / flagged</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="banger-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Grading Engine</p>
            <h3 className="text-3xl font-black text-amber-300 mt-1">100%</h3>
            <p className="text-[11px] text-amber-300/80 font-medium mt-0.5">OCR + Semantic Active</p>
          </div>
          <div className="p-3 bg-amber-400/10 text-amber-300 border border-amber-400/20 rounded-2xl">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Exams List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="banger-card rounded-3xl overflow-hidden p-6">
            <div className="flex flex-row items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white">Course Examinations</h2>
                <p className="text-xs text-slate-400 mt-0.5">Quickly edit rubrics, publish tests, or inspect submissions</p>
              </div>
              <button
                onClick={() => navigate('/teacher/exams')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                All Exams <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-0 divide-y divide-slate-800/80">
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
                  <div key={exam.id} className="p-5 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{exam.title}</span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            exam.status === 'PUBLISHED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {exam.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>{exam.subject}</span>
                        <span>{exam.durationMinutes} mins</span>
                        <span className="text-amber-300 font-semibold">{exam.totalMarks} Marks</span>
                        <span>{formatDate(exam.startTime)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/teacher/exams/${exam.id}/questions`)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition"
                      >
                        Questions
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/exams/${exam.id}/submissions`)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/30 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Submissions
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pending Review Queue (1 col) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="banger-card rounded-3xl p-6">
            <div className="pb-4 border-b border-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">AI Submissions Queue</h3>
                <p className="text-xs text-slate-400 mt-0.5">Submissions flagged for instructor audit</p>
              </div>
            </div>
            <div className="p-0 divide-y divide-slate-800/80 max-h-96 overflow-y-auto">
              {pendingReviews.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No flagged submissions requiring review at this time.
                </div>
              ) : (
                pendingReviews.map((sub) => (
                  <div key={sub.id} className="p-4 space-y-2 hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{sub.studentName || 'Student'}</p>
                        <p className="text-[11px] text-slate-400">{sub.examTitle}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/25">
                        Audit
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[11px] text-slate-400">
                        Score: <strong className="text-amber-300">{sub.obtainedMarks ?? 0}</strong> / {sub.totalMarks ?? 100}
                      </span>
                      <button
                        onClick={() => {
                          if (sub.evaluationId) {
                            navigate(`/teacher/evaluations/${sub.evaluationId}`);
                          } else {
                            navigate(`/teacher/submissions/${sub.id}`);
                          }
                        }}
                        className="text-amber-400 hover:text-amber-300 text-xs font-bold"
                      >
                        Review AI →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
