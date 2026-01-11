import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { StockMovementCreateView } from "./stock-movements-create.view";
import type { StockMovementCreateFormData } from "./stock-movements-create.schema";

interface HarnessProps {
  initialStep?: number;
  defaultValues?: Partial<StockMovementCreateFormData>;
  batches?: Array<{
    id: string;
    batchCode?: string | null;
    batchNumber?: string | null;
    quantity: number;
  }>;
}

const TestHarness = ({
  initialStep = 1,
  defaultValues,
  batches = [],
}: HarnessProps) => {
  const [step, setStep] = useState(initialStep);
  const baseDefaults: StockMovementCreateFormData = {
    movementType: "ENTRY",
    sourceWarehouseId: "",
    destinationWarehouseId: "",
    notes: "",
    executeNow: false,
    items: [{ productId: "", batchId: "", quantity: 1, reason: "" }],
  };

  const form = useForm<StockMovementCreateFormData>({
    defaultValues: {
      ...baseDefaults,
      ...defaultValues,
      items: defaultValues?.items ?? baseDefaults.items,
    },
  });

  return (
    <StockMovementCreateView
      form={form}
      onSubmit={vi.fn()}
      items={[{ id: "item-1" }]}
      addItem={vi.fn()}
      removeItem={vi.fn()}
      warehouses={[]}
      products={[]}
      batches={batches}
      currentStep={step}
      totalSteps={3}
      onNextStep={() => setStep((prev) => Math.min(prev + 1, 3))}
      onPrevStep={() => setStep((prev) => Math.max(prev - 1, 1))}
    />
  );
};

describe("StockMovementCreateView", () => {
  it("navigates between steps", () => {
    render(<TestHarness />);
    expect(screen.getByText("Tipo *")).toBeTruthy();
    expect(screen.queryByText("Destino *")).toBeNull();
    expect(screen.queryByText("Adicionar item")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /próximo/i }));
    expect(screen.getByText("Destino *")).toBeTruthy();
    expect(screen.queryByText("Adicionar item")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /próximo/i }));
    expect(screen.getByText("Adicionar item")).toBeTruthy();
    expect(screen.getByText("Buscar produto")).toBeTruthy();
    expect(screen.getByText("Buscar batch")).toBeTruthy();
  });

});
