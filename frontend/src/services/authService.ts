import { apiClient } from '../api/client';
import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  UserProfile,
} from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/login', credentials);
    return res.data.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/register', data);
    return res.data.data;
  },

  async refreshToken(req: RefreshTokenRequest): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/refresh', req);
    return res.data.data;
  },

  async logout(refreshToken?: string): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout', { refreshToken });
    } catch {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('examind_token');
      localStorage.removeItem('examind_refresh_token');
      localStorage.removeItem('examind_user');
    }
  },

  async getCurrentUser(): Promise<UserProfile> {
    const res = await apiClient.get<ApiResponse<UserProfile>>('/api/users/me');
    return res.data.data;
  },
};
