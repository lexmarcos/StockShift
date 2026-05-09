"use client";

import { useRegisterModel } from "./register.model";
import { RegisterView } from "./register.view";

export function PageClient() {
  const methods = useRegisterModel();

  return <RegisterView {...methods} />;
}
