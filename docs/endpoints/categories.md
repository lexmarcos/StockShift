# Category Endpoints

## Overview
These endpoints manage product categories in the StockShift system. Categories can be hierarchical (have parent categories).

**Base URL**: `/api/categories`  
**Authentication**: Required (Bearer token)

---

## POST /api/categories
**Summary**: Create a new category

### Authorization
**Required Permissions**: `CATEGORY_CREATE` or `ROLE_ADMIN`

### Request
**Method**: `POST`  
**Content-Type**: `application/json`

#### Request Body
```json
{
  "name": "Electronics",
  "description": "Electronic products",
  "parentId": null,
  "attributes": {
    "color": "#FF5733",
    "icon": "electronics"
  }
}
```

**Field Details**:
- `name`: Required, category name (2-100 characters)
- `description`: Optional, category description
- `parentId`: Optional, UUID of parent category (null for root categories)
- `attributes`: Optional, JSON object with custom attributes

### Response
**Status Code**: `201 CREATED`

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Electronics",
    "description": "Electronic products",
    "parentId": null,
    "parentName": null,
    "attributes": {
      "color": "#FF5733",
      "icon": "electronics"
    },
    "createdAt": "2025-12-28T10:00:00Z",
    "updatedAt": "2025-12-28T10:00:00Z"
  }
}
```

### Frontend Implementation Guide
1. **Category Form**: Create modal or page with form fields
2. **Parent Selector**: Implement tree selector or dropdown for parent category
3. **Hierarchy Preview**: Show category hierarchy in real-time
4. **Color Picker**: Use color picker for custom color attribute
5. **Icon Selector**: Provide icon library for category icons
6. **Validation**: Validate name is required and unique
7. **Circular Reference Check**: Prevent selecting child as parent

---

## GET /api/categories
**Summary**: Get all categories

### Authorization
**Required Permissions**: `CATEGORY_READ` or `ROLE_ADMIN`

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
      "name": "Electronics",
      "description": "Electronic products",
      "parentId": null,
      "parentName": null,
      "attributes": {
        "color": "#FF5733",
        "icon": "electronics"
      },
      "createdAt": "2025-12-28T10:00:00Z",
      "updatedAt": "2025-12-28T10:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Smartphones",
      "description": "Mobile phones",
      "parentId": "550e8400-e29b-41d4-a716-446655440000",
      "parentName": "Electronics",
      "attributes": {},
      "createdAt": "2025-12-28T10:00:00Z",
      "updatedAt": "2025-12-28T10:00:00Z"
    }
  ]
}
```

### Frontend Implementation Guide
1. **Tree View**: Display categories in hierarchical tree structure
2. **Flat List**: Alternative view as flat list with indentation
3. **Expand/Collapse**: Allow expanding/collapsing category branches
4. **Search**: Implement category search with hierarchy highlight
5. **Drag & Drop**: Allow reorganizing categories via drag-and-drop
6. **Actions**: Include edit, delete, add subcategory actions
7. **Product Count**: Show number of products per category
8. **Visual Hierarchy**: Use indentation, icons, or colors to show hierarchy

---

## GET /api/categories/{id}
**Summary**: Get category by ID

### Authorization
**Required Permissions**: `CATEGORY_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**URL Parameters**: `id` (UUID) - Category identifier

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Electronics",
    "description": "Electronic products",
    "parentId": null,
    "parentName": null,
    "attributes": {
      "color": "#FF5733",
      "icon": "electronics"
    },
    "createdAt": "2025-12-28T10:00:00Z",
    "updatedAt": "2025-12-28T10:00:00Z"
  }
}
```

### Frontend Implementation Guide
1. **Detail View**: Display full category information
2. **Breadcrumb**: Show category path from root
3. **Products List**: Show products in this category
4. **Subcategories**: Display immediate child categories
5. **Statistics**: Show metrics (product count, stock value)
6. **Edit Button**: Quick access to edit form

---

## GET /api/categories/parent/{parentId}
**Summary**: Get categories by parent ID

### Authorization
**Required Permissions**: `CATEGORY_READ` or `ROLE_ADMIN`

### Request
**Method**: `GET`  
**URL Parameters**: `parentId` (UUID) - Parent category identifier

**Special Case**: To get root categories (no parent), use a special endpoint or filter

