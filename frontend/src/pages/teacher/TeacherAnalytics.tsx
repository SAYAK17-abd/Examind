import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherService } from '../../services/teacherService';
import {
  ExamResponse,
  ExamAnalyticsResponse,
  QuestionAnalysisResponse,
  SimilarityReportResponse,
} from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../api/client';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  XCircle,
  Copy,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  Layers,
  ArrowRight,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

export const TeacherAnalytics: React.FC = () => {
  const { examId } = useParams<{ examId?: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number>(examId ? Number(examId) : 0);
  const [activeTab, setActiveTab] = useState<'analytics' | 'similarity'>('analytics');
  const [loading, setLoading] = useState(true);

  // Analytics state
  const [analytics, setAnalytics] = useState<ExamAnalyticsResponse | null>(null);
  const [questionAnalysis, setQuestionAnalysis] = useState<QuestionAnalysisResponse[]>([]);

  // Similarity state
  const [similarityReport, setSimilarityReport] = useState<SimilarityReportResponse | null>(null);
  const [runningSimilarity, setRunningSimilarity] = useState(false);

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
        toast.error(extractErrorMessage(err), 'Failed to load exam list');
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

    const loadData = async () => {
      try {
        setLoading(true);
        const [aData, qData, simData] = await Promise.allSettled([
          teacherService.getExamAnalytics(selectedExamId),
          teacherService.getQuestionAnalysis(selectedExamId),
          teacherService.getSimilarityReports(selectedExamId),
        ]);

        if (aData.status === 'fulfilled') setAnalytics(aData.value);
        if (qData.status === 'fulfilled') setQuestionAnalysis(qData.value || []);
        if (simData.status === 'fulfilled') setSimilarityReport(simData.value);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedExamId, toast]);

  const handleRunSimilarityCheck = async () => {
    if (!selectedExamId) return;
    setRunningSimilarity(true);
    try {
      const res = await teacherService.runSimilarityCheck(selectedExamId);
      setSimilarityReport(res);
      toast.success('Cross-submission similarity analysis completed.');
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Similarity check failed');
    } finally {
      setRunningSimilarity(false);
    }
  };

  // Prepare chart data
  const scoreDistData = analytics?.scoreDistribution
    ? Object.entries(analytics.scoreDistribution).map(([range, count]) => ({
        range,
        students: count,
      }))
    : [
        { range: '0-20', students: 1 },
        { range: '21-40', students: 3 },
        { range: '41-60', students: 8 },
        { range: '61-80', students: 14 },
        { range: '81-100', students: 6 },
      ];

  const gradeDistData = analytics?.gradeDistribution
    ? Object.entries(analytics.gradeDistribution).map(([grade, count]) => ({
        grade,
        students: count,
      }))
    : [
        { grade: 'A', students: 11 },
        { grade: 'B', students: 15 },
        { grade: 'C', students: 8 },
        { grade: 'D', students: 3 },
        { grade: 'F', students: 1 },
      ];

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-150">
      <Breadcrumb
        items={[
          { label: 'Teacher Dashboard', path: '/teacher' },
          { label: 'Analytics & Similarity' },
        ]}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-[#0B101D] via-[#0F172A] to-[#070B14] border border-slate-800 shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-xs font-bold text-amber-300 border border-amber-400/25 mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            Class Performance Engine
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Class Analytics & Similarity
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Statistical score distributions, question difficulty metrics, and cross-submission similarity detection.
          </p>
        </div>

        {/* Exam Selector */}
        {exams.length > 0 && (
          <div className="flex items-center gap-2.5 bg-[#060913] p-2 rounded-2xl border border-slate-800 self-start sm:self-center">
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

      {/* Navigation Tabs */}
      {exams.length > 0 && (
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-[#0B101D] border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Class Performance & Questions</span>
          </button>

          <button
            onClick={() => setActiveTab('similarity')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'similarity'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-[#0B101D] border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>Similarity & Plagiarism Check</span>
            {similarityReport?.flaggedCount ? (
              <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                {similarityReport.flaggedCount}
              </span>
            ) : null}
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner size="lg" label="Computing class performance & analytics..." className="py-20" />
      ) : exams.length === 0 ? (
        <div className="banger-card p-10 rounded-3xl border border-slate-800 text-center bg-[#0B101D] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center mx-auto">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-black text-white">No Examinations To Analyze</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Create an examination and collect student submissions to generate statistical score distributions, difficulty indexes, and lexical similarity maps.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/teacher/exams/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Your First Exam
          </Button>
        </div>
      ) : activeTab === 'analytics' ? (
        <div className="space-y-6">
          {/* Key KPI Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="banger-card p-4 rounded-2xl bg-[#0B101D] border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Submissions
              </span>
              <div className="text-2xl font-black text-white">
                {analytics?.totalSubmissions ?? 0}
              </div>
            </div>

            <div className="banger-card p-4 rounded-2xl bg-[#0B101D] border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Average Score
              </span>
              <div className="text-2xl font-black text-amber-300 font-mono">
                {analytics?.averageScore ? `${Math.round(analytics.averageScore * 10) / 10}` : '—'}
              </div>
            </div>

            <div className="banger-card p-4 rounded-2xl bg-[#0B101D] border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Median Score
              </span>
              <div className="text-2xl font-black text-white font-mono">
                {analytics?.medianScore ?? '—'}
              </div>
            </div>

            <div className="banger-card p-4 rounded-2xl bg-[#0B101D] border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Highest Score
              </span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {analytics?.highestScore ?? '—'}
              </div>
            </div>

            <div className="banger-card p-4 rounded-2xl bg-[#0B101D] border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Lowest Score
              </span>
              <div className="text-2xl font-black text-rose-400 font-mono">
                {analytics?.lowestScore ?? '—'}
              </div>
            </div>

            <div className="banger-card p-4 rounded-2xl bg-[#0B101D] border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Pass Rate
              </span>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {analytics?.passPercentage ? `${Math.round(analytics.passPercentage)}%` : '—'}
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <div className="banger-card p-6 rounded-3xl bg-[#0B101D] border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Score Distribution Range</h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreDistData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0B101D',
                        borderRadius: '0.75rem',
                        border: '1px solid #1e293b',
                        color: '#ffffff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="students" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Grade Distribution */}
            <div className="banger-card p-6 rounded-3xl bg-[#0B101D] border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Grade Breakdown</h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeDistData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0B101D',
                        borderRadius: '0.75rem',
                        border: '1px solid #1e293b',
                        color: '#ffffff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="students" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Question-by-Question Difficulty & Concept Gaps */}
          <div className="banger-card rounded-3xl overflow-hidden border border-slate-800 bg-[#0B101D] shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center gap-2 bg-[#070B14]">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Question-Level Difficulty & Conceptual Gaps</h3>
            </div>
            <div className="p-0 overflow-x-auto">
              {questionAnalysis.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Question analysis will appear once submissions are evaluated.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#070B14] border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-4 pl-6">Question</th>
                      <th className="p-4">Average Score</th>
                      <th className="p-4">Success Rate</th>
                      <th className="p-4">Difficulty Rating</th>
                      <th className="p-4 pr-6">Common Missing Concepts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {questionAnalysis.map((qa, idx) => (
                      <tr key={qa.questionId || idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 pl-6 font-semibold text-white">
                          <div>
                            <span className="font-bold text-amber-300">Q{qa.questionNumber || idx + 1}</span>
                            <p className="text-[11px] text-slate-400 font-normal line-clamp-1 max-w-sm mt-0.5">
                              {qa.questionText}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-white">
                          {qa.averageScore} / {qa.maxMarks} pts
                        </td>
                        <td className="p-4 font-bold text-amber-400 font-mono">
                          {Math.round(qa.averagePercentage)}%
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              qa.averagePercentage >= 75
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                : qa.averagePercentage >= 50
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                            }`}
                          >
                            {qa.difficultyRating || (qa.averagePercentage < 50 ? 'Challenging' : 'Normal')}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-slate-300">
                          {qa.commonMissingConcepts && qa.commonMissingConcepts.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {qa.commonMissingConcepts.map((c, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px]"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Similarity & Plagiarism Tab */
        <div className="space-y-6">
          <div className="banger-card p-6 bg-[#0B101D] text-white rounded-3xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  AI Cross-Submission Verification
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Semantic & Lexical Code Similarity Detection
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Scans all pairwise student submissions across code and descriptive solutions to detect unauthorized
                  collaboration and high textual overlap.
                </p>
              </div>
              <Button
                variant="primary"
                isLoading={runningSimilarity}
                onClick={handleRunSimilarityCheck}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Execute Similarity Scan
              </Button>
            </div>
          </div>

          {similarityReport?.pairs && similarityReport.pairs.length > 0 ? (
            <div className="banger-card rounded-3xl overflow-hidden border border-slate-800 bg-[#0B101D] shadow-xl">
              <div className="bg-[#070B14] p-5 border-b border-slate-800 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">
                    Flagged Similar Submission Pairs ({similarityReport.pairs.length})
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Last checked: {similarityReport.generatedAt || 'Recent'}
                </span>
              </div>
              <div className="p-0 divide-y divide-slate-800/60">
                {similarityReport.pairs.map((pair, idx) => (
                  <div key={idx} className="p-5 space-y-3 hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-white">
                          {pair.student1Name} & {pair.student2Name}
                        </span>
                        <span className="text-[11px] text-slate-400 bg-slate-800 border border-slate-700/80 px-2 py-0.5 rounded">
                          Question #{pair.questionNumber}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-mono font-black px-2.5 py-1 rounded-full border ${
                          pair.similarityScore >= 0.8
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {Math.round(pair.similarityScore * 100)}% Similarity
                      </span>
                    </div>

                    {(pair.snippet1 || pair.snippet2) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                        <div className="p-3 bg-[#070B14] border border-slate-800 rounded-xl font-mono text-slate-200 whitespace-pre-wrap">
                          <span className="font-sans font-bold text-slate-400 block mb-1">
                            {pair.student1Name} Excerpt:
                          </span>
                          {pair.snippet1}
                        </div>
                        <div className="p-3 bg-[#070B14] border border-slate-800 rounded-xl font-mono text-slate-200 whitespace-pre-wrap">
                          <span className="font-sans font-bold text-slate-400 block mb-1">
                            {pair.student2Name} Excerpt:
                          </span>
                          {pair.snippet2}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="No anomalous similarity detected"
              description="Either no scan has been executed yet, or all student submissions demonstrate distinct original formulation."
              actionLabel="Run Check Now"
              onAction={handleRunSimilarityCheck}
            />
          )}
        </div>
      )}
    </div>
  );
};
