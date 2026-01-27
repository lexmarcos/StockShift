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
  "password": "userpassword",
  "captchaToken": "03AHJ_ASjnLA23KSD... (optional)"
}
```

**Field Validations**:
- `email`: Required, must be a valid email format
- `password`: Required, cannot be blank
- `captchaToken`: Optional, required when `requiresCaptcha` is true from previous attempt

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": {
    "tokenType": "Bearer",
    "expiresIn": 3600000,
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "fullName": "John Doe",
    "requiresCaptcha": false,
    "mustChangePassword": false
  }
}
```

> **Note**: `accessToken` and `refreshToken` are sent as HTTP-only cookies for security and are not included in the JSON response body.

**Response Fields**:
- `requiresCaptcha`: Indicates if captcha should be required for the next login attempt. Set to `true` when multiple login attempts are detected from the same IP address.
- `mustChangePassword`: Indicates if the user must change their password. Set to `true` for users created by an admin with a temporary password. The frontend should redirect to a password change screen when this is `true`.

### Error Response (401 Unauthorized)
```json
{
  "timestamp": "2025-01-22T10:30:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid email or password",
  "path": "/api/auth/login",
  "requiresCaptcha": true
}
```

### Rate Limiting & Captcha Logic
The system tracks login attempts per IP address using a token bucket algorithm:
- **Default capacity**: 5 attempts
- **Refill rate**: 5 tokens every 15 minutes
- **Captcha threshold**: When remaining tokens ≤ 50% of capacity (e.g., after 3 attempts with capacity=5)

When `requiresCaptcha: true` is returned, the frontend should display a captcha challenge before allowing the next login attempt.

### Frontend Implementation Guide
1. **Form Fields**: Create email and password input fields with validation
2. **Validation**: Validate email format before submission
3. **Token Storage**: Tokens are stored in HTTP-only cookies automatically by the browser
4. **Token Usage**: Cookies are sent automatically with requests (ensure `credentials: 'include'` in fetch)
5. **User Context**: Store userId, email, and fullName for user session management
6. **Error Handling**: Handle 401 (Invalid credentials), 400 (Validation errors), and 429 (Rate limit exceeded)
7. **Captcha Handling**: Check `requiresCaptcha` in both success and error responses. If `true`, show captcha before next login attempt

---

## POST /api/auth/refresh
**Summary**: Generate new access and refresh tokens using refresh token cookie

### Request
**Method**: `POST`
**Content-Type**: `application/json`
**Authentication**: Not required

**Request Body**: None

**Note**: This endpoint reads the refresh token from HTTP-only cookies automatically. No request body is needed.

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": null
}
```

> **Note**: New access and refresh tokens are set as HTTP-only cookies. The refresh token is automatically rotated for security.

### Frontend Implementation Guide
1. **Auto-Refresh**: Implement automatic token refresh before expiration (e.g., 5 minutes before)
2. **401 Handler**: On 401 responses, attempt token refresh automatically
3. **Cookie Handling**: Cookies are managed automatically by the browser
4. **Failure Handling**: On refresh failure, redirect to login page
5. **Request Queue**: Queue failed requests and retry after successful refresh

---

## POST /api/auth/logout
**Summary**: Revoke tokens and clear HTTP-only cookies

### Request
**Method**: `POST`
**Content-Type**: `application/json`
**Authentication**: Not required

**Request Body**: None

**Note**: This endpoint reads access and refresh tokens from HTTP-only cookies automatically. No request body is needed.

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

> **Note**: Both access and refresh token cookies are automatically cleared by the server.

### Frontend Implementation Guide
1. **Cookie Clearing**: Cookies are cleared automatically by the server
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
  "companyName": "My Company",
  "email": "admin@mycompany.com",
  "password": "securePassword123"
}
```

**Field Validations**:
- `companyName`: Required, cannot be blank
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters

### Response
**Status Code**: `201 CREATED`

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "businessName": "My Company",
    "userId": "660e8400-e29b-41d4-a716-446655440001",
    "userEmail": "admin@mycompany.com",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
    "tokenType": "Bearer",
    "expiresIn": 3600000
  }
}
```

### Frontend Implementation Guide
1. **Registration Form**: Create simple form with company name, email, and password
2. **Password Strength**: Implement password strength indicator (minimum 6 characters)
3. **Email Validation**: Validate email format before submission
4. **Success Flow**: After registration, user is automatically authenticated with tokens
5. **Error Handling**: Display specific validation errors per field
6. **Token Storage**: Store tokens for authenticated API calls

---

## POST /api/auth/change-password
**Summary**: Change the authenticated user's password

### Request
**Method**: `POST`
**Content-Type**: `application/json`
**Authentication**: Required (Bearer token via HTTP-only cookie)

#### Request Body
```json
{
  "currentPassword": "currentPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Field Validations**:
- `currentPassword`: Required, cannot be blank
- `newPassword`: Required, minimum 6 characters

### Response
**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

### Error Responses

**400 Bad Request** (Current password incorrect):
```json
{
  "success": false,
  "message": "Current password is incorrect",
  "data": null
}
```

**401 Unauthorized** (Not authenticated):
```json
{
  "success": false,
  "message": "Unauthorized",
  "data": null
}
```

### Frontend Implementation Guide
1. **Password Change Screen**: Create form with current password and new password fields
2. **Redirect on Login**: If `mustChangePassword` is `true` after login, redirect to this screen
3. **Validation**: Validate new password meets minimum length (6 characters)
4. **Success Flow**: After successful change, redirect to main application
5. **Error Handling**: Display specific error messages (incorrect current password, validation errors)
6. **Confirmation**: Optionally add "confirm new password" field for UX

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
