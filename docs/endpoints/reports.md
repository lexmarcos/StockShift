# Report Endpoints

## Overview
These endpoints provide dashboard summaries, stock reports, and analytics for the StockShift system.

**Base URL**: `/api/reports`  
**Authentication**: Required (Bearer token)

---

## GET /api/reports/dashboard
**Summary**: Get dashboard summary with key metrics

### Authorization
**Required Permissions**: `REPORT_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": {
    "totalProducts": 150,
    "activeProducts": 142,
    "totalWarehouses": 3,
    "activeWarehouses": 3,
    "totalBatches": 287,
    "totalStockValue": 125430.50,
    "lowStockCount": 12,
    "expiringCount": 8,
    "recentMovements": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "movementType": "ENTRY",
        "status": "COMPLETED",
        "createdAt": "2025-12-28T10:00:00Z",
        "productCount": 5,
        "notes": "Purchase order #12345"
      }
    ],
    "stockByWarehouse": [
      {
        "warehouseId": "550e8400-e29b-41d4-a716-446655440000",
        "warehouseName": "Main Warehouse",
        "batchCount": 150,
        "stockValue": 75200.00,
        "productCount": 89
      }
    ],
    "stockByCategory": [
      {
        "categoryId": "660e8400-e29b-41d4-a716-446655440001",
        "categoryName": "Electronics",
        "batchCount": 45,
        "stockValue": 35000.00,
        "productCount": 25
      }
    ],
    "movementStats": {
      "today": {
        "entries": 5,
        "exits": 3,
        "transfers": 2,
        "adjustments": 1
      },
      "thisWeek": {
        "entries": 23,
        "exits": 18,
        "transfers": 7,
        "adjustments": 4
      },
      "thisMonth": {
        "entries": 95,
        "exits": 78,
        "transfers": 25,
        "adjustments": 12
      }
    }
  }
}
```

### Frontend Implementation Guide
1. **KPI Cards**: Display key metrics in cards (total products, stock value, etc.)
2. **Warehouse Chart**: Pie or bar chart for stock by warehouse
3. **Category Chart**: Donut chart for stock by category
4. **Recent Movements**: Timeline or list of recent movements
5. **Alerts Widget**: Highlight low stock and expiring items
6. **Movement Stats**: Trend charts for movements over time
7. **Quick Actions**: Buttons for common tasks (new movement, view reports)
8. **Refresh**: Auto-refresh dashboard data periodically
9. **Responsive Layout**: Optimize for different screen sizes
10. **Drill-down**: Allow clicking metrics to see details

---

## GET /api/reports/stock
**Summary**: Get complete stock report

### Authorization
**Required Permissions**: `REPORT_READ` or `ROLE_ADMIN`

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
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "productName": "Product Name",
      "productSku": "PROD-001",
      "categoryId": "660e8400-e29b-41d4-a716-446655440001",
      "categoryName": "Electronics",
      "totalQuantity": 250,
      "totalValue": 2625.00,
      "averageCostPrice": 10.50,
      "batchCount": 5,
      "warehouseCount": 2,
      "oldestExpirationDate": "2026-03-15",
      "newestExpirationDate": "2027-12-31",
      "warehouses": [
        {
          "warehouseId": "770e8400-e29b-41d4-a716-446655440002",
          "warehouseName": "Main Warehouse",
          "warehouseCode": "WH-001",
          "quantity": 150,
          "batchCount": 3
        },
        {
          "warehouseId": "880e8400-e29b-41d4-a716-446655440003",
          "warehouseName": "Secondary Warehouse",
          "warehouseCode": "WH-002",
          "quantity": 100,
          "batchCount": 2
        }
      ],
      "batches": [
        {
          "batchId": "990e8400-e29b-41d4-a716-446655440004",
          "batchNumber": "BATCH-2025-001",
          "warehouseName": "Main Warehouse",
          "quantity": 80,
          "expirationDate": "2026-03-15",
          "costPrice": 10.50
        }
      ]
    }
  ]
}
```

### Frontend Implementation Guide
1. **Comprehensive Table**: Display all stock data in sortable table
2. **Expandable Rows**: Expand to show warehouse/batch details
3. **Export Options**: Export to CSV, Excel, PDF
4. **Print View**: Optimized print layout
5. **Filters**: Filter by category, warehouse, stock level
6. **Search**: Full-text search across products
7. **Aggregations**: Show totals at bottom (quantity, value)
8. **Visualization**: Charts for top products, categories
9. **Stock Levels**: Visual indicators (bars, gauges)
10. **Drill-down**: Link to product details

---

## GET /api/reports/stock/low-stock
**Summary**: Get low stock report

### Authorization
**Required Permissions**: `REPORT_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**Query Parameters**:
- `threshold` (Integer, default: 10) - Quantity threshold
- `limit` (Integer, optional) - Maximum results to return

