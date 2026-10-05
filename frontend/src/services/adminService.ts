import { apiClient } from '../api/client';
import { ApiResponse, PagedResponse, UserProfile, AdminUserFilter, UserStatus } from '../types';

export const adminService = {
  async getUsers(filter?: AdminUserFilter): Promise<PagedResponse<UserProfile>> {
    const res = await apiClient.get<ApiResponse<PagedResponse<UserProfile>>>('/api/admin/users', {
      params: filter,
    });
    return res.data.data;
  },

  async updateUserStatus(id: number, status: UserStatus): Promise<UserProfile> {
    const res = await apiClient.patch<ApiResponse<UserProfile>>(
      `/api/admin/users/${id}/status`,
      null,
      {
        params: { status },
      }
    );
    return res.data.data;
  },
};
