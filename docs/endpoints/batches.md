# Batch Endpoints

## Overview
Batches represent specific quantities of products stored in warehouses. Each batch tracks quantity, expiration date, and location.

**Base URL**: `/api/batches`  
**Authentication**: Required (Bearer token)

---

## POST /api/batches
**Summary**: Create a new batch

### Authorization
**Required Permissions**: `BATCH_CREATE` or `ROLE_ADMIN`

### Request
**Method**: `POST`  
**Content-Type**: `application/json`

#### Request Body
```json
{
  "productId": "550e8400-e29b-41d4-a716-446655440000",
  "warehouseId": "660e8400-e29b-41d4-a716-446655440001",
  "quantity": 100,
  "batchNumber": "BATCH-2025-001",
  "expirationDate": "2026-12-31",
  "costPrice": 10.50,
  "notes": "Initial stock from supplier"
}
```

**Field Details**:
- `productId`: Required, UUID of the product
- `warehouseId`: Required, UUID of the warehouse
- `quantity`: Required, positive integer
- `batchNumber`: Required, unique batch identifier
- `expirationDate`: Optional, ISO date string (required if product has expiration)
- `costPrice`: Optional, cost per unit
- `notes`: Optional, additional notes

### Response
**Status Code**: `201 CREATED`

```json
{
  "success": true,
  "message": "Batch created successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "productId": "550e8400-e29b-41d4-a716-446655440000",
    "productName": "Product Name",
    "productSku": "PROD-001",
    "warehouseId": "660e8400-e29b-41d4-a716-446655440001",
    "warehouseName": "Main Warehouse",
    "warehouseCode": "WH-001",
    "quantity": 100,
    "batchNumber": "BATCH-2025-001",
    "expirationDate": "2026-12-31",
    "costPrice": 10.50,
    "notes": "Initial stock from supplier",
    "createdAt": "2025-12-28T10:00:00Z",
    "updatedAt": "2025-12-28T10:00:00Z"
  }
}
```

### Frontend Implementation Guide
1. **Product Selector**: Autocomplete/dropdown with search
2. **Warehouse Selector**: Dropdown of active warehouses
3. **Quantity Input**: Numeric input with validation (positive numbers)
4. **Batch Number**: Auto-generate or allow manual entry
5. **Expiration Date**: Date picker, show only if product has expiration
6. **Cost Price**: Decimal input with currency symbol
7. **Validation**: Check required fields, validate formats
8. **Success Flow**: Show success message, redirect to batch list or detail

---

## GET /api/batches
**Summary**: Get all batches

### Authorization
**Required Permissions**: `BATCH_READ` or `ROLE_ADMIN`

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
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "productName": "Product Name",
      "productSku": "PROD-001",
      "warehouseId": "660e8400-e29b-41d4-a716-446655440001",
      "warehouseName": "Main Warehouse",
      "warehouseCode": "WH-001",
      "quantity": 100,
      "batchNumber": "BATCH-2025-001",
      "expirationDate": "2026-12-31",
      "costPrice": 10.50,
      "notes": "Initial stock from supplier",
      "createdAt": "2025-12-28T10:00:00Z",
      "updatedAt": "2025-12-28T10:00:00Z"
    }
  ]
}
```

### Frontend Implementation Guide
1. **Table View**: Display batches in data table
2. **Columns**: Product, Warehouse, Quantity, Batch #, Expiration, Actions
3. **Expiration Warning**: Highlight batches near expiration
4. **Low Stock**: Highlight batches with low quantity
5. **Filtering**: Filter by product, warehouse, expiration status
6. **Sorting**: Sort by any column
7. **Pagination**: Implement pagination for large datasets
8. **Bulk Actions**: Select multiple batches for bulk operations

---

## GET /api/batches/{id}
**Summary**: Get batch by ID

### Authorization
**Required Permissions**: `BATCH_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**URL Parameters**: `id` (UUID) - Batch identifier

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "productId": "550e8400-e29b-41d4-a716-446655440000",
    "productName": "Product Name",
    "productSku": "PROD-001",
    "warehouseId": "660e8400-e29b-41d4-a716-446655440001",
    "warehouseName": "Main Warehouse",
    "warehouseCode": "WH-001",
    "quantity": 100,
    "batchNumber": "BATCH-2025-001",
    "expirationDate": "2026-12-31",
    "costPrice": 10.50,
    "notes": "Initial stock from supplier",
    "createdAt": "2025-12-28T10:00:00Z",
    "updatedAt": "2025-12-28T10:00:00Z"
  }
}
```

### Frontend Implementation Guide
1. **Detail View**: Show all batch information
2. **Product Link**: Link to product detail page
3. **Warehouse Link**: Link to warehouse detail page
4. **Movement History**: Show all movements affecting this batch
5. **Status Indicators**: Expiration status, stock level status
6. **Quick Actions**: Edit, delete, adjust quantity
7. **Alerts**: Show alerts for expiring or low stock

---

## GET /api/batches/warehouse/{warehouseId}
**Summary**: Get batches by warehouse

### Authorization
**Required Permissions**: `BATCH_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**URL Parameters**: `warehouseId` (UUID) - Warehouse identifier

