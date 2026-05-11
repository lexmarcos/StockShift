import { describe, expect, it } from "vitest";
import {
  buildExistingProductBatchesUrl,
  buildExistingProductProfitSummary,
  buildExistingProductSalePriceSuggestion,
  buildExistingProductCostPriceSuggestion,
  findMostRecentWarehouseProductBatch,
  formatStockMovementBatchPrice,
} from "./stock-movement-batch-pricing.model";
import type { StockMovementProductBatchPriceSource } from "./create-stock-movement.types";

const olderProductBatch: StockMovementProductBatchPriceSource = {
  id: "batch-old",
  productId: "prod-1",
  productName: "Café Torrado",
  warehouseId: "wh-1",
  warehouseName: "Central",
  batchCode: "LOTE-OLD",
  quantity: 4,
  manufacturedDate: "2026-01-01",
  expirationDate: "2026-12-31",
  costPrice: 7250,
  sellingPrice: 12490,
  createdAt: "2026-01-10T10:00:00.000Z",
  updatedAt: "2026-01-10T10:00:00.000Z",
};

const newestProductBatch: StockMovementProductBatchPriceSource = {
  ...olderProductBatch,
  id: "batch-new",
  batchCode: "LOTE-NEW",
  sellingPrice: 12990,
  createdAt: "2026-03-10T10:00:00.000Z",
  updatedAt: "2026-03-10T10:00:00.000Z",
};

describe("stock movement batch pricing helpers", () => {
  it("monta endpoint de lotes por warehouse e produto", () => {
    expect(buildExistingProductBatchesUrl(" wh-1 ", " prod-1 ")).toBe(
      "batches/warehouses/wh-1/products/prod-1/batches",
    );
    expect(buildExistingProductBatchesUrl(null, "prod-1")).toBeNull();
    expect(buildExistingProductBatchesUrl("wh-1", " ")).toBeNull();
  });

  it("formata preço de centavos em BRL", () => {
    expect(formatStockMovementBatchPrice(12990)).toBe("R$\u00a0129,90");
  });

  it("encontra o lote mais recente pelo createdAt", () => {
    expect(
      findMostRecentWarehouseProductBatch([
        olderProductBatch,
        newestProductBatch,
      ])?.id,
    ).toBe("batch-new");
    expect(findMostRecentWarehouseProductBatch([])).toBeNull();
  });

  it("cria sugestão de venda somente quando o lote tem preço", () => {
    const suggestion = buildExistingProductSalePriceSuggestion(newestProductBatch);
    const batchWithoutSalePrice = { ...newestProductBatch, sellingPrice: null };

    expect(suggestion).toMatchObject({
      batchCode: "LOTE-NEW",
      priceCents: 12990,
      priceLabel: "R$\u00a0129,90",
    });
    expect(buildExistingProductSalePriceSuggestion(batchWithoutSalePrice)).toBeNull();
    expect(buildExistingProductSalePriceSuggestion(null)).toBeNull();
  });

  it("cria sugestão de custo somente quando o lote tem preço de custo", () => {
    const suggestion = buildExistingProductCostPriceSuggestion(newestProductBatch);
    const batchWithoutCostPrice = { ...newestProductBatch, costPrice: null };

    expect(suggestion).toMatchObject({
      batchCode: "LOTE-NEW",
      priceCents: 7250,
      priceLabel: "R$\u00a072,50",
    });
    expect(buildExistingProductCostPriceSuggestion(batchWithoutCostPrice)).toBeNull();
    expect(buildExistingProductCostPriceSuggestion(null)).toBeNull();
  });

  it("mantém resumo vazio quando preço ou quantidade estão incompletos", () => {
    expect(
      buildExistingProductProfitSummary({
        quantity: "10",
        costPrice: 7250,
      }),
    ).toMatchObject({
      kind: "incomplete",
      description: "Informe custo, venda e quantidade para calcular o lucro.",
    });
  });

  it("calcula lucro positivo pela venda, custo e quantidade atuais", () => {
    expect(
      buildExistingProductProfitSummary({
        quantity: "10",
        costPrice: 7250,
        sellingPrice: 12990,
      }),
    ).toMatchObject({
      kind: "profit",
      unitResultLabel: "R$\u00a057,40",
      marginLabel: "79,17%",
      totalResultLabel: "R$\u00a0574,00",
    });
  });

  it("calcula percentual de lucro sobre o custo unitário", () => {
    expect(
      buildExistingProductProfitSummary({
        quantity: "1",
        costPrice: 500,
        sellingPrice: 1000,
      }),
    ).toMatchObject({
      kind: "profit",
      unitResultLabel: "R$\u00a05,00",
      marginLabel: "100,00%",
    });
  });

  it("calcula estado neutro quando venda e custo são iguais", () => {
    expect(
      buildExistingProductProfitSummary({
        quantity: "3",
        costPrice: 1000,
        sellingPrice: 1000,
      }),
    ).toMatchObject({
      kind: "zero",
      title: "Margem zero",
      marginLabel: "0,00%",
      totalResultLabel: "R$\u00a00,00",
    });
  });

  it("calcula prejuízo quando venda fica abaixo do custo", () => {
    expect(
      buildExistingProductProfitSummary({
        quantity: "10",
        costPrice: 1000,
        sellingPrice: 900,
      }),
    ).toMatchObject({
      kind: "loss",
      title: "Atenção: venda abaixo do custo",
      unitResultCaption: "Prejuízo unitário",
      unitResultLabel: "R$\u00a01,00",
      totalResultLabel: "R$\u00a010,00",
    });
  });
});
