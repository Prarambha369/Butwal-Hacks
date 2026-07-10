# Cloudflare R2 Migration — Video & Media Storage

## Current State
- Images: Cloudinary (widget upload, signed URLs, transformations)
- Video: Not currently supported (Cloudinary is image-first, expensive for video)
- Goal: Migrate video storage to Cloudflare R2 (S3-compatible, zero egress fees)

## Architecture

```
Client Upload → Next.js API Route → Cloudflare R2 (via @aws-sdk/client-s3)
                                    ↓
                              Cloudflare Images (transform on-the-fly)
                              OR Cloudflare Workers (custom transforms)
```

## Prerequisites

1. **Cloudflare account** with R2 enabled
2. **R2 bucket** created (e.g., `butwal-hacks-media`)
3. **API Token** with read/write permissions

### Environment Variables

```env
# .env.local
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=butwal-hacks-media
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev  # Public bucket URL
```

## Migration Script

The migration script (`scripts/migrate-to-r2.ts`) handles:
1. Listing all Cloudinary resources by type (image/video)
2. Downloading from Cloudinary
3. Uploading to R2 with same folder structure
4. Updating database references (optional)

Run:
```bash
npx tsx scripts/migrate-to-r2.ts
```

## Upload API Route

`POST /api/upload/r2` — accepts multipart form data, uploads to R2, returns public URL.

```ts
// ponytail: Uses S3 SDK directly — no additional abstraction layer.
// Upgrade path: Add presigned URL generation for direct client uploads.
```

### Image Transformation Strategy

- Cloudinary still handles image uploads (cropping, optimization, CDN)
- **Video moves to R2** with Cloudflare Stream for playback
- Images can also be mirrored to R2 as a backup

## Rollback Plan

1. Keep Cloudinary as-is for existing images (no breaking changes)
2. New uploads go to both services during transition window
3. Set Cloudinary to read-only after migration verified
4. Cut DNS/redirect after 30-day verification period

## Budget Comparison

| Service | Storage (100GB) | Egress (100GB/mo) | Transforms |
|---------|----------------|-------------------|------------|
| Cloudinary | ~$50/mo | Included | Unlimited |
| Cloudflare R2 | ~$1.50/mo | $0 | Via Workers |
| **Savings** | **~$48/mo** | **Included** | **Pay-per-use** |
