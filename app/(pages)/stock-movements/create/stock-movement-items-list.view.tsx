"use client";

import { Hash, Package, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionLabel } from "@/components/ui/section-label";
import type { StockMovementDraftItem } from "./create-stock-movement.types";

type StockMovementListItem = StockMovementDraftItem & { id: string };

interface StockMovementItemsListProps {
  items: StockMovementListItem[];
  isInMovement: boolean;
  itemsErrorMessage?: string;
  onEditNewProductItem: (index: number) => void;
  onEditExistingProductBatchData: (index: number) => void;
  onRemoveItem: (index: number) => void;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const formatBatchDate = (value: string): string => {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const formatBatchPrice = (value: number): string => {
  return currencyFormatter.format(value / 100);
};

const getBatchSummaryLines = (item: StockMovementListItem): string[] => {
  const batchSource = item.newProductData || item;
  const lines: string[] = [];
  if (batchSource.manufacturedDate) {
    lines.push(`Fab: ${formatBatchDate(batchSource.manufacturedDate)}`);
  }
  if (batchSource.expirationDate) {
    lines.push(`Val: ${formatBatchDate(batchSource.expirationDate)}`);
  }
  if (batchSource.costPrice !== undefined) {
    lines.push(`Custo: ${formatBatchPrice(batchSource.costPrice)}`);
  }
  if (batchSource.sellingPrice !== undefined) {
    lines.push(`Venda: ${formatBatchPrice(batchSource.sellingPrice)}`);
  }
  return lines;
};

const canEditExistingBatchData = (
  item: StockMovementListItem,
  isInMovement: boolean,
): boolean => {
  return isInMovement && Boolean(item.productId) && !item.newProductData;
};

const renderNewProductBadge = (item: StockMovementListItem) => {
  if (!item.newProductData) return null;
  return (
    <span className="rounded-[2px] border border-blue-500/30 bg-blue-600/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-400">
      Novo
    </span>
  );
};

const BatchSummary = ({ item }: { item: StockMovementListItem }) => {
  const lines = getBatchSummaryLines(item);
  if (lines.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {lines.map((line) => (
        <span
          key={line}
          className="rounded-[2px] border border-neutral-800 bg-neutral-950 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400"
        >
          {line}
        </span>
      ))}
    </div>
  );
};

export function StockMovementItemsList({
  items,
  isInMovement,
  itemsErrorMessage,
  onEditNewProductItem,
  onEditExistingProductBatchData,
  onRemoveItem,
}: StockMovementItemsListProps) {
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div>
      <SectionLabel icon={Hash} className="mb-4">
        Itens da Movimentação ({items.length})
      </SectionLabel>

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum item adicionado"
          description="Selecione um produto e informe a quantidade para adicioná-lo."
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {items.map((item, index) => (
              <MobileMovementItem
                key={item.id}
                item={item}
                index={index}
                isInMovement={isInMovement}
                onEditNewProductItem={onEditNewProductItem}
                onEditExistingProductBatchData={onEditExistingProductBatchData}
                onRemoveItem={onRemoveItem}
                buttonSizeClass="h-9 w-9"
              />
            ))}
          </div>

          <div className="hidden md:block">
            <DesktopMovementItemsTable
              items={items}
              totalQuantity={totalQuantity}
              isInMovement={isInMovement}
              onEditNewProductItem={onEditNewProductItem}
              onEditExistingProductBatchData={onEditExistingProductBatchData}
              onRemoveItem={onRemoveItem}
            />
          </div>
        </>
      )}

      {itemsErrorMessage && (
        <p className="mt-2 text-xs font-medium text-rose-500">
          {itemsErrorMessage}
        </p>
      )}
    </div>
  );
}

interface MovementItemActionProps {
  item: StockMovementListItem;
  index: number;
  isInMovement: boolean;
  onEditNewProductItem: (index: number) => void;
  onEditExistingProductBatchData: (index: number) => void;
  onRemoveItem: (index: number) => void;
  buttonSizeClass: string;
}

function MovementItemActions({
  item,
  index,
  isInMovement,
  onEditNewProductItem,
  onEditExistingProductBatchData,
  onRemoveItem,
  buttonSizeClass,
}: MovementItemActionProps) {
  const canEditBatchData = canEditExistingBatchData(item, isInMovement);
  const canEditItem = Boolean(item.newProductData) || canEditBatchData;
  const editItem = (): void => {
    if (item.newProductData) {
      onEditNewProductItem(index);
      return;
    }
    onEditExistingProductBatchData(index);
  };

  return (
    <div className="flex justify-end gap-1">
      {canEditItem && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Editar item"
          onClick={editItem}
          className={`${buttonSizeClass} rounded-[4px] text-neutral-500 hover:bg-blue-500/10 hover:text-blue-400`}
        >
          <Pencil className="h-4 w-4" strokeWidth={2} />
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Remover item"
        onClick={() => onRemoveItem(index)}
        className={`${buttonSizeClass} rounded-[4px] text-neutral-500 hover:bg-rose-500/10 hover:text-rose-500`}
      >
        <Trash2 className="h-4 w-4" strokeWidth={2} />
      </Button>
    </div>
  );
}

function MobileMovementItem(props: MovementItemActionProps) {
  const { item } = props;
  return (
    <div className="flex items-start gap-3 rounded-[4px] border border-neutral-800 bg-[#171717] p-4">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-bold text-white">
            {item.productName || "Produto"}
          </p>
          {renderNewProductBadge(item)}
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Qtd:{" "}
          <span className="font-mono font-bold tracking-tighter text-white">
            {item.quantity}
          </span>
        </p>
        <BatchSummary item={item} />
      </div>
      <MovementItemActions {...props} />
    </div>
  );
}

interface DesktopMovementItemsTableProps
  extends Omit<MovementItemActionProps, "item" | "index" | "buttonSizeClass"> {
  items: StockMovementListItem[];
  totalQuantity: number;
}

function DesktopMovementItemsTable({
  items,
  totalQuantity,
  ...actionProps
}: DesktopMovementItemsTableProps) {
  return (
    <div className="rounded-[4px] border border-neutral-800 bg-[#171717]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-800">
            <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Produto
            </th>
            <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Quantidade
            </th>
            <th className="w-24 px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr
              key={item.id}
              className="border-b border-neutral-800 last:border-0"
            >
              <td className="px-5 py-3.5 text-sm font-medium text-white">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate">
                      {item.productName || "Produto"}
                    </span>
                    {renderNewProductBadge(item)}
                  </div>
                  <BatchSummary item={item} />
                </div>
              </td>
              <td className="px-5 py-3.5 text-right font-mono text-sm font-bold tracking-tighter text-white">
                {item.quantity}
              </td>
              <td className="px-3 py-3.5">
                <MovementItemActions
                  {...actionProps}
                  item={item}
                  index={index}
                  buttonSizeClass="h-8 w-8"
                />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-neutral-700">
            <td className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Total
            </td>
            <td className="px-5 py-3 text-right font-mono text-sm font-bold tracking-tighter text-white">
              {totalQuantity}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
