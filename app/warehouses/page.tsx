"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWarehousesModel } from "./warehouses.model";
import { WarehousesView } from "./warehouses.view";
import { useAuth } from "@/lib/contexts/auth-context";

export default function WarehousesPage() {
  const model = useWarehousesModel();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.mustChangePassword) {
      router.replace("/change-password");
    }
  }, [user, router]);

  if (user?.mustChangePassword) return null;

  return <WarehousesView {...model} />;
}
