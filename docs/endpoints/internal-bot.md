# Internal Bot Endpoints

## Overview

These endpoints power the Telegram product query bot. They are internal endpoints secured with a static API key header and are not part of the public user-facing API.

**Base URL**: `/api/internal/bot`
**Authentication**: `X-StockShift-Bot-Key` header (configured per environment)
**Required Authority**: `bot:internal`

All responses use the standard `ApiResponse` wrapper unless otherwise noted.

---

## Authentication

These endpoints bypass JWT authentication. Instead, requests must include:

```
X-StockShift-Bot-Key: <configured-bot-key>
```

The bot key is validated against the `STOCKSHIFT_BOT_KEY` environment variable. Requests without a valid key receive `401 Unauthorized`.

The bot operates on behalf of a specific tenant configured via the `STOCKSHIFT_BOT_TENANT_ID` environment variable. All data returned is scoped to that tenant.

---

## GET /api/internal/bot/warehouses

**Summary**: List active warehouses for the configured bot tenant

### Request

**Method**: `GET`

### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Centro",
      "code": "CTR",
      "city": "Sao Paulo",
      "state": "SP"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "Filial Zona Norte",
      "code": "ZN",
      "city": "Sao Paulo",
      "state": "SP"
    }
  ]
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Warehouse identifier |
| `name` | String | Warehouse display name |
| `code` | String | Short warehouse code |
| `city` | String | City name |
| `state` | String | State abbreviation (2 uppercase letters) |

---

## GET /api/internal/bot/warehouses/search

**Summary**: Search active warehouses by name or code

### Request

**Method**: `GET`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | String | Yes | Search term (matched against name and code) |

**Example**: `/api/internal/bot/warehouses/search?query=centro`

### Response

**Status Code**: `200 OK`

Same format as `GET /api/internal/bot/warehouses` (filtered list).

Returns an empty array if no warehouses match.

---

## GET /api/internal/bot/products/search

**Summary**: Search for products with stock in a specific warehouse

This is the primary bot query endpoint. It searches products by name, SKU, or barcode and returns matches that have active (non-deleted) batches in the specified warehouse.

### Request

**Method**: `GET`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | String | Yes | Search term (product name, SKU, or barcode) |
| `warehouseId` | UUID | Yes | Warehouse to search stock in |
| `limit` | Integer | No | Max results to return (default: 5, capped at 10) |

**Example**: `/api/internal/bot/products/search?query=perfume&warehouseId=660e8400-e29b-41d4-a716-446655440001&limit=5`

### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "productId": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Perfume Gold",
        "imageUrl": "https://cdn.example.com/products/gold.png",
        "barcode": "7891234567890",
        "sku": "SKU-GOLD",
        "warehouseId": "660e8400-e29b-41d4-a716-446655440001",
        "warehouseName": "Centro",
        "totalQuantity": 25,
        "latestBatchSellingPrice": 12990,
        "latestBatchCode": "NEW",
        "latestBatchCreatedAt": "2026-02-01T10:00:00"
      }
    ],
    "hasMore": false
  }
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `results` | Array | Matching products with stock |
| `hasMore` | Boolean | `true` if results were truncated by the limit |

#### Result Item Fields

| Field | Type | Description |
|-------|------|-------------|
| `productId` | UUID | Product identifier |
| `name` | String | Product name |
| `imageUrl` | String | Product image URL (null if no image) |
| `barcode` | String | Product barcode (null if not set) |
| `sku` | String | Product SKU |
| `warehouseId` | UUID | Warehouse identifier |
| `warehouseName` | String | Warehouse name |
| `totalQuantity` | BigDecimal | Sum of quantities across all non-deleted batches in this warehouse |
| `latestBatchSellingPrice` | Long | Selling price (in cents) of the newest batch (by `createdAt DESC, id DESC`). `null` if no batch has a selling price. |
| `latestBatchCode` | String | Batch code of the newest batch. `null` if no batches exist. |
| `latestBatchCreatedAt` | ISO DateTime | Creation timestamp of the newest batch. `null` if no batches exist. |

### Empty Results

When no products match, an empty results array is returned:

```json
{
  "success": true,
  "data": {
    "results": [],
    "hasMore": false
  }
}
```

### Behavior Notes

- Only non-deleted batches are considered for stock counting
- Only non-deleted products are returned
- `totalQuantity` is the sum of quantities across all non-deleted batches for the product in the warehouse
- The latest batch (by creation date) is used for displaying the most recent price and batch code
- Results are ordered by relevance to the search query

---

## Error Handling

### 401 Unauthorized - Missing or Invalid Bot Key
```json
{
  "timestamp": "2026-06-28T10:00:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid bot key",
  "path": "/api/internal/bot/products/search"
}
```

### 400 Bad Request - Missing Required Parameter
```json
{
  "success": false,
  "message": "Required parameter 'warehouseId' is missing"
}
```

---

## Integration Notes

### Telegram Bot Flow

1. **User selects warehouse**: Bot calls `GET /api/internal/bot/warehouses` (or `/search` for autocomplete) to get available warehouses
2. **User searches product**: Bot calls `GET /api/internal/bot/products/search?query={text}&warehouseId={id}&limit=5`
3. **Bot displays results**: Shows product name, price, available quantity, and image
4. **Pagination**: If `hasMore` is `true`, the bot can suggest narrowing the search

### Price Display

All prices are in **cents**. Convert to display currency:
- `latestBatchSellingPrice / 100` for reais
- Format with 2 decimal places (e.g., 12990 → R$129,90)
