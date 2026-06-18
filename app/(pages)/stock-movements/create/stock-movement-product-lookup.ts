import { api, isApiNotFoundError } from "@/lib/api";
import type { StockMovementProductOption } from "./create-stock-movement.types";

interface StockMovementProductByBarcodeResponse {
  success: boolean;
  data: StockMovementProductOption;
}

export type StockMovementBarcodeLookup =
  | { status: "found"; product: StockMovementProductOption }
  | { status: "not-found" }
  | { status: "error"; message: string };

const buildBarcodeLookupErrorMessage = (
  barcode: string,
  error: unknown,
): string => {
  const detail = error instanceof Error && error.message ? ` (${error.message})` : "";
  return `Não foi possível consultar o código ${barcode}${detail}. Verifique a conexão e tente novamente.`;
};

export const lookupStockMovementProductByBarcode = async (
  barcode: string,
): Promise<StockMovementBarcodeLookup> => {
  try {
    const response = await api
      .get(`products/barcode/${encodeURIComponent(barcode)}`)
      .json<StockMovementProductByBarcodeResponse>();
    return { status: "found", product: response.data };
  } catch (error) {
    if (isApiNotFoundError(error)) return { status: "not-found" };
    return {
      status: "error",
      message: buildBarcodeLookupErrorMessage(barcode, error),
    };
  }
};
