'use client';

import { useState } from 'react';
import { SignupView } from './signup.view';
import { useSignupModel } from './signup.model';
import type { SignupFormData } from './signup.types';

export default function SignupPage() {
  const { signup, validateForm, isLoading, error, success, setError } = useSignupModel();

  const [formData, setFormData] = useState<SignupFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'SELLER',
  });

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
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

    await signup(formData);
  };

  return (
    <SignupView
      formData={formData}
      isLoading={isLoading}
      error={error}
      success={success}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
    />
  );
}
