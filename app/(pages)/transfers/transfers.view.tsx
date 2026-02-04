"use client";

import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransfersViewProps, Transfer, TransferStatus } from "./transfers.types";
import { needsAction } from "./transfers.model";

const statusConfig: Record<TransferStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Rascunho", variant: "secondary" },
  IN_TRANSIT: { label: "Em Trânsito", variant: "default" },
  IN_VALIDATION: { label: "Em Validação", variant: "outline" },
  COMPLETED: { label: "Concluída", variant: "default" },
  CANCELLED: { label: "Cancelada", variant: "destructive" },
};

const TransferCard = ({
  transfer,
  currentWarehouseId,
}: {
  transfer: Transfer;
  currentWarehouseId: string | null;
}) => {
  const config = statusConfig[transfer.status];
  const showActionBadge = needsAction(transfer, currentWarehouseId);
  const itemCount = transfer.items.length;

  return (
    <Link href={`/transfers/${transfer.id}`}>
      <div className="rounded-lg border border-border/60 bg-card p-4 hover:bg-foreground/5 transition-colors">
        {showActionBadge && (
          <Badge variant="destructive" className="mb-2">
            Ação necessária
          </Badge>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-medium text-foreground">
            {transfer.sourceWarehouse.name}
          </span>
          <ArrowRight className="h-3 w-3" />
          <span className="font-medium text-foreground">
            {transfer.destinationWarehouse.name}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={config.variant}>{config.label}</Badge>
            <span className="text-xs text-muted-foreground">
              {itemCount} {itemCount === 1 ? "item" : "itens"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(transfer.createdAt).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </div>
    </Link>
  );
};

export const TransfersView = ({
  transfers,
  isLoading,
  currentWarehouseId,
  statusFilter,
  setStatusFilter,
  directionFilter,
  setDirectionFilter,
}: TransfersViewProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Transferências</h1>
        <Button asChild size="sm">
          <Link href="/transfers/create">
            <Plus className="h-4 w-4 mr-1" />
            Nova
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={directionFilter} onValueChange={(v) => setDirectionFilter(v as typeof directionFilter)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="sent">Enviadas</SelectItem>
            <SelectItem value="received">Recebidas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="DRAFT">Rascunho</SelectItem>
            <SelectItem value="IN_TRANSIT">Em Trânsito</SelectItem>
            <SelectItem value="IN_VALIDATION">Em Validação</SelectItem>
            <SelectItem value="COMPLETED">Concluída</SelectItem>
            <SelectItem value="CANCELLED">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {transfers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma transferência encontrada
        </div>
      ) : (
        <div className="space-y-2">
          {transfers.map((transfer) => (
            <TransferCard
              key={transfer.id}
              transfer={transfer}
              currentWarehouseId={currentWarehouseId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
