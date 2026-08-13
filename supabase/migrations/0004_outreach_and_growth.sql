-- Phase 2.5 / 2.75: outreach automation, founding-member pricing, Search
-- Console tracking. Added once the core import/site/checkout flow is stable.

-- ── outreach ─────────────────────────────────────────────────────────
-- Drafted (and later sent) "your job is already listed" emails to employers
-- whose aggregated (unpaid) jobs are already live on the board. Drafting is
-- rule-based mail-merge over real facts already in our own tables (title,
-- tech-stack keywords extracted from description_snippet, location, remote
-- policy, PostHog view count) — no LLM call, consistent with the project's
-- zero-runtime-AI constraint.
create table outreach (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  contact_email text,
  status text not null default 'drafted' check (status in ('drafted', 'sent', 'replied', 'skipped')),
  draft_subject text not null,
  draft_body text not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index outreach_company_id_idx on outreach (company_id);
create index outreach_status_idx on outreach (status);
-- One outreach attempt per company — never re-draft/re-send to the same company.
create unique index outreach_company_id_unique on outreach (company_id);

alter table outreach enable row level security;
-- No anon access at all; only the service role (cron + admin review) touches this table.

-- ── founding_member pricing ─────────────────────────────────────────
-- First N paid listings get a discounted price in exchange for a logo +
-- testimonial. is_founding_member is stamped on the order at checkout time
-- based on a count check (see lib/pricing.ts), not editable after the fact.
alter table orders add column is_founding_member boolean not null default false;

-- ── search_console_snapshots ─────────────────────────────────────────
-- Weekly pull from the Google Search Console API, charted on /admin/seo.
create table search_console_snapshots (
  id uuid primary key default gen_random_uuid(),
  captured_at timestamptz not null default now(),
  period_start date not null,
  period_end date not null,
  clicks integer not null,
  impressions integer not null,
  average_position numeric(6, 2),
  indexed_page_count integer,
  created_at timestamptz not null default now()
);

create index search_console_snapshots_period_idx on search_console_snapshots (period_start desc);

alter table search_console_snapshots enable row level security;
-- No anon access; /admin/seo reads via the service role behind Clerk auth.
