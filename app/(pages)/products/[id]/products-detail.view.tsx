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
  ShieldCheck,
  ShieldOff,
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

export const ProductDetailView = ({
  product,
  batches,
  isLoading,
  isLoadingBatches,
  error,
  batchesError,
}: ProductDetailViewProps) => {
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy • HH:mm", {
        locale: ptBR,
      }).toUpperCase();
    } catch {
      return dateString;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`, {
      className: "bg-[#171717] border-neutral-800 text-white rounded-[4px]",
      descriptionClassName: "text-neutral-400",
    });
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";

    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined) return "—";
    return PRODUCT_DETAIL_CURRENCY_FORMATTER.format(value);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Carregando produto..." />
      </PageContainer>
    );
  }

  if (error || !product) {
    return (
      <PageContainer>
        <ErrorState
          title="Produto não encontrado"
          description="O produto que você está procurando não existe ou foi removido do sistema."
        />
      </PageContainer>
    );
  }

  const totalStock = batches.reduce((sum, batch) => sum + batch.quantity, 0);
  const viewState: ProductDetailViewState = {
    product,
    batches,
    isLoading,
    isLoadingBatches,
    error,
    batchesError,
    totalStock,
    copyToClipboard,
    formatDate,
    formatDateTime,
    formatCurrency,
  };

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title={product.name}
        subtitle="Detalhe do produto"
        actions={
          <PermissionGate permission="products:update">
            <Link href={`/products/${product.id}/edit`}>
              <Button className="h-9 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700">
                <Pencil className="mr-2 size-3.5" />
                Editar
              </Button>
            </Link>
          </PermissionGate>
        }
      />

      <ProductHeroSection viewState={viewState} />
      <ProductAttributesPanel product={product} />
      <ProductBatchesPanel viewState={viewState} />
    </PageContainer>
  );
};

function ProductHeroSection({
  viewState,
}: {
  viewState: ProductDetailViewState;
}) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
      <ProductImagePanel viewState={viewState} />
      <ProductIdentityPanel viewState={viewState} />
    </div>
  );
}

function ProductImagePanel({
  viewState,
}: {
  viewState: ProductDetailViewState;
}) {
  const { product, totalStock } = viewState;

  return (
    <div className="lg:col-span-4">
      <div className="relative overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717]">
        <div className="absolute top-3 right-3 z-10">
          <ProductStatusBadge product={product} />
        </div>
        <ProductImageContent product={product} />
        <ProductQuickStats product={product} totalStock={totalStock} />
      </div>
    </div>
  );
}

function ProductStatusBadge({ product }: { product: Product }) {
  return (
    <Badge
      className={cn(
        "rounded-[4px] border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
        product.active
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
      )}
    >
      {product.active ? (
        <ShieldCheck className="mr-1 size-3" />
      ) : (
        <ShieldOff className="mr-1 size-3" />
      )}
      {product.active ? "Ativo" : "Inativo"}
    </Badge>
  );
}

function ProductImageContent({ product }: { product: Product }) {
  return (
    <div className="flex aspect-square w-full items-center justify-center bg-neutral-950/50 p-10">
      {product.imageUrl ? (
        <div className="relative h-full w-full">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            unoptimized
            className="object-contain"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-neutral-700">
          <Package className="mb-3 size-20 stroke-1" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
            Sem Imagem
          </span>
        </div>
      )}
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
    <div className="grid grid-cols-3 border-t border-neutral-800">
      <ProductTypeStat product={product} />
      <ProductExpirationStat product={product} />
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
        {product.isKit ? (
          <Layers className="size-3 text-purple-500" />
        ) : (
          <Box className="size-3 text-blue-500" />
        )}
        {product.isKit ? "Kit" : "Un."}
      </div>
    </div>
  );
}

function ProductExpirationStat({ product }: { product: Product }) {
  return (
    <div className="flex flex-col items-center justify-center border-r border-neutral-800 px-2 py-3">
      <span className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-neutral-600">
        Validade
      </span>
      <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-300">
        <Clock
          className={cn(
            "size-3",
            product.hasExpiration ? "text-amber-500" : "text-neutral-600"
          )}
        />
        {product.hasExpiration ? "Ctrl." : "Livre"}
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

function ProductIdentityPanel({
  viewState,
}: {
  viewState: ProductDetailViewState;
}) {
  const { product } = viewState;

  return (
    <div className="space-y-6 lg:col-span-8">
      <ProductDescriptionCard product={product} />
      <ProductCodeFields viewState={viewState} />
      <ProductMetadataPanel viewState={viewState} />
    </div>
  );
}

function ProductDescriptionCard({ product }: { product: Product }) {
  return (
    <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-6">
      <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
        Descrição
      </h2>
      <p className="text-sm leading-relaxed text-neutral-400">
        {product.description || "Nenhuma descrição fornecida para este produto."}
      </p>
    </div>
  );
}

function ProductCodeFields({
  viewState,
}: {
  viewState: ProductDetailViewState;
}) {
  const { product, copyToClipboard } = viewState;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <DataField
        icon={<Hash className="size-4" />}
        label="SKU"
        value={product.sku || "NÃO DEFINIDO"}
        mono
        onCopy={product.sku ? () => copyToClipboard(product.sku!, "SKU") : undefined}
      />
      <DataField
        icon={<Barcode className="size-4" />}
        label="Código de Barras"
        badge={product.barcodeType || undefined}
        value={product.barcode || "NÃO CADASTRADO"}
        mono
        onCopy={
          product.barcode
            ? () => copyToClipboard(product.barcode!, "Código de Barras")
            : undefined
        }
      />
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
    </div>
  );
}

function ProductMetadataPanel({
  viewState,
}: {
  viewState: ProductDetailViewState;
}) {
  const { product, copyToClipboard, formatDateTime } = viewState;

  return (
    <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
      <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
        Metadados
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ProductMetadataField
          label="Criado em"
          value={formatDateTime(product.createdAt)}
        />
        <ProductMetadataField
          label="Atualizado em"
          value={formatDateTime(product.updatedAt)}
        />
        <ProductIdField product={product} copyToClipboard={copyToClipboard} />
      </div>
    </div>
  );
}

function ProductMetadataField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
        {label}
      </span>
      <span className="font-mono text-xs text-neutral-300">{value}</span>
    </div>
  );
}

function ProductIdField({
  product,
  copyToClipboard,
}: {
  product: Product;
  copyToClipboard: (text: string, label: string) => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
        UUID
      </span>
      <button
        onClick={() => copyToClipboard(product.id, "ID do Produto")}
        className="group flex w-full max-w-full items-center gap-2 rounded-[4px] border border-neutral-800 bg-neutral-900 px-3 py-1.5 font-mono text-[11px] text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
      >
        <span className="truncate">{product.id}</span>
        <Copy className="size-3 shrink-0 opacity-0 group-hover:opacity-100" />
      </button>
    </div>
  );
}

function ProductAttributesPanel({ product }: { product: Product }) {
  const productAttributeEntries = Object.entries(product.attributes ?? {});

  if (productAttributeEntries.length === 0) return null;

  return (
    <div className="mb-8 rounded-[4px] border border-neutral-800 bg-[#171717]">
      <div className="flex items-center gap-2 border-b border-neutral-800 px-5 py-4">
        <QrCode className="size-4 text-blue-500" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-white">
          Especificações Técnicas
        </h3>
        <Badge className="ml-auto rounded-[4px] border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
          {productAttributeEntries.length}
        </Badge>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {productAttributeEntries.map(([key, value]) => (
            <ProductAttributeItem key={key} label={key} value={value} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductAttributeItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-[4px] border border-neutral-800 bg-neutral-900/30 px-4 py-3 hover:border-neutral-700">
      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <span className="ml-4 truncate text-right font-mono text-sm font-medium text-white">
        {value}
      </span>
    </div>
  );
}

function ProductBatchesPanel({
  viewState,
}: {
  viewState: ProductDetailViewState;
}) {
  const { batches } = viewState;

  return (
    <div className="rounded-[4px] border border-neutral-800 bg-[#171717]">
      <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-amber-500" />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-white">
            Lotes do Produto
          </h3>
        </div>
        <Badge className="rounded-[4px] border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
          {batches.length}
        </Badge>
      </div>
      <ProductBatchesContent viewState={viewState} />
    </div>
  );
}

function ProductBatchesContent({
  viewState,
}: {
  viewState: ProductDetailViewState;
}) {
  const { batches, batchesError, isLoadingBatches } = viewState;

  if (isLoadingBatches) {
    return (
      <div className="p-5">
        <LoadingState message="Carregando lotes..." />
      </div>
    );
  }

  if (batchesError) {
    return (
      <div className="p-5">
        <ErrorState
          title="Erro ao carregar lotes"
          description="Não foi possível carregar os lotes deste produto."
        />
      </div>
    );
  }

  if (batches.length === 0) return <ProductBatchesEmptyState />;

  return <ProductBatchesTable viewState={viewState} />;
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

function ProductBatchesTable({
  viewState,
}: {
  viewState: ProductDetailViewState;
}) {
  const { batches, totalStock } = viewState;

  return (
    <>
      <ProductBatchesTableHeader />
      <div className="divide-y divide-neutral-800/50">
        {batches.map((batch) => (
          <ProductBatchRow key={batch.id} batch={batch} viewState={viewState} />
        ))}
      </div>
      <ProductBatchesTableFooter totalStock={totalStock} />
    </>
  );
}

function ProductBatchesTableHeader() {
  return (
    <div className="hidden gap-4 border-b border-neutral-800 bg-neutral-900/30 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-neutral-600 md:grid md:grid-cols-12">
      <div className="col-span-3">Lote</div>
      <div className="col-span-3">Armazém</div>
      <div className="col-span-2 text-right">Quantidade</div>
      <div className="col-span-2 text-right">Validade</div>
      <div className="col-span-2 text-right">Preço Venda</div>
    </div>
  );
}

function ProductBatchRow({
  batch,
  viewState,
}: {
  batch: ProductBatch;
  viewState: ProductDetailViewState;
}) {
  const { formatCurrency, formatDate } = viewState;

  return (
    <Link
      href={`/batches/${batch.id}`}
      className="group flex flex-col gap-2 px-5 py-3.5 hover:bg-neutral-900/40 md:grid md:grid-cols-12 md:items-center md:gap-4"
    >
      <div className="col-span-3 min-w-0">
        <span className="font-mono text-xs font-bold text-white">
          {batch.batchNumber || batch.batchCode || "SEM LOTE"}
        </span>
      </div>
      <ProductBatchWarehouse batch={batch} />
      <ProductBatchQuantity batch={batch} />
      <ProductBatchExpiration batch={batch} formatDate={formatDate} />
      <ProductBatchPrice batch={batch} formatCurrency={formatCurrency} />
    </Link>
  );
}

function ProductBatchWarehouse({ batch }: { batch: ProductBatch }) {
  return (
    <div className="col-span-3 flex min-w-0 items-center gap-1.5">
      <Warehouse className="size-3 shrink-0 text-neutral-600" />
      <span className="truncate text-xs text-neutral-400">
        {batch.warehouseName}
      </span>
    </div>
  );
}

function ProductBatchQuantity({ batch }: { batch: ProductBatch }) {
  return (
    <div className="col-span-2 text-right">
      <span className="text-sm font-bold tabular-nums text-white">
        {batch.quantity}
      </span>
      <span className="ml-0.5 text-[10px] text-neutral-600">un</span>
    </div>
  );
}

function ProductBatchExpiration({
  batch,
  formatDate,
}: {
  batch: ProductBatch;
  formatDate: (dateString?: string | null) => string;
}) {
  return (
    <div className="col-span-2 flex items-center justify-end gap-1.5">
      <Calendar className="size-3 text-neutral-600" />
      <span className="font-mono text-xs tabular-nums text-neutral-400">
        {formatDate(batch.expirationDate)}
      </span>
    </div>
  );
}

function ProductBatchPrice({
  batch,
  formatCurrency,
}: {
  batch: ProductBatch;
  formatCurrency: (value?: number | null) => string;
}) {
  return (
    <div className="col-span-2 flex items-center justify-end gap-1">
      <span className="font-mono text-xs tabular-nums text-neutral-400">
        {formatCurrency(batch.sellingPrice)}
      </span>
      <ChevronRight className="size-3.5 text-neutral-700 group-hover:text-neutral-400" />
    </div>
  );
}

function ProductBatchesTableFooter({ totalStock }: { totalStock: number }) {
  return (
    <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-900/30 px-5 py-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
        Total em Estoque
      </span>
      <span className="text-sm font-bold tabular-nums text-white">
        {totalStock}
        <span className="ml-0.5 text-[10px] font-normal text-neutral-600">
          un
        </span>
      </span>
    </div>
  );
}

/* ─── Helper Component: DataField ─── */
function DataField({
  icon,
  label,
  badge,
  value,
  mono,
  onCopy,
}: {
  icon: ReactNode;
  label: string;
  badge?: string;
  value: string;
  mono?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="group flex items-center gap-4 rounded-[4px] border border-neutral-800 bg-[#171717] p-4 hover:border-neutral-700">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[4px] bg-neutral-800 text-neutral-400 group-hover:text-white">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            {label}
          </span>
          {badge && (
            <span className="rounded-[4px] bg-neutral-800 px-1.5 py-px text-[9px] font-bold uppercase text-neutral-500">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-bold text-white truncate",
              mono && "font-mono"
            )}
            title={value}
          >
            {value}
          </span>
          {onCopy && (
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
          )}
        </div>
      </div>
    </div>
  );
}
