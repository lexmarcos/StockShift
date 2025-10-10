# Warehouses API Guide

Warehouse endpoints (`/api/v1/warehouses`) manage physical locations (stores, depots). Access requirements:

- `ADMIN` or `MANAGER`: create/update warehouses.
- `ADMIN`: soft delete/reactivate.
- Reads require authentication.

All payloads/headers follow JSON + `Authorization: Bearer <accessToken>` conventions.

## Warehouse Object Schema

```json
{
  "id": "b3e2f7a8-2d1d-4c1b-b948-6a1b53ecb847",
  "code": "WH-SAO-01",
  "name": "São Paulo Depot",
  "description": "Primary distribution center",
  "type": "DISTRIBUTION",
  "address": "Av. Central, 1000",
  "city": "São Paulo",
  "state": "SP",
  "postalCode": "04500-000",
  "country": "BR",
  "phone": "+55 11 4002-8922",
  "email": "warehouse-sp@stockshift.com",
  "managerName": "Maria Silva",
  "active": true,
  "createdAt": "2025-01-05T08:15:00Z",
  "updatedAt": "2025-02-01T11:45:00Z"
}
```

`type` is an enum defined in `WarehouseType` (e.g., `STORE`, `DISTRIBUTION`).

---

## Listing & Lookup

### GET `/api/v1/warehouses`

Paginated list.

Parameters:

| Param      | Type    | Required | Default | Description                               |
|------------|---------|----------|---------|-------------------------------------------|
| onlyActive | boolean | no       | `false` | `true` to return only `active=true`.       |
| page       | number  | no       | `0`     | Zero-based page index.                     |
| size       | number  | no       | `20`    | Page size.                                 |
| sort       | string  | no       | `name,asc` | Standard Spring sort syntax.            |

Response: `200 OK` with `content`, `totalElements`, etc.

### GET `/api/v1/warehouses/type/{type}`

Filter by type (e.g., `STORE`). Supports `onlyActive`, `page`, `size`, `sort` query parameters.

### GET `/api/v1/warehouses/search`

Search by name or code using `query` parameter:

```
GET /api/v1/warehouses/search?query=Depot&page=0&size=10
```

Response: `200 OK` with matching warehouses.

### GET `/api/v1/warehouses/{id}`

Fetch by UUID. `404 Not Found` if unknown.

### GET `/api/v1/warehouses/code/{code}`

Fetch by code. `404 Not Found` if missing.

---

## Create Warehouse – POST `/api/v1/warehouses`

Requires `ADMIN` or `MANAGER`.

### Request Body

```json
{
  "code": "WH-SAO-01",
  "name": "São Paulo Depot",
  "description": "Primary distribution center",
  "type": "DISTRIBUTION",
  "address": "Av. Central, 1000",
  "city": "São Paulo",
  "state": "SP",
  "postalCode": "04500-000",
  "country": "BR",
  "phone": "+55 11 4002-8922",
  "email": "warehouse-sp@stockshift.com",
  "managerName": "Maria Silva"
}
```

| Field        | Type   | Required | Notes                                         |
|--------------|--------|----------|-----------------------------------------------|
| code         | string | yes      | Unique identifier (≤100 chars).               |
| name         | string | yes      | ≤200 chars.                                   |
| description  | string | no       | ≤500 chars.                                   |
| type         | enum   | yes      | One of `WarehouseType`.                      |
| address/city/state/postalCode/country | string | no | Optional contact information. |
| phone        | string | no       | ≤20 chars.                                    |
| email        | string | no       | Valid email (≤100 chars).                     |
| managerName  | string | no       | ≤100 chars.                                   |

### Responses

- `201 Created` with the new warehouse.
- `400 Bad Request` for validation issues (duplicate code, invalid email, etc.).
- `409 Conflict` when `code` already exists.
- `403 Forbidden` if permissions are missing.

---

## Update Warehouse – PUT `/api/v1/warehouses/{id}`

Requires `ADMIN` or `MANAGER`. Payload mirrors the create request but fields are optional; unspecified fields remain unchanged.

Responses:

- `200 OK` with the updated warehouse.
- `404 Not Found` if no warehouse matches `id`.
- `400 Bad Request` for validation errors.

---

## Soft Delete – DELETE `/api/v1/warehouses/{id}`

Requires `ADMIN`. Sets `active=false`.

Response: `204 No Content`.

---

## Reactivate – PATCH `/api/v1/warehouses/{id}/activate`

Requires `ADMIN`. Returns `200 OK` with the warehouse or `404 Not Found` if missing.

---

## Common Errors

| Status | When it happens                       | Detail example                   |
|--------|---------------------------------------|----------------------------------|
| 400    | Validation failure (invalid email, etc.) | `"detail": "invalid payload"`   |
| 403    | Caller lacks required role            | `"detail": "Forbidden"`        |
| 404    | Warehouse not found                   | `"detail": "warehouse-not-found"` |
| 409    | Code already in use                   | `"detail": "warehouse-already-exists"` |

---

## Front-End Tips

- Enforce uppercase/trimmed codes on the client to avoid duplicate entries.
- Use the search endpoint to power auto-complete pickers by code/name.
- Respect the `active` flag; hide inactive warehouses from operational views unless administrators request them.
- When editing, pre-fill contact fields to reduce friction; keep validation messages aligned with the backend rules (length, email format, etc.).
