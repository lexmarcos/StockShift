import { Transfer } from "../transfers.types";

export interface TransferDetailViewProps {
  isLoading: boolean;
  error: Error | null;
  transfer?: Transfer;
  isSource: boolean;
  isDestination: boolean;
  isExecuting: boolean;
  isCancelling: boolean;
  isValidating: boolean;
  onExecute: () => void;
  onCancel: () => void;
  onStartValidation: () => void;
}
