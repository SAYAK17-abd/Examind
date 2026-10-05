import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/studentService';
import { ExamResponse, ResultSummaryResponse, SubmissionSummaryResponse } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate, formatDateTime } from '../../utils/date';
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
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-indigo-200 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            AI Student Portal
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.firstName || 'Student'}!
          </h1>
          <p className="text-xs md:text-sm text-indigo-100 mt-1 max-w-xl">
            You have {activeExams.length} active exam{activeExams.length === 1 ? '' : 's'} scheduled.
            Check your AI assessment feedback and topic mastery insights below.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            onClick={() => navigate('/student/insights')}
            leftIcon={<TrendingUp className="w-4 h-4 text-emerald-300" />}
          >
            My Insights
          </Button>
          <Button
            variant="primary"
            className="bg-white text-indigo-900 hover:bg-indigo-50 shadow-none font-bold"
            onClick={() => navigate('/student/exams')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Take Exam
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Exams</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{activeExams.length}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Available to start</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <BookOpen className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{inProgressSubmissions.length}</h3>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                {inProgressSubmissions.length > 0 ? 'Resume session' : 'None active'}
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evaluated Exams</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{results.length}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">AI feedback ready</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg. Performance</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {avgPercentage > 0 ? `${avgPercentage}%` : 'N/A'}
              </h3>
              <p className="text-[11px] text-indigo-600 font-medium mt-0.5">Across completed tests</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Award className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Exams */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Available Examinations</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Upcoming and active tests assigned to you</p>
            </div>
            <Link to="/student/exams" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
              View all
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {activeExams.length === 0 ? (
              <div className="p-8 text-center">
                <EmptyState
                  title="No active exams"
                  description="There are currently no exams scheduled for your class."
                />
              </div>
            ) : (
              activeExams.map((exam) => (
                <div key={exam.id} className="p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{exam.title}</span>
                      <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {exam.subject}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {exam.durationMinutes} mins
                      </span>
                      <span>{exam.totalMarks} Marks</span>
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
          </CardContent>
        </Card>

        {/* Recent AI Results */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Evaluated Results</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Scores, grades, and comprehensive AI analysis</p>
            </div>
            <Link to="/student/results" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
              View all
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {results.length === 0 ? (
              <div className="p-8 text-center">
                <EmptyState
                  title="No results yet"
                  description="Complete an examination to receive instant AI scoring and concept feedback."
                />
              </div>
            ) : (
              results.map((res) => (
                <div key={res.id} className="p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{res.examTitle}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getGradeBadgeClass(
                          res.grade
                        )}`}
                      >
                        Grade {res.grade}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {res.obtainedMarks} / {res.totalMarks} ({res.percentage}%)
                      </span>
                      <span>{res.passed ? 'Passed' : 'Needs Improvement'}</span>
                      <span>{formatDate(res.publishedAt)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/student/results/${res.id}`)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5 text-indigo-600" />}
                  >
                    View Report
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
