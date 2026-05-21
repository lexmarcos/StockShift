"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Scanner,
  type IScannerProps,
} from "@yudiel/react-qr-scanner";
import {
  barcodeScannerFormats,
  createBarcodeScannerCameraConstraints,
  getBarcodeScannerDeviceIds,
  shouldRetryBarcodeScannerCamera,
} from "@/components/product/barcode-scanner-camera";

type BarcodeScannerProps = Omit<IScannerProps, "constraints" | "formats">;

const BARCODE_SCANNER_DEVICE_REFRESH_DELAYS_MS = [750, 2500] as const;

export const BarcodeScanner = ({
  onError,
  onScan,
  ...scannerProps
}: BarcodeScannerProps) => {
  const [usesCompatibleCamera, setUsesCompatibleCamera] = useState(false);
  const [cameraDeviceIds, setCameraDeviceIds] = useState<string[]>([]);
  const [cameraDeviceIndex, setCameraDeviceIndex] = useState(0);

  const selectedCameraDeviceId = cameraDeviceIds[cameraDeviceIndex] ?? null;
  const cameraConstraints = useMemo(
    () =>
      createBarcodeScannerCameraConstraints({
        deviceId: selectedCameraDeviceId,
        usesCompatibleCamera,
      }),
    [selectedCameraDeviceId, usesCompatibleCamera],
  );

  const scannerKey = `${selectedCameraDeviceId ?? "environment"}:${
    usesCompatibleCamera ? "compatible" : "preferred"
  }`;

  const refreshCameraDevices = useCallback(async (): Promise<void> => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    const devices = await navigator.mediaDevices.enumerateDevices();
    setCameraDeviceIds(getBarcodeScannerDeviceIds(devices));
  }, []);

  const selectNextCameraConfiguration = useCallback(() => {
    setUsesCompatibleCamera(true);
    setCameraDeviceIndex((currentIndex) => {
      if (cameraDeviceIds.length < 2) return currentIndex;
      return (currentIndex + 1) % cameraDeviceIds.length;
    });
  }, [cameraDeviceIds.length]);

  const handleScannerError = useCallback(
    (error: unknown) => {
      if (shouldRetryBarcodeScannerCamera(error)) {
        selectNextCameraConfiguration();
      }

      void refreshCameraDevices();
      onError?.(error);
    },
    [onError, refreshCameraDevices, selectNextCameraConfiguration],
  );

  useEffect(() => {
    void refreshCameraDevices();

    const timeoutIds = BARCODE_SCANNER_DEVICE_REFRESH_DELAYS_MS.map((delay) =>
      window.setTimeout(() => void refreshCameraDevices(), delay),
    );

    return () => timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  }, [refreshCameraDevices]);

  useEffect(() => {
    setCameraDeviceIndex((currentIndex) => {
      if (currentIndex < cameraDeviceIds.length) return currentIndex;
      return 0;
    });
  }, [cameraDeviceIds.length]);

  return (
    <Scanner
      key={scannerKey}
      {...scannerProps}
      constraints={cameraConstraints}
      formats={barcodeScannerFormats}
      onScan={onScan}
      onError={handleScannerError}
    />
  );
};
