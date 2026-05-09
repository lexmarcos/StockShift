# Audit Endpoints

Base path: `/api/audit`

All endpoints require Bearer authentication and `audit:read`.

## Query Filters

Audit list and export endpoints accept these optional filters:

- `actorUserId`: UUID
- `resourceType`: string
- `resourceId`: string
- `operation`: string
- `action`: string
- `outcome`: string
- `dateFrom`: ISO date-time
- `dateTo`: ISO date-time

List endpoints use Spring pageable parameters: `page`, `size`, and `sort`.

## Data Shape

### AuditEventResponse

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "tenantId": "00000000-0000-0000-0000-000000000001",
  "occurredAt": "2026-05-09T10:00:00",
  "actorUserId": "00000000-0000-0000-0000-000000000002",
  "actorEmail": "user@example.com",
  "warehouseId": "00000000-0000-0000-0000-000000000003",
  "operation": "UPDATE",
  "action": "products:update",
  "outcome": "SUCCESS",
  "resourceType": "PRODUCT",
  "resourceId": "00000000-0000-0000-0000-000000000004",
  "reason": null,
  "requestId": "request-id",
  "httpMethod": "PUT",
  "httpPath": "/api/products/00000000-0000-0000-0000-000000000004",
  "httpStatus": 200,
  "ipAddress": "127.0.0.1",
  "userAgent": "Mozilla/5.0",
  "beforeState": {},
  "afterState": {},
  "changedFields": ["name"],
  "metadata": {}
}
```

## Endpoints

### GET `/api/audit/events`

Lists audit events.

- Query: filters plus pageable params
- Default sort: `occurredAt,DESC`
- Success: `200 OK`, `ApiResponse<Page<AuditEventResponse>>`

### GET `/api/audit/resources/{resourceType}/{resourceId}`

Lists audit events for one resource.

- Path: `resourceType`, `resourceId`
- Query: pageable params
- Default sort: `occurredAt,DESC`
- Success: `200 OK`, `ApiResponse<Page<AuditEventResponse>>`

### GET `/api/audit/events/export.csv`

Exports audit events as CSV.

- Query: filters plus optional `limit`, default `10000`
- Success: `200 OK`, `text/csv; charset=UTF-8`
- Response header: `Content-Disposition: attachment; filename="audit-events-{dateFrom}-{dateTo}.csv"`

### GET `/api/audit/events/export.xlsx`

Exports audit events as XLSX.

- Query: filters plus optional `limit`, default `10000`
- Success: `200 OK`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Response header: `Content-Disposition: attachment; filename="audit-events-{dateFrom}-{dateTo}.xlsx"`

