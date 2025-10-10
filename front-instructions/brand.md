# Brand API Guide

Routes under `/api/v1/brands` manage product brands. Most write actions require `ADMIN` or `MANAGER` roles; read operations expect an authenticated user. All requests/responses use JSON.

## Brand Object Schema

```json
{
  "id": "a4c8e6cc-5f6e-4ce0-8137-5a59a14fb542",
  "name": "Acme",
  "description": "Consumer goods",
  "active": true,
  "createdAt": "2025-01-15T10:20:30Z",
  "updatedAt": "2025-02-01T09:00:00Z"
}
```

| Field       | Type    | Notes                                   |
|-------------|---------|-----------------------------------------|
| id          | UUID    | Brand identifier.                       |
| name        | string  | 2–100 chars, unique.                    |
| description | string  | Optional, up to 1000 chars.             |
| active      | boolean | `false` indicates a soft-deleted brand. |
| createdAt   | string  | ISO-8601 timestamp (UTC).               |
| updatedAt   | string  | ISO-8601 timestamp (UTC).               |

Include `Authorization: Bearer <accessToken>` in every request below.

---

## GET `/api/v1/brands`

Paginated list of brands.

Query parameters:

| Param      | Type    | Required | Default   | Description                               |
|------------|---------|----------|-----------|-------------------------------------------|
| onlyActive | boolean | no       | `false`   | Returns only `active=true` when set.       |
| page       | number  | no       | `0`       | Zero-based page index.                     |
| size       | number  | no       | `20`      | Page size.                                 |
| sort       | string  | no       | `name,asc`| Spring sort syntax (`field,direction`).    |

Response: `200 OK` with a page object containing `content`, `totalElements`, etc.

---

## GET `/api/v1/brands/{id}`

Fetch a brand by UUID.

- `200 OK` with the Brand.
- `404 Not Found` if the brand does not exist.

---

## GET `/api/v1/brands/name/{name}`

Fetch a brand by exact name (case-sensitive).

- `200 OK` with the Brand.
- `404 Not Found` if missing.

---

## POST `/api/v1/brands`

Create a new brand (`ADMIN` or `MANAGER` roles).

### Request Body

```json
{
  "name": "Acme",
  "description": "Consumer goods"
}
```

| Field       | Type   | Required | Notes                       |
|-------------|--------|----------|-----------------------------|
| name        | string | yes      | Unique, 2–100 chars.        |
| description | string | no       | Optional, ≤1000 chars.      |

### Responses

- `201 Created` with the new Brand.
- `400 Bad Request` for validation errors (blank/duplicate name, etc.).
- `403 Forbidden` if the user lacks permissions.

---

## PUT `/api/v1/brands/{id}`

Update an existing brand (`ADMIN` or `MANAGER`).

Request body matches the create payload and may include `active` to deactivate the brand without using DELETE:

```json
{
  "name": "Acme International",
  "description": "Global consumer goods",
  "active": true
}
```

### Responses

- `200 OK` with the updated Brand.
- `404 Not Found` if no brand matches `id`.
- `400 Bad Request` for validation issues.

---

## DELETE `/api/v1/brands/{id}`

Soft-delete a brand (sets `active=false`). Requires `ADMIN` role.

Response: `204 No Content`.

---

## PATCH `/api/v1/brands/{id}/activate`

Reactivate a soft-deleted brand (`ADMIN` role).

- `200 OK` with the reactivated Brand.
- `404 Not Found` if the brand does not exist.

---

## Common Errors

| Status | When it happens                     | Detail example                 |
|--------|-------------------------------------|--------------------------------|
| 400    | Validation failure                  | `"detail": "invalid payload"` |
| 403    | Missing required role               | `"detail": "Forbidden"`       |
| 404    | Brand not found                     | `"detail": "brand-not-found"` |
| 409    | Name conflicts with existing brand  | `"detail": "brand-already-exists"` |

---

## Front-End Tips

- Cache brand lists and refresh only when you detect changes (e.g., after create/update/delete).
- Hide inactive brands in customer-facing selectors unless you explicitly support archival browsing.
- Coordinate optimistic UI updates with conflict handling: if a create/update returns `409`, refresh the list and prompt the user to pick a different name.
