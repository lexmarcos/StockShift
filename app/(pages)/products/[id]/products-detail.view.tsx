"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Product, ProductBatch } from "./products-detail.types";
import {
  Package,
  Tag,
  Barcode,
  Calendar,
  Layers,
  Building2,
  Hash,
  Pencil,
  Clock,
  QrCode,
  Box,
  Copy,
  Warehouse,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PermissionGate } from "@/components/permission-gate";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { FixedBottomBar } from "@/components/ui/fixed-bottom-bar";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

interface ProductDetailViewProps {
  product: Product | null;
  batches: ProductBatch[];
  isLoading: boolean;
  isLoadingBatches: boolean;
  error: Error | null;
  batchesError: Error | null;
}

interface ProductDetailViewState extends ProductDetailViewProps {
  product: Product;
  totalStock: number;
  copyToClipboard: (text: string, label: string) => void;
  formatDate: (dateString?: string | null) => string;
  formatDateTime: (dateString: string) => string;
  formatCurrency: (value?: number | null) => string;
}

const PRODUCT_DETAIL_CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatProductDateTime(dateString: string): string {
  try {
    return format(new Date(dateString), "dd MMM yyyy • HH:mm", {
      locale: ptBR,
    }).toUpperCase();
  } catch {
    return dateString;
  }
}

