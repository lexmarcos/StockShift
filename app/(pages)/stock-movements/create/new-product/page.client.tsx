"use client";

import { Suspense } from "react";
import { ProductForm } from "../../../products/components/product-form.view";
import { useNewProductInlineModel } from "./new-product-inline.model";
import { StockMovementReloadGuard } from "../stock-movement-reload-guard";
import { StockMovementBatchDataModal } from "../stock-movement-batch-data-modal.view";

interface NewProductInlineContentProps {
  movementType: string | null;
  editItem: string | null;
}

function NewProductInlineContent({
  movementType,
  editItem,
}: NewProductInlineContentProps) {
  const model = useNewProductInlineModel({ movementType, editItem });
  const isBatchOverlayOpen = model.batchForm?.isOpen ?? false;

  return (
    <>
      <StockMovementReloadGuard />
      <ProductForm {...model} />
      {isBatchOverlayOpen && (
        <div className="fixed inset-0 z-40 bg-[#0A0A0A]" />
      )}
      <StockMovementBatchDataModal
        form={model.batchForm ?? {
          isOpen: false,
          productId: "",
          productName: "",
          quantity: "",
          manufacturedDate: "",
          expirationDate: "",
          editingIndex: null,
          error: null,
        }}
        onOpenChange={model.onBatchOpenChange ?? (() => {})}
        onQuantityChange={model.onBatchQuantityChange ?? (() => {})}
        onQuantityIncrement={model.onBatchQuantityIncrement ?? (() => {})}
        onQuantityDecrement={model.onBatchQuantityDecrement ?? (() => {})}
        onManufacturedDateChange={model.onBatchManufacturedDateChange ?? (() => {})}
        onExpirationDateChange={model.onBatchExpirationDateChange ?? (() => {})}
        onCostPriceChange={model.onBatchCostPriceChange ?? (() => {})}
        onSellingPriceChange={model.onBatchSellingPriceChange ?? (() => {})}
        onApplyCostPriceSuggestion={model.onApplyBatchCostPriceSuggestion ?? (() => {})}
        onApplySalePriceSuggestion={model.onApplyBatchSalePriceSuggestion ?? (() => {})}
        onConfirm={model.onConfirmBatch ?? (() => {})}
        costPriceSuggestion={model.batchCostPriceSuggestion ?? null}
        salePriceSuggestion={model.batchSalePriceSuggestion ?? null}
        isPriceSuggestionLoading={model.isBatchPriceSuggestionLoading ?? false}
        shouldShowMissingCostPriceSuggestion={model.shouldShowMissingBatchCostPriceSuggestion ?? false}
        shouldShowMissingSalePriceSuggestion={model.shouldShowMissingBatchSalePriceSuggestion ?? false}
        profitSummary={model.batchProfitSummary ?? { kind: "incomplete", title: "" }}
        existsInStock={model.batchExistsInStock ?? false}
      />
    </>
  );
}

export function PageClient(props: NewProductInlineContentProps) {
  return (
    <Suspense fallback={null}>
      <NewProductInlineContent {...props} />
    </Suspense>
  );
}
