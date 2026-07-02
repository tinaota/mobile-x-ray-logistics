import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
// Accept either the new publishable key format (sb_publishable_...) or legacy JWT anon key
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "placeholder-anon-key";

export const supabase = createClient(url, key);
export const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// ── Table row types (snake_case from DB) ──────────────────────

export interface DbOrder {
  id: string;
  patient_name: string;
  facility_id: string | null;
  facility_name: string;
  address: string;
  procedure: string;
  cpt_code: string;
  priority: "stat" | "urgent" | "routine";
  status: "pending" | "assigned" | "en-route" | "in-progress" | "in_transit" | "in-transit" | "complete" | "billed";
  scheduled_time: string;
  distance: string | null;
  assigned_tech: string | null;
  technician_id: string | null;
  phone: string | null;
  report_status: "pending" | "dictated" | "signed" | "delivered" | null;
  modality: "radiology" | "laboratory" | null;
  fasting_required: boolean | null;
  prior_auth_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTechnician {
  id: string;
  name: string;
  initials: string;
  license_number: string;
  discipline: "imaging" | "phlebotomy" | "dual" | null;
  zone: string;
  active_orders: number;
  completed_today: number;
  sync_status: "synced" | "pending" | "conflict" | "offline";
  battery_level: number | null;
  last_seen: string | null;
  credential_expiry: string | null;
  online: boolean;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
}

export interface DbInvoice {
  id: string;
  patient_name: string;
  facility_name: string;
  service_date: string;
  cpt_code: string;
  icd10_code: string;
  urgency_factor: number;
  base_fee: number;
  r0070_fee: number;
  mileage_fee: number;
  total_amount: number;
  status: "pending" | "assigned" | "en-route" | "in-progress" | "in_transit" | "in-transit" | "complete" | "billed";
  has_flag: boolean;
  flag_reason: string | null;
  order_id: string | null;
  modality: "radiology" | "laboratory" | null;
  lab_modifier: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSpecimen {
  id: string;
  order_id: string;
  accession_number: string;
  specimen_type: string;
  collected_at: string;
  expires_at: string;
  delivered_at: string | null;
  custody_transferred_to: string | null;
  destination_lab: string | null;
  storage_temp: string | null;
  transit_notes: string | null;
  created_at: string;
}

export interface DbAuditLog {
  id: string;
  cpt_code: string;
  status: "verified" | "flagged" | "pending";
  revenue_impact: number;
  facility: string;
  invoice_id: string | null;
  created_at: string;
}

export interface DbSyncQueue {
  id: string;
  order_id: string | null;
  patient_name: string;
  field: string;
  local_value: string;
  server_value: string | null;
  sync_status: "synced" | "pending" | "conflict" | "offline";
  timestamp: string;
  size: string | null;
  created_at: string;
}
