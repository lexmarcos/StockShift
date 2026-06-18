import { describe, it, expect } from "vitest";
import { buildCategoryBadgeStyle, categoryNameToHexColor } from "./category-color";

const luminanceOf = (hex: string): number => {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

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

  it("returns light base colors readable as solid text on dark surfaces", () => {
    expect(luminanceOf(categoryNameToHexColor("Perfume Feminino"))).toBeGreaterThan(0.4);
    expect(luminanceOf(categoryNameToHexColor("Bebidas"))).toBeGreaterThan(0.4);
    expect(luminanceOf(categoryNameToHexColor("Eletrônicos"))).toBeGreaterThan(0.4);
  });

  it("returns fallback color for empty or null name", () => {
    expect(categoryNameToHexColor(null)).toBe("#A3A3A3");
    expect(categoryNameToHexColor("")).toBe("#A3A3A3");
    expect(categoryNameToHexColor("   ")).toBe("#A3A3A3");
  });
});

describe("buildCategoryBadgeStyle", () => {
  it("uses the solid base color for text and translucent variants for bg/border", () => {
    const base = categoryNameToHexColor("Bebidas");
    const style = buildCategoryBadgeStyle("Bebidas");

    expect(style.color).toBe(base);
    expect(style.backgroundColor).toMatch(/^rgba\(\d+, \d+, \d+, 0\.12\)$/);
    expect(style.borderColor).toMatch(/^rgba\(\d+, \d+, \d+, 0\.4\)$/);
  });

  it("derives bg and border from the same rgb as the base color", () => {
    const style = buildCategoryBadgeStyle("Bebidas");
    const rgb = (value: string) => value.match(/\d+, \d+, \d+/)?.[0];

    expect(rgb(style.backgroundColor)).toBe(rgb(style.borderColor));
  });
});
