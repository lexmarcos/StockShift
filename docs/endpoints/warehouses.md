# Warehouse Endpoints

## Overview
These endpoints manage warehouses (physical locations where stock is stored) in the StockShift system.

**Base URL**: `/api/warehouses`  
**Authentication**: Required (Bearer token)

---

## POST /api/warehouses
**Summary**: Create a new warehouse

### Authorization
**Required Permissions**: `WAREHOUSE_CREATE` or `ROLE_ADMIN`

### Request
**Method**: `POST`  
**Content-Type**: `application/json`

#### Request Body
```json
{
  "name": "Main Warehouse",
  "code": "WH-001",
  "description": "Primary storage facility",
  "address": "123 Storage St, City, State 12345",
  "phone": "+1234567890",
  "email": "warehouse@company.com",
  "isActive": true
}
```

**Field Details**:
- `name`: Required, warehouse name (2-100 characters)
- `code`: Required, unique warehouse code (2-20 characters)
- `description`: Optional, warehouse description
- `address`: Optional, physical address
- `phone`: Optional, contact phone
- `email`: Optional, contact email
- `isActive`: Optional, default `true`, warehouse status

### Response
**Status Code**: `201 CREATED`

```json
{
  "success": true,
  "message": "Warehouse created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Main Warehouse",
    "code": "WH-001",
    "description": "Primary storage facility",
    "address": "123 Storage St, City, State 12345",
    "phone": "+1234567890",
    "email": "warehouse@company.com",
    "isActive": true,
    "createdAt": "2025-12-28T10:00:00Z",
    "updatedAt": "2025-12-28T10:00:00Z"
  }
}
```

### Frontend Implementation Guide
1. **Form Fields**: Create comprehensive form with all fields
2. **Code Generation**: Auto-generate unique warehouse code
3. **Address Input**: Use address autocomplete/geocoding
4. **Phone Validation**: Validate phone number format
5. **Email Validation**: Validate email format
6. **Map Integration**: Show warehouse location on map (optional)
7. **Success Flow**: Redirect to warehouse list or detail view

---

## GET /api/warehouses
**Summary**: Get all warehouses

### Authorization
**Required Permissions**: `WAREHOUSE_READ` or `ROLE_ADMIN`

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
      "name": "Main Warehouse",
      "code": "WH-001",
      "description": "Primary storage facility",
      "address": "123 Storage St, City, State 12345",
      "phone": "+1234567890",
      "email": "warehouse@company.com",
      "isActive": true,
      "createdAt": "2025-12-28T10:00:00Z",
      "updatedAt": "2025-12-28T10:00:00Z"
    }
  ]
}
```

### Frontend Implementation Guide
1. **List View**: Display warehouses in table or card grid
2. **Key Info**: Show name, code, address, active status
3. **Status Badge**: Visual indicator for active/inactive status
4. **Quick Actions**: Edit, view details, activate/deactivate
5. **Filtering**: Filter by active status
6. **Sorting**: Sort by name, code, created date
7. **Stock Summary**: Show total stock value per warehouse (if available)
8. **Map View**: Optional map view showing all warehouse locations

---

## GET /api/warehouses/{id}/products
**Summary**: Get all products with aggregated stock for a specific warehouse

### Authorization
**Required Permissions**: `WAREHOUSE_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**URL Parameters**: `id` (UUID) - Warehouse identifier

