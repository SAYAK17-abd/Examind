export type EvaluationStatus = 'PENDING' | 'COMPLETED' | 'OVERRIDDEN';

export interface CriterionScore {
  criterion: string;
  maxMarks: number;
  score: number;
  feedback?: string;
}

export interface QuestionEvaluationResponse {
  id: number;
  questionId: number;
  questionNumber: number;
  questionText: string;
  referenceAnswer?: string;
  studentAnswer?: string;
  attachmentUrl?: string;
  maxMarks: number;
  aiScore: number;
  finalScore: number;
  confidence: number;
  requiresReview: boolean;
  aiFeedback?: string;
  teacherFeedback?: string;
  strengths?: string[];
  weaknesses?: string[];
  missingConcepts?: string[];
  detectedConcepts?: string[];
  criteriaScores?: CriterionScore[];
}

export interface EvaluationResponse {
  id: number;
  submissionId: number;
  examId: number;
  examTitle: string;
  studentId: number;
  studentName?: string;
  status: EvaluationStatus;
  aiScore: number;
  finalScore: number;
  totalMarks: number;
  confidence: number;
  requiresReview: boolean;
  aiFeedback?: string;
  teacherFeedback?: string;
  isOverridden: boolean;
  overriddenBy?: string;
  overrideReason?: string;
  questionEvaluations: QuestionEvaluationResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface TeacherOverrideRequest {
  score: number;
  reason: string;
  feedback?: string;
}

export interface EvaluationRevision {
  version: number;
  score: number;
  action: string;
  reason?: string;
  performedBy: string;
  timestamp: string;
}

export interface EvaluationHistoryResponse {
  evaluationId: number;
  revisions: EvaluationRevision[];
}
