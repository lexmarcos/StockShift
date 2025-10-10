import { useState } from 'react';
import type { SignupFormData, CreateUserRequest, UserResponse, ApiError } from './signup.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const useSignupModel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const signup = async (data: SignupFormData): Promise<UserResponse | null> => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Obter o accessToken do admin (em produção, isso seria feito de forma diferente)
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setError('É necessário estar autenticado como ADMIN para criar usuários');
        return null;
      }

      const requestData: CreateUserRequest = {
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role,
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();

        if (response.status === 403) {
          setError('Você não tem permissão para criar usuários. Apenas ADMIN pode criar usuários.');
        } else if (response.status === 409) {
          setError('Usuário ou email já existe');
        } else {
          setError(errorData.detail || 'Erro ao criar usuário');
        }
        return null;
      }

      const userResponse: UserResponse = await response.json();
      setSuccess(true);
      return userResponse;
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (data: SignupFormData): string | null => {
    if (!data.username.trim()) {
      return 'Nome de usuário é obrigatório';
    }
    if (data.username.length < 3 || data.username.length > 50) {
      return 'Nome de usuário deve ter entre 3 e 50 caracteres';
    }

    if (!data.email.trim()) {
      return 'Email é obrigatório';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return 'Email inválido';
    }

    if (!data.password.trim()) {
      return 'Senha é obrigatória';
    }
    if (data.password.length < 6 || data.password.length > 100) {
      return 'Senha deve ter entre 6 e 100 caracteres';
    }

    if (data.password !== data.confirmPassword) {
      return 'As senhas não coincidem';
    }

    if (!data.role) {
      return 'Tipo de usuário é obrigatório';
    }

    return null;
  };

  return {
    signup,
    validateForm,
    isLoading,
    error,
    success,
    setError,
  };
};
