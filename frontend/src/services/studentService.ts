import { apiClient } from '../api/client';
import {
  ApiResponse,
  PagedResponse,
  PageableQuery,
  ExamResponse,
  ExamDetailResponse,
  StartExamResponse,
  SubmissionDetailResponse,
  SubmissionSummaryResponse,
  SaveAnswerRequest,
  FileUploadResponse,
  ResultSummaryResponse,
  ResultDetailResponse,
  StudentPerformanceResponse,
} from '../types';

export const studentService = {
  async getExams(params?: PageableQuery): Promise<PagedResponse<ExamResponse>> {
    const res = await apiClient.get<ApiResponse<PagedResponse<ExamResponse>>>('/api/student/exams', {
      params,
    });
    return res.data.data;
  },

  async getExamById(id: number): Promise<ExamDetailResponse> {
    const res = await apiClient.get<ApiResponse<ExamDetailResponse>>(`/api/student/exams/${id}`);
    return res.data.data;
  },

  async startExam(examId: number): Promise<StartExamResponse> {
    const res = await apiClient.post<ApiResponse<StartExamResponse>>(`/api/student/exams/${examId}/start`);
    return res.data.data;
  },

  async saveAnswer(submissionId: number, data: SaveAnswerRequest): Promise<void> {
    await apiClient.post(`/api/student/submissions/${submissionId}/answers`, data);
  },

  async submitExam(submissionId: number): Promise<SubmissionDetailResponse> {
    const res = await apiClient.post<ApiResponse<SubmissionDetailResponse>>(
      `/api/student/submissions/${submissionId}/submit`
    );
    return res.data.data;
  },

  async getSubmissions(params?: PageableQuery): Promise<PagedResponse<SubmissionSummaryResponse>> {
    const res = await apiClient.get<ApiResponse<PagedResponse<SubmissionSummaryResponse>>>(
      '/api/student/submissions',
      { params }
    );
    return res.data.data;
  },

  async getSubmissionById(submissionId: number): Promise<SubmissionDetailResponse> {
    const res = await apiClient.get<ApiResponse<SubmissionDetailResponse>>(
      `/api/student/submissions/${submissionId}`
    );
    return res.data.data;
  },

  async uploadFile(submissionId: number, file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse<FileUploadResponse>>(
      `/api/submissions/${submissionId}/files`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data.data;
  },

  async getResults(params?: PageableQuery): Promise<PagedResponse<ResultSummaryResponse>> {
    const res = await apiClient.get<ApiResponse<PagedResponse<ResultSummaryResponse>>>(
      '/api/student/results',
      { params }
    );
    return res.data.data;
  },

  async getResultById(id: number): Promise<ResultDetailResponse> {
    const res = await apiClient.get<ApiResponse<ResultDetailResponse>>(`/api/student/results/${id}`);
    return res.data.data;
  },

  // Note: if student insights uses a dedicated endpoint or teacher performance endpoint by student id:
  async getStudentPerformance(studentId: number): Promise<StudentPerformanceResponse> {
    try {
      const res = await apiClient.get<ApiResponse<StudentPerformanceResponse>>(
        `/api/teacher/students/${studentId}/performance`
      );
      return res.data.data;
    } catch {
      // Fallback if not teacher role
      return {
        studentId,
        totalExamsTaken: 0,
        averagePercentage: 0,
        strongTopics: [],
        weakTopics: [],
      };
    }
  },
};
