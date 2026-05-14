"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  ImageIcon,
  Layers,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatItemQuantity } from "./stock-movements-detail.model";
import type {
  StockMovementItemWithImage,
  TypeBadgeView,
} from "./stock-movements-detail.types";

interface ProductThumbProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

const ProductThumb = ({ src, alt, className }: ProductThumbProps) => (
  <div
    className={cn(
      "relative shrink-0 overflow-hidden rounded-[4px] border border-neutral-800 bg-neutral-900",
      className,
    )}
  >
    {src ? (
      <Image
        src={src}
        alt={alt}
        fill
        sizes="56px"
        unoptimized
        className="object-cover"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center">
        <ImageIcon
          className="size-4 text-neutral-700"
          strokeWidth={2}
        />
      </div>
    )}
  </div>
);

interface TypeBadgeProps {
  badge: TypeBadgeView;
}

export const TypeBadge = ({ badge }: TypeBadgeProps) => {
  const Icon = badge.icon === "in" ? ArrowDownRight : ArrowUpRight;
  const directionLabel = badge.icon === "in" ? "Entrada" : "Saída";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-[4px] border px-3 py-1.5",
        badge.borderClass,
        badge.bgClass,
      )}
    >
      <Icon className={cn("size-4", badge.textClass)} strokeWidth={2.5} />
      <span
        className={cn(
          "text-[10px] font-bold uppercase tracking-widest",
          badge.textClass,
        )}
      >
        {directionLabel}
      </span>
      <span className="h-3 w-px bg-current opacity-30" />
      <span className="text-[11px] font-bold uppercase tracking-wide text-white">
        {badge.label}
      </span>
    </div>
  );
};

interface MetaCellProps {
  label: string;
  value: string;
  valueClass?: string;
  mono?: boolean;
}

export const MetaCell = ({ label, value, valueClass, mono }: MetaCellProps) => (
  <div>
    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
      {label}
    </p>
    <p
      className={cn(
        "text-sm font-bold text-white",
        mono && "font-mono",
        valueClass,
      )}
    >
      {value}
    </p>
  </div>
);

interface ItemRowProps {
  item: StockMovementItemWithImage;
}

export const ItemRowDesktop = ({ item }: ItemRowProps) => (
  <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 border-t border-neutral-800 px-4 py-3 first:border-t-0 hover:bg-neutral-900/50">
    <ProductThumb
      src={item.productImageUrl}
      alt={item.productName}
      className="size-12"
    />
    <div className="min-w-0">
      <p className="truncate text-sm font-bold text-white">{item.productName}</p>
      {item.productSku && (
        <p className="mt-0.5 text-[11px] font-mono text-neutral-500">
          SKU: {item.productSku}
        </p>
      )}
    </div>

    <div className="text-right">
      <p className="font-mono text-[11px] text-neutral-400">{item.batchCode}</p>
      <p className="text-[10px] uppercase tracking-wider text-neutral-600">
        Lote
      </p>
    </div>

    <div className="text-right tabular-nums">
      <p className="font-mono text-base font-bold text-white">
        {formatItemQuantity(item.quantity)}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-neutral-600">
        un.
      </p>
    </div>

    <div className="flex items-center gap-2">
      <Link href={`/products/${item.productId}`}>
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-[4px] border-neutral-700 bg-transparent px-2.5 text-[11px] font-bold uppercase tracking-wide text-neutral-300 hover:bg-neutral-800 hover:text-white"
        >
          <Package className="mr-1.5 size-3.5" />
          Produto
        </Button>
      </Link>
      <Link href={`/batches/${item.batchId}`}>
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-[4px] border-blue-900/40 bg-transparent px-2.5 text-[11px] font-bold uppercase tracking-wide text-blue-400 hover:border-blue-700 hover:bg-blue-950/40 hover:text-blue-300"
        >
          <Layers className="mr-1.5 size-3.5" />
          Lote
        </Button>
      </Link>
    </div>
  </div>
);

export const ItemCardMobile = ({ item }: ItemRowProps) => (
  <div className="border-t border-neutral-800 p-4 first:border-t-0">
    <div className="mb-3 flex items-start gap-3">
      <ProductThumb
        src={item.productImageUrl}
        alt={item.productName}
        className="size-14"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">{item.productName}</p>
        {item.productSku && (
          <p className="mt-0.5 text-[11px] font-mono text-neutral-500">
            SKU: {item.productSku}
          </p>
        )}
        <p className="mt-1 text-[11px] font-mono text-neutral-400">
          {item.batchCode}
        </p>
      </div>
      <div className="text-right tabular-nums shrink-0">
        <p className="font-mono text-xl font-bold text-white">
          {formatItemQuantity(item.quantity)}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-neutral-600">
          un.
        </p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <Link href={`/products/${item.productId}`} className="block">
        <Button
          variant="outline"
          className="h-9 w-full rounded-[4px] border-neutral-700 bg-transparent text-[11px] font-bold uppercase tracking-wide text-neutral-300 hover:bg-neutral-800 hover:text-white"
        >
          <Package className="mr-1.5 size-3.5" />
          Produto
          <ChevronRight className="ml-auto size-3.5" />
        </Button>
      </Link>
      <Link href={`/batches/${item.batchId}`} className="block">
        <Button
          variant="outline"
          className="h-9 w-full rounded-[4px] border-blue-900/40 bg-transparent text-[11px] font-bold uppercase tracking-wide text-blue-400 hover:border-blue-700 hover:bg-blue-950/40 hover:text-blue-300"
        >
          <Layers className="mr-1.5 size-3.5" />
          Lote
          <ChevronRight className="ml-auto size-3.5" />
        </Button>
      </Link>
    </div>
  </div>
);
