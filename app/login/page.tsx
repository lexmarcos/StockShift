'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginView } from './login.view';
import { useLoginModel } from './login.model';
import type { LoginFormData } from './login.types';

export default function LoginPage() {
  const router = useRouter();
  const { login, validateForm, isLoading, error, setError } = useLoginModel();

  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
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

    const result = await login(formData);
    if (result) {
      router.push('/');
    }
  };

  return (
    <LoginView
      formData={formData}
      isLoading={isLoading}
      error={error}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
    />
  );
}
