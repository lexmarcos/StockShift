import { describe, expect, it } from "vitest";
import {
  getOptionalText,
  validateExistingProductBatchForm,
} from "./stock-movement-batch-form-validation";
import type { ExistingProductBatchFormState } from "./create-stock-movement.types";

const createBatchForm = (
  overrides: Partial<ExistingProductBatchFormState> = {},
): ExistingProductBatchFormState => ({
  isOpen: true,
  productId: "p-1",
  productName: "Café Torrado",
  quantity: "2",
  manufacturedDate: "",
  expirationDate: "",
  costPrice: 1290,
  sellingPrice: 2490,
  editingIndex: null,
  error: null,
  ...overrides,
});

describe("getOptionalText", () => {
  it("retorna undefined para texto vazio ou só com espaços", () => {
    expect(getOptionalText(undefined)).toBeUndefined();
    expect(getOptionalText("")).toBeUndefined();
    expect(getOptionalText("   ")).toBeUndefined();
  });

  it("retorna o texto aparado quando preenchido", () => {
    expect(getOptionalText(" 2026-01-01 ")).toBe("2026-01-01");
  });
});

describe("validateExistingProductBatchForm", () => {
  it("aceita formulário completo sem datas", () => {
    expect(validateExistingProductBatchForm(createBatchForm())).toBeNull();
  });

  it("exige quantidade positiva", () => {
    expect(
      validateExistingProductBatchForm(createBatchForm({ quantity: "0" })),
    ).toBe("Informe uma quantidade válida para o lote.");
    expect(
      validateExistingProductBatchForm(createBatchForm({ quantity: "" })),
    ).toBe("Informe uma quantidade válida para o lote.");
  });

  it("exige preço de custo válido", () => {
    expect(
      validateExistingProductBatchForm(createBatchForm({ costPrice: undefined })),
    ).toBe("Informe um preço de custo válido.");
    expect(
      validateExistingProductBatchForm(createBatchForm({ costPrice: -1 })),
    ).toBe("Informe um preço de custo válido.");
  });

  it("exige preço de venda válido", () => {
    expect(
      validateExistingProductBatchForm(
        createBatchForm({ sellingPrice: undefined }),
      ),
    ).toBe("Informe um preço de venda válido.");
  });

  it("rejeita validade anterior à fabricação", () => {
    expect(
      validateExistingProductBatchForm(
        createBatchForm({
          manufacturedDate: "2026-06-01",
          expirationDate: "2026-01-01",
        }),
      ),
    ).toBe("A data de validade não pode ser anterior à data de fabricação.");
  });

  it("aceita intervalo de datas válido", () => {
    expect(
      validateExistingProductBatchForm(
        createBatchForm({
          manufacturedDate: "2026-01-01",
          expirationDate: "2026-06-01",
        }),
      ),
    ).toBeNull();
  });
});
