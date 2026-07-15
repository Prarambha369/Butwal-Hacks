# Authentication Setup Guide for Butwal Hacks

This document explains how to set up Auth0 authentication for the Butwal Hacks application.

## Overview

We use Auth0 for authentication which provides:
- Email/password authentication
- Social login (Google, GitHub, etc.)
- User management
- Session management
- Integration with Supabase for database access

## Initial Setup

1. Create an account at [Auth0 Dashboard](https://manage.auth0.com/)
2. Create a new application (Regular Web Application)
3. Get your credentials from the "Settings" tab

## Environment Variables

Update your `.env.local` file with the following variables:

```bash
# Auth0 Configuration
AUTH0_SECRET=your-64-char-hex-secret
AUTH0_DOMAIN=auth.butwalhacks.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_BASE_URL=http://localhost:3000

# Supabase Configuration (for user sync)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Configuring OAuth Providers

### 1. Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to "Credentials" and create an OAuth 2.0 Client ID
4. Add your domain to Authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://butwalhacks.com` (production)
5. Add redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://butwalhacks.com/auth/callback` (production)

### 2. Configure in Auth0 Dashboard

1. In your Auth0 Dashboard, go to "Authentication" → "Social"
2. Create a Google connection and enter the Client ID and Client Secret
3. Enable the connection for your application
4. Enable the "Redirect with login from" setting

## Webhook Configuration

1. In your Auth0 Dashboard, go to "Actions" → "Flows" → "Post-Login"
2. Create a custom Action with the following code:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const baseUrl = event.secrets.BASE_URL || 'https://butwalhacks.com';
  const webhookSecret = event.secrets.AUTH0_WEBHOOK_SECRET;
  const headers = { 'Content-Type': 'application/json' };

  if (webhookSecret) {
    headers['X-Webhook-Secret'] = webhookSecret;
  }

  try {
    const response = await fetch(`${baseUrl}/api/webhooks/auth0`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sub: event.user.user_id,
        email: event.user.email,
        name: event.user.name || event.user.nickname || event.user.given_name || '',
      }),
    });

    if (!response.ok) {
      console.error(
        `[auth0-action] Webhook returned ${response.status}: ${await response.text()}`
      );
    }
  } catch (err) {
    console.error('[auth0-action] Failed to call webhook:', err instanceof Error ? err.message : String(err));
  }
};
```

3. Configure Action Secrets: In Auth0 Dashboard → Actions → Secrets, add:
   - `BASE_URL` — set to `http://localhost:3000` for local dev, otherwise defaults to production
   - `AUTH0_WEBHOOK_SECRET` — optional, for production signature verification

4. Deploy the action and add it to the Post-Login flow.
5. Without this action, new users won't get a Supabase profile and login will redirect in a loop.

## Testing the Setup

1. Restart your development server after setting environment variables
2. Navigate to `/sign-in` to test authentication
3. Verify that social login providers appear and work correctly
4. Check that user data is synchronized to Supabase

## Protected Routes

Routes are protected using the `auth0.getSession()` helper. Public routes are available without authentication.

For API routes that need protection:

```typescript
import { createAuthenticatedClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const authClient = await createAuthenticatedClient();
  if (!authClient) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const { supabase, userId } = authClient;
  // Continue with protected logic
}
```

## User Synchronization with Supabase

The webhook handler at `/api/webhooks/auth0/route.ts` automatically synchronizes user data between Auth0 and Supabase, ensuring that user profiles are available in your database. This is called immediately after Auth0 login via the Post-Login Action.