### Response
Same format as GET /api/categories (returns array of child categories)

### Frontend Implementation Guide
1. **Lazy Loading**: Load child categories on demand when expanding tree
2. **Breadcrumb Navigation**: Use for navigating category hierarchy
3. **Subcategory List**: Display immediate children in category detail view
4. **Category Picker**: Build cascading dropdowns for category selection

---

## PUT /api/categories/{id}
**Summary**: Update category

### Authorization
**Required Permissions**: `CATEGORY_UPDATE` or `ROLE_ADMIN`

### Request
**Method**: `PUT`  
**URL Parameters**: `id` (UUID) - Category identifier  
**Content-Type**: `application/json`

#### Request Body
Same structure as POST /api/categories

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    // Updated category object
  }
}
```

### Frontend Implementation Guide
1. **Edit Modal**: Open modal/drawer with pre-populated form
2. **Inline Editing**: Allow inline name editing in tree view
3. **Parent Change**: Allow changing parent (with validation)
4. **Validation**: Prevent circular references
5. **Impact Warning**: Warn if category has many products
6. **Optimistic Update**: Update UI immediately, rollback on error

---

## DELETE /api/categories/{id}
**Summary**: Delete category (soft delete)

### Authorization
**Required Permissions**: `CATEGORY_DELETE` or `ROLE_ADMIN`

### Request
**Method**: `DELETE`  
**URL Parameters**: `id` (UUID) - Category identifier

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": null
}
```

### Frontend Implementation Guide
1. **Confirmation Modal**: Require confirmation before deletion
2. **Impact Check**: Show number of products and subcategories affected
3. **Subcategory Handling**: Explain what happens to subcategories
4. **Alternative Action**: Suggest moving products to another category
5. **Cascade Warning**: Warn if deleting will affect subcategories
6. **Undo Option**: Consider implementing undo functionality
7. **Error Handling**: Handle constraint errors (category has products/subcategories)

---

## Frontend Best Practices

### Tree Structure Management
```typescript
// Example category tree structure
interface CategoryTree {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  children: CategoryTree[];
  productCount: number;
  attributes: Record<string, any>;
}

// Build tree from flat array
function buildCategoryTree(categories: Category[]): CategoryTree[] {
  const map = new Map<string, CategoryTree>();
  const roots: CategoryTree[] = [];
  
  // Create map entries
  categories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [], productCount: 0 });
  });
  
  // Build hierarchy
  categories.forEach(cat => {
    const node = map.get(cat.id)!;
    if (cat.parentId === null) {
      roots.push(node);
    } else {
      const parent = map.get(cat.parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  });
  
  return roots;
}
```

### Category Selector Component
1. **Tree Dropdown**: Expandable tree in dropdown
2. **Breadcrumb Path**: Show full path in display
3. **Search**: Filter categories by name
4. **Recent/Favorites**: Quick access to frequently used categories
5. **Create New**: Allow creating new category inline

### Visual Design
1. **Colors**: Use category colors for visual coding
2. **Icons**: Display category icons consistently
3. **Indentation**: Clear visual hierarchy in lists
4. **Badges**: Show product counts as badges
5. **Depth Limit**: Limit visual depth (e.g., 3-4 levels)

### State Management
1. **Cache Tree**: Cache category tree structure
2. **Invalidation**: Refresh on create/update/delete
3. **Optimistic Updates**: Update tree immediately
4. **Expand State**: Persist expanded/collapsed state
5. **Selected State**: Track selected category across navigation

### Performance
1. **Lazy Loading**: Load subcategories on demand
2. **Virtualization**: Use virtual scrolling for large trees
3. **Debounce Search**: Debounce category search
4. **Memoization**: Memoize tree building function
5. **Pagination**: Consider pagination for very large lists

---

## Common Error Responses

### 400 Bad Request - Circular Reference
```json
{
  "success": false,
  "message": "Cannot set parent: circular reference detected",
  "data": null
}
```

### 400 Bad Request - Category Has Products
```json
{
  "success": false,
  "message": "Cannot delete category: 15 products are assigned to this category",
  "data": {
    "productCount": 15
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Category not found",
  "data": null
}
```

### 409 Conflict - Duplicate Name
```json
{
  "success": false,
  "message": "Category name already exists in this level",
  "data": null
}
```
