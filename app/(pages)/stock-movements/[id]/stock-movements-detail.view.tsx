"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Package,
  Warehouse,
  FileText,
  DollarSign,
  Layers,
  AlertCircle,
  Link2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type {
  StockMovementItem,
  StockMovementType,
} from "../stock-movements.types";
import { MANUAL_MOVEMENT_TYPE_LABELS } from "../stock-movements.constants";
import type {
  StockMovementDetailViewProps,
  BatchPriceInfo,
  FinancialSummary,
  GroupedProduct,
  MovementCategory,
} from "./stock-movements-detail.types";
import { MOVEMENT_CATEGORY_MAP } from "./stock-movements-detail.types";

const ALL_TYPE_LABELS: Record<StockMovementType, string> = {
  ...MANUAL_MOVEMENT_TYPE_LABELS,
  SALE: "Venda",
  TRANSFER_IN: "Transf. Entrada",
  TRANSFER_OUT: "Transf. Saída",
};

const formatCurrency = (cents: number | null | undefined): string => {
  if (cents === null || cents === undefined) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
};

const getDirectionConfig = (direction: "IN" | "OUT") => {
  if (direction === "IN") {
    return {
      label: "ENTRADA",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: <ArrowDownRight className="w-3.5 h-3.5 mr-1" />,
    };
  }
  return {
    label: "SAÍDA",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    icon: <ArrowUpRight className="w-3.5 h-3.5 mr-1" />,
  };
};

const computeFinancialSummary = (
  items: StockMovementItem[],
  batchPrices: BatchPriceInfo[],
): FinancialSummary => {
  const priceMap = new Map(batchPrices.map((b) => [b.batchId, b]));

  let totalPurchaseCost = 0;
  let totalExpectedSale = 0;
  for (const item of items) {
    const prices = priceMap.get(item.batchId);
    if (prices) {
      const cost = (prices.costPrice ?? 0) * item.quantity;
      const sale = (prices.sellingPrice ?? 0) * item.quantity;
      totalPurchaseCost += cost;
      totalExpectedSale += sale;
    }
  }

  const totalProfit = totalExpectedSale - totalPurchaseCost;
  const averageProfitMargin =
    totalPurchaseCost > 0 ? (totalProfit / totalPurchaseCost) * 100 : 0;

  return {
    totalPurchaseCost,
    totalExpectedSale,
    totalProfit,
    averageProfitMargin,
  };
};

const groupItemsByProduct = (items: StockMovementItem[]): GroupedProduct[] => {
  const map = new Map<string, GroupedProduct>();

  for (const item of items) {
    const existing = map.get(item.productId);
    if (existing) {
      existing.items.push(item);
      existing.totalQuantity += item.quantity;
    } else {
      map.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        productImageUrl: item.productImageUrl ?? null,
        items: [item],
        totalQuantity: item.quantity,
      });
    }
  }

  return Array.from(map.values());
};

