# Batch Management Design

Date: 2026-01-08  
Scope: Batch list (rich filters/alerts), batch detail, batch create, batch edit.

## Goals
- Provide a dedicated batches module with list + detail + create/edit flows.
- Follow MVVM structure and corporate solid dark visual rules.
- Mobile-first layout with responsive table/cards.

## Routes and MVVM Structure
- `app/batches/page.tsx`
  - `batches.model.ts` (SWR + filters + computed status)
  - `batches.view.tsx` (list UI)
  - `batches.types.ts`
- `app/batches/create/page.tsx`
  - `batches-create.model.ts`
  - `batches-create.view.tsx`
  - `batches-create.schema.ts`
  - `batches-create.types.ts`
- `app/batches/[id]/page.tsx`
  - `batches-detail.model.ts`
  - `batches-detail.view.tsx`
  - `batches-detail.types.ts`
- `app/batches/[id]/edit/page.tsx`
  - `batches-edit.model.ts`
  - `batches-edit.view.tsx`
  - `batches-edit.schema.ts`
  - `batches-edit.types.ts`

## Data Flow
- List: `GET /api/batches` via SWR.
  - Filter locally by search (productName, productSku, batchNumber) and warehouse.
  - Status filter based on computed expiration and low stock threshold.
  - Sorting on product, expiration, quantity, createdAt.
- Detail: `GET /api/batches/{id}` via SWR.
- Create: `POST /api/batches` with form payload.
- Edit: `PUT /api/batches/{id}` with form payload; productId/warehouseId read-only.
- Delete: `DELETE /api/batches/{id}` with confirmation.

## Status Calculation
- `isExpired`: expirationDate < today.
- `isExpiring`: expirationDate within 30 days.
- `isLowStock`: quantity <= threshold (default 10).
- Visual indicator uses grayscale tones only; no bright colors.

## List UI (Mobile First)
- Mobile: stacked cards with key fields and status strip.
- Desktop: table inside Card with sticky header.
- Filters bar: search input, warehouse select, status select, sort select.
- Alerts row: counts for expired, expiring (<=30d), low stock.

## Detail UI
- Header with batch number and actions (edit/delete).
- Summary cards: product, warehouse, quantity, expiration.
- Sections: operational data, dates, notes.

## Forms (Create/Edit)
- Zod schema + react-hook-form.
- Fields: productId, warehouseId, batchCode, quantity, costPrice, sellingPrice, notes,
  manufacturedDate, expirationDate.
- Validate: quantity positive; expiration after manufactured; expiration required if product hasExpiration.

## Error Handling
- ky errors surfaced via toast and inline field errors.
- Known cases: duplicate batchCode, missing expiration, invalid date range, 404.
- Delete warns if batch has quantity; suggest stock adjustment.

## Testing
- Unit tests for models: filtering/sorting/status computation and submit handlers.
- Mock SWR and ky responses; verify error handling and toasts.

## Open Decisions
- Low stock threshold default (10) and if user-configurable later.
