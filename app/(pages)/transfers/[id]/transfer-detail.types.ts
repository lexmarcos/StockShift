import { Transfer } from "../transfers.types";

export interface TransferDetailViewProps {
  transfer: Transfer | null;
  isLoading: boolean;
  error: Error | undefined;
  currentWarehouseId: string | null;
  isSource: boolean;
  isDestination: boolean;
  onExecute: () => Promise<void>;
  onStartValidation: () => Promise<void>;
  onCancel: (reason: string) => Promise<void>;
  isExecuting: boolean;
  isStartingValidation: boolean;
  isCancelling: boolean;
  showCancelDialog: boolean;
  setShowCancelDialog: (show: boolean) => void;
}
