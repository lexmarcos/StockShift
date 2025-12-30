# Brand Endpoints

## Overview
These endpoints manage brands in the StockShift system. Brands can be associated with products to organize inventory by manufacturer or brand name. All endpoints require authentication with appropriate permissions.

**Base URL**: `/api/brands`
**Authentication**: Required (Bearer token)

---

## POST /api/brands
**Summary**: Create a new brand

### Authorization
**Required Permissions**: `BRAND_CREATE` or `ROLE_ADMIN`

### Request
**Method**: `POST`
**Content-Type**: `application/json`

#### Request Body
```json
{
  "name": "Natura",
  "logoUrl": "https://example.com/logos/natura.png"
}
```

**Field Details**:
- `name`: Required, brand name (unique per tenant, max 255 characters)
- `logoUrl`: Optional, URL for brand logo (max 500 characters)

### Response
**Status Code**: `201 CREATED`

```json
{
  "success": true,
  "message": "Brand created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Natura",
    "logoUrl": "https://example.com/logos/natura.png",
    "createdAt": "2025-12-28T10:00:00Z",
    "updatedAt": "2025-12-28T10:00:00Z"
  }
}
```

### Frontend Implementation Guide
1. **Form Fields**: Simple form with name (required) and logo URL (optional)
2. **Logo Upload**: Consider implementing file upload for logo (store URL after upload)
3. **Logo Preview**: Show logo preview when URL is provided
4. **Name Validation**: Validate name is not empty and check uniqueness
5. **Success Feedback**: Show success message and redirect to brand list
6. **Error Handling**: Display validation errors (duplicate name, invalid URL format)

### Error Responses
**400 Bad Request** - Duplicate brand name:
```json
{
  "success": false,
  "message": "Já existe uma marca com este nome",
  "data": null
}
```

---

## GET /api/brands
**Summary**: Get all brands for the current tenant

### Authorization
**Required Permissions**: `BRAND_READ` or `ROLE_ADMIN`

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
      "name": "Natura",
      "logoUrl": "https://example.com/logos/natura.png",
      "createdAt": "2025-12-28T10:00:00Z",
      "updatedAt": "2025-12-28T10:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "O Boticário",
      "logoUrl": "https://example.com/logos/boticario.png",
      "createdAt": "2025-12-28T11:00:00Z",
      "updatedAt": "2025-12-28T11:00:00Z"
    }
  ]
}
```

### Frontend Implementation Guide
1. **List View**: Display brands in table or card grid
2. **Columns**: Show logo (thumbnail), name, creation date
3. **Logo Display**: Show logo thumbnail if available, placeholder if not
4. **Sorting**: Allow sorting by name, creation date
5. **Search**: Add search/filter by brand name
6. **Actions**: Include view, edit, delete actions per row
7. **Empty State**: Show appropriate message if no brands exist
8. **Add Button**: Prominent button to create new brand
9. **Loading State**: Show skeleton/spinner while loading

---

## GET /api/brands/{id}
**Summary**: Get brand by ID

### Authorization
**Required Permissions**: `BRAND_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`
**URL Parameters**: `id` (UUID) - Brand identifier

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Natura",
    "logoUrl": "https://example.com/logos/natura.png",
    "createdAt": "2025-12-28T10:00:00Z",
    "updatedAt": "2025-12-28T10:00:00Z"
  }
}
```

### Frontend Implementation Guide
1. **Detail View**: Display brand information with logo
2. **Logo Display**: Show full-size logo if available
3. **Product Count**: Optionally show count of products using this brand
4. **Edit Button**: Include button to switch to edit mode
5. **Product List**: Show list of products associated with this brand
6. **Error Handling**: Handle 404 if brand not found

---

## PUT /api/brands/{id}
**Summary**: Update brand

### Authorization
**Required Permissions**: `BRAND_UPDATE` or `ROLE_ADMIN`

### Request
**Method**: `PUT`
**URL Parameters**: `id` (UUID) - Brand identifier
**Content-Type**: `application/json`

#### Request Body
```json
{
  "name": "Natura Cosméticos",
  "logoUrl": "https://example.com/logos/natura-new.png"
}
```

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Brand updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Natura Cosméticos",
    "logoUrl": "https://example.com/logos/natura-new.png",
    "createdAt": "2025-12-28T10:00:00Z",
    "updatedAt": "2025-12-28T15:30:00Z"
  }
}
```

### Frontend Implementation Guide
1. **Edit Form**: Pre-populate form with current brand data
2. **Logo Update**: Allow changing logo URL or uploading new logo
3. **Logo Preview**: Show preview of new logo before saving
4. **Validation**: Same validation as create form
5. **Optimistic Update**: Update UI immediately, rollback on error
6. **Confirmation**: Show success message after update
7. **Duplicate Check**: Handle error if new name conflicts with another brand

### Error Responses
**400 Bad Request** - Duplicate name with another brand:
```json
{
  "success": false,
  "message": "Já existe outra marca com este nome",
  "data": null
}
```

---

## DELETE /api/brands/{id}
**Summary**: Delete brand (soft delete)

### Authorization
**Required Permissions**: `BRAND_DELETE` or `ROLE_ADMIN`

### Request
**Method**: `DELETE`
**URL Parameters**: `id` (UUID) - Brand identifier

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Brand deleted successfully",
  "data": null
}
```

