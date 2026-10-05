export type RoleType = 'ROLE_STUDENT' | 'ROLE_TEACHER' | 'ROLE_ADMIN' | 'STUDENT' | 'TEACHER' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'BLOCKED';

export interface UserSummary {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: RoleType;
  status: UserStatus;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummary;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
