# Sales API Endpoints

## Overview
These endpoints manage sales transactions in the StockShift system. All endpoints require authentication with appropriate permissions.

**Base URL**: `/api/sales`
**Authentication**: Required (Bearer token)

---

## Permissions
- `SALES:CREATE` - Create sales
- `SALES:READ` - View sales
- `SALES:CANCEL` - Cancel sales

---

## POST /api/sales
**Summary**: Create a new sale and reduce stock automatically

### Authorization
**Required Permissions**: `SALES:CREATE`

### Request
**Method**: `POST`
**Content-Type**: `application/json`

#### Request Body
```json
{
  "warehouseId": 1,
  "paymentMethod": "CASH",
  "customerId": 10,
  "customerName": "João Silva",
  "discount": 10.50,
  "notes": "Venda balcão",
  "items": [
    {
      "productId": 5,
      "batchId": 20,
      "quantity": 2,
      "unitPrice": 50.00
    }
  ]
}
```

**Field Details**:
- `warehouseId` (required): ID of warehouse where sale occurs
- `paymentMethod` (required): Payment method enum value
- `customerId` (optional): Customer ID if registered
- `customerName` (optional): Customer name for unregistered customers
- `discount` (optional): Discount amount (must be ≥ 0)
- `notes` (optional): Additional sale notes
- `items` (required): Array of sale items (must have at least 1)
  - `productId` (required): Product being sold
  - `batchId` (optional): Specific batch to use
  - `quantity` (required): Quantity to sell (must be ≥ 1)
  - `unitPrice` (required): Unit price (must be > 0)

**Payment Methods**:
- `CASH` - Dinheiro
- `DEBIT_CARD` - Cartão de débito
- `CREDIT_CARD` - Cartão de crédito
- `INSTALLMENT` - Fiado/Crediário
- `PIX` - PIX
- `BANK_TRANSFER` - Transferência bancária
- `OTHER` - Outros

### Response
**Status Code**: `201 Created`

```json
{
  "id": 100,
  "warehouseId": 1,
  "warehouseName": "Loja Principal",
  "userId": 3,
  "userName": "Maria Santos",
  "customerId": 10,
  "customerName": "João Silva",
  "paymentMethod": "CASH",
  "status": "COMPLETED",
  "subtotal": 100.00,
  "discount": 10.50,
  "total": 89.50,
  "notes": "Venda balcão",
  "stockMovementId": null,
  "createdAt": "2026-01-26T10:30:00",
  "completedAt": "2026-01-26T10:30:00",
  "cancelledAt": null,
  "cancelledBy": null,
  "cancelledByName": null,
  "cancellationReason": null,
  "items": [
    {
      "id": 150,
      "productId": 5,
      "productName": "Produto X",
      "productSku": "SKU-001",
      "batchId": 20,
      "batchCode": "BATCH-2024-01",
      "quantity": 2,
      "unitPrice": 50.00,
      "subtotal": 100.00
    }
  ]
}
```

### Error Responses
- `400 Bad Request` - Invalid request data, insufficient stock, or validation error
- `404 Not Found` - Warehouse or product not found

---

## GET /api/sales
**Summary**: List all sales with pagination

### Authorization
**Required Permissions**: `SALES:READ`

### Request
**Method**: `GET`

#### Query Parameters
- `page` (optional): Page number (default: 0)
- `size` (optional): Page size (default: 20)
- `sort` (optional): Sort field (default: createdAt,desc)

### Response
**Status Code**: `200 OK`

```json
{
  "content": [
    {
      "id": 100,
      "warehouseId": 1,
      "warehouseName": "Loja Principal",
      "paymentMethod": "CASH",
      "status": "COMPLETED",
      "total": 89.50,
      "createdAt": "2026-01-26T10:30:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 45,
  "totalPages": 3
}
```

---

## GET /api/sales/{id}
**Summary**: Retrieve details of a specific sale

### Authorization
**Required Permissions**: `SALES:READ`

### Request
**Method**: `GET`

#### Path Parameters
- `id` (required): Sale ID

### Response
**Status Code**: `200 OK`

```json
{
  "id": 100,
  "warehouseId": 1,
  "warehouseName": "Loja Principal",
  "userId": 3,
  "userName": "Maria Santos",
  "paymentMethod": "CASH",
  "status": "COMPLETED",
  "subtotal": 100.00,
  "discount": 10.50,
  "total": 89.50,
  "items": [
    {
      "id": 150,
      "productId": 5,
      "productName": "Produto X",
      "quantity": 2,
      "unitPrice": 50.00,
      "subtotal": 100.00
    }
  ]
}
```

### Error Responses
- `404 Not Found` - Sale not found

---

## PUT /api/sales/{id}/cancel
**Summary**: Cancel a sale and return stock to warehouse

### Authorization
**Required Permissions**: `SALES:CANCEL`

### Request
**Method**: `PUT`
**Content-Type**: `application/json`

#### Path Parameters
- `id` (required): Sale ID

#### Request Body
```json
{
  "reason": "Cliente desistiu da compra"
}
```

**Field Details**:
- `reason` (required): Cancellation reason (must not be blank)

### Response
**Status Code**: `200 OK`

```json
{
  "id": 100,
  "status": "CANCELLED",
  "cancelledAt": "2026-01-26T11:00:00",
  "cancelledBy": 3,
  "cancelledByName": "Admin User",
  "cancellationReason": "Cliente desistiu da compra",
  "total": 89.50
}
```

### Error Responses
- `400 Bad Request` - Sale already cancelled or cannot be cancelled
- `404 Not Found` - Sale not found

---

## Business Rules

### Stock Management
- Stock is reduced immediately when sale is created using FIFO strategy
- Products with expiration dates are prioritized (closest to expiry first)
- If a batch doesn't have enough quantity, multiple batches are used

### Cancellation
- Only completed sales can be cancelled
- Stock is returned to the original batches
- Cancellation reason is mandatory
- Audit trail is maintained (who cancelled, when, why)

### Validations
- All products must be active and available
- Sufficient stock must be available in the specified warehouse
- Unit prices must be positive
- Sale must have at least one item
- Discount cannot be negative

---

## Examples

### Create Sale with Multiple Items
```bash
curl -X POST http://localhost:8080/api/sales \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouseId": 1,
    "paymentMethod": "CREDIT_CARD",
    "discount": 0,
    "items": [
      {"productId": 1, "quantity": 5, "unitPrice": 10.00},
      {"productId": 2, "quantity": 3, "unitPrice": 25.00}
    ]
  }'
```

### List Sales with Pagination
```bash
curl -X GET "http://localhost:8080/api/sales?page=0&size=10&sort=createdAt,desc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Cancel Sale
```bash
curl -X PUT http://localhost:8080/api/sales/100/cancel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Customer requested refund"}'
```
