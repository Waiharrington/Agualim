-- Kept as one statement so it can be applied through `supabase db query`.
do $agualim$
begin
  execute 'create schema if not exists agualim';
  execute $q$
    create table if not exists agualim.water_logs (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id) on delete cascade,
      amount_ml integer not null check (amount_ml between 1 and 5000),
      local_day date not null,
      created_at timestamptz not null default now()
    )
  $q$;
  execute 'create index if not exists water_logs_user_day_created_idx on agualim.water_logs (user_id, local_day, created_at desc)';
  execute 'alter table agualim.water_logs enable row level security';
  execute 'drop policy if exists "Users manage their own hydration logs" on agualim.water_logs';
  execute $q$
    create policy "Users manage their own hydration logs"
    on agualim.water_logs for all to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()))
  $q$;
end
$agualim$;
