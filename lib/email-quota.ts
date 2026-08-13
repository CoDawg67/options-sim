import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EmailKind } from "@/lib/supabase/types";
import { getResendClient, FROM_EMAIL } from "@/lib/resend";
import { siteConfig } from "@/config/site";

// Resend's free tier caps at 3,000 emails/month. Every send is logged to
// email_sends so this can warn before the cap is hit, rather than silently
// failing sends mid-month.
const MONTHLY_FREE_TIER_CAP = 3000;
const WARNING_THRESHOLD = 0.8; // warn at 80% of the cap

export async function logEmailSend(
  supabase: SupabaseClient<Database>,
  kind: EmailKind,
  recipient: string
): Promise<void> {
  await supabase.from("email_sends").insert({ kind, recipient });
}

export async function getMonthlySendCount(supabase: SupabaseClient<Database>): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("email_sends")
    .select("id", { count: "exact", head: true })
    .gte("sent_at", startOfMonth.toISOString());

  if (error) throw error;
  return count ?? 0;
}

// Call once per cron run (digest, outreach) after sends complete. Only fires
// one admin_warning email per calendar month, once the threshold is crossed.
export async function warnIfApproachingQuota(supabase: SupabaseClient<Database>): Promise<void> {
  const count = await getMonthlySendCount(supabase);
  if (count < MONTHLY_FREE_TIER_CAP * WARNING_THRESHOLD) return;

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { count: alreadyWarned } = await supabase
    .from("email_sends")
    .select("id", { count: "exact", head: true })
    .eq("kind", "admin_warning")
    .gte("sent_at", startOfMonth.toISOString());

  if (alreadyWarned && alreadyWarned > 0) return;

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: siteConfig.supportEmail,
      subject: `${siteConfig.name}: approaching Resend's free-tier email cap`,
      html: `<p>${count} of ${MONTHLY_FREE_TIER_CAP} free-tier emails sent this month. Consider trimming the digest list or upgrading Resend before the cap is hit.</p>`,
    });
    await logEmailSend(supabase, "admin_warning", siteConfig.supportEmail);
  } catch {
    // best-effort — don't let a warning-email failure break the calling cron
  }
}
