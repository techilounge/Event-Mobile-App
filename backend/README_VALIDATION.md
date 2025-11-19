# Input Validation Guide

## Overview

All API endpoints now include comprehensive input validation to ensure data integrity and security. The validation system uses `express-validator` and includes:

- **Field validation** - Type checking, length limits, format validation
- **Input sanitization** - XSS prevention
- **Error handling** - Clear, user-friendly error messages
- **Parameter validation** - ID and query parameter validation

## Validation Features

### 1. User Validation

#### Registration/Creation (`validateUser`)
- **email**: Required, valid email format, max 255 characters
- **password**: Required, min 8 characters, must contain uppercase, lowercase, and number
- **name**: Required, 2-100 characters, letters/spaces/hyphens/apostrophes only
- **role**: Optional, must be one of: `attendee`, `organizer`, `sponsor`
- **title**: Optional, max 200 characters
- **avatar**: Optional, must be valid URL

#### Updates (`validateUserUpdate`)
- All fields are optional
- Same validation rules as creation
- Password updates require the same strength rules

### 2. Event Validation (`validateEvent`)

- **title**: Required, 3-200 characters
- **description**: Optional, max 5000 characters
- **startTime**: Optional, format: `HH:MM AM/PM` (e.g., "9:00 AM")
- **endTime**: Optional, format: `HH:MM AM/PM` (e.g., "10:00 AM")
- **startDate**: Optional, ISO 8601 date format
- **endDate**: Optional, ISO 8601 date format
- **location**: Optional, max 200 characters
- **image**: Optional, must be valid URL
- **category**: Optional, max 50 characters
- **capacity**: Optional, positive integer
- **price**: Optional, non-negative number
- **status**: Optional, one of: `draft`, `published`, `cancelled`, `completed`

### 3. Announcement Validation (`validateAnnouncement`)

- **title**: Required, 3-200 characters
- **description**: Optional, max 2000 characters
- **content**: Optional, max 10000 characters
- **image**: Optional, must be valid URL
- **priority**: Optional, one of: `low`, `medium`, `high`, `urgent`
- **targetAudience**: Optional, array containing: `all`, `attendees`, `organizers`, `sponsors`
- **isActive**: Optional, boolean

### 4. Community Post Validation (`validateCommunityPost`)

- **title**: Required, 3-200 characters
- **content**: Optional, max 5000 characters
- **time**: Optional, format: `HH:MM AM/PM`
- **icon**: Optional, max 50 characters
- **user**: Optional, object
- **user.avatar**: Optional, must be valid URL
- **tags**: Optional, array of strings (max 30 chars each)

### 5. ID Parameter Validation (`validateId`)

- **id**: Must be a positive integer (route parameter)

### 6. Pagination Validation (`validatePagination`)

- **page**: Optional, positive integer (query parameter)
- **limit**: Optional, integer between 1 and 100 (query parameter)

## Error Response Format

When validation fails, the API returns a `400 Bad Request` with the following format:

```json
{
  "error": "Validation failed",
  "message": "Please check your input and try again",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long",
      "value": "short"
    }
  ]
}
```

## Examples

### Valid User Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe",
    "role": "attendee"
  }'
```

### Invalid User Registration (Validation Errors)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "weak",
    "name": "A"
  }'
```

**Response:**
```json
{
  "error": "Validation failed",
  "message": "Please check your input and try again",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long",
      "value": "weak"
    },
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "value": "weak"
    },
    {
      "field": "name",
      "message": "Name must be between 2 and 100 characters",
      "value": "A"
    }
  ]
}
```

### Valid Event Creation

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tech Summit 2024",
    "description": "Annual technology conference",
    "startTime": "9:00 AM",
    "endTime": "5:00 PM",
    "location": "San Francisco, CA",
    "capacity": 500,
    "price": 99.99,
    "status": "published"
  }'
```

### Invalid Event Creation

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AB",
    "startTime": "25:00",
    "capacity": -10,
    "price": -5
  }'
```

**Response:**
```json
{
  "error": "Validation failed",
  "message": "Please check your input and try again",
  "errors": [
    {
      "field": "title",
      "message": "Event title must be between 3 and 200 characters",
      "value": "AB"
    },
    {
      "field": "startTime",
      "message": "Start time must be in format: HH:MM AM/PM",
      "value": "25:00"
    },
    {
      "field": "capacity",
      "message": "Capacity must be a positive integer",
      "value": -10
    },
    {
      "field": "price",
      "message": "Price must be a non-negative number",
      "value": -5
    }
  ]
}
```

### Invalid ID Parameter

```bash
curl -X GET http://localhost:3000/api/events/abc \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "error": "Validation failed",
  "message": "Please check your input and try again",
  "errors": [
    {
      "field": "id",
      "message": "ID must be a positive integer",
      "value": "abc"
    }
  ]
}
```

## Input Sanitization

All inputs are automatically sanitized to prevent XSS attacks:

- **Script tags** are removed from strings
- **Whitespace** is trimmed
- **Email addresses** are normalized
- **Nested objects** are recursively sanitized

## Validation Rules Summary

| Field Type | Rules |
|------------|-------|
| **Email** | Valid format, normalized, max 255 chars |
| **Password** | Min 8 chars, uppercase + lowercase + number |
| **Name** | 2-100 chars, letters/spaces/hyphens/apostrophes |
| **Title** | 3-200 chars (required for events/posts/announcements) |
| **URL** | Valid URL format |
| **Time** | Format: `HH:MM AM/PM` |
| **Date** | ISO 8601 format |
| **Integer** | Positive integer (for IDs, capacity, etc.) |
| **Number** | Non-negative number (for price) |
| **Boolean** | true/false |
| **Array** | Valid array with validated items |
| **ID** | Positive integer |

## Best Practices

1. **Always validate on the client side** for better UX, but never trust client-side validation alone
2. **Handle validation errors gracefully** in your frontend/mobile app
3. **Display specific error messages** to help users fix their input
4. **Use appropriate HTTP status codes** (400 for validation errors)
5. **Sanitize all user input** before storing in database

## Testing Validation

You can test validation using:

1. **Postman/Thunder Client**: Create requests with invalid data
2. **cURL**: Use the examples above
3. **Unit Tests**: Test validation middleware directly
4. **Integration Tests**: Test full request/response cycle

## Custom Validation

To add custom validation rules, edit `backend/middleware/validation.js`:

```javascript
// Example: Custom validation
body('customField')
  .custom((value) => {
    // Your custom validation logic
    if (value === 'forbidden') {
      throw new Error('This value is not allowed');
    }
    return true;
  })
  .withMessage('Custom error message'),
```

## Security Notes

- ✅ All user input is validated before processing
- ✅ XSS prevention through input sanitization
- ✅ SQL injection prevention (when using parameterized queries with a real database)
- ✅ Type checking prevents type confusion attacks
- ✅ Length limits prevent DoS attacks from large payloads
- ✅ Email normalization prevents duplicate accounts with similar emails

## Next Steps

1. ✅ Input validation - **COMPLETED**
2. ⏳ Add rate limiting
3. ⏳ Add request size limits
4. ⏳ Add file upload validation (when implementing file uploads)
5. ⏳ Add custom business logic validation

