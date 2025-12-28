# Stock Movement Endpoints

## Overview
Stock movements track all inventory changes including entries, exits, transfers, and adjustments. Movements can be pending, completed, or cancelled.

**Base URL**: `/api/stock-movements`  
**Authentication**: Required (Bearer token)

---

## Movement Types
- `ENTRY`: Stock entry (purchase, production, return from customer)
- `EXIT`: Stock exit (sale, consumption, disposal)
- `TRANSFER`: Transfer between warehouses
- `ADJUSTMENT`: Inventory adjustment (correction, physical count)

## Movement Status
- `PENDING`: Created but not executed
- `COMPLETED`: Successfully executed
- `CANCELLED`: Cancelled (no stock impact)

---

## POST /api/stock-movements
**Summary**: Create a new stock movement

### Authorization
**Required Permissions**: `STOCK_MOVEMENT_CREATE` or `ROLE_ADMIN`

### Request
**Method**: `POST`  
**Content-Type**: `application/json`

#### Request Body
```json
{
  "movementType": "ENTRY",
  "sourceWarehouseId": null,
  "destinationWarehouseId": "550e8400-e29b-41d4-a716-446655440000",
  "notes": "Purchase order #12345",
  "items": [
    {
      "productId": "660e8400-e29b-41d4-a716-446655440001",
      "batchId": "770e8400-e29b-41d4-a716-446655440002",
      "quantity": 50,
      "reason": "Stock replenishment"
    }
  ]
}
```

**Field Details**:
- `movementType`: Required, enum: `ENTRY`, `EXIT`, `TRANSFER`, `ADJUSTMENT`
- `sourceWarehouseId`: Required for EXIT and TRANSFER, null for ENTRY
- `destinationWarehouseId`: Required for ENTRY and TRANSFER, null for EXIT
- `notes`: Optional, movement description
- `items`: Required, array of movement items (min 1 item)
  - `productId`: Required, UUID of product
  - `batchId`: Required for EXIT/TRANSFER, optional for ENTRY (will create new batch)
  - `quantity`: Required, positive integer
  - `reason`: Optional, specific reason for this item

### Response
**Status Code**: `201 CREATED`

```json
{
  "success": true,
  "message": "Stock movement created successfully",
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "movementType": "ENTRY",
    "status": "PENDING",
    "sourceWarehouseId": null,
    "sourceWarehouseName": null,
    "destinationWarehouseId": "550e8400-e29b-41d4-a716-446655440000",
    "destinationWarehouseName": "Main Warehouse",
    "notes": "Purchase order #12345",
    "createdBy": "990e8400-e29b-41d4-a716-446655440004",
    "createdByName": "John Doe",
    "items": [
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440005",
        "productId": "660e8400-e29b-41d4-a716-446655440001",
        "productName": "Product Name",
        "productSku": "PROD-001",
        "batchId": "770e8400-e29b-41d4-a716-446655440002",
        "batchNumber": "BATCH-2025-001",
        "quantity": 50,
        "reason": "Stock replenishment"
      }
    ],
    "createdAt": "2025-12-28T10:00:00Z",
    "updatedAt": "2025-12-28T10:00:00Z",
    "executedAt": null,
    "executedBy": null
  }
}
```

### Frontend Implementation Guide
1. **Movement Type Selector**: Prominent selector that changes form layout
2. **Warehouse Selectors**: Show/hide based on movement type
3. **Items Builder**: Dynamic list to add multiple items
4. **Product Autocomplete**: Search products with batch selection
5. **Batch Selection**: For EXIT/TRANSFER, show available batches with quantities
6. **Quantity Validation**: Validate against available stock for EXIT/TRANSFER
7. **Draft Saving**: Allow saving as draft (PENDING status)
8. **Execute Option**: Option to execute immediately or save as pending
9. **Confirmation Summary**: Show summary before submission

---

## POST /api/stock-movements/{id}/execute
**Summary**: Execute a pending stock movement

### Authorization
**Required Permissions**: `STOCK_MOVEMENT_EXECUTE` or `ROLE_ADMIN`

