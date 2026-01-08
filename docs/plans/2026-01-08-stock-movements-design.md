# Stock Movements Design

Date: 2026-01-08  
Scope: List + detail + create + execute/cancel for stock movements.

## Goals
- Provide a dedicated movements module for ENTRY/EXIT/TRANSFER/ADJUSTMENT.
- Follow MVVM structure with Zod + react-hook-form for forms.
- Mobile-first UI with corporate solid dark styling.

## Routes and MVVM Structure
- `app/stock-movements/page.tsx`
  - `stock-movements.model.ts`
  - `stock-movements.view.tsx`
  - `stock-movements.types.ts`
- `app/stock-movements/[id]/page.tsx`
  - `stock-movements-detail.model.ts`
  - `stock-movements-detail.view.tsx`
  - `stock-movements-detail.types.ts`
- `app/stock-movements/create/page.tsx`
  - `stock-movements-create.model.ts`
  - `stock-movements-create.view.tsx`
  - `stock-movements-create.schema.ts`
  - `stock-movements-create.types.ts`

## Endpoints
- `GET /api/stock-movements` (list)
- `GET /api/stock-movements/{id}` (detail)
- `POST /api/stock-movements` (create)
- `POST /api/stock-movements/{id}/execute`
- `POST /api/stock-movements/{id}/cancel`

## Data Flow
- List: SWR fetch from `/stock-movements`, local filters (type/status/warehouse) and search.
- Detail: SWR fetch by id; actions call execute/cancel and refresh data.
- Create: form submits payload; optional "create and execute" flow.

## UI Summary
- List: mobile cards, desktop table; filters for type/status/warehouse + search.
- Detail: header with status and timestamps, items table, warehouses section, execute/cancel actions.
- Create: type selector drives conditional warehouse fields; items builder for multi-item payload.

## Validation Rules
- Movement type required.
- Warehouse rules:
  - ENTRY: destination required, source null.
  - EXIT: source required, destination null.
  - TRANSFER: source and destination required.
  - ADJUSTMENT: single warehouse required (use source).
- Items: at least 1 item; productId required; quantity > 0.
- Batch: required for EXIT/TRANSFER; optional for ENTRY.

## Error Handling
- Surface API errors via toast and inline messages.
- Execute/cancel only available when status is PENDING.
- Show warnings for insufficient stock or invalid transitions.

## Testing
- Model unit tests for filters and payload mapping.
- Create model tests for validation and payload construction.
- Detail model tests for action handlers (execute/cancel).
