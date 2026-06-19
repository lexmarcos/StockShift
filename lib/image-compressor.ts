export const MAX_IMAGE_DIMENSION = 1600;

// WebP files under this size are already well compressed; re-encoding them
// rarely helps and just costs CPU.
const SKIP_WEBP_UNDER_BYTES = 100 * 1024;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/webp": ".webp",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

/**
 * Scales dimensions down so the longest side is at most `maxDimension`,
 * preserving aspect ratio. Returns the input unchanged when already small.
 * Keeping the stored resolution sane is what bounds the browser's decoded
 * bitmap memory (decode cost is intrinsic pixels, not the CSS box).
 */
export function scaledImageSize(
  width: number,
  height: number,
  maxDimension: number = MAX_IMAGE_DIMENSION
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) return { width, height };
  const ratio = maxDimension / longest;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Compresses an image file: downscales to MAX_IMAGE_DIMENSION and re-encodes
 * to whichever of WebP/JPEG is smaller.
 *
 * Example: `await compressImage(file, 0.7)` turns a 3.3MB phone photo into a
 * ~200KB WebP. Decoding goes through `createImageBitmap` (not a base64 data
 * URL) so large mobile photos don't blow up memory and silently fall back to
 * the original — the bug that let full-size images reach the bucket.
 */
export async function compressImage(
  file: File,
  quality: number = 0.7
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/webp" && file.size < SKIP_WEBP_UNDER_BYTES) return file;

  const decoded = await decodeImage(file);
  try {
    const { width, height } = scaledImageSize(decoded.width, decoded.height);
    const wasScaled = width !== decoded.width || height !== decoded.height;
    const blob = await encodeSmallest(decoded.source, width, height, quality);
    if (!blob) return file;

    const compressed = blobToFile(blob, file.name);
    // A downscaled image always wins (smaller dimensions are the point);
    // otherwise keep whichever is smaller in bytes.
    return wasScaled || compressed.size < file.size ? compressed : file;
  } finally {
    decoded.release();
  }
}

async function decodeImage(file: File): Promise<DecodedImage> {
  // createImageBitmap decodes straight from the blob (no multi-MB base64
  // string) and is far more memory-efficient than <img> + data URL, which is
  // what large iOS/Android photos choke on. `from-image` bakes EXIF rotation
  // in so portrait photos aren't re-encoded sideways.
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // Safari < 17 rejects the options bag; fall back to the <img> path.
    }
  }
  return decodeViaImageElement(file);
}

async function decodeViaImageElement(file: File): Promise<DecodedImage> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(url);
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to decode image from object URL: ${url}`));
    img.src = url;
  });
}

async function encodeSmallest(
  source: CanvasImageSource,
  width: number,
  height: number,
  quality: number
): Promise<Blob | null> {
  const canvas = drawToCanvas(source, width, height);
  const webp = await encodeCanvas(canvas, "image/webp", quality);
  // Normal path: trust a real WebP. Re-encoding to JPEG to shave bytes would
  // silently flatten alpha on transparent PNGs (product cutouts, logos).
  if (webp && webp.type === "image/webp") return webp;
  // Browser ignored the WebP request (older Safari returns PNG or null). Fall
  // back to JPEG and keep whichever is smaller.
  const jpeg = await encodeCanvas(canvas, "image/jpeg", quality);
  return smallerBlob(webp, jpeg);
}

function drawToCanvas(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(`Canvas 2D context unavailable for ${width}x${height} target`);
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

function encodeCanvas(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), type, quality));
}

function smallerBlob(a: Blob | null, b: Blob | null): Blob | null {
  if (a && b) return a.size <= b.size ? a : b;
  return a ?? b;
}

function blobToFile(blob: Blob, originalName: string): File {
  const extension = EXTENSION_BY_TYPE[blob.type] ?? ".img";
  const baseName = originalName.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}${extension}`, { type: blob.type });
}
