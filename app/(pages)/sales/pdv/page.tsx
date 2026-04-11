"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { useBreadcrumb } from "@/components/breadcrumb/use-breadcrumb";
import { usePdvModel } from "./pdv.model";
import { PdvView } from "./pdv.view";

export default function PdvPage() {
  useBreadcrumb({
    title: "Ponto de Venda",
    backUrl: "/sales",
    section: "Vendas",
    subsection: "PDV",
  });

  const searchParams = useSearchParams();

  useEffect(() => {
    const infinitepay = searchParams.get("infinitepay");
    if (infinitepay === "success") {
      toast.success("Pagamento aprovado! Venda registrada com sucesso.");
      window.history.replaceState({}, "", "/sales/pdv");
    } else if (infinitepay === "error") {
      const message = searchParams.get("message") || "Pagamento não concluído.";
      toast.error("Pagamento falhou: " + decodeURIComponent(message));
      window.history.replaceState({}, "", "/sales/pdv");
    }
  }, [searchParams]);

  const model = usePdvModel();
  return <PdvView {...model} />;
}
