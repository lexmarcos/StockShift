# Tenants Endpoints

Base path: `/api/tenants`

All endpoints require Bearer authentication. Responses use `ApiResponse<T>`.

## Permissions

- `tenants:read` for reads.
- `tenants:update` for updates.

## Data Shapes

### CompanyConfigResponse

```json
{
  "businessName": "StockShift Ltda",
  "document": "12345678000190",
  "email": "company@example.com",
  "phone": "+5511999999999",
  "logoUrl": "https://storage.example.com/logo.png",
  "isActive": true
}
```

### UpdateCompanyRequest

```json
{
  "businessName": "StockShift Ltda",
  "document": "12345678000190",
  "email": "company@example.com",
  "phone": "+5511999999999"
}
```

### InfinitePayConfigResponse

```json
{
  "handle": "stockshift",
  "docNumber": "12345678000190",
  "configured": true
}
```

## Endpoints

### GET `/api/tenants/me`

Returns company configuration for the current tenant.

- Success: `200 OK`, `ApiResponse<CompanyConfigResponse>`

### PUT `/api/tenants/me`

Updates company configuration. The backend accepts both JSON and multipart form data.

JSON request:

- Content-Type: `application/json`
- Body: `UpdateCompanyRequest`

Multipart request:

- Content-Type: `multipart/form-data`
- Parts:
  - `company`: `UpdateCompanyRequest`
  - `logo`: optional file

Success: `200 OK`, `ApiResponse<CompanyConfigResponse>`

### GET `/api/tenants/me/infinitepay`

Returns InfinitePay configuration for the current tenant.

- Success: `200 OK`, `ApiResponse<InfinitePayConfigResponse>`

### PUT `/api/tenants/me/infinitepay`

Updates InfinitePay configuration.

- Body: `{ "handle": "stockshift", "docNumber": "12345678000190" }`
- Success: `200 OK`, `ApiResponse<InfinitePayConfigResponse>`