### Request
**Method**: `POST`  
**URL Parameters**: `id` (UUID) - Movement identifier

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Stock movement executed successfully",
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "movementType": "ENTRY",
    "status": "COMPLETED",
    "sourceWarehouseId": null,
    "sourceWarehouseName": null,
    "destinationWarehouseId": "550e8400-e29b-41d4-a716-446655440000",
    "destinationWarehouseName": "Main Warehouse",
    "notes": "Purchase order #12345",
    "createdBy": "990e8400-e29b-41d4-a716-446655440004",
    "createdByName": "John Doe",
    "executedBy": "990e8400-e29b-41d4-a716-446655440004",
    "executedByName": "John Doe",
    "items": [ /* ... */ ],
    "createdAt": "2025-12-28T10:00:00Z",
    "updatedAt": "2025-12-28T10:00:00Z",
    "executedAt": "2025-12-28T10:30:00Z"
  }
}
```

### Frontend Implementation Guide
1. **Execute Button**: Prominent action button for pending movements
2. **Confirmation Modal**: Show movement details before execution
3. **Stock Impact**: Display stock changes that will occur
4. **Validation**: Re-validate stock availability before execution
5. **Progress Indicator**: Show progress during execution
6. **Success Feedback**: Clear feedback on successful execution
7. **Error Handling**: Handle insufficient stock or other errors
8. **Undo Warning**: Explain that execution cannot be undone

---

## POST /api/stock-movements/{id}/cancel
**Summary**: Cancel a stock movement

### Authorization
**Required Permissions**: `STOCK_MOVEMENT_UPDATE` or `ROLE_ADMIN`

### Request
**Method**: `POST`  
**URL Parameters**: `id` (UUID) - Movement identifier

**Note**: Can only cancel PENDING movements. COMPLETED movements cannot be cancelled.

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Stock movement cancelled successfully",
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "movementType": "ENTRY",
    "status": "CANCELLED",
    // ... other fields
  }
}
```

### Frontend Implementation Guide
1. **Cancel Button**: Show only for PENDING movements
2. **Confirmation**: Require confirmation before cancellation
3. **Reason Field**: Optional reason for cancellation
4. **Audit Trail**: Record who cancelled and when
5. **Visual Distinction**: Strikethrough or gray out cancelled movements
6. **Restore Option**: Consider allowing restore of cancelled movements

---

## GET /api/stock-movements
**Summary**: Get all stock movements

### Authorization
**Required Permissions**: `STOCK_MOVEMENT_READ` or `ROLE_ADMIN`

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
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "movementType": "ENTRY",
      "status": "COMPLETED",
      "sourceWarehouseId": null,
      "sourceWarehouseName": null,
      "destinationWarehouseId": "550e8400-e29b-41d4-a716-446655440000",
      "destinationWarehouseName": "Main Warehouse",
      "notes": "Purchase order #12345",
      "createdBy": "990e8400-e29b-41d4-a716-446655440004",
      "createdByName": "John Doe",
      "executedBy": "990e8400-e29b-41d4-a716-446655440004",
      "executedByName": "John Doe",
      "items": [ /* ... */ ],
      "createdAt": "2025-12-28T10:00:00Z",
      "updatedAt": "2025-12-28T10:00:00Z",
      "executedAt": "2025-12-28T10:30:00Z"
    }
  ]
}
```

### Frontend Implementation Guide
1. **List View**: Timeline or table view of movements
2. **Status Badges**: Color-coded badges for status
3. **Type Icons**: Icons for different movement types
4. **Summary Info**: Show key details in list (type, warehouses, date)
5. **Filters**: Filter by type, status, date range, warehouse
6. **Search**: Search by notes, product, batch number
7. **Sorting**: Sort by date, type, status
8. **Pagination**: Essential for large datasets
9. **Expandable Rows**: Expand to show items without navigation

---

## GET /api/stock-movements/{id}
**Summary**: Get stock movement by ID

### Authorization
**Required Permissions**: `STOCK_MOVEMENT_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**URL Parameters**: `id` (UUID) - Movement identifier

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": {
    // Full movement object with all items
  }
}
```

### Frontend Implementation Guide
1. **Detail View**: Comprehensive movement details
2. **Header Section**: Type, status, dates, user info
3. **Warehouse Info**: Source and destination with visual flow
4. **Items Table**: All items with product details
5. **Timeline**: Show creation, execution, cancellation events
6. **Actions**: Execute, cancel, print, export
7. **Related Data**: Link to batches, products, warehouses
8. **Audit Log**: Show full audit trail

---

## GET /api/stock-movements/type/{movementType}
**Summary**: Get stock movements by type

### Authorization
**Required Permissions**: `STOCK_MOVEMENT_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**URL Parameters**: `movementType` (Enum) - `ENTRY`, `EXIT`, `TRANSFER`, `ADJUSTMENT`

### Response
Same format as GET /api/stock-movements (returns filtered array)

### Frontend Implementation Guide
1. **Type Tabs**: Tabs for each movement type
2. **Type-specific Views**: Optimize layout per type
3. **Quick Filters**: Additional filters relevant to type
4. **Type Statistics**: Show metrics per type
5. **Type Templates**: Quick create with type preselected

---

## GET /api/stock-movements/status/{status}
**Summary**: Get stock movements by status

