"use client";

import { useEffect, useRef, useState } from "react";
import type {
  StockMovementReloadGuardViewProps,
  UseStockMovementReloadGuardModelParams,
} from "./stock-movement-reload-guard.types";

const STOCK_MOVEMENT_RELOAD_WARNING =
  "Ao recarregar esta tela, o rascunho salvo será restaurado automaticamente.";

export const isStockMovementReloadShortcut = (
  event: KeyboardEvent,
): boolean => {
  const normalizedKey = event.key.toLowerCase();
  return (
    event.key === "F5" ||
    ((event.ctrlKey || event.metaKey) && normalizedKey === "r")
  );
};

export function useStockMovementReloadGuardModel(
  {
    isEnabled = true,
    reloadPage = () => window.location.reload(),
  }: UseStockMovementReloadGuardModelParams = {},
): StockMovementReloadGuardViewProps {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const isReloadConfirmedRef = useRef(false);

  useEffect(() => {
    if (!isEnabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent): string | void => {
      if (isReloadConfirmedRef.current) return;
      event.preventDefault();
      event.returnValue = STOCK_MOVEMENT_RELOAD_WARNING;
      return STOCK_MOVEMENT_RELOAD_WARNING;
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!isStockMovementReloadShortcut(event)) return;
      event.preventDefault();
      setIsConfirmOpen(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEnabled]);

  const handleCancelReload = (): void => {
    setIsConfirmOpen(false);
  };

  const handleConfirmReload = (): void => {
    isReloadConfirmedRef.current = true;
    setIsConfirmOpen(false);
    reloadPage();
  };

  return {
    isConfirmOpen,
    onConfirmOpenChange: setIsConfirmOpen,
    onCancelReload: handleCancelReload,
    onConfirmReload: handleConfirmReload,
  };
}