export const StockMovementDetailView = ({
  movement,
  batchPrices,
  isLoading,
  error,
}: StockMovementDetailViewProps) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !movement) {
    return <ErrorState />;
  }

  const direction = getDirectionConfig(movement.direction);
  const category: MovementCategory = MOVEMENT_CATEGORY_MAP[movement.type];
  const groupedProducts = groupItemsByProduct(movement.items);
  const totalQuantity = movement.items.reduce((sum, i) => sum + i.quantity, 0);

  const showFinancial = category === "purchase" || category === "outflow";
  const financial: FinancialSummary | null = showFinancial
    ? computeFinancialSummary(movement.items, batchPrices)
    : null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-200 font-sans selection:bg-blue-500/30">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <HeaderSection
            movement={movement}
            direction={direction}
            totalQuantity={totalQuantity}
          />

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Items + Financial */}
            <div className="lg:col-span-8 space-y-6">
              {financial && showFinancial && (
                <FinancialCard
                  financial={financial}
                  category={category}
                  batchPrices={batchPrices}
                />
              )}

              <ProductsAndLotsCard
                groupedProducts={groupedProducts}
                batchPrices={batchPrices}
                category={category}
              />
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <InfoCard movement={movement} direction={direction} />

              {movement.referenceType && (
                <ReferenceCard
                  referenceType={movement.referenceType}
                  referenceId={movement.referenceId}
                />
              )}

              {movement.notes && <NotesCard notes={movement.notes} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

/* ─── Sub-components ─── */

const LoadingState = () => (
  <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
    <div className="h-14 border-b border-[#262626] bg-[#0A0A0A]" />
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-500 border-t-blue-500" />
        <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
          Carregando movimentação...
        </span>
      </div>
    </div>
  </div>
);

const ErrorState = () => (
  <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
    <header className="sticky top-0 z-20 border-b border-[#262626] bg-[#0A0A0A]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-4">
        <Link
          href="/stock-movements"
          className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] border border-[#262626] bg-[#171717] hover:bg-[#262626] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-neutral-400" />
        </Link>
      </div>
    </header>
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-400">
      <AlertCircle className="h-12 w-12 mb-4 text-rose-500/50" />
      <h2 className="text-lg font-semibold text-neutral-200">
        Movimentação não encontrada
      </h2>
      <p className="text-sm mt-1">
        A movimentação que você procura não existe ou foi removida.
      </p>
      <Link href="/stock-movements" className="mt-6">
        <Button
          variant="outline"
          className="rounded-[4px] border-neutral-800 bg-transparent text-white hover:bg-neutral-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Movimentações
        </Button>
      </Link>
    </main>
  </div>
);

const HeaderSection = ({
  movement,
  direction,
  totalQuantity,
}: {
  movement: {
    code: string;
    type: StockMovementType;
    createdAt: string;
    items: StockMovementItem[];
  };
  direction: ReturnType<typeof getDirectionConfig>;
  totalQuantity: number;
}) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <div className="flex items-center gap-3">
        <Badge
          className={cn(
            "rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            direction.bg,
            direction.color,
            direction.border,
          )}
        >
          {direction.icon}
          {direction.label}
        </Badge>
        <span className="text-xs text-neutral-500">•</span>
        <span className="text-sm text-neutral-400">
          {ALL_TYPE_LABELS[movement.type]}
        </span>
        <span className="text-xs text-neutral-500">•</span>
        <span className="text-sm text-neutral-500">
          {format(new Date(movement.createdAt), "dd/MM/yyyy 'às' HH:mm", {
            locale: ptBR,
          })}
        </span>
      </div>
    </div>
    <div className="ml-11 md:ml-0 flex items-center gap-2 text-sm text-neutral-400">
      <Package className="h-4 w-4 text-neutral-500" />
      <span>
        {totalQuantity} un. em {movement.items.length} item(ns)
      </span>
    </div>
  </div>
);

const FinancialCard = ({
  financial,
  category,
  batchPrices,
}: {
  financial: FinancialSummary;
  category: MovementCategory;
  batchPrices: BatchPriceInfo[];
}) => {
  const hasAnyPrices = batchPrices.some(
    (b) => b.costPrice !== null || b.sellingPrice !== null,
  );
  if (!hasAnyPrices) return null;

  const isPurchase = category === "purchase";

  return (
    <div className="rounded-[4px] border border-[#262626] bg-[#171717]">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-4 w-4 text-emerald-500" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-white">
            {isPurchase ? "Resumo Financeiro da Compra" : "Resumo Financeiro"}
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricBox
            label={isPurchase ? "Total Compra" : "Custo Total"}
            value={formatCurrency(financial.totalPurchaseCost)}
            color="text-white"
          />
          <MetricBox
            label={isPurchase ? "Total Esperado Venda" : "Valor Venda"}
            value={formatCurrency(financial.totalExpectedSale)}
            color="text-white"
          />
          <MetricBox
            label="Lucro Esperado"
            value={formatCurrency(financial.totalProfit)}
            color={
              financial.totalProfit >= 0 ? "text-emerald-500" : "text-rose-500"
            }
          />
          <MetricBox
            label="Margem Média"
            value={`${financial.averageProfitMargin.toFixed(1)}%`}
            color={
              financial.averageProfitMargin >= 0
                ? "text-emerald-500"
                : "text-rose-500"
            }
          />
        </div>
      </div>
    </div>
  );
};

const MetricBox = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <div className="rounded-[4px] border border-[#262626] bg-neutral-900/50 p-3">
    <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
      {label}
    </p>
    <p className={cn("text-lg font-bold tracking-tight font-mono", color)}>
      {value}
    </p>
  </div>
);

