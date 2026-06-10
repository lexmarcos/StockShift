import { useCallback, useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import type { CreateStockMovementSchema } from "./create-stock-movement.schema";
import type { ManualMovementType } from "../stock-movements.constants";
import {
  isStockMovementDraftRecoveredFromPreviousRuntime,
  readStockMovementDraft,
  writeStockMovementDraft,
} from "./create-stock-movement.storage";
import type { WritableStockMovementDraft } from "./create-stock-movement.storage";

interface StockMovementDraftRestoredData {
  selectedProductId: string;
  itemQuantity: string;
}

interface StockMovementDraftPersistenceParams {
  form: UseFormReturn<CreateStockMovementSchema>;
  selectedMovementType: ManualMovementType | undefined;
  warehouseId: string | null;
  selectedProductId: string;
  itemQuantity: string;
  onDraftRestored: (data: StockMovementDraftRestoredData) => void;
}

interface StockMovementDraftPersistence {
  isDraftHydrated: boolean;
  persistCurrentDraft: (inlineProductBarcode?: string) => Promise<void>;
  inlineProductBarcodeRef: React.MutableRefObject<string | undefined>;
  resetDraftRevision: () => void;
}

export function useStockMovementDraftPersistence({
  form,
  selectedMovementType,
  warehouseId,
  selectedProductId,
  itemQuantity,
  onDraftRestored,
}: StockMovementDraftPersistenceParams): StockMovementDraftPersistence {
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);
  const inlineProductBarcodeRef = useRef<string | undefined>(undefined);
  const draftRevisionRef = useRef(0);
  const persistQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let isMounted = true;

    const hydrateDraft = async (): Promise<void> => {
      if (!selectedMovementType) {
        setIsDraftHydrated(true);
        return;
      }

      const draft = await readStockMovementDraft();
      if (!isMounted) return;

      draftRevisionRef.current = draft?.revision ?? 0;
      if (draft?.type === selectedMovementType && draft.warehouseId === warehouseId) {
        form.reset({
          type: draft.type,
          notes: draft.notes,
          items: draft.items,
        });
        onDraftRestored({
          selectedProductId: draft.selectedProductId,
          itemQuantity: draft.itemQuantity,
        });
        inlineProductBarcodeRef.current = draft.inlineProductBarcode;
        if (isStockMovementDraftRecoveredFromPreviousRuntime(draft)) {
          toast.success("Rascunho da movimentação restaurado.");
        }
      }

      setIsDraftHydrated(true);
    };

    void hydrateDraft();
    return () => {
      isMounted = false;
    };
  }, [form, selectedMovementType, warehouseId, onDraftRestored]);

  const buildCurrentDraft = useCallback(
    (inlineProductBarcode = inlineProductBarcodeRef.current): WritableStockMovementDraft | null => {
      if (!selectedMovementType) return null;
      return {
        type: selectedMovementType,
        warehouseId,
        notes: form.getValues("notes") || "",
        items: form.getValues("items"),
        selectedProductId,
        itemQuantity,
        inlineProductBarcode,
      };
    },
    [form, itemQuantity, selectedMovementType, selectedProductId, warehouseId],
  );

  const persistCurrentDraft = useCallback(
    (inlineProductBarcode = inlineProductBarcodeRef.current): Promise<void> => {
      const draft = buildCurrentDraft(inlineProductBarcode);
      if (!draft) return Promise.resolve();

      const queuedWrite = persistQueueRef.current.then(async () => {
        const writeResult = await writeStockMovementDraft(
          draft,
          draftRevisionRef.current,
        );
        draftRevisionRef.current = writeResult.revision;
      });
      persistQueueRef.current = queuedWrite.catch(() => undefined);
      return queuedWrite;
    },
    [buildCurrentDraft],
  );

  useEffect(() => {
    if (!isDraftHydrated || !selectedMovementType) return;
    void persistCurrentDraft();
  }, [
    isDraftHydrated,
    itemQuantity,
    persistCurrentDraft,
    selectedMovementType,
    selectedProductId,
  ]);

  useEffect(() => {
    if (!isDraftHydrated || !selectedMovementType) return;

    const subscription = form.watch((_value, { name }) => {
      if (!name || (name !== "notes" && !name.startsWith("items"))) return;
      void persistCurrentDraft();
    });

    return () => subscription.unsubscribe();
  }, [form, isDraftHydrated, persistCurrentDraft, selectedMovementType]);

  useEffect(() => {
    if (!isDraftHydrated || !selectedMovementType) return;

    const persistBeforePageHide = (): void => {
      void persistCurrentDraft();
    };
    const persistBeforeVisibilityLoss = (): void => {
      if (document.visibilityState !== "hidden") return;
      void persistCurrentDraft();
    };

    window.addEventListener("pagehide", persistBeforePageHide);
    document.addEventListener("visibilitychange", persistBeforeVisibilityLoss);
    return () => {
      window.removeEventListener("pagehide", persistBeforePageHide);
      document.removeEventListener(
        "visibilitychange",
        persistBeforeVisibilityLoss,
      );
    };
  }, [isDraftHydrated, persistCurrentDraft, selectedMovementType]);

  const resetDraftRevision = useCallback((): void => {
    draftRevisionRef.current = 0;
  }, []);

  return {
    isDraftHydrated,
    persistCurrentDraft,
    inlineProductBarcodeRef,
    resetDraftRevision,
  };
}
