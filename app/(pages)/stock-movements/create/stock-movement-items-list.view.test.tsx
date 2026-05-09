import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StockMovementItemsList } from "./stock-movement-items-list.view";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const baseHandlers = {
  onEditNewProductItem: vi.fn(),
  onEditExistingProductBatchData: vi.fn(),
  onRemoveItem: vi.fn(),
};

describe("StockMovementItemsList", () => {
  it("mostra resumo de lote e permite editar produto existente de entrada", () => {
    render(
      <StockMovementItemsList
        items={[
          {
            id: "row-1",
            productId: "123e4567-e89b-12d3-a456-426614174000",
            productName: "Café Torrado",
            quantity: 2,
            manufacturedDate: "2026-04-01",
            expirationDate: "2026-12-31",
            costPrice: 1290,
            sellingPrice: 2490,
          },
        ]}
        isInMovement
        {...baseHandlers}
      />,
    );

    expect(screen.getAllByText("Café Torrado")).toHaveLength(2);
    expect(screen.getAllByText("Fab: 01/04/2026")[0]).toBeTruthy();
    expect(screen.getAllByText("Val: 31/12/2026")[0]).toBeTruthy();
    expect(
      screen.getAllByText((text) => text.includes("Custo") && text.includes("12,90"))[0],
    ).toBeTruthy();
    expect(
      screen.getAllByText((text) => text.includes("Venda") && text.includes("24,90"))[0],
    ).toBeTruthy();

    fireEvent.click(screen.getAllByLabelText("Editar item")[0]);
    expect(baseHandlers.onEditExistingProductBatchData).toHaveBeenCalledWith(0);
  });

  it("não mostra edição de lote para produto existente em saída", () => {
    render(
      <StockMovementItemsList
        items={[
          {
            id: "row-1",
            productId: "123e4567-e89b-12d3-a456-426614174000",
            productName: "Café Torrado",
            quantity: 2,
          },
        ]}
        isInMovement={false}
        {...baseHandlers}
      />,
    );

    expect(screen.queryByLabelText("Editar item")).toBeNull();
  });
});
