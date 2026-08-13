import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import * as Sentry from "@sentry/nextjs";
import { getStripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL } from "@/lib/resend";
import { logEmailSend } from "@/lib/email-quota";
import { siteConfig } from "@/config/site";

export const maxDuration = 60;

// Idempotent: checkout.session.completed can be delivered more than once by
// Stripe, and orders.status is only ever moved pending -> paid once (the
// early-return below), so a duplicate webhook delivery never double-publishes.
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await req.text();

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `invalid signature: ${err instanceof Error ? err.message : ""}` }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const supabase = createAdminClient();

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, job_id, status, employer_email, is_founding_member")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (orderErr || !order) {
    Sentry.captureMessage(`Stripe webhook: no matching order for session ${session.id}`, "error");
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }

  if (order.status === "paid") {
    return NextResponse.json({ received: true, alreadyProcessed: true }); // idempotent replay
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true, skipped: "not paid" });
  }

  if (!order.job_id) {
    Sentry.captureException(new Error(`Order ${order.id} paid but has no job_id to publish`));
    return NextResponse.json({ error: "order has no job_id" }, { status: 500 });
  }
  const jobId = order.job_id;

  const featured = session.metadata?.featured === "true";
  const nowIso = new Date().toISOString();

  const { error: jobErr } = await supabase
    .from("jobs")
    .update({
      is_active: true,
      is_paid: true,
      is_featured: featured,
      posted_at: nowIso,
      expires_at: new Date(Date.now() + siteConfig.listingDurationDays * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", jobId);

  if (jobErr) {
    Sentry.captureException(new Error(`Payment succeeded but job publish failed: order ${order.id}, job ${order.job_id}: ${jobErr.message}`));
    return NextResponse.json({ error: "job publish failed" }, { status: 500 });
  }

  await supabase
    .from("orders")
    .update({ status: "paid", stripe_payment_intent: (session.payment_intent as string) ?? null })
    .eq("id", order.id);

  const { data: job } = await supabase.from("jobs").select("slug, title").eq("id", jobId).maybeSingle();

  if (job) {
    try {
      const resend = getResendClient();
      await resend.emails.send({
        from: FROM_EMAIL,
        to: order.employer_email,
        subject: `Your listing is live on ${siteConfig.name}`,
        html: `
          <p>${job.title} is now live: <a href="${siteConfig.domain}/jobs/${job.slug}">${siteConfig.domain}/jobs/${job.slug}</a></p>
          ${featured ? "<p>It's pinned as Featured for the next 30 days.</p>" : ""}
        `,
      });
      await logEmailSend(supabase, "employer_confirmation", order.employer_email);
    } catch (err) {
      Sentry.captureException(err);
    }
  }

  return NextResponse.json({ received: true });
}
