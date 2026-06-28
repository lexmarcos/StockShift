# Sales Endpoints

## Overview

These endpoints manage sales (orders) and InfinitePay payment integration in the StockShift system. Sales represent customer purchases that deduct stock from batches. InfinitePay integration enables Pix and credit card payments via the InfinitePay gateway.

**Base URL**: `/api/sales`
**Authentication**: Required (Bearer token), except webhook

---

## Authorization Matrix

| Endpoint | Permission |
|----------|-----------|
| `POST /api/sales` | `sales:create` |
| `GET /api/sales` | `sales:read` |
| `GET /api/sales/next-code` | `sales:read` |
| `GET /api/sales/dashboard` | `sales:read` |
| `GET /api/sales/{id}` | `sales:read` |
| `PUT /api/sales/{id}/cancel` | `sales:cancel` |
| `GET /api/sales/infinitepay/callback` | `sales:create` |
| `GET /api/sales/infinitepay/confirm` | `sales:create` |
| `POST /api/sales/infinitepay/webhook/{token}` | Public (no auth) |

---

## Enums

### PaymentMethod

| Value | Description |
|-------|-------------|
| `PIX` | Pix instant payment |
| `CREDIT_CARD` | Credit card payment |
| `DEBIT_CARD` | Debit card payment |
| `CASH` | Cash payment |

### PaymentMode

| Value | Description |
|-------|-------------|
| `IN_PERSON` | Payment at physical store |
| `ONLINE` | Payment via link or integration |

### SaleStatus

| Value | Description |
|-------|-------------|
| `COMPLETED` | Sale completed successfully |
| `CANCELLED` | Sale was cancelled |
| `PENDING_PAYMENT` | Waiting for payment confirmation |

---

## POST /api/sales

**Summary**: Create a new sale

### Request

**Method**: `POST`
**Content-Type**: `application/json`

#### Request Body

```json
{
  "warehouseId": "660e8400-e29b-41d4-a716-446655440001",
  "paymentMethod": "PIX",
  "installments": 1,
  "discountPercentage": 5.0,
  "useInfinitePay": true,
  "paymentMode": "IN_PERSON",
  "items": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "batchId": "770e8400-e29b-41d4-a716-446655440002",
      "quantity": 2
    }
  ]
}
```

**Field Details**:

- `warehouseId`: Required, UUID of the warehouse
- `paymentMethod`: Required, one of `PIX`, `CREDIT_CARD`, `DEBIT_CARD`, `CASH`
- `installments`: Optional, number of installments (credit card). Default 1.
- `discountPercentage`: Optional, discount percentage (0-100)
- `useInfinitePay`: Optional, whether to create an InfinitePay payment link. Default `false`.
- `paymentMode`: Optional, `IN_PERSON` or `ONLINE`
- `items`: Required, non-empty array of sale items
  - `productId`: Required, UUID of the product
  - `batchId`: Optional, UUID of a specific batch. If omitted, the system picks the oldest batch (FIFO).
  - `quantity`: Required, positive number

**Business Rules**:
- Stock is deducted automatically from batches using FIFO (First-In-First-Out).
- If stock is insufficient for any product, returns `400` with an error message.
- A unique sale code is auto-generated (e.g., `SAL-2026-0001`).
- When `useInfinitePay` is `true`, a payment link is generated via InfinitePay and returned in the response.

### Response

**Status Code**: `201 CREATED`

```json
{
  "success": true,
  "message": "Sale created successfully",
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "code": "SAL-2026-0001",
    "warehouseId": "660e8400-e29b-41d4-a716-446655440001",
    "warehouseName": "Main Warehouse",
    "paymentMethod": "PIX",
    "installments": 1,
    "discountPercentage": 5.0,
    "subtotal": 4000,
    "discountAmount": 200,
    "total": 3800,
    "status": "COMPLETED",
    "cancelledByUserId": null,
    "cancelledAt": null,
    "cancellationReason": null,
    "createdByUserId": "990e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-06-28T10:00:00Z",
    "items": [
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440004",
        "productId": "550e8400-e29b-41d4-a716-446655440000",
        "productName": "Product Name",
        "productSku": "PROD-001",
        "batchId": "770e8400-e29b-41d4-a716-446655440002",
        "batchCode": "BATCH-2026-001",
        "quantity": 2,
        "unitPrice": 2000,
        "totalPrice": 4000
      }
    ],
    "infinitepayNsu": null,
    "infinitepayAut": null,
    "infinitepayCardBrand": null,
    "paymentMode": "IN_PERSON",
    "paymentLink": null
  }
}
```

**Response Fields**:

- `subtotal`, `discountAmount`, `total`: amounts in cents (e.g., 3800 = R$38,00)
- `infinitepayNsu`, `infinitepayAut`, `infinitepayCardBrand`: InfinitePay transaction identifiers (null for non-InfinitePay sales)
- `paymentLink`: URL to InfinitePay payment page (only when `useInfinitePay` is `true`)

