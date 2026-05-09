# User Management Endpoints

## Overview
These endpoints handle user management within a tenant. All endpoints require authentication and the matching user permission. Users with `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`, or `*` are allowed by the permission guard.

**Base URL**: `/api/users`

---

## Error Response Format

Validation, business rule, permission, and not found errors use the global error response format:

```json
{
  "timestamp": "2026-01-27T10:30:00",
  "status": 400,
  "error": "Business Rule Violation",
  "message": "Error message",
  "path": "/api/users"
}
```

Validation errors include a `validationErrors` object:

```json
{
  "timestamp": "2026-01-27T10:30:00",
  "status": 400,
  "error": "Validation Failed",
  "message": "Invalid input",
  "path": "/api/users",
  "validationErrors": {
    "email": "Invalid email format"
  }
}
```

---

## GET /api/users
**Summary**: List all users in the current tenant

### Request
**Method**: `GET`
**Authentication**: Required (Bearer token)
**Required Permissions**: `users:read`

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "fullName": "John Doe",
      "isActive": true,
      "mustChangePassword": false,
      "lastLogin": "2026-01-27T10:30:00",
      "createdAt": "2026-01-20T08:00:00",
      "roles": ["ADMIN"],
      "warehouses": ["Warehouse SP", "Warehouse RJ"]
    }
  ]
}
```

**Response Fields**:
- `id`: Unique user identifier
- `email`: User email address
- `fullName`: User's full name
- `isActive`: Whether the user account is active
- `mustChangePassword`: Whether user must change password on next login
- `lastLogin`: Last login timestamp (null if never logged in)
- `createdAt`: Account creation timestamp
- `roles`: List of role names assigned to the user
- `warehouses`: List of warehouse names the user has access to

---

## POST /api/users
**Summary**: Create a new user in the current tenant

### Request
**Method**: `POST`
**Content-Type**: `application/json`
**Authentication**: Required (Bearer token)
**Required Permissions**: `users:create`

#### Request Body
```json
{
  "email": "newuser@example.com",
  "fullName": "New User",
  "roleIds": ["550e8400-e29b-41d4-a716-446655440001"],
  "warehouseIds": ["660e8400-e29b-41d4-a716-446655440002", "770e8400-e29b-41d4-a716-446655440003"]
}
```

**Field Validations**:
- `email`: Required, valid email format, unique within tenant
- `fullName`: Required, cannot be blank
- `roleIds`: Required, at least one role must be specified
- `warehouseIds`: Required, at least one warehouse must be specified

### Response
**Status Code**: `201 CREATED`

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "userId": "880e8400-e29b-41d4-a716-446655440004",
    "email": "newuser@example.com",
    "fullName": "New User",
    "temporaryPassword": "Ab3xK9mP",
    "mustChangePassword": true,
    "roles": ["VENDEDOR"],
    "warehouses": ["Warehouse SP", "Warehouse RJ"]
  }
}
```

**Response Fields**:
- `userId`: Unique identifier for the created user
- `email`: User email address
- `fullName`: User's full name
- `temporaryPassword`: Auto-generated temporary password (shown only once)
- `mustChangePassword`: Always `true` for newly created users
- `roles`: List of role names assigned
- `warehouses`: List of warehouse names assigned

### Error Responses

**400 Bad Request** (Email already exists):
```json
{
  "timestamp": "2026-01-27T10:30:00",
  "status": 400,
  "error": "Business Rule Violation",
  "message": "Email already registered in this tenant",
  "path": "/api/users"
}
```

**400 Bad Request** (Invalid role):
```json
{
  "timestamp": "2026-01-27T10:30:00",
  "status": 400,
  "error": "Business Rule Violation",
  "message": "Role not found: <roleId>",
  "path": "/api/users"
}
```

**400 Bad Request** (Role from another tenant):
```json
{
  "timestamp": "2026-01-27T10:30:00",
  "status": 400,
  "error": "Business Rule Violation",
  "message": "Role does not belong to this tenant: <roleId>",
  "path": "/api/users"
}
```

**400 Bad Request** (Invalid warehouse):
```json
{
  "timestamp": "2026-01-27T10:30:00",
  "status": 400,
  "error": "Business Rule Violation",
  "message": "Warehouse not found: <warehouseId>",
  "path": "/api/users"
}
```

**400 Bad Request** (Inactive warehouse):
```json
{
  "timestamp": "2026-01-27T10:30:00",
  "status": 400,
  "error": "Business Rule Violation",
  "message": "Warehouse is inactive: <warehouseId>",
  "path": "/api/users"
}
```

**403 Forbidden** (Missing permission):
```json
{
  "timestamp": "2026-01-27T10:30:00",
  "status": 403,
  "error": "Forbidden",
  "message": "You don't have permission to access this resource",
  "path": "/api/users"
}
```

---

## GET /api/users/{id}
**Summary**: Get user by ID

