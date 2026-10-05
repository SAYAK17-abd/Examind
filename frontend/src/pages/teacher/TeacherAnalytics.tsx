import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
        }
      } catch (err) {
        toast.error(extractErrorMessage(err), 'Failed to load exam list');
      }
    };

    fetchExams();
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;

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
        { range: '61-80', students: 15 },
        { range: '81-100', students: 11 },
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
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      <Breadcrumb
        items={[
          { label: 'Teacher Dashboard', path: '/teacher' },
          { label: 'Analytics & Similarity' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Class Analytics & Similarity
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical score distributions, question difficulty metrics, and cross-submission similarity detection.
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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Class Performance & Questions</span>
        </button>

        <button
          onClick={() => setActiveTab('similarity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'similarity'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Copy className="w-4 h-4" />
          <span>Similarity & Plagiarism Check</span>
          {similarityReport?.flaggedCount ? (
            <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded-full text-[10px]">
              {similarityReport.flaggedCount}
            </span>
          ) : null}
        </button>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" label="Computing class statistics..." className="py-20" />
      ) : activeTab === 'analytics' ? (
        <div className="space-y-6">
          {/* Key KPI Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Submissions
                </span>
                <div className="text-xl font-black text-slate-900">
                  {analytics?.totalSubmissions ?? 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Average Score
                </span>
                <div className="text-xl font-black text-indigo-600">
                  {analytics?.averageScore ? `${Math.round(analytics.averageScore * 10) / 10}` : '—'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Median Score
                </span>
                <div className="text-xl font-black text-slate-900">
                  {analytics?.medianScore ?? '—'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Highest Score
                </span>
                <div className="text-xl font-black text-emerald-600">
                  {analytics?.highestScore ?? '—'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Lowest Score
                </span>
                <div className="text-xl font-black text-rose-600">
                  {analytics?.lowestScore ?? '—'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pass Rate
                </span>
                <div className="text-xl font-black text-purple-600">
                  {analytics?.passPercentage ? `${Math.round(analytics.passPercentage)}%` : '—'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Score Distribution Range</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreDistData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '0.75rem',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="students" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Grade Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>Grade Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeDistData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '0.75rem',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="students" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question-by-Question Difficulty & Concept Gaps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>Question-Level Difficulty & Conceptual Gaps</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {questionAnalysis.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Question analysis will appear once submissions are evaluated.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-4 pl-6">Question</th>
                      <th className="p-4">Average Score</th>
                      <th className="p-4">Success Rate</th>
                      <th className="p-4">Difficulty Rating</th>
                      <th className="p-4 pr-6">Common Missing Concepts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {questionAnalysis.map((qa, idx) => (
                      <tr key={qa.questionId || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 pl-6 font-semibold text-slate-900">
                          <div>
                            <span>Q{qa.questionNumber || idx + 1}</span>
                            <p className="text-[11px] text-slate-500 font-normal line-clamp-1 max-w-sm mt-0.5">
                              {qa.questionText}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {qa.averageScore} / {qa.maxMarks} pts
                        </td>
                        <td className="p-4 font-semibold text-indigo-600">
                          {Math.round(qa.averagePercentage)}%
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              qa.averagePercentage >= 75
                                ? 'bg-emerald-50 text-emerald-700'
                                : qa.averagePercentage >= 50
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {qa.difficultyRating || (qa.averagePercentage < 50 ? 'Challenging' : 'Normal')}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-slate-600">
                          {qa.commonMissingConcepts && qa.commonMissingConcepts.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {qa.commonMissingConcepts.map((c, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px]"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Similarity & Plagiarism Tab */
        <div className="space-y-6">
          <Card className="p-6 bg-slate-900 text-white rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                  AI Cross-Submission Verification
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Semantic & Lexical Code Similarity Detection
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
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
          </Card>

          {similarityReport?.pairs && similarityReport.pairs.length > 0 ? (
            <Card className="overflow-hidden">
              <CardHeader className="bg-slate-50/70 p-5 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>Flagged Similar Submission Pairs ({similarityReport.pairs.length})</span>
                </CardTitle>
                <span className="text-[11px] text-slate-400">
                  Last checked: {similarityReport.generatedAt || 'Recent'}
                </span>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-slate-100">
                {similarityReport.pairs.map((pair, idx) => (
                  <div key={idx} className="p-5 space-y-3 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-900">
                          {pair.student1Name} & {pair.student2Name}
                        </span>
                        <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Question #{pair.questionNumber}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                          pair.similarityScore >= 0.8
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        {Math.round(pair.similarityScore * 100)}% Similarity
                      </span>
                    </div>

                    {(pair.snippet1 || pair.snippet2) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                        <div className="p-3 bg-slate-100/70 rounded-xl font-mono text-slate-800 whitespace-pre-wrap">
                          <span className="font-sans font-bold text-slate-500 block mb-1">
                            {pair.student1Name} Excerpt:
                          </span>
                          {pair.snippet1}
                        </div>
                        <div className="p-3 bg-slate-100/70 rounded-xl font-mono text-slate-800 whitespace-pre-wrap">
                          <span className="font-sans font-bold text-slate-500 block mb-1">
                            {pair.student2Name} Excerpt:
                          </span>
                          {pair.snippet2}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
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
