# Security Features - Quick Start

## Installation

```bash
cd backend
npm install
```

This will install:
- `express-rate-limit` - Rate limiting
- `multer` - File upload handling

## Environment Variables

Add these to your `.env` file:

```env
# Rate Limiting
RATE_LIMIT_MAX=100              # General API: 100 requests per 15 minutes
AUTH_RATE_LIMIT_MAX=5           # Auth endpoints: 5 requests per 15 minutes
UPLOAD_RATE_LIMIT_MAX=10        # File uploads: 10 requests per hour

# Request Size Limits
MAX_REQUEST_SIZE=10mb            # Maximum request body size

# Base URL (for file URLs)
BASE_URL=http://localhost:3000
```

## What's Protected

### Rate Limiting
- ✅ All `/api/*` endpoints: 100 requests per 15 minutes
- ✅ `/api/auth/*` endpoints: 5 requests per 15 minutes (prevents brute force)
- ✅ `/api/uploads/*` endpoints: 10 requests per hour

### Request Size Limits
- ✅ All JSON/URL-encoded requests: 10MB maximum

### File Uploads
- ✅ Image uploads: 5MB max, JPEG/PNG/GIF/WebP only
- ✅ Document uploads: 10MB max, PDF/Word/Excel/Text only
- ✅ Rate limited: 10 uploads per hour per IP
- ✅ Authentication required
- ✅ Files stored in `uploads/` directory

## Testing

### Test Rate Limiting
```bash
# Make 6 login attempts quickly (5 is the limit)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
```

### Test File Upload
```bash
# Upload an image
curl -X POST http://localhost:3000/api/uploads/image \
  -H "Authorization: Bearer <your-token>" \
  -F "image=@/path/to/image.jpg"
```

### Test Request Size Limit
```bash
# Try to send a request larger than 10MB
# You'll get a 413 Payload Too Large error
```

## File Upload Endpoints

- `POST /api/uploads/image` - Upload single image
- `POST /api/uploads/images` - Upload multiple images (up to 10)
- `POST /api/uploads/document` - Upload document
- `POST /api/uploads/file` - Upload image or document
- `DELETE /api/uploads/:filename` - Delete file (organizer only)

## Error Responses

### Rate Limit Exceeded (429)
```json
{
  "error": "Too many requests",
  "message": "Too many requests from this IP, please try again later.",
  "retryAfter": "15 minutes"
}
```

### File Too Large (400)
```json
{
  "error": "File too large",
  "message": "File size exceeds the maximum allowed size."
}
```

### Invalid File Type (400)
```json
{
  "error": "File upload error",
  "message": "Invalid file type. Only image/jpeg, image/jpg, image/png, image/gif, image/webp are allowed for images."
}
```

## Documentation

- **Full Security Guide**: See `README_SECURITY.md`
- **Validation Guide**: See `README_VALIDATION.md`
- **Authentication Guide**: See `README_AUTH.md`

## Next Steps

1. ✅ Rate limiting - **DONE**
2. ✅ Request size limits - **DONE**
3. ✅ File upload validation - **DONE**
4. Configure limits in `.env` based on your needs
5. Test all security features
6. Monitor for rate limit violations

