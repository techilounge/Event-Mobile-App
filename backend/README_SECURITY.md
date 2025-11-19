# Security Features Guide

## Overview

This backend includes comprehensive security features to protect against common attacks and abuse:

1. **Rate Limiting** - Prevents API abuse and brute force attacks
2. **Request Size Limits** - Prevents DoS attacks from large payloads
3. **File Upload Validation** - Secure file upload handling with type and size restrictions

---

## 1. Rate Limiting

Rate limiting prevents abuse by limiting the number of requests a client can make within a specific time window.

### Rate Limiters

#### General API Rate Limiter
- **Window**: 15 minutes
- **Max Requests**: 100 per IP (configurable via `RATE_LIMIT_MAX`)
- **Applies to**: All `/api/*` endpoints
- **Purpose**: General API protection

#### Authentication Rate Limiter
- **Window**: 15 minutes
- **Max Requests**: 5 per IP (configurable via `AUTH_RATE_LIMIT_MAX`)
- **Applies to**: `/api/auth/*` endpoints
- **Purpose**: Prevents brute force attacks on login/registration
- **Special**: Doesn't count successful requests

#### File Upload Rate Limiter
- **Window**: 1 hour
- **Max Requests**: 10 per IP (configurable via `UPLOAD_RATE_LIMIT_MAX`)
- **Applies to**: `/api/uploads/*` endpoints
- **Purpose**: Prevents abuse of file upload functionality

#### Password Reset Rate Limiter
- **Window**: 1 hour
- **Max Requests**: 3 per IP (configurable via `PASSWORD_RESET_LIMIT_MAX`)
- **Purpose**: Prevents abuse of password reset functionality

### Rate Limit Response

When rate limit is exceeded:

```json
{
  "error": "Too many requests",
  "message": "Too many requests from this IP, please try again later.",
  "retryAfter": "15 minutes"
}
```

**HTTP Status**: `429 Too Many Requests`

**Headers**:
- `RateLimit-Limit`: Maximum number of requests
- `RateLimit-Remaining`: Remaining requests in current window
- `RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)

### Configuration

Set in `.env` file:

```env
RATE_LIMIT_MAX=100          # General API limit
AUTH_RATE_LIMIT_MAX=5       # Auth endpoints limit
UPLOAD_RATE_LIMIT_MAX=10    # File upload limit
PASSWORD_RESET_LIMIT_MAX=3  # Password reset limit
```

### Testing Rate Limits

```bash
# Make multiple requests quickly to trigger rate limit
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}'
  echo ""
done
```

After 5 failed attempts, you'll receive a 429 response.

---

## 2. Request Size Limits

Request size limits prevent DoS attacks by limiting the size of request bodies.

### Configuration

- **Default Limit**: 10MB (configurable via `MAX_REQUEST_SIZE`)
- **Applies to**: All JSON and URL-encoded request bodies
- **Purpose**: Prevents memory exhaustion from large payloads

### Configuration

Set in `.env` file:

```env
MAX_REQUEST_SIZE=10mb
```

Supported formats: `kb`, `mb`, `gb` (e.g., `5mb`, `100kb`)

### Error Response

When request size is exceeded:

```json
{
  "error": "Payload too large",
  "message": "Request entity too large"
}
```

**HTTP Status**: `413 Payload Too Large`

### Testing Request Size Limits

```bash
# Create a large JSON payload (over 10MB)
node -e "console.log(JSON.stringify({data: 'x'.repeat(11*1024*1024)}))" | \
  curl -X POST http://localhost:3000/api/events \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    --data @-
```

---

## 3. File Upload Validation

Secure file upload handling with type validation, size limits, and organized storage.

### Supported File Types

#### Images
- JPEG/JPG (`image/jpeg`, `image/jpg`)
- PNG (`image/png`)
- GIF (`image/gif`)
- WebP (`image/webp`)
- **Max Size**: 5MB per file

#### Documents
- PDF (`application/pdf`)
- Word Documents (`.doc`, `.docx`)
- Text Files (`.txt`)
- Excel Files (`.xls`, `.xlsx`)
- **Max Size**: 10MB per file

### File Upload Endpoints

#### Upload Single Image
```http
POST /api/uploads/image
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
  image: <file>
```

**Response:**
```json
{
  "message": "Image uploaded successfully",
  "file": {
    "filename": "profile-1234567890-987654321.jpg",
    "originalName": "profile.jpg",
    "mimetype": "image/jpeg",
    "size": 245678,
    "url": "http://localhost:3000/uploads/images/profile-1234567890-987654321.jpg",
    "path": "/path/to/uploads/images/profile-1234567890-987654321.jpg"
  }
}
```

#### Upload Multiple Images
```http
POST /api/uploads/images
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
  images: <file1>, <file2>, ... (up to 10 files)
```

#### Upload Document
```http
POST /api/uploads/document
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
  document: <file>
```

#### Upload Image or Document
```http
POST /api/uploads/file
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
  file: <file>
