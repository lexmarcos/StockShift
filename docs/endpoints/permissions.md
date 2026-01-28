# Permissions

## Overview
The StockShift system uses a role-based permission system. Permissions follow the format `RESOURCE:ACTION:SCOPE` and are assigned to roles, which are then assigned to users.

---

## Endpoints

### List All Permissions

```
GET /stockshift/api/permissions
```

**Authorization:** Requires `ROLE_ADMIN`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "resource": "PRODUCT",
      "resourceDisplayName": "Produto",
      "action": "CREATE",
      "actionDisplayName": "Criar",
      "scope": "ALL",
      "scopeDisplayName": "Todos",
      "description": "Create products"
    }
  ]
}
```

---

## Permission Format

```
RESOURCE:ACTION:SCOPE
```

- **RESOURCE**: The entity type being accessed
- **ACTION**: The operation being performed
- **SCOPE**: The access level

---

## Resources

| Resource | Description |
|----------|-------------|
| `PRODUCT` | Product management |
| `STOCK` | Stock and inventory management |
| `SALE` | Sales transactions |
| `USER` | User management |
| `WAREHOUSE` | Warehouse management |
| `REPORT` | Reports and analytics |

---

## Actions

| Action | Description |
|--------|-------------|
| `CREATE` | Create new resources |
| `READ` | View/read resources |
| `UPDATE` | Modify existing resources |
| `DELETE` | Remove resources |
| `APPROVE` | Approve pending operations (e.g., stock transfers) |

---

## Scopes

| Scope | Description |
|-------|-------------|
| `ALL` | Access to all resources of this type |
| `OWN_WAREHOUSE` | Access only to resources in user's assigned warehouse(s) |
| `OWN` | Access only to resources created by the user |

---

## Special Permissions

| Permission | Description |
|------------|-------------|
| `*` | Wildcard - grants full access to all resources. Only assigned to ADMIN role. |

---

## Default Permissions

### Product Permissions
| Permission | Description |
|------------|-------------|
| `PRODUCT:CREATE:ALL` | Create products |
| `PRODUCT:READ:ALL` | View all products |
| `PRODUCT:UPDATE:ALL` | Update products |
| `PRODUCT:DELETE:ALL` | Delete products |

### Stock Permissions
| Permission | Description |
|------------|-------------|
| `STOCK:CREATE:ALL` | Create stock movements |
| `STOCK:READ:ALL` | View stock |
| `STOCK:UPDATE:ALL` | Update stock |
| `STOCK:APPROVE:ALL` | Approve stock transfers (all warehouses) |
| `STOCK:APPROVE:OWN_WAREHOUSE` | Approve transfers for own warehouse only |

### Sale Permissions
| Permission | Description |
|------------|-------------|
| `SALE:CREATE:ALL` | Create sales |
| `SALE:READ:ALL` | View sales |

### User Permissions
| Permission | Description |
|------------|-------------|
| `USER:CREATE:ALL` | Create users |
| `USER:READ:ALL` | View users |
| `USER:UPDATE:ALL` | Update users |
| `USER:DELETE:ALL` | Delete users |

### Warehouse Permissions
| Permission | Description |
|------------|-------------|
| `WAREHOUSE:CREATE:ALL` | Create warehouses |
| `WAREHOUSE:READ:ALL` | View warehouses |
| `WAREHOUSE:UPDATE:ALL` | Update warehouses |
| `WAREHOUSE:DELETE:ALL` | Delete warehouses |

### Report Permissions
| Permission | Description |
|------------|-------------|
| `REPORT:READ:ALL` | View all reports |

---

## System Roles

### ADMIN
- Automatically created when a tenant registers
- Receives the wildcard permission `*` granting full access
- Users with ADMIN role bypass individual permission checks

---

## Frontend Implementation

### Checking Permissions

```typescript
// Check if user has a specific permission
function hasPermission(userPermissions: string[], required: string): boolean {
  // Admin has all permissions
  if (userPermissions.includes('*')) {
    return true;
  }
  return userPermissions.includes(required);
}

// Example usage
const canCreateProduct = hasPermission(user.permissions, 'PRODUCT:CREATE:ALL');
const canApproveTransfers = hasPermission(user.permissions, 'STOCK:APPROVE:ALL');
```

### Checking Multiple Permissions

```typescript
// Check if user has any of the required permissions
function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  if (userPermissions.includes('*')) {
    return true;
  }
  return required.some(perm => userPermissions.includes(perm));
}

// Check if user has all required permissions
function hasAllPermissions(userPermissions: string[], required: string[]): boolean {
  if (userPermissions.includes('*')) {
    return true;
  }
  return required.every(perm => userPermissions.includes(perm));
}
```

---

## API Authorization

The backend validates permissions on each request:

1. Extract permissions from JWT token
2. Check if `*` (admin wildcard) is present - grants access
3. Otherwise, verify required permission exists in user's permission list
4. Return `403 Forbidden` if permission check fails
