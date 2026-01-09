# Currency Input (BRL) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a reusable BRL currency input that stores cents as a number and displays `R$ 1.340,50` formatting.

**Architecture:** Create a UI wrapper around `react-number-format`'s `NumericFormat` that uses the existing `Input` component for consistent styling. Convert between integer cents (controlled value) and decimal string for display, and expose a clean `onValueChange` API.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind, react-number-format, Vitest, Testing Library.

### Task 1: Render BRL format from cents

**Files:**
- Create: `components/ui/currency-input.test.tsx`
- Create: `components/ui/currency-input.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CurrencyInput } from "./currency-input";

describe("CurrencyInput", () => {
  it("formats cents as BRL", () => {
    render(<CurrencyInput value={134050} aria-label="Preço" />);
    const input = screen.getByRole("textbox");
    expect((input as HTMLInputElement).value).toBe("R$ 1.340,50");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run components/ui/currency-input.test.tsx`
Expected: FAIL due to missing `components/ui/currency-input.tsx` export.

**Step 3: Write minimal implementation**

```tsx
import type { ComponentProps } from "react";

export type CurrencyInputProps = ComponentProps<"input"> & {
  value?: number;
};

export function CurrencyInput(_props: CurrencyInputProps) {
  return null;
}
```

**Step 4: Run test to verify it fails**

Run: `pnpm test -- --run components/ui/currency-input.test.tsx`
Expected: FAIL because input is not rendered/formatting missing.

**Step 5: Implement minimal behavior to pass**

```tsx
import { NumericFormat } from "react-number-format";
import { Input } from "./input";

const displayValue = typeof value === "number" ? (value / 100).toFixed(2) : undefined;

<NumericFormat
  value={displayValue}
  valueIsNumericString
  customInput={Input}
  prefix="R$ "
  thousandSeparator="."
  decimalSeparator=","
  decimalScale={2}
  fixedDecimalScale
/>
```

**Step 6: Run test to verify it passes**

Run: `pnpm test -- --run components/ui/currency-input.test.tsx`
Expected: PASS

**Step 7: Commit**

```bash
git add components/ui/currency-input.tsx components/ui/currency-input.test.tsx
git commit -m "feat: add brl currency input format"
```

### Task 2: Convert typed value to cents

**Files:**
- Modify: `components/ui/currency-input.test.tsx`
- Modify: `components/ui/currency-input.tsx`

**Step 1: Write the failing test**

```tsx
import { fireEvent } from "@testing-library/react";
import { vi } from "vitest";

it("converts formatted input to cents", () => {
  const onValueChange = vi.fn();
  render(<CurrencyInput value={undefined} onValueChange={onValueChange} aria-label="Preço" />);
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "1340,50" } });
  const lastCall = onValueChange.mock.calls.at(-1)?.[0];
  expect(lastCall).toBe(134050);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run components/ui/currency-input.test.tsx`
Expected: FAIL because `onValueChange` not wired.

**Step 3: Write minimal implementation**

```tsx
import type { NumberFormatValues } from "react-number-format";

const handleValueChange = (values: NumberFormatValues) => {
  if (values.value === "") {
    onValueChange?.(undefined);
    return;
  }
  const parsed = Number(values.value);
  if (!Number.isFinite(parsed)) return;
  onValueChange?.(Math.round(parsed * 100));
};

<NumericFormat onValueChange={handleValueChange} ... />
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run components/ui/currency-input.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/ui/currency-input.tsx components/ui/currency-input.test.tsx
git commit -m "feat: emit cents from currency input"
```

### Task 3: Clear input returns undefined

**Files:**
- Modify: `components/ui/currency-input.test.tsx`
- Modify: `components/ui/currency-input.tsx`

**Step 1: Write the failing test**

```tsx
it("returns undefined when input is cleared", () => {
  const onValueChange = vi.fn();
  render(<CurrencyInput value={12300} onValueChange={onValueChange} aria-label="Preço" />);
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "" } });
  const lastCall = onValueChange.mock.calls.at(-1)?.[0];
  expect(lastCall).toBeUndefined();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run components/ui/currency-input.test.tsx`
Expected: FAIL if empty handling missing.

**Step 3: Update implementation if needed**

```tsx
if (values.value === "") {
  onValueChange?.(undefined);
  return;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run components/ui/currency-input.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/ui/currency-input.tsx components/ui/currency-input.test.tsx
git commit -m "test: handle clearing currency input"
```
