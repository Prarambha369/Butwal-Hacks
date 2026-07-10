# Authentication Setup Guide for Butwal Hacks

This document explains how to set up Clerk authentication with OAuth providers for the Butwal Hacks application.

## Overview

We use Clerk for authentication which provides:
- Email/password authentication
- Social login (Google, GitHub, etc.)
- User management
- Session management
- Integration with Supabase for database access

## Initial Setup

1. Create an account at [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Get your API keys from the "API Keys" section

## Environment Variables

Update your `.env.local` file with the following variables:

```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase Configuration (for user sync)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Configuring OAuth Providers

### 1. Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Add your domain to Authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
6. Add redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`
7. Copy the Client ID and Secret

### 2. GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Homepage URL to your domain
4. Set Authorization callback URL to:
   - `http://localhost:3000/api/auth/callback/github` (development)
   - `https://yourdomain.com/api/auth/callback/github` (production)
5. Copy the Client ID and Secret

### 3. Configure in Clerk Dashboard

1. In your Clerk Dashboard, go to "OAuth & External Identities"
2. Enable the providers you want to use (Google, GitHub)
3. Enter the Client ID and Client Secret from the previous steps
4. Save the configuration

## Webhook Configuration

1. In your Clerk Dashboard, go to "Webhooks"
2. Add a new endpoint: `https://yourdomain.com/api/webhooks/clerk`
3. Select the events you want to listen to:
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `organization.created`
   - `organization.updated`
   - `organization.deleted`
   - `organizationMembership.created`
   - `organizationMembership.updated`
   - `organizationMembership.deleted`
4. Copy the signing secret and add it to your environment as `CLERK_WEBHOOK_SECRET`

## Testing the Setup

1. Restart your development server after setting environment variables
2. Navigate to `/sign-in` or `/sign-up` to test authentication
3. Verify that OAuth providers appear and work correctly
4. Check that user data is synchronized to Supabase

## Protected Routes

Routes are protected using the middleware.ts file. Public routes are defined in the `isPublicRoute` matcher. Add any new public routes there.

For API routes that need protection, import and use the `auth()` function:

```typescript
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Continue with protected logic
}
```

## User Synchronization with Supabase

The webhook handler at `/api/webhooks/clerk/route.ts` automatically synchronizes user data between Clerk and Supabase, ensuring that user profiles are available in your database.