### Error Responses

**400 Bad Request** - Insufficient stock:
```json
{
  "success": false,
  "message": "Insufficient stock for product 'Product Name'. Available: 1.0000, Required: 2.0000"
}
```

---

## GET /api/sales

**Summary**: List sales with optional filters and pagination

### Request

**Method**: `GET`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `warehouseId` | UUID | No | Filter by warehouse |
| `paymentMethod` | PaymentMethod | No | Filter by payment method (`PIX`, `CREDIT_CARD`, `DEBIT_CARD`, `CASH`) |
| `status` | SaleStatus | No | Filter by status (`COMPLETED`, `CANCELLED`, `PENDING_PAYMENT`) |
| `dateFrom` | ISO DateTime | No | Start date/time filter |
| `dateTo` | ISO DateTime | No | End date/time filter |
| `page` | int | No | Page number (0-indexed, default: 0) |
| `size` | int | No | Page size (default: 20) |
| `sort` | string | No | Sort field and direction (e.g., `createdAt,desc`) |

**Example**: `/api/sales?status=COMPLETED&dateFrom=2026-06-01T00:00:00&page=0&size=10`

### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Sales retrieved successfully",
  "data": {
    "content": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "code": "SAL-2026-0001",
        "warehouseId": "660e8400-e29b-41d4-a716-446655440001",
        "warehouseName": "Main Warehouse",
        "paymentMethod": "PIX",
        "total": 3800,
        "status": "COMPLETED",
        "createdAt": "2026-06-28T10:00:00Z",
        "createdByUserName": "John Doe",
        "paymentMode": "IN_PERSON"
      }
    ],
    "pageable": { "pageNumber": 0, "pageSize": 10 },
    "totalElements": 42,
    "totalPages": 5,
    "size": 10,
    "number": 0,
    "first": true,
    "last": false
  }
}
```

---

## GET /api/sales/next-code

**Summary**: Get the next auto-generated sale code

### Request

**Method**: `GET`

### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Next code retrieved successfully",
  "data": {
    "code": "SAL-2026-0042"
  }
}
```

**Frontend Usage**: Call this endpoint to display the next sale code in the UI before submission. The code format is `SAL-YYYY-NNNN` where `NNNN` is a sequential number.

---

## GET /api/sales/dashboard

**Summary**: Get sales dashboard with KPIs and daily chart data

### Request

**Method**: `GET`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `warehouseId` | UUID | No | Filter dashboard to a specific warehouse |

### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Dashboard retrieved successfully",
  "data": {
    "kpis": {
      "today": {
        "count": 12,
        "revenue": 45600,
        "avgTicket": 3800
      },
      "week": {
        "count": 85,
        "revenue": 323000,
        "avgTicket": 3800
      },
      "month": {
        "count": 320,
        "revenue": 1216000,
        "avgTicket": 3800
      }
    },
    "dailyChart": [
      {
        "date": "2026-06-22",
        "count": 15,
        "revenue": 57000
      },
      {
        "date": "2026-06-23",
        "count": 12,
        "revenue": 45600
      }
    ]
  }
}
```

**Response Fields**:

- `kpis`: Key performance indicators
  - `today` / `week` / `month`: Period-level aggregates
  - `count`: Number of completed sales
  - `revenue`: Total revenue in cents (e.g., 45600 = R$456,00)
  - `avgTicket`: Average ticket in cents
- `dailyChart`: Array of daily entries for the last 7 days
  - `date`: ISO date string
  - `count`: Number of completed sales on that day
  - `revenue`: Total revenue on that day in cents

### Frontend Implementation Guide

1. **KPI Cards**: Display today/week/month count, revenue, and average ticket in KPI cards
2. **Bar Chart**: Render `dailyChart` as a bar chart with count and revenue series
3. **Warehouse Filter**: Add a warehouse dropdown that filters the dashboard
4. **Currency Formatting**: Convert cents to display currency (e.g., `revenue / 100`)

---

## GET /api/sales/{id}

**Summary**: Get sale by ID

### Request

**Method**: `GET`
**URL Parameters**: `id` (UUID) - Sale identifier

### Response

**Status Code**: `200 OK`

Same format as the response from `POST /api/sales` (full `SaleResponse`).

### Error Responses

**404 Not Found**:
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Sale not found with id: 880e8400-e29b-41d4-a716-446655440003"
}
```

---

## PUT /api/sales/{id}/cancel

**Summary**: Cancel a sale

### Request

**Method**: `PUT`
**URL Parameters**: `id` (UUID) - Sale identifier
**Content-Type**: `application/json`

#### Request Body

```json
{
  "cancellationReason": "Customer requested cancellation"
}
```