### Frontend Implementation Guide
1. **Confirmation Modal**: Always confirm before deletion
2. **Product Check**: Warn if brand has associated products
3. **Soft Delete Explanation**: Explain brand is deactivated, not permanently deleted
4. **Optimistic Update**: Remove from list immediately, rollback on error
5. **Error Handling**: Handle error if brand has products (cannot be deleted)
6. **Alternative Action**: Suggest removing brand from products first

### Error Responses
**400 Bad Request** - Brand has associated products:
```json
{
  "success": false,
  "message": "Não é possível deletar marca com produtos vinculados",
  "data": null
}
```

**404 Not Found** - Brand not found:
```json
{
  "success": false,
  "message": "Brand not found",
  "data": null
}
```

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required",
  "data": null
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Required permission: BRAND_CREATE",
  "data": null
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Brand not found",
  "data": null
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Nome é obrigatório",
  "data": null
}
```

---

## Business Rules

### Brand Name Uniqueness
- Brand names must be unique per tenant
- Validation occurs at both database and application level
- Case-sensitive comparison (e.g., "Natura" and "natura" are different)

### Brand Deletion
- Brands can only be deleted if they have no associated products
- If products exist with the brand, deletion is blocked
- To delete a brand:
  1. Remove brand from all products OR
  2. Delete all products with that brand OR
  3. Wait until all products are naturally removed

### Soft Delete
- Deleted brands are not permanently removed from database
- They are marked with `deletedAt` timestamp
- Deleted brands do not appear in listings
- Soft-deleted brands cannot be restored via API (requires database operation)

### Multi-Tenancy
- Brands are isolated by tenant
- Users can only see and manage brands within their tenant
- Brand name uniqueness is enforced per tenant (different tenants can have brands with same name)

---

## Frontend Best Practices

1. **Permission Checks**: Hide/disable UI elements based on user permissions
2. **Loading States**: Show loading indicators for all async operations
3. **Error Messages**: Display user-friendly error messages in Portuguese
4. **Optimistic Updates**: Update UI optimistically for better UX
5. **Caching**: Cache brand list, invalidate on create/update/delete
6. **Logo Handling**:
   - Support logo upload with preview
   - Validate image format and size
   - Provide default placeholder for brands without logo
   - Show thumbnails in lists, full size in detail view
7. **Search & Filter**: Implement client-side search for brand name
8. **Responsive Design**: Ensure brand management works on mobile devices
9. **Accessibility**: Add proper ARIA labels and keyboard navigation
10. **Product Association**:
    - Show count of products per brand
    - Link to filtered product list by brand
    - Warn before deleting brand with products

---

## Integration with Products

### Assigning Brand to Product
When creating or updating a product, include `brandId`:

```json
POST /api/products
{
  "name": "Perfume Ekos",
  "brandId": "550e8400-e29b-41d4-a716-446655440000",
  ...
}
```

### Product Response includes Brand
Product responses include full brand object:

```json
{
  "id": "...",
  "name": "Perfume Ekos",
  "brand": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Natura",
    "logoUrl": "https://example.com/logos/natura.png",
    ...
  },
  ...
}
```

### Filtering Products by Brand
To get all products for a specific brand, use product search/filter endpoints with brand criteria.

---

## Example Frontend Workflows

### Creating a Brand
1. User clicks "Add Brand" button
2. Modal/page opens with form (name required, logo optional)
3. User fills name "Natura"
4. User optionally uploads logo or enters logo URL
5. User clicks "Save"
6. Frontend validates form
7. Frontend sends POST to `/api/brands`
8. On success: close form, show success message, refresh brand list
9. On error: display error message (e.g., duplicate name)

### Editing a Brand
1. User clicks "Edit" on brand in list
2. Modal/page opens with pre-filled form
3. User modifies name or logo
4. User clicks "Save"
5. Frontend validates form
6. Frontend sends PUT to `/api/brands/{id}`
7. On success: close form, show success message, update brand in list
8. On error: display error message

### Deleting a Brand
1. User clicks "Delete" on brand in list
2. Confirmation modal appears: "Are you sure you want to delete 'Natura'?"
3. User confirms deletion
4. Frontend sends DELETE to `/api/brands/{id}`
5. On success: remove brand from list, show success message
6. On error (brand has products): show error "Cannot delete brand with associated products. Remove brand from products first."

### Using Brand in Product Form
1. Product create/edit form includes brand selector
2. Brand selector dropdown populated with GET `/api/brands`
3. User selects brand from dropdown (optional field)
4. On save, `brandId` included in product request
5. Product detail view shows brand logo and name
