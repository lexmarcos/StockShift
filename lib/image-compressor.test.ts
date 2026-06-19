import { describe, it, expect } from "vitest";
import { MAX_IMAGE_DIMENSION, scaledImageSize } from "./image-compressor";

describe("scaledImageSize", () => {
  it("leaves dimensions untouched when the longest side is within the limit", () => {
    expect(scaledImageSize(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("leaves dimensions untouched when exactly at the limit", () => {
    expect(scaledImageSize(MAX_IMAGE_DIMENSION, 900)).toEqual({
      width: MAX_IMAGE_DIMENSION,
      height: 900,
    });
  });

  it("scales a tall portrait photo down to the limit, preserving aspect ratio", () => {
    expect(scaledImageSize(3024, 4032)).toEqual({ width: 1200, height: 1600 });
  });

  it("scales a wide landscape photo down to the limit", () => {
    expect(scaledImageSize(4000, 2000)).toEqual({ width: 1600, height: 800 });
  });

  it("scales a square photo down to the limit on both sides", () => {
    expect(scaledImageSize(2000, 2000)).toEqual({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
    });
  });

  it("rounds fractional scaled dimensions to whole pixels", () => {
    // 2500 → ratio 1600/2500 = 0.64; 1333 * 0.64 = 853.12 → 853
    expect(scaledImageSize(2500, 1333)).toEqual({ width: 1600, height: 853 });
  });

  it("honors a custom max dimension", () => {
    expect(scaledImageSize(1000, 500, 200)).toEqual({ width: 200, height: 100 });
  });
});
