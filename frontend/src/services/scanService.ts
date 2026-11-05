import { apiClient } from '../api/client';
import { ApiResponse } from '../types';
import { ScanResultResponse, VerifyScanRequest } from '../types/scan';

export const scanService = {
  async uploadBulkScans(examId: number, files: File[]): Promise<ScanResultResponse[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const res = await apiClient.post<ApiResponse<ScanResultResponse[]>>(
      `/api/teacher/exams/${examId}/scan/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data.data;
  },

  async getScanResults(examId: number): Promise<ScanResultResponse[]> {
    const res = await apiClient.get<ApiResponse<ScanResultResponse[]>>(
      `/api/teacher/exams/${examId}/scan/results`
    );
    return res.data.data;
  },

  async verifyScan(examId: number, resultId: number, data: VerifyScanRequest): Promise<ScanResultResponse> {
    const res = await apiClient.put<ApiResponse<ScanResultResponse>>(
      `/api/teacher/exams/${examId}/scan/results/${resultId}/verify`,
      data
    );
    return res.data.data;
  },
};

