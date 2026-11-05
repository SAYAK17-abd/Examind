import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherService } from '../../services/teacherService';
import {
  QuestionResponse,
  CreateQuestionRequest,
  QuestionType,
  QuestionDifficulty,
  RubricCriterion,
} from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../api/client';
import {
  Plus,
  Edit2,
  Trash2,
  ListPlus,
  HelpCircle,
  Award,
  Layers,
  Sparkles,
  ArrowLeft,
  X,
  CheckCircle2,
} from 'lucide-react';

export const QuestionManagement: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [examTitle, setExamTitle] = useState('');

  // Question Form Modal
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionResponse | null>(null);
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Form Fields
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<QuestionType>('SHORT_ANSWER');
  const [qMarks, setQMarks] = useState<number>(10);
  const [qDifficulty, setQDifficulty] = useState<QuestionDifficulty>('MEDIUM');
  const [qTopic, setQTopic] = useState('');
  const [qRefAnswer, setQRefAnswer] = useState('');
  const [qExpectedConcepts, setQExpectedConcepts] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['Option A', 'Option B', 'Option C', 'Option D']);

  // Rubric Builder Modal
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [rubricQuestion, setRubricQuestion] = useState<QuestionResponse | null>(null);
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([]);
  const [savingRubric, setSavingRubric] = useState(false);

  // AI Question Paper Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importingPaper, setImportingPaper] = useState(false);
  const [auditReport, setAuditReport] = useState<any | null>(null);
  const [confirmingImport, setConfirmingImport] = useState(false);

  // Delete Question
  const [questionToDelete, setQuestionToDelete] = useState<QuestionResponse | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState(false);

  const fetchQuestions = async () => {
    if (!examId) return;
    try {
      setLoading(true);
      const [examData, qData] = await Promise.all([
        teacherService.getExamById(Number(examId)),
        teacherService.getQuestions(Number(examId)),
      ]);
      setExamTitle(examData.title);
      setQuestions(qData || []);
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [examId]);

  const openCreateQuestion = () => {
    setEditingQuestion(null);
    setQText('');
    setQType('SHORT_ANSWER');
    setQMarks(10);
    setQDifficulty('MEDIUM');
    setQTopic('');
    setQRefAnswer('');
    setQExpectedConcepts('');
    setQOptions(['Option A', 'Option B', 'Option C', 'Option D']);
    setIsQuestionModalOpen(true);
  };

  const openEditQuestion = (q: QuestionResponse) => {
    setEditingQuestion(q);
    setQText(q.questionText);
    setQType(q.type);
    setQMarks(q.marks);
    setQDifficulty(q.difficulty);
    setQTopic(q.topic || '');
    setQRefAnswer(q.referenceAnswer || '');
    setQExpectedConcepts((q.expectedConcepts || []).join(', '));
    setQOptions(q.options && q.options.length > 0 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D']);
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examId || !qText) return;

    setSavingQuestion(true);
    try {
      const conceptsList = qExpectedConcepts
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: CreateQuestionRequest = {
        questionText: qText,
        type: qType,
        marks: Number(qMarks),
        difficulty: qDifficulty,
        topic: qTopic || undefined,
        referenceAnswer: qRefAnswer || undefined,
        expectedConcepts: conceptsList.length > 0 ? conceptsList : undefined,
        options: qType === 'MCQ' ? qOptions : undefined,
      };

      if (editingQuestion) {
        await teacherService.updateQuestion(editingQuestion.id, payload);
        toast.success('Question updated successfully.');
      } else {
        await teacherService.createQuestion(Number(examId), payload);
        toast.success('Question created successfully.');
      }

      setIsQuestionModalOpen(false);
      await fetchQuestions();
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Failed to save question');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!questionToDelete) return;
    setDeletingQuestion(true);
    try {
      await teacherService.deleteQuestion(questionToDelete.id);
      toast.success('Question deleted.');
      setQuestionToDelete(null);
      await fetchQuestions();
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Failed to delete question');
    } finally {
      setDeletingQuestion(false);
    }
  };

  // Open Rubric Builder
  const openRubricBuilder = async (q: QuestionResponse) => {
    setRubricQuestion(q);
    try {
      const res = await teacherService.getRubric(q.id);
      setRubricCriteria(res.criteria && res.criteria.length > 0 ? res.criteria : [
        { criterion: 'Core Concept Accuracy', description: 'Correct application of fundamental principles', maxMarks: Math.floor(q.marks * 0.5) },
        { criterion: 'Explanation Completeness', description: 'Thorough coverage of all required edge cases and steps', maxMarks: Math.ceil(q.marks * 0.5) },
      ]);
    } catch {
      // Default initial criteria
      setRubricCriteria([
        { criterion: 'Core Concept Accuracy', description: 'Correct application of fundamental principles', maxMarks: Math.floor(q.marks * 0.5) },
        { criterion: 'Explanation Completeness', description: 'Thorough coverage of all required edge cases and steps', maxMarks: Math.ceil(q.marks * 0.5) },
      ]);
    }
    setIsRubricModalOpen(true);
  };

  const handleAddCriterion = () => {
    setRubricCriteria((prev) => [
      ...prev,
      { criterion: '', description: '', maxMarks: 5 },
    ]);
  };

  const handleRemoveCriterion = (idx: number) => {
    setRubricCriteria((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCriterionChange = (idx: number, field: keyof RubricCriterion, val: string | number) => {
    setRubricCriteria((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const handleSaveRubric = async () => {
    if (!rubricQuestion) return;
    setSavingRubric(true);
    try {
      await teacherService.saveRubric(rubricQuestion.id, {
        criteria: rubricCriteria.map((c) => ({
          criterion: c.criterion,
          description: c.description,
          maxMarks: Number(c.maxMarks),
        })),
      });
      toast.success('Grading rubric saved! AI pipeline will score using these criteria.');
      setIsRubricModalOpen(false);
      await fetchQuestions();
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Failed to save rubric');
    } finally {
      setSavingRubric(false);
    }
  };

  const handlePaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !examId) return;

    setImportingPaper(true);
    try {
      const report = await teacherService.importQuestionsFromScan(Number(examId), file);
      setAuditReport(report);
      toast.success(`OCR parsed ${report.totalQuestions} questions with real-time audit.`);
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Failed to analyze question paper');
    } finally {
      setImportingPaper(false);
    }
  };

  const handleApplyAiFix = (qIdx: number, fixMarks: number) => {
    if (!auditReport) return;
    const nextQuestions = [...auditReport.questions];
    nextQuestions[qIdx].maxMarks = fixMarks;
    nextQuestions[qIdx].warnings = [];
    setAuditReport({
      ...auditReport,
      questions: nextQuestions,
    });
    toast.success(`Applied AI fix: set ${fixMarks} marks.`);
  };

  const handleConfirmBatchImport = async () => {
    if (!auditReport || !examId) return;
    setConfirmingImport(true);
    try {
      const payload: CreateQuestionRequest[] = auditReport.questions.map((q: any) => ({
        questionText: q.questionText,
        type: q.questionType,
        marks: q.maxMarks || 10,
        difficulty: 'MEDIUM',
        topic: q.topic,
        options: q.options,
      }));

      await teacherService.confirmQuestionImport(Number(examId), payload);
      toast.success(`Imported ${payload.length} questions into exam.`);
      setIsImportModalOpen(false);
      setAuditReport(null);
      await fetchQuestions();
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Failed to import questions');
    } finally {
      setConfirmingImport(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      <Breadcrumb
        items={[
          { label: 'Teacher Dashboard', path: '/teacher' },
          { label: 'Exams', path: '/teacher/exams' },
          { label: examTitle || 'Questions & Rubrics' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-[#0B101D] via-[#0F172A] to-[#070B14] border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Question & Rubric Builder</h1>
            <span className="text-xs font-bold text-amber-300 bg-amber-400/10 border border-amber-400/25 px-2.5 py-0.5 rounded-lg">
              {questions.length} Questions
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            Exam: <strong className="text-amber-300">{examTitle}</strong> • Configure question types, reference answers, and multi-criteria rubrics.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/teacher/exams')}
            leftIcon={<ArrowLeft className="w-4 h-4 text-slate-400" />}
          >
            Exams List
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="border-amber-400/40 text-amber-300 hover:text-white"
            leftIcon={<Sparkles className="w-4 h-4 text-amber-400" />}
          >
            Import Paper via OCR
          </Button>
          <Button
            variant="primary"
            onClick={openCreateQuestion}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Question
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" label="Loading questions and rubrics..." className="py-20" />
      ) : questions.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No questions defined yet"
          description="Add multiple-choice, short answer, descriptive, numerical, or coding questions to this exam."
          actionLabel="Add First Question"
          onAction={openCreateQuestion}
        />
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="banger-card rounded-3xl overflow-hidden border border-slate-800 bg-[#0B101D] shadow-xl">
              <div className="bg-[#070B14] p-5 border-b border-slate-800 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-amber-300 bg-amber-400/10 border border-amber-400/25 px-2.5 py-1 rounded-lg">
                    Q{q.questionNumber || idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700/80 px-2 py-0.5 rounded-md uppercase">
                    {q.type}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-md font-mono">
                    {q.marks} Marks
                  </span>
                  <span className="text-xs font-medium text-slate-300 bg-slate-800/80 border border-slate-700/80 px-2 py-0.5 rounded-md">
                    {q.difficulty}
                  </span>
                  {q.topic && (
                    <span className="text-xs text-amber-400/80 italic">Topic: {q.topic}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openRubricBuilder(q)}
                    leftIcon={<ListPlus className="w-3.5 h-3.5 text-amber-400" />}
                  >
                    Rubric ({q.criteria?.length || 0})
                  </Button>
                  <button
                    type="button"
                    onClick={() => openEditQuestion(q)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit Question"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionToDelete(q)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] mb-1.5">Question Prompt:</h4>
                  <p className="text-white font-medium text-sm leading-relaxed">{q.questionText}</p>
                </div>

                {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                  <div className="p-4 bg-[#070B14] rounded-2xl border border-slate-800/80 space-y-2">
                    <span className="font-bold text-slate-300 block">MCQ Options:</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="p-2.5 rounded-xl bg-[#0B101D] border border-slate-800 text-slate-200">
                          <strong className="text-amber-400 mr-1.5">{String.fromCharCode(65 + oIdx)}.</strong> {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {q.referenceAnswer && (
                  <div className="p-4 bg-amber-400/5 rounded-2xl border border-amber-400/20">
                    <span className="font-bold text-amber-300 block mb-1">Reference / Model Answer:</span>
                    <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{q.referenceAnswer}</p>
                  </div>
                )}

                {q.expectedConcepts && q.expectedConcepts.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="font-bold text-slate-400">Expected Concepts:</span>
                    {q.expectedConcepts.map((c, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-2.5 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 font-medium text-[11px]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Question Modal */}
      <Modal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        title={editingQuestion ? 'Edit Question' : 'Add New Question'}
        description="Specify question format, marks, reference solution, and expected concepts for AI evaluation."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
          <Textarea
            label="Question Prompt"
            placeholder="e.g. Explain the difference between method overriding and overloading in Java with code examples."
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            rows={3}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Question Type"
              value={qType}
              onChange={(e) => setQType(e.target.value as QuestionType)}
              options={[
                { value: 'SHORT_ANSWER', label: 'Short Answer' },
                { value: 'DESCRIPTIVE', label: 'Descriptive' },
                { value: 'CODING', label: 'Coding / Program' },
                { value: 'MCQ', label: 'Multiple Choice (MCQ)' },
                { value: 'NUMERICAL', label: 'Numerical' },
              ]}
            />

            <Input
              label="Max Marks"
              type="number"
              min={1}
              value={qMarks}
              onChange={(e) => setQMarks(Number(e.target.value))}
              required
            />

            <Select
              label="Difficulty Level"
              value={qDifficulty}
              onChange={(e) => setQDifficulty(e.target.value as QuestionDifficulty)}
              options={[
                { value: 'EASY', label: 'Easy' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HARD', label: 'Hard' },
              ]}
            />
          </div>

          <Input
            label="Topic / Unit"
            placeholder="e.g. Object-Oriented Programming, Memory Management"
            value={qTopic}
            onChange={(e) => setQTopic(e.target.value)}
          />

          {qType === 'MCQ' && (
            <div className="space-y-2 p-4 bg-[#070B14] rounded-2xl border border-slate-800">
              <span className="font-bold text-slate-300 block text-xs">MCQ Options:</span>
              {qOptions.map((opt, oIdx) => (
                <Input
                  key={oIdx}
                  label={`Option ${String.fromCharCode(65 + oIdx)}`}
                  value={opt}
                  onChange={(e) => {
                    const next = [...qOptions];
                    next[oIdx] = e.target.value;
                    setQOptions(next);
                  }}
                  required
                />
              ))}
            </div>
          )}

          <Textarea
            label="Reference / Model Solution"
            placeholder="Provide the ideal answer that the AI evaluation engine will compare student responses against..."
            value={qRefAnswer}
            onChange={(e) => setQRefAnswer(e.target.value)}
            rows={4}
          />

          <Input
            label="Expected Concepts (comma-separated)"
            placeholder="e.g. dynamic binding, runtime polymorphism, method signature, inheritance"
            value={qExpectedConcepts}
            onChange={(e) => setQExpectedConcepts(e.target.value)}
            helperText="The AI semantic pipeline specifically checks for presence of these concepts in student answers."
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => setIsQuestionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={savingQuestion}>
              {editingQuestion ? 'Update Question' : 'Save Question'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Rubric Builder Modal */}
      <Modal
        isOpen={isRubricModalOpen}
        onClose={() => setIsRubricModalOpen(false)}
        title="Grading Rubric Builder"
        description={`Define criteria and maximum marks for Question: "${rubricQuestion?.questionText.substring(0, 50)}..."`}
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Evaluation Criteria ({rubricCriteria.length})
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCriterion}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Criterion
            </Button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {rubricCriteria.map((crit, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-slate-800 bg-[#070B14] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <Input
                      label="Criterion Name"
                      placeholder="e.g. Conceptual Accuracy, Code Syntax, Edge Cases"
                      value={crit.criterion}
                      onChange={(e) => handleCriterionChange(idx, 'criterion', e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      label="Max Marks"
                      type="number"
                      min={1}
                      value={crit.maxMarks}
                      onChange={(e) => handleCriterionChange(idx, 'maxMarks', Number(e.target.value))}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCriterion(idx)}
                    className="p-2 mt-5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    aria-label="Remove criterion"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <Input
                  label="Description / Grading Instructions"
                  placeholder="Describe what full credit vs partial credit constitutes..."
                  value={crit.description}
                  onChange={(e) => handleCriterionChange(idx, 'description', e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-between">
            <span className="font-bold text-slate-200 text-xs">Total Rubric Marks:</span>
            <span className="font-mono font-black text-amber-300 text-sm">
              {rubricCriteria.reduce((sum, c) => sum + Number(c.maxMarks || 0), 0)} / {rubricQuestion?.marks || 0}
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => setIsRubricModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={savingRubric}
              onClick={handleSaveRubric}
            >
              Save Rubric
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI Question Paper Ingestion & Audit Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setAuditReport(null);
        }}
        title="AI Question Paper Ingestion & Error Audit"
        description="Upload handwritten test sheets or PDF copies. The AI automatically parses questions and detects missing marks or ambiguities."
        maxWidth="4xl"
      >
        <div className="space-y-5">
          {!auditReport ? (
            <div className="p-8 rounded-3xl border-2 border-dashed border-slate-800 hover:border-amber-400/60 bg-[#070B14] text-center transition cursor-pointer relative group">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handlePaperUpload}
                disabled={importingPaper}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/25 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-white">
                {importingPaper ? 'Running OCR & AI Structural Audit...' : 'Drop Question Paper File (PDF, Image)'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Scans questions, checks mark distributions, and flags ambiguities in real time
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-4 rounded-2xl bg-[#070B14] border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white text-sm">{auditReport.filename}</span>
                  <p className="text-slate-400 mt-0.5">
                    {auditReport.totalQuestions} questions detected • {auditReport.totalMarksScanned} marks total
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={confirmingImport}
                  onClick={handleConfirmBatchImport}
                >
                  Import All Approved Questions ({auditReport.questions.length})
                </Button>
              </div>

              {/* Questions List with Warnings */}
              <div className="space-y-3">
                {auditReport.questions.map((q: any, qIdx: number) => (
                  <div
                    key={qIdx}
                    className={`p-4 rounded-2xl border text-xs space-y-2 ${
                      q.warnings && q.warnings.length > 0
                        ? 'bg-amber-400/5 border-amber-400/30'
                        : 'bg-[#070B14] border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-300 bg-amber-400/10 border border-amber-400/25 px-2.5 py-0.5 rounded-lg">
                          Q{q.questionNumber}
                        </span>
                        <span className="font-semibold text-slate-300">{q.questionType}</span>
                        <span className="font-bold text-emerald-400 font-mono">{q.maxMarks || '0'} Marks</span>
                      </div>
                      {q.warnings && q.warnings.length > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 font-bold text-[11px]">
                          Attention Required
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium text-[11px]">✓ Verified</span>
                      )}
                    </div>

                    <p className="text-white font-medium leading-relaxed">{q.questionText}</p>

                    {/* Warnings and AI Fix recommendation */}
                    {q.warnings && q.warnings.length > 0 && (
                      <div className="p-3 rounded-lg bg-amber-100/70 border border-amber-200 space-y-1.5">
                        <span className="font-bold text-amber-900 block">AI Diagnostic Notice:</span>
                        {q.warnings.map((w: any, wIdx: number) => (
                          <div key={wIdx} className="text-amber-800 leading-relaxed">
                            • {w.message} {w.suggestion && <strong>Fix: {w.suggestion}</strong>}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleApplyAiFix(qIdx, 5)}
                          className="mt-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px]"
                        >
                          Apply AI Fix (Set 5 Marks)
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsImportModalOpen(false);
                setAuditReport(null);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!questionToDelete}
        onClose={() => setQuestionToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Question?"
        message={`Are you sure you want to delete this question? Any rubric and student answers associated with it will be removed.`}
        confirmText="Delete Question"
        variant="danger"
        isLoading={deletingQuestion}
      />
    </div>
  );
};