### Request
**Method**: `GET`
**URL Parameters**: `id` (UUID) - User identifier
**Authentication**: Required (Bearer token)
**Required Permissions**: `users:read`

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "fullName": "John Doe",
    "isActive": true,
    "mustChangePassword": false,
    "lastLogin": "2026-01-27T10:30:00",
    "createdAt": "2026-01-20T08:00:00",
    "roles": ["ADMIN"],
    "warehouses": ["Warehouse SP", "Warehouse RJ"]
  }
}
```

### Error Responses

**404 Not Found**:
```json
{
  "timestamp": "2026-01-27T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "User not found with id: <userId>",
  "path": "/api/users/<userId>"
}
```

---

## PUT /api/users/{id}
**Summary**: Update user details

### Request
**Method**: `PUT`
**URL Parameters**: `id` (UUID) - User identifier
**Content-Type**: `application/json`
**Authentication**: Required (Bearer token)
**Required Permissions**: `users:update`

#### Request Body
```json
{
  "fullName": "John Doe Updated",
  "isActive": true,
  "roleIds": ["550e8400-e29b-41d4-a716-446655440001"],
  "warehouseIds": ["660e8400-e29b-41d4-a716-446655440002"]
}
```

**Field Validations**:
- `fullName`: Required, cannot be blank
- `isActive`: Optional, boolean to activate/deactivate user
- `roleIds`: Required, at least one role must be specified
- `warehouseIds`: Required, at least one warehouse must be specified

**Note**: Email cannot be changed after user creation.

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "fullName": "John Doe Updated",
    "isActive": true,
    "mustChangePassword": false,
    "lastLogin": "2026-01-27T10:30:00",
    "createdAt": "2026-01-20T08:00:00",
    "roles": ["VENDEDOR"],
    "warehouses": ["Warehouse SP"]
  }
}
```

### Error Responses

**404 Not Found**:
```json
{
  "timestamp": "2026-01-27T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "User not found with id: <userId>",
  "path": "/api/users/<userId>"
}
```

**400 Bad Request** (Invalid role):
```json
{
  "timestamp": "2026-01-27T10:30:00",
  "status": 400,
  "error": "Business Rule Violation",
  "message": "Role not found: <roleId>",
  "path": "/api/users/<userId>"
}
```

**400 Bad Request** (Role from another tenant):
```json
{
  "timestamp": "2026-01-27T10:30:00",
  "status": 400,
  "error": "Business Rule Violation",
  "message": "Role does not belong to this tenant: <roleId>",
  "path": "/api/users/<userId>"
}
```

**400 Bad Request** (Invalid warehouse):
```json
{
  "timestamp": "2026-01-27T10:30:00",
  "status": 400,
  "error": "Business Rule Violation",
  "message": "Warehouse not found: <warehouseId>",
  "path": "/api/users/<userId>"
}
```

**400 Bad Request** (Inactive warehouse):
```json
{
  "timestamp": "2026-01-27T10:30:00",
  "status": 400,
  "error": "Business Rule Violation",
  "message": "Warehouse is inactive: <warehouseId>",
  "path": "/api/users/<userId>"
}
```

### Frontend Implementation Guide
1. **Edit Modal**: Open modal/drawer with pre-populated form
2. **Email Display**: Show email as read-only (cannot be changed)
3. **Active Toggle**: Include toggle to activate/deactivate user
4. **Role/Warehouse Selection**: Multi-select for roles and warehouses
5. **Confirmation**: Confirm before deactivating a user

---

## DELETE /api/users/{id}
**Summary**: Delete user

### Request
**Method**: `DELETE`
**URL Parameters**: `id` (UUID) - User identifier
**Authentication**: Required (Bearer token)
**Required Permissions**: `users:delete`

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": null
}
```

### Error Responses

**404 Not Found**:
```json
{
  "timestamp": "2026-01-27T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "User not found with id: <userId>",
  "path": "/api/users/<userId>"
}
```

**400 Bad Request** (Self-deletion):
```json
{
  "timestamp": "2026-01-27T10:30:00",
  "status": 400,
  "error": "Business Rule Violation",
  "message": "Cannot delete your own account",
  "path": "/api/users/<userId>"
}
```

### Frontend Implementation Guide
1. **Confirmation Modal**: Require confirmation before deletion
2. **Self-Delete Prevention**: Disable delete button for current user
3. **Impact Warning**: Show warning about permanent deletion
4. **Alternative**: Suggest deactivating instead of deleting

---

## Warehouse Access Control

Users are associated with specific warehouses. This controls what data they can see and modify.

### Access Rules

| User Type | Warehouse Access |
|-----------|------------------|
| ADMIN | Full access flag in the authenticated principal |
| Non-admin with warehouses | Access only to assigned warehouses/current warehouse context |
| Non-admin without warehouses | No warehouse scope available for warehouse-scoped operations |

### Affected Operations

When a non-admin user accesses the system:
- **Warehouses**: Only sees assigned warehouses
- **Batches**: Only sees batches from assigned warehouses
- **Sales**: Can only create sales in assigned warehouses

### Frontend Implementation Guide

1. **User Creation Form**: Include warehouse selection (multi-select)
2. **Temporary Password**: Display the temporary password clearly and advise admin to share securely
3. **Role Selection**: Fetch available roles from `/api/roles`
4. **Warehouse Selection**: Fetch available warehouses from `/api/warehouses`
5. **Error Handling**: Display specific validation errors
6. **User List**: Show roles and warehouses for each user

---

## Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (missing permission or no warehouse access)
- `404`: Not Found
- `500`: Internal Server Error
