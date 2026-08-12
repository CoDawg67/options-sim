-- The column default for expires_at (now() + 45 days) only works when
-- posted_at is also "now". Importers backfill posted_at from the feed's own
-- date, which can be in the past, so expires_at must be derived from
-- posted_at explicitly rather than left to the column default.

alter table jobs alter column expires_at drop default;

create or replace function jobs_set_expires_at()
returns trigger as $$
begin
  if new.expires_at is null or (tg_op = 'INSERT' and new.expires_at = new.posted_at) then
    new.expires_at := new.posted_at + interval '45 days';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger jobs_set_expires_at_trigger
  before insert on jobs
  for each row
  execute function jobs_set_expires_at();
