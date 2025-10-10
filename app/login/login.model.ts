import { useState } from "react";
import type { LoginFormData, LoginResponse, ApiError } from "./login.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const useLoginModel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (data: LoginFormData): Promise<LoginResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        setError(errorData.detail || "Erro ao fazer login");
        return null;
      }

      const loginResponse: LoginResponse = await response.json();

      // Armazenar tokens
      localStorage.setItem("accessToken", loginResponse.accessToken);
      localStorage.setItem("refreshToken", loginResponse.refreshToken);
      localStorage.setItem("username", loginResponse.username);
      localStorage.setItem("role", loginResponse.role);

      return loginResponse;
    } catch (err) {
      console.log(err);
      setError("Erro ao conectar com o servidor");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (data: LoginFormData): string | null => {
    if (!data.username.trim()) {
      return "Nome de usuário é obrigatório";
    }
    if (!data.password.trim()) {
      return "Senha é obrigatória";
    }
    return null;
  };

  return {
    login,
    validateForm,
    isLoading,
    error,
    setError,
  };
};
