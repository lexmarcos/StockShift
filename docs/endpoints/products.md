# Product Endpoints

## Overview
These endpoints manage products in the StockShift system. All endpoints require authentication with appropriate permissions.

**Base URL**: `/api/products`  
**Authentication**: Required (Bearer token)

---

## POST /api/products/analyze-image
**Summary**: Analyze a product image using AI to extract details

### Authorization
**Required Permissions**: `PRODUCT_CREATE` or `ROLE_ADMIN`

### Request
**Method**: `POST`
**Content-Type**: `multipart/form-data`

#### Request Parts
- `image`: Required, image file (PNG, JPG, JPEG, WEBP)

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": {
    "name": "Make Me Fever Gold",
    "brandId": "660e8400-e29b-41d4-a716-446655440002",
    "brandName": "Mahogany",
    "categoryId": "550e8400-e29b-41d4-a716-446655440000",
    "categoryName": "Perfumes",
    "volumeValue": 100,
    "volumeUnit": "ml",
    "detectedCategory": null,
    "detectedBrand": null
  }
}
```

**Field Details**:
- `name`: Suggested product name
- `brandId`: UUID of the matching brand found in the database
- `brandName`: Name of the brand (from DB or detected)
- `categoryId`: UUID of the matching category found in the database
- `categoryName`: Name of the category (from DB or detected)
- `volumeValue`: Numeric volume extracted
- `volumeUnit`: Unit of measurement (ml, L, g, kg)
- `detectedCategory`: Raw category text from AI if no DB match found
- `detectedBrand`: Raw brand text from AI if no DB match found

### Frontend Implementation Guide
1. **Camera/Upload**: Allow user to take a photo or upload an image
2. **Loading State**: Show a spinner/progress bar while analysis is running (can take a few seconds)
3. **Auto-fill**: Use the returned data to pre-fill the product creation form
4. **Validation**: Allow user to review and correct the AI suggestions
5. **Brand/Category Logic**: If `brandId` is present, pre-select the dropdown. If only `detectedBrand` is present, allow user to create a new brand or search manually.

---

## POST /api/products
**Summary**: Create a new product

### Authorization
**Required Permissions**: `PRODUCT_CREATE` or `ROLE_ADMIN`

### Request
**Method**: `POST`  
**Content-Type**: `multipart/form-data`

#### Request Parts
- `product`: JSON object (see below)
- `image`: Optional, image file (PNG, JPG, JPEG, WEBP)

#### Product JSON Structure
```json
{
  "name": "Product Name",
  "description": "Product description",
  "categoryId": "550e8400-e29b-41d4-a716-446655440000",
  "brandId": "660e8400-e29b-41d4-a716-446655440002",
  "barcode": "1234567890123",
  "barcodeType": "EAN13",
  "sku": "PROD-001",
  "isKit": false,
  "attributes": {
    "weight": "1kg",
    "dimensions": "10x10x10cm"
  },
  "hasExpiration": true,
  "active": true,
  "imageUrl": "https://example.com/storage/products/uuid.png"
}
```

**Field Details**:
- `name`: Required, product name
- `description`: Optional, product description
- `categoryId`: Optional, UUID of the category
- `brandId`: Optional, UUID of the brand
- `barcode`: Optional, product barcode
- `barcodeType`: Optional, enum values: `EAN13`, `EAN8`, `UPC`, `CODE128`, `CODE39`
- `sku`: Optional, stock keeping unit code
- `isKit`: Optional, default `false`, indicates if product is a kit
- `attributes`: Optional, JSON object with custom attributes
- `hasExpiration`: Optional, default `false`, indicates if product has expiration date
- `active`: Optional, default `true`, product status
- `imageUrl`: Optional, URL of the product image

### Response
**Status Code**: `201 CREATED`

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Product Name",
    "description": "Product description",
    "imageUrl": "https://example.com/storage/products/uuid.png",
    "categoryId": "550e8400-e29b-41d4-a716-446655440000",
    "categoryName": "Category Name",
    "brand": {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "name": "Brand Name",
      "logoUrl": "https://example.com/brand-logo.png",
      "createdAt": "2025-12-28T09:00:00Z",
      "updatedAt": "2025-12-28T09:00:00Z"
    },
    "barcode": "1234567890123",
    "barcodeType": "EAN13",
    "sku": "PROD-001",
    "isKit": false,
    "attributes": {
      "weight": "1kg",
      "dimensions": "10x10x10cm"
    },
    "hasExpiration": true,
    "active": true,
    "createdAt": "2025-12-28T10:00:00Z",
    "updatedAt": "2025-12-28T10:00:00Z"
  }
}
```

