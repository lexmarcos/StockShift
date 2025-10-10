# Products API Guide

Product endpoints live under `/api/v1/products`. Read operations require an authenticated user; write operations usually demand elevated permissions:

- `ADMIN` or `MANAGER`: create, update.
- `ADMIN`: soft delete, reactivate.

All payloads use JSON. Supply `Authorization: Bearer <accessToken>` for every request.

## Product Object Schema

```json
{
  "id": "5a8c0c3c-1d6a-4c8d-8d3a-3bf7d72ed3b0",
  "name": "Laptop X",
  "description": "14-inch ultrabook",
  "brandId": "65153c43-b2ec-4c71-9d41-ebe5b58f5ef0",
  "brandName": "Acme",
  "categoryId": "4d8f060a-4ccf-4c1f-a0ee-39e839a6c1f3",
  "categoryName": "Laptops",
  "basePrice": 129900,
  "expiryDate": "2025-12-31",
  "expired": false,
  "active": true,
  "createdAt": "2025-01-20T10:15:00Z",
  "updatedAt": "2025-02-04T11:30:00Z"
}
```

| Field       | Type    | Notes                                              |
|-------------|---------|----------------------------------------------------|
| basePrice   | number  | Price in cents (long).                             |
| expiryDate  | string  | Optional ISO date; omit for non-expiring products. |
| expired     | boolean | Indicates whether `expiryDate` is in the past.     |
| active      | boolean | `false` after soft delete.                         |

---

## Listing & Search Routes

### GET `/api/v1/products`

Paginated list with optional `onlyActive` filter.

Parameters mirror other listings (`page`, `size`, `sort`, `onlyActive`). Default sort is `name,asc`.

### GET `/api/v1/products/search`

Search products by name.

```
GET /api/v1/products/search?q=laptop&page=0&size=20
```

`q` is required. Returns `200 OK` with a page of matching products.

### GET `/api/v1/products/brand/{brandId}`

List products filtered by brand (paginated). Returns `404` if the brand doesn’t exist.

### GET `/api/v1/products/category/{categoryId}`

List products under a specific category (paginated). `404` when category is unknown.

### GET `/api/v1/products/expired`

List products whose `expiryDate` is in the past (paginated; sorted by `expiryDate` ascending by default).

### GET `/api/v1/products/expiring-soon`

List products expiring within `days` (default `30`).

```
GET /api/v1/products/expiring-soon?days=14&page=0&size=20
```

---

## Fetch by Identifier

### GET `/api/v1/products/{id}`

Fetch by UUID. Returns `404 Not Found` if missing or inactive.

### GET `/api/v1/products/name/{name}`

Fetch by exact name (case-sensitive) among active products. `404` if missing.

---

## Create Product – POST `/api/v1/products`

Requires `ADMIN` or `MANAGER` role.

### Request Body

```json
{
  "name": "Laptop X",
  "description": "14-inch ultrabook",
  "brandId": "65153c43-b2ec-4c71-9d41-ebe5b58f5ef0",
  "categoryId": "4d8f060a-4ccf-4c1f-a0ee-39e839a6c1f3",
  "basePrice": 129900,
  "expiryDate": "2025-12-31"
}
```

| Field       | Type   | Required | Notes                                          |
|-------------|--------|----------|------------------------------------------------|
| name        | string | yes      | Max 200 chars.                                 |
| description | string | no       | Optional, ≤2000 chars.                         |
| brandId     | UUID   | no       | Optional association.                          |
| categoryId  | UUID   | no       | Optional association.                          |
| basePrice   | number | yes      | Minimum `1` (stored as cents).                 |
| expiryDate  | string | no       | ISO date; must be in the future if provided.   |

### Responses

- `201 Created` with the new Product.
- `400 Bad Request` for validation errors (blank name, zero price, past expiry).
- `404 Not Found` if supplied `brandId` or `categoryId` doesn’t exist.
- `403 Forbidden` if caller lacks role.

---

## Update Product – PUT `/api/v1/products/{id}`

Requires `ADMIN` or `MANAGER`. Payload matches the create request but fields are optional. Unspecified fields remain unchanged.

Responses:

- `200 OK` with the updated Product.
- `404 Not Found` if product doesn’t exist.
- `400 Bad Request` for validation issues.

---

## Soft Delete – DELETE `/api/v1/products/{id}`

Requires `ADMIN`. Sets `active=false`.

Response: `204 No Content`.

---

## Reactivate – PATCH `/api/v1/products/{id}/activate`

Requires `ADMIN`. Reactivates a soft-deleted product.

Response: `200 OK` with the Product or `404 Not Found` if the product was never created.

---

## Common Errors

| Status | When it happens                             | Detail example                  |
|--------|---------------------------------------------|---------------------------------|
| 400    | Validation failure                          | `"detail": "invalid payload"`   |
| 403    | Missing required role                       | `"detail": "Forbidden"`        |
| 404    | Product/brand/category not found            | `"detail": "product-not-found"`|

---

## Front-End Tips

- Store prices as integers (cents) to avoid floating-point issues when editing.
- Use `expired` and `expiryDate` to highlight products approaching or past expiry.
- Respect the `active` flag; hide inactive products from standard catalog views unless the user is managing archives.
- Combine `/expiring-soon` with client-side notifications to alert managers about upcoming expirations.
