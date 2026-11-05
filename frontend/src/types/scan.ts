export interface ExtractedAnswerItem {
  questionNumber: number;
  text: string;
  confidence?: number;
}

export interface ScanResultResponse {
  id: number;
  examId: number;
  originalFilename: string;
  studentIdentifier?: string;
  confidence: number;
  requiresReview: boolean;
  status: 'PENDING_REVIEW' | 'VERIFIED' | 'GRADED' | 'REJECTED';
  extractedAnswersJson?: string;
  teacherNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface VerifyScanRequest {
  studentIdentifier?: string;
  extractedAnswersJson?: string;
  teacherNotes?: string;
  status?: string;
}

export interface QuestionPaperAuditWarning {
  code: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  suggestion?: string;
}

export interface AuditedQuestionItem {
  questionNumber: number;
  questionText: string;
  questionType: 'MCQ' | 'SHORT_ANSWER' | 'DESCRIPTIVE' | 'CODING' | 'NUMERICAL';
  maxMarks?: number;
  topic?: string;
  referenceAnswer?: string;
  options?: string[];
  expectedConcepts?: string[];
  warnings?: QuestionPaperAuditWarning[];
}

export interface QuestionPaperAuditReport {
  filename: string;
  totalQuestions: number;
  totalMarksScanned: number;
  cleanQuestionsCount: number;
  warningFlagsCount: number;
  questions: AuditedQuestionItem[];
}
