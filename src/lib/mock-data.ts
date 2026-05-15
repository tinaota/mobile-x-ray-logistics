import type { Order, Technician, Invoice, SyncStatus } from "@/lib/utils";

// ── Orders (sorted by scheduled_time, matches 003_seed_data.sql) ─────────────

export const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-001",
    patientName: "Maria Santos",
    facilityName: "Sunrise Medical Center",
    address: "1234 E Van Buren St, Phoenix, AZ",
    procedure: "Chest X-Ray 2-View",
    cptCode: "71046",
    priority: "stat",
    status: "complete",
    scheduledTime: "07:45 AM",
    distance: "2.1 mi",
    assignedTech: "T. Parker",
    reportStatus: "delivered",
  },
  {
    id: "ORD-003",
    patientName: "Linda Chen",
    facilityName: "Camelback Rehab Center",
    address: "455 N Camelback Rd, Phoenix, AZ",
    procedure: "AP/Lat Spine",
    cptCode: "72100",
    priority: "urgent",
    status: "complete",
    scheduledTime: "08:30 AM",
    distance: "1.8 mi",
    assignedTech: "T. Parker",
    reportStatus: "signed",
  },
  {
    id: "ORD-002",
    patientName: "James Okafor",
    facilityName: "Desert Valley Hospital",
    address: "890 W Thomas Rd, Phoenix, AZ",
    procedure: "Portable Chest X-Ray",
    cptCode: "71046",
    priority: "stat",
    status: "in-progress",
    scheduledTime: "09:30 AM",
    distance: "3.4 mi",
    assignedTech: "T. Parker",
    phone: "(602) 555-0189",
  },
  {
    id: "ORD-004",
    patientName: "Robert Hayes",
    facilityName: "Camelback Rehab Center",
    address: "455 N Camelback Rd, Phoenix, AZ",
    procedure: "AP/Lat Spine",
    cptCode: "72100",
    priority: "urgent",
    status: "assigned",
    scheduledTime: "10:00 AM",
    distance: "1.8 mi",
    assignedTech: "T. Parker",
  },
  {
    id: "ORD-005",
    patientName: "Angela Torres",
    facilityName: "Sunrise Medical Center",
    address: "1234 E Van Buren St, Phoenix, AZ",
    procedure: "Hip X-Ray Bilateral",
    cptCode: "73521",
    priority: "urgent",
    status: "assigned",
    scheduledTime: "11:00 AM",
    distance: "2.1 mi",
    assignedTech: "T. Parker",
  },
  {
    id: "ORD-006",
    patientName: "David Nguyen",
    facilityName: "Valley View Nursing Home",
    address: "78 W Indian School Rd, Phoenix, AZ",
    procedure: "Chest X-Ray 2-View",
    cptCode: "71046",
    priority: "routine",
    status: "assigned",
    scheduledTime: "12:30 PM",
    distance: "5.0 mi",
    assignedTech: "T. Parker",
  },
  {
    id: "ORD-007",
    patientName: "Patricia Moore",
    facilityName: "Desert Valley Hospital",
    address: "890 W Thomas Rd, Phoenix, AZ",
    procedure: "Knee AP/Lat",
    cptCode: "73562",
    priority: "routine",
    status: "pending",
    scheduledTime: "02:00 PM",
    distance: "3.4 mi",
  },
];

// ── Technicians ───────────────────────────────────────────────────────────────

export const MOCK_TECHNICIANS: Technician[] = [
  {
    id: "tech-001",
    name: "T. Parker",
    initials: "TP",
    licenseNumber: "RT-AZ-29841",
    zone: "Central District",
    activeOrders: 1,
    completedToday: 2,
    syncStatus: "synced",
    batteryLevel: 88,
    online: true,
    lastSeen: "2 min ago",
    credentialExpiry: "2026-03-15",
  },
  {
    id: "tech-002",
    name: "M. Rivera",
    initials: "MR",
    licenseNumber: "RT-AZ-31027",
    zone: "North District",
    activeOrders: 0,
    completedToday: 3,
    syncStatus: "synced",
    batteryLevel: 72,
    online: true,
    lastSeen: "5 min ago",
    credentialExpiry: "2025-11-20",
  },
  {
    id: "tech-003",
    name: "J. Thompson",
    initials: "JT",
    licenseNumber: "RT-AZ-28654",
    zone: "East District",
    activeOrders: 2,
    completedToday: 1,
    syncStatus: "pending",
    batteryLevel: 45,
    online: true,
    lastSeen: "12 min ago",
    credentialExpiry: "2026-07-01",
  },
  {
    id: "tech-004",
    name: "A. Patel",
    initials: "AP",
    licenseNumber: "RT-AZ-33109",
    zone: "West District",
    activeOrders: 0,
    completedToday: 0,
    syncStatus: "offline",
    batteryLevel: 12,
    online: false,
    lastSeen: "2 hrs ago",
    credentialExpiry: "2025-09-30",
  },
];

// ── Invoices ──────────────────────────────────────────────────────────────────

