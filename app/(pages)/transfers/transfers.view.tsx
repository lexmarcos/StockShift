import {
  Plus,
  ArrowRight,
  Package,
  Calendar,
  Truck,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Inbox,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { InsightCard } from "@/components/ui/insight-card";
import { StatusCard } from "@/components/ui/status-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { SectionLabel } from "@/components/ui/section-label";
import { Transfer, TransferStatus } from "./transfers.types";
import { cn } from "@/lib/utils";

interface TransfersViewProps {
  transfers: Transfer[];
  isLoading: boolean;
  error: Error | null;
  activeTab: "outgoing" | "incoming";
  onTabChange: (tab: "outgoing" | "incoming") => void;
  stats: {
    total: number;
    inTransit: number;
    pending: number;
    completed: number;
  };
  onRetry: () => void;
}

const statusConfig: Record<
  TransferStatus,
  { cardStatus: "info" | "success" | "warning" | "error" | "neutral"; label: string }
> = {
  [TransferStatus.DRAFT]: { cardStatus: "info", label: "Rascunho" },
  [TransferStatus.IN_TRANSIT]: { cardStatus: "warning", label: "Em Trânsito" },
  [TransferStatus.PENDING_VALIDATION]: {
    cardStatus: "info",
    label: "Aguardando Validação",
  },
  [TransferStatus.IN_VALIDATION]: {
    cardStatus: "info",
    label: "Em Validação",
  },
  [TransferStatus.COMPLETED]: { cardStatus: "success", label: "Concluído" },
  [TransferStatus.CANCELLED]: { cardStatus: "neutral", label: "Cancelado" },
};

const statusDotColor: Record<TransferStatus, string> = {
  [TransferStatus.DRAFT]: "bg-blue-500",
  [TransferStatus.IN_TRANSIT]: "bg-amber-500",
  [TransferStatus.PENDING_VALIDATION]: "bg-purple-500",
  [TransferStatus.IN_VALIDATION]: "bg-purple-500",
  [TransferStatus.COMPLETED]: "bg-emerald-500",
  [TransferStatus.CANCELLED]: "bg-neutral-500",
};

export function TransfersView({
  transfers,
  isLoading,
  error,
  activeTab,
  onTabChange,
  stats,
  onRetry,
}: TransfersViewProps) {
  return (
    <PageContainer>
      <PageHeader
        title="Transferências"
        subtitle="Gerenciamento"
        actions={
          activeTab === "outgoing" ? (
            <Button
              asChild
              className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
            >
              <Link href="/transfers/new">
                <Plus className="mr-2 h-4 w-4" strokeWidth={2.5} />
                Nova Transferência
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Tab Selector */}
      <div className="mb-8 grid grid-cols-2 gap-3">
        <button
          onClick={() => onTabChange("outgoing")}
          className={cn(
            "group relative flex items-center gap-3 rounded-[4px] border px-5 py-4",
            activeTab === "outgoing"
              ? "border-blue-600 bg-blue-600/5"
              : "border-neutral-800 bg-[#171717] hover:border-neutral-700"
          )}
        >
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-[4px]",
              activeTab === "outgoing"
                ? "bg-blue-600/20 text-blue-400"
                : "bg-neutral-800 text-neutral-500"
            )}
          >
            <Send className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="text-left">
            <p
              className={cn(
                "text-sm font-bold",
                activeTab === "outgoing" ? "text-white" : "text-neutral-400"
              )}
            >
              Enviadas
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Saída do Depósito
            </p>
          </div>
          {activeTab === "outgoing" && (
            <div className="absolute bottom-0 left-5 right-5 h-[2px] bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => onTabChange("incoming")}
          className={cn(
            "group relative flex items-center gap-3 rounded-[4px] border px-5 py-4",
            activeTab === "incoming"
              ? "border-blue-600 bg-blue-600/5"
              : "border-neutral-800 bg-[#171717] hover:border-neutral-700"
          )}
        >
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-[4px]",
              activeTab === "incoming"
                ? "bg-blue-600/20 text-blue-400"
                : "bg-neutral-800 text-neutral-500"
            )}
          >
            <Inbox className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="text-left">
            <p
              className={cn(
                "text-sm font-bold",
                activeTab === "incoming" ? "text-white" : "text-neutral-400"
              )}
            >
              Recebidas
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Entrada no Depósito
            </p>
          </div>
          {activeTab === "incoming" && (
            <div className="absolute bottom-0 left-5 right-5 h-[2px] bg-blue-600" />
          )}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <InsightCard
          icon={Package}
          color="blue"
          label="Total"
          value={stats.total}
        />
        <InsightCard
          icon={Truck}
          color="amber"
          label="Em Trânsito"
          value={stats.inTransit}
        />
        <InsightCard
          icon={Clock}
          color="rose"
          label="Pendentes"
          value={stats.pending}
        />
        <InsightCard
          icon={CheckCircle2}
          color="emerald"
          label="Concluídas"
          value={stats.completed}
        />
      </div>

      <SectionLabel icon={activeTab === "outgoing" ? ArrowUpRight : ArrowDownLeft} className="mb-4">
        {activeTab === "outgoing" ? "Transferências Enviadas" : "Transferências Recebidas"}
      </SectionLabel>

      {isLoading ? (
        <LoadingState message="Carregando transferências..." />
      ) : error ? (
        <ErrorState
          title="Erro ao carregar transferências"
          description="Não foi possível carregar a lista de transferências. Tente novamente."
          onRetry={onRetry}
        />
      ) : transfers.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhuma transferência encontrada"
          description={
            activeTab === "outgoing"
              ? "Comece criando uma nova transferência para enviar itens."
              : "Nenhuma transferência recebida neste depósito."
          }
          action={
            activeTab === "outgoing"
              ? { label: "NOVA TRANSFERÊNCIA", onClick: () => {} }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {transfers.map((transfer) => {
            const config = statusConfig[transfer.status] || {
              cardStatus: "neutral" as const,
              label: transfer.status,
            };
            const dotColor = statusDotColor[transfer.status] || "bg-neutral-500";

            return (
              <Link
                key={transfer.id}
                href={`/transfers/${transfer.id}`}
                className="block group"
              >
                <StatusCard
                  status={config.cardStatus}
                  className="p-4 sm:p-5 cursor-pointer hover:bg-neutral-800/50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      {/* Code + Status badge */}
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-bold tracking-tighter text-neutral-300 bg-neutral-800/60 px-2 py-0.5 rounded-[4px]">
                          {transfer.code}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                          <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
                          {config.label}
                        </span>
                      </div>

                      {/* Warehouses */}
                      <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
                        <span className="truncate max-w-[140px] sm:max-w-none">
                          {transfer.sourceWarehouseName}
                        </span>
                        <ArrowRight
                          className="h-3.5 w-3.5 flex-shrink-0 text-neutral-600"
                          strokeWidth={2.5}
                        />
                        <span className="truncate max-w-[140px] sm:max-w-none">
                          {transfer.destinationWarehouseName}
                        </span>
                      </div>

                      {/* Meta info */}
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5" strokeWidth={2} />
                          <span>{transfer.items?.length || 0} itens</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                          <span>
                            {new Date(transfer.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow indicator (desktop) */}
                    <div className="hidden sm:flex items-center justify-center h-10 w-10 rounded-[4px] bg-neutral-800/50 group-hover:bg-blue-600/20 group-hover:text-blue-400 text-neutral-600">
                      <ArrowRight className="h-5 w-5" strokeWidth={2} />
                    </div>
                  </div>
                </StatusCard>
              </Link>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
