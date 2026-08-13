import { NextRequest } from "next/server";

// Two callers hit cron routes: Vercel Cron (sends the `authorization: Bearer
// ${CRON_SECRET}` header automatically when CRON_SECRET is set in env) and
// Upstash QStash (signs requests; verify via their SDK in production — see
// README). This helper covers the Vercel Cron / manual-secret path used by
// /api/cron/expire and /api/cron/digest.
export function isAuthorizedCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed if not configured
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

// QStash doesn't send the Vercel-style Authorization header. Instead, set a
// custom header (`x-cron-secret: ${CRON_SECRET}`) on the QStash schedule
// itself (Upstash console → schedule → Headers) — this route checks for it.
// For stronger guarantees, swap in @upstash/qstash's Receiver to verify the
// Upstash-Signature header against your QStash signing keys.
export function isAuthorizedByCustomSecretHeader(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("x-cron-secret") === secret;
}
