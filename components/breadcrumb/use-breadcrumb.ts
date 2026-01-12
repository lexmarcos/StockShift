"use client";

import { useEffect } from "react";
import { useBreadcrumbContext } from "./breadcrumb-context";
import { UseBreadcrumbParams } from "./breadcrumb.types";

export function useBreadcrumb(params: UseBreadcrumbParams): void {
  const { setBreadcrumb, clearBreadcrumb } = useBreadcrumbContext();
  const { title, backUrl, section, subsection } = params;

  useEffect(() => {
    setBreadcrumb({
      title,
      backUrl,
      section,
      subsection,
    });

    return () => {
      clearBreadcrumb();
    };
  }, [title, backUrl, section, subsection, setBreadcrumb, clearBreadcrumb]);
}
