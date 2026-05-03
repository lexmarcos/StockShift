import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NumberInput } from "./number-input";

describe("NumberInput", () => {
  afterEach(() => cleanup());

  it("renders integer values", () => {
    const { getByRole } = render(
      <NumberInput value={12} aria-label="Quantidade" />
    );
    const input = getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("12");
  });

  it("converts cleared input to undefined", () => {
    const onValueChange = vi.fn();
    const { getByRole } = render(
      <NumberInput
        value={12}
        onValueChange={onValueChange}
        aria-label="Quantidade"
      />
    );
    const input = getByRole("textbox");
    fireEvent.change(input, { target: { value: "" } });
    const lastCall = onValueChange.mock.calls.at(-1)?.[0];
    expect(lastCall).toBeUndefined();
  });

  it("clears rendered value when controlled value is reset", () => {
    const { getByRole, rerender } = render(
      <NumberInput value={12} aria-label="Quantidade" />
    );
    const input = getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("12");

    rerender(<NumberInput value={0} aria-label="Quantidade" />);

    expect(input.value).toBe("");
  });
});
