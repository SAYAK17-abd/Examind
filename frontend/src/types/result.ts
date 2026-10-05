import { CriterionScore } from './evaluation';

export interface ResultSummaryResponse {
  id: number;
  examId: number;
  examTitle: string;
  studentId: number;
  studentName?: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  passed: boolean;
  publishedAt: string;
}

export interface QuestionResultResponse {
  questionId: number;
  questionNumber: number;
  questionText: string;
  maxMarks: number;
  obtainedMarks: number;
  aiScore?: number;
  studentAnswer?: string;
  referenceAnswer?: string;
  attachmentUrl?: string;
  aiFeedback?: string;
  strengths?: string[];
  weaknesses?: string[];
  missingConcepts?: string[];
  detectedConcepts?: string[];
  confidence?: number;
  requiresReview?: boolean;
  criteriaScores?: CriterionScore[];
}

export interface ResultDetailResponse {
  id: number;
  examId: number;
  examTitle: string;
  subject: string;
  studentId: number;
  studentName?: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  passed: boolean;
  evaluationId?: number;
  aiScore?: number;
  finalScore?: number;
  confidence?: number;
  isOverridden?: boolean;
  overallFeedback?: string;
  questionResults: QuestionResultResponse[];
  publishedAt: string;
}
