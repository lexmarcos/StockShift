import { useState } from 'react';
import type { CreateBrandFormData, CreateBrandRequest, BrandResponse, ApiError } from './create-brand.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const useCreateBrandModel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createBrand = async (data: CreateBrandFormData): Promise<BrandResponse | null> => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setError('É necessário estar autenticado para criar marcas');
        return null;
      }

      const requestData: CreateBrandRequest = {
        name: data.name,
      };

      // Adiciona descrição apenas se não estiver vazia
      if (data.description.trim()) {
        requestData.description = data.description;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/brands`, {
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
          setError('Você não tem permissão para criar marcas. Apenas ADMIN ou MANAGER podem criar marcas.');
        } else if (response.status === 409) {
          setError('Já existe uma marca com este nome');
        } else {
          setError(errorData.detail || 'Erro ao criar marca');
        }
        return null;
      }

      const brandResponse: BrandResponse = await response.json();
      setSuccess(true);
      return brandResponse;
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (data: CreateBrandFormData): string | null => {
    if (!data.name.trim()) {
      return 'Nome da marca é obrigatório';
    }

    if (data.name.length < 2 || data.name.length > 100) {
      return 'Nome da marca deve ter entre 2 e 100 caracteres';
    }

    if (data.description && data.description.length > 1000) {
      return 'Descrição deve ter no máximo 1000 caracteres';
    }

    return null;
  };

  const resetForm = () => {
    setError(null);
    setSuccess(false);
  };

  return {
    createBrand,
    validateForm,
    resetForm,
    isLoading,
    error,
    success,
    setError,
  };
};
