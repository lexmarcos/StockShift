import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Package, Calendar } from "lucide-react";
import Link from "next/link";
import { Transfer, TransferStatus } from "./transfers.types";
import { cn } from "@/lib/utils";

interface TransfersViewProps {
  transfers: Transfer[];
  isLoading: boolean;
  error: Error | null;
  activeTab: "outgoing" | "incoming";
  onTabChange: (tab: "outgoing" | "incoming") => void;
}

const statusConfig: Record<TransferStatus, { color: string; label: string }> = {
  [TransferStatus.DRAFT]: { color: "border-blue-600", label: "Rascunho" },
  [TransferStatus.IN_TRANSIT]: { color: "border-amber-500", label: "Em Trânsito" },
  [TransferStatus.IN_VALIDATION]: { color: "border-purple-500", label: "Em Validação" },
  [TransferStatus.COMPLETED]: { color: "border-emerald-600", label: "Concluído" },
  [TransferStatus.CANCELLED]: { color: "border-neutral-600", label: "Cancelado" },
};

export function TransfersView({
  transfers,
  isLoading,
  error,
  activeTab,
  onTabChange,
}: TransfersViewProps) {
  return (
    <div className="flex flex-col gap-6 p-4 pb-20 md:p-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Transferências</h1>
        {activeTab === "outgoing" && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide uppercase">
            <Link href="/transfers/new">
              <Plus className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Nova Transferência
            </Link>
          </Button>
        )}
      </div>

      <Tabs
        defaultValue="outgoing"
        value={activeTab}
        onValueChange={(val) => onTabChange(val as "outgoing" | "incoming")}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-2 bg-neutral-900 border border-neutral-800 p-1 rounded-[4px]">
          <TabsTrigger
            value="outgoing"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white uppercase tracking-wide font-bold rounded-[2px]"
          >
            Enviadas
          </TabsTrigger>
          <TabsTrigger
            value="incoming"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white uppercase tracking-wide font-bold rounded-[2px]"
          >
            Recebidas
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {isLoading ? (
            <div className="text-center py-10 text-neutral-500">Carregando...</div>
          ) : error ? (
            <div className="text-center py-10 bg-rose-500/10 text-rose-500 rounded-[4px] border border-rose-500/20">
              <p>Erro ao carregar transferências</p>
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 bg-neutral-900/50 rounded border border-neutral-800 border-dashed">
              <Package className="mx-auto h-10 w-10 mb-3 opacity-20" strokeWidth={2} />
              <p>Nenhuma transferência encontrada</p>
            </div>
          ) : (
            transfers.map((transfer) => {
              const config = statusConfig[transfer.status] || { color: "border-neutral-600", label: transfer.status };
              const totalItems = transfer.items.reduce((acc, item) => acc + item.quantity, 0);

              return (
                <Link key={transfer.id} href={`/transfers/${transfer.id}`} className="block group">
                  <Card className={cn(
                    "bg-[#171717] border-neutral-800 hover:border-neutral-700 border-l-4 rounded-[4px]",
                    config.color
                  )}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-bold text-neutral-400 bg-neutral-800/50 px-2 py-0.5 rounded-[4px] tracking-tighter">
                              {transfer.code}
                            </span>
                            <span className={cn("text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300")}>
                              {config.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-neutral-300 text-sm sm:text-base font-medium">
                            <span className="truncate max-w-[120px] sm:max-w-none">{transfer.sourceWarehouseName}</span>
                            <ArrowRight className="h-4 w-4 text-neutral-500 flex-shrink-0" strokeWidth={2} />
                            <span className="truncate max-w-[120px] sm:max-w-none">{transfer.destinationWarehouseName}</span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-neutral-500 mt-2">
                            <div className="flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5" strokeWidth={2} />
                              <span>{totalItems} {totalItems === 1 ? "item" : "itens"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                              <span>{new Date(transfer.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="hidden sm:flex items-center justify-center h-10 w-10 rounded-[4px] bg-neutral-800/50 group-hover:bg-blue-600/20 group-hover:text-blue-500">
                          <ArrowRight className="h-5 w-5" strokeWidth={2} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
