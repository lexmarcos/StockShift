# StockShift API Endpoint Documentation

## Overview
This directory contains comprehensive endpoint documentation for the StockShift inventory management API. Each file provides detailed instructions for AI agents developing a frontend application.

## Purpose
These documents are designed to guide AI agents in building a complete, production-ready frontend application that integrates with the StockShift backend API.

## Document Structure

Each endpoint documentation file follows this structure:
1. **Overview**: General description and base URL
2. **Endpoint Details**: For each endpoint:
   - Summary and purpose
   - Authorization requirements
   - Request format with examples
   - Response format with examples
   - Frontend Implementation Guide
3. **Component Examples**: Reusable component suggestions
4. **Best Practices**: Frontend development best practices
5. **Error Handling**: Common errors and how to handle them
6. **Integration Points**: How endpoints relate to each other

## Files

### [auth.md](auth.md)
**Authentication & Authorization**
- User login and registration
- Token management (access & refresh tokens)
- Session handling
- Tenant registration

**Key Concepts**:
- JWT Bearer token authentication
- Token refresh mechanism
- Multi-tenant architecture

---

### [products.md](products.md)
**Product Management**
- CRUD operations for products
- Product search and filtering
- Barcode and SKU lookup
- Category assignment

**Key Concepts**:
- Product attributes (dynamic JSON)
- Barcode types (EAN13, UPC, etc.)
- Product kits
- Expiration tracking

---

### [categories.md](categories.md)
**Category Management**
- Hierarchical category structure
- CRUD operations
- Parent-child relationships

**Key Concepts**:
- Tree structure management
- Recursive parent-child relationships
- Category attributes

---

### [warehouses.md](warehouses.md)
**Warehouse Management**
- Physical location management
- CRUD operations
- Active/inactive status

**Key Concepts**:
- Multi-warehouse support
- Warehouse codes
- Contact information

---

### [batches.md](batches.md)
**Batch/Stock Management**
- Stock batch tracking
- Quantity management
- Expiration date tracking
- Cost price tracking

**Key Concepts**:
- Batch numbers
- FEFO (First Expired First Out)
- Low stock alerts
- Expiring product alerts

---

### [stock-movements.md](stock-movements.md)
**Stock Movement Operations**
- Inventory transactions
- Entry, exit, transfer, adjustment
- Pending and completed movements

**Key Concepts**:
- Movement types (ENTRY, EXIT, TRANSFER, ADJUSTMENT)
- Movement status (PENDING, COMPLETED, CANCELLED)
- Two-step workflow (create → execute)
- Multi-item movements

---

### [reports.md](reports.md)
**Reporting & Analytics**
- Dashboard metrics
- Stock reports
- Low stock alerts
- Expiring products

**Key Concepts**:
- Real-time metrics
- Aggregated data
- Alert thresholds
- Data visualization

## API Base URL

```
Development: ${NEXT_PUBLIC_API_URL}
Production: [To be configured]
```

## Authentication

All endpoints except authentication endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer {accessToken}
```

## Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "message": "Optional success message",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

## Permissions

The API uses a permission-based authorization system. Each endpoint specifies required permissions.

### Permission Format
- `{RESOURCE}_{ACTION}` (e.g., `PRODUCT_CREATE`, `WAREHOUSE_READ`)
- `ROLE_ADMIN` - Full access to all resources

### Common Permissions
- **Products**: `PRODUCT_CREATE`, `PRODUCT_READ`, `PRODUCT_UPDATE`, `PRODUCT_DELETE`
- **Categories**: `CATEGORY_CREATE`, `CATEGORY_READ`, `CATEGORY_UPDATE`, `CATEGORY_DELETE`
- **Warehouses**: `WAREHOUSE_CREATE`, `WAREHOUSE_READ`, `WAREHOUSE_UPDATE`, `WAREHOUSE_DELETE`
- **Batches**: `BATCH_CREATE`, `BATCH_READ`, `BATCH_UPDATE`, `BATCH_DELETE`
- **Stock Movements**: `STOCK_MOVEMENT_CREATE`, `STOCK_MOVEMENT_READ`, `STOCK_MOVEMENT_UPDATE`, `STOCK_MOVEMENT_DELETE`, `STOCK_MOVEMENT_EXECUTE`
- **Reports**: `REPORT_READ`

## Frontend Development Guidelines

### Technology Recommendations
- **Framework**: React, Vue, or Angular
- **State Management**: Redux, Vuex, or NgRx
- **HTTP Client**: Axios or Fetch API
- **UI Components**: Material-UI, Ant Design, or Chakra UI
- **Charts**: Chart.js, Recharts, or D3.js
- **Forms**: React Hook Form, Formik, or VeeValidate

### Architecture Patterns
1. **Modular Structure**: Organize by feature/domain
2. **Service Layer**: Separate API calls from components
3. **State Management**: Centralized state with clear actions
4. **Error Handling**: Global error handler with local overrides
5. **Authentication**: Token storage and automatic refresh
6. **Routing**: Protected routes with permission checks

### Code Organization Example
```
src/
├── components/
│   ├── common/
│   ├── products/
│   ├── warehouses/
│   └── ...
├── services/
│   ├── api/
│   │   ├── auth.service.ts
│   │   ├── products.service.ts
│   │   └── ...
│   └── ...
├── store/
│   ├── auth/
│   ├── products/
│   └── ...
├── hooks/
├── utils/
├── types/
└── pages/
```

### API Service Layer Example

```typescript
// services/api/products.service.ts
import { apiClient } from './client';
import { Product, ProductRequest } from '@/types';

