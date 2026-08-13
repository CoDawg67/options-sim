# MLOps Jobs — automated niche job board

Niche: **MLOps / ML Infrastructure Engineering**. Zero-runtime-AI, free-tier-only
job board: pulls jobs from public ATS feeds on a schedule, publishes SEO pages,
emails subscribers, and sells listings via Stripe — hands-off after setup.

Domain is a placeholder (`mlopsjobs.example.com` in `config/site.ts` and
`NEXT_PUBLIC_SITE_URL`) until a real one is bought on Namecheap. Swap both
before launch.

## Stack

Next.js (App Router, TypeScript, Tailwind) · Supabase (Postgres) · Stripe ·
Resend · Clerk (optional employer accounts) · PostHog · Sentry · Vercel Cron +
Upstash QStash.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in keys, see table below
npm run dev
```

## Accounts to create and where each key goes

All of these have free tiers that cover this project's scale. Create each
account, then paste the key into `.env.local` (local dev) **and** the Vercel
project's Environment Variables (production) — the two are separate.

| Env var | Where to get it |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | The domain you buy, e.g. `https://mlopsjobs.com`. Use the placeholder until then. |
| `NEXT_PUBLIC_SUPABASE_URL` | [supabase.com](https://supabase.com) → New project → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → API keys → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → API keys → `service_role` (secret — server/cron only, never ships to the browser) |
| `STRIPE_SECRET_KEY` | [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → API keys → Secret key. Use the **test mode** key until Phase 5 launch. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Same page → Publishable key |
| `STRIPE_WEBHOOK_SECRET` | Developers → Webhooks → Add endpoint → `https://<domain>/api/webhooks/stripe`, event `checkout.session.completed` → Signing secret |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys → Create (free tier: 3,000 emails/mo, 100/day) |
| `RESEND_FROM_EMAIL` | An address on a domain you've verified in Resend (Domains tab) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | [clerk.com](https://clerk.com) → Create application → API Keys |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | [posthog.com](https://posthog.com) → Project settings → Project API key |
| `NEXT_PUBLIC_SENTRY_DSN` | [sentry.io](https://sentry.io) → Create project (Next.js) → DSN |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | Sentry → Settings → Auth Tokens (for source-map upload at build time) |
| `USAJOBS_API_KEY` / `USAJOBS_USER_AGENT` | Only if the niche later includes gov roles. [developer.usajobs.gov](https://developer.usajobs.gov) → free key emailed to you; `USER_AGENT` is the email you registered with. |
| `CRON_SECRET` | Any random string you generate (`openssl rand -hex 32`). Cron/webhook routes check this so the endpoints can't be triggered publicly. |
| `QSTASH_*` | [upstash.com](https://upstash.com) → QStash tab → used for the every-6-hours import job (see below) |

**Not in `.env`:** the Namecheap domain purchase and Cloudflare DNS records —
see below.

## Scheduling note (free-tier constraint)

Vercel's Hobby (free) plan only allows Cron Jobs to run **once per day**, so
the brief's "import every 6 hours" doesn't fit Vercel Cron directly. This repo
uses:

- **Vercel Cron** (`vercel.json`) for the daily expiry sweep (`/api/cron/expire`,
  3am UTC) and the weekly digest (`/api/cron/digest`, Mondays).
- **Upstash QStash** (free tier) for the every-6-hours import job
  (`/api/cron/import`). In the QStash console, create a schedule with cron
  `0 */6 * * *` targeting `https://<domain>/api/cron/import`, method POST. The
  route verifies the `Upstash-Signature` header against
  `QSTASH_CURRENT_SIGNING_KEY`/`QSTASH_NEXT_SIGNING_KEY` (`lib/qstash.ts`), so
  no extra header is required — but you can still add `x-cron-secret:
  <CRON_SECRET>` as a schedule header for a manual-testing fallback. This
  comfortably fits QStash's free quota (4 calls/day against a much larger
  free allowance).

## Deploying

1. Push this repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → import the repo → it auto-detects
   Next.js. Paste all env vars from the table above into the Vercel project
   (Settings → Environment Variables) before the first deploy.
3. Every push to `main` auto-deploys.

## Pointing the domain (Namecheap → Cloudflare → Vercel)

1. Buy the domain on Namecheap.
2. Add the site to Cloudflare (free plan) — Cloudflare gives you two
   nameservers, e.g. `ns1.cloudflare.com` and `ns2.cloudflare.com` (yours will
   be specific to your zone, shown in the Cloudflare dashboard after you add
   the site).
3. In Namecheap: Domain List → Manage → Nameservers → **Custom DNS** → paste
   the two Cloudflare nameservers. Propagation takes up to 24h.
4. In Vercel: Project → Settings → Domains → add your domain. Vercel will show
   the records it needs — typically:
   - `A` record: `@` → `76.76.21.21`
   - `CNAME` record: `www` → `cname.vercel-dns.com`
5. Add those exact records in Cloudflare DNS (proxy status **DNS only**, the
   grey cloud, not orange — Vercel needs to see the real IP for SSL
   provisioning). Once Vercel shows the domain as "Valid", flip Cloudflare's
   proxy back to orange-cloud if you want its CDN/WAF in front.

## Project layout

```
app/            Next.js App Router pages + API routes (cron, webhooks)
config/         site.ts (pricing, niche, target roles), keywords.ts (rule-based role/location matching), companies.ts (seed list)
lib/            Supabase clients (public/admin), importer + email + Stripe helpers
supabase/migrations/   SQL schema, checked into the repo
scripts/        one-off scripts (seeding + validating companies)
proxy.ts        Next's renamed middleware — 410s for expired jobs, Clerk route protection for /employer
```

## Operations

**Add a new company to the importer:** add an entry to `config/companies.ts`
(name, slug, website, `atsType`, `atsIdentifier` — the board token, e.g. the
`{x}` in `boards.greenhouse.io/{x}`), then run `npm run seed:companies`. Run
`npm run validate:companies` first if you're not sure the board token is
right — it hits the real endpoint and reports which ones resolve.

**Add a new feed source:** add a file under `lib/importers/` exporting a
function matching the `Importer` type in `lib/importers/types.ts` (take a
`CompanyForImport`, return `NormalizedJob[]`), then register it in the
`ATS_IMPORTERS` map in `lib/importers/run.ts`. Reuse `titleMatchesTargetRoles`
/ `detectRemoteType` (`lib/importers/filter.ts`) and `toSnippet`
(`lib/importers/snippet.ts`) so filtering and remote-detection stay
consistent across sources.

**Edit the role keyword rules:** `config/keywords.ts` — `titleInclude` /
`titleExclude` control which jobs get imported at all; `roleSlugs` controls
which titles count toward each `/[role]-jobs` category page. Both are plain
string arrays, no redeploy-and-pray — just edit and push.

**If imports stop working:** check the `import_runs` table in Supabase
(Table Editor or SQL: `select * from import_runs order by started_at desc
limit 20`) — every run logs `jobs_seen`/`created`/`updated` and an `errors`
array per source. A single company's wrong `ats_identifier` shows up as one
error line, not a failed run — the importer skips it and continues with the
rest. If every source shows zero jobs, check that `/api/cron/import` is
actually being hit (QStash console → schedule → delivery log) and that
`QSTASH_CURRENT_SIGNING_KEY`/`QSTASH_NEXT_SIGNING_KEY` match what's in the
Upstash dashboard.

## Launch checklist

Work through this once deployed with real data — none of it can be verified
from this build sandbox (no live URL, no deployed Supabase data):

- [ ] All job pages return valid JobPosting schema — check a few real
      `/jobs/[slug]` URLs against [Google's Rich Results
      Test](https://search.google.com/test/rich-results)
- [ ] Sitemap live at `/sitemap.xml`, submitted to Google Search Console +
      Bing Webmaster Tools
- [ ] Expired jobs return 410 (`curl -I` an expired job URL) and drop out of
      the sitemap on the next regen
- [ ] Import cron runs on schedule (QStash console shows successful
      deliveries) and is idempotent — trigger it twice manually, confirm
      `import_runs.jobs_created` is 0 on the second run for unchanged jobs
- [ ] Stripe **test-mode** purchase publishes a job end-to-end (webhook logs
      in the Stripe dashboard, job flips `is_active`/`is_paid` in Supabase)
- [ ] Switch Stripe keys from test to live mode; re-point the webhook
      endpoint's signing secret
- [ ] Email double opt-in and one-click unsubscribe both work
- [ ] Lighthouse: performance and SEO both 90+ on the homepage and a job page
- [ ] PostHog recording pageviews, Sentry catching a deliberately-triggered
      error
- [ ] At least 200 live, real, non-duplicate listings (`select count(*) from
      jobs where is_active`)

## Status

Phases 0–5 built: schema, feed ingestion (Greenhouse/Lever/Ashby/Workable/HN
Who's Hiring), SEO pages with the 10-listing thin-page guard, email capture +
weekly digest, and Stripe checkout with founding-member pricing. Nothing has
been run against live infrastructure yet — every account in the table above
still needs to be created and its keys pasted in before any of this is
testable end-to-end. See the launch checklist above for what to verify once
it is.