const ProductsAndLotsCard = ({
  groupedProducts,
  batchPrices,
  category,
}: {
  groupedProducts: GroupedProduct[];
  batchPrices: BatchPriceInfo[];
  category: MovementCategory;
}) => {
  const priceMap = new Map(batchPrices.map((b) => [b.batchId, b]));
  const showPrices = category === "purchase" || category === "outflow";
  const hasAnyPrices = batchPrices.some(
    (b) => b.costPrice !== null || b.sellingPrice !== null,
  );
  const displayPrices = showPrices && hasAnyPrices;

  return (
    <div className="rounded-[4px] border border-[#262626] bg-[#171717]">
      <div className="flex items-center justify-between border-b border-[#262626] px-5 py-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-white">
            Produtos e Lotes
          </h3>
        </div>
        <Badge className="rounded-[2px] border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-300">
          {groupedProducts.length} prod.
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        {groupedProducts.map((product) => (
          <ProductGroup
            key={product.productId}
            product={product}
            priceMap={priceMap}
            displayPrices={displayPrices}
          />
        ))}
      </div>
    </div>
  );
};

const ProductGroup = ({
  product,
  priceMap,
  displayPrices,
}: {
  product: GroupedProduct;
  priceMap: Map<string, BatchPriceInfo>;
  displayPrices: boolean;
}) => (
  <div className="rounded-[4px] border border-[#262626] bg-neutral-900/30 overflow-hidden">
    {/* Product Header */}
    <div className="flex flex-col gap-3 border-b border-[#262626] bg-neutral-900/60 px-3 py-3 md:flex-row md:items-center md:justify-between md:px-4">
      <div className="flex min-w-0 items-start gap-3 md:items-center">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-neutral-800">
          {product.productImageUrl ? (
            <Image
              src={product.productImageUrl}
              alt={product.productName}
              fill
              sizes="40px"
              unoptimized
              className="object-cover"
            />
          ) : (
            <Package className="h-5 w-5 text-blue-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/products/${product.productId}`}
            className="block break-words text-sm font-bold text-white hover:underline decoration-blue-500/50 underline-offset-2 md:inline"
          >
            {product.productName}
          </Link>
          {product.productSku && (
            <p className="mt-1 break-all font-mono text-[10px] text-neutral-500 md:mt-0.5">
              SKU: {product.productSku}
            </p>
          )}
          {product.items[0]?.batchCode && (
            <p className="mt-0.5 break-all font-mono text-[10px] text-neutral-500">
              Lote: {product.items[0].batchCode}
            </p>
          )}
        </div>
      </div>
      <div className="flex w-full items-center gap-2 md:w-auto">
        <Link
          href={`/products/${product.productId}`}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[4px] border border-[#262626] bg-[#171717] px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-300 transition-colors hover:bg-[#262626] md:flex-none md:w-auto"
        >
          <Package className="h-3.5 w-3.5" />
          Ver produto
        </Link>
        {product.items[0]?.batchId && (
          <Link
            href={`/batches/${product.items[0].batchId}`}
            className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[4px] border border-[#262626] bg-[#171717] px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-300 transition-colors hover:bg-[#262626] md:flex-none md:w-auto"
          >
            <Layers className="h-3.5 w-3.5" />
            Ver lote
          </Link>
        )}
      </div>
    </div>

    {/* Batch Rows */}
    <div className="divide-y divide-[#262626]">
      {product.items.map((item) => (
        <BatchRow
          key={item.id}
          item={item}
          priceInfo={priceMap.get(item.batchId)}
          displayPrices={displayPrices}
        />
      ))}
    </div>
  </div>
);

const BatchRow = ({
  item,
  priceInfo,
  displayPrices,
}: {
  item: StockMovementItem;
  priceInfo?: BatchPriceInfo;
  displayPrices: boolean;
}) => {
  const unitCost = priceInfo?.costPrice ?? null;
  const unitSale = priceInfo?.sellingPrice ?? null;
  const totalCost = unitCost !== null ? unitCost * item.quantity : null;
  const totalSale = unitSale !== null ? unitSale * item.quantity : null;

  return (
    <div className="flex flex-col gap-3 px-3 py-3 text-sm md:flex-row md:items-center md:justify-between md:px-4 md:py-2.5">
      <span className="inline-flex w-fit items-center rounded-[4px] border border-neutral-800 bg-[#0A0A0A] px-2 py-1 text-xs text-neutral-300 md:inline md:border-0 md:bg-transparent md:p-0 md:text-neutral-400">
        {item.quantity} un.
      </span>

      {displayPrices && (
        <div className="grid w-full grid-cols-1 gap-2 text-xs md:flex md:w-auto md:items-center md:gap-4">
          {unitCost !== null && (
            <div className="flex items-center justify-between gap-2 rounded-[4px] border border-neutral-800 bg-[#0A0A0A] px-2 py-2 md:border-0 md:bg-transparent md:p-0">
              <span className="text-neutral-500">Custo:</span>
              <span className="font-mono text-neutral-300">
                {formatCurrency(totalCost)}
              </span>
            </div>
          )}
          {unitSale !== null && (
            <div className="flex items-center justify-between gap-2 rounded-[4px] border border-neutral-800 bg-[#0A0A0A] px-2 py-2 md:border-0 md:bg-transparent md:p-0">
              <span className="text-neutral-500">Venda:</span>
              <span className="font-mono text-neutral-300">
                {formatCurrency(totalSale)}
              </span>
            </div>
          )}
          {totalCost !== null && totalSale !== null && (
            <div className="flex items-center justify-between gap-2 rounded-[4px] border border-neutral-800 bg-[#0A0A0A] px-2 py-2 md:border-0 md:bg-transparent md:p-0">
              <span className="text-neutral-500">Lucro:</span>
              <span
                className={cn(
                  "font-mono font-bold",
                  totalSale - totalCost >= 0
                    ? "text-emerald-500"
                    : "text-rose-500",
                )}
              >
                {formatCurrency(totalSale - totalCost)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InfoCard = ({
  movement,
  direction,
}: {
  movement: {
    warehouseName: string;
    createdAt: string;
    updatedAt: string;
    direction: "IN" | "OUT";
  };
  direction: ReturnType<typeof getDirectionConfig>;
}) => (
  <div className="rounded-[4px] border border-[#262626] bg-[#171717] p-5 space-y-4">
    <div className="flex items-center gap-2 mb-2 text-white">
      <Warehouse className="h-4 w-4 text-neutral-500" />
      <h3 className="text-xs font-bold uppercase tracking-widest text-white">
        Informações
      </h3>
    </div>

    <div className="space-y-3">
      <div className="flex justify-between items-center pb-3 border-b border-[#262626]">
        <span className="text-xs text-neutral-500">Armazém</span>
        <span className="text-sm text-white">{movement.warehouseName}</span>
      </div>
      <div className="flex justify-between items-center pb-3 border-b border-[#262626]">
        <span className="text-xs text-neutral-500">Direção</span>
        <span
          className={cn(
            "inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
            direction.bg,
            direction.color,
            direction.border,
          )}
        >
          {direction.icon}
          {direction.label}
        </span>
      </div>
      <div className="flex justify-between items-center pb-3 border-b border-[#262626]">
        <span className="text-xs text-neutral-500">Criado em</span>
        <span className="text-xs font-mono text-neutral-300">
          {format(new Date(movement.createdAt), "dd/MM/yyyy HH:mm", {
            locale: ptBR,
          })}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-neutral-500">Atualizado em</span>
        <span className="text-xs font-mono text-neutral-300">
          {format(new Date(movement.updatedAt), "dd/MM/yyyy HH:mm", {
            locale: ptBR,
          })}
        </span>
      </div>
    </div>
  </div>
);

const ReferenceCard = ({
  referenceType,
  referenceId,
}: {
  referenceType: string;
  referenceId: string | null;
}) => {
  const isTransfer = referenceType === "TRANSFER";
  const href = isTransfer && referenceId ? `/transfers/${referenceId}` : null;

  return (
    <div className="rounded-[4px] border border-[#262626] bg-[#171717] p-5">
      <div className="flex items-center gap-2 mb-3 text-purple-500">
        <Link2 className="h-4 w-4 text-purple-500" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-white">
          Referência
        </h3>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-neutral-500">Tipo</span>
          <span className="text-xs font-medium text-white">
            {referenceType}
          </span>
        </div>
        {referenceId && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-500">ID</span>
            {href ? (
              <Link
                href={href}
                className="text-xs font-mono text-blue-500 hover:underline underline-offset-2 truncate max-w-[180px]"
              >
                {referenceId}
              </Link>
            ) : (
              <span className="text-xs font-mono text-neutral-300 truncate max-w-[180px]">
                {referenceId}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const NotesCard = ({ notes }: { notes: string }) => (
  <div className="rounded-[4px] border border-[#262626] bg-[#171717] p-5">
    <div className="flex items-center gap-2 mb-3">
      <FileText className="h-4 w-4 text-amber-500" />
      <h3 className="text-xs font-bold uppercase tracking-widest text-white">
        Observações
      </h3>
    </div>
    <p className="text-sm text-neutral-300 leading-relaxed">{notes}</p>
  </div>
);
