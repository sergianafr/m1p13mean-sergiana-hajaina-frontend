export type Role = 'CLIENT' | 'BOUTIQUE' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: Role;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: Role;
}
