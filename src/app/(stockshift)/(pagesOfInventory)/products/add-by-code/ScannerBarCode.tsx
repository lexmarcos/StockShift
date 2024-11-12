import {
  IScannerProps,
  Scanner
} from "@yudiel/react-qr-scanner";
import styles from "./addByCode.module.css";
import { Info } from "lucide-react";

interface IScannerBarCodeProps extends IScannerProps {
  value?: string;
}

export default function ScannerBarCode({
  value,
  ...props
}: IScannerBarCodeProps) {
  return (
    <div className="w-full flex justify-center relative">
      <Scanner
        {...props}
        classNames={{ video: styles.video, container: styles.container }}
        components={{ finder: false }}
      />
      <div className={styles.value}>
        {value ? (
          <h1 className="mb-4 text-xl font-bold">{value}</h1>
        ) : (
          <div className="mb-4 text-xs text-zinc-300 flex items-center gap-1">
            <span>
              <Info size={12} />
            </span>
            <span>aponte a câmera para um código de barras</span>
          </div>
        )}
      </div>
    </div>
  );
}
