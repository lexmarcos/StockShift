import { Transfer, DiscrepancyItem } from "../../transfers.types";

export interface ValidateTransferViewProps {
  transfer: Transfer | null;
  isLoading: boolean;
  barcode: string;
  setBarcode: (value: string) => void;
  onScan: () => Promise<void>;
  isScanning: boolean;
  lastScanResult: ScanResult | null;
  onComplete: () => Promise<void>;
  isCompleting: boolean;
  showConfirmDialog: boolean;
  setShowConfirmDialog: (show: boolean) => void;
  discrepancies: DiscrepancyItem[];
  progress: { received: number; total: number };
}

export interface ScanResult {
  valid: boolean;
  message: string;
  warning: string | null;
  productName: string;
}
