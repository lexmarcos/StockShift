"use client";

import { useRegisterModel } from "./register.model";
import { RegisterView } from "./register.view";

export default function RegisterPage() {
  const methods = useRegisterModel();

  return <RegisterView {...methods} />;
}
