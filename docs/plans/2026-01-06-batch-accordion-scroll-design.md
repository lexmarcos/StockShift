# Batch accordion scroll in product edit drawer

## Summary
Add a vertical scroll container to the batch accordion content so long batch forms remain usable without expanding beyond the drawer. Use a max height of 70vh with overflow-y auto.

## Scope
- Only the batches drawer accordion content in the product edit view.
- No changes to data flow, validation, or API behavior.

## UI Behavior
- Apply `max-h-[70vh] overflow-y-auto` to the accordion content wrapper.
- Add a small right padding to avoid scrollbar overlap.
- Maintain corporate solid dark styling (no animations/shadows beyond existing).

## Implementation Notes
- Update `app/products/components/product-form.view.tsx` in the batches drawer accordion section.
- Prefer applying classes on the inner content container to avoid interfering with accordion open/close behavior.

## Testing
- No new behavior tests required; visual change only.
