import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Role = "dispatcher" | "technician" | "billing" | "client";
export type Priority = "stat" | "urgent" | "routine";
export type OrderStatus = "pending" | "assigned" | "en-route" | "in-progress" | "complete" | "billed";
export type SyncStatus = "synced" | "pending" | "conflict" | "offline";
export type AuditStatus = "verified" | "flagged" | "pending";

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
}

export interface Technician {
  id: string;
  name: string;
  initials: string;
  licenseNumber: string;   // Monospace display
  zone: string;            // e.g. "North District"
  activeOrders: number;
  completedToday: number;
  syncStatus: SyncStatus;
  batteryLevel?: number;   // 0-100
  lastSeen?: string;
  credentialExpiry?: string;
  online: boolean;
  hourlyRate?: number;     // Fully-loaded hourly rate (USD)
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
  r0070Fee: number;        // Portable equipment surcharge
  mileageFee: number;
  totalAmount: number;
  status: OrderStatus;
  hasFlag?: boolean;
  flagReason?: string;
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
