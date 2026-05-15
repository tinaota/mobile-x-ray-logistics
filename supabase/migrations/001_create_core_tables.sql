-- ============================================================
-- 001 — Core tables
-- ============================================================

-- Facilities
create table if not exists facilities (
  id            text primary key default gen_random_uuid()::text,
  name          text not null,
  address       text not null,
  phone         text,
  contact       text,
  active_orders int  default 0,
  created_at    timestamptz default now()
);

-- Technicians
create table if not exists technicians (
  id                text primary key default gen_random_uuid()::text,
  name              text not null,
  initials          text not null,
  license_number    text not null,
  zone              text not null,
  active_orders     int  default 0,
  completed_today   int  default 0,
  sync_status       text not null default 'synced'
                      check (sync_status in ('synced','pending','conflict','offline')),
  battery_level     int  check (battery_level between 0 and 100),
  last_seen         text,
  credential_expiry text,
  online            boolean default false,
  created_at        timestamptz default now()
);

-- Orders
create table if not exists orders (
  id             text primary key,
  patient_name   text not null,
  facility_id    text references facilities(id),
  facility_name  text not null,
  address        text not null,
  procedure      text not null,
  cpt_code       text not null,
  priority       text not null
                   check (priority in ('stat','urgent','routine')),
  status         text not null default 'pending'
                   check (status in ('pending','assigned','en-route','in-progress','complete','billed')),
  scheduled_time text not null,
  distance       text,
  assigned_tech  text,
  technician_id  text references technicians(id),
  phone          text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Invoices
create table if not exists invoices (
  id             text primary key,
  patient_name   text not null,
  facility_name  text not null,
  service_date   text not null,
  cpt_code       text not null,
  icd10_code     text not null default '',
  urgency_factor numeric not null default 1.0,
  base_fee       numeric not null,
  r0070_fee      numeric not null default 62.00,
  mileage_fee    numeric not null default 0,
  total_amount   numeric not null,
  status         text not null default 'pending'
                   check (status in ('pending','assigned','en-route','in-progress','complete','billed')),
  has_flag       boolean default false,
  flag_reason    text,
  order_id       text references orders(id),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Audit log
create table if not exists audit_log (
  id             text primary key default gen_random_uuid()::text,
  cpt_code       text not null,
  status         text not null default 'pending'
                   check (status in ('verified','flagged','pending')),
  revenue_impact numeric not null default 0,
  facility       text not null,
  invoice_id     text references invoices(id),
  created_at     timestamptz default now()
);

-- Sync queue (offline technician mutations)
create table if not exists sync_queue (
  id           text primary key default gen_random_uuid()::text,
  order_id     text references orders(id),
  patient_name text not null,
  field        text not null,
  local_value  text not null,
  server_value text,
  sync_status  text not null default 'pending'
                 check (sync_status in ('synced','pending','conflict','offline')),
  timestamp    text not null,
  size         text,
  created_at   timestamptz default now()
);
