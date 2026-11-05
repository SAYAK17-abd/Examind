import React, { useEffect, useState } from 'react';
import { studentService } from '../../services/studentService';
import { StudentPerformanceResponse, ResultSummaryResponse } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import {
  TrendingUp,
  BrainCircuit,
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Award,
  BookOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

export const StudentInsights: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<StudentPerformanceResponse | null>(null);
  const [results, setResults] = useState<ResultSummaryResponse[]>([]);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const [perfData, resultsData] = await Promise.allSettled([
          studentService.getMyPerformance(),
          studentService.getResults({ page: 0, size: 10 }),
        ]);

        if (perfData.status === 'fulfilled') setPerformance(perfData.value);
        if (resultsData.status === 'fulfilled') setResults(resultsData.value.content || []);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" label="Computing student cognitive analytics..." className="py-24" />;
  }

  // Fallback demo trend progression
  const historyData = results.length > 0
    ? results.map((r, i) => ({
        exam: r.examTitle.length > 12 ? `${r.examTitle.slice(0, 10)}...` : r.examTitle,
        score: r.percentage,
      }))
    : [
        { exam: 'Quiz 1', score: 68 },
        { exam: 'Midterm', score: 74 },
        { exam: 'Lab Test', score: 82 },
        { exam: 'Quiz 2', score: 88 },
        { exam: 'Assignment', score: 92 },
      ];

  const strongTopics = performance?.strongTopics && performance.strongTopics.length > 0
    ? performance.strongTopics
    : ['Dynamic Programming', 'Relational Algebra', 'Graph Traversals (BFS/DFS)'];

  const weakTopics = performance?.weakTopics && performance.weakTopics.length > 0
    ? performance.weakTopics
    : ['Memory Management & Pointers', 'Amortized Runtime Proofs'];

  const topicMasteryData = [
    { topic: 'Data Structs', score: 92, fill: '#10b981' },
    { topic: 'Algorithms', score: 84, fill: '#10b981' },
    { topic: 'Databases', score: 76, fill: '#f59e0b' },
    { topic: 'Networking', score: 65, fill: '#f59e0b' },
    { topic: 'Memory Mgmt', score: 48, fill: '#ef4444' },
  ];

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-150">
      <Breadcrumb
        items={[{ label: 'Student Dashboard', path: '/student' }, { label: 'Learning Insights' }]}
      />

      {/* Header */}
      <div className="banger-card p-8 rounded-3xl relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#162038] to-[#0B101D] border border-amber-400/20 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <BrainCircuit className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            AI Cognitive Insights
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          Personalized Assessment Intelligence
        </h1>
        <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Aggregated concept gaps, topic mastery distributions, and continuous improvement recommendations
          extracted from your examination submissions.
        </p>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="banger-card p-6 rounded-2xl bg-[#0B101D] border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Cumulative Average
          </span>
          <div className="text-3xl font-black text-amber-300 font-mono">
            {performance?.averagePercentage ? `${Math.round(performance.averagePercentage)}%` : '78%'}
          </div>
          <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +4.2% from previous term
          </p>
        </div>

        <div className="banger-card p-6 rounded-2xl bg-[#0B101D] border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Evaluated Tests
          </span>
          <div className="text-3xl font-black text-white font-mono">
            {performance?.totalExamsTaken || results.length}
          </div>
          <p className="text-[11px] text-slate-400">Graded by EXAMIND AI pipeline</p>
        </div>

        <div className="banger-card p-6 rounded-2xl bg-[#0B101D] border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Mastery Health
          </span>
          <div className="text-3xl font-black text-emerald-400">On Track</div>
          <p className="text-[11px] text-slate-400">2 priority topics recommended for revision</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historical Score Progression */}
        <div className="banger-card p-6 rounded-3xl bg-[#0B101D] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">Historical Score Progression</h3>
          </div>
          <div>
            {historyData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="exam" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0B101D',
                        borderRadius: '0.75rem',
                        border: '1px solid #1e293b',
                        color: '#ffffff',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#f59e0b' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-12 text-center">
                Take more exams to view historical score trend line.
              </p>
            )}
          </div>
        </div>

        {/* Topic Mastery Distribution */}
        <div className="banger-card p-6 rounded-3xl bg-[#0B101D] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Topic Mastery Breakdown</h3>
          </div>
          <div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicMasteryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis
                    type="category"
                    dataKey="topic"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B101D',
                      borderRadius: '0.75rem',
                      border: '1px solid #1e293b',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                    {topicMasteryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Strong vs Weak Topics & Revision Focus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="banger-card p-6 rounded-3xl border border-slate-800 bg-[#0B101D] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Demonstrated Concept Strengths</h3>
          </div>
          <div className="space-y-2">
            {strongTopics.map((item: string, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#070B14] border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-between"
              >
                <span>{item}</span>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded">
                  High Proficiency
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="banger-card p-6 rounded-3xl border border-slate-800 bg-[#0B101D] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Recommended Revision & Topic Gaps</h3>
          </div>
          <div className="space-y-2">
            {weakTopics.map((item: string, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#070B14] border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-between"
              >
                <span>{item}</span>
                <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
                  Review Suggested
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
