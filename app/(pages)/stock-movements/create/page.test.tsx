import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "./page";
import { StockMovementCreateView } from "./stock-movements-create.view";
import type { UseFormReturn } from "react-hook-form";

const modelReturn = {
  form: {} as UseFormReturn,
  onSubmit: vi.fn(),
  items: [],
  addItem: vi.fn(),
  removeItem: vi.fn(),
  warehouses: [],
  products: [],
  batches: [],
  currentStep: 1,
  totalSteps: 3,
  onNextStep: vi.fn(),
  onPrevStep: vi.fn(),
};

vi.mock("./stock-movements-create.model", () => ({
  useStockMovementCreateModel: () => modelReturn,
}));

vi.mock("./stock-movements-create.view", () => ({
  StockMovementCreateView: vi.fn(() => <div>create-view</div>),
}));

describe("StockMovementCreatePage", () => {
  it("renders view with model props", () => {
    render(<Page />);
    expect(screen.getByText("create-view")).toBeTruthy();
    expect(StockMovementCreateView).toHaveBeenCalled();
    const [[props]] = (StockMovementCreateView as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    expect(props).toEqual(expect.objectContaining(modelReturn));
  });
});
