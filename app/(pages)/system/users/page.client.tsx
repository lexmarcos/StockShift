"use client";

import { useEffect } from "react";
import { useBreadcrumbContext } from "@/components/breadcrumb/breadcrumb-context";
import { useUsersModel } from "./users.model";
import { UsersView } from "./users.view";

export function PageClient() {
  const { setBreadcrumb } = useBreadcrumbContext();
  const model = useUsersModel();

  useEffect(() => {
    setBreadcrumb({
      title: "Usuários",
      section: "Sistema",
      subsection: "Gerenciamento",
      backUrl: "/system",
    });
  }, [setBreadcrumb]);

  return <UsersView {...model} />;
}
