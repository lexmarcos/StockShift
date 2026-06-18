"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DetectedBarcode } from "barcode-detector/ponyfill";
import {
  createBarcodeScannerCameraConstraints,
  getBarcodeScannerDeviceIds,
  shouldRetryBarcodeScannerCamera,
} from "@/components/product/barcode-scanner-camera";
import {
  BarcodeScannerErrorModal,
  formatBarcodeScannerError,
} from "@/components/product/barcode-scanner-error-modal";
import { useBarcodeDetectionLoop } from "@/components/product/use-barcode-detection-loop";
import { useBarcodeScannerStream } from "@/components/product/use-barcode-scanner-stream";
import type {
  BarcodeScannerDetectedCode,
  BarcodeScannerProps,
} from "@/components/product/barcode-scanner.types";

const BARCODE_SCANNER_DEVICE_REFRESH_DELAYS_MS = [750, 2500] as const;
const BARCODE_SCANNER_RESCAN_DELAY_MS = 1500;
const BARCODE_SCANNER_MAX_CAMERA_RETRIES = 4;

const toBarcodeScannerDetectedCode = (
  detectedBarcode: DetectedBarcode,
): BarcodeScannerDetectedCode => ({
  rawValue: detectedBarcode.rawValue,
  format: detectedBarcode.format,
});

const BarcodeScannerFinder = () => (
  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
    <div className="h-[45%] w-[80%] rounded-[4px] border-2 border-white/70" />
  </div>
);

export const BarcodeScanner = ({
  onScan,
  onError,
  styles,
  components,
}: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastScanRef = useRef({ value: "", scannedAt: 0 });
  const cameraRetryCountRef = useRef(0);
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

  const refreshCameraDevices = useCallback(async (): Promise<void> => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    const devices = await navigator.mediaDevices.enumerateDevices();
    setCameraDeviceIds(getBarcodeScannerDeviceIds(devices));
  }, []);

  const selectNextCameraConfiguration = useCallback(() => {
    if (cameraRetryCountRef.current >= BARCODE_SCANNER_MAX_CAMERA_RETRIES) return;

    cameraRetryCountRef.current += 1;
    setUsesCompatibleCamera(true);
    setCameraDeviceIndex((currentIndex) => {
      if (cameraDeviceIds.length < 2) return currentIndex;
      return (currentIndex + 1) % cameraDeviceIds.length;
    });
  }, [cameraDeviceIds.length]);

  const handleStreamStart = useCallback(() => {
    cameraRetryCountRef.current = 0;
    void refreshCameraDevices();
  }, [refreshCameraDevices]);

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

  const emitDetectedBarcodes = useCallback(
    (detectedBarcodes: DetectedBarcode[]) => {
      const scannedValue = detectedBarcodes[0]?.rawValue;
      if (!scannedValue) return;

      const scannedAt = Date.now();
      const lastScan = lastScanRef.current;
      const isRepeatedScan =
        scannedValue === lastScan.value &&
        scannedAt - lastScan.scannedAt < BARCODE_SCANNER_RESCAN_DELAY_MS;

      lastScanRef.current = { value: scannedValue, scannedAt };
      if (isRepeatedScan) return;

      onScan(detectedBarcodes.map(toBarcodeScannerDetectedCode));
    },
    [onScan],
  );

  useBarcodeScannerStream({
    videoRef,
    constraints: cameraConstraints,
    onStreamStart: handleStreamStart,
    onStreamError: handleScannerError,
  });

  useBarcodeDetectionLoop({ videoRef, onDetect: emitDetectedBarcodes });

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
      <div
        style={{
          position: "relative",
          width: "100%",
          overflow: "hidden",
          ...styles?.container,
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            ...styles?.video,
          }}
        />
        {components?.finder !== false && <BarcodeScannerFinder />}
      </div>
      <BarcodeScannerErrorModal
        content={scannerErrorContent}
        onClose={() => setScannerErrorContent(null)}
      />
    </>
  );
};
