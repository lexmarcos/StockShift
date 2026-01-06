# Product Edit Batches Drawer Design

## Overview
Add a "Ver Batches" action to the product edit header that opens a responsive drawer. On lg+ screens the drawer opens from the right; on smaller screens it opens from the bottom. The drawer lists batches for the current product in accordions and allows editing batch data inline.

## UX + Layout
- Trigger lives in the product edit header, visible only in edit mode.
- Drawer direction:
  - `min-width: 1024px` (lg and above): right-side drawer.
  - below lg: bottom drawer.
- Drawer content:
  - Header with title and close button.
  - Body with accordion list of batches.
  - Empty state when no batches.
- Accordion item header shows: batch number, warehouse name/code, quantity, expiration.
- Accordion content provides an edit form for the batch fields:
  - Editable: batch number, quantity, expiration date, cost price, notes.
  - Read-only: productId and warehouseId (display only).
- Visual style follows Corporate Solid Dark: monochrome greys, subtle borders, rounded-sm, no motion/animation additions.

## Data + State Flow
- Fetch batches from `GET /api/batches/product/{productId}`.
- Only fetch when drawer opens.
- Use SWR for caching and revalidation, keyed by `batches/product/${productId}`.
- Build a single `react-hook-form` instance with `useFieldArray` for `batches[]`.
- Reset form values when batches load.

## Update Flow
- Per-accordion "Salvar" button validates only that item.
- On submit: `PUT /api/batches/{id}` with payload:
  - productId, warehouseId (unchanged), quantity, batchNumber, expirationDate, costPrice, notes.
- Show per-item loading state (track `updatingBatchId`).
- On success:
  - toast success
  - invalidate SWR for batches (and optionally products if needed).
- On error:
  - toast error with API message.

## Validation
- Zod schema for batch edit:
  - quantity positive integer
  - batch number length limits
  - expiration date ISO (optional)
  - cost price numeric (optional)
  - notes optional
- Reuse RHF + zodResolver for item validation.

## Error/Empty States
- Loading skeleton or compact loader inside drawer.
- Empty state message when batch list is empty.
- Inline form errors shown per field.

## Files (MVVM)
- `app/products/[id]/edit/products-edit.model.ts`: drawer state, SWR, form logic, update handler.
- `app/products/components/product-form.view.tsx`: add header button + drawer markup.
- `app/products/components/product-form.types.ts`: new props for batches drawer.
- `app/products/[id]/edit/`: add batch types/schema files if needed (MVVM compliance).

## Testing
- Unit tests for `products-edit.model.ts`:
  - load batches on drawer open
  - form reset with batch data
  - update handler payload mapping
  - per-item loading and error handling

