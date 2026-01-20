# Stock Movements Mobile Wizard - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Criar um wizard mobile-first para criação de movimentações de estoque, otimizado para operações de transferência em almoxarifado.

**Architecture:** Wizard em 3 fases (Setup → Adição Contínua → Revisão) com componentes modulares. Reutiliza Drawer do shadcn para bottom sheets, BarcodeScannerModal existente para scanner. Estado gerenciado via React hooks no model.

**Tech Stack:** Next.js 15, React Hook Form, Zod, SWR, shadcn/ui (Drawer, Button, Input), Lucide icons, Tailwind CSS.

---

## Task 1: Types e Schema do Mobile Wizard

**Files:**
- Modify: `app/(pages)/stock-movements/create/stock-movements-create.types.ts`

**Step 1: Adicionar types do wizard mobile**

```typescript
// Adicionar ao final do arquivo existente

export type WizardPhase = 'setup' | 'addition' | 'review' | 'success';

export interface MobileWizardItem {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  batchId: string;
  batchCode: string;
  quantity: number;
  maxQuantity: number;
}

export interface WarehouseOption {
  id: string;
  name: string;
  productCount?: number;
}

export interface BatchOption {
  id: string;
  batchCode: string;
  quantity: number;
  expirationDate?: string;
}

export interface ProductSearchResult {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
}
```

**Step 2: Run TypeScript check**

Run: `pnpm tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/(pages)/stock-movements/create/stock-movements-create.types.ts && git commit -m "feat(stock-movements): add mobile wizard types"
```

---

## Task 2: Componente QuantityStepper

**Files:**
- Create: `app/(pages)/stock-movements/create/_components/quantity-stepper.tsx`

**Step 1: Criar componente stepper**

```tsx
"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
}

export const QuantityStepper = ({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
}: QuantityStepperProps) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      onChange(Math.min(Math.max(newValue, min), max));
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className="h-14 w-14 rounded-[4px] border-neutral-800 bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-30"
        >
          <Minus className="h-5 w-5" />
        </Button>

        <Input
          type="number"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          className={cn(
            "h-14 w-24 rounded-[4px] border-neutral-800 bg-neutral-900 text-center text-2xl font-mono font-bold text-white",
            "focus:border-blue-600 focus:ring-0",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          )}
          min={min}
          max={max}
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className="h-14 w-14 rounded-[4px] border-neutral-800 bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-30"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <span className="text-xs text-neutral-500">
        Máx: {max}
      </span>
    </div>
  );
};
```

**Step 2: Verify file was created**

Run: `ls -la app/(pages)/stock-movements/create/_components/quantity-stepper.tsx`
Expected: File exists

**Step 3: Commit**

```bash
git add app/(pages)/stock-movements/create/_components/quantity-stepper.tsx && git commit -m "feat(stock-movements): add QuantityStepper component"
```

---

## Task 3: Componente MobileWizardHeader

**Files:**
- Create: `app/(pages)/stock-movements/create/_components/mobile-wizard-header.tsx`

**Step 1: Criar componente header**

```tsx
"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileWizardHeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
}

export const MobileWizardHeader = ({
  title,
  onBack,
  showBack = true,
}: MobileWizardHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-[#0A0A0A]">
      <div className="flex h-14 items-center gap-3 px-4">
        {showBack && onBack && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10 rounded-[4px] text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-sm font-bold uppercase tracking-wide text-white">
          {title}
        </h1>
      </div>
    </header>
  );
};
```

**Step 2: Commit**

```bash
git add app/(pages)/stock-movements/create/_components/mobile-wizard-header.tsx && git commit -m "feat(stock-movements): add MobileWizardHeader component"
```

---

## Task 4: Componente WarehouseContextBar

**Files:**
- Create: `app/(pages)/stock-movements/create/_components/warehouse-context-bar.tsx`

**Step 1: Criar componente de contexto**

```tsx
"use client";

import { ArrowRight } from "lucide-react";

interface WarehouseContextBarProps {
  sourceWarehouse: string;
  destinationWarehouse: string;
}

export const WarehouseContextBar = ({
  sourceWarehouse,
  destinationWarehouse,
}: WarehouseContextBarProps) => {
  return (
    <div className="border-b border-neutral-800 bg-neutral-900 px-4 py-2.5">
      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="font-medium text-white truncate max-w-[120px]">
          {sourceWarehouse}
        </span>
        <ArrowRight className="h-4 w-4 text-neutral-500 flex-shrink-0" />
        <span className="font-medium text-white truncate max-w-[120px]">
          {destinationWarehouse}
        </span>
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add app/(pages)/stock-movements/create/_components/warehouse-context-bar.tsx && git commit -m "feat(stock-movements): add WarehouseContextBar component"
```

---

## Task 5: Componente MobileFooterActions

**Files:**
- Create: `app/(pages)/stock-movements/create/_components/mobile-footer-actions.tsx`

**Step 1: Criar componente footer**

