import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedByCustomSecretHeader, isAuthorizedCronRequest } from "@/lib/cron-auth";
import { verifyQstashSignature } from "@/lib/qstash";
import { runAllImports } from "@/lib/importers/run";

// Triggered by Upstash QStash every 6 hours (see README — Vercel's free tier
// only allows daily cron, so this route isn't in vercel.json's cron list).
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const authorized =
    (await verifyQstashSignature(req, rawBody)) ||
    isAuthorizedByCustomSecretHeader(req) ||
    isAuthorizedCronRequest(req);

  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const summaries = await runAllImports();
  const hadErrors = summaries.some((s) => s.errors.length > 0);

  return NextResponse.json({ summaries }, { status: hadErrors ? 207 : 200 });
}
