# Attributes API Guide

Attribute endpoints live under `/api/v1/attributes` and are split into **definitions** (the attribute schema) and **values** (allowed options for ENUM-like attributes). Mutations generally require elevated permissions:

- `ADMIN` or `MANAGER` for creating/updating definitions or values.
- `ADMIN` for delete/reactivate operations.

All payloads are JSON and require `Authorization: Bearer <accessToken>`.

---

## Attribute Definition Schema

```json
{
  "id": "dc0ff0f3-6f5b-4b57-b2cc-9a2a5d10d0c8",
  "name": "Color",
  "code": "COLOR",
  "type": "ENUM",
  "description": "Visual color",
  "isVariantDefining": true,
  "isRequired": false,
  "applicableCategoryIds": [
    "f33a7f2c-4c3a-4c67-83ab-24ae18dcb599"
  ],
  "sortOrder": 0,
  "status": "ACTIVE",
  "createdAt": "2025-01-11T09:30:00Z",
  "updatedAt": "2025-02-04T12:05:00Z"
}
```

`type` accepts one of `ENUM`, `MULTI_ENUM`, `TEXT`, `NUMBER`, `BOOLEAN`. Values can only be added to `ENUM`/`MULTI_ENUM` definitions.

---

## Definition Routes

### GET `/api/v1/attributes/definitions`

Paginated list of definitions.

Query parameters:

| Param      | Type    | Required | Default | Description                               |
|------------|---------|----------|---------|-------------------------------------------|
| onlyActive | boolean | no       | `false` | Set `true` to include only `status=ACTIVE`.|
| page       | number  | no       | `0`     | Zero-based index.                          |
| size       | number  | no       | `20`    | Page size.                                 |
| sort       | string  | no       | `name,asc` | Spring sort syntax.                      |

Response: `200 OK` with `content`, `totalElements`, etc.

### GET `/api/v1/attributes/definitions/{id}`

Fetch by UUID. Returns `404 Not Found` if missing.

### GET `/api/v1/attributes/definitions/code/{code}`

Fetch by case-insensitive code.

### POST `/api/v1/attributes/definitions`

Create a definition (roles: `ADMIN`, `MANAGER`).

#### Request Body

```json
{
  "name": "Color",
  "code": "COLOR",
  "type": "ENUM",
  "description": "Visual color",
  "isVariantDefining": true,
  "isRequired": false,
  "applicableCategoryIds": [],
  "sortOrder": 0
}
```

| Field                 | Type    | Required | Notes                                                      |
|-----------------------|---------|----------|------------------------------------------------------------|
| name                  | string  | yes      | Max 100 chars.                                             |
| code                  | string  | yes      | Max 100 chars, unique (usually uppercase).                 |
| type                  | string  | yes      | One of `ENUM`, `MULTI_ENUM`, `TEXT`, `NUMBER`, `BOOLEAN`.  |
| description           | string  | no       | Max 500 chars.                                             |
| isVariantDefining     | boolean | no       | Defaults to `true`.                                        |
| isRequired            | boolean | no       | Defaults to `false`.                                       |
| applicableCategoryIds | array   | no       | List of category UUIDs where the attribute applies.        |
| sortOrder             | number  | no       | UI ordering hint (default `0`).                            |

Responses:

- `201 Created` with the new definition.
- `400 Bad Request` for validation failures.
- `409 Conflict` if a definition with the same code already exists.
- `403 Forbidden` if the caller lacks the required role.

### PUT `/api/v1/attributes/definitions/{id}`

Update a definition. Payload mirrors the create request but all fields are optional; only provided fields are updated.

Responses:

- `200 OK` with the updated definition.
- `404 Not Found` if `id` is unknown.
- `400 Bad Request` for validation issues.

### DELETE `/api/v1/attributes/definitions/{id}`

Soft-delete a definition (`status` becomes `INACTIVE`; all values are also marked inactive). Requires `ADMIN` role. Response: `204 No Content`.

### PATCH `/api/v1/attributes/definitions/{id}/activate`

Reactivate a definition (`ADMIN`). Returns `200 OK` with the definition.

---

## Attribute Value Schema

```json
{
  "id": "aa7b7eef-c9bf-4a9a-b1a1-b8bdbfa74353",
  "definitionId": "dc0ff0f3-6f5b-4b57-b2cc-9a2a5d10d0c8",
  "definitionName": "Color",
  "definitionCode": "COLOR",
  "value": "Red",
  "code": "RED",
  "description": "Bright red",
  "swatchHex": "#FF0000",
  "status": "ACTIVE",
  "createdAt": "2025-01-18T14:00:00Z",
  "updatedAt": "2025-02-01T10:15:00Z"
}
```

---

## Value Routes

### GET `/api/v1/attributes/definitions/{definitionId}/values`

Paginated list of values for the given definition.

Parameters mirror the definition list with `onlyActive` to filter active values.

### GET `/api/v1/attributes/values/{id}`

Fetch a value by UUID.

- `200 OK` with the value.
- `404 Not Found` if unknown.

### POST `/api/v1/attributes/definitions/{definitionId}/values`

Create a value (roles: `ADMIN`, `MANAGER`). Only valid for definitions whose `type` is `ENUM` or `MULTI_ENUM`.

#### Request Body

```json
{
  "value": "Red",
  "code": "RED",
  "description": "Bright red",
  "swatchHex": "#FF0000"
}
```

| Field       | Type   | Required | Notes                                                |
|-------------|--------|----------|------------------------------------------------------|
| value       | string | yes      | Max 100 chars.                                       |
| code        | string | yes      | Max 100 chars, unique per definition.                |
| description | string | no       | Optional, ≤500 chars.                                |
| swatchHex   | string | no       | Must match `#RRGGBB` if provided (useful for colors).|

Responses:

- `201 Created` with the new value.
- `400 Bad Request` for validation errors or if the definition type does not allow values.
- `409 Conflict` when a value with the same code already exists for the definition.
- `403 Forbidden` if lacking permissions.

### PUT `/api/v1/attributes/values/{id}`

Update a value. Payload matches the create request but fields are optional. Response: `200 OK` with the updated value or `404 Not Found` if the value doesn’t exist.

### DELETE `/api/v1/attributes/values/{id}`

Soft-delete (sets `status=INACTIVE`). Requires `ADMIN`. Response: `204 No Content`.

### PATCH `/api/v1/attributes/values/{id}/activate`

Reactivate a value (`ADMIN`). Returns `200 OK` or `404 Not Found` if the value is missing.

---

## Common Errors

| Status | When it happens                                  | Detail example                               |
|--------|--------------------------------------------------|----------------------------------------------|
| 400    | Validation error / invalid definition type       | `"detail": "invalid payload"`                |
| 400    | Definition is inactive when creating a value     | `"detail": "definition inactive"`            |
| 403    | Missing required role                            | `"detail": "Forbidden"`                     |
| 404    | Definition/value not found                       | `"detail": "attribute-definition-not-found"` |
| 409    | Duplicate code on create                         | `"detail": "attribute-definition-exists"` or value equivalent |

> Exact `detail` strings vary; consult the backend error payload to show user-friendly copy.

---

## Front-End Tips

- Normalize attribute codes to uppercase before submitting to avoid duplicate conflicts.
- When editing definitions, disable value management if the type is not `ENUM`/`MULTI_ENUM`.
- Track the `status` field in UIs and filter out inactive definitions/values unless administrators explicitly request them.
