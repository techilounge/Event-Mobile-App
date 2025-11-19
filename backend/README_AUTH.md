# JWT Authentication Guide

## Overview

This backend now includes a complete JWT (JSON Web Token) authentication system with the following features:

- User registration with password hashing
- User login with JWT token generation
- Token refresh mechanism
- Protected routes with role-based access control
- Secure password storage using bcrypt

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this-in-production-min-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration (comma-separated origins)
CORS_ORIGIN=http://localhost:3000,http://localhost:19006
```

**⚠️ IMPORTANT**: Change the JWT secrets in production! Use a strong, random string (at least 32 characters).

### 3. Start the Server

```bash
npm start
```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "role": "attendee"  // Optional: "attendee", "organizer", or "sponsor"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "attendee",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "attendee"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout
```http
POST /api/auth/logout
```

**Response:**
```json
{
  "message": "Logout successful",
  "note": "Please delete the tokens on the client side."
}
```

### Protected Endpoints (Authentication Required)

All protected endpoints require an `Authorization` header:

```http
Authorization: Bearer <accessToken>
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "attendee"
  }
}
```

## Using Authentication in Requests

### Example with cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'

# Get Events (Protected)
curl -X GET http://localhost:3000/api/events \
  -H "Authorization: Bearer <accessToken>"
```

### Example with JavaScript (Fetch)

```javascript
// Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123',
  }),
});

const { accessToken, refreshToken } = await loginResponse.json();

// Store tokens (use secure storage in production)
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// Make authenticated request
const eventsResponse = await fetch('http://localhost:3000/api/events', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});

const events = await eventsResponse.json();
```

## Role-Based Access Control

The system supports three roles:

- **attendee**: Default role, can view and create community posts
- **organizer**: Can create/edit/delete events and announcements
- **sponsor**: Similar to attendee with additional sponsor features

### Role Protection Examples

```javascript
// Only organizers can create events
app.post('/api/events', authenticateToken, requireRole('organizer'), ...);

// Users can only update their own profile
app.put('/api/users/:id', authenticateToken, (req, res) => {
  if (req.user.id !== userId && req.user.role !== 'organizer') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  // ...
});
```

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt (10 salt rounds)
2. **JWT Tokens**: Secure token-based authentication
3. **Token Expiration**: Access tokens expire in 15 minutes (configurable)
4. **Refresh Tokens**: Long-lived refresh tokens (7 days) for seamless user experience
5. **Input Validation**: All inputs are validated using express-validator
6. **Password Exclusion**: Passwords are never returned in API responses

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Access denied",
  "message": "No token provided. Please include a valid JWT token in the Authorization header."
}
```

### 403 Forbidden
```json
{
  "error": "Invalid or expired token",
  "message": "Your session has expired or the token is invalid. Please login again."
}
```

### 400 Bad Request (Validation Error)
```json
{
  "error": "Validation failed",
  "errors": [
    {
      "msg": "Password must be at least 8 characters long",
      "param": "password",
      "location": "body"
    }
  ]
}
```

## Migration Notes

### Existing Users

If you have existing users in your `db.json` file without passwords, they will need to:

1. Use the password reset flow (to be implemented), OR
2. Be recreated through the registration endpoint

The login endpoint will reject users without passwords for security.

## Next Steps

1. ✅ JWT Authentication - **COMPLETED**
2. ⏳ Add rate limiting
3. ⏳ Add password reset functionality
4. ⏳ Migrate to a real database (PostgreSQL/MongoDB)
5. ⏳ Add email verification
6. ⏳ Add social login (Google, Apple, Facebook)

## Testing

You can test the authentication using:

1. **Postman**: Import the endpoints and test with the Authorization header
2. **cURL**: Use the examples above
3. **Thunder Client** (VS Code extension)
4. **REST Client** (VS Code extension)

## Troubleshooting

### "JWT_SECRET is not defined"
- Make sure you have a `.env` file in the `backend` directory
- Check that `dotenv` is loaded at the top of `index.js`

### "Invalid or expired token"
- Check that the token hasn't expired (default: 15 minutes)
- Verify the token is being sent correctly in the Authorization header
- Make sure the JWT_SECRET matches between token generation and verification

### "User already exists"
- The email address is already registered
- Use the login endpoint instead

### "Invalid credentials"
- Check that the email and password are correct
- Verify the user exists in the database
- Ensure the password was hashed during registration

