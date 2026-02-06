# Transfer Endpoints

## Overview
These endpoints manage inventory transfers between warehouses.

Transfer lifecycle:
- `DRAFT` -> `IN_TRANSIT` -> `PENDING_VALIDATION` -> `COMPLETED`
- `DRAFT` -> `IN_TRANSIT` -> `PENDING_VALIDATION` -> `COMPLETED_WITH_DISCREPANCY`
- `DRAFT` -> `CANCELLED`
- `IN_TRANSIT` -> `CANCELLED`

**Base URL**: `/stockshift/api/transfers`
**Authentication**: Required (Bearer token)

---

## POST /stockshift/api/transfers
**Summary**: Create a new inventory transfer in `DRAFT` status.

### Authorization
**Required Permissions**: `TRANSFER_EXECUTE` or `ROLE_ADMIN`

### Request
**Method**: `POST`
**Content-Type**: `application/json`

#### Request Body
```json
{
  "destinationWarehouseId": "550e8400-e29b-41d4-a716-446655440000",
  "notes": "Transferência de reposição mensal",
  "items": [
    {
      "sourceBatchId": "660e8400-e29b-41d4-a716-446655440002",
      "quantity": 10.5
    }
  ]
}
```

### Response (201 Created)
```json
{
  "success": true,
  "message": "Transfer created successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440003",
    "code": "TRF-2026-0001",
    "sourceWarehouseId": "...",
    "sourceWarehouseName": "Warehouse A",
    "destinationWarehouseId": "...",
    "destinationWarehouseName": "Warehouse B",
    "status": "DRAFT",
    "notes": "Transferência de reposição mensal",
    "items": [...],
    "createdAt": "2026-02-04T10:00:00Z"
  }
}
```

---

## GET /stockshift/api/transfers
**Summary**: List transfers with optional filtering and pagination.

### Request
**Method**: `GET`
**Query Parameters**:
- `status`: Filter by status (`DRAFT`, `IN_TRANSIT`, `PENDING_VALIDATION`, `COMPLETED`, `COMPLETED_WITH_DISCREPANCY`, `CANCELLED`)
- `sourceWarehouseId`: Filter by origin warehouse
- `destinationWarehouseId`: Filter by destination warehouse
- `page`, `size`, `sort`: Standard pagination parameters

### Response (200 OK)
```json
{
  "success": true,
  "message": "Transfers retrieved successfully",
  "data": {
    "content": [...],
    "totalElements": 50,
    "totalPages": 5,
    "number": 0,
    "size": 10
  }
}
```

---

## GET /stockshift/api/transfers/{id}
**Summary**: Get a transfer by ID.

### Response (200 OK)
```json
{
  "success": true,
  "message": "Transfer retrieved successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440003",
    "code": "TRF-2026-0001",
    "sourceWarehouseId": "...",
    "sourceWarehouseName": "Warehouse A",
    "destinationWarehouseId": "...",
    "destinationWarehouseName": "Warehouse B",
    "status": "DRAFT",
    "notes": "...",
    "items": [...]
  }
}
```

---

## PATCH /stockshift/api/transfers/{id}
**Summary**: Update a transfer in `DRAFT` status.

### Authorization
**Required Permissions**: `TRANSFER_EXECUTE` or `ROLE_ADMIN`

### Description
Only transfers in `DRAFT` status can be updated. Can only be performed by users in the source warehouse.

### Request Body
```json
{
  "notes": "Updated notes",
  "items": [
    {
      "sourceBatchId": "660e8400-e29b-41d4-a716-446655440002",
      "quantity": 15.0
    }
  ]
}
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Transfer updated successfully",
  "data": { ... }
}
```

---

## POST /stockshift/api/transfers/{id}/execute
**Summary**: Transitions a transfer from `DRAFT` to `IN_TRANSIT`.

### Authorization
**Required Permissions**: `TRANSFER_EXECUTE` or `ROLE_ADMIN`

### Description
This operation deducts the items from the source warehouse inventory and marks them as "in transit". Once executed, the transfer cannot be edited, only cancelled or validated.

### Response (200 OK)
```json
{
  "success": true,
  "message": "Transfer executed successfully",
  "data": { ... }
}
```

---

## POST /stockshift/api/transfers/{id}/start-validation
**Summary**: Initiates the receiving process at the destination warehouse.

### Authorization
**Required Permissions**: `TRANSFER_VALIDATE` or `ROLE_ADMIN`

### Description
Moves the status to `PENDING_VALIDATION`. This step is required before scanning items at the destination.

