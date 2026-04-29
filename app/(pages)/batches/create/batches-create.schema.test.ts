import { describe, it, expect } from "vitest";
import { batchCreateSchema } from "./batches-create.schema";

const baseData = {
  productId: "prod-1",
  quantity: 1,
  manufacturedDate: "",
  expirationDate: "",
  notes: "",
};

const expectErrorPath = (
  result: { success: false; error: { issues: { path: (string | number)[]; message: string }[] } },
  path: string,
): void => {
  if (result.success) {
    throw new Error("Parsing esperado para falhar");
  }

  const issue = result.error.issues.find((entry) => entry.path[0] === path);
  expect(issue).toBeDefined();
  expect(issue?.path[0]).toBe(path);
};

describe("batchCreateSchema", () => {
  it("aceita lote com campos válidos e opcionais vazios", () => {
    const result = batchCreateSchema.safeParse(baseData);
    expect(result.success).toBe(true);
  });

  it("aceita data de validade sem data de fabricação", () => {
    const result = batchCreateSchema.safeParse({
      ...baseData,
      manufacturedDate: "",
      expirationDate: "2026-06-01",
    });
    expect(result.success).toBe(true);
  });

  it("aceita validade igual à fabricação", () => {
    const result = batchCreateSchema.safeParse({
      ...baseData,
      manufacturedDate: "2026-01-01",
      expirationDate: "2026-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita produto sem identificação", () => {
    const result = batchCreateSchema.safeParse({
      ...baseData,
      productId: "",
    });
    expect(result.success).toBe(false);
    expectErrorPath(result, "productId");
  });

  it("rejeita quantidade zero", () => {
    const result = batchCreateSchema.safeParse({
      ...baseData,
      quantity: 0,
    });
    expect(result.success).toBe(false);
    expectErrorPath(result, "quantity");
  });

  it("rejeita custo decimal", () => {
    const result = batchCreateSchema.safeParse({
      ...baseData,
      costPrice: 12.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita preço de venda decimal", () => {
    const result = batchCreateSchema.safeParse({
      ...baseData,
      sellingPrice: 19.9,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita validade anterior à fabricação", () => {
    const result = batchCreateSchema.safeParse({
      ...baseData,
      manufacturedDate: "2026-12-31",
      expirationDate: "2026-01-01",
      costPrice: 10,
      sellingPrice: 20,
    });
    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Parsing esperado para falhar");
    }

    const issue = result.error.issues.find(
      (entry) => entry.path[0] === "expirationDate",
    );
    expect(issue?.message).toBe("Validade deve ser após fabricação");
  });
});
