-- ============================================================
-- 013 — Keep technicians.active_orders in sync with orders
--   • active_orders was a denormalized counter that nothing
--     recomputed on assignment/status change, so it drifted
--     (e.g. a tech carrying 6 open orders showed "1 active")
--   • Trigger recomputes the counter for the affected tech(s)
--     whenever an order is inserted, deleted, or has its
--     technician_id / status changed
--   • SECURITY DEFINER: order writes come from the anon client,
--     which has no UPDATE policy on technicians — the counter
--     refresh must not depend on the caller's RLS rights
--   • Ends with a one-time backfill of current values
-- ============================================================

-- An order counts as "active" for its technician while it is
-- still open (not complete/billed). Includes the legacy
-- 'in_transit' spelling that predates migration 011.
create or replace function refresh_technician_active_orders(p_tech_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update technicians
     set active_orders = (
       select count(*)
         from orders
        where technician_id = p_tech_id
          and status in ('pending', 'assigned', 'en-route', 'in-progress', 'in_transit', 'in-transit')
     )
   where id = p_tech_id;
$$;

create or replace function trg_orders_sync_active_orders()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Reassignment touches two technicians: refresh both sides.
  if tg_op in ('UPDATE', 'DELETE') and old.technician_id is not null then
    perform refresh_technician_active_orders(old.technician_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.technician_id is not null
     and (tg_op = 'INSERT' or new.technician_id is distinct from old.technician_id
          or new.status is distinct from old.status) then
    perform refresh_technician_active_orders(new.technician_id);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists orders_sync_active_orders on orders;
create trigger orders_sync_active_orders
  after insert or delete or update of technician_id, status on orders
  for each row execute function trg_orders_sync_active_orders();

-- One-time backfill: correct the drift accumulated before the trigger.
update technicians t
   set active_orders = (
     select count(*)
       from orders o
      where o.technician_id = t.id
        and o.status in ('pending', 'assigned', 'en-route', 'in-progress', 'in_transit', 'in-transit')
   );
