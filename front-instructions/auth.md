# Auth API Guide

Designed for client applications (web, mobile, desktop) that call the Stockshift Inventory auth endpoints under `/api/v1/auth`. All requests and responses are JSON.

## Common Requirements

- `Content-Type: application/json` for every request.
- Base URL: replace `https://api.stockshift.dev` with the environment you target (e.g., `http://localhost:8080` for local dev).
- Successful login returns both an `accessToken` (JWT) and a `refreshToken` (UUID). Send the access token on subsequent calls via `Authorization: Bearer <accessToken>` and store the refresh token securely for renewals.

Error payloads follow a consistent structure similar to:

```json
{
  "type": "about:blank",
  "title": "Invalid credentials",
  "status": 401,
  "detail": "Bad credentials",
  "instance": "/api/v1/auth/login"
}
```

The `status` field mirrors the HTTP status code.

---

## POST `/api/v1/auth/login`

Exchange a username/password for an access + refresh token pair.

### Request Body

```json
{
  "username": "testuser",
  "password": "testpass123"
}
```

| Field     | Type   | Required | Notes                 |
|-----------|--------|----------|-----------------------|
| username  | string | yes      | Case-sensitive login. |
| password  | string | yes      | Plain-text password.  |

### Successful Response

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "1b1f2c19-20c7-4a14-9b45-f7c6cdb707f0",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "username": "testuser",
  "role": "ADMIN"
}
```

| Field        | Type   | Description                                                     |
|--------------|--------|-----------------------------------------------------------------|
| accessToken  | string | JWT valid for roughly one hour; use in the `Authorization` header. |
| refreshToken | string | UUID used to request new access tokens.                        |
| tokenType    | string | Always `Bearer`.                                                |
| expiresIn    | number | Lifetime in seconds (≈3600).                                    |
| username     | string | Echoed for convenience.                                        |
| role         | string | One of `ADMIN`, `MANAGER`, `SELLER`.                            |

#### Typical Errors

| Status | When it happens                  | Detail example              |
|--------|----------------------------------|-----------------------------|
| 401    | Wrong username/password          | `"detail": "Bad credentials"` |
| 400    | Missing/invalid payload fields   | Validation error list        |

#### Usage Tip

Persist both tokens. Access tokens drive authenticated API calls; refresh tokens should live in secure storage (avoid plain localStorage/sessionStorage without extra safeguards).

---

## POST `/api/v1/auth/refresh`

Rotate the access token using a valid refresh token. The refresh token is revalidated and returned unchanged.

### Request Body

```json
{
  "refreshToken": "1b1f2c19-20c7-4a14-9b45-f7c6cdb707f0"
}
```

| Field        | Type   | Required | Notes                                |
|--------------|--------|----------|--------------------------------------|
| refreshToken | string | yes      | Must match a non-expired token issued during login. |

### Successful Response

Same structure as the login response, but with a fresh `accessToken`.

```json
{
  "accessToken": "new-access-token-...",
  "refreshToken": "1b1f2c19-20c7-4a14-9b45-f7c6cdb707f0",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "username": "testuser",
  "role": "ADMIN"
}
```

#### Typical Errors

| Status | When it happens              | Detail example                   |
|--------|------------------------------|----------------------------------|
| 400    | Unknown or expired token     | `"detail": "Refresh token expired"` |
| 400    | Missing/blank refresh token  | Validation error list            |

#### Usage Tip

Call this endpoint when API requests start returning `401 Unauthorized` because the access token expired. Replace the stored access token with the new one; keep using the same refresh token until logout or expiration.

---

## POST `/api/v1/auth/logout`

Revoke a refresh token so it can no longer mint new access tokens. The request body is optional; calling without a token is a no-op that still succeeds (useful for idempotent logout flows).

### Request Body (optional)

```json
{
  "refreshToken": "1b1f2c19-20c7-4a14-9b45-f7c6cdb707f0"
}
```

| Field        | Type   | Required | Notes                                            |
|--------------|--------|----------|--------------------------------------------------|
| refreshToken | string | no       | Provide it to actively revoke the stored token. |

### Successful Response

```
204 No Content
```

#### Typical Errors

| Status | When it happens                   | Detail example             |
|--------|-----------------------------------|----------------------------|
| 400    | Token not found or already revoked | `"detail": "Token not found"` |

#### Usage Tip

Always call logout when the user signs out. If your app opens multiple sessions/tabs, revoking the refresh token ensures all sessions become invalid simultaneously.
