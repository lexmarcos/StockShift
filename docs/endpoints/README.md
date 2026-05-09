# StockShift API Endpoint Documentation

This directory documents the frontend-facing HTTP API. The backend is the source of truth; when there is a conflict, use the backend controller and DTO definitions.

## Base URL

```text
Development: http://localhost:8080
```

## Response Format

Most authenticated endpoints return `ApiResponse<T>`:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

Errors generally return:

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

Some endpoints intentionally return non-JSON responses, such as redirects, CSV/XLSX downloads, or empty webhook responses. Those exceptions are documented in the endpoint-specific files.

## Authentication

Most endpoints require a JWT Bearer token:

```text
Authorization: Bearer {accessToken}
```

Auth endpoints and selected public callbacks/webhooks document their own behavior.

## Documents

- [audit.md](audit.md): audit log queries and exports.
- [auth.md](auth.md): login, refresh, logout, registration, current user, warehouse switching.
- [batches.md](batches.md): stock batches and product batch operations.
- [brands.md](brands.md): product brand CRUD.
- [categories.md](categories.md): product category CRUD and parent filtering.
- [permissions.md](permissions.md): permission catalog.
- [products.md](products.md): product CRUD, lookup, search, and image analysis.
- [reports.md](reports.md): dashboard and stock reports.
- [roles.md](roles.md): role CRUD and role-permission assignment.
- [sales.md](sales.md): sales, sales dashboard, cancellation, and InfinitePay integration.
- [stock-movements.md](stock-movements.md): stock movement creation, listing, detail, and summary.
- [tenants.md](tenants.md): company configuration and InfinitePay tenant settings.
- [transfer.md](transfer.md): warehouse transfer lifecycle and validation.
- [users.md](users.md): tenant user management.
- [warehouses.md](warehouses.md): warehouse CRUD and warehouse stock views.

## Frontend Rules

- Check these documents before adding or changing API calls.
- Keep all `ky` and `useSWR` calls inside standard `.model.ts` hooks.
- Use backend permission strings exactly as documented.
- Preserve Spring pageable response handling for endpoints returning `Page<T>`.
