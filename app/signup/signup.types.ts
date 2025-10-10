export interface SignupFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'ADMIN' | 'MANAGER' | 'SELLER';
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'SELLER';
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SELLER';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
}
