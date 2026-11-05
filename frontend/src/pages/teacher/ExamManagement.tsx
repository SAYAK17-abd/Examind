import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherService } from '../../services/teacherService';
import { ExamResponse } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../api/client';
import { formatDate } from '../../utils/date';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Send,
  Eye,
  BarChart3,
  ListOrdered,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export const ExamManagement: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [examToDelete, setExamToDelete] = useState<ExamResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Status toggle action loading
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await teacherService.getExams({ page: 0, size: 50 });
      setExams(res.content || []);
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleTogglePublish = async (exam: ExamResponse) => {
    setActionLoadingId(exam.id);
    try {
      if (exam.status === 'PUBLISHED') {
        await teacherService.unpublishExam(exam.id);
        toast.info(`Exam "${exam.title}" unpublished (set to Draft).`);
      } else {
        await teacherService.publishExam(exam.id);
        toast.success(`Exam "${exam.title}" is now published and active.`);
      }
      await fetchExams();
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Failed to update exam status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!examToDelete) return;
    setDeleting(true);
    try {
      await teacherService.deleteExam(examToDelete.id);
      toast.success(`Exam "${examToDelete.title}" deleted successfully.`);
      setExamToDelete(null);
      await fetchExams();
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Failed to delete exam');
    } finally {
      setDeleting(false);
    }
  };

  const filteredExams = exams.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.subject && e.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalExams = exams.length;
  const publishedCount = exams.filter((e) => e.status === 'PUBLISHED').length;
  const draftCount = exams.filter((e) => e.status !== 'PUBLISHED').length;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-150">
      <Breadcrumb
        items={[{ label: 'Teacher Dashboard', path: '/teacher' }, { label: 'Exam Management' }]}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-[#0B101D] via-[#0F172A] to-[#070B14] border border-slate-800 shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-xs font-bold text-amber-300 border border-amber-400/25 mb-2">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Exam Repository
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Exam Management</h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Create examinations, define questions and rubrics, publish tests, and inspect class submissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/teacher/scan')}
            className="border-amber-400/30 text-amber-300"
          >
            Scan Physical Sheets
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/teacher/exams/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create New Exam
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="banger-card p-5 rounded-2xl flex items-center justify-between border border-slate-800">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Examinations</p>
            <h3 className="text-2xl font-black text-white mt-1">{totalExams}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">In active database</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="banger-card p-5 rounded-2xl flex items-center justify-between border border-slate-800">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live & Published</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{publishedCount}</h3>
            <p className="text-[11px] text-emerald-400/80 font-medium mt-0.5">Accessible to candidates</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="banger-card p-5 rounded-2xl flex items-center justify-between border border-slate-800">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Draft / In Preparation</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">{draftCount}</h3>
            <p className="text-[11px] text-amber-400/80 font-medium mt-0.5">Authoring questions & rubrics</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl">
            <Edit2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <Input
          placeholder="Filter exams by title or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-slate-400" />}
        />
      </div>

      {loading ? (
        <LoadingSpinner size="lg" label="Loading examinations..." className="py-20" />
      ) : filteredExams.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No examinations found"
          description="Create your first exam to begin authoring questions and setting grading rubrics."
          actionLabel="Create Exam"
          onAction={() => navigate('/teacher/exams/new')}
        />
      ) : (
        <div className="banger-card rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-[#0B101D]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070B14] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4 pl-6">Exam Title</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Duration & Marks</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Schedule</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 pl-6 font-bold text-white">
                      <div>
                        <span className="text-sm font-bold text-white">{exam.title}</span>
                        {exam.description && (
                          <p className="text-[11px] text-slate-400 font-normal line-clamp-1 max-w-xs mt-0.5">
                            {exam.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-amber-300 bg-amber-400/10 border border-amber-400/25 px-2.5 py-0.5 rounded-lg">
                        {exam.subject}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 font-mono">
                      <div>
                        <span className="font-bold text-white">{exam.durationMinutes} mins</span>
                        <span className="text-amber-300 block text-[11px]">
                          {exam.totalMarks} Total ({exam.passingMarks} Pass)
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={exam.status === 'PUBLISHED' ? 'success' : 'neutral'}
                        size="sm"
                        dot
                      >
                        {exam.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-slate-400 text-[11px]">
                      <span>{formatDate(exam.startTime)}</span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Questions & Rubrics */}
                        <button
                          type="button"
                          onClick={() => navigate(`/teacher/exams/${exam.id}/questions`)}
                          className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                          title="Manage Questions & Rubrics"
                        >
                          <ListOrdered className="w-4 h-4" />
                        </button>

                        {/* View Submissions */}
                        <button
                          type="button"
                          onClick={() => navigate(`/teacher/exams/${exam.id}/submissions`)}
                          className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                          title="Monitor Submissions"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Analytics */}
                        <button
                          type="button"
                          onClick={() => navigate(`/teacher/exams/${exam.id}/analytics`)}
                          className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                          title="Exam Analytics & Similarity"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>

                        {/* Publish / Unpublish Toggle */}
                        <button
                          type="button"
                          disabled={actionLoadingId === exam.id}
                          onClick={() => handleTogglePublish(exam)}
                          className={`p-2 rounded-xl transition-colors ${
                            exam.status === 'PUBLISHED'
                              ? 'text-amber-400 hover:bg-amber-400/10'
                              : 'text-emerald-400 hover:bg-emerald-400/10'
                          }`}
                          title={exam.status === 'PUBLISHED' ? 'Unpublish Exam' : 'Publish Exam'}
                        >
                          {exam.status === 'PUBLISHED' ? (
                            <RotateCcw className="w-4 h-4" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>

                        {/* Edit Exam */}
                        <button
                          type="button"
                          onClick={() => navigate(`/teacher/exams/${exam.id}/edit`)}
                          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Edit Exam Metadata"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Exam */}
                        <button
                          type="button"
                          onClick={() => setExamToDelete(exam)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Exam"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!examToDelete}
        onClose={() => setExamToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Examination?"
        message={`Are you sure you want to delete "${examToDelete?.title}"? All questions, rubrics, and submission history associated with this exam will be removed.`}
        confirmText="Delete Exam"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
};
