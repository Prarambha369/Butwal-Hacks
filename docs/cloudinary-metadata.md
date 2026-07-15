# Cloudinary Structured Metadata Configuration

This document describes the structured metadata fields configured in Cloudinary for backend moderation, filtering, and audit-trail purposes.

---

## Overview

Every image uploaded via the `<CloudinaryUpload>` component includes structured metadata that is stored **in Cloudinary itself** — not just in Supabase. This means you can search, filter, and moderate images directly from the Cloudinary Dashboard without needing to cross-reference against the database.

---

## Metadata Fields

Create these **5 fields** in your Cloudinary Dashboard:

### 1. `entity_type`

| Property | Value |
|----------|-------|
| **Label** | Entity Type |
| **Type** | Single-selection list |
| **Values** | `avatar`, `event_banner`, `project_cover`, `blog_cover`, `gallery_photo` |

**Purpose:** Instantly filter Cloudinary to see all project covers, all avatars, etc. Useful for batch moderation (e.g., reviewing all uploaded avatars for policy compliance).

### 2. `bh_id`

| Property | Value |
|----------|-------|
| **Label** | Hacker BH-ID |
| **Type** | Text |

**Purpose:** Links an avatar or project cover directly to the ORCID-style profile (e.g. `BH-26-042`). If a user is suspended, you can easily find and blur all their uploaded images.

### 3. `event_slug`

| Property | Value |
|----------|-------|
| **Label** | Event Slug |
| **Type** | Text |

**Purpose:** Links event banners and gallery photos to a specific event (e.g. `hackday-butwal-2026`). Enables per-event image moderation.

### 4. `project_id`

| Property | Value |
|----------|-------|
| **Label** | Project UUID |
| **Type** | Text |

**Purpose:** Links a project cover image directly to its Supabase UUID.

### 5. `uploader_auth0_id`

| Property | Value |
|----------|-------|
| **Label** | Uploader Auth0 ID |
| **Type** | Text |

**Purpose:** Security and audit trail. If someone uploads inappropriate content, you instantly know which Auth0 account did it — without querying Supabase.

---

## Entity Type Reference

The `entity_type` field uses a controlled vocabulary defined in `components/cloudinary-upload.tsx`:

```typescript
export type CloudinaryEntityType =
  | "avatar"         // Profile pictures
  | "event_banner"   // Event header images
  | "project_cover"  // Project showcase images
  | "blog_cover"     // Blog post headers
  | "gallery_photo"; // Event photo gallery
```

---

## Upload Context → Metadata Mapping

Each upload point in the app passes a specific set of metadata fields:

| Upload Context | `entity_type` | `bh_id` | `event_slug` | `project_id` | `uploader_auth0_id` |
|---|---|---|---|---|---|
| Profile avatar | `avatar` | ✅ | — | — | ✅ |
| Project cover (new) | `project_cover` | ✅ | — | — | ✅ |
| Project cover (edit) | `project_cover` | ✅ | — | ✅ | ✅ |
| Event banner (new) | `event_banner` | — | — | — | ✅ |
| Certificate scan | `gallery_photo` | — | — | — | ✅ |

**Legend:** ✅ = passed; — = not applicable at upload time

> **Note:** Some fields are unavailable at creation time. For example, `project_id` doesn't exist when uploading a cover during project submission (the project is created after the upload). Similarly, `event_slug` isn't known when creating a new event. These fields are only available on **edit** flows.

---

## Code Pipeline

The metadata flows through 3 stages:

```
1. Client Component          2. API Route                   3. Cloudinary Upload
─────────────────            ──────────                    ─────────────────
CloudinaryUpload             /api/cloudinary-signature      POST to cloudinary.com
  ├─ entityType="avatar"       ├─ Parses metadata from body    ├─ formData.append("file", ...)
  ├─ bhId={bhId}               ├─ Signs + timestamp             └─ formData.append("metadata", ...)
  ├─ uploaderAuth0Id={sub}     └─ Returns { signature,        Cloudinary stores
  └─ ...                          metadata, timestamp }         structured metadata
```

### Stage 1: Component

`components/cloudinary-upload.tsx` accepts metadata props and passes them to the signature API:

```tsx
<CloudinaryUpload
  entityType="project_cover"
  bhId={bhId}
  projectId={project.id}
  uploaderAuth0Id={user?.sub}
  onUpload={(url) => setCoverImage(url)}
/>
```

### Stage 2: Signature API

`api/cloudinary-signature/route.ts` signs the metadata along with upload params:

```typescript
const metadata = JSON.stringify({ entity_type, bh_id, event_slug, project_id, uploader_auth0_id });
paramsToSign.metadata = metadataStr;
const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
return NextResponse.json({ signature, metadata: metadataStr, ... });
```

### Stage 3: Upload FormData

The metadata string is appended to the Cloudinary upload FormData:

```typescript
if (metadataStr) formData.append("metadata", metadataStr);
```

---

## Cloudinary Dashboard Setup

### Step 1: Create Metadata Fields

1. Log into the [Cloudinary Dashboard](https://console.cloudinary.com)
2. Navigate to **Settings** → **Upload**
3. Scroll to **Structured Metadata**
4. Create each of the 5 fields listed above

### Step 2: Verify

After setup, upload an image via the app and check the Cloudinary Dashboard:

1. Go to **Media Library**
2. Find the uploaded image
3. Open its details — you should see the metadata fields populated under **Metadata**

---

## Adding a New Upload Context

When adding a new `CloudinaryUpload` instance:

1. Choose the appropriate `entity_type` (add a new value to `CloudinaryEntityType` if needed)
2. Update `api/cloudinary-signature/route.ts` if the new field needs signing (it's already generic — accepts any field passed in the body)
3. Add the new entity_type value to the Cloudinary Dashboard's single-selection list
4. Pass available metadata props to `<CloudinaryUpload>`

---

## Environment Variables

The Cloudinary metadata pipeline requires:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloud name for upload URL |
| `CLOUDINARY_API_KEY` | API key for signature generation |
| `CLOUDINARY_API_SECRET` | API secret for signature generation |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Upload preset (optional) |
