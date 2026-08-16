import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  secret: process.env.AUTH0_SECRET!,
  // SDK v4 renamed AUTH0_BASE_URL to APP_BASE_URL; accept both so the
  // official quickstart env block works unchanged.
  appBaseUrl: process.env.APP_BASE_URL ?? process.env.AUTH0_BASE_URL,
});
