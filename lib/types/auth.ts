export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  fullName: string;
  role: string;
  status: string;
  avatarUrl?: string | null;
  timezone?: string;
  language?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}
