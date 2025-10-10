# Category API Guide

Category routes (`/api/v1/categories`) build the product hierarchy. Write operations usually require `ADMIN` or `MANAGER` roles; reads only need an authenticated user. JSON everywhere.

## Category Object Schema

```json
{
  "id": "a2d8a4e5-2188-4f0f-94f3-485f87321474",
  "name": "Electronics",
  "description": "Devices and accessories",
  "parentId": null,
  "parentName": null,
  "path": "electronics",
  "level": 0,
  "active": true,
  "createdAt": "2025-01-10T12:02:30Z",
  "updatedAt": "2025-02-02T08:40:00Z"
}
```

| Field       | Type    | Notes                                                          |
|-------------|---------|----------------------------------------------------------------|
| id          | UUID    | Category identifier.                                           |
| name        | string  | Unique within the same branch (2–100 chars typical validation).|
| description | string  | Optional, up to 2000 chars.                                    |
| parentId    | UUID    | `null` for root categories.                                    |
| parentName  | string  | Convenience field for UIs (null for roots).                    |
| path        | string  | Materialised path usable for breadcrumbs.                      |
| level       | number  | Depth (0 = root).                                              |
| active      | boolean | Soft-delete flag.                                              |
| createdAt   | string  | ISO-8601 timestamp (UTC).                                      |
| updatedAt   | string  | ISO-8601 timestamp (UTC).                                      |

Always include `Authorization: Bearer <accessToken>`.

---

## GET `/api/v1/categories`

Paginated list with optional filters.

Parameters (same semantics as Brands):

| Param      | Type    | Required | Default   | Description                            |
|------------|---------|----------|-----------|----------------------------------------|
| onlyActive | boolean | no       | `false`   | Set `true` to hide inactive categories. |
| page       | number  | no       | `0`       | Zero-based page index.                  |
| size       | number  | no       | `20`      | Page size.                              |
| sort       | string  | no       | `name,asc`| Field + direction (Spring syntax).      |

Response: `200 OK` with `content`, `totalElements`, etc.

---

## GET `/api/v1/categories/root`

List only root categories. Supports the same pagination parameters as the base listing.

---

## GET `/api/v1/categories/{id}`

Fetch a category by UUID.

- `200 OK` with the Category.
- `404 Not Found` if missing.

---

## GET `/api/v1/categories/name/{name}`

Fetch a category by exact name. Returns `404` if not found.

---

## GET `/api/v1/categories/{id}/subcategories`

Return direct children (paginated).

```
GET /api/v1/categories/{id}/subcategories?page=0&size=20
```

Response: `200 OK` with child categories.

---

## GET `/api/v1/categories/{id}/descendants`

Return the entire subtree below the category (array, not paginated). Useful for building nested menus quickly.

---

## POST `/api/v1/categories`

Create a category (`ADMIN` or `MANAGER`).

### Request Body

```json
{
  "name": "Laptops",
  "description": "Portable computers",
  "parentId": "a2d8a4e5-2188-4f0f-94f3-485f87321474"
}
```

| Field       | Type   | Required | Notes                                      |
|-------------|--------|----------|--------------------------------------------|
| name        | string | yes      | Unique in the target branch.               |
| description | string | no       | Optional description.                      |
| parentId    | UUID   | no       | Omit for root categories.                  |

### Responses

- `201 Created` with the new Category.
- `400 Bad Request` for validation errors (duplicate, invalid parent, cycle detected).
- `403 Forbidden` if permissions are missing.

---

## PUT `/api/v1/categories/{id}`

Update a category. Same payload as create. Backend enforces tree integrity (no cycles, parent must exist).

Responses:

- `200 OK` with the updated Category.
- `404 Not Found` if the category doesn’t exist.
- `400 Bad Request` for invalid updates.

---

## DELETE `/api/v1/categories/{id}`

Soft-delete (sets `active=false`). Requires `ADMIN`.

Response: `204 No Content`.

---

## PATCH `/api/v1/categories/{id}/activate`

Reactivate a soft-deleted category (`ADMIN`).

- `200 OK` with the restored Category.
- `404 Not Found` if the category is unknown.

---

## Common Errors

| Status | When it happens                                | Detail example                      |
|--------|------------------------------------------------|-------------------------------------|
| 400    | Invalid hierarchy / validation failure         | `"detail": "invalid-category-tree"` |
| 403    | Caller lacks required role                     | `"detail": "Forbidden"`            |
| 404    | Category not found                             | `"detail": "category-not-found"`   |

---

## Front-End Tips

- Use `path`/`level` to build breadcrumbs and nested menus without extra round trips.
- In edit forms, prevent picking the current node (or its descendants) as the new parent to avoid cycles.
- Hide inactive categories from customer-facing views unless you intentionally support archive browsing.
