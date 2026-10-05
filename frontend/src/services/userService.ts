import { apiClient } from '../api/client';
import { ApiResponse, UserProfile, UpdateProfileRequest } from '../types';

export const userService = {
  async getMe(): Promise<UserProfile> {
    const res = await apiClient.get<ApiResponse<UserProfile>>('/api/users/me');
    return res.data.data;
  },

  async updateMe(data: UpdateProfileRequest): Promise<UserProfile> {
    const res = await apiClient.put<ApiResponse<UserProfile>>('/api/users/me', data);
    return res.data.data;
  },

  async getUserById(id: number): Promise<UserProfile> {
    const res = await apiClient.get<ApiResponse<UserProfile>>(`/api/users/${id}`);
    return res.data.data;
  },
};
