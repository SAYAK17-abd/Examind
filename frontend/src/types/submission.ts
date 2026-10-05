export type SubmissionStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATED' | 'EXPIRED';

export interface SubmissionAnswerResponse {
  id: number;
  submissionId: number;
  questionId: number;
  questionNumber?: number;
  questionText?: string;
  answerText?: string;
  attachmentUrl?: string;
  answeredAt?: string;
}

export interface SubmissionSummaryResponse {
  id: number;
  examId: number;
  examTitle: string;
  studentId: number;
  studentName?: string;
  studentEmail?: string;
  status: SubmissionStatus;
  startedAt: string;
  submittedAt?: string;
  dueAt: string;
  totalMarks?: number;
  obtainedMarks?: number;
  evaluationId?: number;
  requiresReview?: boolean;
  confidence?: number;
}

export interface SubmissionDetailResponse {
  id: number;
  examId: number;
  examTitle: string;
  studentId: number;
  studentName?: string;
  status: SubmissionStatus;
  startedAt: string;
  submittedAt?: string;
  dueAt: string;
  answers: SubmissionAnswerResponse[];
}

export interface SaveAnswerRequest {
  questionId: number;
  answerText?: string;
  attachmentUrl?: string;
}

export interface FileUploadResponse {
  fileUrl: string;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
}
