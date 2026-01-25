import type { ComponentProps } from "react";
import { NumericFormat, type NumberFormatValues } from "react-number-format";
import { Input } from "./input";

export type NumberInputMode = "integer" | "float";

export type NumberInputProps = Omit<
  ComponentProps<typeof Input>,
  "value" | "defaultValue" | "type"
> & {
  value?: number;
  onValueChange?: (value?: number) => void;
  mode?: NumberInputMode;
};

export function NumberInput({
  value,
  onValueChange,
  inputMode,
  mode = "integer",
  ...props
}: NumberInputProps) {
  const isFloat = mode === "float";
  const decimalScale = isFloat ? 2 : 0;

  const displayValue =
    typeof value === "number" && value !== 0
      ? isFloat
        ? value.toFixed(2)
        : String(value)
      : undefined;

  const handleValueChange = (values: NumberFormatValues) => {
    if (values.value === "") {
      onValueChange?.(undefined);
      return;
    }

    const parsed = Number(values.value);
    if (!Number.isFinite(parsed)) return;

    onValueChange?.(parsed);
  };

  return (
    <NumericFormat
      {...props}
      type="text"
      value={displayValue}
      valueIsNumericString
      customInput={Input}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={decimalScale}
      fixedDecimalScale={isFloat}
      allowNegative={false}
      allowedDecimalSeparators={isFloat ? [".", ","] : []}
      inputMode={inputMode ?? (isFloat ? "decimal" : "numeric")}
      onValueChange={handleValueChange}
    />
  );
}
