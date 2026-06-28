# Admin Endpoints

## Overview

These endpoints provide administrative operations that operate across products. They require elevated permissions and are typically used for maintenance, migrations, or bulk operations.

**Base URL**: `/api/admin/products`
**Authentication**: Required (Bearer token)

---

## POST /api/admin/products/process-images

**Summary**: Reprocess product images — compress originals and (re)generate thumbnails

This endpoint processes product images stored in the system. It can target a single product or batch-process the entire product catalog. Products with already-optimized images are skipped, so re-running is safe and cheap.

### Authorization

**Required Permission**: `products:update`

### Request

**Method**: `POST`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productId` | UUID | No | Process only this specific product. When omitted, processes the whole tenant catalog. |
| `limit` | int | No | When processing the catalog, max number of products to actually process. Products that already have good images are skipped and don't count toward the limit. Must be >= 1 if provided. |

**Examples**:

- Process a single product: `POST /api/admin/products/process-images?productId=550e8400-e29b-41d4-a716-446655440000`
- Process up to 20 products in the catalog: `POST /api/admin/products/process-images?limit=20`
- Process entire catalog: `POST /api/admin/products/process-images`

### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Processing complete",
  "data": {
    "total": 150,
    "processed": 42,
    "skipped": 108,
    "compressed": 35,
    "failed": 0,
    "errors": []
  }
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `total` | int | Total products considered |
| `processed` | int | Products that were actually processed (needed work) |
| `skipped` | int | Products that were skipped (images already optimal) |
| `compressed` | int | Products whose original image was compressed |
| `failed` | int | Products where processing failed |
| `errors` | List\<String\> | Error messages for failed products |

### Behavior

- When `productId` is provided, processes only that product. The `limit` parameter is ignored.
- When processing the catalog without `limit`, all products are considered.
- Products whose images are already in good shape are skipped (they don't count toward `processed` or the `limit`).
- Failed products are logged in the `errors` array. The endpoint continues processing remaining products even if some fail.

### Frontend Implementation Guide

1. **Admin Panel**: Place this functionality in an admin settings or maintenance section
2. **Progress Indication**: For large catalogs (no limit), show a loading indicator — processing may take time
3. **Batch Approach**: Use `limit=20` to process in bounded batches, calling the endpoint repeatedly until `processed` returns 0
4. **Results Display**: Show the result counters (processed, skipped, compressed, failed) after completion
5. **Error Handling**: Display any errors from the `errors` array

### Error Responses

**400 Bad Request** - Invalid limit:
```json
{
  "success": false,
  "message": "limit must be >= 1. Got: 0"
}
```

**500 Internal Server Error** - Service unavailable:
Returned when the image processing service is not configured or available.
