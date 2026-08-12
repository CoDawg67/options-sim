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
  `0 */6 * * *` targeting `https://<domain>/api/cron/import`, and set the
  `Upstash-Signature` verification per their Next.js guide. This comfortably
  fits QStash's free quota (4 calls/day against a much larger free allowance).

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
config/         site.ts (pricing, niche, target roles), keywords.ts (rule-based role/location matching)
lib/            Supabase clients (browser/server/admin), importer + email helpers
supabase/migrations/   SQL schema, checked into the repo
scripts/        one-off scripts (seeding companies, etc.)
```

## Status

Phase 0 (this commit): project scaffolded, builds cleanly, env documented.
Database schema, importers, SEO pages, email, and Stripe checkout land in
subsequent phases — see the task list in the build conversation.
