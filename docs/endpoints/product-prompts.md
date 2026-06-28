# Product Prompt Endpoints

## Overview

These endpoints manage the tenant's product prompt library — reusable AI prompt templates for generating product descriptions and classifications. Each prompt can have an optional reference image.

**Base URL**: `/api/product-prompts`
**Authentication**: Required (Bearer token)

---

## Authorization Matrix

| Endpoint | Permission |
|----------|-----------|
| `GET /api/product-prompts` | `product_prompts:read` |
| `GET /api/product-prompts/company-assets` | `product_prompts:read` |
| `POST /api/product-prompts` | `product_prompts:create` |
| `GET /api/product-prompts/{id}` | `product_prompts:read` |
| `PUT /api/product-prompts/{id}` | `product_prompts:update` |
| `DELETE /api/product-prompts/{id}` | `product_prompts:delete` |

---

## GET /api/product-prompts

**Summary**: Get all product prompts for the current tenant

### Request

**Method**: `GET`

### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Perfume description",
      "prompt": "Generate a luxurious description for a perfume named {productName}...",
      "imageUrl": "https://cdn.example.com/prompts/perfume-ref.png",
      "createdAt": "2026-06-20T10:00:00",
      "updatedAt": "2026-06-20T10:00:00"
    }
  ]
}
```

**Response Fields**:

- `id`: UUID of the prompt
- `name`: Human-readable name for the prompt
- `prompt`: The AI prompt text (max 4000 characters)
- `imageUrl`: Optional reference image URL
- `createdAt` / `updatedAt`: Timestamps

---

## GET /api/product-prompts/company-assets

**Summary**: Get company assets (logo) for use in product prompt generation

### Request

**Method**: `GET`

### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": {
    "logoUrl": "https://cdn.example.com/company/logo.png"
  }
}
```

**Usage**: The logo URL can be embedded in AI prompts for brand-aware product description generation.

---

## POST /api/product-prompts

**Summary**: Create a new product prompt

### Request

**Method**: `POST`
**Content-Type**: `multipart/form-data`

#### Request Parts

- `prompt`: JSON object (see below)
- `image`: Optional, image file (PNG, JPG, JPEG, WEBP)

#### Prompt JSON Structure

```json
{
  "name": "Perfume description",
  "prompt": "Generate a luxurious description for a perfume named {productName}. Brand: {brandName}. Volume: {volume}."
}
```

**Field Validations**:
- `name`: Required, max 80 characters
- `prompt`: Required, max 4000 characters

### Response

**Status Code**: `201 CREATED`

```json
{
  "success": true,
  "message": "Product prompt created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Perfume description",
    "prompt": "Generate a luxurious description...",
    "imageUrl": "https://cdn.example.com/prompts/uuid.png",
    "createdAt": "2026-06-28T10:00:00",
    "updatedAt": "2026-06-28T10:00:00"
  }
}
```

---

## GET /api/product-prompts/{id}

**Summary**: Get product prompt by ID

### Request

**Method**: `GET`
**URL Parameters**: `id` (UUID) - Prompt identifier

### Response

**Status Code**: `200 OK`

Same format as individual item in the list response.

---

## PUT /api/product-prompts/{id}

**Summary**: Update a product prompt

### Request

**Method**: `PUT`
**URL Parameters**: `id` (UUID) - Prompt identifier
**Content-Type**: `multipart/form-data`

#### Request Parts

- `prompt`: JSON object (same structure as create)
- `image`: Optional, new image file to replace current one

### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Product prompt updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated name",
    "prompt": "Updated prompt text...",
    "imageUrl": "https://cdn.example.com/prompts/new-uuid.png",
    "createdAt": "2026-06-20T10:00:00",
    "updatedAt": "2026-06-28T11:00:00"
  }
}
```

---

## DELETE /api/product-prompts/{id}

**Summary**: Delete a product prompt (soft delete)

### Request

**Method**: `DELETE`
**URL Parameters**: `id` (UUID) - Prompt identifier

### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Product prompt deleted successfully",
  "data": null
}
```

---

## Frontend Implementation Guide

1. **Prompt Library**: Display prompts as cards or table rows
2. **Image Preview**: Show reference image thumbnail for each prompt
3. **Create/Edit Form**: Form with name, prompt text area, and optional image upload
4. **Placeholder Help**: Show available placeholder variables in the UI (e.g., `{productName}`, `{brandName}`, `{volume}`)
5. **Preview**: Allow previewing the prompt with sample values before saving
6. **Delete Confirmation**: Confirm before soft-deleting a prompt

---

## Common Error Responses

### 400 Bad Request - Validation
```json
{
  "status": 400,
  "error": "Validation Failed",
  "message": "Invalid input",
  "path": "/api/product-prompts",
  "validationErrors": {
    "name": "Prompt name is required",
    "prompt": "Prompt text cannot exceed 4000 characters"
  }
}
```

### 404 Not Found
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Product prompt not found with id: 550e8400-e29b-41d4-a716-446655440000"
}
```
