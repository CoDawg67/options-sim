// Upserts config/companies.ts into the `companies` table.
// Run with: npx tsx scripts/seed-companies.ts
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the environment.

import { createClient } from "@supabase/supabase-js";
import { seedCompanies } from "../config/companies";
import type { Database } from "../lib/supabase/types";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
    process.exit(1);
  }

  const supabase = createClient<Database>(url, key);

  const rows = seedCompanies.map((c) => ({
    name: c.name,
    slug: c.slug,
    website: c.website,
    ats_type: c.atsType,
    ats_identifier: c.atsIdentifier,
    is_active: true,
  }));

  const { data, error } = await supabase.from("companies").upsert(rows, { onConflict: "slug" }).select("id, slug");

  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }

  console.log(`Upserted ${data?.length ?? 0} companies.`);
}

main();
