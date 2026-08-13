import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllActiveJobs, filterByRole, filterByRemote, filterByCity, type JobWithCompany } from "@/lib/data/jobs";
import { renderDigestEmail } from "@/lib/digest-email";
import { getResendClient, FROM_EMAIL } from "@/lib/resend";
import { logEmailSend, warnIfApproachingQuota } from "@/lib/email-quota";
import { siteConfig } from "@/config/site";

export const maxDuration = 300;

interface SubscriberFilters {
  role?: string;
  city?: string;
  remote?: boolean;
}

function jobsForSubscriber(allJobs: JobWithCompany[], oneWeekAgo: number, filters: SubscriberFilters): JobWithCompany[] {
  let jobs = allJobs.filter((j) => new Date(j.posted_at).getTime() >= oneWeekAgo);
  if (filters.role) jobs = filterByRole(jobs, filters.role);
  if (filters.city) jobs = filterByCity(jobs, filters.city);
  if (filters.remote) jobs = filterByRemote(jobs);
  return jobs;
}

// Weekly digest — Vercel Cron, Mondays (see vercel.json). Pulls the last 7
// days of new jobs matching each confirmed subscriber's saved filters.
export async function POST(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const allJobs = await getAllActiveJobs();
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const { data: subscribers, error } = await supabase
    .from("subscribers")
    .select("email, filters, confirm_token")
    .not("confirmed_at", "is", null)
    .is("unsubscribed_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const resend = getResendClient();
  let sent = 0;
  let skippedEmpty = 0;
  const errors: string[] = [];

  for (const sub of subscribers ?? []) {
    const jobs = jobsForSubscriber(allJobs, oneWeekAgo, (sub.filters as SubscriberFilters) ?? {});
    if (jobs.length === 0) {
      skippedEmpty++;
      continue;
    }

    const unsubscribeUrl = `${siteConfig.domain}/api/subscribe/unsubscribe?token=${sub.confirm_token}`;
    const { subject, html } = renderDigestEmail(jobs, unsubscribeUrl);

    try {
      await resend.emails.send({ from: FROM_EMAIL, to: sub.email, subject, html });
      await logEmailSend(supabase, "digest", sub.email);
      sent++;
    } catch (err) {
      errors.push(`${sub.email}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  await warnIfApproachingQuota(supabase);

  return NextResponse.json({ sent, skippedEmpty, errors });
}
