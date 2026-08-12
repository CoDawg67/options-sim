-- Initial schema for the MLOps Jobs board.
-- Run via `supabase db push` (linked project) or paste into the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- ── companies ────────────────────────────────────────────────────────
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  website text,
  logo_url text,
  ats_type text not null check (ats_type in ('greenhouse', 'lever', 'ashby', 'workable', 'manual')),
  ats_identifier text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── jobs ─────────────────────────────────────────────────────────────
create table jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  slug text not null unique,
  description_snippet text,
  source_url text not null,
  apply_url text not null,
  location_raw text,
  city text,
  region text,
  country text,
  remote_type text not null check (remote_type in ('onsite', 'hybrid', 'remote')),
  salary_min integer,
  salary_max integer,
  salary_currency text,
  salary_period text check (salary_period in ('year', 'month', 'hour') or salary_period is null),
  employment_type text,
  posted_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '45 days'),
  source text not null,
  external_id text not null,
  is_featured boolean not null default false,
  is_paid boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint jobs_source_external_id_key unique (source, external_id),
  constraint jobs_description_snippet_len check (char_length(description_snippet) <= 320)
);

create index jobs_is_active_idx on jobs (is_active);
create index jobs_posted_at_idx on jobs (posted_at desc);
create index jobs_city_idx on jobs (city);
create index jobs_remote_type_idx on jobs (remote_type);
create index jobs_company_id_idx on jobs (company_id);
-- Common combined query: active jobs, newest first.
create index jobs_active_posted_idx on jobs (is_active, posted_at desc);

-- ── subscribers ──────────────────────────────────────────────────────
create table subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  filters jsonb not null default '{}'::jsonb,
  confirm_token text,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create index subscribers_confirmed_idx on subscribers (confirmed_at) where unsubscribed_at is null;

-- ── orders ───────────────────────────────────────────────────────────
create table orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique,
  stripe_payment_intent text,
  job_id uuid references jobs(id) on delete set null,
  employer_email text not null,
  amount_cents integer not null,
  product text not null check (product in ('listing', 'featured')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now()
);

create index orders_job_id_idx on orders (job_id);
create index orders_status_idx on orders (status);

-- ── import_runs ──────────────────────────────────────────────────────
-- Log of every importer execution, so a broken feed is visible without
-- reading Vercel/QStash logs.
create table import_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  jobs_seen integer not null default 0,
  jobs_created integer not null default 0,
  jobs_updated integer not null default 0,
  errors text[] not null default '{}',
  status text not null default 'running' check (status in ('running', 'success', 'failed'))
);

create index import_runs_source_started_idx on import_runs (source, started_at desc);