**Field Details**:
- `cancellationReason`: Required, reason for cancellation

**Business Rules**:
- Cancelling a sale restores the deducted stock back to the original batches.
- Only sales in `COMPLETED` or `PENDING_PAYMENT` status can be cancelled.

### Response

**Status Code**: `200 OK`

Returns the updated `SaleResponse` with `status: "CANCELLED"`, populated `cancellationReason`, `cancelledByUserId`, and `cancelledAt`.

---

## InfinitePay Integration

The InfinitePay integration enables payment processing via the InfinitePay gateway. The flow is:

1. **Create sale** with `useInfinitePay: true` — a payment link is generated
2. **Customer pays** via the InfinitePay link
3. **InfinitePay redirects** back to `/api/sales/infinitepay/callback` or the frontend calls `/api/sales/infinitepay/confirm`
4. **InfinitePay sends webhook** to `/api/sales/infinitepay/webhook/{token}` to confirm payment

### GET /api/sales/infinitepay/callback

**Summary**: Handle InfinitePay redirect callback (browser redirect)

**Authentication**: Required (but typically called as a redirect from InfinitePay)

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `order_id` | String | Yes | The sale UUID as a string |
| `warning` | String | No | Warning message from InfinitePay |

**Response**: `302 Found` redirect to `{frontendUrl}/sales/infinitepay/result?status={status}&sale_id={saleId}&message={message}`

The frontend should have a page at `/sales/infinitepay/result` to display payment outcome.

### GET /api/sales/infinitepay/confirm

**Summary**: Poll/confirm InfinitePay payment status (API call)

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `order_id` | String | Yes | The sale UUID as a string |
| `warning` | String | No | Warning message from InfinitePay |

**Response**:

```json
{
  "success": true,
  "message": "InfinitePay payment confirmation processed",
  "data": {
    "status": "success",
    "saleId": "880e8400-e29b-41d4-a716-446655440003",
    "message": null
  }
}
```

**Status values**:
- `success`: Payment confirmed
- `error`: Payment failed or needs verification (check `message`: `"pending_verification"` or `"invalid_order"`)

### POST /api/sales/infinitepay/webhook/{token}

**Summary**: Receive InfinitePay webhook notification

**Authentication**: None (public endpoint)

**URL Parameters**: `token` (String) - Webhook token configured in InfinitePay

**Request Body** (sent by InfinitePay):

```json
{
  "invoice_slug": "inv-abc123",
  "amount": 3800,
  "paid_amount": 3800,
  "installments": 1,
  "capture_method": "pix",
  "transaction_nsu": "123456",
  "order_nsu": "SAL-2026-0001",
  "receipt_url": "https://infinitepay.com/receipt/abc",
  "items": []
}
```

**Response**: `200 OK` (empty body) on success, `400 Bad Request` on failure.

---

## Common Error Responses

### 400 Bad Request - Insufficient Stock
```json
{
  "success": false,
  "message": "Insufficient stock for product 'Product Name'. Available: 1.0000, Required: 2.0000"
}
```

### 403 Forbidden
```json
{
  "timestamp": "2026-06-28T10:00:00",
  "status": 403,
  "error": "Forbidden",
  "message": "You don't have permission to access this resource",
  "path": "/api/sales"
}
```

### 409 Conflict - Sale Already Cancelled
```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Sale is already cancelled"
}
```

---

## Frontend Implementation Guide

### Sale Creation Flow

1. **Product Selection**: Allow scanning barcodes or searching products
2. **Quantity Input**: Numeric input with validation (positive numbers)
3. **Payment Method**: Dropdown with available payment methods
4. **InfinitePay Toggle**: Toggle to enable InfinitePay payment link generation
5. **Preview Next Code**: Call `GET /api/sales/next-code` to show the upcoming sale code
6. **Stock Validation**: Warn before submission if stock is low
7. **Success Feedback**: Show sale code and payment link (if InfinitePay)

### Sales List View

1. **Table Columns**: Code, Warehouse, Payment Method, Total, Status, Date, User
2. **Filters**: Warehouse, payment method, status, date range
3. **Status Badges**: Color-coded badges (green for COMPLETED, red for CANCELLED, yellow for PENDING_PAYMENT)
4. **Quick Actions**: View details, cancel (if applicable)

### InfinitePay Integration

1. **Payment Link Display**: When a sale is created with `useInfinitePay`, display the payment link or QR code
2. **Result Page**: Create a page at `/sales/infinitepay/result` to handle callback redirects
3. **Polling**: Poll `GET /api/sales/infinitepay/confirm` periodically until payment is confirmed
4. **Error Handling**: Handle `pending_verification` status (payment may still be processing)

### Amount Display

All monetary values are in **cents**. Convert to display currency:
- `total / 100` for reais
- Format with 2 decimal places
