import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherService } from '../../services/teacherService';
import { CreateExamRequest, UpdateExamRequest } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../api/client';
import { ArrowLeft, Save, Sparkles, Layers } from 'lucide-react';

export const ExamForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [passingMarks, setPassingMarks] = useState<number>(40);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (!isEditing || !id) {
      // Set default start/end time for new exam (today and 7 days from now)
      const now = new Date();
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      setStartTime(now.toISOString().slice(0, 16));
      setEndTime(nextWeek.toISOString().slice(0, 16));
      return;
    }

    const loadExam = async () => {
      try {
        setLoading(true);
        const data = await teacherService.getExamById(Number(id));
        setTitle(data.title);
        setDescription(data.description || '');
        setSubject(data.subject);
        setDurationMinutes(data.durationMinutes);
        setTotalMarks(data.totalMarks);
        setPassingMarks(data.passingMarks);
        setStartTime(data.startTime ? data.startTime.slice(0, 16) : '');
        setEndTime(data.endTime ? data.endTime.slice(0, 16) : '');
      } catch (err) {
        toast.error(extractErrorMessage(err), 'Failed to load exam details');
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [id, isEditing, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !durationMinutes || !totalMarks || !passingMarks || !startTime || !endTime) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      const payload: CreateExamRequest = {
        title,
        description,
        subject,
        durationMinutes: Number(durationMinutes),
        totalMarks: Number(totalMarks),
        passingMarks: Number(passingMarks),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      };

      if (isEditing && id) {
        await teacherService.updateExam(Number(id), payload as UpdateExamRequest);
        toast.success('Exam details updated successfully.');
        navigate('/teacher/exams');
      } else {
        const created = await teacherService.createExam(payload);
        toast.success('Exam created! You can now add questions and grading rubrics.');
        navigate(`/teacher/exams/${created.id}/questions`);
      }
    } catch (err) {
      toast.error(extractErrorMessage(err), isEditing ? 'Failed to update exam' : 'Failed to create exam');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" label="Loading exam configuration..." className="py-24" />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-150">
      <Breadcrumb
        items={[
          { label: 'Teacher Dashboard', path: '/teacher' },
          { label: 'Exams', path: '/teacher/exams' },
          { label: isEditing ? 'Edit Exam' : 'New Exam' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isEditing ? 'Edit Examination' : 'Create New Examination'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure examination schedule, time limit, and scoring requirements.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/teacher/exams')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Exams
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Examination Title"
                placeholder="e.g. CS301 — Advanced Algorithms & Complexity Midterm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <Input
              label="Subject / Course Code"
              placeholder="e.g. Computer Science / CS301"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />

            <Input
              label="Duration (Minutes)"
              type="number"
              min={5}
              max={600}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              required
            />

            <div className="md:col-span-2">
              <Textarea
                label="Exam Description & Instructions"
                placeholder="Provide special instructions or permitted materials for students..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Input
              label="Total Marks"
              type="number"
              min={1}
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value))}
              required
            />

            <Input
              label="Passing Marks"
              type="number"
              min={1}
              value={passingMarks}
              onChange={(e) => setPassingMarks(Number(e.target.value))}
              required
            />

            <Input
              label="Scheduled Start Time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />

            <Input
              label="Scheduled End / Deadline Time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/teacher/exams')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={saving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {isEditing ? 'Save Changes' : 'Create & Proceed to Questions'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
