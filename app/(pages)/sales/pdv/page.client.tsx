"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { usePdvModel } from "./pdv.model";
import { PdvView } from "./pdv.view";

interface PageClientProps {
  infinitepayStatus: string | null;
  infinitepayMessage: string | null;
}

export function PageClient({
  infinitepayStatus,
  infinitepayMessage,
}: PageClientProps) {
  useEffect(() => {
    if (infinitepayStatus === "success") {
      toast.success("Pagamento aprovado! Venda registrada com sucesso.");
      window.history.replaceState({}, "", "/sales/pdv");
    } else if (infinitepayStatus === "error") {
      const message = infinitepayMessage || "Pagamento não concluído.";
      toast.error("Pagamento falhou: " + decodeURIComponent(message));
      window.history.replaceState({}, "", "/sales/pdv");
    }
  }, [infinitepayMessage, infinitepayStatus]);

  const model = usePdvModel();
  return <PdvView {...model} />;
}
