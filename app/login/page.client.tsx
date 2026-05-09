"use client";

import { useLoginModel } from "./login.model";
import { LoginView } from "./login.view";

export function PageClient() {
  const methods = useLoginModel();

  return <LoginView {...methods} />;
}
