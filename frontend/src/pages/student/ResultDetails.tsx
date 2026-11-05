import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import { ResultDetailResponse, QuestionResultResponse } from '../../types';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { formatDate, formatDateTime } from '../../utils/date';
import { getGradeBadgeClass } from '../../utils/grade';
import { getConfidenceBadgeColor } from '../../utils/format';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../api/client';
import {
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  TrendingUp,
  FileText,
  Check,
  X,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';

export const ResultDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ResultDetailResponse | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchResult = async () => {
      try {
        setLoading(true);
        const data = await studentService.getResultById(Number(id));
        setResult(data);
      } catch (err) {
        toast.error(extractErrorMessage(err), 'Failed to load result details');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id, toast]);

  if (loading) {
    return <LoadingSpinner size="lg" label="Loading result and feedback..." className="py-24" />;
  }

  if (!result) {
    return (
      <div className="text-center py-20 space-y-4">
        <h3 className="text-lg font-bold text-white">Result not found</h3>
        <Button variant="outline" onClick={() => navigate('/student/results')}>
          Back to results
        </Button>
      </div>
    );
  }

  const confidenceBadge = getConfidenceBadgeColor(result.confidence);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-150">
      <Breadcrumb
        items={[
          { label: 'Student Dashboard', path: '/student' },
          { label: 'My Results', path: '/student/results' },
          { label: result.examTitle },
        ]}
      />

      {/* Main Score Hero Card */}
      <div className="banger-card bg-[#0B101D] rounded-3xl border border-slate-800 p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-amber-300 bg-amber-400/10 border border-amber-400/25 px-3 py-1 rounded-lg">
                {result.subject}
              </span>
              <span
                className={`text-xs font-black uppercase px-2.5 py-1 rounded-md border ${getGradeBadgeClass(
                  result.grade
                )}`}
              >
                Grade {result.grade}
              </span>
              {result.passed ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/25">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/25">
                  <XCircle className="w-3.5 h-3.5" /> Needs Improvement
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-3">
              {result.examTitle}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Evaluated on {formatDate(result.publishedAt)} • Student: {result.studentName || 'Student'}
            </p>
          </div>

          {/* Big Score Box */}
          <div className="flex items-center gap-4 bg-[#070B14] p-4 px-6 rounded-2xl border border-slate-800 shadow-inner">
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Score
              </span>
              <div className="text-3xl font-black text-white font-mono">
                <strong className="text-amber-300">{result.obtainedMarks}</strong>{' '}
                <span className="text-base font-normal text-slate-400">/ {result.totalMarks}</span>
              </div>
              <span className="text-xs font-semibold text-emerald-400 font-mono">{result.percentage}% Marks</span>
            </div>
          </div>
        </div>

        {/* AI & Teacher Audit Signals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#070B14] border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Evaluation</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg font-black text-white mt-1 font-mono">
              {result.aiScore ?? result.obtainedMarks} pts
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Automated Rubric Grading</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#070B14] border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                AI Confidence
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${confidenceBadge.bg} ${confidenceBadge.text} ${confidenceBadge.border}`}
              >
                {confidenceBadge.label}
              </span>
            </div>
            <div className="text-lg font-black text-white mt-1 font-mono">
              {result.confidence ? `${Math.round(result.confidence * 100)}%` : 'High'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Semantic Model Reliability</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#070B14] border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Teacher Review
              </span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-black text-white mt-1">
              {result.isOverridden ? 'Audited & Overridden' : 'Approved'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {result.isOverridden ? 'Teacher adjusted initial AI score' : 'Final verified score'}
            </p>
          </div>
        </div>

        {/* Overall Feedback if present */}
        {result.overallFeedback && (
          <div className="p-4 rounded-2xl bg-[#070B14] border border-amber-400/20 text-xs text-slate-200 space-y-1">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" /> Overall Assessment Summary
            </h4>
            <p className="leading-relaxed text-slate-300">{result.overallFeedback}</p>
          </div>
        )}
      </div>

      {/* Question by Question Detailed Performance */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Question-Wise Assessment Breakdown</span>
        </h3>

        {result.questionResults && result.questionResults.length > 0 ? (
          result.questionResults.map((q: QuestionResultResponse, idx: number) => {
            const qConfidence = getConfidenceBadgeColor(q.confidence);

            return (
              <div key={q.questionId || idx} className="banger-card rounded-3xl overflow-hidden border border-slate-800 bg-[#0B101D] shadow-xl">
                <div className="bg-[#070B14] p-5 border-b border-slate-800 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-300 bg-amber-400/10 border border-amber-400/25 px-2.5 py-1 rounded-lg">
                      Q{q.questionNumber || idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">
                      Score: <strong className="text-amber-300">{q.obtainedMarks}</strong> / {q.maxMarks} marks
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {q.requiresReview && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3 text-amber-400" /> Flagged for Review
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${qConfidence.bg} ${qConfidence.text} ${qConfidence.border}`}
                    >
                      {qConfidence.label}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-5 text-xs">
                  {/* Question prompt */}
                  <div>
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] mb-1">Question Prompt:</h4>
                    <p className="text-white leading-relaxed font-medium">{q.questionText}</p>
                  </div>

                  {/* Student Answer & Reference Answer Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-[#070B14] border border-slate-800 space-y-1">
                      <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider block">
                        Your Submitted Answer
                      </span>
                      <p className="text-slate-200 whitespace-pre-wrap leading-relaxed font-mono text-[11px]">
                        {q.studentAnswer || (
                          <span className="text-slate-500 italic font-sans">No answer submitted</span>
                        )}
                      </p>
                      {q.attachmentUrl && (
                        <div className="pt-2">
                          <a
                            href={q.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-amber-400 font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" /> View Uploaded Answer Sheet
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-400/5 border border-amber-400/20 space-y-1">
                      <span className="font-bold text-amber-300 text-[11px] uppercase tracking-wider block">
                        Reference / Model Solution
                      </span>
                      <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {q.referenceAnswer || (
                          <span className="text-slate-500 italic">Not exposed for this question</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Concept Signals: Detected vs Missing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {q.detectedConcepts && q.detectedConcepts.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Detected Concepts
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {q.detectedConcepts.map((c, cIdx) => (
                            <span
                              key={cIdx}
                              className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[11px] font-medium"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {q.missingConcepts && q.missingConcepts.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                          <X className="w-3.5 h-3.5" /> Missing / Incomplete Concepts
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {q.missingConcepts.map((c, cIdx) => (
                            <span
                              key={cIdx}
                              className="px-2.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/25 text-[11px] font-medium"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Strengths & Weaknesses */}
                  {(q.strengths?.length || q.weaknesses?.length) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
                      {q.strengths && q.strengths.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-200">Key Strengths:</span>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-300 text-[11px]">
                            {q.strengths.map((s, sIdx) => (
                              <li key={sIdx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {q.weaknesses && q.weaknesses.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-amber-300">Areas for Growth:</span>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-300 text-[11px]">
                            {q.weaknesses.map((w, wIdx) => (
                              <li key={wIdx}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detailed AI Feedback text */}
                  {q.aiFeedback && (
                    <div className="p-4 rounded-2xl bg-[#070B14] border border-slate-800 text-[11px] text-slate-300 space-y-1">
                      <span className="font-bold text-amber-300 block">AI Evaluation Note:</span>
                      <p className="leading-relaxed">{q.aiFeedback}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-slate-400">No question breakdown available for this result.</p>
        )}
      </div>

      <div className="pt-4 flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => navigate('/student/results')}
          leftIcon={<ArrowLeft className="w-4 h-4 text-slate-400" />}
        >
          Back to all results
        </Button>
        <Button
          variant="primary"
          onClick={() => navigate('/student/insights')}
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          View Learning Insights
        </Button>
      </div>
    </div>
  );
};
