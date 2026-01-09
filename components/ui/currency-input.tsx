import type { ComponentProps } from "react";
import { NumericFormat, type NumberFormatValues } from "react-number-format";
import { Input } from "./input";

export type CurrencyInputProps = Omit<
  ComponentProps<typeof Input>,
  "value" | "defaultValue" | "type"
> & {
  value?: number;
  onValueChange?: (value?: number) => void;
};

export function CurrencyInput({
  value,
  onValueChange,
  inputMode,
  ...props
}: CurrencyInputProps) {
  const displayValue =
    typeof value === "number" ? (value / 100).toFixed(2) : undefined;

  const handleValueChange = (values: NumberFormatValues) => {
    if (values.value === "") {
      onValueChange?.(undefined);
      return;
    }

    const parsed = Number(values.value);
    if (!Number.isFinite(parsed)) return;

    onValueChange?.(Math.round(parsed * 100));
  };

  return (
    <NumericFormat
      {...props}
      type="text"
      value={displayValue}
      valueIsNumericString
      customInput={Input}
      prefix="R$ "
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
      allowNegative={false}
      allowedDecimalSeparators={[".", ","]}
      inputMode={inputMode ?? "decimal"}
      onValueChange={handleValueChange}
    />
  );
}
