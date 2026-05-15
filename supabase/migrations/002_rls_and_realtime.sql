-- ============================================================
-- 002 — Row Level Security + Realtime
-- ============================================================

-- Enable RLS on all tables
alter table facilities  enable row level security;
alter table technicians enable row level security;
alter table orders      enable row level security;
alter table invoices    enable row level security;
alter table audit_log   enable row level security;
alter table sync_queue  enable row level security;

-- Public read/write policies (anon key — tighten when auth is added)
create policy "public_all_facilities"  on facilities  for all using (true) with check (true);
create policy "public_all_technicians" on technicians for all using (true) with check (true);
create policy "public_all_orders"      on orders      for all using (true) with check (true);
create policy "public_all_invoices"    on invoices    for all using (true) with check (true);
create policy "public_all_audit_log"   on audit_log   for all using (true) with check (true);
create policy "public_all_sync_queue"  on sync_queue  for all using (true) with check (true);

-- Enable Realtime on key tables
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table technicians;
alter publication supabase_realtime add table invoices;
alter publication supabase_realtime add table sync_queue;

-- Auto-update updated_at on orders and invoices
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

create trigger invoices_updated_at
  before update on invoices
  for each row execute function update_updated_at();
