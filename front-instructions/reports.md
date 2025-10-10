# Reports API Guide

Reporting endpoints provide read-only projections over stock data. They live under `/api/v1/reports` and require a valid access token. Role enforcement mirrors business rules:

- `ADMIN` & `MANAGER`: Full access.
- `SELLER`: Limited to authorised warehouses (enforced by the backend; always pass `warehouseId` when required).

All responses are paginated unless noted otherwise, with Spring-style metadata (`content`, `totalElements`, etc.).

## 1. Stock Snapshot – GET `/api/v1/reports/stock-snapshot`

Returns current balances per variant, optionally filtered by warehouse, product hierarchy, attributes, etc.

### Query Parameters

| Param                | Type      | Required | Default | Description                                                                  |
|----------------------|-----------|----------|---------|------------------------------------------------------------------------------|
| warehouseId          | UUID      | no*      | —       | Filter by warehouse. Required for `SELLER`; omit for cross-warehouse view.   |
| productId            | UUID      | no       | —       | Filter by product.                                                           |
| categoryId           | UUID      | no       | —       | Filter by category (includes descendants).                                   |
| brandId              | UUID      | no       | —       | Filter by brand.                                                             |
| variantId            | UUID      | no       | —       | Filter by variant.                                                           |
| sku                  | string    | no       | —       | Substring match on SKU (case-insensitive).                                   |
| attributeValueIds    | list<UUID>| no       | —       | Filter by attribute values (comma-separated `attributeValueIds=uuid1&...`).  |
| aggregate            | boolean   | no       | `false` | `true` to aggregate across warehouses (quantity sums, `warehouse*` fields null). |
| includeZero          | boolean   | no       | `false` | If `false`, excludes zero-quantity rows.                                     |
| asOf                 | timestamp | no       | now     | Snapshot at a historical instant (UTC ISO-8601).                              |
| page/size/sort       | standard  | no       | Page defaults; sort defaults to `quantity,desc`.                            |

### Response Shape

Each row contains variant/product metadata, warehouse info (unless aggregated), quantity, and `asOf` timestamp. Example content item:

```json
{
  "variantId": "9f1bcd13-7cc4-4e96-8b5e-9e7c6da0e2cc",
  "sku": "LAPTOP-X-RED-256",
  "productId": "5a8c0c3c-1d6a-4c8d-8d3a-3bf7d72ed3b0",
  "productName": "Laptop X",
  "brandId": "65153c43-b2ec-4c71-9d41-ebe5b58f5ef0",
  "brandName": "Acme",
  "categoryId": "4d8f060a-4ccf-4c1f-a0ee-39e839a6c1f3",
  "categoryName": "Laptops",
  "warehouseId": "b3e2f7a8-2d1d-4c1b-b948-6a1b53ecb847",
  "warehouseName": "São Paulo Depot",
  "quantity": 120,
  "asOf": "2025-02-10T12:00:00Z"
}
```

Use `aggregate=true` for consolidated KPIs; otherwise each warehouse appears independently.

---

## 2. Stock History – GET `/api/v1/reports/stock-history`

Returns a chronological list of stock movements (events) and running balances for a variant/product.

### Query Parameters

| Param         | Type      | Required | Description                                                           |
|---------------|-----------|----------|-----------------------------------------------------------------------|
| variantId     | UUID      | **one of** variantId/productId required | Target specific variant.                     |
| productId     | UUID      | "                                           | Aggregate over all variants of a product.    |
| warehouseId   | UUID      | no       | Filter to one warehouse; **required for SELLER**.                     |
| attributeValueIds | list<UUID> | no | Optional filter on variant attributes.                                |
| dateFrom      | timestamp | no       | Start instant (UTC).                                                   |
| dateTo        | timestamp | no       | End instant (UTC).                                                     |
| page/size/sort| standard  | no       | Sort defaults to `occurredAt,desc`; override with `sort=occurredAt,asc` for timeline. |

### Response Items

```json
{
  "eventId": "0a0fa4e5-21f8-426c-8f8b-8c61d85f7b71",
  "eventType": "INBOUND",
  "warehouseId": "b3e2f7a8-2d1d-4c1b-b948-6a1b53ecb847",
  "warehouseName": "São Paulo Depot",
  "occurredAt": "2025-02-10T08:00:00Z",
  "quantityChange": 25,
  "balanceBefore": 95,
  "balanceAfter": 120,
  "reasonCode": "PURCHASE",
  "notes": "Supplier restock"
}
```

