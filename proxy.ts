import { NextRequest, NextResponse } from "next/server";

// The App Router has no built-in way for a page.tsx to return a 410 status
// (only notFound() -> 404 is supported), so expired/deactivated job pages
// are handled here in proxy (Next's renamed middleware convention), which
// can set an arbitrary status code. Stale listings returning 200 or a plain
// 404 (instead of 410 Gone) are the #1 cause of Google pulling an entire job
// board from Google for Jobs.
export const config = {
  matcher: "/jobs/:slug*",
};

export async function proxy(req: NextRequest) {
  const slug = req.nextUrl.pathname.replace(/^\/jobs\//, "");
  if (!slug) return NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return NextResponse.next();

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/jobs?select=is_active,expires_at&slug=eq.${encodeURIComponent(slug)}&limit=1`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }
    );
    if (!res.ok) return NextResponse.next();

    const rows = (await res.json()) as Array<{ is_active: boolean; expires_at: string }>;
    const job = rows[0];
    if (!job) return NextResponse.next(); // never existed — let the page 404 normally

    const isExpired = !job.is_active || new Date(job.expires_at).getTime() < Date.now();
    if (!isExpired) return NextResponse.next();

    return new NextResponse(
      "<!doctype html><html><body><h1>410 — This listing has expired</h1><p>The employer's posting window has closed. Browse current openings on the homepage.</p></body></html>",
      { status: 410, headers: { "Content-Type": "text/html" } }
    );
  } catch {
    return NextResponse.next(); // Supabase hiccup shouldn't take the whole site down
  }
}
