"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChangePasswordModel } from "./change-password.model";
import { ChangePasswordView } from "./change-password.view";
import { useAuth } from "@/lib/contexts/auth-context";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const methods = useChangePasswordModel();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!user.mustChangePassword) {
      router.push("/warehouses");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || !user.mustChangePassword) {
    return null;
  }

  return <ChangePasswordView {...methods} />;
}
