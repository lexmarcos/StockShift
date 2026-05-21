import type { IScannerProps } from "@yudiel/react-qr-scanner";

type BarcodeScannerFormatList = NonNullable<IScannerProps["formats"]>;

type BarcodeScannerCameraOptions = {
  deviceId: string | null;
  usesCompatibleCamera: boolean;
};

type BarcodeScannerFocusPoint = {
  x: number;
  y: number;
};

type BarcodeScannerConstraintSet = MediaTrackConstraintSet & {
  focusMode?: string;
  pointsOfInterest?: BarcodeScannerFocusPoint[];
  zoom?: number;
};

const BARCODE_SCANNER_FOCUS_CONSTRAINTS: BarcodeScannerConstraintSet = {
  focusMode: "continuous",
  pointsOfInterest: [{ x: 0.5, y: 0.5 }],
  zoom: 2,
};

export const barcodeScannerFormats: BarcodeScannerFormatList = [
  "codabar",
  "code_128",
  "code_39",
  "code_93",
  "databar",
  "databar_expanded",
  "databar_limited",
  "ean_13",
  "ean_8",
  "itf",
  "upc_a",
  "upc_e",
];

export const barcodeScannerCameraConstraints: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 1280 },
  height: { ideal: 720 },
  advanced: [BARCODE_SCANNER_FOCUS_CONSTRAINTS],
};

export const barcodeScannerCompatibleCameraConstraints: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
};

const BARCODE_SCANNER_FRONT_CAMERA_PATTERN =
  /front|frontal|selfie|user|frente/i;

const BARCODE_SCANNER_BACK_CAMERA_PATTERN =
  /back|rear|environment|traseira|trasera|facing back/i;

const BARCODE_SCANNER_LOW_FOCUS_CAMERA_PATTERN =
  /depth|macro|tele|ultra|wide|0\.5/i;

const BARCODE_SCANNER_CAMERA_RETRY_ERROR_NAMES = new Set([
  "AbortError",
  "ConstraintNotSatisfiedError",
  "NotFoundError",
  "NotReadableError",
  "OverconstrainedError",
]);

type BarcodeScannerNamedError = {
  message?: string;
  name: string;
};

const removeFacingModeFromConstraints = (
  constraints: MediaTrackConstraints,
): MediaTrackConstraints => {
  const nextConstraints = { ...constraints };
  delete nextConstraints.facingMode;
  return nextConstraints;
};

const isBarcodeScannerNamedError = (
  error: unknown,
): error is BarcodeScannerNamedError => {
  if (typeof error !== "object" || error === null) return false;

  const errorCandidate = error as { message?: unknown; name?: unknown };
  return typeof errorCandidate.name === "string";
};

const getBarcodeScannerDeviceScore = (
  device: MediaDeviceInfo,
  index: number,
): number => {
  const label = device.label.toLowerCase();
  let score = 100 - index;

  if (BARCODE_SCANNER_BACK_CAMERA_PATTERN.test(label)) score += 50;
  if (BARCODE_SCANNER_FRONT_CAMERA_PATTERN.test(label)) score -= 100;
  if (BARCODE_SCANNER_LOW_FOCUS_CAMERA_PATTERN.test(label)) score -= 25;

  return score;
};

export const createBarcodeScannerCameraConstraints = ({
  deviceId,
  usesCompatibleCamera,
}: BarcodeScannerCameraOptions): MediaTrackConstraints => {
  const baseConstraints = usesCompatibleCamera
    ? barcodeScannerCompatibleCameraConstraints
    : barcodeScannerCameraConstraints;

  if (!deviceId) return baseConstraints;

  return {
    ...removeFacingModeFromConstraints(baseConstraints),
    deviceId: { exact: deviceId },
  };
};

export const getBarcodeScannerDeviceIds = (
  devices: MediaDeviceInfo[],
): string[] => {
  const videoDevices = devices.filter((device) => device.kind === "videoinput");
  const labeledDevices = videoDevices.filter((device) => device.label.length > 0);
  const candidateDevices = labeledDevices.filter(
    (device) => !BARCODE_SCANNER_FRONT_CAMERA_PATTERN.test(device.label),
  );

  return candidateDevices
    .sort(
      (firstDevice, secondDevice) =>
        getBarcodeScannerDeviceScore(secondDevice, videoDevices.indexOf(secondDevice)) -
        getBarcodeScannerDeviceScore(firstDevice, videoDevices.indexOf(firstDevice)),
    )
    .map((device) => device.deviceId)
    .filter((deviceId) => deviceId.length > 0);
};

export const shouldRetryBarcodeScannerCamera = (error: unknown): boolean => {
  if (!isBarcodeScannerNamedError(error)) return false;

  if (BARCODE_SCANNER_CAMERA_RETRY_ERROR_NAMES.has(error.name)) return true;

  return error.message?.toLowerCase().includes("timed out") ?? false;
};