```tsx
"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FooterAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "blue" | "emerald" | "neutral";
  icon?: LucideIcon;
}

interface MobileFooterActionsProps {
  primaryAction: FooterAction;
  secondaryAction?: FooterAction;
  progress?: {
    value: number;
    max: number;
    label: string;
  };
}

export const MobileFooterActions = ({
  primaryAction,
  secondaryAction,
  progress,
}: MobileFooterActionsProps) => {
  const getButtonClasses = (variant: FooterAction["variant"] = "blue") => {
    const variants = {
      blue: "bg-blue-600 hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]",
      emerald: "bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_20px_-5px_rgba(5,150,105,0.3)]",
      neutral: "bg-neutral-800 hover:bg-neutral-700",
    };
    return variants[variant];
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur-sm md:ml-[var(--sidebar-width)]">
      {progress && (
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="h-1 flex-1 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(progress.value / progress.max) * 100}%` }}
              />
            </div>
            <span className="ml-3 text-xs font-medium text-neutral-400">
              {progress.label}
            </span>
          </div>
        </div>
      )}

      <div className={cn(
        "flex gap-3 p-4",
        secondaryAction ? "grid grid-cols-2" : ""
      )}>
        {secondaryAction && (
          <Button
            type="button"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
            className={cn(
              "h-14 rounded-[4px] text-xs font-bold uppercase tracking-wide text-white",
              getButtonClasses(secondaryAction.variant || "neutral")
            )}
          >
            {secondaryAction.icon && (
              <secondaryAction.icon className="mr-2 h-4 w-4" />
            )}
            {secondaryAction.label}
          </Button>
        )}

        <Button
          type="button"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          className={cn(
            "h-14 rounded-[4px] text-xs font-bold uppercase tracking-wide text-white",
            getButtonClasses(primaryAction.variant),
            !secondaryAction && "w-full"
          )}
        >
          {primaryAction.icon && (
            <primaryAction.icon className="mr-2 h-4 w-4" />
          )}
          {primaryAction.label}
        </Button>
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add app/(pages)/stock-movements/create/_components/mobile-footer-actions.tsx && git commit -m "feat(stock-movements): add MobileFooterActions component"
```

---

## Task 6: Componente ItemCard

**Files:**
- Create: `app/(pages)/stock-movements/create/_components/item-card.tsx`

**Step 1: Criar componente de card de item**

```tsx
"use client";

import { X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MobileWizardItem } from "../stock-movements-create.types";

interface ItemCardProps {
  item: MobileWizardItem;
  onEdit: () => void;
  onRemove: () => void;
}

