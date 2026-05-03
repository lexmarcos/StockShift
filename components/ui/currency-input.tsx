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
    typeof value === "number" ? (value / 100).toFixed(2) : "";

  const handleValueChange = (values: NumberFormatValues) => {
    if (values.value === "") {
      onValueChange?.(undefined);
      return;
    }

    const digits = values.value.replace(/\D/g, "");
    const parsed = Number(digits);

    if (!Number.isFinite(parsed)) return;

    onValueChange?.(parsed);
  };

  return (
    <NumericFormat
      {...props}
      type="text"
      value={displayValue}
      customInput={Input}
      prefix="R$ "
      thousandSeparator="."
      decimalSeparator=","
      allowNegative={false}
      allowedDecimalSeparators={[".", ","]}
      inputMode={inputMode ?? "decimal"}
      onValueChange={handleValueChange}
    />
  );
}
