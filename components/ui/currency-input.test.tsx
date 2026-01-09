import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CurrencyInput } from "./currency-input";

describe("CurrencyInput", () => {
  it("formats cents as BRL", () => {
    render(<CurrencyInput value={134050} aria-label="Preco" />);
    const input = screen.getByRole("textbox");
    expect((input as HTMLInputElement).value).toBe("R$ 1.340,50");
  });
});