**Query Parameters** (optional):
- `page`: Page number (default: 0)
- `size`: Page size (default: 20)
- `sort`: Sort field and direction (e.g., "name,asc")

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Product A",
        "sku": "SKU-001",
        "barcode": "1234567890",
        "barcodeType": "EAN13",
        "description": "Product description",
        "categoryId": "550e8400-e29b-41d4-a716-446655440010",
        "categoryName": "Electronics",
        "brand": {
          "id": "550e8400-e29b-41d4-a716-446655440020",
          "name": "Brand Name",
          "logoUrl": "https://example.com/logo.png",
          "createdAt": "2025-12-28T10:00:00Z",
          "updatedAt": "2025-12-28T10:00:00Z"
        },
        "isKit": false,
        "attributes": {},
        "hasExpiration": false,
        "active": true,
        "totalQuantity": 125.00,
        "createdAt": "2025-12-28T10:00:00Z",
        "updatedAt": "2025-12-28T10:00:00Z"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "sort": [],
      "offset": 0,
      "unpaged": false,
      "paged": true
    },
    "totalElements": 150,
    "totalPages": 8,
    "number": 0,
    "size": 20,
    "empty": false
  }
}
```

### Error Responses

#### 404 Not Found
```json
{
  "success": false,
  "message": "Warehouse not found",
  "data": null
}
```

#### 400 Bad Request - Invalid Pagination
```json
{
  "success": false,
  "message": "Invalid page size",
  "data": null
}
```

### Features
- **Aggregated Stock**: Sums quantity across all batches per product
- **Multi-tenant Aware**: Filters by both batch and product tenant IDs
- **Soft Delete Aware**: Excludes soft-deleted products
- **Optional Relationships**: Supports products without category or brand (LEFT JOIN)
- **Pagination**: Supports configurable page size (default 20)
- **Sorting**: Supports sorting by product entity fields only
- **Zero Stock**: Includes products with zero current inventory

### Valid Sort Fields
The following fields can be used for sorting:
- `name` - Product name
- `sku` - Stock keeping unit
- `barcode` - Barcode code
- `active` - Active status
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

**Note**: Sorting by aggregated fields like `totalQuantity` is not supported due to SQL GROUP BY limitations.

### Frontend Implementation Guide
1. **Inventory Grid**: Display products in paginated table view
2. **Stock Display**: Show total quantity with visual indicators (low, normal, high)
3. **Product Info**: Display name, SKU, barcode, category (if available), brand (if available)
4. **Missing Relationships**: Handle null category and brand gracefully
5. **Actions**: Add stock movement, view batch history, edit product details
6. **Pagination**: Implement page selector (5, 10, 20, 50 items per page)
7. **Filtering**: Option to hide zero-stock products
8. **Sort Validation**: Only allow sorting by valid fields listed above
9. **Export**: Export product list with quantities to CSV/PDF
10. **Real-time**: Refresh button to reload current page data
11. **Search**: Filter products by name or SKU (frontend side or add API param)
12. **Batch History**: Click product to view batch-level details with dates/expiration

### Usage Examples
```bash
# Get first page of products (default size)
curl -H "Authorization: Bearer {token}" \
  https://api.example.com/api/warehouses/550e8400-e29b-41d4-a716-446655440000/products

# Get with custom pagination
curl -H "Authorization: Bearer {token}" \
  https://api.example.com/api/warehouses/550e8400-e29b-41d4-a716-446655440000/products?page=0&size=50

# Sort by product name ascending
curl -H "Authorization: Bearer {token}" \
  https://api.example.com/api/warehouses/550e8400-e29b-41d4-a716-446655440000/products?page=0&size=20&sort=name,asc

# Sort by creation date descending
curl -H "Authorization: Bearer {token}" \
  https://api.example.com/api/warehouses/550e8400-e29b-41d4-a716-446655440000/products?page=0&size=20&sort=createdAt,desc

# Multiple sort fields
curl -H "Authorization: Bearer {token}" \
  https://api.example.com/api/warehouses/550e8400-e29b-41d4-a716-446655440000/products?sort=active,desc&sort=name,asc
```

### Implementation Notes
- **Query Aggregation**: Uses SQL GROUP BY with SUM for quantity aggregation
- **Performance**: Optimized with COUNT DISTINCT for pagination
- **Null Handling**: Category and Brand are optional fields; NULL values are preserved
- **Tenant Isolation**: Enforces strict multi-tenant isolation on both batch and product level

---

## GET /api/warehouses/{id}
**Summary**: Get warehouse by ID

### Authorization
**Required Permissions**: `WAREHOUSE_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**URL Parameters**: `id` (UUID) - Warehouse identifier

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Main Warehouse",
    "code": "WH-001",
    "description": "Primary storage facility",
    "address": "123 Storage St, City, State 12345",
    "phone": "+1234567890",
    "email": "warehouse@company.com",
    "isActive": true,
    "createdAt": "2025-12-28T10:00:00Z",
    "updatedAt": "2025-12-28T10:00:00Z"
  }
}
```

### Frontend Implementation Guide
1. **Detail View**: Display all warehouse information
2. **Sections**: Organize into sections (Info, Contact, Stock, Activity)
3. **Stock Overview**: Show batches and stock levels in this warehouse
4. **Recent Movements**: Display recent stock movements
5. **Statistics**: Total products, total quantity, stock value
6. **Map**: Show warehouse location on map
7. **Edit Button**: Quick access to edit form
8. **Activity Log**: Show recent activities in warehouse

---

## GET /api/warehouses/active/{isActive}
**Summary**: Get warehouses by active status

### Authorization
**Required Permissions**: `WAREHOUSE_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**URL Parameters**: `isActive` (Boolean) - `true` for active, `false` for inactive

### Response
Same format as GET /api/warehouses (returns array of warehouses)

### Frontend Implementation Guide
1. **Status Filter**: Toggle or tabs to switch between active/inactive
2. **Visual Distinction**: Different styling for inactive warehouses
3. **Activation**: Quick activate/deactivate action
4. **Default View**: Default to showing only active warehouses
5. **Bulk Actions**: Allow bulk activation/deactivation

---

## PUT /api/warehouses/{id}
**Summary**: Update warehouse

### Authorization
**Required Permissions**: `WAREHOUSE_UPDATE` or `ROLE_ADMIN`

