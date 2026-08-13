import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe";
import { getListingPrice } from "@/lib/pricing";
import { slugify } from "@/lib/importers/slug";
import { jobSlug } from "@/lib/importers/slug";
import { siteConfig } from "@/config/site";

const bodySchema = z.object({
  companyName: z.string().min(1).max(120),
  companyWebsite: z.string().url().optional().or(z.literal("")),
  title: z.string().min(1).max(160),
  city: z.string().max(100).optional().or(z.literal("")),
  remoteType: z.enum(["onsite", "hybrid", "remote"]),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  employmentType: z.string().max(60).optional().or(z.literal("")),
  descriptionSnippet: z.string().min(1).max(300),
  applyUrl: z.string().url(),
  contactEmail: z.string().email(),
  featured: z.boolean().optional(),
});

// Employer self-serve flow, no account required (Phase 5). Creates a draft
// job (is_active/is_paid false — invisible on the public site) and a Stripe
// Checkout Session; the webhook flips it live on checkout.session.completed.
export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid submission.", detail: err instanceof Error ? err.message : undefined }, { status: 400 });
  }

  const supabase = createAdminClient();
  const companySlug = slugify(parsed.companyName);

  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .upsert(
      { slug: companySlug, name: parsed.companyName, website: parsed.companyWebsite || null, ats_type: "manual", is_active: true },
      { onConflict: "slug", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (companyErr || !company) {
    return NextResponse.json({ error: "Could not create company." }, { status: 500 });
  }

  const externalId = randomUUID();

  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .insert({
      company_id: company.id,
      title: parsed.title,
      slug: jobSlug(companySlug, parsed.title, externalId),
      description_snippet: parsed.descriptionSnippet,
      source_url: parsed.applyUrl,
      apply_url: parsed.applyUrl,
      city: parsed.city || null,
      remote_type: parsed.remoteType,
      salary_min: parsed.salaryMin ?? null,
      salary_max: parsed.salaryMax ?? null,
      salary_currency: parsed.salaryMin || parsed.salaryMax ? "USD" : null,
      salary_period: parsed.salaryMin || parsed.salaryMax ? "year" : null,
      employment_type: parsed.employmentType || null,
      source: "employer_submission",
      external_id: externalId,
      is_active: false,
      is_paid: false,
    })
    .select("id, slug")
    .single();

  if (jobErr || !job) {
    return NextResponse.json({ error: "Could not create job draft." }, { status: 500 });
  }

  const { amountCents: listingPriceCents, isFoundingMember } = await getListingPrice(supabase);
  const featuredPriceCents = parsed.featured ? siteConfig.featuredPriceCents : 0;
  const totalCents = listingPriceCents + featuredPriceCents;

  const lineItems = [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: isFoundingMember ? `${siteConfig.name} listing (founding-member rate)` : `${siteConfig.name} listing`,
        },
        unit_amount: listingPriceCents,
      },
      quantity: 1,
    },
  ];

  if (parsed.featured) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Featured — pinned to top for 30 days" },
        unit_amount: featuredPriceCents,
      },
      quantity: 1,
    });
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${siteConfig.domain}/post-a-job/success?job=${job.slug}`,
      cancel_url: `${siteConfig.domain}/post-a-job`,
      customer_email: parsed.contactEmail,
      metadata: { job_id: job.id, featured: String(!!parsed.featured) },
    });

    const { error: orderErr } = await supabase.from("orders").insert({
      stripe_session_id: session.id,
      job_id: job.id,
      employer_email: parsed.contactEmail,
      amount_cents: totalCents,
      product: "listing",
      status: "pending",
      is_founding_member: isFoundingMember,
    });

    if (orderErr) {
      return NextResponse.json({ error: "Could not create order." }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err) {
    return NextResponse.json({ error: "Could not start checkout.", detail: err instanceof Error ? err.message : undefined }, { status: 500 });
  }
}
