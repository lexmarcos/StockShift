import { DiscrepancyItem } from "../../transfers.types";

export interface ScanResultItem {
  valid: boolean;
  message: string;
  productName: string;
  productBarcode: string;
  quantitySent: number;
  quantityReceived: number;
}

export interface ExpectedItem {
  id: string;
  productName: string;
  batchCode: string;
  expectedQuantity: number;
  scannedQuantity: number;
}

export interface ValidateTransferViewProps {
  isLoading: boolean;
  isProcessing: boolean;
  transfer?: import("../../transfers.types").Transfer;
  expectedItems: ExpectedItem[];
  progress: number;
  lastScanResult: ScanResultItem | null;

  barcode: string;
  onBarcodeChange: (value: string) => void;
  onScan: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;

  onFinish: () => void;

  showFinishModal: boolean;
  setShowFinishModal: (show: boolean) => void;
  discrepancies: DiscrepancyItem[];
  onConfirmFinish: () => void;
  isFinishing: boolean;
}
