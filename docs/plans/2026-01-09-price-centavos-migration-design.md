# Price Fields Migration to Cents (BRL) Design

## Overview
Migrate all price inputs and stored values to integer cents across product and batch flows. The UI should display BRL formatting while the form state and payloads store integer cents (e.g., `134050`).

## Requirements
- All price fields use integer cents in form state and payloads.
- UI uses `CurrencyInput` for BRL formatting and cent output.
- Zod schemas enforce integer values.
- Batch detail view displays values in BRL from cents.
- Tests updated to use cents (no decimals in test fixtures).

## Scope
Update the following:
- Product create price fields (`app/products/create/products-create.view.tsx`).
- Product form price fields (main + batch drawer) (`app/products/components/product-form.view.tsx`).
- Batch create and edit price fields (`app/batches/create/batches-create.view.tsx`, `app/batches/[id]/edit/batches-edit.view.tsx`).
- Zod schemas for price fields to `int`.
- Formatters for price display in batch detail.
- Tests referencing price fields.

## UI Components
Use `CurrencyInput` (from `components/ui/currency-input.tsx`) in place of numeric `<Input>` components for price fields. Wire with `react-hook-form` using:
- `value={field.value}`
- `onValueChange={field.onChange}`
- `onBlur={field.onBlur}`

## Zod Validation
Replace price fields with integer validation:
- `z.number().int().optional()`
- Remove `z.coerce.number()` where used for price fields.

## Data Flow
- Input: `CurrencyInput` receives cents and formats BRL for display.
- Change: `CurrencyInput` emits cents back to the form.
- Submit: payloads pass cents directly to API (backend expects cents).

## Batch Detail Display
Update currency display to use cents:
- `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`
- Display `value / 100` when value is defined.

## Tests
Update fixtures and assertions to use cents:
- `app/products/[id]/edit/products-edit.model.test.ts`
- `app/products/components/product-form.view.test.tsx`
- `app/batches/create/batches-create.model.test.ts`
- `app/batches/batches.model.test.ts`
- `app/batches/[id]/edit/batches-edit.model.test.ts`
- `app/batches/[id]/batches-detail.view.test.tsx`

