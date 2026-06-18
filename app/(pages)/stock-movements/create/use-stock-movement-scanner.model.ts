import { useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import type { CreateStockMovementSchema } from "./create-stock-movement.schema";
import type { StockMovementProductOption } from "./create-stock-movement.types";
import type { ManualMovementType } from "../stock-movements.constants";
import { MANUAL_IN_MOVEMENT_TYPES } from "../stock-movements.constants";
import { getPendingInlineProductBarcodeConflictError, hasExistingProductInItems } from "./stock-movement-draft-guards";
import { lookupStockMovementProductByBarcode } from "./stock-movement-product-lookup";

type OpenBatchFormFn = (params: {
  productId: string;
  productName: string;
  quantity: string;
  manufacturedDate: string;
  expirationDate: string;
  costPrice: number | undefined;
  sellingPrice: number | undefined;
  editingIndex: number | null;
}) => void;

interface UseStockMovementScannerParams {
  selectedMovementType: ManualMovementType | undefined;
  router: AppRouterInstance;
  form: UseFormReturn<CreateStockMovementSchema>;
  append: (item: CreateStockMovementSchema["items"][number]) => void;
  persistCurrentDraft: (inlineProductBarcode?: string) => Promise<void>;
  inlineProductBarcodeRef: React.MutableRefObject<string | undefined>;
  itemQuantity: string;
  openExistingProductBatchForm: OpenBatchFormFn;
  setAddItemError: (error: string | null) => void;
}

interface StockMovementScannerReturn {
  isScannerOpen: boolean;
  setScannerOpen: (open: boolean) => void;
  onBarcodeScan: (barcode: string) => Promise<void>;
  missingProductBarcode: string | null;
  onMissingProductModalOpenChange: (open: boolean) => void;
  inlineDuplicateWarning: string | null;
  onInlineDuplicateWarningOpenChange: (open: boolean) => void;
  onCreateProductFromMissingModal: () => Promise<void>;
  onCreateNewProduct: () => Promise<void>;
  onEditNewProductItem: (index: number) => Promise<void>;
  onEditExistingProductBatchData: (index: number) => void;
  appendScannedProduct: (product: StockMovementProductOption) => void;
}

export const isSelectedInMovement = (type: ManualMovementType | undefined): boolean => {
  if (!type) return false;
  return MANUAL_IN_MOVEMENT_TYPES.includes(
    type as (typeof MANUAL_IN_MOVEMENT_TYPES)[number],
  );
};

export function useStockMovementScanner({
  selectedMovementType,
  router,
  form,
  append,
  persistCurrentDraft,
  inlineProductBarcodeRef,
  itemQuantity,
  openExistingProductBatchForm,
  setAddItemError,
}: UseStockMovementScannerParams): StockMovementScannerReturn {
  const lastScannedBarcodeRef = useRef<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [missingProductBarcode, setMissingProductBarcode] = useState<string | null>(null);
  const [inlineDuplicateWarning, setInlineDuplicateWarning] = useState<string | null>(null);

  const findScannedProductBarcodeConflict = (
    barcode: string | null | undefined,
  ): string | null => {
    return getPendingInlineProductBarcodeConflictError(
      form.getValues("items"),
      barcode,
    );
  };

  const resolveScannerQuantity = (): number => {
    const qty = Number(itemQuantity);
    return qty > 0 ? qty : 1;
  };

  const navigateToInlineProductWithBarcode = async (
    barcode: string,
  ): Promise<void> => {
    if (!selectedMovementType) return;

    inlineProductBarcodeRef.current = barcode;
    await persistCurrentDraft(barcode);
    setIsScannerOpen(false);
    router.push(`/stock-movements/create/new-product?type=${selectedMovementType}`);
  };

  const appendScannedProduct = (product: StockMovementProductOption) => {
    const barcodeConflictError = findScannedProductBarcodeConflict(product.barcode);
    if (barcodeConflictError) {
      toast.error(barcodeConflictError);
      return;
    }

    if (isSelectedInMovement(selectedMovementType)) {
      setIsScannerOpen(false);
      openExistingProductBatchForm({
        productId: product.id,
        productName: product.name,
        quantity: "",
        manufacturedDate: "",
        expirationDate: "",
        costPrice: undefined,
        sellingPrice: undefined,
        editingIndex: null,
      });
      return;
    }

    if (hasExistingProductInItems(form.getValues("items"), product.id)) {
      toast.warning(`${product.name} já está na movimentação.`);
      return;
    }

    append({
      productId: product.id,
      productName: product.name,
      quantity: resolveScannerQuantity(),
    });
    toast.success(`${product.name} foi adicionado.`);
  };

  const showMissingProductToast = (barcode: string) => {
    if (!selectedMovementType) {
      toast.error(`Produto com código ${barcode} não existe.`);
      return;
    }

    const canCreateInline = MANUAL_IN_MOVEMENT_TYPES.includes(
      selectedMovementType as (typeof MANUAL_IN_MOVEMENT_TYPES)[number],
    );
    if (!canCreateInline) {
      toast.error(`Produto com código ${barcode} não existe.`);
      return;
    }

    setMissingProductBarcode(barcode);
  };

  const showPendingInlineProductWarning = (barcode: string): boolean => {
    const inlineItem = form.getValues("items").find((item) => {
      return item.newProductData?.barcode === barcode;
    });
    if (!inlineItem) return false;

    const productName =
      inlineItem.productName || inlineItem.newProductData?.name || "Produto";
    setInlineDuplicateWarning(
      `${productName} já está na movimentação como produto novo.`,
    );
    return true;
  };

  const handleInlineDuplicateWarningOpenChange = (open: boolean): void => {
    if (!open) setInlineDuplicateWarning(null);
  };

  const handleBarcodeScan = async (barcode: string) => {
    if (lastScannedBarcodeRef.current === barcode) return;
    lastScannedBarcodeRef.current = barcode;
    window.setTimeout(() => {
      lastScannedBarcodeRef.current = null;
    }, 1500);

    const lookup = await lookupStockMovementProductByBarcode(barcode);
    if (lookup.status === "found") {
      appendScannedProduct(lookup.product);
      return;
    }
    if (lookup.status === "not-found") {
      if (showPendingInlineProductWarning(barcode)) return;
      showMissingProductToast(barcode);
      return;
    }
    toast.error(lookup.message);
  };

  const handleMissingProductModalOpenChange = (open: boolean): void => {
    if (!open) {
      setMissingProductBarcode(null);
    }
  };

  const handleCreateProductFromMissingModal = async (): Promise<void> => {
    if (!missingProductBarcode) return;
    await navigateToInlineProductWithBarcode(missingProductBarcode);
    setMissingProductBarcode(null);
  };

  const handleCreateNewProduct = async (): Promise<void> => {
    setAddItemError(null);

    if (!selectedMovementType) {
      toast.warning("Selecione o tipo de movimentação antes de continuar.");
      router.replace("/stock-movements");
      return;
    }

    if (
      !MANUAL_IN_MOVEMENT_TYPES.includes(
        selectedMovementType as (typeof MANUAL_IN_MOVEMENT_TYPES)[number],
      )
    ) {
      setAddItemError(
        "Novos produtos só podem ser criados em movimentações de entrada.",
      );
      return;
    }

    inlineProductBarcodeRef.current = undefined;
    await persistCurrentDraft(undefined);
    router.push(`/stock-movements/create/new-product?type=${selectedMovementType}`);
  };

  const handleEditNewProductItem = async (index: number): Promise<void> => {
    if (!selectedMovementType) return;

    const item = form.getValues("items")[index];
    if (!item?.newProductData) return;

    inlineProductBarcodeRef.current = undefined;
    await persistCurrentDraft(undefined);
    router.push(
      `/stock-movements/create/new-product?type=${selectedMovementType}&editItem=${index}`,
    );
  };

  const handleEditExistingProductBatchData = (index: number): void => {
    if (!isSelectedInMovement(selectedMovementType)) return;
    const item = form.getValues("items")[index];
    if (!item?.productId || item.newProductData) return;

    openExistingProductBatchForm({
      productId: item.productId,
      productName: item.productName || "Produto",
      quantity: String(item.quantity),
      manufacturedDate: item.manufacturedDate || "",
      expirationDate: item.expirationDate || "",
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      editingIndex: index,
    });
  };

  return {
    isScannerOpen,
    setScannerOpen: setIsScannerOpen,
    onBarcodeScan: handleBarcodeScan,
    missingProductBarcode,
    onMissingProductModalOpenChange: handleMissingProductModalOpenChange,
    inlineDuplicateWarning,
    onInlineDuplicateWarningOpenChange: handleInlineDuplicateWarningOpenChange,
    onCreateProductFromMissingModal: handleCreateProductFromMissingModal,
    onCreateNewProduct: handleCreateNewProduct,
    onEditNewProductItem: handleEditNewProductItem,
    onEditExistingProductBatchData: handleEditExistingProductBatchData,
    appendScannedProduct,
  };
}
