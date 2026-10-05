export type QuestionType = 'MCQ' | 'SHORT_ANSWER' | 'DESCRIPTIVE' | 'CODING' | 'NUMERICAL';

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface RubricCriterion {
  id?: number;
  criterion: string;
  description: string;
  maxMarks: number;
}

export interface RubricResponse {
  questionId: number;
  criteria: RubricCriterion[];
}

export interface SaveRubricRequest {
  criteria: Array<{
    criterion: string;
    description: string;
    maxMarks: number;
  }>;
}

export interface QuestionResponse {
  id: number;
  examId: number;
  questionNumber: number;
  questionText: string;
  type: QuestionType;
  marks: number;
  difficulty: QuestionDifficulty;
  topic?: string;
  referenceAnswer?: string;
  expectedConcepts?: string[];
  options?: string[];
  criteria?: RubricCriterion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateQuestionRequest {
  questionText: string;
  type: QuestionType;
  marks: number;
  difficulty: QuestionDifficulty;
  topic?: string;
  referenceAnswer?: string;
  expectedConcepts?: string[];
  options?: string[];
}

export interface UpdateQuestionRequest {
  questionText?: string;
  type?: QuestionType;
  marks?: number;
  difficulty?: QuestionDifficulty;
  topic?: string;
  referenceAnswer?: string;
  expectedConcepts?: string[];
  options?: string[];
}
