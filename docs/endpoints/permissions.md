# Permissions Endpoints

Base path: `/api/permissions`

All endpoints require Bearer authentication. Responses use `ApiResponse<T>`.

## Permissions

- `permissions:read` for listing permissions.

## Data Shapes

### PermissionResponse

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "code": "products:read",
  "description": "Read products",
  "resource": "products",
  "action": "read",
  "scope": "tenant"
}
```

## Endpoints

### GET `/api/permissions`

Lists all permissions available to assign to roles.

- Success: `200 OK`, `ApiResponse<PermissionResponse[]>`

