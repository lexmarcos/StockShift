# Sales Endpoints

Base path: `/api/sales`

Most endpoints require Bearer authentication and use `ApiResponse<T>`. The InfinitePay webhook endpoint is public and authenticated by the `{token}` path segment.

Money fields are integer cents unless the field is explicitly a percentage or quantity.

## Permissions

- `sales:create` for creating sales and confirming InfinitePay returns.
- `sales:read` for listing, detail, next code, and dashboard.
- `sales:cancel` for cancellation.

## Enums

- `PaymentMethod`: `CASH`, `DEBIT_CARD`, `CREDIT_CARD`, `INSTALLMENT`, `PIX`, `BANK_TRANSFER`, `OTHER`
- `PaymentMode`: `DIRECT`, `TAP`, `LINK`
- `SaleStatus`: `PENDING`, `COMPLETED`, `CANCELLED`

## Data Shapes

### CreateSaleRequest

```json
{
  "warehouseId": "00000000-0000-0000-0000-000000000000",
  "paymentMethod": "PIX",
  "installments": 1,
  "discountPercentage": 0,
  "items": [
    {
      "productId": "00000000-0000-0000-0000-000000000001",
      "batchId": "00000000-0000-0000-0000-000000000002",
      "quantity": 2
    }
  ],
  "useInfinitePay": false,
  "paymentMode": "DIRECT"
}
```

### SaleResponse

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "code": "SALE-0001",
  "warehouseId": "00000000-0000-0000-0000-000000000001",
  "warehouseName": "Main Warehouse",
  "paymentMethod": "PIX",
  "installments": 1,
  "discountPercentage": 0,
  "subtotal": 10000,
  "discountAmount": 0,
  "total": 10000,
  "status": "COMPLETED",
  "cancelledByUserId": null,
  "cancelledAt": null,
  "cancellationReason": null,
  "createdByUserId": "00000000-0000-0000-0000-000000000003",
  "createdAt": "2026-05-09T10:00:00Z",
  "items": [],
  "infinitepayNsu": null,
  "infinitepayAut": null,
  "infinitepayCardBrand": null,
  "paymentMode": "DIRECT",
  "paymentLink": null
}
```

## Endpoints

### POST `/api/sales`

Creates a sale.

- Body: `CreateSaleRequest`
- Success: `201 Created`, `ApiResponse<SaleResponse>`

### GET `/api/sales`

Lists sales using Spring pageable response format.

- Query: `warehouseId`, `paymentMethod`, `status`, `dateFrom`, `dateTo`, `page`, `size`, `sort`
- Date format: ISO date-time, for example `2026-05-09T10:00:00`
- Success: `200 OK`, `ApiResponse<Page<SaleSummaryResponse>>`

### GET `/api/sales/next-code`

Returns the next sale code.

- Success: `200 OK`, `ApiResponse<{ "code": "SALE-0001" }>`

### GET `/api/sales/dashboard`

Returns sales dashboard KPIs and daily chart data.

- Query: `warehouseId`
- Success: `200 OK`, `ApiResponse<SalesDashboardResponse>`

### GET `/api/sales/{id}`

Gets sale details by UUID.

- Path: `id` UUID
- Success: `200 OK`, `ApiResponse<SaleResponse>`

### PUT `/api/sales/{id}/cancel`

Cancels a sale.

- Path: `id` UUID
- Body: `{ "cancellationReason": "Customer requested cancellation" }`
- Success: `200 OK`, `ApiResponse<SaleResponse>`

### GET `/api/sales/infinitepay/callback`

Handles InfinitePay browser callback and redirects to `/sales/infinitepay/result`.

- Query: `order_id`, optional `warning`
- Success: `302 Found`

### GET `/api/sales/infinitepay/confirm`

Confirms an InfinitePay return without redirect.

- Query: `order_id`, optional `warning`
- Success: `200 OK`, `ApiResponse<InfinitePayConfirmResponse>`

### POST `/api/sales/infinitepay/webhook/{token}`

Receives InfinitePay webhook notifications. This endpoint does not use Bearer auth.

- Path: `token`
- Body fields include `invoice_slug`, `amount`, `paid_amount`, `installments`, `capture_method`, `transaction_nsu`, `order_nsu`, `receipt_url`, `items`
- Success: `200 OK` with empty body
- Invalid payload/token: `400 Bad Request`

