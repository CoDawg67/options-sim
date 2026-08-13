import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Plain anon-key client with no cookie/session dependency — safe to call from
// generateStaticParams, sitemap.ts, and Server Components alike. This project
// uses Clerk (not Supabase Auth) for employer accounts, so public reads never
// need a user session; RLS scoping to active rows is enough (see
// supabase/migrations/0003_rls.sql).
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
