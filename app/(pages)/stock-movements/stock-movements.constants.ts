export const MANUAL_OUT_MOVEMENT_TYPES = [
  "USAGE",
  "GIFT",
  "LOSS",
  "DAMAGE",
  "ADJUSTMENT_OUT",
] as const;

export const MANUAL_IN_MOVEMENT_TYPES = [
  "PURCHASE_IN",
  "ADJUSTMENT_IN",
] as const;

export const MANUAL_MOVEMENT_TYPES = [
  ...MANUAL_OUT_MOVEMENT_TYPES,
  ...MANUAL_IN_MOVEMENT_TYPES,
] as const;

export type ManualMovementType = (typeof MANUAL_MOVEMENT_TYPES)[number];

export const MANUAL_MOVEMENT_TYPE_LABELS: Record<ManualMovementType, string> = {
  USAGE: "Uso",
  GIFT: "Presente",
  LOSS: "Perda",
  DAMAGE: "Dano",
  ADJUSTMENT_OUT: "Ajuste Saída",
  PURCHASE_IN: "Compra",
  ADJUSTMENT_IN: "Ajuste Entrada",
};

export const isManualMovementType = (
  type: string | null,
): type is ManualMovementType => {
  return MANUAL_MOVEMENT_TYPES.includes(type as ManualMovementType);
};
