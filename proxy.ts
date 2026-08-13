import { NextRequest, NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// The App Router has no built-in way for a page.tsx to return a 410 status
// (only notFound() -> 404 is supported), so expired/deactivated job pages
// are handled here in proxy (Next's renamed middleware convention), which
// can set an arbitrary status code. Stale listings returning 200 or a plain
// 404 (instead of 410 Gone) are the #1 cause of Google pulling an entire job
// board from Google for Jobs.
export const config = {
  matcher: ["/jobs/:slug*", "/employer/:path*"],
};

async function handleExpiredJob(req: NextRequest): Promise<NextResponse | null> {
  const slug = req.nextUrl.pathname.replace(/^\/jobs\//, "");
  if (!slug) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/jobs?select=is_active,expires_at&slug=eq.${encodeURIComponent(slug)}&limit=1`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }
    );
    if (!res.ok) return null;

    const rows = (await res.json()) as Array<{ is_active: boolean; expires_at: string }>;
    const job = rows[0];
    if (!job) return null; // never existed — let the page 404 normally

    const isExpired = !job.is_active || new Date(job.expires_at).getTime() < Date.now();
    if (!isExpired) return null;

    return new NextResponse(
      "<!doctype html><html><body><h1>410 — This listing has expired</h1><p>The employer's posting window has closed. Browse current openings on the homepage.</p></body></html>",
      { status: 410, headers: { "Content-Type": "text/html" } }
    );
  } catch {
    return null; // Supabase hiccup shouldn't take the whole site down
  }
}

const isEmployerRoute = createRouteMatcher(["/employer(.*)"]);
const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Employer accounts (Clerk) are optional per the brief — posting a job never
// requires one, accounts only gate editing an existing listing later. Until
// CLERK keys are set, /employer routes fall through unprotected rather than
// crashing the whole site (clerkMiddleware throws without a publishable key).
export const proxy = clerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      const expiredResponse = await handleExpiredJob(req);
      if (expiredResponse) return expiredResponse;

      if (isEmployerRoute(req)) await auth.protect();
      return NextResponse.next();
    })
  : async (req: NextRequest) => {
      const expiredResponse = await handleExpiredJob(req);
      return expiredResponse ?? NextResponse.next();
    };
