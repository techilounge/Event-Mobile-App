# Quick Start Guide - JWT Authentication

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Create Environment File

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Then edit `.env` and change the JWT secrets to secure random strings (at least 32 characters).

## Step 3: Start the Server

```bash
npm start
```

You should see:
```
🚀 Server is running on port 3000
📝 Environment: development
🔐 JWT Authentication enabled
```

## Step 4: Test Authentication

### Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "name": "Test User",
    "role": "attendee"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

Save the `accessToken` from the response.

### Access Protected Endpoint

```bash
curl -X GET http://localhost:3000/api/events \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## What's Protected?

All API endpoints except:
- `GET /` (health check)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Everything else requires a valid JWT token in the `Authorization` header.

## Next Steps

1. Read `README_AUTH.md` for detailed API documentation
2. Integrate authentication into your mobile app
3. Add rate limiting (recommended)
4. Migrate to a real database (PostgreSQL/MongoDB)

