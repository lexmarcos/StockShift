# Stock Event API Guide

Stock events represent inbound/outbound/adjustment movements at a warehouse. Endpoints live under `/api/v1/stock-events`. Permissions:

- `ADMIN`, `MANAGER`, `SELLER`: create events (subject to business rules).
- All roles above can list and fetch events, but `SELLER` must target warehouses they are authorised for.

Requests are JSON with `Authorization: Bearer <accessToken>`.

## Stock Event Object Schema

```json
{
  "id": "0a0fa4e5-21f8-426c-8f8b-8c61d85f7b71",
  "type": "INBOUND",
  "warehouseId": "b3e2f7a8-2d1d-4c1b-b948-6a1b53ecb847",
  "warehouseCode": "WH-SAO-01",
  "occurredAt": "2025-02-10T08:00:00Z",
  "reasonCode": "PURCHASE",
  "notes": "Supplier restock",
  "createdById": "9d9a9d32-6d4f-4d1c-8f07-756c0eabd412",
  "createdByUsername": "manager01",
  "createdAt": "2025-02-05T09:45:00Z",
  "lines": [
    {
      "id": "6fda1783-8534-46f6-b5ad-bc8a4d622db7",
      "variantId": "9f1bcd13-7cc4-4e96-8b5e-9e7c6da0e2cc",
      "variantSku": "LAPTOP-X-RED-256",
      "quantity": 25
    }
  ]
}
```

`type` is one of `INBOUND`, `OUTBOUND`, `ADJUST`. `reasonCode` is optional (`PURCHASE`, `SALE`, `COUNT_CORRECTION`, `DAMAGE`, `DISCARD_EXPIRED`, `OTHER`). Quantities for `INBOUND`/`ADJUST` can be positive; outbound entries are negative (handled server-side).

---

## Create Event – POST `/api/v1/stock-events`

### Request Body

```json
{
  "type": "INBOUND",
  "warehouseId": "b3e2f7a8-2d1d-4c1b-b948-6a1b53ecb847",
  "occurredAt": "2025-02-10T08:00:00Z",
  "reasonCode": "PURCHASE",
  "notes": "Supplier restock",
  "lines": [
    {
      "variantId": "9f1bcd13-7cc4-4e96-8b5e-9e7c6da0e2cc",
      "quantity": 25
    }
  ]
}
```

| Field       | Type      | Required | Notes                                                            |
|-------------|-----------|----------|------------------------------------------------------------------|
| type        | enum      | yes      | `INBOUND`, `OUTBOUND`, `ADJUST`.                                 |
| warehouseId | UUID      | yes      | Target warehouse.                                                |
| occurredAt  | timestamp | no       | Defaults to now (UTC) if omitted.                                |
| reasonCode  | enum      | no       | Optional reason (see list above).                                |
| notes       | string    | no       | ≤500 chars.                                                       |
| lines       | array     | yes      | At least one entry; see below.                                    |

Each line requires `variantId` and `quantity`. Backend rules (from `StockEventService`):

- Quantities must be positive for `INBOUND`/`OUTBOUND`; `ADJUST` accepts positive or negative but not zero.
- Variants and warehouses must exist and be active.
- Outbound/adjust cannot drive stock negative; expired products may be blocked depending on reason.
- Duplicate variants in the same event are rejected.
- Optional `Idempotency-Key` header prevents duplicate submissions.

### Responses

- `201 Created` with the new event (including per-line signed quantities).
- `400 Bad Request` for validation failures (empty lines, negative quantities, inactive variant/warehouse, mismatched reason codes, etc.).
- `403 Forbidden` if the user lacks access to the warehouse (especially for `SELLER` role).
- `404 Not Found` if warehouse/variant is missing.

---

## Fetch Event – GET `/api/v1/stock-events/{id}`

Returns the event with lines or `404 Not Found` if it doesn’t exist/accessible.

---

## List Events – GET `/api/v1/stock-events`

Paginated list with extensive filters.

| Param        | Type      | Required | Description                                           |
|--------------|-----------|----------|-------------------------------------------------------|
| type         | enum      | no       | Filter by event type.                                |
| warehouseId  | UUID      | no       | Required for `SELLER` role; otherwise optional.       |
| variantId    | UUID      | no       | Filter events containing a given variant.             |
| occurredFrom | timestamp | no       | Start of occurrence window (UTC).                     |
| occurredTo   | timestamp | no       | End of occurrence window (UTC).                       |
| reasonCode   | enum      | no       | Filter by reason.                                    |
| page/size/sort | standard | no     | Pagination (default: `occurredAt,desc`).              |

Response: `200 OK` with a page of events (each with lines). `SELLER` users must always provide `warehouseId`, otherwise the backend rejects the request (`403`).

---

## Common Errors

| Status | When it happens                                | Detail example                             |
|--------|------------------------------------------------|--------------------------------------------|
| 400    | Invalid payload (duplicate lines, bad quantities) | `"detail": "invalid payload"`             |
| 403    | Warehouse access denied                         | `"detail": "Forbidden"`                  |
| 404    | Warehouse or variant not found                  | `"detail": "stock-warehouse-not-found"`   |
| 409    | Idempotency conflict (duplicate events)         | `"detail": "stock-idempotency-conflict"`  |

---

## Front-End Tips

- Prefetch variant and warehouse data to provide selection dropdowns when creating events.
- Validate quantities client-side (positive, non-zero for `ADJUST`) to lessen round trips.
- Use the pagination filters to build “movement history” views (by warehouse, variant, or reason code).
- Show the signed `quantity` values returned in responses to clarify adjustments (positive vs. negative).
- For idempotent submission, generate a UUID and set it in the `Idempotency-Key` header when posting new events.
