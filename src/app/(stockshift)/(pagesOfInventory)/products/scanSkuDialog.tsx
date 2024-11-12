import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import ScannerBarCode from "./add-by-code/ScannerBarCode";
import { scannerFormats } from "./add-by-code/page";
import { IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { DialogProps } from "@radix-ui/react-dialog";

interface IScanSkuDialogProps extends DialogProps {
  onScanSku: (result: IDetectedBarcode[]) => void;
}

export default function ScanSkuDialog({
  onScanSku,
  ...props
}: IScanSkuDialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent>
        <ScannerBarCode
          formats={scannerFormats}
          onScan={(result) => onScanSku(result)}
        />
      </DialogContent>
    </Dialog>
  );
}