### Frontend Implementation Guide
1. **Form Handling**: Use `FormData` to handle file upload and JSON data
2. **Image Preview**: Implement client-side image preview before upload
3. **Form Fields**: Create form with all fields, use appropriate input types
4. **Category Selector**: Implement dropdown/autocomplete for category selection
5. **Brand Selector**: Implement dropdown/autocomplete for brand selection (optional field)
6. **Barcode Scanner**: Consider integrating barcode scanner library
7. **Barcode Type**: Provide dropdown with barcode types
8. **Attributes Builder**: Allow dynamic key-value pairs for custom attributes
9. **Validation**: Validate required fields and image file type/size before submission
10. **Success Feedback**: Show success message and optionally redirect to product list

---

## GET /api/products
**Summary**: Get all products

### Authorization
**Required Permissions**: `PRODUCT_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Product Name",
      "description": "Product description",
      "imageUrl": "https://example.com/storage/products/uuid.png",
      "categoryId": "660e8400-e29b-41d4-a716-446655440001",
      "categoryName": "Category Name",
      "brand": {
        "id": "660e8400-e29b-41d4-a716-446655440002",
        "name": "Brand Name",
        "logoUrl": "https://example.com/brand-logo.png",
        "createdAt": "2025-12-28T09:00:00Z",
        "updatedAt": "2025-12-28T09:00:00Z"
      },
      "barcode": "1234567890123",
      "barcodeType": "EAN13",
      "sku": "PROD-001",
      "isKit": false,
      "attributes": {},
      "hasExpiration": true,
      "active": true,
      "createdAt": "2025-12-28T10:00:00Z",
      "updatedAt": "2025-12-28T10:00:00Z"
    }
  ]
}
```

### Frontend Implementation Guide
1. **List View**: Display products in table or card grid, including image thumbnail
2. **Columns**: Show key fields (image, name, SKU, barcode, category, status)
3. **Pagination**: Implement client-side pagination for large lists
4. **Sorting**: Allow sorting by name, SKU, category, date
5. **Filters**: Add filters for category, active status
6. **Actions**: Include edit, view details, delete actions per row
7. **Loading State**: Show skeleton/spinner while loading

---

## GET /api/products/{id}
**Summary**: Get product by ID

### Authorization
**Required Permissions**: `PRODUCT_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**URL Parameters**: `id` (UUID) - Product identifier

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Product Name",
    "description": "Product description",
    "imageUrl": "https://example.com/storage/products/uuid.png",
    "categoryId": "660e8400-e29b-41d4-a716-446655440001",
    "categoryName": "Category Name",
    "brand": {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "name": "Brand Name",
      "logoUrl": "https://example.com/brand-logo.png",
      "createdAt": "2025-12-28T09:00:00Z",
      "updatedAt": "2025-12-28T09:00:00Z"
    },
    "barcode": "1234567890123",
    "barcodeType": "EAN13",
    "sku": "PROD-001",
    "isKit": false,
    "attributes": {},
    "hasExpiration": true,
    "active": true,
    "createdAt": "2025-12-28T10:00:00Z",
    "updatedAt": "2025-12-28T10:00:00Z"
  }
}
```

### Frontend Implementation Guide
1. **Detail View**: Display all product information including full-size image
2. **Sections**: Organize info in sections (Basic, Category, Barcode, Advanced)
3. **Custom Attributes**: Display attributes as key-value list
4. **Edit Button**: Include button to switch to edit mode
5. **Related Data**: Show related batches, stock levels, movements
6. **Error Handling**: Handle 404 if product not found

---

## GET /api/products/category/{categoryId}
**Summary**: Get products by category

### Authorization
**Required Permissions**: `PRODUCT_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**URL Parameters**: `categoryId` (UUID) - Category identifier

### Response
Same format as GET /api/products (returns array of products with imageUrl)

### Frontend Implementation Guide
1. **Category Filter**: Use this endpoint when filtering by category
2. **Breadcrumb**: Show category hierarchy in breadcrumb
3. **Empty State**: Display appropriate message if no products found

---

## GET /api/products/active/{active}
**Summary**: Get products by active status

### Authorization
**Required Permissions**: `PRODUCT_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**URL Parameters**: `active` (Boolean) - `true` for active, `false` for inactive

