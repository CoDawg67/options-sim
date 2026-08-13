import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

const URL_CHECK_CONCURRENCY = 10;

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// Deactivates jobs whose expires_at has passed, plus any active job whose
// source_url now 404s. Stale/dead listings are the #1 cause of Google
// pulling job-board sites from Google for Jobs entirely, so this must run
// daily without fail.
export async function POST(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: expired, error: expireErr } = await supabase
    .from("jobs")
    .update({ is_active: false })
    .lt("expires_at", nowIso)
    .eq("is_active", true)
    .select("id");

  if (expireErr) {
    return NextResponse.json({ error: expireErr.message }, { status: 500 });
  }

  const { data: activeJobs, error: fetchErr } = await supabase
    .from("jobs")
    .select("id, source_url")
    .eq("is_active", true);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message, expiredCount: expired?.length ?? 0 }, { status: 500 });
  }

  const deadIds = (
    await mapWithConcurrency(activeJobs ?? [], URL_CHECK_CONCURRENCY, async (job) => {
      try {
        const res = await fetch(job.source_url, { method: "HEAD", redirect: "follow" });
        if (res.status === 404 || res.status === 410) return job.id;
        return null;
      } catch {
        return null; // network hiccup isn't proof the posting is gone — don't deactivate on a fetch error
      }
    })
  ).filter((id): id is string => id !== null);

  if (deadIds.length > 0) {
    await supabase.from("jobs").update({ is_active: false }).in("id", deadIds);
  }

  return NextResponse.json({
    expiredByDate: expired?.length ?? 0,
    deactivatedByDeadLink: deadIds.length,
  });
}
