# Roles Endpoints

Base path: `/api/roles`

All endpoints require Bearer authentication. Responses use `ApiResponse<T>`.

## Permissions

- `roles:create` for create.
- `roles:read` for list and detail.
- `roles:update` for update.
- `roles:delete` for delete.

## Data Shapes

### RoleRequest

```json
{
  "name": "Operator",
  "description": "Warehouse operator",
  "permissionIds": ["00000000-0000-0000-0000-000000000000"]
}
```

### RoleResponse

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "name": "Operator",
  "description": "Warehouse operator",
  "isSystemRole": false,
  "permissions": [
    {
      "id": "00000000-0000-0000-0000-000000000001",
      "code": "products:read",
      "description": "Read products"
    }
  ],
  "createdAt": "2026-05-09T10:00:00",
  "updatedAt": "2026-05-09T10:00:00"
}
```

## Endpoints

### POST `/api/roles`

Creates a role.

- Body: `RoleRequest`
- Success: `201 Created`, `ApiResponse<RoleResponse>`

### GET `/api/roles`

Lists all roles for the current tenant.

- Success: `200 OK`, `ApiResponse<RoleResponse[]>`

### GET `/api/roles/{id}`

Gets one role by UUID.

- Path: `id` UUID
- Success: `200 OK`, `ApiResponse<RoleResponse>`

### PUT `/api/roles/{id}`

Updates a role.

- Path: `id` UUID
- Body: `RoleRequest`
- Success: `200 OK`, `ApiResponse<RoleResponse>`

### DELETE `/api/roles/{id}`

Soft-deletes a role.

- Path: `id` UUID
- Success: `200 OK`, `ApiResponse<null>`

