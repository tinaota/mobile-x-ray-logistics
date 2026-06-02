# Database Schema — Mobile X-Ray Logistics Platform

**Database:** Supabase (PostgreSQL)
**Project:** `tojaehebqaaxfepbxaxw`

---

## Tables

### `facilities`
Stores healthcare facility records that request mobile X-ray services.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | text | PK | UUID |
| `name` | text | NOT NULL | Facility display name |
| `address` | text | NOT NULL | Full street address |
| `phone` | text | | Contact phone |
| `contact` | text | | Contact person name |
| `active_orders` | int | default 0 | Live order count |
| `created_at` | timestamptz | default now() | |

---

### `technicians`
Field technician profiles, availability, and credential tracking.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | text | PK | UUID |
| `name` | text | NOT NULL | Full name |
| `initials` | text | NOT NULL | Display initials (e.g. "AR") |
| `license_number` | text | NOT NULL | Radiography license — monospace display |
| `zone` | text | NOT NULL | Service zone (e.g. "North District") |
| `active_orders` | int | default 0 | Current active order count |
| `completed_today` | int | default 0 | Daily completion count |
| `sync_status` | text | NOT NULL, default `'synced'` | `synced` \| `pending` \| `conflict` \| `offline` |
| `battery_level` | int | CHECK 0–100 | Device battery % |
| `last_seen` | text | | Last activity timestamp |
| `credential_expiry` | text | | License expiry date |
| `online` | boolean | default false | Live availability status |
| `hourly_rate` | numeric(8,2) | NOT NULL, default 0 | Fully-loaded USD hourly rate |
| `created_at` | timestamptz | default now() | |

---

### `orders`
Core dispatch records — one row per patient X-ray request.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | text | PK | e.g. `ORD-001` |
| `patient_name` | text | NOT NULL | |
| `facility_id` | text | FK → `facilities.id` | |
| `facility_name` | text | NOT NULL | Denormalized for display |
| `address` | text | NOT NULL | Procedure location |
| `procedure` | text | NOT NULL | e.g. "Chest X-Ray 2-View" |
| `cpt_code` | text | NOT NULL | e.g. `71046`, `72100` |
| `priority` | text | NOT NULL | `stat` \| `urgent` \| `routine` |
| `status` | text | NOT NULL, default `'pending'` | `pending` \| `assigned` \| `en-route` \| `in-progress` \| `complete` \| `billed` |
| `scheduled_time` | text | NOT NULL | ISO timestamp or display string |
| `distance` | text | | Distance from tech to facility |
| `assigned_tech` | text | | Technician display name |
| `technician_id` | text | FK → `technicians.id` | |
| `phone` | text | | Patient phone for SMS notifications |
| `report_status` | text | NOT NULL, default `'pending'` | `pending` \| `dictated` \| `signed` \| `delivered` |
| `created_at` | timestamptz | default now() | |
| `updated_at` | timestamptz | default now() | Auto-updated via trigger |

**Trigger:** `orders_updated_at` — sets `updated_at` on every mutation.

---

### `invoices`
Billing records linked to completed orders. One invoice per order.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | text | PK | e.g. `INV-0041` |
| `patient_name` | text | NOT NULL | |
| `facility_name` | text | NOT NULL | |
| `service_date` | text | NOT NULL | |
| `cpt_code` | text | NOT NULL | Procedure billing code |
| `icd10_code` | text | NOT NULL, default `''` | Diagnosis code — flag if missing |
| `urgency_factor` | numeric | NOT NULL, default 1.0 | `1.0` routine \| `1.5` urgent \| `2.0` STAT |
| `base_fee` | numeric | NOT NULL | Base procedure fee (USD) |
| `r0070_fee` | numeric | NOT NULL, default 62.00 | Portable equipment surcharge |
| `mileage_fee` | numeric | NOT NULL, default 0 | Distance-based fee |
| `total_amount` | numeric | NOT NULL | Computed: `(base_fee × urgency_factor) + r0070_fee + mileage_fee` |
| `status` | text | NOT NULL, default `'pending'` | Mirrors order status lifecycle |
| `has_flag` | boolean | default false | Compliance scrubbing flag |
| `flag_reason` | text | | Reason for flag |
| `order_id` | text | FK → `orders.id` | |
| `created_at` | timestamptz | default now() | |
| `updated_at` | timestamptz | default now() | Auto-updated via trigger |