export const productsService = {
  getAll: async (): Promise<Product[]> => {
    const response = await apiClient.get('/api/products');
    return response.data.data;
  },
  
  getById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/api/products/${id}`);
    return response.data.data;
  },
  
  create: async (data: ProductRequest): Promise<Product> => {
    const response = await apiClient.post('/api/products', data);
    return response.data.data;
  },
  
  update: async (id: string, data: ProductRequest): Promise<Product> => {
    const response = await apiClient.put(`/api/products/${id}`, data);
    return response.data.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/products/${id}`);
  },
  
  search: async (query: string): Promise<Product[]> => {
    const response = await apiClient.get(`/api/products/search?q=${query}`);
    return response.data.data;
  }
};
```

### Authentication Setup Example

```typescript
// services/api/client.ts
import axios from 'axios';
import { authService } from './auth.service';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await authService.refresh(refreshToken);
        
        localStorage.setItem('accessToken', response.accessToken);
        originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

## Testing Recommendations

### Unit Tests
- Test service functions
- Test utility functions
- Test state management actions/reducers

### Integration Tests
- Test API integration
- Test authentication flow
- Test error handling

### E2E Tests
- Test critical user flows
- Test permission-based access
- Test multi-step operations (stock movements)

## Accessibility

Ensure the frontend application follows accessibility standards:
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Proper ARIA labels
- Color contrast ratios
- Focus indicators

## Internationalization (i18n)

Consider implementing multi-language support:
- Use i18n library (react-i18next, vue-i18n)
- Externalize all user-facing text
- Support date/time localization
- Support number/currency formatting

## Performance Optimization

### Best Practices
1. **Code Splitting**: Split code by route
2. **Lazy Loading**: Load components on demand
3. **Memoization**: Use React.memo, useMemo, useCallback
4. **Virtualization**: Virtual scrolling for large lists
5. **Debouncing**: Debounce search and filter inputs
6. **Caching**: Cache API responses with TTL
7. **Optimistic Updates**: Update UI before API confirmation
8. **Image Optimization**: Optimize and lazy load images
9. **Bundle Size**: Minimize bundle size
10. **CDN**: Serve static assets from CDN

## Security Considerations

### Frontend Security
1. **XSS Protection**: Sanitize user input
2. **CSRF Protection**: Include CSRF tokens if required
3. **Secure Storage**: Use HttpOnly cookies or secure storage for tokens
4. **Input Validation**: Validate all user input
5. **Permission Checks**: Hide/disable unauthorized actions
6. **HTTPS Only**: Enforce HTTPS in production
7. **Content Security Policy**: Implement CSP headers
8. **Dependency Security**: Regularly update dependencies

## Mobile Considerations

### Responsive Design
- Mobile-first approach
- Breakpoints for different screen sizes
- Touch-friendly UI elements
- Optimized navigation for mobile

### Progressive Web App (PWA)
Consider implementing PWA features:
- Service workers for offline support
- App manifest
- Push notifications
- Install prompts

## Browser Support

Target modern browsers:
- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## Development Workflow

### Recommended Steps
1. **Setup**: Initialize project with chosen framework
2. **Authentication**: Implement auth flow first
3. **API Services**: Create service layer for all endpoints
4. **Core Features**: Build core features (products, warehouses, batches)
5. **Stock Movements**: Implement movement workflow
6. **Reports**: Build dashboard and reports
7. **Testing**: Write tests for critical paths
8. **Optimization**: Optimize performance
9. **Accessibility**: Ensure accessibility compliance
10. **Documentation**: Document components and flows

## Support and Questions

For questions or clarifications about the API:
1. Refer to the specific endpoint documentation
2. Check the backend source code in `/src/main/java/br/com/stockshift/`
3. Review the database migrations in `/src/main/resources/db/migration/`
4. Check the implementation plan in `/docs/plans/`

## Version

**API Version**: 1.0  
**Documentation Version**: 1.0  
**Last Updated**: December 28, 2025

---

**Note for AI Agents**: These documents provide comprehensive guidance for building a production-ready frontend. Follow the patterns and best practices outlined in each file. Pay special attention to error handling, permission checks, and user experience guidelines.
