import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import {
  SubmissionDetailResponse,
  QuestionResponse,
  SubmissionAnswerResponse,
} from '../../types';
import { ExamTimer } from '../../components/exam/ExamTimer';
import { QuestionPalette } from '../../components/exam/QuestionPalette';
import { AutosaveIndicator, SaveState } from '../../components/exam/AutosaveIndicator';
import { OcrUploader } from '../../components/exam/OcrUploader';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../api/client';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export const ExamInterface: React.FC = () => {
  const { examId, submissionId } = useParams<{ examId: string; submissionId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<SubmissionDetailResponse | null>(null);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Local state for answers map: { [questionId]: { answerText: string, attachmentUrl: string } }
  const [answersMap, setAnswersMap] = useState<
    Record<number, { answerText: string; attachmentUrl: string }>
  >({});
  const [flaggedIndices, setFlaggedIndices] = useState<Set<number>>(new Set());

  // Autosave tracking
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch submission details and questions
  useEffect(() => {
    if (!submissionId || !examId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [subData, examData] = await Promise.all([
          studentService.getSubmissionById(Number(submissionId)),
          studentService.getExamById(Number(examId)),
        ]);

        setSubmission(subData);
        const qList = examData.questions || [];
        setQuestions(qList);

        // Prepopulate existing answers
        const initialAnswers: Record<number, { answerText: string; attachmentUrl: string }> = {};
        if (subData.answers) {
          subData.answers.forEach((ans: SubmissionAnswerResponse) => {
            initialAnswers[ans.questionId] = {
              answerText: ans.answerText || '',
              attachmentUrl: ans.attachmentUrl || '',
            };
          });
        }
        setAnswersMap(initialAnswers);
      } catch (err) {
        toast.error(extractErrorMessage(err), 'Failed to load exam session');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [examId, submissionId, toast]);

  const currentQuestion = questions[currentIdx];

  // Perform backend save for a question
  const performSave = useCallback(
    async (qId: number, text: string, attachment: string) => {
      if (!submissionId) return;
      try {
        setSaveState('saving');
        await studentService.saveAnswer(Number(submissionId), {
          questionId: qId,
          answerText: text,
          attachmentUrl: attachment,
        });
        setSaveState('saved');
        const now = new Date();
        setLastSavedAt(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch {
        setSaveState('error');
      }
    },
    [submissionId]
  );

  // Handle answer change with 1.5s debounce
  const handleAnswerChange = (val: string) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    const currentAttachment = answersMap[qId]?.attachmentUrl || '';

    setAnswersMap((prev) => ({
      ...prev,
      [qId]: { answerText: val, attachmentUrl: currentAttachment },
    }));

    setSaveState('unsaved');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSave(qId, val, currentAttachment);
    }, 1500);
  };

  // Handle OCR attachment update
  const handleAttachmentUpload = (fileUrl: string) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    const currentText = answersMap[qId]?.answerText || '';

    setAnswersMap((prev) => ({
      ...prev,
      [qId]: { answerText: currentText, attachmentUrl: fileUrl },
    }));

    performSave(qId, currentText, fileUrl);
  };

  const handleRemoveAttachment = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    const currentText = answersMap[qId]?.answerText || '';

    setAnswersMap((prev) => ({
      ...prev,
      [qId]: { answerText: currentText, attachmentUrl: '' },
    }));

    performSave(qId, currentText, '');
  };

  // Toggle flag
  const toggleFlag = (idx: number) => {
    setFlaggedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Calculate answered indices
  const answeredIndices = new Set<number>();
  questions.forEach((q, idx) => {
    const ans = answersMap[q.id];
    if (ans && (ans.answerText.trim() !== '' || ans.attachmentUrl !== '')) {
      answeredIndices.add(idx);
    }
  });

  // Final submission logic
  const handleFinalSubmit = async () => {
    if (!submissionId) return;
    setIsSubmitting(true);
    try {
      // Flush any pending save
      if (currentQuestion) {
        const qId = currentQuestion.id;
        const currentAns = answersMap[qId];
        if (currentAns) {
          await performSave(qId, currentAns.answerText, currentAns.attachmentUrl);
        }
      }

      await studentService.submitExam(Number(submissionId));
      toast.success('Examination submitted successfully! AI evaluation initiated.');
      navigate('/student/results', { replace: true });
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Failed to submit exam');
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  // Handle timer expiry (Auto-submit)
  const handleTimerExpire = () => {
    toast.warning('Time has expired! Automatically submitting your answers...', 'Time Expired');
    handleFinalSubmit();
  };

  if (loading) {
    return <LoadingSpinner size="lg" label="Entering secure exam room..." className="py-24" />;
  }

  if (!submission || questions.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Exam session could not be established.</h3>
        <Button variant="primary" onClick={() => navigate('/student/exams')}>
          Return to exams
        </Button>
      </div>
    );
  }

  const currentAnswer = currentQuestion ? answersMap[currentQuestion.id] : null;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Top Floating Exam Control Bar */}
      <div className="sticky top-20 z-20 flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              {submission.examTitle}
            </h2>
            <div className="flex items-center gap-3 mt-0.5">
              <AutosaveIndicator state={saveState} lastSavedAt={lastSavedAt} />
              <span className="text-[11px] text-slate-400">
                Question {currentIdx + 1} of {questions.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {submission.dueAt && (
            <ExamTimer
              dueAt={submission.dueAt}
              onExpire={handleTimerExpire}
            />
          )}

          <Button
            variant="success"
            size="sm"
            onClick={() => setShowSubmitModal(true)}
            rightIcon={<Send className="w-3.5 h-3.5" />}
          >
            Finish & Submit
          </Button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Current Question & Workspace (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {currentQuestion && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                      Question {currentIdx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                      {currentQuestion.type}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {currentQuestion.marks} Marks
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleFlag(currentIdx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    flaggedIndices.has(currentIdx)
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{flaggedIndices.has(currentIdx) ? 'Flagged' : 'Flag for review'}</span>
                </button>
              </div>

              {/* Question Prompt */}
              <div className="text-sm md:text-base font-semibold text-slate-800 leading-relaxed">
                {currentQuestion.questionText}
              </div>

              {/* Input Zone depending on type */}
              <div className="pt-2 space-y-4">
                {currentQuestion.type === 'MCQ' && currentQuestion.options ? (
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      Select Answer:
                    </label>
                    <div className="grid grid-cols-1 gap-2.5">
                      {currentQuestion.options.map((opt, optIdx) => {
                        const isSelected = currentAnswer?.answerText === opt;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleAnswerChange(opt)}
                            className={`flex items-center gap-3 p-4 rounded-2xl border text-left text-xs md:text-sm font-medium transition-all ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20'
                                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                            }`}
                          >
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Your Written Answer:
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {currentAnswer?.answerText ? currentAnswer.answerText.length : 0} characters
                      </span>
                    </div>
                    <textarea
                      rows={8}
                      placeholder={
                        currentQuestion.type === 'CODING'
                          ? '// Write or paste your code solution here...'
                          : 'Provide your detailed explanation, arguments, and key concepts...'
                      }
                      value={currentAnswer?.answerText || ''}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      className={`w-full p-4 text-xs md:text-sm border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                        currentQuestion.type === 'CODING'
                          ? 'font-mono bg-slate-900 text-slate-100 border-slate-700 focus:border-indigo-400'
                          : 'bg-white text-slate-800 border-slate-300 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                )}

                {/* Answer Sheet OCR Uploader */}
                <div className="pt-4 border-t border-slate-100">
                  <OcrUploader
                    submissionId={Number(submissionId)}
                    currentAttachmentUrl={currentAnswer?.attachmentUrl}
                    onUploadSuccess={handleAttachmentUpload}
                    onRemoveAttachment={handleRemoveAttachment}
                  />
                </div>
              </div>

              {/* Bottom Nav Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="md"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      if (currentQuestion && currentAnswer) {
                        performSave(
                          currentQuestion.id,
                          currentAnswer.answerText,
                          currentAnswer.attachmentUrl
                        );
                        toast.success('Answer saved');
                      }
                    }}
                  >
                    Save Now
                  </Button>

                  {currentIdx < questions.length - 1 ? (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                    >
                      Next Question
                    </Button>
                  ) : (
                    <Button
                      variant="success"
                      size="md"
                      onClick={() => setShowSubmitModal(true)}
                      rightIcon={<Send className="w-4 h-4" />}
                    >
                      Review & Submit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Question Navigation Palette (1 col) */}
        <div className="lg:col-span-1 space-y-4">
          <QuestionPalette
            totalQuestions={questions.length}
            currentIndex={currentIdx}
            answeredIndices={answeredIndices}
            flaggedIndices={flaggedIndices}
            onSelectQuestion={(idx) => setCurrentIdx(idx)}
          />

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-950">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>Exam Tip</span>
            </div>
            <p className="leading-relaxed text-[11px] text-indigo-800">
              Your written responses are auto-saved. For handwritten equations or diagrams, snap a photo
              and upload using the OCR document section.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleFinalSubmit}
        title="Submit Examination?"
        message={`You have answered ${answeredIndices.size} of ${questions.length} questions.${
          answeredIndices.size < questions.length
            ? ' Warning: You have unanswered questions. Are you sure you want to finish?'
            : ' You will not be able to change your answers once submitted.'
        }`}
        confirmText="Yes, Submit Exam"
        cancelText="Continue Working"
        variant={answeredIndices.size < questions.length ? 'warning' : 'primary'}
        isLoading={isSubmitting}
      />
    </div>
  );
};
