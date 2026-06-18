import { useCallback, useState } from "react";
import type { MutableRefObject } from "react";

import type {
  CreateStockMovementSchema,
} from "./create-stock-movement.schema";
import type {
  ExistingProductBatchFormState,
} from "./create-stock-movement.types";
import { resolveExistingProductBatchQuantity } from "./create-stock-movement.payload";
import { getOptionalText, validateExistingProductBatchForm } from "./stock-movement-batch-form-validation";
import {
  buildRepeatedProductBatchWarning,
  hasExistingProductInItems,
} from "./stock-movement-draft-guards";

const EMPTY_EXISTING_BATCH_FORM: ExistingProductBatchFormState = {
  isOpen: false,
  productId: "",
  productName: "",
  quantity: "",
  manufacturedDate: "",
  expirationDate: "",
  editingIndex: null,
  error: null,
};

interface PriceSuggestion {
  priceCents: number;
}

interface UseExistingProductBatchFormParams {
  formItems: CreateStockMovementSchema["items"];
  append: (item: CreateStockMovementSchema["items"][number]) => void;
  update: (index: number, item: CreateStockMovementSchema["items"][number]) => void;
  onItemConfirmed: () => void;
  salePriceSuggestionRef: MutableRefObject<PriceSuggestion | undefined>;
  costPriceSuggestionRef: MutableRefObject<PriceSuggestion | undefined>;
}

interface ExistingProductBatchFormReturn {
  existingProductBatchForm: ExistingProductBatchFormState;
  onExistingProductBatchOpenChange: (open: boolean) => void;
  onExistingProductBatchQuantityChange: (quantity: string) => void;
  onExistingProductBatchQuantityIncrement: () => void;
  onExistingProductBatchQuantityDecrement: () => void;
  onExistingProductBatchManufacturedDateChange: (manufacturedDate: string) => void;
  onExistingProductBatchExpirationDateChange: (expirationDate: string) => void;
  onExistingProductBatchCostPriceChange: (costPrice?: number) => void;
  onExistingProductBatchSellingPriceChange: (sellingPrice?: number) => void;
  onApplyExistingProductCostPriceSuggestion: () => void;
  onApplyExistingProductSalePriceSuggestion: () => void;
  onConfirmExistingProductBatchData: () => void;
  openExistingProductBatchForm: (params: Omit<ExistingProductBatchFormState, "isOpen" | "error">) => void;
  closeExistingProductBatchForm: () => void;
}

