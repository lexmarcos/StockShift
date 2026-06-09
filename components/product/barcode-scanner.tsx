"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Scanner,
  type IScannerProps,
} from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import {
  barcodeScannerFormats,
  createBarcodeScannerCameraConstraints,
  getBarcodeScannerDeviceIds,
  shouldRetryBarcodeScannerCamera,
} from "@/components/product/barcode-scanner-camera";

type BarcodeScannerProps = Omit<IScannerProps, "constraints" | "formats">;

const BARCODE_SCANNER_DEVICE_REFRESH_DELAYS_MS = [750, 2500] as const;

const formatBarcodeScannerError = (error: unknown): string => {
  if (error instanceof Error) {
    return JSON.stringify(
      {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      null,
      2,
    );
  }

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
};

export const BarcodeScanner = ({
  onError,
  onScan,
  ...scannerProps
}: BarcodeScannerProps) => {
  const [usesCompatibleCamera, setUsesCompatibleCamera] = useState(false);
  const [cameraDeviceIds, setCameraDeviceIds] = useState<string[]>([]);
  const [cameraDeviceIndex, setCameraDeviceIndex] = useState(0);
  const [scannerErrorContent, setScannerErrorContent] = useState<string | null>(null);

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
      setScannerErrorContent(formatBarcodeScannerError(error));

      if (shouldRetryBarcodeScannerCamera(error)) {
        selectNextCameraConfiguration();
      }

      void refreshCameraDevices();
      onError?.(error);
    },
    [onError, refreshCameraDevices, selectNextCameraConfiguration],
  );

  const handleCopyScannerError = useCallback((): void => {
    if (!scannerErrorContent) return;
    void navigator.clipboard?.writeText(scannerErrorContent);
  }, [scannerErrorContent]);

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
    <>
      <Scanner
        key={scannerKey}
        {...scannerProps}
        constraints={cameraConstraints}
        formats={barcodeScannerFormats}
        onScan={onScan}
        onError={handleScannerError}
      />
      <ResponsiveModal
        open={scannerErrorContent !== null}
        onOpenChange={(open) => !open && setScannerErrorContent(null)}
        title="Erro no leitor"
        description="Conteúdo capturado pelo leitor de código de barras."
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setScannerErrorContent(null)}
              className="h-10 w-full rounded-[4px] border-neutral-800 text-xs font-bold uppercase tracking-wide md:w-auto"
            >
              Fechar
            </Button>
            <Button
              type="button"
              onClick={handleCopyScannerError}
              className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 md:w-auto"
            >
              Copiar Conteúdo
            </Button>
          </>
        }
      >
        <pre className="max-h-[360px] overflow-auto rounded-[4px] border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-300 whitespace-pre-wrap">
          {scannerErrorContent}
        </pre>
      </ResponsiveModal>
    </>
  );
};
