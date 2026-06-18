"use client";

import { useEffect, type RefObject } from "react";
import {
  BarcodeDetector,
  type DetectedBarcode,
} from "barcode-detector/ponyfill";
import { barcodeScannerFormats } from "@/components/product/barcode-scanner-camera";

type BarcodeDetectionLoopOptions = {
  videoRef: RefObject<HTMLVideoElement | null>;
  onDetect: (detectedBarcodes: DetectedBarcode[]) => void;
};

const BARCODE_DETECTION_MAX_FRAME_WIDTH_PX = 640;
const BARCODE_DETECTION_VERTICAL_CROP_RATIO = 0.6;

const canDetectFromVideo = (video: HTMLVideoElement | null): video is HTMLVideoElement =>
  video !== null &&
  video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
  video.videoWidth > 0;

const cropBarcodeDetectionFrame = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): ImageData | null => {
  const sourceHeight = video.videoHeight * BARCODE_DETECTION_VERTICAL_CROP_RATIO;
  const sourceTop = (video.videoHeight - sourceHeight) / 2;
  const scale = Math.min(1, BARCODE_DETECTION_MAX_FRAME_WIDTH_PX / video.videoWidth);

  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(sourceHeight * scale);

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(
    video,
    0,
    sourceTop,
    video.videoWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return context.getImageData(0, 0, canvas.width, canvas.height);
};

export const useBarcodeDetectionLoop = ({
  videoRef,
  onDetect,
}: BarcodeDetectionLoopOptions): void => {
  useEffect(() => {
    const detector = new BarcodeDetector({ formats: barcodeScannerFormats });
    const frameCanvas = document.createElement("canvas");
    let isCancelled = false;

    const detectCurrentFrame = async (): Promise<void> => {
      const video = videoRef.current;
      if (!canDetectFromVideo(video)) return;

      try {
        const frame = cropBarcodeDetectionFrame(video, frameCanvas);
        if (!frame) return;

        const detectedBarcodes = await detector.detect(frame);
        if (detectedBarcodes.length > 0 && !isCancelled) onDetect(detectedBarcodes);
      } catch {
        // Frames podem falhar durante troca de câmera; o loop continua.
      }
    };

    const runDetectionLoop = (): void => {
      if (isCancelled) return;
      void detectCurrentFrame().finally(() =>
        window.requestAnimationFrame(runDetectionLoop),
      );
    };

    runDetectionLoop();
    return () => {
      isCancelled = true;
    };
  }, [onDetect, videoRef]);
};
