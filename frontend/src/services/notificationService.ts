import { apiClient } from '../api/client';
import { ApiResponse, PagedResponse, PageableQuery, NotificationResponse } from '../types';

export const notificationService = {
  async getNotifications(params?: PageableQuery): Promise<PagedResponse<NotificationResponse>> {
    const res = await apiClient.get<ApiResponse<PagedResponse<NotificationResponse>>>(
      '/api/notifications',
      { params }
    );
    return res.data.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<ApiResponse<number>>('/api/notifications/unread-count');
    return res.data.data;
  },

  async markRead(id: number): Promise<void> {
    await apiClient.patch(`/api/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await apiClient.patch('/api/notifications/read-all');
  },
};