function copyProductText(text: string, label: string): void {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copiado`, {
    className: "bg-[#171717] border-neutral-800 text-white rounded-[4px]",
    descriptionClassName: "text-neutral-400",
  });
}

function formatProductDate(dateString?: string | null): string {
  if (!dateString) return "—";
  try {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return dateString;
  }
}

function formatProductCurrency(value?: number | null): string {
  if (value === null || value === undefined) return "—";
  return PRODUCT_DETAIL_CURRENCY_FORMATTER.format(value / 100);
}

export const ProductDetailView = (props: ProductDetailViewProps) => {
  if (props.isLoading) {
    return <PageContainer><LoadingState message="Carregando produto..." /></PageContainer>;
  }

  if (props.error || !props.product) {
    return <ProductDetailErrorState />;
  }

  const totalStock = props.batches.reduce((s, b) => s + b.quantity, 0);
  const viewState: ProductDetailViewState = {
    ...props,
    product: props.product,
    totalStock,
    copyToClipboard: copyProductText,
    formatDate: formatProductDate,
    formatDateTime: formatProductDateTime,
    formatCurrency: formatProductCurrency,
  };

  return <ProductDetailContent viewState={viewState} />;
};

function ProductDetailErrorState() {
  return (
    <PageContainer>
      <ErrorState
        title="Produto não encontrado"
        description="O produto procurado não existe ou foi removido."
      />
    </PageContainer>
  );
}

function ProductDetailContent({ viewState }: { viewState: ProductDetailViewState }) {
  const { product } = viewState;
  return (
    <PageContainer bottomPadding="fixed-bar">
      <PageHeader
        title={product.name}
        subtitle="Detalhe do produto"
        actions={<ProductHeaderActions product={product} />}
      />
      <div className="flex flex-col gap-4 md:gap-6 mb-6">
        <ProductHeroSection viewState={viewState} />
        <ProductPanelsSection viewState={viewState} />
      </div>
      <ProductBatchesPanel viewState={viewState} />
      <ProductMobileBottomBar product={product} />
    </PageContainer>
  );
}

function ProductHeaderActions({ product }: { product: Product }) {
  return (
    <div className="hidden md:block">
      <PermissionGate permission="products:update">
        <Link href={`/products/${product.id}/edit`}>
          <Button className="h-9 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700">
            <Pencil className="mr-2 size-3.5" />
            Editar
          </Button>
        </Link>
      </PermissionGate>
    </div>
  );
}

function ProductMobileBottomBar({ product }: { product: Product }) {
  return (
    <FixedBottomBar className="md:hidden">
      <PermissionGate permission="products:update">
        <Link href={`/products/${product.id}/edit`} className="block w-full">
          <Button className="w-full h-11 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700">
            <Pencil className="mr-2 size-4" />
            Editar Produto
          </Button>
        </Link>
      </PermissionGate>
    </FixedBottomBar>
  );
}

function ProductHeroSection({ viewState }: { viewState: ProductDetailViewState }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
      <ProductImagePanel viewState={viewState} />
      <ProductOverviewPanel viewState={viewState} />
    </div>
  );
}

function ProductImagePanel({ viewState }: { viewState: ProductDetailViewState }) {
  const { product, totalStock } = viewState;
  return (
    <div className="md:col-span-5 lg:col-span-4">
      <div className="relative overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717]">
        <ProductImageContent product={product} />
        <ProductQuickStats product={product} totalStock={totalStock} />
      </div>
    </div>
  );
}

function ProductImageContent({ product }: { product: Product }) {
  return (
    <div className="flex aspect-[3/4] w-full items-center justify-center bg-neutral-950/50 p-4 md:p-5">
      {product.imageUrl ? (
        <div className="relative h-full w-full rounded-[10px] overflow-hidden border border-neutral-800/60">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            unoptimized
            className="object-cover rounded-[10px]"
          />
        </div>
      ) : (
        <ProductNoImagePlaceholder />
      )}
    </div>
  );
}

function ProductNoImagePlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center text-neutral-700">
      <Package className="mb-3 size-16 stroke-1" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
        Sem Imagem
      </span>
    </div>
  );
}

function ProductQuickStats({
  product,
  totalStock,
}: {
  product: Product;
  totalStock: number;
}) {
  return (
    <div className="grid grid-cols-2 border-t border-neutral-800">
      <ProductTypeStat product={product} />
      <ProductStockStat totalStock={totalStock} />
    </div>
  );
}

function ProductTypeStat({ product }: { product: Product }) {
  return (
    <div className="flex flex-col items-center justify-center border-r border-neutral-800 px-2 py-3">
      <span className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-neutral-600">
        Tipo
      </span>
      <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-300">
        {product.isKit ? <Layers className="size-3 text-purple-500" /> : <Box className="size-3 text-blue-500" />}
        {product.isKit ? "Kit" : "Un."}
      </div>
    </div>
  );
}

function ProductStockStat({ totalStock }: { totalStock: number }) {
  return (
    <div className="flex flex-col items-center justify-center px-2 py-3">
      <span className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-neutral-600">
        Estoque
      </span>
      <span className="text-[11px] font-bold tabular-nums text-white">
        {totalStock}
      </span>
    </div>
  );
}

function ProductOverviewPanel({ viewState }: { viewState: ProductDetailViewState }) {
  return (
    <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-3 min-w-0">
      <ProductDescriptionCard product={viewState.product} />
      <ProductCodeFields viewState={viewState} />
    </div>
  );
}

function ProductDescriptionCard({ product }: { product: Product }) {
  return (
    <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-4 md:p-5 flex-1">
      <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        Descrição
      </h2>
      <p className="text-xs md:text-sm leading-relaxed text-neutral-400">
        {product.description || "Nenhuma descrição fornecida para este produto."}
      </p>
    </div>
  );
}

function ProductCodeFields({ viewState }: { viewState: ProductDetailViewState }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <ProductSkuField viewState={viewState} />
      <ProductBarcodeField viewState={viewState} />
      <ProductCategoryBrandFields product={viewState.product} />
    </div>
  );
}

function ProductSkuField({ viewState }: { viewState: ProductDetailViewState }) {
  const { product, copyToClipboard } = viewState;
  const sku = product.sku;
  return (
    <DataField
      icon={<Hash className="size-4" />}
      label="SKU"
      value={sku || "NÃO DEFINIDO"}
      mono
      onCopy={sku ? () => copyToClipboard(sku, "SKU") : undefined}
    />
  );
}

function ProductBarcodeField({ viewState }: { viewState: ProductDetailViewState }) {
  const { product, copyToClipboard } = viewState;
  const barcode = product.barcode;
  return (
    <DataField
      icon={<Barcode className="size-4" />}
      label="Código de Barras"
      badge={product.barcodeType || undefined}
      value={barcode || "NÃO CADASTRADO"}
      mono
      onCopy={barcode ? () => copyToClipboard(barcode, "Código") : undefined}
    />
  );
}

function ProductCategoryBrandFields({ product }: { product: Product }) {
  return (
    <>
      <DataField
        icon={<Tag className="size-4 text-emerald-500" />}
        label="Categoria"
        value={product.categoryName || "Sem Categoria"}
      />
      <DataField
        icon={<Building2 className="size-4 text-amber-500" />}
        label="Marca / Fabricante"
        value={product.brand?.name || "Genérico"}
      />
    </>
  );
}

function ProductPanelsSection({ viewState }: { viewState: ProductDetailViewState }) {
  const hasAttributes = Object.keys(viewState.product.attributes ?? {}).length > 0;
  return (
    <div className={cn("grid grid-cols-1 gap-4", hasAttributes ? "lg:grid-cols-2" : "")}>
      <ProductMetadataPanel viewState={viewState} />
      <ProductAttributesPanel product={viewState.product} />
    </div>
  );
}

function ProductMetadataPanel({ viewState }: { viewState: ProductDetailViewState }) {
  const { product, copyToClipboard, formatDateTime } = viewState;
  return (
    <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-4 md:p-5 self-start w-full">
      <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        Metadados
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ProductMetadataField label="Criado em" value={formatDateTime(product.createdAt)} />
        <ProductMetadataField label="Atualizado em" value={formatDateTime(product.updatedAt)} />
        <ProductIdField product={product} copyToClipboard={copyToClipboard} />
      </div>
    </div>
  );
}

function ProductMetadataField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
        {label}
      </span>
      <span className="font-mono text-[11px] text-neutral-300 block truncate">{value}</span>
    </div>
  );
}

function ProductIdField(props: {
  product: Product;
  copyToClipboard: (text: string, label: string) => void;
}) {
  return (
    <div>
      <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
        UUID
      </span>
      <button
        onClick={() => props.copyToClipboard(props.product.id, "ID do Produto")}
        className="group flex w-full items-center gap-1.5 rounded-[4px] border border-neutral-800 bg-neutral-900 px-2 py-1 font-mono text-[10px] text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
      >
        <span className="truncate">{props.product.id}</span>
        <Copy className="size-2.5 shrink-0 opacity-0 group-hover:opacity-100" />
      </button>
    </div>
  );
}

function ProductAttributesPanel({ product }: { product: Product }) {
  const entries = Object.entries(product.attributes ?? {});
  if (entries.length === 0) return null;

  return (
    <div className="rounded-[4px] border border-neutral-800 bg-[#171717] self-start w-full">
      <ProductAttributesHeader count={entries.length} />
      <div className="p-4 md:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {entries.map(([key, value]) => (
            <ProductAttributeItem key={key} label={key} value={value} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductAttributesHeader({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-3">
      <QrCode className="size-3.5 text-blue-500" />
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-white truncate">
        Especificações Técnicas
      </h3>
      <Badge className="ml-auto rounded-[4px] border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
        {count}
      </Badge>
    </div>
  );
}

function ProductAttributeItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[4px] border border-neutral-800 bg-neutral-900/30 px-3 py-2 hover:border-neutral-700 gap-2">
      <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 truncate">
        {label}
      </span>
      <span className="truncate text-right font-mono text-xs font-medium text-white">
        {value}
      </span>
    </div>
  );
}

/* ─── Unchanged Component: ProductBatchesPanel ─── */
function ProductBatchesPanel({
  viewState,
}: {
  viewState: ProductDetailViewState;
}) {
  return (
    <div className="rounded-[4px] border border-neutral-800 bg-[#171717]">
      <ProductBatchesHeader count={viewState.batches.length} />
      <ProductBatchesContent viewState={viewState} />
    </div>
  );
}

function ProductBatchesHeader({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
      <div className="flex items-center gap-2.5">
        <Layers className="size-4 text-amber-500" strokeWidth={2.5} />
        <h3 className="text-xs font-bold uppercase tracking-widest text-white">
          Lotes do Produto
        </h3>
      </div>
      <Badge className="rounded-[4px] border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs font-bold text-amber-500">
        {count} {count === 1 ? "Lote" : "Lotes"}
      </Badge>
    </div>
  );
}

function ProductBatchesContent({
  viewState,
}: {
  viewState: ProductDetailViewState;
}) {
  if (viewState.isLoadingBatches) {
    return <ProductBatchesLoadingState />;
  }

  if (viewState.batchesError) {
    return <ProductBatchesErrorState />;
  }

  if (viewState.batches.length === 0) {
    return <ProductBatchesEmptyState />;
  }

  return <ProductBatchesList viewState={viewState} />;
}

function ProductBatchesLoadingState() {
  return (
    <div className="p-5">
      <LoadingState message="Carregando lotes..." />
    </div>
  );
}

function ProductBatchesErrorState() {
  return (
    <div className="p-5">
      <ErrorState
        title="Erro ao carregar lotes"
        description="Não foi possível carregar os lotes."
      />
    </div>
  );
}

function ProductBatchesEmptyState() {
  return (
    <div className="px-5 py-10 text-center">
      <Package className="mx-auto mb-3 size-10 text-neutral-800" strokeWidth={1.5} />
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
        Nenhum lote cadastrado
      </p>
    </div>
  );
}

function ProductBatchesList({
  viewState,
}: {
  viewState: ProductDetailViewState;
}) {
  const { batches, totalStock } = viewState;

  return (
    <>
      <div className="divide-y divide-neutral-800">
        {batches.map((batch) => (
          <ProductBatchRow key={batch.id} batch={batch} viewState={viewState} />
        ))}
      </div>
      <ProductBatchesFooter totalStock={totalStock} />
    </>
  );
}

function ProductBatchRow({
  batch,
  viewState,
}: {
  batch: ProductBatch;
  viewState: ProductDetailViewState;
}) {
  return (
    <Link
      href={`/batches/${batch.id}`}
      className="group flex items-center justify-between px-5 py-4 hover:bg-neutral-900/40 transition-none gap-4"
    >
      <ProductBatchLeft batch={batch} />
      <ProductBatchMiddle batch={batch} viewState={viewState} />
      <ProductBatchRight batch={batch} />
    </Link>
  );
}

function ProductBatchLeft({ batch }: { batch: ProductBatch }) {
  return (
    <div className="flex flex-col items-center justify-center w-14 shrink-0">
      <div className="flex size-10 items-center justify-center rounded-[4px] border border-neutral-800 bg-neutral-900/20 text-neutral-500 group-hover:border-neutral-700 group-hover:text-neutral-300">
        <Warehouse className="size-4" strokeWidth={1.5} />
      </div>
      <span className="mt-1.5 truncate max-w-full text-[11px] font-medium text-neutral-400">
        {batch.warehouseName}
      </span>
    </div>
  );
}

function ProductBatchMiddle({
  batch,
  viewState,
}: {
  batch: ProductBatch;
  viewState: ProductDetailViewState;
}) {
  const code = batch.batchNumber || batch.batchCode || "SEM LOTE";
  const dateStr = viewState.formatDate(batch.expirationDate);
  const priceStr = viewState.formatCurrency(batch.sellingPrice);

  return (
    <div className="flex-1 min-w-0 flex flex-col justify-center">
      <span className="text-xs font-bold text-white truncate block">
        {code}
      </span>
      <ProductBatchDetails date={dateStr} price={priceStr} />
    </div>
  );
}

function ProductBatchDetails({
  date,
  price,
}: {
  date: string;
  price: string;
}) {
  return (
    <div className="mt-1.5 flex items-center gap-2 text-xs text-neutral-400">
      <div className="flex items-center gap-1.5 shrink-0">
        <Calendar className="size-3.5 text-neutral-500" />
        <span>{date}</span>
      </div>
      <span className="text-amber-500 font-bold shrink-0">•</span>
      <span className="truncate">{price}</span>
    </div>
  );
}

function ProductBatchRight({ batch }: { batch: ProductBatch }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div className="text-right">
        <span className="text-sm font-bold text-white">{batch.quantity}</span>
        <span className="ml-1 text-xs text-neutral-500">un</span>
      </div>
      <ChevronRight className="size-4 text-neutral-600 group-hover:text-neutral-400" />
    </div>
  );
}

function ProductBatchesFooter({ totalStock }: { totalStock: number }) {
  return (
    <div className="flex items-center justify-between border-t border-neutral-800 px-5 py-4">
      <div className="flex items-center gap-2.5">
        <Box className="size-4 text-amber-500" strokeWidth={2.5} />
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
          Total em Estoque
        </span>
      </div>
      <div>
        <span className="text-base font-bold text-white">{totalStock}</span>
        <span className="ml-1 text-xs text-neutral-500">un</span>
      </div>
    </div>
  );
}

/* ─── Helper Component: DataField ─── */
function DataField(props: {
  icon: ReactNode;
  label: string;
  badge?: string;
  value: string;
  mono?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-[4px] border border-neutral-800 bg-[#171717] p-3.5 hover:border-neutral-700">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-[4px] bg-neutral-800 text-neutral-400 group-hover:text-white">
        {props.icon}
      </div>
      <DataFieldContent {...props} />
    </div>
  );
}

function DataFieldContent(props: {
  label: string;
  badge?: string;
  value: string;
  mono?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="min-w-0 flex-1">
      <DataFieldHeader label={props.label} badge={props.badge} />
      <DataFieldValue {...props} />
    </div>
  );
}

function DataFieldHeader({ label, badge }: { label: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 mb-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 truncate">
        {label}
      </span>
      {badge && (
        <span className="rounded-[4px] bg-neutral-800 px-1.5 py-px text-[9px] font-bold uppercase text-neutral-500 shrink-0">
          {badge}
        </span>
      )}
    </div>
  );
}

function DataFieldValue(props: { value: string; mono?: boolean; onCopy?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn("text-xs font-bold text-white truncate", props.mono && "font-mono")}
        title={props.value}
      >
        {props.value}
      </span>
      {props.onCopy && <DataFieldCopyBtn onCopy={props.onCopy} label={props.value} />}
    </div>
  );
}

function DataFieldCopyBtn({ onCopy, label }: { onCopy: () => void; label: string }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        onCopy();
      }}
      className="shrink-0 text-neutral-700 hover:text-neutral-300"
      aria-label={`Copiar ${label}`}
    >
      <Copy className="size-3" />
    </button>
  );
}
