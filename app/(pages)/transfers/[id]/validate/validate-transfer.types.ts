import { Transfer, DiscrepancyItem } from "../../transfers.types";

export interface ScannedItem {
  productName: string;
  batchCode: string;
  timestamp: Date;
  isSuccess: boolean;
  message?: string;
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
  transfer?: Transfer;
  scannedItems: ScannedItem[];
  expectedItems: ExpectedItem[];
  progress: number;
  lastScannedItem?: ScannedItem | null;
  
  onScan: (barcode: string) => void;
  onFinish: () => void;
  
  // Modal props for finish confirmation
  showFinishModal: boolean;
  setShowFinishModal: (show: boolean) => void;
  discrepancies: DiscrepancyItem[];
  onConfirmFinish: () => void;
  isFinishing: boolean;
}