**Example**: `/api/reports/stock/low-stock?threshold=20&limit=50`

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "productName": "Product Name",
      "productSku": "PROD-001",
      "categoryId": "660e8400-e29b-41d4-a716-446655440001",
      "categoryName": "Electronics",
      "totalQuantity": 8,
      "totalValue": 84.00,
      "averageCostPrice": 10.50,
      "batchCount": 2,
      "warehouseCount": 1,
      "oldestExpirationDate": "2026-03-15",
      "newestExpirationDate": null,
      "warehouses": [
        {
          "warehouseId": "770e8400-e29b-41d4-a716-446655440002",
          "warehouseName": "Main Warehouse",
          "warehouseCode": "WH-001",
          "quantity": 8,
          "batchCount": 2
        }
      ],
      "batches": [
        {
          "batchId": "990e8400-e29b-41d4-a716-446655440004",
          "batchNumber": "BATCH-2025-001",
          "warehouseName": "Main Warehouse",
          "quantity": 5,
          "expirationDate": "2026-03-15",
          "costPrice": 10.50
        }
      ]
    }
  ]
}
```

### Frontend Implementation Guide
1. **Alert Dashboard**: Prominent display of low stock items
2. **Urgency Levels**: Color-coded by severity (critical, warning)
3. **Reorder Actions**: Quick buttons to create purchase orders
4. **Threshold Settings**: Allow customizing threshold per product
5. **Notification**: Email/push notifications for low stock
6. **History**: Track when products went low and were restocked
7. **Supplier Info**: Show supplier info for quick reordering
8. **Trend Analysis**: Show historical stock levels
9. **Forecast**: Predict when stock will run out
10. **Export**: Export to CSV for procurement

---

## GET /api/reports/stock/expiring
**Summary**: Get expiring products report

### Authorization
**Required Permissions**: `REPORT_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**Query Parameters**:
- `daysAhead` (Integer, default: 30) - Days to look ahead
- `limit` (Integer, optional) - Maximum results to return

**Example**: `/api/reports/stock/expiring?daysAhead=60&limit=100`

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "productName": "Product Name",
      "productSku": "PROD-001",
      "categoryId": "660e8400-e29b-41d4-a716-446655440001",
      "categoryName": "Food Items",
      "totalQuantity": 45,
      "totalValue": 472.50,
      "averageCostPrice": 10.50,
      "batchCount": 3,
      "warehouseCount": 2,
      "oldestExpirationDate": "2026-01-15",
      "newestExpirationDate": "2026-02-28",
      "warehouses": [
        {
          "warehouseId": "770e8400-e29b-41d4-a716-446655440002",
          "warehouseName": "Main Warehouse",
          "warehouseCode": "WH-001",
          "quantity": 30,
          "batchCount": 2
        }
      ],
      "batches": [
        {
          "batchId": "990e8400-e29b-41d4-a716-446655440004",
          "batchNumber": "BATCH-2025-001",
          "warehouseName": "Main Warehouse",
          "quantity": 15,
          "expirationDate": "2026-01-15",
          "costPrice": 10.50,
          "daysUntilExpiration": 18
        },
        {
          "batchId": "aa0e8400-e29b-41d4-a716-446655440005",
          "batchNumber": "BATCH-2025-002",
          "warehouseName": "Main Warehouse",
          "quantity": 15,
          "expirationDate": "2026-01-20",
          "costPrice": 10.50,
          "daysUntilExpiration": 23
        }
      ]
    }
  ]
}
```

### Frontend Implementation Guide
1. **Expiration Dashboard**: Dedicated view for expiring products
2. **Urgency Indicators**: Color coding by days until expiration
3. **Time Filters**: Quick filters (7, 15, 30, 60, 90 days)
4. **Action Buttons**: 
   - Mark for discount/clearance
   - Create transfer movement
   - Mark as waste
5. **Notification System**: Alert users of soon-to-expire items
6. **Calendar View**: Calendar showing expiration dates
7. **FEFO Enforcement**: Highlight when wrong batches are being used
8. **Loss Prevention**: Calculate potential losses
9. **Disposal Tracking**: Track disposed expired items
10. **Trend Analysis**: Historical expiration patterns

---

## Frontend Component Examples

### Dashboard Widget
```typescript
interface DashboardProps {
  data: DashboardResponse;
  onRefresh: () => void;
  loading: boolean;
}

// Sections:
// 1. KPI Cards (4-6 key metrics)
// 2. Charts (stock distribution, movement trends)
// 3. Alerts (low stock, expiring)
// 4. Recent Activity
// 5. Quick Actions
```

### Stock Report Table
```typescript
interface StockReportTableProps {
  data: StockReportResponse[];
  loading: boolean;
  onExport: (format: 'csv' | 'excel' | 'pdf') => void;
}

