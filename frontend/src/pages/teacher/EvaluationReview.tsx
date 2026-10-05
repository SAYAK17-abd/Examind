import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherService } from '../../services/teacherService';
import {
  EvaluationResponse,
  EvaluationHistoryResponse,
  TeacherOverrideRequest,
  QuestionEvaluationResponse,
} from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../api/client';
import { getConfidenceBadgeColor } from '../../utils/format';
import { formatDate, formatDateTime } from '../../utils/date';
import {
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
  UserCheck,
  Sparkles,
  ArrowLeft,
  Edit3,
  Check,
  X,
  ShieldAlert,
} from 'lucide-react';

export const EvaluationReview: React.FC = () => {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [history, setHistory] = useState<EvaluationHistoryResponse | null>(null);

  // Approve action
  const [approving, setApproving] = useState(false);

  // Override modal
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideScore, setOverrideScore] = useState<number>(0);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideFeedback, setOverrideFeedback] = useState('');
  const [savingOverride, setSavingOverride] = useState(false);

  // History modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const fetchEvaluation = async () => {
    if (!evaluationId) return;
    try {
      setLoading(true);
      const [evalData, histData] = await Promise.all([
        teacherService.getEvaluationById(Number(evaluationId)),
        teacherService.getEvaluationHistory(Number(evaluationId)).catch(() => null),
      ]);
      setEvaluation(evalData);
      setOverrideScore(evalData.finalScore);
      setOverrideFeedback(evalData.teacherFeedback || '');
      setHistory(histData);
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Failed to load evaluation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluation();
  }, [evaluationId]);

  const handleApprove = async () => {
    if (!evaluationId) return;
    setApproving(true);
    try {
      await teacherService.approveEvaluation(Number(evaluationId));
      toast.success('AI evaluation approved and published to student.');
      await fetchEvaluation();
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Failed to approve evaluation');
    } finally {
      setApproving(false);
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluationId) return;
    if (!overrideReason.trim()) {
      toast.error('Override reason is required for audit trail transparency.');
      return;
    }

    setSavingOverride(true);
    try {
      const payload: TeacherOverrideRequest = {
        score: Number(overrideScore),
        reason: overrideReason,
        feedback: overrideFeedback || undefined,
      };

      await teacherService.overrideEvaluation(Number(evaluationId), payload);
      toast.success('Score overridden and audited in permanent revision log.');
      setIsOverrideModalOpen(false);
      setOverrideReason('');
      await fetchEvaluation();
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Failed to override score');
    } finally {
      setSavingOverride(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" label="Loading evaluation and audit records..." className="py-24" />;
  }

  if (!evaluation) {
    return (
      <div className="text-center py-20 space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Evaluation record not found</h3>
        <Button variant="outline" onClick={() => navigate('/teacher/submissions')}>
          Return to submissions
        </Button>
      </div>
    );
  }

  const confidenceBadge = getConfidenceBadgeColor(evaluation.confidence);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-150">
      <Breadcrumb
        items={[
          { label: 'Teacher Dashboard', path: '/teacher' },
          { label: 'Submissions', path: '/teacher/submissions' },
          { label: `Review Evaluation #${evaluation.id}` },
        ]}
      />

      {/* Hero Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">
                {evaluation.examTitle}
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${confidenceBadge.bg} ${confidenceBadge.text} ${confidenceBadge.border}`}
              >
                {confidenceBadge.label}
              </span>
              {evaluation.requiresReview && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Review Required
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-3">
              Evaluation for {evaluation.studentName || `Student #${evaluation.studentId}`}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Submission ID: #{evaluation.submissionId} • Evaluated on {formatDateTime(evaluation.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryModalOpen(true)}
              leftIcon={<History className="w-4 h-4 text-slate-500" />}
            >
              Audit History ({history?.revisions?.length || 1})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOverrideModalOpen(true)}
              leftIcon={<Edit3 className="w-4 h-4 text-amber-600" />}
            >
              Override Score
            </Button>
            <Button
              variant="success"
              size="sm"
              isLoading={approving}
              onClick={handleApprove}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Approve & Finalize
            </Button>
          </div>
        </div>

        {/* Score Comparison Display (Distinguishing AI Score vs Teacher Final Score) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
            <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block">
              AI Proposed Score
            </span>
            <div className="text-3xl font-black text-indigo-950">
              {evaluation.aiScore}{' '}
              <span className="text-sm font-medium text-indigo-600">/ {evaluation.totalMarks}</span>
            </div>
            <p className="text-[11px] text-indigo-700">Calculated by AI semantic model</p>
          </div>

          <div
            className={`p-5 rounded-2xl border space-y-1 ${
              evaluation.isOverridden
                ? 'bg-amber-50/70 border-amber-200'
                : 'bg-emerald-50/50 border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                Teacher Final Score
              </span>
              {evaluation.isOverridden ? (
                <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Overridden
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Confirmed
                </span>
              )}
            </div>
            <div className="text-3xl font-black text-slate-900">
              {evaluation.finalScore}{' '}
              <span className="text-sm font-medium text-slate-400">/ {evaluation.totalMarks}</span>
            </div>
            <p className="text-[11px] text-slate-600">
              {evaluation.isOverridden
                ? `Manually adjusted by ${evaluation.overriddenBy || 'Instructor'}`
                : 'Matches AI recommended score'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Evaluation Status
            </span>
            <div className="text-xl font-black text-slate-800 pt-1">
              {evaluation.status}
            </div>
            <p className="text-[11px] text-slate-500">
              Confidence: {Math.round(evaluation.confidence * 100)}%
            </p>
          </div>
        </div>

        {/* Override Audit Banner if overridden */}
        {evaluation.isOverridden && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Score Override Audit Notice</span>
            </div>
            <p>
              This score was overridden from original AI score of <strong>{evaluation.aiScore} pts</strong> to{' '}
              <strong>{evaluation.finalScore} pts</strong>.
            </p>
            {evaluation.overrideReason && (
              <p className="pt-1 text-[11px] font-medium text-amber-800">
                <strong>Audit Reason:</strong> &ldquo;{evaluation.overrideReason}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* AI Overall Feedback & Teacher Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {evaluation.aiFeedback && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI Feedback Summary
              </span>
              <p className="text-slate-600 leading-relaxed">{evaluation.aiFeedback}</p>
            </div>
          )}

          {evaluation.teacherFeedback && (
            <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-1">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> Instructor Feedback to Student
              </span>
              <p className="text-slate-700 leading-relaxed">{evaluation.teacherFeedback}</p>
            </div>
          )}
        </div>
      </div>

      {/* Question by Question Inspection */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>Detailed Question Evaluations</span>
        </h3>

        {evaluation.questionEvaluations && evaluation.questionEvaluations.length > 0 ? (
          evaluation.questionEvaluations.map((q: QuestionEvaluationResponse, idx: number) => {
            const qConf = getConfidenceBadgeColor(q.confidence);

            return (
              <Card key={q.id || idx} className="overflow-hidden">
                <CardHeader className="bg-slate-50/70 p-5 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-indigo-700 bg-white border border-indigo-200 px-2.5 py-1 rounded-md">
                      Q{q.questionNumber || idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      Score: {q.finalScore} / {q.maxMarks} marks
                    </span>
                    {q.aiScore !== q.finalScore && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        AI was: {q.aiScore}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {q.requiresReview && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> Flagged
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${qConf.bg} ${qConf.text} ${qConf.border}`}
                    >
                      {qConf.label}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-5 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Question Prompt:</h4>
                    <p className="text-slate-800 leading-relaxed font-medium">{q.questionText}</p>
                  </div>

                  {/* Student Answer vs Reference Answer */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                        Student Submission
                      </span>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {q.studentAnswer || (
                          <span className="text-slate-400 italic">No text submitted</span>
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
                            <FileText className="w-3.5 h-3.5" /> View OCR Answer Sheet
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-1">
                      <span className="font-bold text-indigo-900 text-[11px] uppercase tracking-wider block">
                        Instructor Model Solution
                      </span>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {q.referenceAnswer || (
                          <span className="text-slate-400 italic">None provided</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Rubric Criteria Breakdown */}
                  {q.criteriaScores && q.criteriaScores.length > 0 && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                      <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                        Rubric Criteria Scoring:
                      </span>
                      <div className="divide-y divide-slate-200/60">
                        {q.criteriaScores.map((crit, cIdx) => (
                          <div key={cIdx} className="py-2 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-semibold text-slate-900">{crit.criterion}</span>
                              {crit.feedback && (
                                <p className="text-[11px] text-slate-500 mt-0.5">{crit.feedback}</p>
                              )}
                            </div>
                            <span className="font-bold text-slate-900">
                              {crit.score} / {crit.maxMarks} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Concepts & Feedback */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {q.detectedConcepts && q.detectedConcepts.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                          <Check className="w-3.5 h-3.5" /> Detected Concepts
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {q.detectedConcepts.map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px]"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {q.missingConcepts && q.missingConcepts.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                          <X className="w-3.5 h-3.5" /> Missing Concepts
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {q.missingConcepts.map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[11px]"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="text-xs text-slate-400">No question evaluation details found.</p>
        )}
      </div>

      {/* Override Modal */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Override AI Evaluation Score"
        description="Instructors may adjust the final score. The override reason is permanently logged in the audit trail."
        maxWidth="md"
      >
        <form onSubmit={handleOverrideSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
            <span className="text-slate-600 font-medium">Initial AI Score:</span>
            <span className="font-black text-indigo-700">{evaluation.aiScore} / {evaluation.totalMarks}</span>
          </div>

          <Input
            label="New Final Score"
            type="number"
            min={0}
            max={evaluation.totalMarks}
            step="0.5"
            value={overrideScore}
            onChange={(e) => setOverrideScore(Number(e.target.value))}
            required
          />

          <Textarea
            label="Override Reason (Required Audit Justification)"
            placeholder="e.g. Student provided valid alternate algorithm approach not accounted for in initial reference key..."
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            rows={3}
            required
          />

          <Textarea
            label="Teacher Feedback to Student (Optional)"
            placeholder="Feedback explaining the adjustment to the student..."
            value={overrideFeedback}
            onChange={(e) => setOverrideFeedback(e.target.value)}
            rows={3}
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => setIsOverrideModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={savingOverride}>
              Save Override
            </Button>
          </div>
        </form>
      </Modal>

      {/* Audit History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Evaluation Audit Revision History"
        description="Full immutable timeline of score revisions and modifications."
        maxWidth="md"
      >
        <div className="space-y-3 text-xs max-h-80 overflow-y-auto">
          {history?.revisions && history.revisions.length > 0 ? (
            history.revisions.map((rev, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    Version #{rev.version} — Score: {rev.score} pts
                  </span>
                  <span className="text-[10px] text-slate-400">{formatDateTime(rev.timestamp)}</span>
                </div>
                <p className="text-[11px] text-slate-600">Action: {rev.action}</p>
                {rev.reason && (
                  <p className="text-[11px] text-slate-500 italic">Reason: &ldquo;{rev.reason}&rdquo;</p>
                )}
                <p className="text-[10px] text-slate-400">By: {rev.performedBy}</p>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-center py-6">No revisions logged yet.</p>
          )}
        </div>
      </Modal>
    </div>
  );
};
