import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import { ResultDetailResponse, QuestionResultResponse } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../api/client';
import { getGradeBadgeClass } from '../../utils/grade';
import { getConfidenceBadgeColor } from '../../utils/format';
import { formatDate } from '../../utils/date';
import {
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  FileText,
  AlertTriangle,
  Lightbulb,
  Check,
  X,
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
        toast.error(extractErrorMessage(err), 'Failed to load result breakdown');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id, toast]);

  if (loading) {
    return <LoadingSpinner size="lg" label="Generating AI evaluation breakdown..." className="py-24" />;
  }

  if (!result) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-bold text-slate-800">Result not found</h3>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/student/results')}>
          Back to results
        </Button>
      </div>
    );
  }

  const confidenceBadge = getConfidenceBadgeColor(result.confidence);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-150">
      <Breadcrumb
        items={[
          { label: 'Student Dashboard', path: '/student' },
          { label: 'Results', path: '/student/results' },
          { label: result.examTitle },
        ]}
      />

      {/* Main Score Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">
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
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                  <XCircle className="w-3.5 h-3.5" /> Needs Improvement
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-3">
              {result.examTitle}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Evaluated on {formatDate(result.publishedAt)} • Student: {result.studentName || 'Student'}
            </p>
          </div>

          {/* Big Score Box */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Score
              </span>
              <div className="text-3xl font-black text-slate-900">
                {result.obtainedMarks}{' '}
                <span className="text-base font-normal text-slate-400">/ {result.totalMarks}</span>
              </div>
              <span className="text-xs font-semibold text-indigo-600">{result.percentage}% Marks</span>
            </div>
          </div>
        </div>

        {/* AI & Teacher Audit Signals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">AI Evaluation</span>
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-lg font-black text-slate-900 mt-1">
              {result.aiScore ?? result.obtainedMarks} pts
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Automated Rubric Grading</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                AI Confidence
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${confidenceBadge.bg} ${confidenceBadge.text} ${confidenceBadge.border}`}
              >
                {confidenceBadge.label}
              </span>
            </div>
            <div className="text-lg font-black text-slate-900 mt-1">
              {result.confidence ? `${Math.round(result.confidence * 100)}%` : 'High'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Semantic Model Reliability</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Teacher Review
              </span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg font-black text-slate-900 mt-1">
              {result.isOverridden ? 'Audited & Overridden' : 'Approved'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {result.isOverridden ? 'Teacher adjusted initial AI score' : 'Final verified score'}
            </p>
          </div>
        </div>

        {/* Overall Feedback if present */}
        {result.overallFeedback && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" /> Overall Assessment Summary
            </h4>
            <p className="leading-relaxed">{result.overallFeedback}</p>
          </div>
        )}
      </div>

      {/* Question by Question Detailed Performance */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>Question-Wise Assessment Breakdown</span>
        </h3>

        {result.questionResults && result.questionResults.length > 0 ? (
          result.questionResults.map((q: QuestionResultResponse, idx: number) => {
            const qConfidence = getConfidenceBadgeColor(q.confidence);

            return (
              <Card key={q.questionId || idx} className="overflow-hidden">
                <CardHeader className="bg-slate-50/70 p-5 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-indigo-600 bg-white border border-indigo-200 px-2.5 py-1 rounded-md">
                      Q{q.questionNumber || idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      Score: {q.obtainedMarks} / {q.maxMarks} marks
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {q.requiresReview && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Flagged for Review
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${qConfidence.bg} ${qConfidence.text} ${qConfidence.border}`}
                    >
                      {qConfidence.label}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-5 text-xs">
                  {/* Question prompt */}
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Question Prompt:</h4>
                    <p className="text-slate-700 leading-relaxed font-medium">{q.questionText}</p>
                  </div>

                  {/* Student Answer & Reference Answer Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                        Your Submitted Answer
                      </span>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {q.studentAnswer || (
                          <span className="text-slate-400 italic">No answer submitted</span>
                        )}
                      </p>
                      {q.attachmentUrl && (
                        <div className="pt-2">
                          <a
                            href={q.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" /> View Uploaded Answer Sheet
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-1">
                      <span className="font-bold text-indigo-900 text-[11px] uppercase tracking-wider block">
                        Reference / Model Solution
                      </span>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {q.referenceAnswer || (
                          <span className="text-slate-400 italic">Not exposed for this question</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Concept Signals: Detected vs Missing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {q.detectedConcepts && q.detectedConcepts.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Detected Concepts
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {q.detectedConcepts.map((c, cIdx) => (
                            <span
                              key={cIdx}
                              className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {q.missingConcepts && q.missingConcepts.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                          <X className="w-3.5 h-3.5" /> Missing / Incomplete Concepts
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {q.missingConcepts.map((c, cIdx) => (
                            <span
                              key={cIdx}
                              className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-medium"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      {q.strengths && q.strengths.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-800">Key Strengths:</span>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-600 text-[11px]">
                            {q.strengths.map((s, sIdx) => (
                              <li key={sIdx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {q.weaknesses && q.weaknesses.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-800">Areas for Growth:</span>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-600 text-[11px]">
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
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 space-y-0.5">
                      <span className="font-bold text-slate-900 block">AI Evaluation Note:</span>
                      <p className="leading-relaxed">{q.aiFeedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="text-xs text-slate-500">No question breakdown available for this result.</p>
        )}
      </div>

      <div className="pt-4 flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => navigate('/student/results')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
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
