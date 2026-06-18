import { describe, it, expect } from "vitest";
import { formatCents, formatCentsToBRL } from "./currency";

describe("formatCents", () => {
  it("formats cents into BRL currency", () => {
    expect(formatCents(2000)).toMatch(/R\$\s?20,00/);
  });

  it("formats zero", () => {
    expect(formatCents(0)).toMatch(/R\$\s?0,00/);
  });
});

describe("formatCentsToBRL", () => {
  it("formats cents into BRL currency", () => {
    expect(formatCentsToBRL(1050)).toMatch(/R\$\s?10,50/);
  });

  it("returns the default fallback for null cents", () => {
    expect(formatCentsToBRL(null)).toBe("-");
  });

  it("returns the default fallback for undefined cents", () => {
    expect(formatCentsToBRL(undefined)).toBe("-");
  });

  it("returns a custom fallback when provided", () => {
    expect(formatCentsToBRL(null, "Sem preço")).toBe("Sem preço");
    expect(formatCentsToBRL(undefined, "Sem preço")).toBe("Sem preço");
  });
});