### Response
Same format as GET /api/batches (returns array of batches)

### Frontend Implementation Guide
1. **Warehouse View**: Use in warehouse detail page
2. **Stock Overview**: Show all products in warehouse
3. **Filtering**: Additional filters within warehouse
4. **Stock Summary**: Calculate total stock value
5. **Export**: Allow exporting warehouse inventory

---

## GET /api/batches/product/{productId}
**Summary**: Get batches by product

### Authorization
**Required Permissions**: `BATCH_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**URL Parameters**: `productId` (UUID) - Product identifier

### Response
Same format as GET /api/batches (returns array of batches)

### Frontend Implementation Guide
1. **Product View**: Use in product detail page
2. **Stock Locations**: Show where product is stored
3. **Total Quantity**: Calculate total across all batches
4. **Best Before**: Show which batches expire first (FEFO)
5. **Warehouse Distribution**: Visualize stock across warehouses

---

## GET /api/batches/expiring/{daysAhead}
**Summary**: Get batches expiring in next N days

### Authorization
**Required Permissions**: `BATCH_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**URL Parameters**: `daysAhead` (Integer) - Number of days to look ahead

**Example**: `/api/batches/expiring/30` - Get batches expiring in next 30 days

### Response
Same format as GET /api/batches (returns array of expiring batches)

### Frontend Implementation Guide
1. **Dashboard Widget**: Show on dashboard as alert widget
2. **Color Coding**: Red for <7 days, yellow for 7-30 days
3. **Urgency Sorting**: Sort by expiration date (soonest first)
4. **Notification**: Send notifications for soon-expiring batches
5. **Action Buttons**: Quick actions (discount, transfer, dispose)
6. **Filter Options**: Different time ranges (7, 15, 30, 60 days)

---

## GET /api/batches/low-stock/{threshold}
**Summary**: Get batches with quantity below threshold

### Authorization
**Required Permissions**: `BATCH_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**URL Parameters**: `threshold` (Integer) - Quantity threshold

**Example**: `/api/batches/low-stock/10` - Get batches with quantity < 10

### Response
Same format as GET /api/batches (returns array of low-stock batches)

### Frontend Implementation Guide
1. **Dashboard Widget**: Low stock alert on dashboard
2. **Reorder List**: Use for creating purchase orders
3. **Threshold Settings**: Allow setting per-product thresholds
4. **Visual Indicator**: Icon or badge for low stock
5. **Notification System**: Alert users when stock is low
6. **Action Buttons**: Quick reorder, transfer stock

---

## PUT /api/batches/{id}
**Summary**: Update batch

### Authorization
**Required Permissions**: `BATCH_UPDATE` or `ROLE_ADMIN`

### Request
**Method**: `PUT`  
**URL Parameters**: `id` (UUID) - Batch identifier  
**Content-Type**: `application/json`

#### Request Body
Same structure as POST /api/batches

**Note**: Quantity should typically be updated via stock movements, not direct updates.

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Batch updated successfully",
  "data": {
    // Updated batch object
  }
}
```

### Frontend Implementation Guide
1. **Edit Form**: Pre-populate with current values
2. **Restricted Fields**: Disable product and warehouse fields
3. **Quantity Warning**: Warn about direct quantity changes
4. **Audit Trail**: Log who made changes and when
5. **Validation**: Same as create form
6. **Confirmation**: Require confirmation for significant changes

---

## DELETE /api/batches/{id}
**Summary**: Delete batch

