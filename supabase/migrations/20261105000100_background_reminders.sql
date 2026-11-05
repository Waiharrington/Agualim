create table if not exists agualim.push_reminders (
  user_id uuid primary key references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  enabled boolean not null default true,
  interval_minutes integer not null default 30 check (interval_minutes between 1 and 1440),
  start_time time not null default '08:00',
  end_time time not null default '22:00',
  time_zone text not null default 'America/Caracas',
  last_drink_at timestamptz not null default now(),
  pending_since timestamptz,
  last_sent_at timestamptz,
  snoozed_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table agualim.push_reminders enable row level security;
grant select, insert, update, delete on agualim.push_reminders to authenticated;
grant select, insert, update, delete on agualim.push_reminders to service_role;
drop policy if exists "Users manage their own push reminders" on agualim.push_reminders;
create policy "Users manage their own push reminders"
  on agualim.push_reminders for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create index if not exists push_reminders_enabled_idx
  on agualim.push_reminders (enabled) where enabled;
