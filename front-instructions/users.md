# Users API Guide

User management endpoints (`/api/v1/users`) are restricted to administrative roles:

- `ADMIN`: full access (create, update, delete, reactivate, list).
- `MANAGER`: read-only access (list, fetch by id/username).

All requests use JSON and require `Authorization: Bearer <accessToken>`.

## User Object Schema

```json
{
  "id": "9d9a9d32-6d4f-4d1c-8f07-756c0eabd412",
  "username": "manager01",
  "email": "manager01@stockshift.com",
  "role": "MANAGER",
  "active": true,
  "createdAt": "2025-01-12T09:10:00Z",
  "updatedAt": "2025-02-01T08:45:00Z"
}
```

- `role` is one of `ADMIN`, `MANAGER`, `SELLER`.
- `active=false` indicates a soft-deleted user.

---

## List & Lookup

### GET `/api/v1/users`

Paginated list (requires `ADMIN` or `MANAGER`).

Parameters:

| Param | Type   | Default | Description                   |
|-------|--------|---------|-------------------------------|
| page  | number | `0`     | Zero-based page index.        |
| size  | number | `20`    | Page size.                    |
| sort  | string | `createdAt,desc` | Sort order.        |

Response: `200 OK` with `content`, `totalElements`, etc.

### GET `/api/v1/users/{id}`

Fetch by UUID (`ADMIN`, `MANAGER`). `404 Not Found` if missing.

### GET `/api/v1/users/username/{username}`

Fetch by exact username. `404 Not Found` if missing.

---

## Create User – POST `/api/v1/users`

Requires `ADMIN` role.

### Request Body

```json
{
  "username": "manager01",
  "email": "manager01@stockshift.com",
  "password": "secret123",
  "role": "MANAGER"
}
```

| Field    | Type   | Required | Notes                                      |
|----------|--------|----------|--------------------------------------------|
| username | string | yes      | 3–50 chars, unique.                        |
| email    | string | yes      | Valid email, unique.                       |
| password | string | yes      | 6–100 chars.                               |
| role     | string | yes      | `ADMIN`, `MANAGER`, or `SELLER`.           |

### Responses

- `201 Created` with the new user.
- `400 Bad Request` for validation errors (duplicate username/email, short password, etc.).
- `403 Forbidden` if caller is not `ADMIN`.

Passwords are not returned by the API; only metadata is exposed.

---

## Update User – PUT `/api/v1/users/{id}`

Requires `ADMIN`. Payload mirrors the create request but all fields are optional (except password rules still apply if supplied).

Example body:

```json
{
  "email": "manager01-new@stockshift.com",
  "password": "newSecret123",
  "role": "SELLER"
}
```

Responses:

- `200 OK` with the updated user.
- `404 Not Found` if the user doesn’t exist.
- `400 Bad Request` for validation issues.

---

## Soft Delete – DELETE `/api/v1/users/{id}`

Requires `ADMIN`. Sets `active=false`.

Response: `204 No Content`.

---

## Reactivate – PATCH `/api/v1/users/{id}/activate`

Requires `ADMIN`. Reactivates a soft-deleted user.

- `200 OK` with the user.
- `404 Not Found` if unknown.

---

## Common Errors

| Status | When it happens                      | Detail example                     |
|--------|--------------------------------------|------------------------------------|
| 400    | Validation failure                   | `"detail": "invalid payload"`     |
| 403    | Caller lacks required role           | `"detail": "Forbidden"`          |
| 404    | User not found                       | `"detail": "user-not-found"`      |
| 409    | Username or email already in use     | `"detail": "user-already-exists"` |

---

## Front-End Tips

- Enforce password policies client-side to provide immediate feedback.
- Hide the delete/reactivate controls when the current user lacks `ADMIN` privileges.
- When editing, prevent a user from demoting themselves out of `ADMIN` if your UX allows editing the logged-in account.
- After creation or role updates, refresh user lists to reflect permission changes immediately.
