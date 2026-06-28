# Tenant Endpoints

## Overview

These endpoints manage the current tenant's company configuration and InfinitePay payment gateway settings. These are administrative endpoints for company profile management.

**Base URL**: `/api/tenants`
**Authentication**: Required (Bearer token)

---

## Authorization Matrix

| Endpoint | Permission |
|----------|-----------|
| `GET /api/tenants/me` | `tenants:read` |
| `PUT /api/tenants/me` | `tenants:update` |
| `GET /api/tenants/me/infinitepay` | `tenants:read` |
| `PUT /api/tenants/me/infinitepay` | `tenants:update` |

---

## GET /api/tenants/me

**Summary**: Get current tenant's company configuration

### Request

**Method**: `GET`

### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Company config retrieved",
  "data": {
    "businessName": "My Company Ltda",
    "document": "12.345.678/0001-90",
    "email": "contact@mycompany.com",
    "phone": "+55 11 99999-0000",
    "logoUrl": "https://cdn.example.com/company/logo.png",
    "active": true
  }
}
```

**Response Fields**:

- `businessName`: Company/business name
- `document`: CNPJ or company document number
- `email`: Company contact email
- `phone`: Company contact phone
- `logoUrl`: Company logo URL
- `active`: Whether the tenant is active

---

## PUT /api/tenants/me

**Summary**: Update current tenant's company configuration

Two variants are available: JSON-only and multipart with logo upload.

### Variant 1: JSON (no logo change)

**Content-Type**: `application/json`

#### Request Body

```json
{
  "businessName": "My Company Ltda",
  "document": "12.345.678/0001-90",
  "email": "contact@mycompany.com",
  "phone": "+55 11 99999-0000"
}
```

**Field Validations**:
- `businessName`: Required, cannot be blank
- `document`: Optional
- `email`: Optional, must be valid email format if provided
- `phone`: Optional

### Variant 2: Multipart (with logo upload)

**Content-Type**: `multipart/form-data`

#### Request Parts

- `company`: JSON object (same structure as above)
- `logo`: Optional, image file for company logo

### Response

**Status Code**: `200 OK`

Returns the updated `CompanyConfigResponse`:

```json
{
  "success": true,
  "message": "Company config updated",
  "data": {
    "businessName": "My Company Ltda",
    "document": "12.345.678/0001-90",
    "email": "contact@mycompany.com",
    "phone": "+55 11 99999-0000",
    "logoUrl": "https://cdn.example.com/company/new-logo.png",
    "active": true
  }
}
```

**Note**: When a new logo is uploaded, the previous logo is automatically deleted from storage.

---

## GET /api/tenants/me/infinitepay

**Summary**: Get current tenant's InfinitePay configuration status

### Request

**Method**: `GET`

### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "InfinitePay config retrieved",
  "data": {
    "handle": "mycompany",
    "docNumber": "12345678901234",
    "configured": true
  }
}
```

**Response Fields**:

- `handle`: InfinitePay merchant handle
- `docNumber`: Document number registered with InfinitePay
- `configured`: `true` if both handle and docNumber are set, `false` otherwise

---

## PUT /api/tenants/me/infinitepay

**Summary**: Update current tenant's InfinitePay configuration

### Request

**Method**: `PUT`
**Content-Type**: `application/json`

#### Request Body

```json
{
  "handle": "mycompany",
  "docNumber": "12345678901234"
}
```

**Field Validations**:
- `docNumber`: Required, cannot be blank
- `handle`: Optional

### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "InfinitePay config updated",
  "data": {
    "handle": "mycompany",
    "docNumber": "12345678901234",
    "configured": true
  }
}
```

---

## Frontend Implementation Guide

### Company Settings Page

1. **Company Profile Form**: Fields for business name, document, email, phone
2. **Logo Upload**: Drag-and-drop or file picker for company logo with preview
3. **Validation**: Email format, required business name
4. **Success Feedback**: Toast notification on successful save

### InfinitePay Settings

1. **Connection Status**: Show a badge (Connected / Not Connected) based on `configured` field
2. **Setup Form**: Input fields for InfinitePay handle and document number
3. **Test Connection**: Optionally validate the configuration before saving
4. **Conditional Features**: Hide InfinitePay payment options when not configured

---

## Common Error Responses

### 400 Bad Request - Validation
```json
{
  "status": 400,
  "error": "Validation Failed",
  "message": "Invalid input",
  "path": "/api/tenants/me",
  "validationErrors": {
    "businessName": "Business name is required",
    "email": "Email must be valid"
  }
}
```

### 500 Internal Server Error - Storage Unavailable
```json
{
  "status": 500,
  "error": "Internal Server Error",
  "message": "Storage is not configured for company logo uploads"
}
```