### Request
**Method**: `PUT`  
**URL Parameters**: `id` (UUID) - Warehouse identifier  
**Content-Type**: `application/json`

#### Request Body
Same structure as POST /api/warehouses

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Warehouse updated successfully",
  "data": {
    // Updated warehouse object
  }
}
```

### Frontend Implementation Guide
1. **Edit Form**: Pre-populate with current data
2. **Code Immutability**: Consider making code read-only after creation
3. **Validation**: Same as create form
4. **Change Tracking**: Highlight changed fields
5. **Impact Warning**: Warn if deactivating warehouse with stock
6. **Confirmation**: Require confirmation for major changes
7. **Optimistic Update**: Update UI immediately, rollback on error

---

## DELETE /api/warehouses/{id}
**Summary**: Delete warehouse

### Authorization
**Required Permissions**: `WAREHOUSE_DELETE` or `ROLE_ADMIN`

### Request
**Method**: `DELETE`  
**URL Parameters**: `id` (UUID) - Warehouse identifier

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Warehouse deleted successfully",
  "data": null
}
```

### Frontend Implementation Guide
1. **Strict Confirmation**: Strong confirmation required (type warehouse name)
2. **Constraint Check**: Check if warehouse has stock or batches
3. **Error Message**: Clear message if deletion blocked by constraints
4. **Alternative**: Suggest deactivation instead of deletion
5. **Data Migration**: Offer to transfer stock to another warehouse
6. **Audit Trail**: Ensure action is logged
7. **Irreversible Warning**: Make it clear deletion is permanent

---

## Frontend Component Examples

### Warehouse Selector
```typescript
interface WarehouseSelectorProps {
  value: string | null;
  onChange: (warehouseId: string) => void;
  activeOnly?: boolean;
  placeholder?: string;
}

// Component should:
// - Load warehouses from API
// - Filter by active status if activeOnly=true
// - Show warehouse code and name in dropdown
// - Support search/autocomplete
// - Show inactive warehouses with visual distinction
```

### Warehouse Card
```typescript
interface WarehouseCardProps {
  warehouse: Warehouse;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  showStats?: boolean;
}

// Card should display:
// - Warehouse name and code
// - Active/inactive badge
// - Address summary
// - Contact info (icon + text)
// - Stock statistics (if showStats=true)
// - Action buttons (Edit, Delete, Toggle Active)
```

### Warehouse List Filters
```typescript
interface WarehouseFilters {
  activeStatus: 'all' | 'active' | 'inactive';
  searchQuery: string;
  sortBy: 'name' | 'code' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

// Filter bar should include:
// - Search input (by name or code)
// - Status filter (All/Active/Inactive)
// - Sort dropdown
// - Clear filters button
// - Create new warehouse button
```

---

## Frontend Best Practices

### State Management
1. **Cache**: Cache warehouse list for quick access
2. **Invalidation**: Refresh on create/update/delete
3. **Active Only**: Default to loading active warehouses only
4. **Lazy Loading**: Load details on demand
5. **Optimistic Updates**: Update UI immediately for better UX

### Validation
1. **Unique Code**: Check code uniqueness before submission
2. **Required Fields**: Validate name and code
3. **Format Validation**: Validate email and phone formats
4. **Length Limits**: Enforce character limits
5. **Real-time Feedback**: Show validation errors as user types

### User Experience
1. **Quick Actions**: Provide quick access to common operations
2. **Contextual Info**: Show relevant info in context (e.g., stock count)
3. **Visual Status**: Clear visual indicators for active/inactive
4. **Search**: Fast, responsive search functionality
5. **Responsive**: Mobile-friendly warehouse management
6. **Shortcuts**: Keyboard shortcuts for common actions

### Permissions
1. **Hide Actions**: Hide unavailable actions based on permissions
2. **Disable Buttons**: Disable buttons for unauthorized actions
3. **Tooltips**: Explain why actions are disabled
4. **Role-based Views**: Adjust UI based on user role

---

## Common Error Responses

### 400 Bad Request - Duplicate Code
```json
{
  "success": false,
  "message": "Warehouse code already exists",
  "data": null
}
```

### 400 Bad Request - Has Stock
```json
{
  "success": false,
  "message": "Cannot delete warehouse: contains active stock batches",
  "data": {
    "batchCount": 45,
    "totalQuantity": 1250
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Warehouse not found",
  "data": null
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Cannot deactivate: warehouse has pending stock movements",
  "data": {
    "pendingMovements": 3
  }
}
```

---

## Integration Points

### With Batches
- GET `/api/batches/warehouse/{warehouseId}` - Get all batches in warehouse
- Used in warehouse detail view to show inventory

### With Stock Movements
- Filter stock movements by warehouse
- Show recent movements in warehouse detail

### With Reports
- GET `/api/reports/stock` - Filter by warehouse
- Warehouse-specific stock reports and analytics
