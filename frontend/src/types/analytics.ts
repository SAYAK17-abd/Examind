import { ResultSummaryResponse } from './result';

export interface ExamAnalyticsResponse {
  examId: number;
  examTitle?: string;
  totalSubmissions: number;
  evaluatedSubmissions: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  medianScore: number;
  passCount: number;
  failCount: number;
  passPercentage: number;
  scoreDistribution: Record<string, number>;
  gradeDistribution: Record<string, number>;
}

export interface QuestionAnalysisResponse {
  questionId: number;
  questionNumber: number;
  questionText: string;
  maxMarks: number;
  averageScore: number;
  averagePercentage: number;
  difficultyRating?: string;
  commonMissingConcepts: string[];
}

export interface StudentPerformanceResponse {
  studentId: number;
  studentName?: string;
  totalExamsTaken: number;
  averagePercentage: number;
  strongTopics: string[];
  weakTopics: string[];
  recentResults?: ResultSummaryResponse[];
  topicMastery?: Record<string, number>;
  recommendations?: string[];
}

export interface SimilarityPair {
  student1Id: number;
  student1Name: string;
  student2Id: number;
  student2Name: string;
  questionId: number;
  questionNumber: number;
  similarityScore: number;
  flagged: boolean;
  snippet1?: string;
  snippet2?: string;
}

export interface SimilarityReportResponse {
  examId: number;
  generatedAt: string;
  totalComparisons?: number;
  flaggedCount?: number;
  pairs: SimilarityPair[];
}
