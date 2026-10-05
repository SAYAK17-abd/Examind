import { apiClient } from '../api/client';
import {
  ApiResponse,
  PagedResponse,
  PageableQuery,
  ExamResponse,
  ExamDetailResponse,
  CreateExamRequest,
  UpdateExamRequest,
  QuestionResponse,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  RubricResponse,
  SaveRubricRequest,
  SubmissionSummaryResponse,
  SubmissionDetailResponse,
  EvaluationResponse,
  TeacherOverrideRequest,
  EvaluationHistoryResponse,
  ResultSummaryResponse,
  ExamAnalyticsResponse,
  QuestionAnalysisResponse,
  StudentPerformanceResponse,
  SimilarityReportResponse,
} from '../types';

export const teacherService = {
  // Exams
  async getExams(params?: PageableQuery): Promise<PagedResponse<ExamResponse>> {
    const res = await apiClient.get<ApiResponse<PagedResponse<ExamResponse>>>('/api/teacher/exams', {
      params,
    });
    return res.data.data;
  },

  async getExamById(id: number): Promise<ExamDetailResponse> {
    const res = await apiClient.get<ApiResponse<ExamDetailResponse>>(`/api/teacher/exams/${id}`);
    return res.data.data;
  },

  async createExam(data: CreateExamRequest): Promise<ExamResponse> {
    const res = await apiClient.post<ApiResponse<ExamResponse>>('/api/teacher/exams', data);
    return res.data.data;
  },

  async updateExam(id: number, data: UpdateExamRequest): Promise<ExamResponse> {
    const res = await apiClient.put<ApiResponse<ExamResponse>>(`/api/teacher/exams/${id}`, data);
    return res.data.data;
  },

  async deleteExam(id: number): Promise<void> {
    await apiClient.delete(`/api/teacher/exams/${id}`);
  },

  async publishExam(id: number): Promise<ExamResponse> {
    const res = await apiClient.post<ApiResponse<ExamResponse>>(`/api/teacher/exams/${id}/publish`);
    return res.data.data;
  },

  async unpublishExam(id: number): Promise<ExamResponse> {
    const res = await apiClient.post<ApiResponse<ExamResponse>>(`/api/teacher/exams/${id}/unpublish`);
    return res.data.data;
  },

  // Questions
  async getQuestions(examId: number): Promise<QuestionResponse[]> {
    const res = await apiClient.get<ApiResponse<QuestionResponse[]>>(
      `/api/teacher/exams/${examId}/questions`
    );
    return res.data.data;
  },

  async getQuestionById(questionId: number): Promise<QuestionResponse> {
    const res = await apiClient.get<ApiResponse<QuestionResponse>>(
      `/api/teacher/questions/${questionId}`
    );
    return res.data.data;
  },

  async createQuestion(examId: number, data: CreateQuestionRequest): Promise<QuestionResponse> {
    const res = await apiClient.post<ApiResponse<QuestionResponse>>(
      `/api/teacher/exams/${examId}/questions`,
      data
    );
    return res.data.data;
  },

  async updateQuestion(questionId: number, data: UpdateQuestionRequest): Promise<QuestionResponse> {
    const res = await apiClient.put<ApiResponse<QuestionResponse>>(
      `/api/teacher/questions/${questionId}`,
      data
    );
    return res.data.data;
  },

  async deleteQuestion(questionId: number): Promise<void> {
    await apiClient.delete(`/api/teacher/questions/${questionId}`);
  },

  // Rubrics
  async getRubric(questionId: number): Promise<RubricResponse> {
    const res = await apiClient.get<ApiResponse<RubricResponse>>(
      `/api/teacher/questions/${questionId}/rubric`
    );
    return res.data.data;
  },

  async saveRubric(questionId: number, data: SaveRubricRequest): Promise<RubricResponse> {
    const res = await apiClient.post<ApiResponse<RubricResponse>>(
      `/api/teacher/questions/${questionId}/rubric`,
      data
    );
    return res.data.data;
  },

  // Submissions
  async getSubmissions(
    examId: number,
    params?: PageableQuery
  ): Promise<PagedResponse<SubmissionSummaryResponse>> {
    const res = await apiClient.get<ApiResponse<PagedResponse<SubmissionSummaryResponse>>>(
      `/api/teacher/exams/${examId}/submissions`,
      { params }
    );
    return res.data.data;
  },

  async getSubmissionById(submissionId: number): Promise<SubmissionDetailResponse> {
    const res = await apiClient.get<ApiResponse<SubmissionDetailResponse>>(
      `/api/teacher/submissions/${submissionId}`
    );
    return res.data.data;
  },

  // Evaluations
  async getEvaluationById(evaluationId: number): Promise<EvaluationResponse> {
    const res = await apiClient.get<ApiResponse<EvaluationResponse>>(
      `/api/teacher/evaluations/${evaluationId}`
    );
    return res.data.data;
  },

  async approveEvaluation(evaluationId: number): Promise<EvaluationResponse> {
    const res = await apiClient.post<ApiResponse<EvaluationResponse>>(
      `/api/teacher/evaluations/${evaluationId}/approve`
    );
    return res.data.data;
  },

  async overrideEvaluation(
    evaluationId: number,
    data: TeacherOverrideRequest
  ): Promise<EvaluationResponse> {
    const res = await apiClient.post<ApiResponse<EvaluationResponse>>(
      `/api/teacher/evaluations/${evaluationId}/override`,
      data
    );
    return res.data.data;
  },

  async getEvaluationHistory(evaluationId: number): Promise<EvaluationHistoryResponse> {
    const res = await apiClient.get<ApiResponse<EvaluationHistoryResponse>>(
      `/api/teacher/evaluations/${evaluationId}/history`
    );
    return res.data.data;
  },

  // Results
  async getExamResults(
    examId: number,
    params?: PageableQuery
  ): Promise<PagedResponse<ResultSummaryResponse>> {
    const res = await apiClient.get<ApiResponse<PagedResponse<ResultSummaryResponse>>>(
      `/api/teacher/exams/${examId}/results`,
      { params }
    );
    return res.data.data;
  },

  async getStudentResults(
    studentId: number,
    params?: PageableQuery
  ): Promise<PagedResponse<ResultSummaryResponse>> {
    const res = await apiClient.get<ApiResponse<PagedResponse<ResultSummaryResponse>>>(
      `/api/teacher/students/${studentId}/results`,
      { params }
    );
    return res.data.data;
  },

  // Analytics
  async getExamAnalytics(examId: number): Promise<ExamAnalyticsResponse> {
    const res = await apiClient.get<ApiResponse<ExamAnalyticsResponse>>(
      `/api/teacher/exams/${examId}/analytics`
    );
    return res.data.data;
  },

  async getQuestionAnalysis(examId: number): Promise<QuestionAnalysisResponse[]> {
    const res = await apiClient.get<ApiResponse<QuestionAnalysisResponse[]>>(
      `/api/teacher/exams/${examId}/question-analysis`
    );
    return res.data.data;
  },

  async getStudentPerformance(studentId: number): Promise<StudentPerformanceResponse> {
    const res = await apiClient.get<ApiResponse<StudentPerformanceResponse>>(
      `/api/teacher/students/${studentId}/performance`
    );
    return res.data.data;
  },

  // Similarity
  async runSimilarityCheck(examId: number): Promise<SimilarityReportResponse> {
    const res = await apiClient.post<ApiResponse<SimilarityReportResponse>>(
      `/api/teacher/exams/${examId}/similarity-check`
    );
    return res.data.data;
  },

  async getSimilarityReports(examId: number): Promise<SimilarityReportResponse> {
    const res = await apiClient.get<ApiResponse<SimilarityReportResponse>>(
      `/api/teacher/exams/${examId}/similarity-reports`
    );
    return res.data.data;
  },
};
