const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const formatCents = (cents: number): string =>
  CURRENCY_FORMATTER.format(cents / 100);

export const formatCentsToBRL = (
  cents: number | null | undefined,
  fallback = "-",
): string => {
  if (cents === null || cents === undefined) return fallback;
  return formatCents(cents);
};
