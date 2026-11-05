import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import { ExamDetailResponse } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../api/client';
import {
  Clock,
  Award,
  HelpCircle,
  ShieldAlert,
  CheckSquare,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

export const ExamInstructions: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [exam, setExam] = useState<ExamDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchExam = async () => {
      try {
        setLoading(true);
        const data = await studentService.getExamById(Number(id));
        setExam(data);
      } catch (err) {
        toast.error(extractErrorMessage(err), 'Failed to load exam instructions');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [id, toast]);

  const handleStartExam = async () => {
    if (!exam || !agreed) return;

    setStarting(true);
    try {
      const res = await studentService.startExam(exam.id);
      toast.success('Exam session initialized. Timer has started.');
      navigate(`/student/exams/${exam.id}/room/${res.submissionId}`);
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Could not start exam');
      setStarting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" label="Loading examination rules..." className="py-24" />;
  }

  if (!exam) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-bold text-slate-800">Exam not found</h3>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/student/exams')}>
          Back to exams
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      <Breadcrumb
        items={[
          { label: 'Student Dashboard', path: '/student' },
          { label: 'My Exams', path: '/student/exams' },
          { label: 'Exam Instructions' },
        ]}
      />

      {/* Header Info Banner */}
      <div className="banger-card bg-[#0B101D] rounded-3xl border border-slate-800 p-8 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-5">
          <span className="text-xs font-bold text-amber-300 bg-amber-400/10 border border-amber-400/25 px-3 py-1 rounded-lg">
            {exam.subject}
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-3">
            {exam.title}
          </h1>
          {exam.description && (
            <p className="text-xs md:text-sm text-slate-300 mt-2 leading-relaxed">
              {exam.description}
            </p>
          )}
        </div>

        {/* Quick Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-[#070B14] rounded-2xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Duration</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-white text-lg font-mono">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{exam.durationMinutes} min</span>
            </div>
          </div>

          <div className="p-4 bg-[#070B14] rounded-2xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Marks</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-amber-300 text-lg font-mono">
              <Award className="w-4 h-4 text-amber-400" />
              <span>{exam.totalMarks} pts</span>
            </div>
          </div>

          <div className="p-4 bg-[#070B14] rounded-2xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Passing Marks</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-emerald-400 text-lg font-mono">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>{exam.passingMarks} pts</span>
            </div>
          </div>

          <div className="p-4 bg-[#070B14] rounded-2xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Questions</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-white text-lg">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>{exam.questionCount || (exam.questions ? exam.questions.length : 'N/A')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rules & Guidelines */}
      <div className="banger-card bg-[#0B101D] border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">Rules & Academic Integrity Guidelines</h3>
        </div>
        <div className="space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed">
          <ul className="space-y-3 list-disc pl-5">
            <li>
              <strong className="text-white">Synchronized Server Timer:</strong> The examination timer begins the moment you click
              &quot;Start Examination&quot;. It is synchronized with the server clock. If time expires, all your answers
              will be automatically submitted.
            </li>
            <li>
              <strong className="text-white">Continuous Autosave:</strong> Your answers are saved automatically as you type. You can also
              manually click Save Answer or upload an answer sheet at any time.
            </li>
            <li>
              <strong className="text-white">OCR Document Uploads:</strong> For handwritten or lengthy answers, you may attach physical answer
              sheet photographs or PDF scans directly per question. The EXAMIND OCR pipeline extracts and transcribes them.
            </li>
            <li>
              <strong className="text-white">AI Evaluation & Semantic Verification:</strong> Every response is evaluated against teacher-defined
              rubrics and expected concepts. Similarity detection algorithms monitor cross-submission overlap.
            </li>
            <li>
              <strong className="text-white">Navigation:</strong> You can navigate between questions freely using the question palette before final submission.
            </li>
          </ul>

          <div className="mt-6 p-4 rounded-2xl bg-amber-400/10 border border-amber-400/25 text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-amber-300">Important Notice:</span> Once started, you cannot pause the countdown timer. Ensure
              you have a stable internet connection and sufficient battery before proceeding.
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-800/40 transition-colors">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-700 accent-amber-500 focus:ring-amber-400"
              />
              <span className="text-xs font-semibold text-slate-200">
                I understand and agree to the examination rules, proctoring guidelines, and university academic honor code.
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={() => navigate('/student/exams')}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={!agreed}
          isLoading={starting}
          onClick={handleStartExam}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Start Examination Now
        </Button>
      </div>
    </div>
  );
};
