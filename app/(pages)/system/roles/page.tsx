"use client";

import { useEffect } from "react";
import { useBreadcrumbContext } from "@/components/breadcrumb/breadcrumb-context";
import { useRolesModel } from "./roles.model";
import { RolesView } from "./roles.view";

export default function RolesPage() {
  const { setBreadcrumb } = useBreadcrumbContext();
  const model = useRolesModel();

  useEffect(() => {
    setBreadcrumb({
      title: "Roles",
      section: "Sistema",
      subsection: "Permissões",
      backUrl: "/system",
    });
  }, [setBreadcrumb]);

  return <RolesView {...model} />;
}
