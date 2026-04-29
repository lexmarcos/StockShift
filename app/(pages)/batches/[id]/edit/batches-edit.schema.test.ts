import { describe, it, expect } from "vitest";
import { batchEditSchema } from "./batches-edit.schema";

const baseData = {
  productId: "prod-1",
  warehouseId: "wh-1",
  quantity: 1,
  batchCode: "",
  manufacturedDate: "",
  expirationDate: "",
  notes: "",
};

describe("batchEditSchema price validation", () => {
  it("aceita datas opcionais sem validação adicional", () => {
    const result = batchEditSchema.safeParse({
      ...baseData,
      manufacturedDate: "",
      expirationDate: "",
      costPrice: 10,
      sellingPrice: 20,
    });
    expect(result.success).toBe(true);
  });

  it("aceita validade posterior à fabricação", () => {
    const result = batchEditSchema.safeParse({
      ...baseData,
      manufacturedDate: "2026-01-01",
      expirationDate: "2026-01-10",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita validade anterior à fabricação", () => {
    const result = batchEditSchema.safeParse({
      ...baseData,
      manufacturedDate: "2026-01-10",
      expirationDate: "2026-01-01",
      costPrice: 10,
      sellingPrice: 20,
    });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Parsing inesperado: validação de datas deveria falhar");
    }
    const dateIssue = result.error.issues.find(
      (issue) => issue.path[0] === "expirationDate",
    );
    expect(dateIssue?.message).toBe("Validade deve ser após fabricação");
  });

  it("rejects decimal cost price", () => {
    const result = batchEditSchema.safeParse({
      ...baseData,
      costPrice: 12.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects decimal selling price", () => {
    const result = batchEditSchema.safeParse({
      ...baseData,
      sellingPrice: 19.9,
    });
    expect(result.success).toBe(false);
  });
});
