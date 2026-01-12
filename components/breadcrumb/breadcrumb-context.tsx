"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BreadcrumbData, BreadcrumbContextValue } from "./breadcrumb.types";

const ROUTE_SECTIONS: Record<string, { section: string; subsection: string }> = {
  products: { section: "Inventário", subsection: "Detalhes" },
  batches: { section: "Inventário", subsection: "Lote" },
  "stock-movements": { section: "Movimentação", subsection: "Detalhes" },
  warehouses: { section: "Armazéns", subsection: "Detalhes" },
  categories: { section: "Configurações", subsection: "Categoria" },
  brands: { section: "Configurações", subsection: "Marca" },
};

const BreadcrumbContext = createContext<BreadcrumbContextValue | undefined>(
  undefined
);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [breadcrumb, setBreadcrumbState] = useState<BreadcrumbData | null>(null);
  const pathname = usePathname();

  // Auto-clear breadcrumb on shallow routes (depth <= 1)
  useEffect(() => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const depth = pathSegments.length;

    if (depth <= 1) {
      setBreadcrumbState(null);
    }
  }, [pathname]);

  const setBreadcrumb = (data: BreadcrumbData) => {
    // Infer section/subsection if not provided
    const pathSegments = pathname.split("/").filter(Boolean);
    const firstSegment = pathSegments[0];
    const routeInfo = ROUTE_SECTIONS[firstSegment];

    const finalData: BreadcrumbData = {
      ...data,
      section: data.section || routeInfo?.section || "Navegação",
      subsection: data.subsection || routeInfo?.subsection || "Detalhes",
    };

    setBreadcrumbState(finalData);
  };

  const clearBreadcrumb = () => {
    setBreadcrumbState(null);
  };

  return (
    <BreadcrumbContext.Provider
      value={{ breadcrumb, setBreadcrumb, clearBreadcrumb }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbContext() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error(
      "useBreadcrumbContext must be used within a BreadcrumbProvider"
    );
  }
  return context;
}
