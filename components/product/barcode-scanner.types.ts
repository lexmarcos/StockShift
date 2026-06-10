import type { CSSProperties } from "react";

export interface BarcodeScannerDetectedCode {
  rawValue: string;
  format: string;
}

export interface BarcodeScannerStyles {
  container?: CSSProperties;
  video?: CSSProperties;
}

export interface BarcodeScannerComponents {
  finder?: boolean;
}

export interface BarcodeScannerProps {
  onScan: (detectedCodes: BarcodeScannerDetectedCode[]) => void;
  onError?: (error: unknown) => void;
  styles?: BarcodeScannerStyles;
  components?: BarcodeScannerComponents;
}
