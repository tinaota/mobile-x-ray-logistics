// Server-only live-context builder for the Co-Pilot chat route.
// Formats a compact text block of REAL operational data per persona,
// injected into the system prompt. This is intentionally separate from
// the client-side ContextRail (which renders live React UI via the
// existing realtime hooks) — one feeds the model, the other the eye.
//
// Reads use supabaseAdmin: the copilot session is a custom JWT cookie,
// not a Supabase Auth session, so auth.uid()-keyed RLS policies would
// silently return zero rows through the anon client.

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  MOCK_ORDERS, MOCK_TECHNICIANS, MOCK_INVOICES, MOCK_SPECIMENS, MOCK_SYNC_QUEUE,
} from "@/lib/mock-data";
import type { CopilotPersona } from "@/lib/utils";

// Small normalized shapes shared by the DB and mock paths
interface OrderLite {
  id: string; procedure: string; facility: string; time: string;
  priority: string; status: string; modality: string | null; assignedTech: string | null;
}
interface TechLite {
  name: string; zone: string; discipline: string; online: boolean;
  activeOrders: number; completedToday: number; syncStatus: string;
}
interface InvoiceLite {
  id: string; cptCode: string; icd10Code: string; totalAmount: number;
  status: string; hasFlag: boolean; flagReason: string | null; modality: string | null;
}
interface SpecimenLite {
  orderId: string; accessionNumber: string; expiresAt: string; deliveredAt: string | null;
}

async function fetchOrders(): Promise<OrderLite[]> {
  if (!supabaseAdmin) {
    return MOCK_ORDERS.map(o => ({
      id: o.id, procedure: o.procedure, facility: o.facilityName, time: o.scheduledTime,
      priority: o.priority, status: o.status, modality: o.modality ?? null, assignedTech: o.assignedTech ?? null,
    }));
  }
  const { data } = await supabaseAdmin
    .from("orders")
    .select("id, procedure, facility_name, scheduled_time, priority, status, modality, assigned_tech")
    .order("scheduled_time");
  return (data ?? []).map(r => ({
    id: r.id, procedure: r.procedure, facility: r.facility_name, time: r.scheduled_time,
    priority: r.priority, status: r.status === "in_transit" ? "in-transit" : r.status,
    modality: r.modality, assignedTech: r.assigned_tech,
  }));
}

async function fetchTechnicians(): Promise<TechLite[]> {
  if (!supabaseAdmin) {
    return MOCK_TECHNICIANS.map(t => ({
      name: t.name, zone: t.zone, discipline: t.discipline, online: t.online,
      activeOrders: t.activeOrders, completedToday: t.completedToday, syncStatus: t.syncStatus,
    }));
  }
  const { data } = await supabaseAdmin
    .from("technicians")
    .select("name, zone, discipline, online, active_orders, completed_today, sync_status")
    .order("name");
  return (data ?? []).map(r => ({
    name: r.name, zone: r.zone, discipline: r.discipline ?? "imaging", online: r.online,
    activeOrders: r.active_orders, completedToday: r.completed_today, syncStatus: r.sync_status,
  }));
}

async function fetchInvoices(): Promise<InvoiceLite[]> {
  if (!supabaseAdmin) {
    return MOCK_INVOICES.map(i => ({
      id: i.id, cptCode: i.cptCode, icd10Code: i.icd10Code, totalAmount: i.totalAmount,
      status: i.status, hasFlag: !!i.hasFlag, flagReason: i.flagReason ?? null, modality: i.modality ?? null,
    }));
  }
  const { data } = await supabaseAdmin
    .from("invoices")
    .select("id, cpt_code, icd10_code, total_amount, status, has_flag, flag_reason, modality")
    .order("created_at", { ascending: false });
  return (data ?? []).map(r => ({
    id: r.id, cptCode: r.cpt_code, icd10Code: r.icd10_code, totalAmount: r.total_amount,
    status: r.status === "in_transit" ? "in-transit" : r.status,
    hasFlag: r.has_flag, flagReason: r.flag_reason, modality: r.modality,
  }));
}

async function fetchSpecimens(): Promise<SpecimenLite[]> {
  if (!supabaseAdmin) {
    return MOCK_SPECIMENS.map(s => ({
      orderId: s.orderId, accessionNumber: s.accessionNumber,
      expiresAt: s.expiresAt, deliveredAt: s.deliveredAt ?? null,
    }));
  }
  const { data } = await supabaseAdmin
    .from("specimens")
    .select("order_id, accession_number, expires_at, delivered_at")
    .order("collected_at", { ascending: false });
  return (data ?? []).map(r => ({
    orderId: r.order_id, accessionNumber: r.accession_number,
    expiresAt: r.expires_at, deliveredAt: r.delivered_at,
  }));
}

