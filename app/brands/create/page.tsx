'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateBrandView } from './create-brand.view';
import { useCreateBrandModel } from './create-brand.model';
import type { CreateBrandFormData } from './create-brand.types';

export default function CreateBrandPage() {
  const router = useRouter();
  const { createBrand, validateForm, resetForm, isLoading, error, success, setError } = useCreateBrandModel();

  const [formData, setFormData] = useState<CreateBrandFormData>({
    name: '',
    description: '',
  });

  const handleInputChange = (field: keyof CreateBrandFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    const result = await createBrand(formData);
    if (result) {
      // Aguarda 2 segundos para mostrar mensagem de sucesso antes de redirecionar
      setTimeout(() => {
        router.push('/brands');
      }, 2000);
    }
  };

  return (
    <CreateBrandView
      formData={formData}
      isLoading={isLoading}
      error={error}
      success={success}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
    />
  );
}