export const ItemCard = ({ item, onEdit, onRemove }: ItemCardProps) => {
  return (
    <div className="relative rounded-[4px] border border-neutral-800 bg-neutral-900 overflow-hidden">
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />

      <div className="py-3 pl-4 pr-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {item.productName}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Lote: {item.batchCode}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-blue-500">
                QTD: {item.quantity}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="h-6 w-6 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-blue-500"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 rounded-[4px] text-neutral-600 hover:bg-rose-950/20 hover:text-rose-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add app/(pages)/stock-movements/create/_components/item-card.tsx && git commit -m "feat(stock-movements): add ItemCard component"
```

---

## Task 7: Componente WarehouseBottomSheet

**Files:**
- Create: `app/(pages)/stock-movements/create/_components/warehouse-bottom-sheet.tsx`

**Step 1: Criar bottom sheet de seleção de armazém**

```tsx
"use client";

import { useState } from "react";
import { Search, Check } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { WarehouseOption } from "../stock-movements-create.types";

interface WarehouseBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  warehouses: WarehouseOption[];
  selectedId?: string | null;
  onSelect: (warehouse: WarehouseOption) => void;
  disabledId?: string | null;
}

export const WarehouseBottomSheet = ({
  open,
  onOpenChange,
  title,
  warehouses,
  selectedId,
  onSelect,
  disabledId,
}: WarehouseBottomSheetProps) => {
  const [search, setSearch] = useState("");

  const filteredWarehouses = warehouses.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (warehouse: WarehouseOption) => {
    if (warehouse.id === disabledId) return;
    onSelect(warehouse);
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-neutral-800 bg-[#171717] max-h-[70vh]">
        <DrawerHeader className="border-b border-neutral-800 pb-4">
          <DrawerTitle className="text-sm font-bold uppercase tracking-wide text-white">
            {title}
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              placeholder="Buscar armazém..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 pl-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-2">
            {filteredWarehouses.map((warehouse) => {
              const isSelected = warehouse.id === selectedId;
              const isDisabled = warehouse.id === disabledId;

              return (
                <button
                  key={warehouse.id}
                  type="button"
                  onClick={() => handleSelect(warehouse)}
                  disabled={isDisabled}
                  className={cn(
                    "w-full flex items-center justify-between rounded-[4px] border p-4 text-left transition-colors",
                    isSelected
                      ? "border-blue-600 bg-blue-500/5"
                      : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {warehouse.name}
                    </p>
                    {warehouse.productCount !== undefined && (
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {warehouse.productCount} produtos em estoque
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}

            {filteredWarehouses.length === 0 && (
              <p className="text-center text-sm text-neutral-500 py-8">
                Nenhum armazém encontrado
              </p>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
```

**Step 2: Commit**

```bash
git add app/(pages)/stock-movements/create/_components/warehouse-bottom-sheet.tsx && git commit -m "feat(stock-movements): add WarehouseBottomSheet component"
```

---

## Task 8: Componente SetupPhase

**Files:**
- Create: `app/(pages)/stock-movements/create/_components/setup-phase.tsx`

**Step 1: Criar fase de setup**

```tsx
"use client";

import { useState } from "react";
import { Package, Warehouse, ChevronDown, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { WarehouseBottomSheet } from "./warehouse-bottom-sheet";
import type { WarehouseOption } from "../stock-movements-create.types";

interface SetupPhaseProps {
  warehouses: WarehouseOption[];
  sourceWarehouseId: string | null;
  destinationWarehouseId: string | null;
  onSourceChange: (warehouse: WarehouseOption) => void;
  onDestinationChange: (warehouse: WarehouseOption) => void;
}

export const SetupPhase = ({
  warehouses,
  sourceWarehouseId,
  destinationWarehouseId,
  onSourceChange,
  onDestinationChange,
}: SetupPhaseProps) => {
  const [sourceSheetOpen, setSourceSheetOpen] = useState(false);
  const [destinationSheetOpen, setDestinationSheetOpen] = useState(false);

  const sourceWarehouse = warehouses.find((w) => w.id === sourceWarehouseId);
  const destinationWarehouse = warehouses.find((w) => w.id === destinationWarehouseId);

  return (
    <div className="flex-1 px-4 py-6">
      <div className="space-y-4">
        {/* Source Card */}
        <button
          type="button"
          onClick={() => setSourceSheetOpen(true)}
          className={cn(
            "w-full rounded-[4px] border-2 p-4 text-left transition-colors",
            sourceWarehouseId
              ? "border-blue-600 bg-blue-500/5"
              : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-[4px]",
              sourceWarehouseId ? "bg-blue-500/10" : "bg-neutral-800"
            )}>
              <Package className={cn(
                "h-6 w-6",
                sourceWarehouseId ? "text-blue-500" : "text-neutral-500"
              )} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Origem
              </p>
              <p className={cn(
                "text-sm font-medium mt-0.5",
                sourceWarehouseId ? "text-white" : "text-neutral-500"
              )}>
                {sourceWarehouse?.name || "Selecione o armazém..."}
              </p>
            </div>
            <ChevronDown className="h-5 w-5 text-neutral-500" />
          </div>
        </button>

        {/* Arrow connector */}
        <div className="flex justify-center">
          <ArrowDown className="h-6 w-6 text-neutral-600" />
        </div>

        {/* Destination Card */}
        <button
          type="button"
          onClick={() => setDestinationSheetOpen(true)}
          disabled={!sourceWarehouseId}
          className={cn(
            "w-full rounded-[4px] border-2 p-4 text-left transition-colors",
            destinationWarehouseId
              ? "border-blue-600 bg-blue-500/5"
              : "border-neutral-800 bg-neutral-900",
            sourceWarehouseId
              ? "hover:bg-neutral-800"
              : "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-[4px]",
              destinationWarehouseId ? "bg-blue-500/10" : "bg-neutral-800"
            )}>
              <Warehouse className={cn(
                "h-6 w-6",
                destinationWarehouseId ? "text-blue-500" : "text-neutral-500"
              )} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Destino
              </p>
              <p className={cn(
                "text-sm font-medium mt-0.5",
                destinationWarehouseId ? "text-white" : "text-neutral-500"
              )}>
                {destinationWarehouse?.name || "Selecione o armazém..."}
              </p>
            </div>
            <ChevronDown className="h-5 w-5 text-neutral-500" />
          </div>
        </button>
      </div>

      {/* Bottom Sheets */}
      <WarehouseBottomSheet
        open={sourceSheetOpen}
        onOpenChange={setSourceSheetOpen}
        title="Selecionar Origem"
        warehouses={warehouses}
        selectedId={sourceWarehouseId}
        onSelect={onSourceChange}
      />

      <WarehouseBottomSheet
        open={destinationSheetOpen}
        onOpenChange={setDestinationSheetOpen}
        title="Selecionar Destino"
        warehouses={warehouses}
        selectedId={destinationWarehouseId}
        onSelect={onDestinationChange}
        disabledId={sourceWarehouseId}
      />
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add app/(pages)/stock-movements/create/_components/setup-phase.tsx && git commit -m "feat(stock-movements): add SetupPhase component"
```

---

## Task 9: Componente AddItemSheet

**Files:**
- Create: `app/(pages)/stock-movements/create/_components/add-item-sheet.tsx`

**Step 1: Criar sheet de adicionar item**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Package, Check, AlertCircle } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "./quantity-stepper";
import { cn } from "@/lib/utils";
import type { ProductSearchResult, BatchOption } from "../stock-movements-create.types";

interface AddItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductSearchResult | null;
  batches: BatchOption[];
  isLoadingBatches: boolean;
  onAddItem: (batchId: string, quantity: number) => void;
  onAddAndFinish: (batchId: string, quantity: number) => void;
}

export const AddItemSheet = ({
  open,
  onOpenChange,
  product,
  batches,
  isLoadingBatches,
  onAddItem,
  onAddAndFinish,
}: AddItemSheetProps) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const maxQuantity = selectedBatch?.quantity || 1;
  const canAdd = selectedBatchId && quantity > 0 && quantity <= maxQuantity;

  // Reset state when sheet opens/closes or product changes
  useEffect(() => {
    if (open) {
      setSelectedBatchId(null);
      setQuantity(1);
    }
  }, [open, product?.id]);

  // Auto-select first batch if only one available
  useEffect(() => {
    if (batches.length === 1 && !selectedBatchId) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  // Adjust quantity when batch changes
  useEffect(() => {
    if (selectedBatch && quantity > selectedBatch.quantity) {
      setQuantity(selectedBatch.quantity);
    }
  }, [selectedBatch, quantity]);

  const handleAddAndNext = () => {
    if (canAdd && selectedBatchId) {
      onAddItem(selectedBatchId, quantity);
    }
  };

  const handleAddAndFinish = () => {
    if (canAdd && selectedBatchId) {
      onAddAndFinish(selectedBatchId, quantity);
    }
  };

  const formatExpirationDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-neutral-800 bg-[#171717] max-h-[85vh]">
        <DrawerHeader className="border-b border-neutral-800 pb-4">
          <DrawerTitle className="text-sm font-bold uppercase tracking-wide text-white">
            Adicionar Item
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Product Info */}
          {product && (
            <div className="flex items-center gap-4 rounded-[4px] border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[4px] bg-neutral-800">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{product.name}</p>
                {product.sku && (
                  <p className="text-xs text-neutral-500 mt-0.5">
                    SKU: {product.sku}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Batch Selection */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-3">
              Selecionar Lote
            </p>

            {isLoadingBatches ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-blue-500" />
              </div>
            ) : batches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-neutral-600 mb-2" />
                <p className="text-sm text-neutral-500">
                  Nenhum lote disponível
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {batches.map((batch) => {
                  const isSelected = batch.id === selectedBatchId;
                  const hasStock = batch.quantity > 0;

                  return (
                    <button
                      key={batch.id}
                      type="button"
                      onClick={() => hasStock && setSelectedBatchId(batch.id)}
                      disabled={!hasStock}
                      className={cn(
                        "w-full flex items-center justify-between rounded-[4px] border p-4 text-left transition-colors",
                        isSelected
                          ? "border-blue-600 bg-blue-500/5"
                          : "border-neutral-800 bg-neutral-900",
                        hasStock ? "hover:bg-neutral-800" : "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border-2",
                          isSelected
                            ? "border-blue-500 bg-blue-500"
                            : "border-neutral-600"
                        )}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {batch.batchCode}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-neutral-400">
                              Disp: {batch.quantity}
                            </span>
                            {batch.expirationDate && (
                              <>
                                <span className="text-neutral-600">•</span>
                                <span className="text-xs text-neutral-400">
                                  Val: {formatExpirationDate(batch.expirationDate)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quantity */}
          {selectedBatchId && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-4 text-center">
                Quantidade
              </p>
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                max={maxQuantity}
              />
            </div>
          )}
        </div>

        <DrawerFooter className="border-t border-neutral-800 pt-4">
          <Button
            type="button"
            onClick={handleAddAndNext}
            disabled={!canAdd}
            className="h-14 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Adicionar e Próximo
          </Button>
          <button
            type="button"
            onClick={handleAddAndFinish}
            disabled={!canAdd}
            className="text-sm text-neutral-400 hover:text-white disabled:opacity-50 py-2"
          >
            Adicionar e finalizar
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
```

**Step 2: Commit**

```bash
git add app/(pages)/stock-movements/create/_components/add-item-sheet.tsx && git commit -m "feat(stock-movements): add AddItemSheet component"
```

---

## Task 10: Componente AdditionPhase

**Files:**
- Create: `app/(pages)/stock-movements/create/_components/addition-phase.tsx`

**Step 1: Criar fase de adição**

```tsx
"use client";

import { useState } from "react";
import { Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ItemCard } from "./item-card";
import { cn } from "@/lib/utils";
import type { MobileWizardItem, ProductSearchResult } from "../stock-movements-create.types";

interface AdditionPhaseProps {
  items: MobileWizardItem[];
  products: ProductSearchResult[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onProductSelect: (product: ProductSearchResult) => void;
  onEditItem: (index: number) => void;
  onRemoveItem: (index: number) => void;
}

export const AdditionPhase = ({
  items,
  products,
  searchQuery,
  onSearchChange,
  onProductSelect,
  onEditItem,
  onRemoveItem,
}: AdditionPhaseProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const showResults = isFocused && searchQuery.length >= 2;
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Search Input */}
      <div className="px-4 py-3 border-b border-neutral-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            placeholder="Buscar produto..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className="h-12 pl-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
          />

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-[4px] border border-neutral-800 bg-[#171717] shadow-xl max-h-[240px] overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <p className="text-center text-sm text-neutral-500 py-4">
                  Nenhum produto encontrado
                </p>
              ) : (
                filteredProducts.slice(0, 10).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onMouseDown={() => onProductSelect(product)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-800 border-b border-neutral-800 last:border-b-0"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-neutral-900">
                      <Package className="h-5 w-5 text-neutral-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {product.name}
                      </p>
                      {product.sku && (
                        <p className="text-xs text-neutral-500">
                          SKU: {product.sku}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-16 w-16 text-neutral-700 mb-4" />
            <p className="text-sm font-medium text-neutral-400">
              Nenhum item adicionado
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              Escaneie ou busque produtos para adicionar
            </p>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3">
              Itens Adicionados ({items.length})
            </p>
            <div className="space-y-2">
              {items.map((item, index) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => onEditItem(index)}
                  onRemove={() => onRemoveItem(index)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add app/(pages)/stock-movements/create/_components/addition-phase.tsx && git commit -m "feat(stock-movements): add AdditionPhase component"
```

---

## Task 11: Componente ReviewPhase

**Files:**
- Create: `app/(pages)/stock-movements/create/_components/review-phase.tsx`

**Step 1: Criar fase de revisão**

```tsx
"use client";

import { useState } from "react";
import { Pencil, Package, Warehouse, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { MobileWizardItem } from "../stock-movements-create.types";

interface ReviewPhaseProps {
  sourceWarehouseName: string;
  destinationWarehouseName: string;
  items: MobileWizardItem[];
  executeNow: boolean;
  onExecuteNowChange: (value: boolean) => void;
  onEditRoute: () => void;
  onEditItems: () => void;
}

export const ReviewPhase = ({
  sourceWarehouseName,
  destinationWarehouseName,
  items,
  executeNow,
  onExecuteNowChange,
  onEditRoute,
  onEditItems,
}: ReviewPhaseProps) => {
  const [showAllItems, setShowAllItems] = useState(false);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const visibleItems = showAllItems ? items : items.slice(0, 5);
  const hiddenCount = items.length - 5;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 pb-40">
      <div className="space-y-4">
        {/* Route Card */}
        <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Rota
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onEditRoute}
              className="h-7 w-7 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-blue-500"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-neutral-800">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {sourceWarehouseName}
              </p>
            </div>
          </div>

          <div className="flex justify-center my-2">
            <div className="h-6 w-px bg-neutral-700" />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-neutral-800">
              <Warehouse className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {destinationWarehouseName}
              </p>
            </div>
          </div>
        </div>

        {/* Items Card */}
        <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Itens ({items.length})
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onEditItems}
              className="h-7 w-7 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-blue-500"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-2">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-1.5"
              >
                <span className="text-sm text-neutral-300 truncate flex-1">
                  {item.productName}
                </span>
                <span className="text-sm font-medium text-white ml-2">
                  × {item.quantity}
                </span>
              </div>
            ))}

            {hiddenCount > 0 && !showAllItems && (
              <button
                type="button"
                onClick={() => setShowAllItems(true)}
                className="flex items-center justify-center gap-1 w-full py-2 text-xs text-blue-500 hover:text-blue-400"
              >
                +{hiddenCount} itens
                <ChevronDown className="h-3 w-3" />
              </button>
            )}

            {showAllItems && items.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllItems(false)}
                className="flex items-center justify-center gap-1 w-full py-2 text-xs text-neutral-500 hover:text-neutral-400"
              >
                Mostrar menos
                <ChevronUp className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="border-t border-neutral-800 mt-3 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                Total
              </span>
              <span className="text-sm font-bold text-white">
                {totalQuantity} unidades
              </span>
            </div>
          </div>
        </div>

        {/* Execute Now Toggle */}
        <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={executeNow}
              onCheckedChange={(checked) => onExecuteNowChange(checked === true)}
              className="mt-0.5 h-5 w-5 rounded-[2px] border-neutral-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <div>
              <p className="text-sm font-medium text-white">
                Executar agora
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Atualiza o estoque imediatamente
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add app/(pages)/stock-movements/create/_components/review-phase.tsx && git commit -m "feat(stock-movements): add ReviewPhase component"
```

---

## Task 12: Componente SuccessScreen

**Files:**
- Create: `app/(pages)/stock-movements/create/_components/success-screen.tsx`

**Step 1: Criar tela de sucesso**

```tsx
"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface SuccessScreenProps {
  movementId: string;
  movementCode: string;
  totalQuantity: number;
  sourceWarehouse: string;
  destinationWarehouse: string;
  status: "PENDING" | "COMPLETED";
  onNewMovement: () => void;
}

export const SuccessScreen = ({
  movementId,
  movementCode,
  totalQuantity,
  sourceWarehouse,
  destinationWarehouse,
  status,
  onNewMovement,
}: SuccessScreenProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center space-y-4">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold uppercase tracking-wide text-white">
          Transferência Criada
        </h1>

        {/* Details */}
        <div className="space-y-1">
          <p className="text-lg font-mono text-neutral-300">
            {movementCode}
          </p>
          <p className="text-sm text-neutral-500">
            {totalQuantity} unidades
          </p>
          <p className="text-sm text-neutral-500">
            {sourceWarehouse} → {destinationWarehouse}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center pt-2">
          <Badge
            variant="outline"
            className={
              status === "COMPLETED"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                : "border-amber-500/30 bg-amber-500/10 text-amber-500"
            }
          >
            {status === "COMPLETED" ? "EXECUTADA" : "PENDENTE"}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs mt-12 space-y-3">
        <Button
          type="button"
          onClick={onNewMovement}
          className="h-14 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
        >
          Nova Transferência
        </Button>
        <Link
          href={`/stock-movements/${movementId}`}
          className="block text-center text-sm text-neutral-400 hover:text-white py-2"
        >
          Ver detalhes
        </Link>
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add app/(pages)/stock-movements/create/_components/success-screen.tsx && git commit -m "feat(stock-movements): add SuccessScreen component"
```

---

## Task 13: Model do Mobile Wizard

**Files:**
- Create: `app/(pages)/stock-movements/create/stock-movements-create-mobile.model.ts`

**Step 1: Criar model do wizard mobile**

```typescript
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import type {
  WizardPhase,
  MobileWizardItem,
  WarehouseOption,
  BatchOption,
  ProductSearchResult,
} from "./stock-movements-create.types";

interface WarehousesResponse {
  success: boolean;
  data: Array<{ id: string; name: string }>;
}

interface ProductsResponse {
  success: boolean;
  data: Array<{ id: string; name: string; sku?: string | null; barcode?: string | null }>;
}

interface BatchesResponse {
  success: boolean;
  data: Array<{
    id: string;
    batchCode?: string | null;
    batchNumber?: string | null;
    quantity: number;
    expirationDate?: string | null;
  }>;
}

interface CreateMovementResponse {
  success: boolean;
  data: { id: string; movementCode?: string };
}

export const useMobileWizardModel = () => {
  const router = useRouter();

  // Phase state
  const [phase, setPhase] = useState<WizardPhase>("setup");

  // Setup state
  const [sourceWarehouseId, setSourceWarehouseId] = useState<string | null>(null);
  const [destinationWarehouseId, setDestinationWarehouseId] = useState<string | null>(null);

  // Addition state
  const [items, setItems] = useState<MobileWizardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const [isAddItemSheetOpen, setIsAddItemSheetOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Review state
  const [executeNow, setExecuteNow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state
  const [createdMovement, setCreatedMovement] = useState<{
    id: string;
    code: string;
    status: "PENDING" | "COMPLETED";
  } | null>(null);

  // Data fetching
  const { data: warehousesData } = useSWR<WarehousesResponse>(
    "warehouses",
    async () => {
      const { api } = await import("@/lib/api");
      return await api.get("warehouses").json<WarehousesResponse>();
    }
  );

  const { data: productsData } = useSWR<ProductsResponse>(
    sourceWarehouseId ? `products?warehouseId=${sourceWarehouseId}` : null,
    async () => {
      const { api } = await import("@/lib/api");
      return await api.get("products").json<ProductsResponse>();
    }
  );

  const { data: batchesData, isLoading: isLoadingBatches } = useSWR<BatchesResponse>(
    selectedProduct && sourceWarehouseId
      ? `batches/warehouse/${sourceWarehouseId}/product/${selectedProduct.id}`
      : null,
    async (url) => {
      const { api } = await import("@/lib/api");
      return await api.get(url).json<BatchesResponse>();
    }
  );

  // Derived data
  const warehouses: WarehouseOption[] = (warehousesData?.data || []).map((w) => ({
    id: w.id,
    name: w.name,
  }));

  const products: ProductSearchResult[] = (productsData?.data || []).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
  }));

  const batches: BatchOption[] = (batchesData?.data || []).map((b) => ({
    id: b.id,
    batchCode: b.batchCode || b.batchNumber || b.id.slice(0, 8),
    quantity: b.quantity,
    expirationDate: b.expirationDate || undefined,
  }));

  const sourceWarehouse = warehouses.find((w) => w.id === sourceWarehouseId);
  const destinationWarehouse = warehouses.find((w) => w.id === destinationWarehouseId);

  // Navigation
  const goToSetup = useCallback(() => setPhase("setup"), []);
  const goToAddition = useCallback(() => setPhase("addition"), []);
  const goToReview = useCallback(() => setPhase("review"), []);

  const handleBack = useCallback(() => {
    if (phase === "addition") {
      setPhase("setup");
    } else if (phase === "review") {
      setPhase("addition");
    } else if (phase === "setup") {
      router.push("/stock-movements");
    }
  }, [phase, router]);

  // Setup handlers
  const handleSourceChange = useCallback((warehouse: WarehouseOption) => {
    setSourceWarehouseId(warehouse.id);
    // Clear destination if same as new source
    if (destinationWarehouseId === warehouse.id) {
      setDestinationWarehouseId(null);
    }
    // Clear items when source changes
    setItems([]);
  }, [destinationWarehouseId]);

  const handleDestinationChange = useCallback((warehouse: WarehouseOption) => {
    setDestinationWarehouseId(warehouse.id);
  }, []);

  const canContinueFromSetup = sourceWarehouseId && destinationWarehouseId;

  // Addition handlers
  const handleProductSelect = useCallback((product: ProductSearchResult) => {
    setSelectedProduct(product);
    setSearchQuery("");
    setIsAddItemSheetOpen(true);
  }, []);

  const handleBarcodeScan = useCallback((barcode: string) => {
    const product = products.find(
      (p) => p.barcode === barcode || p.sku === barcode
    );
    if (product) {
      handleProductSelect(product);
    } else {
      toast.error("Produto não encontrado");
    }
    setIsScannerOpen(false);
  }, [products, handleProductSelect]);

  const handleAddItem = useCallback((batchId: string, quantity: number) => {
    if (!selectedProduct) return;

    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return;

    if (editingItemIndex !== null) {
      // Edit existing item
      setItems((prev) =>
        prev.map((item, index) =>
          index === editingItemIndex
            ? { ...item, batchId, batchCode: batch.batchCode, quantity, maxQuantity: batch.quantity }
            : item
        )
      );
      setEditingItemIndex(null);
    } else {
      // Add new item
      const newItem: MobileWizardItem = {
        id: uuidv4(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productSku: selectedProduct.sku || undefined,
        batchId,
        batchCode: batch.batchCode,
        quantity,
        maxQuantity: batch.quantity,
      };
      setItems((prev) => [...prev, newItem]);
    }

    setIsAddItemSheetOpen(false);
    setSelectedProduct(null);
    toast.success("Item adicionado");
  }, [selectedProduct, batches, editingItemIndex]);

  const handleAddAndFinish = useCallback((batchId: string, quantity: number) => {
    handleAddItem(batchId, quantity);
    setPhase("review");
  }, [handleAddItem]);

  const handleEditItem = useCallback((index: number) => {
    const item = items[index];
    const product = products.find((p) => p.id === item.productId);
    if (product) {
      setSelectedProduct(product);
      setEditingItemIndex(index);
      setIsAddItemSheetOpen(true);
    }
  }, [items, products]);

  const handleRemoveItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const canContinueFromAddition = items.length > 0;

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!sourceWarehouseId || !destinationWarehouseId || items.length === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { api } = await import("@/lib/api");

      const payload = {
        movementType: "TRANSFER",
        sourceWarehouseId,
        destinationWarehouseId,
        items: items.map((item) => ({
          productId: item.productId,
          batchId: item.batchId,
          quantity: item.quantity,
        })),
      };

      const response = await api
        .post("stock-movements", { json: payload })
        .json<CreateMovementResponse>();

      if (response.success) {
        let status: "PENDING" | "COMPLETED" = "PENDING";

        if (executeNow) {
          try {
            await api.post(`stock-movements/${response.data.id}/execute`).json();
            status = "COMPLETED";
          } catch {
            toast.error("Criada, mas não foi possível executar");
          }
        }

        setCreatedMovement({
          id: response.data.id,
          code: response.data.movementCode || `MOV-${response.data.id.slice(0, 8)}`,
          status,
        });
        setPhase("success");
        toast.success("Transferência criada");
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar transferência");
    } finally {
      setIsSubmitting(false);
    }
  }, [sourceWarehouseId, destinationWarehouseId, items, executeNow]);

  // Reset
  const handleNewMovement = useCallback(() => {
    setPhase("setup");
    setSourceWarehouseId(null);
    setDestinationWarehouseId(null);
    setItems([]);
    setSearchQuery("");
    setSelectedProduct(null);
    setExecuteNow(false);
    setCreatedMovement(null);
  }, []);

  return {
    // Phase
    phase,

    // Setup
    warehouses,
    sourceWarehouseId,
    destinationWarehouseId,
    sourceWarehouse,
    destinationWarehouse,
    handleSourceChange,
    handleDestinationChange,
    canContinueFromSetup,

    // Addition
    items,
    products,
    searchQuery,
    setSearchQuery,
    selectedProduct,
    isAddItemSheetOpen,
    setIsAddItemSheetOpen,
    batches,
    isLoadingBatches,
    handleProductSelect,
    handleAddItem,
    handleAddAndFinish,
    handleEditItem,
    handleRemoveItem,
    canContinueFromAddition,
    isScannerOpen,
    setIsScannerOpen,
    handleBarcodeScan,

    // Review
    executeNow,
    setExecuteNow,
    isSubmitting,
    handleSubmit,

    // Success
    createdMovement,
    handleNewMovement,

    // Navigation
    goToSetup,
    goToAddition,
    goToReview,
    handleBack,
  };
};
```

**Step 2: Run TypeScript check**

Run: `pnpm tsc --noEmit`
Expected: No errors (may need to install uuid: `pnpm add uuid @types/uuid`)

**Step 3: Commit**

```bash
git add app/(pages)/stock-movements/create/stock-movements-create-mobile.model.ts && git commit -m "feat(stock-movements): add mobile wizard model"
```

---

## Task 14: View Principal do Mobile Wizard

**Files:**
- Create: `app/(pages)/stock-movements/create/stock-movements-create-mobile.view.tsx`

**Step 1: Criar view principal**

```tsx
"use client";

import { Camera, ArrowRight, Check } from "lucide-react";
import { MobileWizardHeader } from "./_components/mobile-wizard-header";
import { WarehouseContextBar } from "./_components/warehouse-context-bar";
import { SetupPhase } from "./_components/setup-phase";
import { AdditionPhase } from "./_components/addition-phase";
import { AddItemSheet } from "./_components/add-item-sheet";
import { ReviewPhase } from "./_components/review-phase";
import { SuccessScreen } from "./_components/success-screen";
import { MobileFooterActions } from "./_components/mobile-footer-actions";
import { BarcodeScannerModal } from "@/components/product/barcode-scanner-modal";
import { useMobileWizardModel } from "./stock-movements-create-mobile.model";

export const StockMovementCreateMobileView = () => {
  const model = useMobileWizardModel();

  const getHeaderTitle = () => {
    switch (model.phase) {
      case "setup":
        return "Nova Transferência";
      case "addition":
        return "Transferência";
      case "review":
        return "Revisar Transferência";
      case "success":
        return "";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Header */}
      {model.phase !== "success" && (
        <MobileWizardHeader
          title={getHeaderTitle()}
          onBack={model.handleBack}
          showBack={model.phase !== "setup"}
        />
      )}

      {/* Context Bar (only in addition and review phases) */}
      {(model.phase === "addition" || model.phase === "review") &&
        model.sourceWarehouse &&
        model.destinationWarehouse && (
          <WarehouseContextBar
            sourceWarehouse={model.sourceWarehouse.name}
            destinationWarehouse={model.destinationWarehouse.name}
          />
        )}

      {/* Content */}
      {model.phase === "setup" && (
        <SetupPhase
          warehouses={model.warehouses}
          sourceWarehouseId={model.sourceWarehouseId}
          destinationWarehouseId={model.destinationWarehouseId}
          onSourceChange={model.handleSourceChange}
          onDestinationChange={model.handleDestinationChange}
        />
      )}

      {model.phase === "addition" && (
        <AdditionPhase
          items={model.items}
          products={model.products}
          searchQuery={model.searchQuery}
          onSearchChange={model.setSearchQuery}
          onProductSelect={model.handleProductSelect}
          onEditItem={model.handleEditItem}
          onRemoveItem={model.handleRemoveItem}
        />
      )}

      {model.phase === "review" && model.sourceWarehouse && model.destinationWarehouse && (
        <ReviewPhase
          sourceWarehouseName={model.sourceWarehouse.name}
          destinationWarehouseName={model.destinationWarehouse.name}
          items={model.items}
          executeNow={model.executeNow}
          onExecuteNowChange={model.setExecuteNow}
          onEditRoute={model.goToSetup}
          onEditItems={model.goToAddition}
        />
      )}

      {model.phase === "success" && model.createdMovement && model.sourceWarehouse && model.destinationWarehouse && (
        <SuccessScreen
          movementId={model.createdMovement.id}
          movementCode={model.createdMovement.code}
          totalQuantity={model.items.reduce((sum, item) => sum + item.quantity, 0)}
          sourceWarehouse={model.sourceWarehouse.name}
          destinationWarehouse={model.destinationWarehouse.name}
          status={model.createdMovement.status}
          onNewMovement={model.handleNewMovement}
        />
      )}

      {/* Footer Actions */}
      {model.phase === "setup" && (
        <MobileFooterActions
          primaryAction={{
            label: "Continuar",
            onClick: model.goToAddition,
            disabled: !model.canContinueFromSetup,
            icon: ArrowRight,
          }}
        />
      )}

      {model.phase === "addition" && (
        <MobileFooterActions
          secondaryAction={{
            label: "Scan",
            onClick: () => model.setIsScannerOpen(true),
            icon: Camera,
          }}
          primaryAction={{
            label: "Finalizar",
            onClick: model.goToReview,
            disabled: !model.canContinueFromAddition,
            icon: ArrowRight,
          }}
          progress={{
            value: model.items.length,
            max: Math.max(model.items.length, 10),
            label: `${model.items.length} ${model.items.length === 1 ? "item" : "itens"}`,
          }}
        />
      )}

      {model.phase === "review" && (
        <MobileFooterActions
          primaryAction={{
            label: model.isSubmitting ? "Enviando..." : "Confirmar Transferência",
            onClick: model.handleSubmit,
            disabled: model.isSubmitting,
            variant: "emerald",
            icon: Check,
          }}
        />
      )}

      {/* Add Item Sheet */}
      <AddItemSheet
        open={model.isAddItemSheetOpen}
        onOpenChange={model.setIsAddItemSheetOpen}
        product={model.selectedProduct}
        batches={model.batches}
        isLoadingBatches={model.isLoadingBatches}
        onAddItem={model.handleAddItem}
        onAddAndFinish={model.handleAddAndFinish}
      />

      {/* Barcode Scanner */}
      <BarcodeScannerModal
        open={model.isScannerOpen}
        onClose={() => model.setIsScannerOpen(false)}
        onScan={model.handleBarcodeScan}
      />
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add app/(pages)/stock-movements/create/stock-movements-create-mobile.view.tsx && git commit -m "feat(stock-movements): add mobile wizard view"
```

---

## Task 15: Atualizar Page para usar Mobile Wizard

**Files:**
- Modify: `app/(pages)/stock-movements/create/page.tsx`

**Step 1: Ler arquivo atual**

Run: `cat app/(pages)/stock-movements/create/page.tsx`

**Step 2: Atualizar page para detectar mobile e usar wizard apropriado**

```tsx
"use client";

import { useEffect, useState } from "react";
import { StockMovementCreateMobileView } from "./stock-movements-create-mobile.view";
import { StockMovementCreateView } from "./stock-movements-create.view";
import { useStockMovementCreateModel } from "./stock-movements-create.model";

export default function StockMovementCreatePage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Desktop model (only used when not mobile)
  const desktopModel = useStockMovementCreateModel();

  // SSR fallback
  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-blue-500" />
      </div>
    );
  }

  // Mobile view
  if (isMobile) {
    return <StockMovementCreateMobileView />;
  }

  // Desktop view (existing)
  return (
    <StockMovementCreateView
      form={desktopModel.form}
      onSubmit={desktopModel.onSubmit}
      items={desktopModel.items}
      addItem={desktopModel.addItem}
      removeItem={desktopModel.removeItem}
      warehouses={desktopModel.warehouses}
      products={desktopModel.products}
      batches={desktopModel.batches}
      currentStep={desktopModel.currentStep}
      totalSteps={desktopModel.totalSteps}
      onNextStep={desktopModel.onNextStep}
      onPrevStep={desktopModel.onPrevStep}
    />
  );
}
```

**Step 3: Commit**

```bash
git add app/(pages)/stock-movements/create/page.tsx && git commit -m "feat(stock-movements): integrate mobile wizard in page"
```

---

## Task 16: Instalar dependência uuid

**Step 1: Instalar uuid**

Run: `pnpm add uuid`

**Step 2: Instalar types**

Run: `pnpm add -D @types/uuid`

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml && git commit -m "chore: add uuid dependency"
```

---

## Task 17: Testar aplicação

**Step 1: Iniciar dev server**

Run: `pnpm dev`

**Step 2: Verificar build**

Run: `pnpm build`
Expected: No errors

**Step 3: Testar no browser**

1. Abrir http://localhost:3000/stock-movements/create
2. Redimensionar janela para mobile (<768px)
3. Verificar que wizard mobile aparece
4. Testar fluxo completo: Setup → Addition → Review

---

## Task 18: Commit Final

**Step 1: Verificar todos os arquivos**

Run: `git status`

**Step 2: Commit final se houver arquivos pendentes**

```bash
git add . && git commit -m "feat(stock-movements): complete mobile wizard implementation"
```

---

## Summary

| Task | Componente | Descrição |
|------|------------|-----------|
| 1 | Types | Types do wizard mobile |
| 2 | QuantityStepper | Stepper de quantidade com botões grandes |
| 3 | MobileWizardHeader | Header com back button |
| 4 | WarehouseContextBar | Barra de contexto origem → destino |
| 5 | MobileFooterActions | Footer fixo com ações |
| 6 | ItemCard | Card de item adicionado |
| 7 | WarehouseBottomSheet | Bottom sheet de seleção de armazém |
| 8 | SetupPhase | Fase de seleção de armazéns |
| 9 | AddItemSheet | Sheet de adicionar item (lote + quantidade) |
| 10 | AdditionPhase | Fase de adição contínua |
| 11 | ReviewPhase | Fase de revisão final |
| 12 | SuccessScreen | Tela de sucesso |
| 13 | Model | Lógica do wizard mobile |
| 14 | View | View principal orquestrando componentes |
| 15 | Page | Integração na página existente |
| 16 | Dependencies | Instalar uuid |
| 17 | Testing | Testar aplicação |
| 18 | Final | Commit final |

---

**Plan complete and saved to `docs/plans/2026-01-20-stock-movements-mobile-wizard-implementation.md`.**
