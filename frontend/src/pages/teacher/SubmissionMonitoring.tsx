import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherService } from '../../services/teacherService';
import { SubmissionSummaryResponse, ExamResponse } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { formatDateTime } from '../../utils/date';
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
  Plus,
  Camera,
  Layers,
  CheckCircle2,
  Clock,
  Radio,
  FileText,
  ShieldCheck,
  ChevronRight,
  BookOpen,
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
        } else if (list.length === 0) {
          setLoading(false);
        }
      } catch (err) {
        toast.error(extractErrorMessage(err), 'Failed to fetch exam list');
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  useEffect(() => {
    if (!selectedExamId) {
      setLoading(false);
      return;
    }

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

  // Calculate statistics
  const totalSubmissions = submissions.length;
  const reviewCount = submissions.filter((s) => s.requiresReview).length;
  const gradedCount = submissions.filter((s) => s.status === 'EVALUATED').length;
  const scoredSubmissions = submissions.filter(
    (s) => s.obtainedMarks !== undefined && s.obtainedMarks !== null
  );
  const avgScore =
    scoredSubmissions.length > 0
      ? (
          scoredSubmissions.reduce((acc, s) => acc + (s.obtainedMarks || 0), 0) /
          scoredSubmissions.length
        ).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-150">
      <Breadcrumb
        items={[
          { label: 'Teacher Dashboard', path: '/teacher' },
          { label: 'Submissions & Review' },
        ]}
      />

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-[#0B101D] via-[#0F172A] to-[#070B14] border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-xs font-bold text-amber-300 border border-amber-400/25">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Live Evaluation Console
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Real-Time AI Stream Active
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight pt-1">
            Submission Monitoring & Review
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Monitor real-time student test submissions, inspect multi-criteria AI confidence ratings, and conduct rapid audit sign-offs.
          </p>
        </div>

        {/* Exam Selector */}
        {exams.length > 0 && (
          <div className="flex items-center gap-2.5 bg-[#060913] p-2 rounded-2xl border border-slate-800 self-start lg:self-center">
            <span className="text-xs font-bold text-slate-400 pl-2 whitespace-nowrap">Exam:</span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(Number(e.target.value))}
              className="text-xs font-bold rounded-xl border border-slate-700 bg-[#0B101D] px-3.5 py-2 text-white focus:outline-none focus:border-amber-400 transition"
            >
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id} className="bg-[#0B101D] text-white">
                  {exam.title} ({exam.subject})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="banger-card p-5 rounded-2xl flex items-center justify-between border border-slate-800/90">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monitored Exam</p>
            <h3 className="text-lg font-black text-white mt-1 truncate max-w-[180px]">
              {currentExam?.title || 'None Selected'}
            </h3>
            <p className="text-[11px] text-amber-400/90 font-medium mt-0.5">
              {currentExam ? `${currentExam.durationMinutes} mins • ${currentExam.totalMarks} Marks` : 'No active exam'}
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="banger-card p-5 rounded-2xl flex items-center justify-between border border-slate-800/90">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submissions Received</p>
            <h3 className="text-2xl font-black text-white mt-1">{totalSubmissions}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {gradedCount} evaluated by AI engine
            </p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="banger-card p-5 rounded-2xl flex items-center justify-between border border-slate-800/90">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Class Score</p>
            <h3 className="text-2xl font-black text-amber-300 mt-1">
              {avgScore} <span className="text-xs font-semibold text-slate-400">/ {currentExam?.totalMarks || 100}</span>
            </h3>
            <p className="text-[11px] text-emerald-400/90 font-medium mt-0.5">
              {scoredSubmissions.length > 0 ? 'Across completed evaluations' : 'Awaiting graded papers'}
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="banger-card p-5 rounded-2xl flex items-center justify-between border border-slate-800/90">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Audit Queue</p>
            <h3 className={`text-2xl font-black mt-1 ${reviewCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {reviewCount}
            </h3>
            <p className="text-[11px] text-amber-400/90 font-medium mt-0.5">
              {reviewCount > 0 ? 'Low confidence / flagged' : 'All evaluations confident'}
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      {exams.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0B101D] p-3 rounded-2xl border border-slate-800">
          <div className="w-full sm:max-w-md">
            <Input
              placeholder="Search student name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300 bg-[#070B14] hover:bg-slate-800/80 border border-slate-700/80 px-3.5 py-2.5 rounded-xl transition shadow-inner">
              <input
                type="checkbox"
                checked={onlyReviewRequired}
                onChange={(e) => setOnlyReviewRequired(e.target.checked)}
                className="rounded border-slate-700 accent-amber-500 focus:ring-amber-400"
              />
              <span className="flex items-center gap-1.5 text-slate-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Only Review Required ({reviewCount})
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner size="lg" label="Syncing live student submissions & AI evaluations..." className="py-20" />
      ) : exams.length === 0 ? (
        /* Rich Zero-Exams Launchpad */
        <div className="space-y-6">
          <div className="banger-card p-8 rounded-3xl border border-amber-400/20 bg-gradient-to-br from-[#0B101D] via-[#0D1426] to-[#070B14] relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 text-xs font-bold text-amber-300 border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Get Started with AI Assessment
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                No Course Examinations Configured Yet
              </h2>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                Create your first digital exam or scan physical handwritten answer sheets. Once students submit or batches are uploaded, real-time AI evaluations and teacher verification will appear right here.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div
                onClick={() => navigate('/teacher/exams/new')}
                className="p-5 rounded-2xl bg-[#060913] border border-slate-800 hover:border-amber-400/50 hover:bg-slate-900/60 transition cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Plus className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                  Create Digital Exam
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Author questions, set passing criteria, and configure automated semantic evaluation rubrics.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 mt-3">
                  Start Builder <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>

              <div
                onClick={() => navigate('/teacher/scan')}
                className="p-5 rounded-2xl bg-[#060913] border border-slate-800 hover:border-amber-400/50 hover:bg-slate-900/60 transition cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Camera className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                  Scan Physical Sheets (OCR)
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Bulk upload scanned physical exam papers for automatic roll-number detection and OCR segmentation.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 mt-3">
                  Open Scanner <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>

              <div
                onClick={() => navigate('/teacher/exams')}
                className="p-5 rounded-2xl bg-[#060913] border border-slate-800 hover:border-amber-400/50 hover:bg-slate-900/60 transition cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                  Exam Repository
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Inspect scheduled tests, publish draft exams, or review class performance analytics.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 mt-3">
                  View Catalog <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Workflow Diagram */}
          <div className="banger-card p-6 rounded-3xl border border-slate-800 bg-[#0B101D]">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              AI Evaluation Pipeline Overview
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800/80">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Step 01</span>
                <h5 className="text-xs font-bold text-white mt-1">Rubric Definition</h5>
                <p className="text-[11px] text-slate-400 mt-1">Teacher sets multi-criteria rubrics & model solutions.</p>
              </div>
              <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800/80">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Step 02</span>
                <h5 className="text-xs font-bold text-white mt-1">Student / OCR Ingestion</h5>
                <p className="text-[11px] text-slate-400 mt-1">Online test submissions or physical scanned sheets captured.</p>
              </div>
              <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800/80">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Step 03</span>
                <h5 className="text-xs font-bold text-white mt-1">Semantic AI Scoring</h5>
                <p className="text-[11px] text-slate-400 mt-1">Gemini AI grades against rubrics and assigns confidence rating.</p>
              </div>
              <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800/80">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Step 04</span>
                <h5 className="text-xs font-bold text-white mt-1">Teacher Audit Deck</h5>
                <p className="text-[11px] text-slate-400 mt-1">Scores below 80% confidence flagged for manual approval.</p>
              </div>
            </div>
          </div>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        /* Empty State for Selected Exam */
        <div className="banger-card p-10 rounded-3xl border border-slate-800 text-center bg-[#0B101D] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-black text-white">
              {onlyReviewRequired ? 'No Flagged Submissions' : 'Awaiting Student Submissions'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {onlyReviewRequired
                ? 'All submissions for this exam meet the AI high-confidence threshold and have been graded successfully.'
                : `No submissions have been recorded yet for "${currentExam?.title}". As soon as students complete their test or physical copies are scanned, they will stream here live.`}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {onlyReviewRequired && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOnlyReviewRequired(false)}
              >
                Show All Submissions
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/teacher/scan')}
              leftIcon={<Camera className="w-4 h-4 text-amber-400" />}
            >
              Scan Answer Sheets
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/teacher/exams/${selectedExamId}/questions`)}
              leftIcon={<BookOpen className="w-4 h-4" />}
            >
              View Exam Rubrics
            </Button>
          </div>
        </div>
      ) : (
        /* Rich High-Contrast Submissions Table */
        <div className="banger-card rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-[#0B101D]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070B14] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4 pl-6">Student Candidate</th>
                  <th className="p-4">Submission Status</th>
                  <th className="p-4">Calculated Score</th>
                  <th className="p-4">AI Confidence</th>
                  <th className="p-4">Submitted At</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSubmissions.map((sub) => {
                  const conf = getConfidenceBadgeColor(sub.confidence);

                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 pl-6 font-bold text-white">
                        <div>
                          <span className="text-sm font-bold text-white">
                            {sub.studentName || `Student #${sub.studentId}`}
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                            {sub.studentEmail || `ID: ${sub.studentId}`}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(
                              sub.status
                            )}`}
                          >
                            {sub.status}
                          </span>
                          {sub.requiresReview && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black text-amber-300 bg-amber-500/15 border border-amber-400/30">
                              <AlertTriangle className="w-3 h-3 text-amber-400" /> Review
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 font-mono font-bold text-white">
                        {sub.obtainedMarks !== undefined && sub.obtainedMarks !== null ? (
                          <span className="text-amber-300 text-sm">
                            {sub.obtainedMarks}{' '}
                            <span className="text-slate-400 text-xs font-normal">/ {sub.totalMarks || 100}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 italic font-sans text-xs">Pending AI Scoring</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${conf.bg} ${conf.text} ${conf.border}`}
                        >
                          {conf.label}
                        </span>
                      </td>

                      <td className="p-4 text-slate-300 text-[11px]">
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
                              leftIcon={<Eye className="w-3.5 h-3.5 text-slate-400" />}
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
        </div>
      )}
    </div>
  );
};
