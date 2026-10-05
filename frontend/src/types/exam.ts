import { QuestionResponse } from './question';

export type ExamStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ExamResponse {
  id: number;
  title: string;
  description?: string;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  startTime: string;
  endTime: string;
  status: ExamStatus;
  questionCount?: number;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamDetailResponse extends ExamResponse {
  questions?: QuestionResponse[];
}

export interface CreateExamRequest {
  title: string;
  description?: string;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  startTime: string;
  endTime: string;
}

export interface UpdateExamRequest {
  title?: string;
  description?: string;
  subject?: string;
  durationMinutes?: number;
  totalMarks?: number;
  passingMarks?: number;
  startTime?: string;
  endTime?: string;
}

export interface StartExamResponse {
  submissionId: number;
  examId: number;
  examTitle: string;
  startedAt: string;
  dueAt: string;
  durationMinutes: number;
  remainingSeconds: number;
  questions: QuestionResponse[];
}
