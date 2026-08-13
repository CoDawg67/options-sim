-- Tracks every email sent through Resend so the free tier's 3,000/month cap
-- can be watched and warned about before it's hit (brief, Phase 4).
create table email_sends (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('confirm', 'digest', 'outreach', 'employer_confirmation', 'ops_digest', 'admin_warning')),
  recipient text not null,
  sent_at timestamptz not null default now()
);

create index email_sends_sent_at_idx on email_sends (sent_at desc);

alter table email_sends enable row level security;
-- No anon access; only the service role (every route that sends mail) writes here.
