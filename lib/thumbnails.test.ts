import { describe, it, expect } from "vitest";
import { isBackendThumbnailUrl, resolveThumbnailUrl } from "./thumbnails";

describe("resolveThumbnailUrl", () => {
  it("returns the thumbnail for the requested size when present", () => {
    const source = {
      imageUrl: "https://cdn.r2.dev/original.webp",
      thumbnails: {
        sm: "https://cdn.r2.dev/p_sm.jpg",
        md: "https://cdn.r2.dev/p_md.jpg",
        lg: "https://cdn.r2.dev/p_lg.jpg",
      },
    };
    expect(resolveThumbnailUrl(source, "sm")).toBe("https://cdn.r2.dev/p_sm.jpg");
    expect(resolveThumbnailUrl(source, "lg")).toBe("https://cdn.r2.dev/p_lg.jpg");
  });

  it("falls back to the original imageUrl when the size is missing", () => {
    const source = {
      imageUrl: "https://cdn.r2.dev/original.webp",
      thumbnails: {},
    };
    expect(resolveThumbnailUrl(source, "md")).toBe(
      "https://cdn.r2.dev/original.webp",
    );
  });

  it("falls back to imageUrl when thumbnails is absent", () => {
    expect(
      resolveThumbnailUrl({ imageUrl: "https://cdn.r2.dev/original.webp" }, "sm"),
    ).toBe("https://cdn.r2.dev/original.webp");
  });

  it("returns null when there is no thumbnail and no imageUrl", () => {
    expect(resolveThumbnailUrl({ imageUrl: null, thumbnails: {} }, "lg")).toBeNull();
    expect(resolveThumbnailUrl({}, "md")).toBeNull();
  });
});

describe("isBackendThumbnailUrl", () => {
  it("detects sm/md/lg thumbnail filenames", () => {
    expect(isBackendThumbnailUrl("https://pub-x.r2.dev/products/uuid_sm.jpg")).toBe(true);
    expect(isBackendThumbnailUrl("https://pub-x.r2.dev/products/uuid_md.jpg")).toBe(true);
    expect(isBackendThumbnailUrl("https://pub-x.r2.dev/products/uuid_lg.jpg")).toBe(true);
  });

  it("ignores query strings after the filename", () => {
    expect(
      isBackendThumbnailUrl("https://pub-x.r2.dev/products/uuid_sm.jpg?v=2"),
    ).toBe(true);
  });

  it("returns false for the original upload and other images", () => {
    expect(isBackendThumbnailUrl("https://pub-x.r2.dev/products/uuid.webp")).toBe(false);
    expect(isBackendThumbnailUrl("https://pub-x.r2.dev/products/uuid.png")).toBe(false);
    expect(isBackendThumbnailUrl("https://pub-x.r2.dev/brands/logo_sm.png")).toBe(false);
  });

  it("returns false for empty/nullish input", () => {
    expect(isBackendThumbnailUrl(null)).toBe(false);
    expect(isBackendThumbnailUrl(undefined)).toBe(false);
    expect(isBackendThumbnailUrl("")).toBe(false);
  });
});
