import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { BatchEditView } from "./batches-edit.view";
import type { BatchEditFormData } from "./batches-edit.schema";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

afterEach(() => cleanup());

const Wrapper = ({
  defaultValues,
}: {
  defaultValues?: Partial<BatchEditFormData>;
}) => {
  const form = useForm<BatchEditFormData>({
    defaultValues: {
      productId: "prod-1",
      warehouseId: "wh-1",
      quantity: 1,
      batchCode: "",
      manufacturedDate: "",
      expirationDate: "",
      costPrice: undefined,
      sellingPrice: undefined,
      notes: "",
      ...defaultValues,
    },
  });

  return <BatchEditView form={form} onSubmit={vi.fn()} isLoading={false} />;
};

describe("BatchEditView price formatting", () => {
  it("renders prices as BRL", () => {
    render(<Wrapper defaultValues={{ costPrice: 1250, sellingPrice: 1990 }} />);
    const costLabel = screen.getAllByText((_, element) =>
      element?.tagName === "LABEL" && element.textContent?.includes("Custo")
    )[0];
    const sellingLabel = screen.getAllByText((_, element) =>
      element?.tagName === "LABEL" && element.textContent?.includes("Venda")
    )[0];
    const costItem = costLabel.closest("[data-slot='form-item']");
    const sellingItem = sellingLabel.closest("[data-slot='form-item']");
    const costInput = costItem?.querySelector("input") as HTMLInputElement;
    const sellingInput = sellingItem?.querySelector("input") as HTMLInputElement;
    expect(costInput?.value).toBe("R$ 12,50");
    expect(sellingInput?.value).toBe("R$ 19,90");
  });
});
