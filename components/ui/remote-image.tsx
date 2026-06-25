"use client";

import Image, { type ImageProps } from "next/image";
import { isBackendThumbnailUrl } from "@/lib/thumbnails";

// Hosts the Next image optimizer is allowed to fetch. Must stay in sync with
// `images.remotePatterns` in next.config.ts — an optimized src on a host that
// is not whitelisted there makes /_next/image return 400.
const OPTIMIZABLE_HOST_SUFFIX = ".r2.dev";

// The optimizer can't fetch local object/data URLs, must not be pointed at hosts
// outside the allowlist, and we deliberately don't run SVGs through it. Those
// cases fall back to a plain <img> (unoptimized), which still renders fine.
function canOptimize(src: ImageProps["src"]): boolean {
  if (typeof src !== "string") return true; // static import → optimizable
  if (src.startsWith("blob:") || src.startsWith("data:")) return false;
  try {
    const url = new URL(src);
    // next.config remotePatterns only whitelists https R2; an http:// src would
    // make /_next/image return 400, so leave non-https URLs unoptimized.
    if (url.protocol !== "https:") return false;
    if (url.pathname.toLowerCase().endsWith(".svg")) return false;
    if (!url.hostname.endsWith(OPTIMIZABLE_HOST_SUFFIX)) return false;
    // Product thumbnails arrive pre-optimized from the backend (resized JPEG on
    // R2's CDN), so re-encoding them in the optimizer only burns server CPU. The
    // original upload has no thumbnail suffix, so it still gets optimized —
    // including when a product has no generated thumbnails yet.
    if (isBackendThumbnailUrl(src)) return false;
    return true;
  } catch {
    return false; // relative/unparseable path → leave as-is
  }
}

/**
 * Thin wrapper over next/image that decides `unoptimized` centrally from the
 * source, so callers don't sprinkle the flag and remote R2 images get resized
 * to their display size instead of decoded at full resolution. An explicit
 * `unoptimized` prop still wins.
 */
export function RemoteImage({ unoptimized, alt, ...props }: ImageProps) {
  return (
    <Image
      {...props}
      alt={alt}
      unoptimized={unoptimized ?? !canOptimize(props.src)}
    />
  );
}
