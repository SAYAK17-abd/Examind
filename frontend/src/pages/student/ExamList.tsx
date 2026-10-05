import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import { ExamResponse } from '../../types';
import { Card, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { formatDate, formatDateTime } from '../../utils/date';
import { Search, Clock, Award, Calendar, ArrowRight, BookOpen } from 'lucide-react';

export const ExamList: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const res = await studentService.getExams({ page: 0, size: 50 });
        setExams(res.content || []);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const subjects = ['ALL', ...Array.from(new Set(exams.map((e) => e.subject).filter(Boolean)))];

  const filteredExams = exams.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.subject && e.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubject = subjectFilter === 'ALL' || e.subject === subjectFilter;

    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <Breadcrumb items={[{ label: 'Student Dashboard', path: '/student' }, { label: 'My Exams' }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Available Examinations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View scheduled tests, inspect exam requirements, and start your exam session.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search exams by title or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {subjects.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSubjectFilter(sub)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                subjectFilter === sub
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" label="Loading examinations..." className="py-20" />
      ) : filteredExams.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No exams found"
          description="There are currently no examinations matching your search criteria."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <Card key={exam.id} hover className="flex flex-col justify-between overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                    {exam.subject}
                  </span>
                  <Badge
                    variant={exam.status === 'PUBLISHED' ? 'success' : 'neutral'}
                    size="sm"
                    dot
                  >
                    {exam.status === 'PUBLISHED' ? 'Available' : exam.status}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 line-clamp-1">{exam.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {exam.description || 'No specific description provided for this examination.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-600 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{exam.durationMinutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-slate-400" />
                    <span>{exam.totalMarks} Total Marks</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2 text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Start: {formatDateTime(exam.startTime)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Pass: {exam.passingMarks} marks
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/student/exams/${exam.id}/instructions`)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  View Rules & Start
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
