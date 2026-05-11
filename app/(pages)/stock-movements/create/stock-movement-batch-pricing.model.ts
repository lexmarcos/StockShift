import type {
  ExistingProductProfitSummary,
  ExistingProductPriceSuggestion,
  StockMovementProductBatchPriceSource,
} from "./create-stock-movement.types";

interface ExistingProductProfitSummaryInput {
  quantity: string;
  costPrice?: number;
  sellingPrice?: number;
}

interface ResolvedProfitValues {
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  unitDifference: number;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const buildExistingProductBatchesUrl = (
  warehouseId: string | null | undefined,
  productId: string | null | undefined,
): string | null => {
  const sanitizedWarehouseId = warehouseId?.trim();
  const sanitizedProductId = productId?.trim();
  if (!sanitizedWarehouseId || !sanitizedProductId) return null;
  const encodedWarehouseId = encodeURIComponent(sanitizedWarehouseId);
  const encodedProductId = encodeURIComponent(sanitizedProductId);
  return [
    `batches/warehouses/${encodedWarehouseId}`,
    `products/${encodedProductId}/batches`,
  ].join("/");
};

export const formatStockMovementBatchPrice = (cents: number): string => {
  return currencyFormatter.format(cents / 100);
};

export const findMostRecentWarehouseProductBatch = (
  batches: StockMovementProductBatchPriceSource[],
): StockMovementProductBatchPriceSource | null => {
  if (batches.length === 0) return null;
  return [...batches].sort((firstBatch, secondBatch) => {
    return getBatchCreatedTime(secondBatch) - getBatchCreatedTime(firstBatch);
  })[0];
};

export const buildExistingProductSalePriceSuggestion = (
  batch: StockMovementProductBatchPriceSource | null,
): ExistingProductPriceSuggestion | null => {
  if (!batch || batch.sellingPrice === null) return null;
  return {
    batchCode: batch.batchCode?.trim() || batch.id,
    createdAtLabel: formatBatchCreatedAt(batch.createdAt),
    priceCents: batch.sellingPrice,
    priceLabel: formatStockMovementBatchPrice(batch.sellingPrice),
  };
};

export const buildExistingProductCostPriceSuggestion = (
  batch: StockMovementProductBatchPriceSource | null,
): ExistingProductPriceSuggestion | null => {
  if (!batch || batch.costPrice === null) return null;
  return {
    batchCode: batch.batchCode?.trim() || batch.id,
    createdAtLabel: formatBatchCreatedAt(batch.createdAt),
    priceCents: batch.costPrice,
    priceLabel: formatStockMovementBatchPrice(batch.costPrice),
  };
};

export const buildExistingProductProfitSummary = ({
  quantity,
  costPrice,
  sellingPrice,
}: ExistingProductProfitSummaryInput): ExistingProductProfitSummary => {
  const profitValues = resolveProfitValues({
    quantity,
    costPrice,
    sellingPrice,
  });
  if (!profitValues) return buildIncompleteProfitSummary();
  if (profitValues.unitDifference < 0) {
    return buildLossProfitSummary(profitValues);
  }
  if (profitValues.unitDifference === 0) {
    return buildZeroProfitSummary(profitValues);
  }
  return buildPositiveProfitSummary(profitValues);
};

const getBatchCreatedTime = (
  batch: StockMovementProductBatchPriceSource,
): number => {
  const timestamp = new Date(batch.createdAt).getTime();
  if (Number.isFinite(timestamp)) return timestamp;
  return 0;
};

const formatBatchCreatedAt = (createdAt: string): string => {
  const timestamp = new Date(createdAt).getTime();
  if (!Number.isFinite(timestamp)) return createdAt;
  return new Intl.DateTimeFormat("pt-BR").format(new Date(timestamp));
};

const resolveProfitValues = ({
  quantity,
  costPrice,
  sellingPrice,
}: ExistingProductProfitSummaryInput): ResolvedProfitValues | null => {
  const numericQuantity = Number(quantity) || 0;
  if (
    costPrice === undefined ||
    sellingPrice === undefined ||
    Number.isNaN(costPrice) ||
    Number.isNaN(sellingPrice)
  ) {
    return null;
  }

  return {
    quantity: numericQuantity,
    costPrice,
    sellingPrice,
    unitDifference: sellingPrice - costPrice,
  };
};

const buildIncompleteProfitSummary = (): ExistingProductProfitSummary => ({
  kind: "incomplete",
  title: "Resumo de lucro",
  description: "Informe custo, venda e quantidade para calcular o lucro.",
});

const buildLossProfitSummary = ({
  costPrice,
  sellingPrice,
  quantity,
}: ResolvedProfitValues): ExistingProductProfitSummary => {
  const unitLoss = costPrice - sellingPrice;
  return buildResolvedProfitSummary("loss", costPrice, sellingPrice, {
    unitResultCaption: "Prejuízo unitário",
    unitResultLabel: formatStockMovementBatchPrice(unitLoss),
    totalResultCaption: "Prejuízo estimado neste lote",
    totalResultLabel: formatStockMovementBatchPrice(unitLoss * quantity),
    title: "Atenção: venda abaixo do custo",
  });
};

const buildZeroProfitSummary = ({
  costPrice,
  sellingPrice,
}: ResolvedProfitValues): ExistingProductProfitSummary => {
  return buildResolvedProfitSummary("zero", costPrice, sellingPrice, {
    unitResultCaption: "Lucro unitário",
    unitResultLabel: formatStockMovementBatchPrice(0),
    totalResultCaption: "Lucro estimado neste lote",
    totalResultLabel: formatStockMovementBatchPrice(0),
    title: "Margem zero",
  });
};

const buildPositiveProfitSummary = ({
  costPrice,
  sellingPrice,
  quantity,
  unitDifference,
}: ResolvedProfitValues): ExistingProductProfitSummary => {
  return buildResolvedProfitSummary("profit", costPrice, sellingPrice, {
    unitResultCaption: "Lucro unitário",
    unitResultLabel: formatStockMovementBatchPrice(unitDifference),
    totalResultCaption: "Lucro estimado neste lote",
    totalResultLabel: formatStockMovementBatchPrice(unitDifference * quantity),
    title: "Resumo de lucro",
  });
};

const buildResolvedProfitSummary = (
  kind: "profit" | "zero" | "loss",
  costPrice: number,
  sellingPrice: number,
  result: Pick<
    ExistingProductProfitSummary,
    | "title"
    | "unitResultCaption"
    | "unitResultLabel"
    | "totalResultCaption"
    | "totalResultLabel"
  >,
): ExistingProductProfitSummary => ({
  kind,
  ...result,
  costPriceLabel: formatStockMovementBatchPrice(costPrice),
  sellingPriceLabel: formatStockMovementBatchPrice(sellingPrice),
  marginLabel: formatProfitMargin(sellingPrice - costPrice, costPrice),
});

const formatProfitMargin = (
  unitDifference: number,
  costPrice: number,
): string => {
  if (costPrice === 0 && unitDifference !== 0) return "Indefinida";
  if (costPrice === 0) return "0,00%";
  const margin = (unitDifference / costPrice) * 100;
  return `${margin.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
};
