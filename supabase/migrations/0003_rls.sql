-- Row Level Security. The site's public pages read via the anon key;
-- imports, webhooks, and cron routes use the service_role key (lib/supabase/admin.ts)
-- which bypasses RLS entirely, so these policies only constrain the browser/anon path.

alter table companies enable row level security;
alter table jobs enable row level security;
alter table subscribers enable row level security;
alter table orders enable row level security;
alter table import_runs enable row level security;

-- companies: public can read active companies only.
create policy "companies are publicly readable" on companies
  for select using (is_active = true);

-- jobs: public can read active jobs only. Writes go through the service role.
create policy "active jobs are publicly readable" on jobs
  for select using (is_active = true);

-- subscribers: anyone can insert (the signup form), nobody can read/update/delete
-- via the anon key — confirmation and unsubscribe happen through server routes
-- using the service role, keyed by confirm_token, not direct table access.
create policy "anyone can subscribe" on subscribers
  for insert with check (true);

-- orders: no anon access at all. Only the service role (webhook handler) touches this table.

-- import_runs: no anon access. Internal operational log only.
