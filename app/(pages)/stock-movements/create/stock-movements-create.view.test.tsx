import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { StockMovementCreateView } from "./stock-movements-create.view";
import type { StockMovementCreateFormData } from "./stock-movements-create.schema";

const TestHarness = () => {
  const baseDefaults: StockMovementCreateFormData = {
    movementType: "ENTRY",
    sourceWarehouseId: "",
    destinationWarehouseId: "",
    notes: "",
    executeNow: false,
    items: [],
  };

  const form = useForm<StockMovementCreateFormData>({
    defaultValues: baseDefaults,
  });

  const movementType = form.watch("movementType");
  const sourceWarehouseId = form.watch("sourceWarehouseId");
  const destinationWarehouseId = form.watch("destinationWarehouseId");
  const executeNow = form.watch("executeNow") ?? false;
  const notes = form.watch("notes") ?? "";
  const watchedItems = form.watch("items") ?? [];

  return (
    <StockMovementCreateView
      form={form}
      items={[]} // Field array items (mocked as empty for view test)
      watchedItems={watchedItems}
      warehouses={[
        { id: "w1", name: "Warehouse A" },
        { id: "w2", name: "Warehouse B" },
      ]}
      products={[
        { id: "p1", name: "Product A", sku: "SKU-A" },
      ]}
      batches={[
        { id: "b1", batchCode: "BATCH-1", quantity: 100, productId: "p1" },
      ]}
      movementType={movementType}
      sourceWarehouseId={sourceWarehouseId}
      destinationWarehouseId={destinationWarehouseId}
      sourceWarehouse={undefined}
      destinationWarehouse={undefined}
      executeNow={executeNow}
      notes={notes}
      setNotes={(val) => form.setValue("notes", val)}
      requiresSource={true}
      requiresDestination={true}
      requiresBatch={true}
      totalQuantity={0}
      canSubmit={false}
      isSubmitting={false}
      addItem={vi.fn()}
      removeItem={vi.fn()}
      updateItemQuantity={vi.fn()}
      handleSubmit={vi.fn()}
      getBatchesForProduct={() => []}
    />
  );
};

describe("StockMovementCreateView", () => {
  it("renders the create form with all sections", () => {
    render(<TestHarness />);

    // Header
    expect(screen.getByText("Nova Movimentação")).toBeTruthy();

    // Configuration section
    expect(screen.getByText("Configuração")).toBeTruthy();
    expect(screen.getByText("Tipo de Movimentação")).toBeTruthy();

    // Route section (requiresSource/Destination=true in harness)
    expect(screen.getByText("Origem")).toBeTruthy();
    expect(screen.getByText("Destino")).toBeTruthy();

    // Items section
    expect(screen.getByText("Itens")).toBeTruthy();
    expect(screen.getByText("Nenhum item adicionado")).toBeTruthy();

    // Sidebar/Footer
    expect(screen.getByText("Criar Movimentação")).toBeTruthy();
  });
});
