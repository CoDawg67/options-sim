import { createAdminClient } from "@/lib/supabase/admin";

export interface EmployerJob {
  id: string;
  slug: string;
  title: string;
  is_active: boolean;
  is_featured: boolean;
  expires_at: string;
}

// Employer accounts aren't tied to a company_id at signup (no account is
// required to post — see /post-a-job), so "my jobs" is derived from paid
// orders matching the signed-in user's email, not a stored relationship.
export async function getEmployerJobs(email: string): Promise<EmployerJob[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("job:jobs!inner(id, slug, title, is_active, is_featured, expires_at)")
    .eq("employer_email", email)
    .eq("status", "paid");

  if (error) throw error;
  return ((data ?? []) as unknown as Array<{ job: EmployerJob }>).map((r) => r.job);
}