// Features:
// - Multi-level sorting
// - Expandable rows for warehouse/batch details
// - Column visibility toggles
// - Inline filters
// - Aggregated totals
// - Export functionality
```

### Alert Widgets
```typescript
interface AlertWidgetProps {
  type: 'low-stock' | 'expiring';
  threshold?: number;
  daysAhead?: number;
  maxItems?: number;
}

// Display:
// - Count of alerts
// - Top N critical items
// - Quick action buttons
// - View all link
// - Auto-refresh
```

### Stock Level Gauge
```typescript
interface StockGaugeProps {
  current: number;
  minimum: number;
  optimal: number;
  maximum: number;
  label: string;
}

// Visualization:
// - Gauge or bar showing current level
// - Color zones (red, yellow, green)
// - Threshold indicators
// - Percentage display
```

---

## Frontend Best Practices

### Dashboard Design
1. **Information Hierarchy**: Most important metrics at top
2. **Visual Design**: Use charts, colors, icons effectively
3. **Interactivity**: Make widgets clickable for details
4. **Responsiveness**: Adapt layout for different screens
5. **Performance**: Optimize for fast loading
6. **Refresh**: Auto-refresh at sensible intervals
7. **Customization**: Allow users to customize dashboard

### Report Generation
1. **Loading States**: Show progress for long reports
2. **Pagination**: Paginate large reports
3. **Export**: Support multiple export formats
4. **Print**: Optimize for printing
5. **Save Reports**: Allow saving report configurations
6. **Schedule**: Consider scheduled report generation
7. **Filters**: Comprehensive filtering options

### Data Visualization
1. **Chart Selection**: Choose appropriate chart types
2. **Color Scheme**: Consistent, accessible colors
3. **Legends**: Clear legends and labels
4. **Tooltips**: Informative hover tooltips
5. **Zoom/Pan**: Allow interaction with charts
6. **Responsive**: Charts adapt to screen size
7. **Accessibility**: Ensure charts are accessible

### Performance
1. **Caching**: Cache dashboard data with TTL
2. **Lazy Loading**: Load heavy reports on demand
3. **Aggregation**: Pre-aggregate data server-side
4. **Virtualization**: Virtual scrolling for large tables
5. **Debouncing**: Debounce filter changes
6. **Web Workers**: Process large datasets in workers
7. **Progressive Loading**: Load critical data first

### Alerting
1. **Thresholds**: Configurable alert thresholds
2. **Notifications**: Push/email notifications
3. **Acknowledgement**: Allow marking alerts as seen
4. **History**: Track alert history
5. **Escalation**: Escalate critical alerts
6. **Snooze**: Allow snoozing non-critical alerts
7. **Batch Actions**: Handle multiple alerts at once

---

## Common Error Responses

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Required permission: REPORT_READ",
  "data": null
}
```

### 400 Bad Request - Invalid Parameters
```json
{
  "success": false,
  "message": "Invalid parameter: daysAhead must be positive",
  "data": null
}
```

---

## Integration Points

### With Dashboard Tools
- Connect to BI tools (Power BI, Tableau)
- Export to analytics platforms
- API for custom reports

### With Notification Systems
- Email alerts for low stock
- Push notifications for critical issues
- SMS alerts for urgent situations

### With External Systems
- ERP integration
- Accounting system sync
- E-commerce platform data

### With Mobile Apps
- Mobile-optimized dashboard
- Push notifications
- Quick actions from alerts

---

## Performance Considerations

### Caching Strategy
```typescript
// Dashboard data cache: 5 minutes
// Stock report cache: 15 minutes
// Low stock/expiring cache: 10 minutes

interface CacheConfig {
  dashboard: { ttl: 300 }, // 5 minutes
  stockReport: { ttl: 900 }, // 15 minutes
  lowStock: { ttl: 600 }, // 10 minutes
  expiring: { ttl: 600 } // 10 minutes
}
```

### Optimization Tips
1. **Reduce API Calls**: Cache aggressively
2. **Pagination**: Always paginate large reports
3. **Debounce**: Debounce filter changes
4. **Progressive Enhancement**: Load critical data first
5. **Background Updates**: Update cache in background
6. **Service Workers**: Use for offline capability
7. **CDN**: Serve static chart assets from CDN

---

## Future Enhancements

### Advanced Reports
- Custom report builder
- Scheduled reports
- Report subscriptions
- Multi-tenant reporting
- Comparative analysis
- Trend forecasting

### Advanced Visualizations
- Interactive charts
- Geographic maps
- Network graphs
- Heatmaps
- Real-time updates

### Export Enhancements
- More formats (Word, PowerPoint)
- Custom templates
- Branded reports
- Automated distribution