```

#### Delete File
```http
DELETE /api/uploads/:filename
Authorization: Bearer <token>
Role: organizer
```

### File Storage

Files are organized in the `uploads/` directory:

```
uploads/
├── images/          # Image files
├── documents/       # Document files
└── others/          # Other file types
```

Files are renamed with a unique identifier:
- Format: `originalname-timestamp-random.ext`
- Example: `profile-1234567890-987654321.jpg`

### File Upload Validation Rules

1. **File Type Validation**: Only allowed MIME types are accepted
2. **File Size Limits**: Enforced per file type
3. **File Count Limits**: Maximum number of files per request
4. **Filename Sanitization**: Dangerous characters removed
5. **Unique Filenames**: Prevents overwriting existing files

### Error Responses

#### Invalid File Type
```json
{
  "error": "File upload error",
  "message": "Invalid file type. Only image/jpeg, image/jpg, image/png, image/gif, image/webp are allowed for images."
}
```

#### File Too Large
```json
{
  "error": "File too large",
  "message": "File size exceeds the maximum allowed size."
}
```

#### Too Many Files
```json
{
  "error": "Too many files",
  "message": "Maximum number of files exceeded."
}
```

#### No File Uploaded
```json
{
  "error": "No file uploaded",
  "message": "Please upload a file."
}
```

### Testing File Uploads

#### Using cURL

```bash
# Upload an image
curl -X POST http://localhost:3000/api/uploads/image \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/image.jpg"

# Upload multiple images
curl -X POST http://localhost:3000/api/uploads/images \
  -H "Authorization: Bearer <token>" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

#### Using JavaScript (FormData)

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/uploads/image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});

const result = await response.json();
console.log(result);
```

#### Using Postman

1. Set method to `POST`
2. URL: `http://localhost:3000/api/uploads/image`
3. Headers: `Authorization: Bearer <token>`
4. Body: Select `form-data`
5. Key: `image`, Type: `File`, Value: Select file

### Security Features

1. **MIME Type Validation**: Prevents file type spoofing
2. **File Size Limits**: Prevents DoS attacks
3. **Filename Sanitization**: Prevents path traversal attacks
4. **Unique Filenames**: Prevents file overwriting
5. **Organized Storage**: Files organized by type
6. **Rate Limiting**: Prevents upload abuse
7. **Authentication Required**: Only authenticated users can upload
8. **Role-Based Deletion**: Only organizers can delete files

---

## Security Best Practices

### 1. Rate Limiting
- ✅ Configure appropriate limits for your use case
- ✅ Use stricter limits for authentication endpoints
- ✅ Monitor rate limit violations for potential attacks
- ✅ Consider using Redis for distributed rate limiting in production

### 2. Request Size Limits
- ✅ Set limits appropriate for your use case
- ✅ Consider different limits for different endpoints
- ✅ Monitor for 413 errors (may indicate attacks)

### 3. File Uploads
- ✅ Always validate file types (MIME type, not just extension)
- ✅ Enforce file size limits
- ✅ Scan uploaded files for viruses (consider adding ClamAV)
- ✅ Store files outside web root when possible
- ✅ Use CDN for file serving in production
- ✅ Implement file cleanup for unused files
- ✅ Consider using cloud storage (S3, Cloudinary) in production

### 4. General Security
- ✅ Keep dependencies updated
- ✅ Use environment variables for configuration
- ✅ Never commit `.env` file
- ✅ Use HTTPS in production
- ✅ Implement CORS properly
- ✅ Log security events
- ✅ Monitor for suspicious activity

---

## Environment Variables

Add these to your `.env` file:

```env
# Rate Limiting
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5
UPLOAD_RATE_LIMIT_MAX=10
PASSWORD_RESET_LIMIT_MAX=3

# Request Size
MAX_REQUEST_SIZE=10mb

# Base URL (for file URLs)
BASE_URL=http://localhost:3000
```

---

## Monitoring

### Rate Limit Headers

Check rate limit status in response headers:

```http
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1234567890
```

### Logging

Rate limit violations are logged. Monitor for:
- Frequent 429 responses from same IP
- Sudden spikes in rate limit violations
- Patterns indicating automated attacks

---

## Production Considerations

### Rate Limiting
- Use Redis for distributed rate limiting across multiple servers
- Consider using a service like Cloudflare for DDoS protection
- Implement IP whitelisting for trusted sources

### File Uploads
- Use cloud storage (AWS S3, Cloudinary, etc.) instead of local storage
- Implement virus scanning
- Add image processing/optimization
- Implement CDN for file delivery
- Set up automated cleanup for old files

### Request Size
- Adjust limits based on actual use cases
- Consider different limits for different endpoints
- Monitor server memory usage

---

## Troubleshooting

### Rate Limit Issues

**Problem**: Legitimate users hitting rate limits
**Solution**: Increase limits in `.env` or implement user-based rate limiting

**Problem**: Rate limits not working
**Solution**: Check that `express-rate-limit` is installed and middleware is applied

### File Upload Issues

**Problem**: "File too large" error
**Solution**: Increase `MAX_IMAGE_SIZE` or `MAX_DOCUMENT_SIZE` in `middleware/fileUpload.js`

**Problem**: "Invalid file type" error
**Solution**: Check file MIME type, ensure it's in the allowed list

**Problem**: Files not saving
**Solution**: Check `uploads/` directory permissions, ensure it's writable

### Request Size Issues

**Problem**: 413 errors on large requests
**Solution**: Increase `MAX_REQUEST_SIZE` in `.env` or split large requests

---

## Next Steps

1. ✅ Rate limiting - **COMPLETED**
2. ✅ Request size limits - **COMPLETED**
3. ✅ File upload validation - **COMPLETED**
4. ⏳ Add virus scanning for uploaded files
5. ⏳ Implement cloud storage integration
6. ⏳ Add image processing/optimization
7. ⏳ Implement file cleanup automation