### Response (200 OK)
```json
{
  "success": true,
  "message": "Validation started successfully",
  "data": { ... }
}
```

---

## POST /stockshift/api/transfers/{id}/scan
**Summary**: Validates an item during the receiving process via barcode.

### Authorization
**Required Permissions**: `TRANSFER_VALIDATE` or `ROLE_ADMIN`

### Request Body
```json
{
  "barcode": "7891234567890"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Barcode processed",
  "data": {
    "valid": true,
    "message": "Item validated successfully",
    "warning": null,
    "productName": "Perfume XYZ",
    "productBarcode": "7891234567890",
    "quantitySent": 10.0,
    "quantityReceived": 1.0
  }
}
```

---

## POST /stockshift/api/transfers/{id}/complete-validation
**Summary**: Finalizes the transfer and updates destination inventory.

### Authorization
**Required Permissions**: `TRANSFER_VALIDATE` or `ROLE_ADMIN`

### Description
Finalizes the process, moving stock from "transit" to the destination warehouse. Returns a report identifying any `SHORTAGE` (faltas) or `OVERAGE` (sobras).

### Response (200 OK)
```json
{
  "success": true,
  "message": "Validation completed successfully",
  "data": {
    "transferId": "...",
    "discrepancies": [...]
  }
}
```

---

## GET /stockshift/api/transfers/{id}/discrepancy-report
**Summary**: Get the discrepancy report for a transfer.

### Description
Returns a report showing differences between sent and received quantities.
This endpoint is only available when transfer status is `COMPLETED_WITH_DISCREPANCY`.

### Response (200 OK)
```json
{
  "success": true,
  "message": "Discrepancy report retrieved successfully",
  "data": {
    "transferId": "...",
    "transferCode": "TRF-2026-0001",
    "sourceWarehouseName": "Warehouse A",
    "destinationWarehouseName": "Warehouse B",
    "completedAt": "2026-02-06T01:20:00Z",
    "discrepancies": [
      {
        "productName": "Perfume XYZ",
        "productBarcode": "7891234567890",
        "quantitySent": 10.0,
        "quantityReceived": 9.0,
        "difference": -1.0,
        "type": "SHORTAGE"
      }
    ],
    "totalShortage": 1.0,
    "totalOverage": 0.0
  }
}
```

### Response (400 Bad Request)
```json
{
  "timestamp": "2026-02-06T01:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Discrepancy report only available for transfers with discrepancies",
  "path": "/stockshift/api/transfers/{id}/discrepancy-report"
}
```

---

## GET /stockshift/api/transfers/{id}/validation-logs
**Summary**: Get the validation scan logs for a transfer.

### Description
Returns all barcode scan events recorded during the validation process.

### Response (200 OK)
```json
{
  "success": true,
  "message": "Validation logs retrieved successfully",
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440004",
      "transferItemId": "990e8400-e29b-41d4-a716-446655440005",
      "barcode": "7891234567890",
      "validatedByUserId": "aa0e8400-e29b-41d4-a716-446655440006",
      "validatedAt": "2026-02-04T14:30:00Z",
      "valid": true
    }
  ]
}
```

---

## DELETE /stockshift/api/transfers/{id}
**Summary**: Cancel a transfer.

### Authorization
**Required Permissions**: `TRANSFER_CANCEL` or `ROLE_ADMIN`

### Description
Cancels a transfer. If the transfer is `IN_TRANSIT`, stock movements are reverted and a reason is required. Can only be performed by users in the source warehouse.

### Request Body (optional for DRAFT, required for IN_TRANSIT)
```json
{
  "reason": "Erro no preenchimento dos itens"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Transfer cancelled successfully",
  "data": { ... }
}
```

---

## Frontend Implementation Guide
1. **Lifecycle Management**: Enable buttons (Execute, Validate, Scan) based on the current `status` of the transfer.
2. **Warehouse Context**: The source warehouse is inferred from the user's current active warehouse.
3. **Real-time Scanning**: The `/scan` endpoint is optimized for high-frequency use with handheld scanners.
4. **Validation UX**: Show a list of items to be received and highlight discrepancies in real-time as the user scans.
5. **Validation Resume**: Use `GET /stockshift/api/transfers/{id}` and `items[].quantityReceived` to resume an in-progress validation (`PENDING_VALIDATION`) without starting it again.
6. **Discrepancy Report Rule**: Call `/discrepancy-report` only when status is `COMPLETED_WITH_DISCREPANCY`; otherwise expect `400 Bad Request`.