### Response
Same format as GET /api/products (returns array of products with imageUrl)

### Frontend Implementation Guide
1. **Status Filter**: Use toggle or tabs to filter active/inactive
2. **Visual Indicator**: Show badge or color indicator for active status
3. **Bulk Actions**: Allow bulk activate/deactivate

---

## GET /api/products/search
**Summary**: Search products by name, SKU or barcode

### Authorization
**Required Permissions**: `PRODUCT_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**Query Parameters**: `q` (String) - Search query

**Example**: `/api/products/search?q=laptop`

### Response
Same format as GET /api/products (returns array of matching products with imageUrl)

### Frontend Implementation Guide
1. **Search Bar**: Implement debounced search input
2. **Debounce**: Wait 300-500ms after user stops typing before searching
3. **Min Length**: Only search if query is 2+ characters
4. **Autocomplete**: Show suggestions dropdown with results
5. **Highlight**: Highlight matching text in results
6. **Clear Button**: Add button to clear search
7. **Loading Indicator**: Show spinner in search input while searching

---

## GET /api/products/barcode/{barcode}
**Summary**: Get product by barcode

### Authorization
**Required Permissions**: `PRODUCT_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**URL Parameters**: `barcode` (String) - Product barcode

### Response
Same format as GET /api/products/{id} (returns single product with imageUrl)

### Frontend Implementation Guide
1. **Barcode Scanner**: Use camera or barcode scanner device
2. **Quick Lookup**: Use for quick product lookup in operations
3. **Error Handling**: Handle 404 if barcode not found

---

## GET /api/products/sku/{sku}
**Summary**: Get product by SKU

### Authorization
**Required Permissions**: `PRODUCT_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**URL Parameters**: `sku` (String) - Product SKU

### Response
Same format as GET /api/products/{id} (returns single product with imageUrl)

### Frontend Implementation Guide
1. **SKU Lookup**: Use for product lookup by SKU
2. **Quick Search**: Implement in point-of-sale or inventory entry
3. **Error Handling**: Handle 404 if SKU not found

---

## PUT /api/products/{id}
**Summary**: Update product

### Authorization
**Required Permissions**: `PRODUCT_UPDATE` or `ROLE_ADMIN`

### Request
**Method**: `PUT`  
**URL Parameters**: `id` (UUID) - Product identifier  
**Content-Type**: `multipart/form-data`

#### Request Parts
- `product`: JSON object (same structure as POST /api/products)
- `image`: Optional, new image file to replace current one

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Product Name",
    "imageUrl": "https://example.com/storage/products/new-uuid.png",
    // ... rest of product object
  }
}
```

### Frontend Implementation Guide
1. **Edit Form**: Pre-populate form with current product data
2. **Current Image**: Display current image and allow replacing it
3. **Validation**: Same validation as create form
4. **Optimistic Update**: Update UI immediately, rollback on error
5. **Confirmation**: Show success message after update
6. **Concurrent Edits**: Handle conflicts if data changed by another user

---

## DELETE /api/products/{id}
**Summary**: Delete product (soft delete)

### Authorization
**Required Permissions**: `PRODUCT_DELETE` or `ROLE_ADMIN`

### Request
**Method**: `DELETE`  
**URL Parameters**: `id` (UUID) - Product identifier

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": null
}
```

### Frontend Implementation Guide
1. **Confirmation Modal**: Always confirm before deletion
2. **Warning**: Warn about impact on related data (batches, movements)
3. **Soft Delete**: Explain that product is deactivated, not permanently deleted
4. **Undo**: Consider implementing undo functionality
5. **Optimistic Update**: Remove from list immediately, rollback on error
6. **Error Handling**: Handle errors gracefully (e.g., product in use)

---

## Common Error Responses

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Required permission: PRODUCT_CREATE",
  "data": null
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Product not found",
  "data": null
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "name": "Product name is required",
    "barcode": "Invalid barcode format"
  }
}
```

## Frontend Best Practices
1. **Permission Checks**: Hide/disable UI elements based on user permissions
2. **Loading States**: Show loading indicators for all async operations
3. **Error Messages**: Display user-friendly error messages
4. **Optimistic Updates**: Update UI optimistically for better UX
5. **Caching**: Cache product list, invalidate on create/update/delete
6. **Real-time Updates**: Consider WebSocket for multi-user environments
7. **Offline Support**: Consider offline-first approach with sync