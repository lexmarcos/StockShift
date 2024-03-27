import { NumberFormatBase, NumberFormatBaseProps } from "react-number-format";

export const getCurrencyFloatValue = (floatValue: number | undefined) => {
  if (!floatValue) return 0;

  return floatValue / 100;
};

export default function InputCurrency({ ...props }: NumberFormatBaseProps) {
  const format = (numStr: string) => {
    if (numStr === "") return "";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(numStr) / 100);
  };

  return <NumberFormatBase format={format} {...props} />;
}
