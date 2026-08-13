import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// Source-map upload only kicks in when SENTRY_AUTH_TOKEN is set (Vercel env).
// Locally, without it, this is a no-op wrapper.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
});