export const MOCK_INVOICES: Invoice[] = [
  {
    id: "INV-0041",
    patientName: "Maria Santos",
    facilityName: "Sunrise Medical Center",
    serviceDate: "2025-05-06",
    cptCode: "71046",
    icd10Code: "J18.9",
    urgencyFactor: 2.0,
    baseFee: 185.00,
    r0070Fee: 62.00,
    mileageFee: 10.50,
    totalAmount: 515.00,
    status: "billed",
    hasFlag: false,
  },
  {
    id: "INV-0043",
    patientName: "James Okafor",
    facilityName: "Desert Valley Hospital",
    serviceDate: "2025-05-06",
    cptCode: "71046",
    icd10Code: "",
    urgencyFactor: 2.0,
    baseFee: 185.00,
    r0070Fee: 62.00,
    mileageFee: 17.00,
    totalAmount: 528.00,
    status: "pending",
    hasFlag: true,
    flagReason: "Missing ICD-10 code",
  },
  {
    id: "INV-0042",
    patientName: "Linda Chen",
    facilityName: "Camelback Rehab Center",
    serviceDate: "2025-05-06",
    cptCode: "72100",
    icd10Code: "M54.5",
    urgencyFactor: 1.5,
    baseFee: 220.00,
    r0070Fee: 62.00,
    mileageFee: 9.00,
    totalAmount: 421.00,
    status: "billed",
    hasFlag: false,
  },
  {
    id: "INV-0038",
    patientName: "Robert Hayes",
    facilityName: "Camelback Rehab Center",
    serviceDate: "2025-05-05",
    cptCode: "72100",
    icd10Code: "M47.816",
    urgencyFactor: 1.5,
    baseFee: 220.00,
    r0070Fee: 62.00,
    mileageFee: 9.00,
    totalAmount: 421.00,
    status: "pending",
    hasFlag: true,
    flagReason: "Modifier conflict",
  },
  {
    id: "INV-0044",
    patientName: "Angela Torres",
    facilityName: "Sunrise Medical Center",
    serviceDate: "2025-05-06",
    cptCode: "73521",
    icd10Code: "M16.11",
    urgencyFactor: 1.5,
    baseFee: 260.00,
    r0070Fee: 62.00,
    mileageFee: 10.50,
    totalAmount: 462.50,
    status: "pending",
    hasFlag: false,
  },
  {
    id: "INV-0045",
    patientName: "David Nguyen",
    facilityName: "Valley View Nursing Home",
    serviceDate: "2025-05-06",
    cptCode: "71046",
    icd10Code: "J44.1",
    urgencyFactor: 1.0,
    baseFee: 185.00,
    r0070Fee: 62.00,
    mileageFee: 25.00,
    totalAmount: 272.00,
    status: "assigned",
    hasFlag: false,
  },
  {
    id: "INV-0046",
    patientName: "Patricia Moore",
    facilityName: "Desert Valley Hospital",
    serviceDate: "2025-05-05",
    cptCode: "73562",
    icd10Code: "M17.11",
    urgencyFactor: 1.0,
    baseFee: 195.00,
    r0070Fee: 62.00,
    mileageFee: 17.00,
    totalAmount: 274.00,
    status: "billed",
    hasFlag: false,
  },
  {
    id: "INV-0037",
    patientName: "Susan Park",
    facilityName: "Sunrise Medical Center",
    serviceDate: "2025-05-04",
    cptCode: "71045",
    icd10Code: "R05.9",
    urgencyFactor: 1.0,
    baseFee: 150.00,
    r0070Fee: 62.00,
    mileageFee: 10.50,
    totalAmount: 222.50,
    status: "billed",
    hasFlag: false,
  },
];

// ── Audit Log ─────────────────────────────────────────────────────────────────

export interface MockAuditRow {
  id: string;
  cptCode: string;
  status: "verified" | "flagged" | "pending";
  revenueImpact: number;
  facility: string;
}

export const MOCK_AUDIT_LOG: MockAuditRow[] = [
  { id: "AUD-71046-K", cptCode: "71046", status: "verified", revenueImpact:  2840.00, facility: "St. Jude Medical"  },
  { id: "AUD-72100-B", cptCode: "72100", status: "flagged",  revenueImpact:  -420.00, facility: "City Urgent Care"  },
  { id: "AUD-73521-X", cptCode: "73521", status: "pending",  revenueImpact:   462.50, facility: "Northwest General" },
  { id: "AUD-71045-M", cptCode: "71045", status: "verified", revenueImpact:   222.50, facility: "St. Jude Medical"  },
  { id: "AUD-73562-P", cptCode: "73562", status: "verified", revenueImpact:   274.00, facility: "City Urgent Care"  },
  { id: "AUD-72100-R", cptCode: "72100", status: "flagged",  revenueImpact:  -210.00, facility: "Northwest General" },
  { id: "AUD-71046-D", cptCode: "71046", status: "pending",  revenueImpact:   515.00, facility: "St. Jude Medical"  },
];

// ── Sync Queue ────────────────────────────────────────────────────────────────

export interface MockSyncRecord {
  id: string;
  orderId: string;
  patientName: string;
  field: string;
  localValue: string;
  serverValue?: string;
  syncStatus: SyncStatus;
  timestamp: string;
  size?: string;
}

export const MOCK_SYNC_QUEUE: MockSyncRecord[] = [
  {
    id: "SQ-001", orderId: "ORD-002", patientName: "James Okafor",
    field: "status", localValue: "in-progress", serverValue: "assigned",
    syncStatus: "conflict", timestamp: "09:31 AM", size: "1.2 KB",
  },
  {
    id: "SQ-002", orderId: "ORD-004", patientName: "Robert Hayes",
    field: "status", localValue: "en-route",
    syncStatus: "pending", timestamp: "09:58 AM", size: "0.8 KB",
  },
  {
    id: "SQ-003", orderId: "ORD-001", patientName: "Maria Santos",
    field: "status", localValue: "complete", serverValue: "complete",
    syncStatus: "synced", timestamp: "08:12 AM", size: "1.0 KB",
  },
  {
    id: "SQ-004", orderId: "ORD-003", patientName: "Linda Chen",
    field: "status", localValue: "complete", serverValue: "complete",
    syncStatus: "synced", timestamp: "09:05 AM", size: "1.0 KB",
  },
];
