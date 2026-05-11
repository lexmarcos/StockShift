import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StockMovementBatchDataModal } from "./stock-movement-batch-data-modal.view";
import type { ExistingProductBatchFormState } from "./create-stock-movement.types";

vi.mock("@/components/ui/responsive-modal", () => ({
  ResponsiveModal: ({
    children,
    footer,
    open,
    title,
  }: {
    children: React.ReactNode;
    footer: React.ReactNode;
    open: boolean;
    title: string;
  }) =>
    open ? (
      <div data-testid="responsive-modal">
        <h2>{title}</h2>
        {children}
        {footer}
      </div>
    ) : null,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const openBatchForm: ExistingProductBatchFormState = {
  isOpen: true,
  productId: "p-1",
  productName: "Café Torrado",
  quantity: "2",
  manufacturedDate: "2026-04-01",
  expirationDate: "2026-12-31",
  costPrice: 1290,
  sellingPrice: 2490,
  editingIndex: null,
  error: null,
};

describe("StockMovementBatchDataModal", () => {
  it("renderiza campos e ações de dados do lote", () => {
    render(
      <StockMovementBatchDataModal
        form={openBatchForm}
        onOpenChange={vi.fn()}
        onQuantityChange={vi.fn()}
        onManufacturedDateChange={vi.fn()}
        onExpirationDateChange={vi.fn()}
        onCostPriceChange={vi.fn()}
        onSellingPriceChange={vi.fn()}
        onApplyCostPriceSuggestion={vi.fn()}
        onApplySalePriceSuggestion={vi.fn()}
        onConfirm={vi.fn()}
        costPriceSuggestion={null}
        salePriceSuggestion={null}
        isPriceSuggestionLoading={false}
        shouldShowMissingCostPriceSuggestion={false}
        shouldShowMissingSalePriceSuggestion={false}
        profitSummary={{
          kind: "incomplete",
          title: "Resumo de lucro",
          description: "Informe custo, venda e quantidade para calcular o lucro.",
        }}
      />,
    );

    expect(screen.getByText("Dados do lote")).toBeTruthy();
    expect(screen.getByText("Café Torrado")).toBeTruthy();
    expect(screen.getByText("Quantidade")).toBeTruthy();
    expect(screen.getByText("Fabricação")).toBeTruthy();
    expect(screen.getByText("Validade")).toBeTruthy();
    expect(screen.getByText("Preço de custo")).toBeTruthy();
    expect(screen.getByText("Preço de venda")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Adicionar lote à movimentação" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeTruthy();
  });
});
