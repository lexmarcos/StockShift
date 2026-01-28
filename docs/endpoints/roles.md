# Role Endpoints

## Overview
These endpoints manage roles in the StockShift system. Roles are tenant-scoped and can have multiple permissions assigned.

**Base URL**: `/api/roles`
**Authentication**: Required (Bearer token)

---

## POST /api/roles
**Summary**: Create a new role

### Authorization
**Required Permissions**: `ROLE_ADMIN`

### Request
**Method**: `POST`
**Content-Type**: `application/json`

#### Request Body
```json
{
  "name": "Stock Manager",
  "description": "Manages stock movements and batches",
  "permissionIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001"
  ]
}
```

**Field Details**:
- `name`: Required, role name (max 100 characters)
- `description`: Optional, role description (max 500 characters)
- `permissionIds`: Optional, array of permission UUIDs to assign

### Response
**Status Code**: `201 CREATED`

```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Stock Manager",
    "description": "Manages stock movements and batches",
    "isSystemRole": false,
    "permissions": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "resource": "BATCH",
        "action": "CREATE",
        "scope": "TENANT",
        "description": "Create batches"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "resource": "STOCK_MOVEMENT",
        "action": "CREATE",
        "scope": "TENANT",
        "description": "Create stock movements"
      }
    ],
    "createdAt": "2025-12-28T10:00:00Z",
    "updatedAt": "2025-12-28T10:00:00Z"
  }
}
```

### Frontend Implementation Guide
1. **Role Form**: Create modal or page with form fields
2. **Permission Selector**: Multi-select or checkbox list for permissions
3. **Group Permissions**: Group permissions by resource (Product, Batch, etc.)
4. **Preview**: Show selected permissions summary
5. **Validation**: Validate name is required and unique

---

## GET /api/roles
**Summary**: Get all roles

### Authorization
**Required Permissions**: `ROLE_ADMIN`

### Request
**Method**: `GET`

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Admin",
      "description": "Full system access",
      "isSystemRole": true,
      "permissions": [...],
      "createdAt": "2025-12-28T10:00:00Z",
      "updatedAt": "2025-12-28T10:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Stock Manager",
      "description": "Manages stock movements and batches",
      "isSystemRole": false,
      "permissions": [...],
      "createdAt": "2025-12-28T10:00:00Z",
      "updatedAt": "2025-12-28T10:00:00Z"
    }
  ]
}
```

### Frontend Implementation Guide
1. **Roles List**: Display roles in table or card layout
2. **System Role Badge**: Indicate system roles (non-editable)
3. **Permission Count**: Show number of permissions per role
4. **Actions**: Include edit, delete actions (disabled for system roles)
5. **Search/Filter**: Allow searching roles by name

---

## GET /api/roles/{id}
**Summary**: Get role by ID

### Authorization
**Required Permissions**: `ROLE_ADMIN`

### Request
**Method**: `GET`
**URL Parameters**: `id` (UUID) - Role identifier

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Stock Manager",
    "description": "Manages stock movements and batches",
    "isSystemRole": false,
    "permissions": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "resource": "BATCH",
        "action": "CREATE",
        "scope": "TENANT",
        "description": "Create batches"
      }
    ],
    "createdAt": "2025-12-28T10:00:00Z",
    "updatedAt": "2025-12-28T10:00:00Z"
  }
}
```

### Frontend Implementation Guide
1. **Detail View**: Display full role information
2. **Permissions List**: Show all assigned permissions grouped by resource
3. **Users with Role**: List users assigned to this role
4. **Edit Button**: Quick access to edit form (hidden for system roles)

---

## PUT /api/roles/{id}
**Summary**: Update role

### Authorization
**Required Permissions**: `ROLE_ADMIN`

### Request
**Method**: `PUT`
**URL Parameters**: `id` (UUID) - Role identifier
**Content-Type**: `application/json`

#### Request Body
Same structure as POST /api/roles

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Role updated successfully",
  "data": {
    // Updated role object
  }
}
```

### Frontend Implementation Guide
1. **Edit Modal**: Open modal/drawer with pre-populated form
2. **System Role Check**: Prevent editing system roles
3. **Permission Diff**: Show added/removed permissions
4. **Impact Warning**: Warn about users affected by permission changes
5. **Optimistic Update**: Update UI immediately, rollback on error

---

## DELETE /api/roles/{id}
**Summary**: Delete role

### Authorization
**Required Permissions**: `ROLE_ADMIN`

### Request
**Method**: `DELETE`
**URL Parameters**: `id` (UUID) - Role identifier

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Role deleted successfully",
  "data": null
}
```

### Frontend Implementation Guide
1. **Confirmation Modal**: Require confirmation before deletion
2. **System Role Check**: Prevent deleting system roles
3. **User Impact**: Show number of users assigned to this role
4. **Alternative Action**: Suggest reassigning users to another role
5. **Error Handling**: Handle constraint errors

---

## Frontend Best Practices

### Role Management Interface
```typescript
// Example role types
interface Role {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  scope: string;
  description: string;
}

// Group permissions by resource
function groupPermissionsByResource(permissions: Permission[]): Map<string, Permission[]> {
  return permissions.reduce((map, permission) => {
    const existing = map.get(permission.resource) || [];
    map.set(permission.resource, [...existing, permission]);
    return map;
  }, new Map<string, Permission[]>());
}
```

### Permission Selector Component
1. **Grouped View**: Group permissions by resource
2. **Select All**: Allow selecting all permissions for a resource
3. **Search**: Filter permissions by name/description
4. **Preview**: Show summary of selected permissions
5. **Conflict Detection**: Warn about conflicting permissions

### Visual Design
1. **System Role Badge**: Clearly mark system roles as non-editable
2. **Permission Icons**: Use icons for different resources
3. **Color Coding**: Use colors for different permission actions (read, create, update, delete)
4. **Count Badges**: Show permission count on role cards

### State Management
1. **Cache Roles**: Cache role list
2. **Invalidation**: Refresh on create/update/delete
3. **Permission Cache**: Cache available permissions for selector

---

## Common Error Responses

### 400 Bad Request - Duplicate Name
```json
{
  "success": false,
  "message": "Role with name 'Stock Manager' already exists",
  "data": null
}
```

### 400 Bad Request - System Role Modification
```json
{
  "success": false,
  "message": "System roles cannot be modified",
  "data": null
}
```

### 400 Bad Request - System Role Deletion
```json
{
  "success": false,
  "message": "System roles cannot be deleted",
  "data": null
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Role not found",
  "data": null
}
```

### 404 Not Found - Permission Not Found
```json
{
  "success": false,
  "message": "Permission not found with id: 550e8400-e29b-41d4-a716-446655440000",
  "data": null
}
```
