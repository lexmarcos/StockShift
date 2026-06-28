# Roles & Permissions Endpoints

## Overview

These endpoints manage RBAC (Role-Based Access Control) roles and permissions. Roles bundle permissions together, and users are assigned roles. Permissions define what actions can be performed on resources.

**Roles Base URL**: `/api/roles`
**Permissions Base URL**: `/api/permissions`
**Authentication**: Required (Bearer token)

---

## Roles

### Authorization Matrix

| Endpoint | Permission |
|----------|-----------|
| `POST /api/roles` | `roles:create` |
| `GET /api/roles` | `roles:read` |
| `GET /api/roles/{id}` | `roles:read` |
| `PUT /api/roles/{id}` | `roles:update` |
| `DELETE /api/roles/{id}` | `roles:delete` |

---

### GET /api/roles

**Summary**: Get all roles for the current tenant

#### Request

**Method**: `GET`

#### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "VENDEDOR",
      "description": "Sales person with limited access",
      "isSystemRole": false,
      "permissions": [
        {
          "id": "660e8400-e29b-41d4-a716-446655440001",
          "code": "products:read",
          "description": "View products"
        },
        {
          "id": "660e8400-e29b-41d4-a716-446655440002",
          "code": "sales:create",
          "description": "Create sales"
        }
      ],
      "createdAt": "2026-01-20T08:00:00",
      "updatedAt": "2026-01-20T08:00:00"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "ADMIN",
      "description": "System administrator",
      "isSystemRole": true,
      "permissions": [],
      "createdAt": "2026-01-20T08:00:00",
      "updatedAt": "2026-01-20T08:00:00"
    }
  ]
}
```

**Response Fields**:

- `id`: UUID of the role
- `name`: Role name (unique per tenant)
- `description`: Optional description
- `isSystemRole`: `true` for built-in roles (ADMIN, SUPER_ADMIN) that cannot be modified or deleted
- `permissions`: List of permission objects assigned to this role
  - `id`: UUID of the permission
  - `code`: Permission code (e.g., `products:read`)
  - `description`: Human-readable description
- `createdAt` / `updatedAt`: Timestamps

> **Note**: The `ADMIN` role has `isSystemRole: true` and an empty `permissions` array because admin users receive the `*` wildcard permission granting full access.

---

### POST /api/roles

**Summary**: Create a new role

#### Request

**Method**: `POST`
**Content-Type**: `application/json`

##### Request Body

```json
{
  "name": "ESTOQUISTA",
  "description": "Warehouse stock manager",
  "permissionIds": [
    "660e8400-e29b-41d4-a716-446655440001",
    "660e8400-e29b-41d4-a716-446655440003",
    "660e8400-e29b-41d4-a716-446655440005"
  ]
}
```

**Field Validations**:
- `name`: Required, max 100 characters
- `description`: Optional, max 500 characters
- `permissionIds`: Optional, set of permission UUIDs to assign to the role

#### Response

**Status Code**: `201 CREATED`

```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "name": "ESTOQUISTA",
    "description": "Warehouse stock manager",
    "isSystemRole": false,
    "permissions": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "code": "products:read",
        "description": "View products"
      }
    ],
    "createdAt": "2026-06-28T10:00:00",
    "updatedAt": "2026-06-28T10:00:00"
  }
}
```

#### Error Responses

**400 Bad Request** - Duplicate name:
```json
{
  "status": 400,
  "error": "Business Rule Violation",
  "message": "Role name already exists in this tenant"
}
```

---

### GET /api/roles/{id}

**Summary**: Get role by ID

#### Request

**Method**: `GET`
**URL Parameters**: `id` (UUID) - Role identifier

#### Response

**Status Code**: `200 OK`

Same format as individual item in the list response.

---

### PUT /api/roles/{id}

**Summary**: Update a role

#### Request

**Method**: `PUT`
**URL Parameters**: `id` (UUID) - Role identifier
**Content-Type**: `application/json`

##### Request Body

Same structure as POST (all fields replace current values).

**Restriction**: System roles (`ADMIN`, `SUPER_ADMIN`) cannot be updated.

#### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Role updated successfully",
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "name": "ESTOQUISTA SR",
    "description": "Senior warehouse stock manager",
    "isSystemRole": false,
    "permissions": [ ... ],
    "createdAt": "2026-06-28T10:00:00",
    "updatedAt": "2026-06-28T11:00:00"
  }
}
```

---

### DELETE /api/roles/{id}

**Summary**: Delete a role (soft delete)

#### Request

**Method**: `DELETE`
**URL Parameters**: `id` (UUID) - Role identifier

**Restriction**: System roles cannot be deleted. Roles assigned to users cannot be deleted.

#### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Role deleted successfully",
  "data": null
}
```

---

## Permissions

### GET /api/permissions

**Summary**: Get all available permissions (system-wide catalog)

#### Request

**Method**: `GET`
**Required Permission**: `permissions:read`

#### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "code": "products:read",
      "description": "View products",
      "resource": "products",
      "action": "read",
      "scope": null
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "code": "sales:create",
      "description": "Create sales",
      "resource": "sales",
      "action": "create",
      "scope": null
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440003",
      "code": "products:analyze_image",
      "description": "Analyze product images with AI",
      "resource": "products",
      "action": "analyze_image",
      "scope": null
    }
  ]
}
```

**Response Fields**:

- `id`: UUID of the permission
- `code`: Permission code used in authorization checks (`resource:action` format)
- `description`: Human-readable description
- `resource`: The resource type (e.g., `products`, `sales`, `batches`)
- `action`: The action (e.g., `create`, `read`, `update`, `delete`, `execute`, `validate`)
- `scope`: Optional scope qualifier

---

## Frontend Implementation Guide

### Role Management

1. **Role List**: Table with name, description, permission count, system role badge
2. **Create/Edit Modal**: Form with name, description, and permission multi-select checkboxes
3. **System Role Indicator**: Show lock icon or badge for system roles (cannot edit/delete)
4. **Permission Picker**: Group permissions by resource for easier selection
5. **Delete Guard**: Prevent deletion of roles assigned to users (show error message)

### Permission Reference

1. **Permission Catalog**: Use `GET /api/permissions` to populate permission pickers in role forms
2. **View-Only**: Permissions are system-defined (seeded data). There are no create/update/delete endpoints for permissions.

### Common Patterns

1. **Fetch roles** → `GET /api/roles`
2. **Fetch available permissions** → `GET /api/permissions`
3. **Create role** → `POST /api/roles` with selected `permissionIds`
4. **Assign role to user** → `POST /api/users` or `PUT /api/users/{id}` with `roleIds`

---

## Common Error Responses

### 400 Bad Request - System Role Modification
```json
{
  "status": 400,
  "error": "Business Rule Violation",
  "message": "Cannot modify system role 'ADMIN'"
}
```

### 400 Bad Request - Role In Use
```json
{
  "status": 400,
  "error": "Business Rule Violation",
  "message": "Cannot delete role: role is assigned to 3 users"
}
```

### 404 Not Found
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Role not found with id: 880e8400-e29b-41d4-a716-446655440000"
}
```
