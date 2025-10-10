# Product Variant API Guide

Product variants (SKUs) are managed under `/api/v1/products/{productId}/variants` and `/api/v1/variants`. They represent concrete sellable combinations of attributes for a product. Access requirements:

- `ADMIN` or `MANAGER`: create/update variants.
- `ADMIN`: delete/reactivate.
- Read endpoints require authentication.

All payloads are JSON; include `Authorization: Bearer <accessToken>`.

## Variant Object Schema

```json
{
  "id": "9f1bcd13-7cc4-4e96-8b5e-9e7c6da0e2cc",
  "productId": "5a8c0c3c-1d6a-4c8d-8d3a-3bf7d72ed3b0",
  "productName": "Laptop X",
  "sku": "LAPTOP-X-RED-256",
  "gtin": "0123456789012",
  "attributesHash": "e4b7f568...",
  "attributes": [
    {
      "valueId": "aa7b7eef-c9bf-4a9a-b1a1-b8bdbfa74353",
      "value": "Red",
      "valueCode": "RED",
      "definitionId": "dc0ff0f3-6f5b-4b57-b2cc-9a2a5d10d0c8",
      "definitionName": "Color",
      "definitionCode": "COLOR",
      "definitionType": "ENUM",
      "isVariantDefining": true
    }
  ],
  "price": 139900,
  "effectivePrice": 139900,
  "weight": 1200,
  "length": 320,
  "width": 220,
  "height": 18,
  "active": true,
  "createdAt": "2025-01-25T11:45:00Z",
  "updatedAt": "2025-02-04T09:20:00Z"
}
```

`effectivePrice` falls back to the parent product price when the variant price is `null`.

---

## Listing & Lookup Routes

### GET `/api/v1/products/{productId}/variants`

Paginated list of variants for a product.

Query parameters:

| Param      | Type    | Required | Default | Description                       |
|------------|---------|----------|---------|-----------------------------------|
| onlyActive | boolean | no       | `false` | Filter inactive variants if `true`.|
| page       | number  | no       | `0`     | Zero-based page index.             |
| size       | number  | no       | `20`    | Page size.                         |
| sort       | string  | no       | `sku,asc` | Sort order.                       |

### GET `/api/v1/variants`

Paginated global list, same parameters as above.

### GET `/api/v1/variants/{id}`

Fetch by variant UUID (`200 OK` or `404 Not Found`).

### GET `/api/v1/variants/sku/{sku}`

Fetch by SKU (case-sensitive). `404 Not Found` if missing.

### GET `/api/v1/variants/gtin/{gtin}`

Fetch by GTIN (case-sensitive). `404 Not Found` if missing.

---

## Create Variant – POST `/api/v1/products/{productId}/variants`

Requires `ADMIN` or `MANAGER`.

### Request Body

```json
{
  "sku": "LAPTOP-X-RED-256",
  "gtin": "0123456789012",
  "attributes": [
    {
      "definitionId": "dc0ff0f3-6f5b-4b57-b2cc-9a2a5d10d0c8",
      "valueId": "aa7b7eef-c9bf-4a9a-b1a1-b8bdbfa74353"
    }
  ],
  "price": 139900,
  "weight": 1200,
  "length": 320,
  "width": 220,
  "height": 18
}
```

| Field       | Type   | Required | Notes                                                             |
|-------------|--------|----------|-------------------------------------------------------------------|
| sku         | string | yes      | Unique (max 100 chars).                                           |
| gtin        | string | no       | Optional global identifier (max 100 chars).                       |
| attributes  | array  | yes      | At least one attr pair (`definitionId`, `valueId`).                |
| price       | number | no       | Non-negative (in cents).                                          |
| weight/length/width/height | number | no | Non-negative physical dimensions.                          |

Validation rules enforced by the backend:

- Definition/value IDs must exist and be active.
- Attributes must match the product’s applicable definitions; required definitions must be present.
- Duplicate attribute combinations per product are rejected (`409 Conflict`).

### Responses

- `201 Created` with the variant.
- `400 Bad Request` for validation errors (missing attributes, inactive definitions, invalid numeric fields).
- `404 Not Found` if product/definition/value is missing.
- `409 Conflict` when SKU or attribute combination already exists.

---

## Update Variant – PUT `/api/v1/variants/{id}`

Requires `ADMIN` or `MANAGER`.

Payload allows updating GTIN and numeric properties; attributes cannot be changed after creation (SKU and hash remain immutable).

Example body:

```json
{
  "gtin": "0123456789013",
  "price": 142900,
  "weight": 1180,
  "length": 318,
  "width": 219,
  "height": 17
}
```

Responses:

- `200 OK` with the updated variant.
- `404 Not Found` if the variant doesn’t exist.
- `400 Bad Request` for invalid data.

---

## Soft Delete – DELETE `/api/v1/variants/{id}`

Requires `ADMIN`. Sets `active=false`.

Response: `204 No Content`.

---

## Reactivate – PATCH `/api/v1/variants/{id}/activate`

Requires `ADMIN`. Returns the variant or `404` if it doesn’t exist.

---

## Common Errors

| Status | When it happens                                  | Detail example                           |
|--------|--------------------------------------------------|------------------------------------------|
| 400    | Validation failure / missing attributes          | `"detail": "invalid payload"`            |
| 403    | Caller lacks required role                       | `"detail": "Forbidden"`                 |
| 404    | Product/variant/definition/value not found       | `"detail": "variant-not-found"`         |
| 409    | Duplicate SKU or attribute combination           | `"detail": "duplicate-variant"`         |

---

## Front-End Tips

- Keep SKU and GTIN inputs uppercase/trimmed to avoid duplicate detection issues.
- When constructing attribute arrays, fetch the product’s applicable definitions first to ensure required ones are included.
- Disable edits to attribute combinations after creation to align with backend immutability.
- Use the `active` flag to hide inactive variants from customer-facing stock views while still exposing them to admins for reactivation.
