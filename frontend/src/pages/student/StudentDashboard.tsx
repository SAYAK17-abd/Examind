import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/studentService';
import { ExamResponse, ResultSummaryResponse, SubmissionSummaryResponse } from '../../types';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../utils/date';
import { getGradeBadgeClass } from '../../utils/grade';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  ArrowRight,
  Sparkles,
  TrendingUp,
  FileText,
  AlertCircle,
  Layers,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [results, setResults] = useState<ResultSummaryResponse[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionSummaryResponse[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [examsRes, resultsRes, subsRes] = await Promise.allSettled([
          studentService.getExams({ page: 0, size: 5 }),
          studentService.getResults({ page: 0, size: 5 }),
          studentService.getSubmissions({ page: 0, size: 5 }),
        ]);

        if (examsRes.status === 'fulfilled') setExams(examsRes.value.content || []);
        if (resultsRes.status === 'fulfilled') setResults(resultsRes.value.content || []);
        if (subsRes.status === 'fulfilled') setSubmissions(subsRes.value.content || []);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" label="Loading student dashboard..." className="py-24" />;
  }

  // Derived statistics
  const activeExams = exams.filter((e) => e.status === 'PUBLISHED');
  const inProgressSubmissions = submissions.filter((s) => s.status === 'IN_PROGRESS');
  const avgPercentage =
    results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + (r.percentage || 0), 0) / results.length)
      : 0;

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-150">
      {/* Welcome Banner */}
      <div className="banger-card p-8 rounded-3xl relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#162038] to-[#0B101D] border border-amber-400/20 shadow-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-xs font-bold text-amber-300 border border-amber-400/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              AI Student Portal
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Welcome back, {user?.firstName || 'Student'}!
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1.5 max-w-xl leading-relaxed">
              You have {activeExams.length} active exam{activeExams.length === 1 ? '' : 's'} scheduled. Check your AI assessment feedback, rubrics, and topic mastery insights below.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={() => navigate('/student/insights')}
              leftIcon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
            >
              My Insights
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/student/exams')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Take Exam
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="banger-card p-5 rounded-2xl flex items-center justify-between border border-slate-800">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Exams</p>
            <h3 className="text-3xl font-black text-white mt-1">{activeExams.length}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Available to start</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="banger-card p-5 rounded-2xl flex items-center justify-between border border-slate-800">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</p>
            <h3 className="text-3xl font-black text-amber-400 mt-1">{inProgressSubmissions.length}</h3>
            <p className="text-[11px] text-amber-400/90 font-medium mt-0.5">
              {inProgressSubmissions.length > 0 ? 'Resume session' : 'None active'}
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="banger-card p-5 rounded-2xl flex items-center justify-between border border-slate-800">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evaluated Exams</p>
            <h3 className="text-3xl font-black text-emerald-400 mt-1">{results.length}</h3>
            <p className="text-[11px] text-emerald-400/80 font-medium mt-0.5">AI feedback ready</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="banger-card p-5 rounded-2xl flex items-center justify-between border border-slate-800">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg. Performance</p>
            <h3 className="text-3xl font-black text-amber-300 mt-1">
              {avgPercentage > 0 ? `${avgPercentage}%` : 'N/A'}
            </h3>
            <p className="text-[11px] text-amber-400/80 font-medium mt-0.5">Across completed tests</p>
          </div>
          <div className="p-3 bg-amber-400/10 text-amber-300 border border-amber-400/20 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Exams */}
        <div className="banger-card rounded-3xl overflow-hidden border border-slate-800 bg-[#0B101D] p-6 space-y-4">
          <div className="flex flex-row items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Available Examinations</h3>
              <p className="text-xs text-slate-400 mt-0.5">Upcoming and active tests assigned to you</p>
            </div>
            <Link to="/student/exams" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-800/70 p-0">
            {activeExams.length === 0 ? (
              <div className="p-8 text-center">
                <EmptyState
                  title="No active exams"
                  description="There are currently no exams scheduled for your class."
                />
              </div>
            ) : (
              activeExams.map((exam) => (
                <div key={exam.id} className="py-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{exam.title}</span>
                      <span className="text-[11px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/25">
                        {exam.subject}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {exam.durationMinutes} mins
                      </span>
                      <span className="text-amber-300 font-mono font-semibold">{exam.totalMarks} Marks</span>
                      <span>Starts {formatDate(exam.startTime)}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/student/exams/${exam.id}/instructions`)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Details
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent AI Results */}
        <div className="banger-card rounded-3xl overflow-hidden border border-slate-800 bg-[#0B101D] p-6 space-y-4">
          <div className="flex flex-row items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Recent Evaluated Results</h3>
              <p className="text-xs text-slate-400 mt-0.5">Scores, grades, and comprehensive AI analysis</p>
            </div>
            <Link to="/student/results" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-800/70 p-0">
            {results.length === 0 ? (
              <div className="p-8 text-center">
                <EmptyState
                  title="No results yet"
                  description="Complete an examination to receive instant AI scoring and concept feedback."
                />
              </div>
            ) : (
              results.map((res) => (
                <div key={res.id} className="py-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{res.examTitle}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getGradeBadgeClass(
                          res.grade
                        )}`}
                      >
                        Grade {res.grade}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="font-bold text-white font-mono">
                        <strong className="text-amber-300">{res.obtainedMarks}</strong> / {res.totalMarks} ({res.percentage}%)
                      </span>
                      <span className={res.passed ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                        {res.passed ? 'Passed' : 'Needs Improvement'}
                      </span>
                      <span>{formatDate(res.publishedAt)}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/student/results/${res.id}`)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5 text-amber-400" />}
                  >
                    View Report
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