**Trigger:** `invoices_updated_at` — sets `updated_at` on every mutation.

---

### `audit_log`
Compliance audit trail for billing review. One entry per reviewed invoice item.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | text | PK | UUID |
| `cpt_code` | text | NOT NULL | Procedure code being audited |
| `status` | text | NOT NULL, default `'pending'` | `verified` \| `flagged` \| `pending` |
| `revenue_impact` | numeric | NOT NULL, default 0 | Positive = recovered, negative = written off (USD) |
| `facility` | text | NOT NULL | Facility name |
| `invoice_id` | text | FK → `invoices.id` | |
| `created_at` | timestamptz | default now() | |

---

### `sync_queue`
Offline-first buffer for field technician mutations. Holds unsynced changes until reconnection.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | text | PK | UUID |
| `order_id` | text | FK → `orders.id` | |
| `patient_name` | text | NOT NULL | |
| `field` | text | NOT NULL | Field name that was modified |
| `local_value` | text | NOT NULL | Value written offline |
| `server_value` | text | | Server value at time of conflict |
| `sync_status` | text | NOT NULL, default `'pending'` | `synced` \| `pending` \| `conflict` \| `offline` |
| `timestamp` | text | NOT NULL | When the local write occurred |
| `size` | text | | Payload size indicator |
| `created_at` | timestamptz | default now() | |

---

### `messages`
In-app and SMS communication threads, scoped to an order.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, default `gen_random_uuid()` | |
| `order_id` | text | FK → `orders.id`, ON DELETE CASCADE | |
| `sender_role` | text | NOT NULL | `dispatcher` \| `technician` \| `patient` |
| `sender_name` | text | NOT NULL | Display name |
| `content` | text | NOT NULL | Message body |
| `channel` | text | NOT NULL, default `'in_app'` | `in_app` \| `sms` |
| `sms_sid` | text | | Twilio message SID for SMS messages |
| `read_at` | timestamptz | | Null = unread |
| `created_at` | timestamptz | default now() | |

---

## Relationships

```
facilities ─────────────────── orders (facility_id)
technicians ─────────────────── orders (technician_id)
orders ──────────────────────── invoices (order_id)
invoices ────────────────────── audit_log (invoice_id)
orders ──────────────────────── sync_queue (order_id)
orders ──────────────────────── messages (order_id, CASCADE DELETE)
```

---

## Realtime Subscriptions

The following tables have Supabase Realtime enabled for live UI updates:

| Table | Used by |
|-------|---------|
| `orders` | Dispatcher fleet map, order queue |
| `technicians` | Fleet status panel |
| `invoices` | Billing dashboard |
| `sync_queue` | Technician offline sync log |
| `messages` | Dispatcher message threads |

---

## Row Level Security

All tables have RLS enabled. Current policies use PUBLIC access (suitable for development). **Before production:** replace with role-scoped policies using the `rad-session` JWT claims.

---

## Medical Billing Reference

| Concept | Details |
|---------|---------|
| CPT Code | Identifies the procedure (e.g. `71046` = Chest X-Ray 2-View) |
| ICD-10 Code | Identifies the diagnosis (e.g. `J18.9` = Pneumonia) — invoice is flagged if missing |
| R0070 | Portable equipment surcharge — always applied to mobile orders (default $62.00) |
| Urgency Factor | `1.0` routine / `1.5` urgent / `2.0` STAT — multiplied against base fee |
| Clean Claim Rate | Invoices accepted on first submission ÷ total invoices |
| Collection Rate | Amount collected ÷ amount billed |
