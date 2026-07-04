import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Role = "dispatcher" | "technician" | "billing" | "client" | "copilot";
// AI Co-Pilot personas — operational lenses selectable inside the copilot workspace
export type CopilotPersona = "dispatcher" | "billing" | "field-tech";
export type Priority = "stat" | "urgent" | "routine";
// Canonical status set. The DB may still contain legacy "in_transit" rows;
// normalizeOrderStatus() maps them at the fetch boundary so app code only
// ever sees "in-transit".
export type OrderStatus = "pending" | "assigned" | "en-route" | "in-progress" | "in-transit" | "complete" | "billed";
export type SyncStatus = "synced" | "pending" | "conflict" | "offline";
export type AuditStatus = "verified" | "flagged" | "pending";
export type Modality = "radiology" | "laboratory";
export type Discipline = "imaging" | "phlebotomy" | "dual";

export function normalizeOrderStatus(status: string): OrderStatus {
  return (status === "in_transit" ? "in-transit" : status) as OrderStatus;
}

export interface Order {
  id: string;
  patientName: string;
  facilityName: string;
  address: string;
  procedure: string;       // e.g. "Chest X-Ray 2-View"
  cptCode: string;         // e.g. "71046"
  priority: Priority;
  status: OrderStatus;
  scheduledTime: string;
  distance?: string;
  assignedTech?: string;
  phone?: string;
  reportStatus?: "pending" | "dictated" | "signed" | "delivered";
  technicianId?: string;
  modality?: Modality | null;
  fastingRequired?: boolean;   // laboratory orders only
  priorAuthNumber?: string;    // laboratory orders: payer authorization reference
}

export interface Specimen {
  id: string;
  orderId: string;
  accessionNumber: string;
  specimenType: string;        // e.g. "LAVENDER TOP", "SST"
  collectedAt: string;
  expiresAt: string;           // stability window boundary
  deliveredAt?: string;
  custodyTransferredTo?: string;
}

export interface Technician {
  id: string;
  name: string;
  initials: string;
  licenseNumber: string;   // Monospace display
  discipline: Discipline;  // imaging tech, phlebotomist, or cross-trained
  zone: string;            // e.g. "North District"
  activeOrders: number;
  completedToday: number;
  syncStatus: SyncStatus;
  batteryLevel?: number;   // 0-100
  lastSeen?: string;
  credentialExpiry?: string;
  online: boolean;
  hourlyRate?: number;     // Fully-loaded hourly rate (USD)
  latitude?: number;
  longitude?: number;
}

export interface Invoice {
  id: string;
  patientName: string;
  facilityName: string;
  serviceDate: string;
  cptCode: string;
  icd10Code: string;
  urgencyFactor: number;   // 1.0 | 1.5 | 2.0
  baseFee: number;
  r0070Fee: number;        // Portable equipment surcharge (radiology only)
  mileageFee: number;
  totalAmount: number;
  status: OrderStatus;
  hasFlag?: boolean;
  flagReason?: string;
  modality?: Modality;
  labModifier?: string;    // e.g. "90" (reference lab) — laboratory claims only
}

export interface Facility {
  id: string;
  name: string;
  address: string;
  phone: string;
  contactName: string;
  activeOrderCount: number;
}

export interface AuditEntry {
  id: string;
  invoiceId: string;
  patientName: string;
  facilityName: string;
  cptCode: string;
  status: AuditStatus;
  revenueImpact: number;   // positive = recovered, negative = written off
  reviewedAt?: string;
  reviewer?: string;
  notes?: string;
}
