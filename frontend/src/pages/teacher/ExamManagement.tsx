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

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <Breadcrumb
        items={[{ label: 'Teacher Dashboard', path: '/teacher' }, { label: 'Exam Management' }]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Exam Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create examinations, define questions and rubrics, publish tests, and inspect class submissions.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/teacher/exams/new')}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create New Exam
        </Button>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <Input
          placeholder="Filter exams by title or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
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
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4 pl-6">Exam Title</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Duration & Marks</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Schedule</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-900">
                      <div>
                        <span>{exam.title}</span>
                        {exam.description && (
                          <p className="text-[11px] text-slate-400 font-normal line-clamp-1 max-w-xs mt-0.5">
                            {exam.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                        {exam.subject}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      <div>
                        <span className="font-semibold">{exam.durationMinutes} mins</span>
                        <span className="text-slate-400 block text-[11px]">
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
                    <td className="p-4 text-slate-500 text-[11px]">
                      <span>{formatDate(exam.startTime)}</span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Questions & Rubrics */}
                        <button
                          type="button"
                          onClick={() => navigate(`/teacher/exams/${exam.id}/questions`)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Manage Questions & Rubrics"
                        >
                          <ListOrdered className="w-4 h-4" />
                        </button>

                        {/* View Submissions */}
                        <button
                          type="button"
                          onClick={() => navigate(`/teacher/exams/${exam.id}/submissions`)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Monitor Submissions"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Analytics */}
                        <button
                          type="button"
                          onClick={() => navigate(`/teacher/exams/${exam.id}/analytics`)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Exam Analytics & Similarity"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>

                        {/* Publish / Unpublish Toggle */}
                        <button
                          type="button"
                          disabled={actionLoadingId === exam.id}
                          onClick={() => handleTogglePublish(exam)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            exam.status === 'PUBLISHED'
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
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
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="Edit Exam Metadata"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Exam */}
                        <button
                          type="button"
                          onClick={() => setExamToDelete(exam)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
        </Card>
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
