# Stock Transfer API Guide

Stock transfers move inventory between warehouses. Endpoints are scoped under `/api/v1/stock-transfers`. Typical roles:

- `ADMIN` or `MANAGER`: create draft transfers, confirm, cancel.
- Read operations (`GET`) require authentication.

All payloads are JSON with `Authorization: Bearer <accessToken>`.

## Transfer Object Schema

```json
{
  "id": "c3d9b079-9c0a-4cc4-9b1f-769fa9d4f9c0",
  "originWarehouseId": "b3e2f7a8-2d1d-4c1b-b948-6a1b53ecb847",
  "originWarehouseCode": "WH-SAO-01",
  "destinationWarehouseId": "1b45f25c-619d-4bda-bd58-7c04377aa6f7",
  "destinationWarehouseCode": "WH-RIO-01",
  "status": "DRAFT",
  "occurredAt": "2025-02-10T14:00:00Z",
  "notes": "Restocking Rio",
  "createdById": "9d9a9d32-6d4f-4d1c-8f07-756c0eabd412",
  "createdByUsername": "manager01",
  "createdAt": "2025-02-05T09:30:00Z",
  "confirmedById": null,
  "confirmedByUsername": null,
  "confirmedAt": null,
  "outboundEventId": null,
  "inboundEventId": null,
  "lines": [
    {
      "id": "6e9a70e1-4369-4717-8d51-4f1be369e15e",
      "variantId": "9f1bcd13-7cc4-4e96-8b5e-9e7c6da0e2cc",
      "variantSku": "LAPTOP-X-RED-256",
      "quantity": 25
    }
  ]
}
```

`status` transitions: `DRAFT` → `CONFIRMED` or `CANCELLED`. Confirmations generate outbound/inbound stock events.

---

## Create Draft Transfer – POST `/api/v1/stock-transfers`

### Request Body

```json
{
  "originWarehouseId": "b3e2f7a8-2d1d-4c1b-b948-6a1b53ecb847",
  "destinationWarehouseId": "1b45f25c-619d-4bda-bd58-7c04377aa6f7",
  "occurredAt": "2025-02-10T14:00:00Z",
  "notes": "Restocking Rio",
  "lines": [
    {
      "variantId": "9f1bcd13-7cc4-4e96-8b5e-9e7c6da0e2cc",
      "quantity": 25
    }
  ]
}
```

| Field                 | Type      | Required | Notes                                                        |
|-----------------------|-----------|----------|--------------------------------------------------------------|
| originWarehouseId     | UUID      | yes      | Source warehouse.                                            |
| destinationWarehouseId| UUID      | yes      | Destination warehouse (must differ from origin).             |
| occurredAt            | timestamp | no       | Defaults to now (UTC) if omitted.                            |
| notes                 | string    | no       | Optional, ≤500 chars.                                        |
| lines                 | array     | yes      | At least one line; see below.                                |

Each line requires `variantId` (UUID) and `quantity` (positive long). The backend validates stock availability, variant/wallet activity, and prohibits zero/negative quantities.

### Responses

- `201 Created` with the draft transfer (`status=DRAFT`).
- `400 Bad Request` for validation issues (same origin/destination, missing lines, insufficient stock, etc.).
- `404 Not Found` if warehouses or variants do not exist.
- `403 Forbidden` if caller lacks permissions.

---

## Confirm Transfer – POST `/api/v1/stock-transfers/{id}/confirm`

Confirms a draft and generates stock movements. Requires `ADMIN` or `MANAGER`.

- Set optional `Idempotency-Key` header to guard against duplicate confirmations.
- Body is empty (`POST` with headers only).

Responses:

- `200 OK` with the confirmed transfer (`status=CONFIRMED`, `confirmedBy*` and stock event IDs populated).
- `409 Conflict` if the transfer is not in `DRAFT` status or if the idempotency key conflicts.
- `404 Not Found` if the transfer ID is invalid.

---

## Cancel Draft – POST `/api/v1/stock-transfers/{id}/cancel`

Cancels a draft transfer. Response: `200 OK` with `status=CANCELLED`. `409 Conflict` when trying to cancel a non-draft transfer.

---

## Fetch Transfer – GET `/api/v1/stock-transfers/{id}`

Returns a transfer by UUID (`200 OK` or `404 Not Found`).

---

## List Transfers – GET `/api/v1/stock-transfers`

Paginated listing with filtering options.

| Param                   | Type      | Required | Description                                         |
|-------------------------|-----------|----------|-----------------------------------------------------|
| status                  | enum      | no       | Filter by `DRAFT`, `CONFIRMED`, `CANCELLED`.         |
| originWarehouseId       | UUID      | no       | Filter by origin.                                   |
| destinationWarehouseId  | UUID      | no       | Filter by destination.                              |
| occurredFrom            | timestamp | no       | Start of occurrence window (ISO-8601).              |
| occurredTo              | timestamp | no       | End of occurrence window.                           |
| page/size/sort          | standard  | no       | Pagination (default: `occurredAt,desc`).            |

Response: `200 OK` with `content` array of transfers.

---

## Common Errors

| Status | When it happens                                  | Detail example                         |
|--------|--------------------------------------------------|----------------------------------------|
| 400    | Validation failure (same warehouse, bad lines)    | `"detail": "invalid payload"`          |
| 403    | Caller lacks required role                        | `"detail": "Forbidden"`               |
| 404    | Transfer/warehouse/variant not found              | `"detail": "transfer-not-found"`       |
| 409    | Confirm/cancel conflicts (already processed)      | `"detail": "transfer-not-draft"`       |

---

## Front-End Tips

- Show draft transfers with clear status labels and actions to confirm or cancel.
- Use the idempotency key header when implementing “Confirm” buttons to avoid double submissions on slow networks.
- After confirmation, surface outbound/inbound event IDs so power users can drill into detailed stock movements.
- When listing, combine `status` and date filters for back-office dashboards (e.g., pending drafts, transfers in a date range).
