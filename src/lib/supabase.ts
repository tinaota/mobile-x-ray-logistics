import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

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
  status: "pending" | "assigned" | "en-route" | "in-progress" | "complete" | "billed";
  scheduled_time: string;
  distance: string | null;
  assigned_tech: string | null;
  technician_id: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTechnician {
  id: string;
  name: string;
  initials: string;
  license_number: string;
  zone: string;
  active_orders: number;
  completed_today: number;
  sync_status: "synced" | "pending" | "conflict" | "offline";
  battery_level: number | null;
  last_seen: string | null;
  credential_expiry: string | null;
  online: boolean;
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
  status: "pending" | "assigned" | "en-route" | "in-progress" | "complete" | "billed";
  has_flag: boolean;
  flag_reason: string | null;
  order_id: string | null;
  created_at: string;
  updated_at: string;
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