Use ascending sort to render timelines; descending for recent-activity dashboards.

---

## 3. Low Stock – GET `/api/v1/reports/low-stock`

Lists variants whose current quantity is below a threshold.

### Query Parameters

| Param       | Type   | Required | Description                                              |
|-------------|--------|----------|----------------------------------------------------------|
| threshold   | number | yes      | Minimum acceptable quantity (strictly positive).         |
| warehouseId | UUID   | no       | Filter by warehouse; **required for SELLER**.            |
| productId   | UUID   | no       | Filter by product.                                       |
| categoryId  | UUID   | no       | Filter by category.                                      |
| brandId     | UUID   | no       | Filter by brand.                                         |
| sku         | string | no       | Partial match on SKU.                                    |
| attributeValueIds | list<UUID> | no | Attribute filters.                                     |
| page/size/sort | standard | no  | Default sort is `deficit,asc` (most critical first).     |

### Response Row

```json
{
  "variantId": "9f1bcd13-7cc4-4e96-8b5e-9e7c6da0e2cc",
  "sku": "LAPTOP-X-RED-256",
  "productId": "5a8c0c3c-1d6a-4c8d-8d3a-3bf7d72ed3b0",
  "productName": "Laptop X",
  "warehouseId": "b3e2f7a8-2d1d-4c1b-b948-6a1b53ecb847",
  "warehouseName": "São Paulo Depot",
  "quantity": 5,
  "threshold": 20,
  "deficit": -15
}
```

`deficit = quantity - threshold`; negative numbers indicate urgency.

---

## 4. Expiring Items – GET `/api/v1/reports/expiring`

Lists variants with approaching expiry dates.

### Query Parameters

| Param        | Type      | Required | Default | Description                                              |
|--------------|-----------|----------|---------|----------------------------------------------------------|
| warehouseId  | UUID      | no       | —       | Filter by warehouse; **required for SELLER** unless aggregating. |
| productId    | UUID      | no       | —       | Filter by product.                                       |
| categoryId   | UUID      | no       | —       | Filter by category.                                      |
| brandId      | UUID      | no       | —       | Filter by brand.                                         |
| sku          | string    | no       | —       | Partial match on SKU.                                    |
| attributeValueIds | list<UUID> | no | Attribute filters.                                     |
| daysAhead    | number    | no       | `30`    | Lookahead window (in days).                              |
| includeExpired | boolean | no       | `false` | If `true`, also include already expired items.           |
| aggregate    | boolean   | no       | `false` | Aggregate across warehouses (quantity sums, warehouse info null). |
| asOf         | timestamp | no       | now     | Reference date (UTC) for expiry calculations.            |
| page/size/sort | standard | no      | Sort defaults to `expiryDate,asc`.                       |

### Response Row

```json
{
  "variantId": "9f1bcd13-7cc4-4e96-8b5e-9e7c6da0e2cc",
  "sku": "LAPTOP-X-RED-256",
  "productId": "5a8c0c3c-1d6a-4c8d-8d3a-3bf7d72ed3b0",
  "productName": "Laptop X",
  "warehouseId": "b3e2f7a8-2d1d-4c1b-b948-6a1b53ecb847",
  "warehouseName": "São Paulo Depot",
  "quantity": 30,
  "expiryDate": "2025-02-15",
  "daysUntilExpiry": 5
}
```

`daysUntilExpiry` may be negative if `includeExpired=true`.

---

## Common Errors Across Reports

| Status | When it happens                                           | Detail example                         |
|--------|-----------------------------------------------------------|----------------------------------------|
| 400    | Invalid filters (missing required IDs, malformed dates)   | `"detail": "invalid-filters"`          |
| 403    | Caller lacks warehouse access (especially SELLER role)    | `"detail": "Forbidden"`               |
| 404    | Referenced resources (warehouse/product/variant) missing  | `"detail": "warehouse-not-found"`      |

---

## Front-End Tips

- Stock snapshot + low stock make great dashboard widgets. Cache filters locally so users can revisit saved views.
- For history timelines, pre-sort ascending on `occurredAt` and display running balances to highlight inventory changes.
- Combine expiring items with notification systems to alert managers when `daysUntilExpiry` drops below thresholds.
- Always include `warehouseId` when acting as `SELLER`; the backend rejects broader queries for security reasons.
- Prefer server pagination rather than loading entire datasets; reports can be large.