### Authorization
**Required Permissions**: `STOCK_MOVEMENT_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**URL Parameters**: `status` (Enum) - `PENDING`, `COMPLETED`, `CANCELLED`

### Response
Same format as GET /api/stock-movements (returns filtered array)

### Frontend Implementation Guide
1. **Status Tabs**: Tabs for each status
2. **Pending Queue**: Highlight pending movements requiring action
3. **Bulk Execute**: Allow bulk execution of pending movements
4. **Status Dashboard**: Metrics per status
5. **Completed Archive**: Separate view for completed movements

---

## Frontend Component Examples

### Movement Form Wizard
```typescript
interface MovementFormProps {
  initialData?: StockMovement;
  onSubmit: (data: StockMovementRequest) => Promise<void>;
  onCancel: () => void;
}

// Steps:
// 1. Select movement type
// 2. Select warehouses (based on type)
// 3. Add items (products, batches, quantities)
// 4. Review and confirm

// Features:
// - Type-aware form layout
// - Real-time stock validation
// - Batch availability checking
// - Draft saving
// - Summary preview
```

### Movement Timeline
```typescript
interface MovementTimelineProps {
  movements: StockMovement[];
  filter?: MovementFilter;
  onSelect: (movement: StockMovement) => void;
}

// Display:
// - Chronological timeline of movements
// - Visual indicators for type and status
// - Expand/collapse for item details
// - Filter and search controls
// - Virtual scrolling for performance
```

### Movement Status Flow
```typescript
interface MovementStatusProps {
  movement: StockMovement;
  onExecute: () => void;
  onCancel: () => void;
}

// Visual Flow:
// Created → Pending → [Execute/Cancel]
// If executed → Completed (green)
// If cancelled → Cancelled (gray)
// Show timestamps and user for each stage
```

### Batch Picker for Movements
```typescript
interface BatchPickerProps {
  productId: string;
  warehouseId: string;
  requiredQuantity: number;
  onSelect: (batches: BatchSelection[]) => void;
}

// Features:
// - Show available batches with quantities
// - FEFO ordering (expiring first)
// - Multi-batch selection for partial picks
// - Visual quantity indicators
// - Expiration warnings
```

---

## Frontend Best Practices

### Movement Creation
1. **Type Selection First**: Make type selection prominent
2. **Context-aware Forms**: Show only relevant fields per type
3. **Stock Validation**: Real-time validation against availability
4. **Batch Intelligence**: Auto-suggest best batches (FEFO)
5. **Multi-item Support**: Easy add/remove items
6. **Draft Support**: Allow saving drafts
7. **Templates**: Support movement templates for common operations

### Execution Workflow
1. **Two-step Process**: Create (PENDING) then Execute (COMPLETED)
2. **Batch Processing**: Allow bulk execution
3. **Validation**: Re-validate before execution
4. **Confirmation**: Always confirm execution
5. **Feedback**: Clear success/error feedback
6. **Rollback**: Handle errors gracefully

### Status Management
1. **Visual Indicators**: Clear status badges and colors
2. **Action Buttons**: Show available actions based on status
3. **Status Transitions**: Clear visualization of status flow
4. **Audit Trail**: Track all status changes
5. **Notifications**: Alert on status changes

### Performance
1. **Pagination**: Essential for movement lists
2. **Lazy Loading**: Load items on expand
3. **Debounced Search**: Debounce search inputs
4. **Caching**: Cache recent movements
5. **Optimistic Updates**: Update UI immediately

### User Experience
1. **Quick Actions**: Shortcuts for common movements
2. **Keyboard Navigation**: Support keyboard shortcuts
3. **Mobile Support**: Mobile-friendly movement entry
4. **Barcode Scanning**: Integrate barcode scanners
5. **Error Prevention**: Validate extensively before submission

---

## Common Error Responses

### 400 Bad Request - Invalid Movement Type
```json
{
  "success": false,
  "message": "Invalid movement configuration",
  "data": {
    "error": "ENTRY movements require destination warehouse"
  }
}
```

### 400 Bad Request - Insufficient Stock
```json
{
  "success": false,
  "message": "Insufficient stock for movement",
  "data": {
    "productId": "660e8400-e29b-41d4-a716-446655440001",
    "requested": 100,
    "available": 50
  }
}
```

### 409 Conflict - Already Executed
```json
{
  "success": false,
  "message": "Movement already executed",
  "data": {
    "status": "COMPLETED",
    "executedAt": "2025-12-28T10:30:00Z"
  }
}
```

### 400 Bad Request - Cannot Cancel
```json
{
  "success": false,
  "message": "Cannot cancel completed movement",
  "data": {
    "status": "COMPLETED"
  }
}
```

---

## Integration Points

### With Batches
- Movements update batch quantities
- Batch selection for EXIT/TRANSFER
- New batch creation for ENTRY

### With Warehouses
- Validate warehouse access
- Track warehouse stock levels
- Inter-warehouse transfers

### With Products
- Product availability checking
- Product movement history
- Stock level updates

### With Reports
- Movement reports and analytics
- Stock transaction history
- Audit trails
