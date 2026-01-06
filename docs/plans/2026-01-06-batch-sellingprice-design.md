# Batch sellingPrice in product edit drawer

## Summary
Add editable `sellingPrice` to the batch drawer in product edit. The field is optional, mapped from the batches GET response when present, validated as a number, and sent in the batch update payload.

## Scope
- Only the product edit batch drawer (no create flows).
- UI uses existing drawer and accordion pattern.
- No animations; maintain corporate solid dark styling.

## Data Model
- Extend batch types to include `sellingPrice?: number | null` in API response types.
- Extend drawer form item to include `sellingPrice?: number`.

## UI Changes
- Add a numeric input labeled "Preco de Venda" near "Custo Unitario" inside the batch accordion.
- Use `type="number"` and `step="0.01"`.
- Keep spacing, border radius, and typography aligned with existing inputs.

## Form Mapping
- Map GET batch data: `sellingPrice: batch.sellingPrice ?? undefined`.
- Validate with Zod as optional number.
- On submit, send `sellingPrice: batch.sellingPrice ?? undefined`.

## API Interaction
- `GET /api/batches/product/{productId}`: read `sellingPrice` when present.
- `PUT /api/batches/{id}`: include `sellingPrice` in JSON payload when defined.

## Error Handling
- Use existing form error messaging via react-hook-form + zod.
- Preserve existing toasts for update success/error.

## Testing
- Update model test to assert `sellingPrice` in payload.
- Update view test fixtures to include `sellingPrice` in batch form data.
