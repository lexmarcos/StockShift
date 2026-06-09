"use client";

import { Hash, Package, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import type { NewTransferViewProps } from "./new-transfer.types";

interface TransferItemsListProps {
  viewState: NewTransferViewProps;
  totalQuantity: number;
}

export function TransferItemsList({
  viewState,
  totalQuantity,
}: TransferItemsListProps) {
  const { form, items } = viewState;

  return (
    <div>
      <SectionLabel icon={Hash} className="mb-4">
        Itens na Transferência ({items.length})
      </SectionLabel>
      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum item adicionado"
          description="Busque ou escaneie um produto para escolher o lote da transferência."
        />
      ) : (
        <>
          <TransferItemsMobileList viewState={viewState} />
          <TransferItemsDesktopTable
            viewState={viewState}
            totalQuantity={totalQuantity}
          />
        </>
      )}
      {form.formState.errors.items ? (
        <p className="mt-2 text-xs font-medium text-rose-500">
          {form.formState.errors.items.message}
        </p>
      ) : null}
    </div>
  );
}

function TransferItemsMobileList({
  viewState,
}: {
  viewState: NewTransferViewProps;
}) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      {viewState.items.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-[4px] border border-neutral-800 bg-[#171717] p-4"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">
              {item.productName || "Produto"}
            </p>
            <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
              <span>
                Lote: <span className="font-mono text-neutral-400">{item.batchCode}</span>
              </span>
              <span>
                Qtd: {" "}
                <span className="font-mono font-bold tracking-tighter text-white">
                  {item.quantity}
                </span>
              </span>
            </div>
          </div>
          <TransferRemoveItemButton
            index={index}
            onRemoveItem={viewState.onRemoveItem}
            sizeClassName="size-9"
          />
        </div>
      ))}
    </div>
  );
}

function TransferItemsDesktopTable({
  viewState,
  totalQuantity,
}: {
  viewState: NewTransferViewProps;
  totalQuantity: number;
}) {
  return (
    <div className="hidden md:block">
      <div className="rounded-[4px] border border-neutral-800 bg-[#171717]">
        <table className="w-full">
          <TransferItemsDesktopHeader />
          <tbody>
            {viewState.items.map((item, index) => (
              <TransferItemsDesktopRow
                key={item.id}
                index={index}
                item={item}
                onRemoveItem={viewState.onRemoveItem}
              />
            ))}
          </tbody>
          <TransferItemsDesktopFooter totalQuantity={totalQuantity} />
        </table>
      </div>
    </div>
  );
}

function TransferItemsDesktopHeader() {
  return (
    <thead>
      <tr className="border-b border-neutral-800">
        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Produto
        </th>
        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Lote
        </th>
        <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Quantidade
        </th>
        <th className="w-12 p-3" />
      </tr>
    </thead>
  );
}

function TransferItemsDesktopFooter({ totalQuantity }: { totalQuantity: number }) {
  return (
    <tfoot>
      <tr className="border-t border-neutral-700">
        <td
          colSpan={2}
          className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500"
        >
          Total
        </td>
        <td className="px-5 py-3 text-right font-mono text-sm font-bold tracking-tighter text-white">
          {totalQuantity}
        </td>
        <td />
      </tr>
    </tfoot>
  );
}

function TransferItemsDesktopRow({
  index,
  item,
  onRemoveItem,
}: {
  index: number;
  item: NewTransferViewProps["items"][number];
  onRemoveItem: (index: number) => void;
}) {
  return (
    <tr className="border-b border-neutral-800 last:border-0">
      <td className="px-5 py-3.5 text-sm font-medium text-white">
        {item.productName || "Produto"}
      </td>
      <td className="px-5 py-3.5 font-mono text-xs text-neutral-400">
        {item.batchCode || "—"}
      </td>
      <td className="px-5 py-3.5 text-right font-mono text-sm font-bold tracking-tighter text-white">
        {item.quantity}
      </td>
      <td className="p-3.5">
        <TransferRemoveItemButton
          index={index}
          onRemoveItem={onRemoveItem}
          sizeClassName="size-8"
        />
      </td>
    </tr>
  );
}

function TransferRemoveItemButton({
  index,
  onRemoveItem,
  sizeClassName,
}: {
  index: number;
  onRemoveItem: (index: number) => void;
  sizeClassName: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => onRemoveItem(index)}
      className={`${sizeClassName} rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-rose-500`}
    >
      <Trash2 className="size-4" strokeWidth={2} />
    </Button>
  );
}
