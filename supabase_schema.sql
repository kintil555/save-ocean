-- Jalankan di Supabase > SQL Editor
create table if not exists profiles(
  id uuid primary key references auth.users on delete cascade,
  name text, avatar text, updated_at timestamptz default now());
create table if not exists worlds(
  owner uuid primary key references auth.users on delete cascade,
  progress jsonb not null default '{}', env jsonb not null default '{}',
  online boolean default false, offline_at timestamptz, updated_at timestamptz default now());
create table if not exists rooms(
  code text primary key, host uuid unique references auth.users on delete cascade,
  host_name text, open boolean default true, created_at timestamptz default now(), beat timestamptz default now());
alter table rooms add column if not exists beat timestamptz default now();

alter table profiles enable row level security;
alter table worlds   enable row level security;
alter table rooms    enable row level security;

create policy "profiles read"  on profiles for select to authenticated using (true);
create policy "profiles write" on profiles for all    to authenticated using (auth.uid()=id) with check (auth.uid()=id);
create policy "worlds read"    on worlds   for select to authenticated using (true);
create policy "worlds write"   on worlds   for all    to authenticated using (auth.uid()=owner) with check (auth.uid()=owner);
create policy "rooms read"     on rooms    for select to authenticated using (true);
create policy "rooms write"    on rooms    for all    to authenticated using (auth.uid()=host) with check (auth.uid()=host);
