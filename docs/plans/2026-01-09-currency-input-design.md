# Currency Input (BRL) Design

## Overview
Create a reusable UI component that formats monetary input as Brazilian Real (BRL) while storing a controlled value in integer cents. The component should integrate with the existing UI input styling and remain compatible with React Hook Form.

## Requirements
- Controlled value is an integer number of cents (e.g., `134050`).
- Display format: `R$ 1.340,50`.
- Disallow negative values.
- Mobile friendly input (`inputMode="decimal"`).
- No animations, minimal styling changes; use existing Input styling.

## Component API
`CurrencyInput` (in `components/ui/currency-input.tsx`):
- `value?: number` (cents)
- `onValueChange?: (value?: number) => void`
- Pass-through input props (id, name, placeholder, disabled, className, onBlur, aria-*)

## Formatting
Use `react-number-format` `NumericFormat` with:
- `prefix="R$ "`
- `thousandSeparator="."`
- `decimalSeparator=","`
- `decimalScale={2}`
- `fixedDecimalScale={true}`
- `allowNegative={false}`
- `allowedDecimalSeparators={[".", ","]}`
- `valueIsNumericString={true}`
- `customInput={Input}`

## Data Flow
- Render: convert cents to numeric string with two decimals: `value / 100` -> string.
- Change: receive `values.value` (numeric string). If empty, emit `undefined`.
- Convert to cents: `Math.round(Number(values.value) * 100)` and emit via `onValueChange`.

## Edge Cases
- Empty input clears value and returns `undefined`.
- Invalid numeric string does not trigger changes.
- Default display is blank when value is `undefined` (avoid showing `R$ 0,00`).

## Tests
Add React Testing Library + Vitest tests to validate:
1) Renders formatted BRL from cents.
2) Clearing input calls `onValueChange(undefined)`.
3) Typing `1340,50` calls `onValueChange(134050)`.
