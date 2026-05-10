"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChangePasswordModel } from "./change-password.model";
import { ChangePasswordView } from "./change-password.view";
import { useAuth } from "@/lib/contexts/auth-context";

export function PageClient() {
  const { push } = useRouter();
  const { user, isLoading } = useAuth();
  const methods = useChangePasswordModel();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      push("/login");
      return;
    }

    if (!user.mustChangePassword) {
      push("/warehouses");
    }
  }, [user, isLoading, push]);

  if (isLoading || !user || !user.mustChangePassword) {
    return null;
  }

  return <ChangePasswordView {...methods} />;
}
