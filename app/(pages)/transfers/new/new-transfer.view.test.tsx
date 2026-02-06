import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NewTransferView } from "./new-transfer.view";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newTransferSchema, NewTransferSchema } from "./new-transfer.schema";
import { NewTransferViewProps } from "./new-transfer.types";
import React from "react";

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const TestWrapper = (props: Partial<NewTransferViewProps>) => {
  const form = useForm<NewTransferSchema>({
    resolver: zodResolver(newTransferSchema),
    defaultValues: {
      destinationWarehouseId: "",
      items: [],
    },
  });

  const defaultProps: NewTransferViewProps = {
    form,
    onSubmit: vi.fn(),
    warehouses: [
      { id: "w1", name: "Warehouse A" },
      { id: "w2", name: "Warehouse B" },
    ],
    products: [{ id: "p1", name: "Product 1" }],
    batches: [{ id: "b1", code: "BATCH-001", quantity: 100 }],
    isLoading: false,
    isSubmitting: false,
    selectedProductId: "",
    selectedBatchId: "",
    itemQuantity: "",
    addItemError: null,
    onProductChange: vi.fn(),
    onBatchChange: vi.fn(),
    onQuantityChange: vi.fn(),
    onAddItem: vi.fn(),
    onRemoveItem: vi.fn(),
    items: [],
    ...props,
  };

  return <NewTransferView {...defaultProps} />;
};

describe("NewTransferView", () => {
  it("renders the form correctly", () => {
    render(<TestWrapper />);
    expect(screen.getByText("Rota")).toBeTruthy();
    expect(screen.getByText("Adicionar Item")).toBeTruthy();

    const buttons = screen.getAllByText("CRIAR TRANSFERÊNCIA");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("shows validation errors when submitting empty form", async () => {
    render(<TestWrapper />);

    const submitBtn = screen.getAllByText("CRIAR TRANSFERÊNCIA")[0];
    fireEvent.click(submitBtn);

    expect(await screen.findByText("Selecione um warehouse de destino")).toBeTruthy();
    expect(await screen.findByText("Adicione pelo menos um item")).toBeTruthy();
  });
});
