import { describe, it, expect } from "vitest";
import { newTransferSchema, type NewTransferSchema } from "./new-transfer.schema";

const validUuid = "123e4567-e89b-12d3-a456-426614174000";

const baseTransferPayload: NewTransferSchema = {
  destinationWarehouseId: validUuid,
  notes: "",
  items: [
    {
      sourceBatchId: validUuid,
      quantity: 4,
      productName: "Leite",
      batchCode: "L-01",
      availableQuantity: 10,
    },
  ],
};

const expectErrorPath = (result: { success: false; error: { issues: { path: PropertyKey[] }[] } }, path: string): void => {
  if (result.success) {
    throw new Error("Parsing deveria falhar");
  }

  const issue = result.error.issues.find((entry) => entry.path[0] === path);
  expect(issue).toBeDefined();
  expect(issue?.path[0]).toBe(path);
};

describe("newTransferSchema", () => {
  it("aceita payload válido", () => {
    const result = newTransferSchema.safeParse(baseTransferPayload);
    expect(result.success).toBe(true);
  });

  it("rejeita payload sem destino válido", () => {
    const result = newTransferSchema.safeParse({
      ...baseTransferPayload,
      destinationWarehouseId: "",
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected parse failure");
    expectErrorPath(result, "destinationWarehouseId");
  });

  it("rejeita lista vazia de itens", () => {
    const result = newTransferSchema.safeParse({
      ...baseTransferPayload,
      items: [],
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected parse failure");
    expectErrorPath(result, "items");
  });

  it("rejeita lote com quantidade negativa ou zero", () => {
    const result = newTransferSchema.safeParse({
      ...baseTransferPayload,
      items: [
        {
          sourceBatchId: validUuid,
          quantity: 0,
        },
      ],
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected parse failure");
    expectErrorPath(result, "items");
  });

  it("aceita notas opcionais ausentes", () => {
    const result = newTransferSchema.safeParse({
      destinationWarehouseId: validUuid,
      items: [
        {
          sourceBatchId: validUuid,
          quantity: 1,
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
