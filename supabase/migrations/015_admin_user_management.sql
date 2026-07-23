-- Admin user-management console: real user directory, session freshness,
-- invite tracking, and account locking (hi-fi spec: /admin/users).
-- NOTE: not yet applied to prod — useAdminUsers degrades to demo data until it is.

create table if not exists platform_users (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,
  name           text not null,
  initials       text not null,
  role           text not null check (role in ('dispatcher','technician','billing','client','copilot','admin')),
  locked         boolean not null default false,
  last_active_at timestamptz,
  created_at     timestamptz not null default now()
);

create table if not exists admin_invites (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  invited_by  text,
  expires_at  timestamptz not null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists admin_invites_open_idx on admin_invites(expires_at) where accepted_at is null;

alter table platform_users enable row level security;
alter table admin_invites  enable row level security;

-- App runs as anon (see 009); admin surface is gated by the rad-session JWT in proxy.ts.
create policy "anon read users"    on platform_users for select using (true);
create policy "anon update users"  on platform_users for update using (true);
create policy "anon read invites"  on admin_invites  for select using (true);
create policy "anon insert invites" on admin_invites for insert with check (true);

alter publication supabase_realtime add table platform_users;
