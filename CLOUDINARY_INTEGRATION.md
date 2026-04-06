# Cloudinary File Upload Integration

This document describes the Cloudinary integration for file uploads in the Appify application.

## Overview

The application has been refactored to use Cloudinary for file storage instead of local filesystem storage. This provides better scalability, performance, and reliability for image uploads.

## Setup

### 1. Install Dependencies

```bash
bun add cloudinary
```

### 2. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Get these values from your [Cloudinary Dashboard](https://cloudinary.com/console).

### 3. Cloudinary Configuration

The Cloudinary configuration is automatically loaded from environment variables in `/src/lib/cloudinary.ts`.

## Features

### Image Upload

- **Automatic optimization**: Images are automatically converted to WebP format
- **Quality optimization**: Uses `quality: 'auto:good'` for optimal file size
- **Folder organization**: Images are stored in `appify/posts` folder
- **Secure URLs**: All images are served via HTTPS

### Image Management

- **Automatic cleanup**: Images are deleted from Cloudinary when posts are deleted
- **Error handling**: Graceful error handling for upload failures
- **Logging**: Comprehensive logging for monitoring and debugging

## API Endpoints

### Create Post with Image Upload

```
POST /api/posts/create
```

**Request Body:**

```json
{
  "title": "Post title",
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "visibility": "public"
}
```

**Response:**

```json
{
  "success": true,
  "post": {
    "_id": "post_id",
    "title": "Post title",
    "image": "https://res.cloudinary.com/cloud_name/image/upload/v1234567890/appify/posts/image.webp",
    "visibility": "public",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "author": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  }
}
```

### Delete Post with Image Cleanup

```
DELETE /api/posts/[id]
```

**Response:**

```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

## Utility Functions

### uploadImageToCloudinary

Uploads a base64 image to Cloudinary.

```typescript
const imageUrl = await uploadImageToCloudinary(
  base64Image,
  "appify/posts", // folder (optional)
);
```

### deletePostImage

Deletes an image from Cloudinary using its URL.

```typescript
await deletePostImage(imageUrl);
```

## Benefits of Cloudinary Integration

1. **Scalability**: No local storage limitations
2. **Performance**: CDN delivery and automatic optimization
3. **Reliability**: Enterprise-grade storage with backups
4. **Security**: HTTPS delivery and access controls
5. **Cost-effective**: Pay only for what you use
6. **Analytics**: Built-in image analytics and insights

## Migration Notes

- Previous local uploads in `/public/uploads` are no longer used
- Existing posts with local image paths will need to be migrated
- The application now stores full Cloudinary URLs instead of relative paths

## Error Handling

The integration includes comprehensive error handling:

- Upload failures return appropriate HTTP status codes
- Image deletion failures don't block post deletion
- All errors are logged for monitoring
- Graceful fallbacks for missing environment variables
