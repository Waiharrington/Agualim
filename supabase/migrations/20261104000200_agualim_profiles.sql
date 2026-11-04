-- Project-specific username registry. Password hashes stay in Supabase Auth.
do $agualim$
begin
  execute $q$
    create table if not exists agualim.profiles (
      user_id uuid primary key references auth.users(id) on delete cascade,
      username text not null unique
        check (username = lower(username) and username ~ '^[a-z0-9._-]{3,24}$'),
      created_at timestamptz not null default now()
    )
  $q$;
  execute 'alter table agualim.profiles enable row level security';
  execute 'drop policy if exists "Users can read their own profile" on agualim.profiles';
  execute $q$
    create policy "Users can read their own profile"
    on agualim.profiles for select to authenticated
    using (user_id = (select auth.uid()))
  $q$;
  execute 'drop policy if exists "Users can create their own profile" on agualim.profiles';
  execute $q$
    create policy "Users can create their own profile"
    on agualim.profiles for insert to authenticated
    with check (user_id = (select auth.uid()))
  $q$;
end
$agualim$;
