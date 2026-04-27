"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Package,
  ReceiptText,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageContainer } from "@/components/ui/page-container";
import {
  formatCents,
  PAYMENT_METHOD_LABELS,
  SALE_STATUS_LABELS,
} from "../../sales.types";
import type { InfinitePayResultViewProps } from "./infinitepay-result.types";

function resolveResultCopy(status: InfinitePayResultViewProps["status"]) {
  if (status === "success") {
    return {
      title: "Pagamento aprovado",
      description: "A venda foi confirmada pela InfinitePay.",
      iconClassName: "text-emerald-500",
      borderClassName: "border-emerald-500/30 bg-emerald-950/10",
    };
  }

  return {
    title: "Pagamento não concluído",
    description: "A InfinitePay retornou uma falha para esta tentativa.",
    iconClassName: "text-rose-500",
    borderClassName: "border-rose-500/30 bg-rose-950/10",
  };
}

export function InfinitePayResultView({
  status,
  sale,
  message,
  isLoading,
  hasSaleId,
  hasError,
  retrySaleFetch,
}: InfinitePayResultViewProps) {
  const copy = resolveResultCopy(status);
  const ResultIcon = status === "success" ? CheckCircle2 : AlertTriangle;

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Carregando resumo da venda..." />
      </PageContainer>
    );
  }

  if (hasError) {
    return (
      <PageContainer>
        <ErrorState
          title="Erro ao carregar venda"
          description="O pagamento retornou, mas não foi possível carregar o resumo agora."
          onRetry={retrySaleFetch}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <section className={`rounded-[4px] border p-5 ${copy.borderClassName}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <ResultIcon className={`h-9 w-9 shrink-0 ${copy.iconClassName}`} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                InfinitePay
              </p>
              <h1 className="mt-1 text-2xl font-bold text-white">
                {copy.title}
              </h1>
              <p className="mt-2 text-sm text-neutral-400">
                {message || copy.description}
              </p>
            </div>
            <Button asChild className="rounded-[4px] bg-blue-600 text-white hover:bg-blue-500">
              <Link href="/sales">
                Ver vendas <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {!hasSaleId && (
          <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
            <p className="text-sm text-neutral-400">
              Nenhuma venda foi informada no retorno da InfinitePay.
            </p>
          </div>
        )}

        {sale && (
          <section className="overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717]">
            <div className="border-b border-neutral-800 px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    Resumo da venda
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-white">
                    {sale.code}
                  </h2>
                </div>
                <span className="w-fit rounded-[2px] border border-neutral-700 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-neutral-300">
                  {SALE_STATUS_LABELS[sale.status]}
                </span>
              </div>
            </div>

            <div className="grid gap-4 border-b border-neutral-800 p-5 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <CreditCard className="mt-0.5 h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    Pagamento
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {PAYMENT_METHOD_LABELS[sale.paymentMethod]}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Warehouse className="mt-0.5 h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    Depósito
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {sale.warehouseName}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ReceiptText className="mt-0.5 h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    Data
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-white">Itens</p>
                <p className="text-xs text-neutral-500">
                  {sale.items.length} item(s)
                </p>
              </div>
              <div className="divide-y divide-neutral-800">
                {sale.items.map((item) => (
                  <div key={item.id} className="flex gap-3 py-3 first:pt-0">
                    <Package className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {item.productName}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {item.quantity} x {formatCents(item.unitPrice)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-white">
                      {formatCents(item.totalPrice)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-800 bg-neutral-950/40 p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-bold text-neutral-400">Total</p>
                <p className="text-2xl font-bold text-white">
                  {formatCents(sale.total)}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </PageContainer>
  );
}
