// Product thumbnail helpers. The backend generates three fixed-width JPEG
// thumbnails per product so the frontend never has to download the original
// (multi-MB) image in lists, cards and previews. See docs/THUMBNAILS.md.
//
//   sm = 150px  → dense lists, autocomplete, miniatures
//   md = 400px  → product cards, main grid
//   lg = 800px  → detail / preview when a product is selected
//
// The original `imageUrl` is kept separate (full resolution, original format)
// for zoom/download and is never replaced by a thumbnail.
export type ThumbnailSize = "sm" | "md" | "lg";

// The `thumbnails` map is always sent on ProductResponse but can be empty (`{}`)
// when the product has no image, or its thumbnails were never generated, so
// every size must be treated as optional.
export type ProductThumbnails = Partial<Record<ThumbnailSize, string>>;

export interface ThumbnailSource {
  imageUrl?: string | null;
  thumbnails?: ProductThumbnails | null;
}

/**
 * Resolves the URL to display for a product image at the requested size:
 * the matching thumbnail when present, otherwise the original `imageUrl`,
 * otherwise `null`. Centralizes the "thumbnails may be empty" guard so callers
 * don't each re-implement the fallback chain.
 */
export const resolveThumbnailUrl = (
  source: ThumbnailSource,
  size: ThumbnailSize,
): string | null => source.thumbnails?.[size] ?? source.imageUrl ?? null;

// Backend thumbnail filenames end in `_sm.jpg` / `_md.jpg` / `_lg.jpg`. The
// original upload is stored as `{uuid}.{ext}`, so it never matches — letting us
// tell a pre-optimized thumbnail apart from an original (or the no-thumbnail
// fallback) purely from the URL.
const THUMBNAIL_FILENAME = /_(sm|md|lg)\.jpg$/i;

/**
 * True when `url` points at a backend-generated product thumbnail. These are
 * already resized and JPEG-compressed by the API and served from R2's CDN, so
 * there is no value in running them through an image optimizer again.
 */
export const isBackendThumbnailUrl = (
  url: string | null | undefined,
): boolean => {
  if (!url) return false;
  try {
    return THUMBNAIL_FILENAME.test(new URL(url).pathname);
  } catch {
    return THUMBNAIL_FILENAME.test(url);
  }
};
