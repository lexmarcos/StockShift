# Authentication Endpoints

## Overview
These endpoints handle user authentication, registration, and session management for the StockShift system. All endpoints except authentication itself require a valid JWT Bearer token.

**Base URL**: `/api/auth`

---

## POST /api/auth/login
**Summary**: Authenticate user and return access tokens

### Request
**Method**: `POST`  
**Content-Type**: `application/json`  
**Authentication**: Not required

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Field Validations**:
- `email`: Required, must be a valid email format
- `password`: Required, cannot be blank

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
    "tokenType": "Bearer",
    "expiresIn": 3600000,
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

### Frontend Implementation Guide
1. **Form Fields**: Create email and password input fields with validation
2. **Validation**: Validate email format before submission
3. **Token Storage**: Store `accessToken` and `refreshToken` securely (localStorage/sessionStorage)
4. **Token Usage**: Include accessToken in Authorization header as `Bearer {accessToken}` for subsequent requests
5. **User Context**: Store userId, email, and fullName for user session management
6. **Error Handling**: Handle 401 (Invalid credentials) and 400 (Validation errors)

---

## POST /api/auth/refresh
**Summary**: Generate new access token using refresh token

### Request
**Method**: `POST`  
**Content-Type**: `application/json`  
**Authentication**: Not required

#### Request Body
```json
{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Field Validations**:
- `refreshToken`: Required, must be a valid UUID string

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600000
  }
}
```

### Frontend Implementation Guide
1. **Auto-Refresh**: Implement automatic token refresh before expiration (e.g., 5 minutes before)
2. **401 Handler**: On 401 responses, attempt token refresh automatically
3. **Token Update**: Update stored accessToken with new token
4. **Failure Handling**: On refresh failure, redirect to login page
5. **Request Queue**: Queue failed requests and retry after successful refresh

---

## POST /api/auth/logout
**Summary**: Revoke refresh token and logout user

### Request
**Method**: `POST`  
**Content-Type**: `application/json`  
**Authentication**: Not required (but refreshToken must be valid)

#### Request Body
```json
{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

### Frontend Implementation Guide
1. **Clear Storage**: Remove all stored tokens and user data
2. **Reset State**: Clear application state (Redux/Context)
3. **Redirect**: Navigate to login page
4. **API Call**: Always call logout endpoint before clearing local data
5. **Error Handling**: Even on error, clear local data and redirect

---

## POST /api/auth/register
**Summary**: Register new tenant with first admin user

### Request
**Method**: `POST`  
**Content-Type**: `application/json`  
**Authentication**: Not required

#### Request Body
```json
{
  "tenantName": "My Company",
  "tenantSlug": "my-company",
  "userFullName": "John Doe",
  "userEmail": "admin@mycompany.com",
  "userPassword": "securePassword123"
}
```

**Field Validations**:
- `tenantName`: Required, 2-100 characters
- `tenantSlug`: Required, 2-50 characters, lowercase, alphanumeric with hyphens
- `userFullName`: Required, 2-100 characters
- `userEmail`: Required, valid email format
- `userPassword`: Required, minimum 8 characters

### Response
**Status Code**: `201 CREATED`

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "tenantName": "My Company",
    "tenantSlug": "my-company",
    "userId": "660e8400-e29b-41d4-a716-446655440001",
    "userEmail": "admin@mycompany.com",
    "userFullName": "John Doe"
  }
}
```

### Frontend Implementation Guide
1. **Registration Form**: Create multi-step or single form with all required fields
2. **Slug Validation**: Auto-generate slug from tenant name, validate format
3. **Password Strength**: Implement password strength indicator
4. **Email Validation**: Validate email format and check availability
5. **Success Flow**: After registration, automatically log user in or redirect to login
6. **Error Handling**: Display specific validation errors per field
7. **Tenant Context**: Store tenant information for branding/customization

---

## Error Response Format
All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created (for registration)
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid credentials or token)
- `404`: Not Found
- `500`: Internal Server Error

### Frontend Error Handling Strategy
1. **Display user-friendly messages** from the `message` field
2. **Log full error details** for debugging
3. **Handle network errors** separately (timeout, no connection)
4. **Implement retry logic** for transient failures
5. **Show toast/notification** for non-critical errors
6. **Show modal/page** for critical errors (authentication)
