import { describe, it, expect } from "vitest";
import { categoryNameToHexColor } from "./category-color";

describe("categoryNameToHexColor", () => {
  it("returns a deterministic hex color for the same category name", () => {
    const first = categoryNameToHexColor("Bebidas");
    const second = categoryNameToHexColor("Bebidas");
    expect(first).toBe(second);
    expect(first).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("returns different colors for different category names", () => {
    const beverages = categoryNameToHexColor("Bebidas");
    const electronics = categoryNameToHexColor("Eletrônicos");
    expect(beverages).not.toBe(electronics);
  });

  it("returns dark colors suitable for dark mode badges with white text", () => {
    const hex = categoryNameToHexColor("Perfume Feminino");
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    expect(luminance).toBeLessThan(0.55);
  });

  it("returns fallback color for empty or null name", () => {
    expect(categoryNameToHexColor(null)).toBe("#404040");
    expect(categoryNameToHexColor("")).toBe("#404040");
    expect(categoryNameToHexColor("   ")).toBe("#404040");
  });
});