export function useExistingProductBatchForm({
  formItems,
  append,
  update,
  onItemConfirmed,
  salePriceSuggestionRef,
  costPriceSuggestionRef,
}: UseExistingProductBatchFormParams): ExistingProductBatchFormReturn {
  const [existingProductBatchForm, setExistingProductBatchForm] =
    useState<ExistingProductBatchFormState>(EMPTY_EXISTING_BATCH_FORM);

  const buildBatchRepeatedProductWarning = useCallback(
    (
      params: Pick<ExistingProductBatchFormState, "productId" | "productName" | "editingIndex">,
    ): string | null => {
      if (params.editingIndex !== null) return null;
      if (!hasExistingProductInItems(formItems, params.productId)) {
        return null;
      }
      return buildRepeatedProductBatchWarning(params.productName);
    },
    [formItems],
  );

  const closeExistingProductBatchForm = useCallback((): void => {
    setExistingProductBatchForm(EMPTY_EXISTING_BATCH_FORM);
  }, []);

  const openExistingProductBatchForm = useCallback(
    (params: Omit<ExistingProductBatchFormState, "isOpen" | "error">): void => {
      setExistingProductBatchForm({
        ...params,
        isOpen: true,
        error: null,
        repeatedProductWarning: buildBatchRepeatedProductWarning(params),
      });
    },
    [buildBatchRepeatedProductWarning],
  );

  const updateExistingProductBatchForm = useCallback(
    (patch: Partial<ExistingProductBatchFormState>): void => {
      setExistingProductBatchForm((current) => ({
        ...current,
        ...patch,
        error: patch.error ?? null,
      }));
    },
    [],
  );

  const updateExistingProductBatchQuantity = useCallback(
    (calculateNextQuantity: (quantity: number) => number): void => {
      setExistingProductBatchForm((current) => {
        const currentQuantity = resolveExistingProductBatchQuantity(
          current.quantity,
        );
        const nextQuantity = Math.max(calculateNextQuantity(currentQuantity), 0);
        return {
          ...current,
          quantity: nextQuantity > 0 ? String(nextQuantity) : "",
          error: null,
        };
      });
    },
    [],
  );

  const handleExistingProductBatchQuantityIncrement = useCallback((): void => {
    updateExistingProductBatchQuantity((quantity) => quantity + 1);
  }, [updateExistingProductBatchQuantity]);

  const handleExistingProductBatchQuantityDecrement = useCallback((): void => {
    updateExistingProductBatchQuantity((quantity) => quantity - 1);
  }, [updateExistingProductBatchQuantity]);

  const handleApplyExistingProductSalePriceSuggestion = useCallback((): void => {
    const suggestion = salePriceSuggestionRef.current;
    if (!suggestion) return;
    updateExistingProductBatchForm({
      sellingPrice: suggestion.priceCents,
    });
  }, [salePriceSuggestionRef, updateExistingProductBatchForm]);

  const handleApplyExistingProductCostPriceSuggestion = useCallback((): void => {
    const suggestion = costPriceSuggestionRef.current;
    if (!suggestion) return;
    updateExistingProductBatchForm({
      costPrice: suggestion.priceCents,
    });
  }, [costPriceSuggestionRef, updateExistingProductBatchForm]);

  const buildExistingProductBatchItem = useCallback(
    (): CreateStockMovementSchema["items"][number] => ({
      productId: existingProductBatchForm.productId,
      productName: existingProductBatchForm.productName,
      quantity: Number(existingProductBatchForm.quantity),
      manufacturedDate: getOptionalText(existingProductBatchForm.manufacturedDate),
      expirationDate: getOptionalText(existingProductBatchForm.expirationDate),
      costPrice: existingProductBatchForm.costPrice,
      sellingPrice: existingProductBatchForm.sellingPrice,
    }),
    [existingProductBatchForm],
  );

  const handleConfirmExistingProductBatchData = useCallback((): void => {
    const validationError = validateExistingProductBatchForm(
      existingProductBatchForm,
    );
    if (validationError) {
      updateExistingProductBatchForm({ error: validationError });
      return;
    }

    const item = buildExistingProductBatchItem();
    if (existingProductBatchForm.editingIndex !== null) {
      update(existingProductBatchForm.editingIndex, item);
    } else {
      append(item);
      onItemConfirmed();
    }
    closeExistingProductBatchForm();
  }, [
    existingProductBatchForm,
    updateExistingProductBatchForm,
    buildExistingProductBatchItem,
    update,
    append,
    onItemConfirmed,
    closeExistingProductBatchForm,
  ]);

  const handleExistingProductBatchOpenChange = useCallback((open: boolean): void => {
    if (open) {
      setExistingProductBatchForm((current) => ({ ...current, isOpen: true }));
      return;
    }
    closeExistingProductBatchForm();
  }, [closeExistingProductBatchForm]);

  return {
    existingProductBatchForm,
    onExistingProductBatchOpenChange: handleExistingProductBatchOpenChange,
    onExistingProductBatchQuantityChange: (quantity: string) =>
      updateExistingProductBatchForm({ quantity }),
    onExistingProductBatchQuantityIncrement: handleExistingProductBatchQuantityIncrement,
    onExistingProductBatchQuantityDecrement: handleExistingProductBatchQuantityDecrement,
    onExistingProductBatchManufacturedDateChange: (manufacturedDate: string) =>
      updateExistingProductBatchForm({ manufacturedDate }),
    onExistingProductBatchExpirationDateChange: (expirationDate: string) =>
      updateExistingProductBatchForm({ expirationDate }),
    onExistingProductBatchCostPriceChange: (costPrice?: number) =>
      updateExistingProductBatchForm({ costPrice }),
    onExistingProductBatchSellingPriceChange: (sellingPrice?: number) =>
      updateExistingProductBatchForm({ sellingPrice }),
    onApplyExistingProductCostPriceSuggestion: handleApplyExistingProductCostPriceSuggestion,
    onApplyExistingProductSalePriceSuggestion: handleApplyExistingProductSalePriceSuggestion,
    onConfirmExistingProductBatchData: handleConfirmExistingProductBatchData,
    openExistingProductBatchForm,
    closeExistingProductBatchForm,
  };
}
