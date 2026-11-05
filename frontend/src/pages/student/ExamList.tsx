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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-[#0B101D] via-[#0F172A] to-[#070B14] border border-slate-800 shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-xs font-bold text-amber-300 border border-amber-400/25 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            Curriculum Assessments
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Available Examinations</h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
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
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {subjects.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSubjectFilter(sub)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                subjectFilter === sub
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'bg-[#0B101D] border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
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
            <div key={exam.id} className="banger-card rounded-3xl overflow-hidden border border-slate-800 bg-[#0B101D] flex flex-col justify-between shadow-xl">
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-bold text-amber-300 bg-amber-400/10 border border-amber-400/25 px-2.5 py-1 rounded-lg">
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
                  <h3 className="font-bold text-base text-white line-clamp-1">{exam.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {exam.description || 'No specific description provided for this examination.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 text-xs text-slate-300 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>{exam.durationMinutes} mins</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-300 font-semibold">{exam.totalMarks} Marks</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2 text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Start: {formatDateTime(exam.startTime)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#070B14] border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  Pass: <strong className="text-emerald-400">{exam.passingMarks}</strong> marks
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