### Authorization
**Required Permissions**: `BATCH_DELETE` or `ROLE_ADMIN`

### Request
**Method**: `DELETE`  
**URL Parameters**: `id` (UUID) - Batch identifier

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Batch deleted successfully",
  "data": null
}
```

### Frontend Implementation Guide
1. **Confirmation**: Require strong confirmation
2. **Quantity Check**: Warn if batch still has quantity
3. **Movement Check**: Warn if batch has movements
4. **Alternative**: Suggest zeroing quantity via adjustment
5. **Audit**: Ensure deletion is logged
6. **Restrictions**: Consider preventing deletion if batch has history

---

## Frontend Component Examples

### Batch Table
```typescript
interface BatchTableProps {
  batches: Batch[];
  loading: boolean;
  onEdit: (batch: Batch) => void;
  onDelete: (batchId: string) => void;
  showWarehouse?: boolean;
  showProduct?: boolean;
}

// Columns to display:
// - Batch Number
// - Product (name + SKU)
// - Warehouse (name + code)
// - Quantity (with low stock indicator)
// - Expiration Date (with expiring indicator)
// - Cost Price (formatted currency)
// - Actions (Edit, Delete)

// Features:
// - Row highlighting for expiring/low stock
// - Sortable columns
// - Inline editing for quick updates
// - Checkbox for bulk selection
// - Export to CSV/Excel
```

### Batch Status Badges
```typescript
interface BatchStatusProps {
  batch: Batch;
  showExpiration?: boolean;
  showStockLevel?: boolean;
}

// Status badges:
// - Expired (red badge)
// - Expiring Soon (yellow badge with days remaining)
// - Low Stock (orange badge)
// - Out of Stock (red badge)
// - Good (green badge)
```

### Stock Level Visualization
```typescript
interface StockLevelProps {
  batches: Batch[];
  groupBy: 'warehouse' | 'product';
}

// Visualizations:
// - Bar chart of stock levels
// - Pie chart of stock distribution
// - Stock value by location
// - Trend over time
// - Comparison with thresholds
```

---

## Frontend Best Practices

### Expiration Management
1. **Color System**: Consistent color coding for expiration status
2. **FEFO Display**: Show First-Expired-First-Out order
3. **Alerts**: Proactive alerts before expiration
4. **Batch Selection**: Auto-select expiring batches for movements
5. **Reports**: Expiration reports and forecasts

### Stock Monitoring
1. **Real-time Updates**: Update stock levels in real-time
2. **Threshold Alerts**: Configurable low-stock thresholds
3. **Multi-level Alerts**: Different alert levels (critical, warning, info)
4. **Notification Center**: Centralized notification management
5. **Dashboard Widgets**: Key metrics on dashboard

### Data Entry
1. **Smart Defaults**: Pre-fill common values
2. **Batch Number Generation**: Auto-generate with pattern
3. **Barcode Integration**: Scan products for quick entry
4. **Validation**: Comprehensive client-side validation
5. **Error Prevention**: Prevent common mistakes

### Performance
1. **Pagination**: Essential for large batch lists
2. **Lazy Loading**: Load details on demand
3. **Caching**: Cache batch data with smart invalidation
4. **Debouncing**: Debounce search and filter operations
5. **Virtualization**: Virtual scrolling for large lists

---

## Common Error Responses

### 400 Bad Request - Duplicate Batch Number
```json
{
  "success": false,
  "message": "Batch number already exists",
  "data": null
}
```

### 400 Bad Request - Invalid Quantity
```json
{
  "success": false,
  "message": "Quantity must be greater than 0",
  "data": null
}
```

### 400 Bad Request - Expiration Required
```json
{
  "success": false,
  "message": "Expiration date is required for products with expiration",
  "data": null
}
```

### 409 Conflict - Batch in Use
```json
{
  "success": false,
  "message": "Cannot delete batch: used in stock movements",
  "data": {
    "movementCount": 5
  }
}
```

---

## Integration Points

### With Products
- Validate product has expiration if expiration date provided
- Display product details in batch views

### With Warehouses
- Validate warehouse is active
- Show warehouse capacity and utilization

### With Stock Movements
- Batches are affected by stock movements
- Movement history shows batch transactions

### With Reports
- Stock reports aggregate batch data
- Expiration reports use batch expiration dates
- Cost analysis uses batch cost prices