async function fetchSyncQueueCounts(): Promise<{ pending: number; conflict: number }> {
  if (!supabaseAdmin) {
    return {
      pending: MOCK_SYNC_QUEUE.filter(r => r.syncStatus === "pending").length,
      conflict: MOCK_SYNC_QUEUE.filter(r => r.syncStatus === "conflict").length,
    };
  }
  const { data } = await supabaseAdmin.from("sync_queue").select("sync_status");
  const rows = data ?? [];
  return {
    pending: rows.filter(r => r.sync_status === "pending").length,
    conflict: rows.filter(r => r.sync_status === "conflict").length,
  };
}

const OPEN_STATUSES = ["pending", "assigned", "en-route", "in-progress", "in-transit"];

function minutesLeft(expiresAt: string): number {
  return Math.round((new Date(expiresAt).getTime() - Date.now()) / 60000);
}

function orderLine(o: OrderLite): string {
  const tech = o.assignedTech ? `assigned to ${o.assignedTech}` : "UNASSIGNED";
  return `- \`${o.id}\` — ${o.procedure} (${o.modality ?? "radiology"}), ${o.facility}, scheduled ${o.time}, ${o.priority.toUpperCase()}, status ${o.status}, ${tech}`;
}

export async function fetchPersonaContext(persona: CopilotPersona): Promise<string> {
  switch (persona) {
    case "dispatcher": {
      const [orders, technicians, specimens] = await Promise.all([
        fetchOrders(), fetchTechnicians(), fetchSpecimens(),
      ]);
      const open = orders.filter(o => OPEN_STATUSES.includes(o.status));
      const stat = open.filter(o => o.priority === "stat").slice(0, 5);
      const inTransitLab = specimens.filter(s => !s.deliveredAt).slice(0, 5);
      const techs = technicians.slice(0, 8);

      return [
        `STAT orders open (${stat.length} shown):`,
        ...(stat.length ? stat.map(orderLine) : ["- none"]),
        ``,
        `All open orders: ${open.length} total (${open.filter(o => !o.assignedTech).length} unassigned).`,
        ``,
        `Specimens in transit (stability watch):`,
        ...(inTransitLab.length
          ? inTransitLab.map(s => `- \`${s.accessionNumber}\` (order \`${s.orderId}\`) — ${minutesLeft(s.expiresAt)} min until stability window closes`)
          : ["- none"]),
        ``,
        `Field staff:`,
        ...techs.map(t => `- ${t.name} (${t.zone}, ${t.discipline}) — ${t.online ? "online" : "OFFLINE"}, ${t.activeOrders} active, ${t.completedToday} done today`),
        ``,
        `Assignment rules: radiology orders need imaging or dual discipline; laboratory orders need phlebotomy or dual. Route targets: 8–12 exams/tech/day.`,
      ].join("\n");
    }

    case "billing": {
      const invoices = await fetchInvoices();
      const flagged = invoices.filter(i => i.hasFlag).slice(0, 10);
      const openTotal = invoices.filter(i => i.status !== "billed").reduce((s, i) => s + i.totalAmount, 0);

      return [
        `Flagged invoices (${flagged.length} shown):`,
        ...(flagged.length
          ? flagged.map(i => `- \`${i.id}\` — CPT \`${i.cptCode}\`, ICD-10 ${i.icd10Code ? `\`${i.icd10Code}\`` : "**MISSING**"}, $${i.totalAmount.toFixed(2)}, ${i.modality ?? "radiology"}, flag: ${i.flagReason ?? "unspecified"}`)
          : ["- none"]),
        ``,
        `Portfolio: ${invoices.length} invoices total, $${openTotal.toFixed(2)} not yet billed.`,
        `Invoice formula: Total = (CPT Base × Urgency Factor) + R0070 Fee (radiology) or lab modifier -90 (laboratory) + Mileage Fee.`,
      ].join("\n");
    }

    case "field-tech": {
      const [orders, technicians, syncCounts] = await Promise.all([
        fetchOrders(), fetchTechnicians(), fetchSyncQueueCounts(),
      ]);
      const active = orders
        .filter(o => ["en-route", "in-progress", "in-transit"].includes(o.status))
        .slice(0, 8);

      return [
        `Fleet active assignments (${active.length} shown):`,
        ...(active.length ? active.map(orderLine) : ["- none"]),
        ``,
        `Field staff status:`,
        ...technicians.slice(0, 8).map(t => `- ${t.name} (${t.discipline}) — ${t.online ? "online" : "OFFLINE"}, sync ${t.syncStatus}`),
        ``,
        `Offline sync queue: ${syncCounts.pending} pending, ${syncCounts.conflict} conflicts.`,
        `Chain of custody for lab draws: scan vial barcode → accession bound to order → transit lock with stability countdown → drop-off requires receiving staff ID scan.`,
      ].join("\n");
    }
  }
}
