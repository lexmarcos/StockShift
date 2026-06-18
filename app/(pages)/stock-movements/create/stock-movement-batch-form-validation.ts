import type { ExistingProductBatchFormState } from "./create-stock-movement.types";

export const getOptionalText = (value: string | undefined): string | undefined => {
  const trimmedValue = value?.trim();
  return trimmedValue || undefined;
};

const isBatchDateRangeInvalid = (
  manufacturedDate: string,
  expirationDate: string,
): boolean => {
  const optionalManufacturedDate = getOptionalText(manufacturedDate);
  const optionalExpirationDate = getOptionalText(expirationDate);
  if (!optionalManufacturedDate || !optionalExpirationDate) return false;
  return new Date(optionalExpirationDate) < new Date(optionalManufacturedDate);
};

export const validateExistingProductBatchForm = (
  form: ExistingProductBatchFormState,
): string | null => {
  const quantity = Number(form.quantity);
  if (!quantity || quantity <= 0) {
    return "Informe uma quantidade válida para o lote.";
  }
  if (form.costPrice === undefined || form.costPrice < 0) {
    return "Informe um preço de custo válido.";
  }
  if (form.sellingPrice === undefined || form.sellingPrice < 0) {
    return "Informe um preço de venda válido.";
  }
  if (isBatchDateRangeInvalid(form.manufacturedDate, form.expirationDate)) {
    return "A data de validade não pode ser anterior à data de fabricação.";
  }
  return null;
};
