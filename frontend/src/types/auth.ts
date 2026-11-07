export type UserRole = 'CUSTOMER' | 'CAFE_OWNER' | 'CAFE_WORKER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  student_id?: string;
  phone_number?: string;
  fan?: string;
  zone?: number;
  block?: string;
  room?: string;
  allowed_devices: number;
  date_joined: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface PasswordRules {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}
