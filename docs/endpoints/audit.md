# Audit Endpoints

## Overview

These endpoints provide access to the audit trail, recording all significant actions performed in the system. Every create, update, delete, and sensitive read operation is logged as an audit event with before/after state snapshots.

**Base URL**: `/api/audit`
**Authentication**: Required (Bearer token)
**Required Permission**: `audit:read`

---

## Audit Event Structure

Each audit event captures:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Event identifier |
| `tenantId` | UUID | Tenant the event belongs to |
| `occurredAt` | LocalDateTime | When the event occurred |
| `actorUserId` | UUID | User who performed the action |
| `actorEmail` | String | Email of the acting user |
| `warehouseId` | UUID | Warehouse context (if applicable) |
| `operation` | String | High-level operation (`CREATE`, `UPDATE`, `DELETE`, `READ`) |
| `action` | String | Specific action (`product.created`, `batch.updated`, etc.) |
| `outcome` | String | `SUCCESS` or `FAILURE` |
| `resourceType` | String | Type of resource affected (`Product`, `Batch`, `Warehouse`, etc.) |
| `resourceId` | String | ID of the affected resource |
| `reason` | String | Reason for the action (e.g., cancellation reason) |
| `requestId` | String | Unique request identifier for correlation |
| `httpMethod` | String | HTTP method of the request |
| `httpPath` | String | Request path |
| `httpStatus` | Integer | HTTP response status |
| `ipAddress` | String | Client IP address |
| `userAgent` | String | Client user agent |
| `beforeState` | Map | Resource state before the action |
| `afterState` | Map | Resource state after the action |
| `changedFields` | List\<String\> | Fields that were modified |
| `metadata` | Map | Additional context data |

---

## GET /api/audit/events

**Summary**: List audit events with filtering and pagination

### Request

**Method**: `GET`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actorUserId` | UUID | No | Filter by the user who performed the action |
| `resourceType` | String | No | Filter by resource type (e.g., `Product`, `Batch`) |
| `resourceId` | String | No | Filter by resource ID |
| `operation` | String | No | Filter by operation (`CREATE`, `UPDATE`, `DELETE`, `READ`) |
| `action` | String | No | Filter by specific action code |
| `outcome` | String | No | Filter by outcome (`SUCCESS`, `FAILURE`) |
| `dateFrom` | ISO DateTime | No | Start date/time filter |
| `dateTo` | ISO DateTime | No | End date/time filter |
| `page` | int | No | Page number (0-indexed, default: 0) |
| `size` | int | No | Page size (default: 20) |
| `sort` | string | No | Sort field and direction (default: `occurredAt,desc`) |

**Example**: `/api/audit/events?resourceType=Product&operation=UPDATE&dateFrom=2026-06-01T00:00:00&page=0&size=10`

### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Audit events retrieved successfully",
  "data": {
    "content": [
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440000",
        "tenantId": "550e8400-e29b-41d4-a716-446655440000",
        "occurredAt": "2026-06-28T10:00:00",
        "actorUserId": "990e8400-e29b-41d4-a716-446655440000",
        "actorEmail": "admin@example.com",
        "warehouseId": null,
        "operation": "UPDATE",
        "action": "product.updated",
        "outcome": "SUCCESS",
        "resourceType": "Product",
        "resourceId": "770e8400-e29b-41d4-a716-446655440000",
        "reason": null,
        "requestId": "req-abc123",
        "httpMethod": "PUT",
        "httpPath": "/api/products/770e8400-e29b-41d4-a716-446655440000",
        "httpStatus": 200,
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 ...",
        "beforeState": {
          "name": "Old Name",
          "price": 1000
        },
        "afterState": {
          "name": "New Name",
          "price": 1200
        },
        "changedFields": ["name", "price"],
        "metadata": {}
      }
    ],
    "pageable": { "pageNumber": 0, "pageSize": 10 },
    "totalElements": 150,
    "totalPages": 15,
    "size": 10,
    "number": 0,
    "first": true,
    "last": false
  }
}
```

### Frontend Implementation Guide

1. **Table View**: Display events in a data table with sortable columns
2. **Filter Panel**: Date range picker, resource type dropdown, operation dropdown, user search
3. **Expandable Rows**: Click a row to expand and see `beforeState`, `afterState`, and `changedFields`
4. **Diff View**: Show a diff-like view comparing before/after state
5. **Color Coding**: Green for CREATE, blue for UPDATE, red for DELETE, gray for READ
6. **Request Correlation**: Click `requestId` to see all events from the same request

---

## GET /api/audit/resources/{resourceType}/{resourceId}

**Summary**: Get audit events for a specific resource

### Request

**Method**: `GET`
**URL Parameters**:
- `resourceType` (String) - Resource type (e.g., `Product`, `Batch`, `Warehouse`)
- `resourceId` (String) - Resource UUID

**Pagination**: Supports `page`, `size`, `sort` query parameters (same format as `/events`).

**Example**: `/api/audit/resources/Product/770e8400-e29b-41d4-a716-446655440000?page=0&size=20`

### Response

**Status Code**: `200 OK`

Same paginated format as `GET /api/audit/events`.

### Frontend Implementation Guide

1. **Resource History**: Embed in resource detail pages (e.g., "Product X History" tab)
2. **Timeline View**: Render events as a vertical timeline
3. **Change Highlights**: Show what fields changed and by whom

---

## GET /api/audit/events/export.csv

**Summary**: Export audit events as CSV file

### Request

**Method**: `GET`

**Query Parameters**: Same filter parameters as `GET /api/audit/events`, plus:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | int | No | Max events to export (default: 10000) |

**Example**: `/api/audit/events/export.csv?dateFrom=2026-06-01T00:00:00&dateTo=2026-06-30T23:59:59&limit=5000`

### Response

**Status Code**: `200 OK`
**Content-Type**: `text/csv; charset=UTF-8`
**Content-Disposition**: `attachment; filename="audit-events-20260601000000-20260630235959.csv"`

Returns raw CSV bytes (not wrapped in `ApiResponse`).

---

## GET /api/audit/events/export.xlsx

**Summary**: Export audit events as XLSX (Excel) file

### Request

**Method**: `GET`

**Query Parameters**: Same as CSV export.

**Example**: `/api/audit/events/export.xlsx?operation=DELETE&limit=5000`

### Response

**Status Code**: `200 OK`
**Content-Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
**Content-Disposition**: `attachment; filename="audit-events-20260601000000-20260630235959.xlsx"`

Returns raw XLSX bytes (not wrapped in `ApiResponse`).

### Frontend Implementation Guide

1. **Export Button**: Add export dropdown (CSV and Excel options) in the audit events view
2. **Respect Filters**: Pass current filters to the export endpoints
3. **Loading State**: Show progress indicator during export (large exports may take time)
4. **File Download**: Trigger browser download using `Content-Disposition` filename

---

## Common Error Responses

### 403 Forbidden
```json
{
  "timestamp": "2026-06-28T10:00:00",
  "status": 403,
  "error": "Forbidden",
  "message": "You don't have permission to access this resource",
  "path": "/api/audit/events"
}
```

---

## Integration Points

### With Other Modules

- Every mutation operation in the system generates an audit event automatically
- Use `resourceType` + `resourceId` to trace the full history of any entity
- Use `requestId` to correlate multiple events from a single API request
