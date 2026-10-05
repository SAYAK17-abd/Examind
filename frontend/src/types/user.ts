import { RoleType, UserStatus } from './auth';

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: RoleType;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
}

export interface AdminUserFilter {
  role?: string;
  status?: UserStatus;
  search?: string;
  page?: number;
  size?: number;
}
