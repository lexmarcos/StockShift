export interface StockMovementReloadGuardProps {
  isEnabled?: boolean;
}

export interface UseStockMovementReloadGuardModelParams {
  isEnabled?: boolean;
  reloadPage?: () => void;
}

export interface StockMovementReloadGuardViewProps {
  isConfirmOpen: boolean;
  onConfirmOpenChange: (open: boolean) => void;
  onCancelReload: () => void;
  onConfirmReload: () => void;
}
