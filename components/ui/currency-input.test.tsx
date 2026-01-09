import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { CurrencyInput } from "./currency-input";

describe("CurrencyInput", () => {
  afterEach(() => cleanup());

  it("formats cents as BRL", () => {
    const { getByRole } = render(
      <CurrencyInput value={134050} aria-label="Preco" />
    );
    const input = getByRole("textbox");
    expect((input as HTMLInputElement).value).toBe("R$ 1.340,50");
  });

  it("converts formatted input to cents", () => {
    const onValueChange = vi.fn();
    const { getByRole } = render(
      <CurrencyInput
        value={undefined}
        onValueChange={onValueChange}
        aria-label="Preco"
      />
    );
    const input = getByRole("textbox");
    fireEvent.change(input, { target: { value: "1340,50" } });
    const lastCall = onValueChange.mock.calls.at(-1)?.[0];
    expect(lastCall).toBe(134050);
  });

  it("returns undefined when input is cleared", () => {
    const onValueChange = vi.fn();
    const { getByRole } = render(
      <CurrencyInput value={12300} onValueChange={onValueChange} aria-label="Preco" />
    );
    const input = getByRole("textbox");
    fireEvent.change(input, { target: { value: "" } });
    const lastCall = onValueChange.mock.calls.at(-1)?.[0];
    expect(lastCall).toBeUndefined();
  });
});
