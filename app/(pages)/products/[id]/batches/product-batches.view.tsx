"use client";

import Link from "next/link";
import {
  ArrowUp,
  ArrowDown,
  Eye,
  Layers,
  Package,
  AlertTriangle,
} from "lucide-react";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  deriveBatchStatus,
  formatBatchDate,
  formatCentsToBRL,
} from "./product-batches.model";
import type {
  ProductBatch,
  ProductBatchesViewProps,
  SortKey,
} from "./product-batches.types";

/* ─── Status color + icon maps ─── */

const STATUS_COLORS: Record<string, string> = {
  expired: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  expiring: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  low: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
};

const STATUS_ICONS: Record<string, typeof Package> = {
  expired: AlertTriangle,
  expiring: AlertTriangle,
  low: Package,
  ok: Package,
};

/* ─── BatchStatusBadge ─── */

const BatchStatusBadge = ({ batch }: { batch: ProductBatch }) => {
  const status = deriveBatchStatus(batch);
  const Icon = STATUS_ICONS[status.kind] ?? Package;
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-7 rounded-[4px] border px-2 text-[10px] font-bold uppercase tracking-wider",
        STATUS_COLORS[status.kind] ?? "border-neutral-800 text-neutral-400",
      )}
    >
      <Icon className="mr-1.5 size-3.5" />
      {status.label}
    </Badge>
  );
};

/* ─── SortIcon ─── */

const SortIcon = ({
  column,
  sortKey,
  sortDirection,
}: {
  column: SortKey;
  sortKey: SortKey;
  sortDirection: "asc" | "desc";
}) => {
  if (column !== sortKey) return <div className="size-3 opacity-0" />;
  return sortDirection === "asc" ? (
    <ArrowUp className="ml-1 size-3 text-blue-500" />
  ) : (
    <ArrowDown className="ml-1 size-3 text-blue-500" />
  );
};

/* ─── SortableHead ─── */

const SortableHead = ({
  column,
  label,
  sortKey,
  sortDirection,
  onSortChange,
}: {
  column: SortKey;
  label: string;
  sortKey: SortKey;
  sortDirection: "asc" | "desc";
  onSortChange: (key: SortKey) => void;
}) => (
  <TableHead
    className="h-10 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
    onClick={() => onSortChange(column)}
  >
    <div className="flex items-center gap-1">
      {label}
      <SortIcon column={column} sortKey={sortKey} sortDirection={sortDirection} />
    </div>
  </TableHead>
);

/* ─── DesktopTable ─── */

const DesktopTable = ({
  batches,
  sortKey,
  sortDirection,
  onSortChange,
}: {
  batches: ProductBatch[];
  sortKey: SortKey;
  sortDirection: "asc" | "desc";
  onSortChange: (key: SortKey) => void;
}) => (
  <div className="hidden overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717] md:block">
    <Table>
      <TableHeader className="bg-neutral-900">
        <TableRow className="border-b border-neutral-800 hover:bg-neutral-900">
          <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Lote
          </TableHead>
          <SortableHead
            column="quantity" label="Qtd"
            sortKey={sortKey} sortDirection={sortDirection}
            onSortChange={onSortChange}
          />
          <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Preço Custo
          </TableHead>
          <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Preço Venda
          </TableHead>
          <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Fabricação
          </TableHead>
          <SortableHead
            column="expirationDate" label="Validade"
            sortKey={sortKey} sortDirection={sortDirection}
            onSortChange={onSortChange}
          />
          <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Ações
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {batches.map((batch) => (
          <TableRow
            key={batch.id}
            className="group border-b border-neutral-800/50 transition-colors hover:bg-neutral-800/50"
          >
            <TableCell className="py-3 font-mono text-xs text-neutral-300">
              {batch.batchCode ?? "—"}
            </TableCell>
            <TableCell className="py-3 font-mono text-sm font-bold tabular-nums text-white">
              {batch.quantity}
            </TableCell>
            <TableCell className="py-3 text-right font-mono text-xs tabular-nums text-neutral-400">
              {formatCentsToBRL(batch.costPrice, "—")}
            </TableCell>
            <TableCell className="py-3 text-right font-mono text-xs tabular-nums text-neutral-400">
              {formatCentsToBRL(batch.sellingPrice, "—")}
            </TableCell>
            <TableCell className="py-3 text-xs text-neutral-400">
              {formatBatchDate(batch.manufacturedDate)}
            </TableCell>
            <TableCell className="py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-neutral-300">
                  {formatBatchDate(batch.expirationDate)}
                </span>
                <BatchStatusBadge batch={batch} />
              </div>
            </TableCell>
            <TableCell className="py-3 text-right">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="size-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
              >
                <Link href={`/batches/${batch.id}`}>
                  <Eye className="size-4" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

/* ─── MobileCards ─── */

const MobileCards = ({ batches }: { batches: ProductBatch[] }) => (
  <div className="grid gap-2 md:hidden">
    {batches.map((batch) => (
      <Link
        key={batch.id}
        href={`/batches/${batch.id}`}
        className="flex items-center justify-between rounded-[4px] border border-neutral-800 bg-[#171717] p-3 transition-colors hover:border-neutral-700"
      >
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-white truncate">
              {batch.batchCode ?? "—"}
            </span>
            <BatchStatusBadge batch={batch} />
          </div>
          <span className="text-xs text-neutral-400">
            {batch.quantity} un. • {formatCentsToBRL(batch.sellingPrice, "Sem preço")}
          </span>
          <span className="text-[11px] text-neutral-500">
            Validade: {formatBatchDate(batch.expirationDate)}
          </span>
        </div>
        <Eye className="size-4 shrink-0 text-neutral-600" />
      </Link>
    ))}
  </div>
);

/* ─── ProductBatchesView (main export) ─── */

export const ProductBatchesView = ({
  batches,
  productName,
  isLoading,
  error,
  requiresWarehouse,
  sortKey,
  sortDirection,
  onSortChange,
}: ProductBatchesViewProps) => {
  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Carregando lotes..." />
      </PageContainer>
    );
  }

  if (requiresWarehouse) {
    return (
      <PageContainer>
        <ErrorState
          title="Selecione um armazém"
          description="É necessário selecionar um armazém para visualizar os lotes."
        />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          title="Erro ao carregar lotes"
          description="Não foi possível carregar os lotes deste produto."
        />
      </PageContainer>
    );
  }

  if (batches.length === 0) {
    return (
      <PageContainer>
        <PageHeader
          title={productName || "Lotes"}
          subtitle="Lotes do produto"
        />
        <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-[4px] border border-dashed border-neutral-800 bg-[#171717]/30">
          <div className="flex size-16 items-center justify-center rounded-[4px] bg-neutral-900 ring-1 ring-neutral-800">
            <Layers className="size-6 text-neutral-600" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-300">
              Nenhum lote encontrado
            </h3>
            <p className="mt-1 max-w-xs text-xs text-neutral-500">
              Este produto não possui lotes neste armazém.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={productName || "Lotes"}
        subtitle="Lotes do produto"
      />
      <DesktopTable
        batches={batches}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={onSortChange}
      />
      <MobileCards batches={batches} />
    </PageContainer>
  );
};
