"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWarehousesModel } from "./warehouses.model";
import { WarehousesView } from "./warehouses.view";
import { useAuth } from "@/lib/contexts/auth-context";

export function PageClient() {
  const model = useWarehousesModel();
  const { user } = useAuth();
  const { replace } = useRouter();

  useEffect(() => {
    if (user?.mustChangePassword) {
      replace("/change-password");
    }
  }, [user, replace]);

  if (user?.mustChangePassword) return null;

  return <WarehousesView {...model} />;
}
