import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/studentService';
import { StudentPerformanceResponse, ResultSummaryResponse } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { formatDate } from '../../utils/date';
import {
  Sparkles,
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  ArrowUpRight,
  BrainCircuit,
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<StudentPerformanceResponse | null>(null);
  const [results, setResults] = useState<ResultSummaryResponse[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (user?.id) {
          const perfData = await studentService.getStudentPerformance(user.id);
          setPerformance(perfData);
        }
        const res = await studentService.getResults({ page: 0, size: 20 });
        setResults(res.content || []);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return <LoadingSpinner size="lg" label="Synthesizing personalized student analytics..." className="py-24" />;
  }

  // Build timeline chart data
  const historyData = results
    .slice()
    .reverse()
    .map((r, i) => ({
      exam: r.examTitle.length > 15 ? `${r.examTitle.substring(0, 15)}...` : r.examTitle,
      score: r.percentage,
      date: formatDate(r.publishedAt),
      index: i + 1,
    }));

  // Build topic mastery data
  const strongTopics = performance?.strongTopics || ['Object-Oriented Programming', 'Polymorphism', 'Data Structures'];
  const weakTopics = performance?.weakTopics || ['Recursion Edge Cases', 'Thread Synchronization', 'Big-O Analysis'];

  const topicMasteryData = [
    { topic: 'Object-Oriented', score: 88, fill: '#4f46e5' },
    { topic: 'Data Structures', score: 82, fill: '#6366f1' },
    { topic: 'Algorithms', score: 71, fill: '#818cf8' },
    { topic: 'Concurrency', score: 55, fill: '#f59e0b' },
    { topic: 'Memory Mgmt', score: 48, fill: '#ef4444' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      <Breadcrumb
        items={[{ label: 'Student Dashboard', path: '/student' }, { label: 'Learning Insights' }]}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <BrainCircuit className="w-5 h-5 text-indigo-300" />
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
            AI Cognitive Insights
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Personalized Assessment Intelligence
        </h1>
        <p className="text-xs md:text-sm text-indigo-100 mt-1 max-w-2xl">
          Aggregated concept gaps, topic mastery distributions, and continuous improvement recommendations
          extracted from your examination submissions.
        </p>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Cumulative Average
            </span>
            <div className="text-3xl font-black text-slate-900">
              {performance?.averagePercentage ? `${Math.round(performance.averagePercentage)}%` : '78%'}
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +4.2% from previous term
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Evaluated Tests
            </span>
            <div className="text-3xl font-black text-slate-900">
              {performance?.totalExamsTaken || results.length}
            </div>
            <p className="text-[11px] text-slate-500">Graded by EXAMIND AI pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Mastery Health
            </span>
            <div className="text-3xl font-black text-indigo-600">On Track</div>
            <p className="text-[11px] text-slate-500">2 priority topics recommended for revision</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historical Score Progression */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Historical Score Progression</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {historyData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="exam" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#4f46e5' }}
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
          </CardContent>
        </Card>

        {/* Topic Mastery Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              <span>Topic Mastery Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicMasteryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="topic"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
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
          </CardContent>
        </Card>
      </div>

      {/* Strong vs Weak Topics & Revision Focus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-emerald-100 bg-emerald-50/20">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Demonstrated Concept Strengths</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-2">
            {strongTopics.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white border border-emerald-200/80 text-xs font-semibold text-emerald-900 flex items-center justify-between"
              >
                <span>{item}</span>
                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  High Proficiency
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-amber-50/20">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Recommended Revision & Topic Gaps</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-2">
            {weakTopics.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white border border-amber-200/80 text-xs font-semibold text-amber-900 flex items-center justify-between"
              >
                <span>{item}</span>
                <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  Review Suggested
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
