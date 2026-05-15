# Mobile X-Ray Logistics Platform — Development Guide

> This file is Claude Code's primary reference for building the Mobile X-Ray Logistics Platform.
> Read this before touching any file. Update it as decisions are made.

---

## Project Overview

A full-stack, role-based mobile X-ray logistics platform for dispatching portable X-ray technicians to healthcare facilities, managing field operations, and processing medical billing/revenue. Three distinct user roles, each with their own dashboard and workflow.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 3 · ECharts · Mapbox GL · Supabase

**Design System Repo:** `C:\Users\tinao\.gemini\antigravity\scratch\xray-design-system`
**GitHub:** https://github.com/tinaota/xray-design-system
**Dev Server:** `npm run dev` → http://localhost:3000

---

## Wireframe Reference

> **Stitch MCP is connected** via HTTP transport (see `.claude.json`).
> Restart Claude Code then run: `get high-fidelity wireframes from Mobile X-Ray Logistics stitch file`
> Paste screen specs below under each role section.

Screen specs should be added per role under:
- `## Role: Dispatcher` → Dispatcher screens
- `## Role: Technician` → Technician/Field screens
- `## Role: Billing Manager` → Billing screens

---

## Architecture

```
src/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx            # Root layout (fonts, metadata)
│   ├── page.tsx              # Component gallery / design system demo
│   ├── (dispatcher)/         # Dispatcher role pages [TO BUILD]
│   ├── (technician)/         # Technician role pages [TO BUILD]
│   └── (billing)/            # Billing role pages [TO BUILD]
├── components/
│   ├── ui/                   # Primitive UI components
│   ├── layout/               # Shell components (Sidebar, AppHeader, PageLayout, TopNav)
│   ├── charts/               # Data visualization components
│   ├── domain/               # Business-logic components
│   └── onboarding/           # Onboarding flow components
└── lib/
    └── utils.ts              # Core types, cn() utility
```

### Route Structure

```
/                             # Landing / role selector
/onboarding                   # Onboarding flow (role + credential)

/dispatcher                   # Dispatcher dashboard (fleet overview)
/dispatcher/orders            # Order queue & assignment
/dispatcher/fleet             # Technician fleet management
/dispatcher/intake            # Facility management
/dispatcher/reports           # Analytics & reports

/technician                   # Technician field view (active order)
/technician/manifest          # Daily manifest / order list
/technician/equipment         # Equipment checklist
/technician/offline           # Offline sync log

/billing                      # Billing dashboard (revenue overview)
/billing/invoices             # Invoice list & detail
/billing/ledger               # Ledger / transaction history
/billing/scrubbing            # Compliance & code scrubbing
/billing/audit                # Audit log
/billing/reports              # Revenue reports
```

---

## Core Domain Types

All types live in [src/lib/utils.ts](src/lib/utils.ts). Never redefine them elsewhere.

```typescript
type Role = "dispatcher" | "technician" | "billing"
type Priority = "stat" | "urgent" | "routine"
type OrderStatus = "pending" | "assigned" | "en-route" | "in-progress" | "complete" | "billed"
type SyncStatus = "synced" | "pending" | "conflict" | "offline"
type AuditStatus = "verified" | "flagged" | "pending"

interface Order {
  id: string
  patientName: string
  facilityName: string
  address: string
  procedure: string          // e.g. "Chest X-Ray 2-View"
  cptCode: string            // e.g. "71046"
  priority: Priority
  status: OrderStatus
  scheduledTime: string
  distance?: string
  assignedTech?: string
  phone?: string
}

interface Technician {
  id: string
  name: string
  initials: string
  licenseNumber: string      // Monospace display
  zone: string               // e.g. "North District"
  activeOrders: number
  completedToday: number
  syncStatus: SyncStatus
  batteryLevel?: number      // 0-100
  lastSeen?: string
  credentialExpiry?: string
  online: boolean
}

interface Invoice {
  id: string
  patientName: string
  facilityName: string
  serviceDate: string
  cptCode: string
  icd10Code: string
  urgencyFactor: number      // Multiplier (1.0, 1.5, 2.0)
  baseFee: number
  r0070Fee: number           // Portable equipment surcharge
  mileageFee: number
  totalAmount: number
  status: OrderStatus
  hasFlag?: boolean
  flagReason?: string
}
```

---

## Design System

### Color Tokens (Tailwind classes)

| Token | Hex | Usage |
|-------|-----|-------|
| `midnight-navy` | `#0F172A` | App shell, headers, dark surfaces |
| `medical-blue` | `#3B82F6` | Primary actions, links, routine orders |
| `emergency-red` | `#EF4444` | STAT orders, critical alerts, errors |
| `warning-amber` | `#F59E0B` | Urgent orders, warnings |
| `ghost-white` | `#F8FAFC` | Page background |
| `slate-gray` | `#475569` | Secondary text, disabled states |
| `surface` | `#fcf8fa` | Card surfaces |
| `on-surface` | `#1b1b1d` | Primary text |
| `outline-variant` | `#c6c6cd` | Card borders, dividers |

### Priority Color System

```
STAT    → emergency-red (#EF4444)  + pulse-stat animation
URGENT  → warning-amber (#F59E0B)
ROUTINE → medical-blue  (#3B82F6)
```

Always use `<PriorityBadge priority={order.priority} />` — never hardcode colors.

### Typography Classes

```
headline-lg   → font-headline text-3xl font-bold       (page titles)
headline-md   → font-headline text-2xl font-semibold   (section headers)
body-lg       → font-body text-base                    (body copy)
body-sm       → font-body text-sm                      (captions, meta)
data-mono     → font-mono text-sm font-medium          (CPT codes, IDs, amounts)
label-caps    → font-label text-xs font-semibold uppercase tracking-wider
```

CPT codes, license numbers, invoice IDs, dollar amounts → always `font-mono`.

### Spacing & Touch Targets

- Minimum touch target: `h-10` (40px), preferred `h-12` (48px)
- Card padding: `p-5` or `p-6`
- Widget gap: `gap-widget-gap` (1.25rem)
- Gutter: `gap-gutter` (1rem)

### Shadows

```
shadow-card     → subtle lift (list items)
shadow-card-md  → medium lift (interactive cards)
shadow-card-lg  → high lift (modals, popovers)
```

---

## Component Catalog

### Layout Shell

Use `<PageLayout>` for every page. It composes Sidebar + TopNav + main content.

```tsx
<PageLayout role="dispatcher" title="Fleet Overview" subtitle="Live dispatch view" syncStatus="synced">
  {/* page content */}
</PageLayout>
```

**Props:** `role`, `title`, `subtitle`, `children`, `syncStatus`, `highContrast`

The Sidebar is role-aware — nav items change per role automatically. Never build custom nav outside PageLayout.

### UI Primitives (`src/components/ui/`)

| Component | Key Props | Notes |
|-----------|-----------|-------|
| `Button` | `variant`, `size`, `loading` | Variants: primary, secondary, outline, ghost, danger, warning, stat |
| `Card` + `CardHeader` + `CardContent` + `CardFooter` | — | Always use composition pattern |
| `Badge` | `variant`, `size` | Variants map to all status/priority states |
| `Avatar` | `src`, `initials`, `size`, `status` | Status dot: online/offline/busy/away |
| `Input` | `label`, `error`, `hint`, `leadingIcon`, `trailingIcon` | h-11 (44px), focus ring medical-blue |
| `Select` | `label`, `error`, `options`, `placeholder` | ChevronDown icon built in |
| `Modal` | `isOpen`, `onClose`, `title`, `size` | Sizes: sm/md/lg/xl. Escape key closes |
| `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent` | `defaultValue` | Context-based, no prop drilling |
| `DataTable` | `columns`, `data`, `keyExtractor`, `onRowClick` | Generic typed, sticky header option |
| `Toast` + `ToastContainer` | `variant`, `message` | Variants: success/warning/error/info. Fixed bottom-right |
| `KPICard` | `label`, `value`, `subtext`, `subIntent` | Intents: neutral/positive/negative/info/warning |
| `StatCard` | `label`, `value`, `unit`, `trend`, `icon` | Loading skeleton state built in |
| `StatusBadge` | `status` | Use `OrderStatusBadge` or `PriorityBadge` or `SyncStatusBadge` |

### Domain Components (`src/components/domain/`)

| Component | Usage |
|-----------|-------|
| `OrderCard` | Dispatcher order queue, technician manifest. Props: `order`, `onAssign`, `onView`, `compact` |
| `TechnicianCard` | Fleet management. Props: `technician`, `onSelect` |
| `CPTCodeBadge` | Inline CPT display. Props: `code`, `modifier`, `description`, `flagged` |
| `ICD10Badge` | Inline ICD-10 display. Props: `code`, `description`, `isPrimary` |
| `InvoiceRow` | Billing table rows. Props: `invoice`, `onSelect` |
| `ComplianceAuditTable` | Billing compliance view. Self-contained with pagination |
| `LiveMap` | Mapbox dark map with STAT/tech/hub markers. Env: `NEXT_PUBLIC_MAPBOX_TOKEN` |
| `MapWidget` | Fallback map placeholder when no Mapbox token |

### Chart Components (`src/components/charts/`)

All ECharts components use `dynamic()` with `{ ssr: false }` — never import them in SSR contexts.

| Component | Type | Role |
|-----------|------|------|
| `RevenueAreaChart` | Area (SVG) | Billing dashboard |
| `DailyJobVolumeChart` | Stacked bar (SVG) | Dispatcher dashboard |
| `ProcedureDistributionDonut` | Donut (SVG, small) | Dispatcher/Billing |
| `ServiceSplitDonut` | Donut (SVG, large) | Dispatcher overview |
| `FacilityRevenueBar` | Horizontal bar (SVG) | Billing by facility |
| `OrderBarChart` | Grouped bar (ECharts) | Dispatcher timeline |
| `RevenueLineChart` | Line + area (ECharts) | Billing WoW trend |
| `CPTDonutChart` | Donut (ECharts) | Billing procedure mix |
| `CollectionGauge` | Gauge (ECharts) | Billing KPI |
| `TechnicianActivityChart` | Stacked bar (ECharts) | Dispatcher fleet activity |
| `RealtimeCounterCard` | Metric + spark | Dispatcher live stats |
| `CodeScrubberWidget` | Code list + fix actions | Billing compliance |
| `ResponseTimeCard` | Metric + spark line | Dispatcher SLA |
| `MapDensityCard` | Network health metric | Dispatcher system view |

### Onboarding Components (`src/components/onboarding/`)

| Component | Usage |
|-----------|-------|
| `RoleSelector` | Step 1: Choose dispatcher/technician/billing |
| `CredentialUpload` | Step 2: Upload license/credential (PDF/JPG/PNG, 10MB max) |
| `StepIndicator` | Multi-step progress bar |

---

## Role: Dispatcher

**Identity:** RAD-COMMAND — Fleet orchestration and order assignment

**Primary workflows:**
1. View incoming orders (STAT escalation at top)
2. Assign orders to available technicians
3. Monitor field units on live map
4. Manage facility relationships
5. Review daily analytics

**Key screens:**

### `/dispatcher` — Fleet Dashboard
- KPI row: Active Orders, Technicians Online, Avg Response Time, Completion Rate
- `<LiveMap>` — full width, showing all active techs + open orders
- Order queue split: STAT (emergency-red, pulsing) → Urgent → Routine
- `<DailyJobVolumeChart>` — orders by hour
- `<TechnicianActivityChart>` — tech utilization

### `/dispatcher/orders` — Order Queue
- Filter bar: All / STAT / Urgent / Routine / status filters
- `<DataTable>` or `<OrderCard>` list (compact mode)
- Assign modal: select technician by zone proximity
- STAT orders: `pulse-stat` animation, emergency-red border

### `/dispatcher/fleet` — Fleet Management
- `<TechnicianCard>` grid — online/offline status, battery, sync
- Zone map overlay
- Click tech → detail drawer (orders, route, credentials)

### `/dispatcher/intake` — Facility Management
- Facility list with active order count
- Add/edit facility form
- Contact and address management

### `/dispatcher/reports` — Analytics
- Date range picker
- `<RevenueAreaChart>`, `<OrderBarChart>`, `<FacilityRevenueBar>`
- Export to PDF/CSV

---

## Role: Technician

**Identity:** RAD-FIELD — Field execution and clinical procedures

**Primary workflows:**
1. View assigned orders for the day
2. Accept and navigate to order location
3. Complete procedure and capture documentation
4. Sync data when back online

**Offline-first requirement:** Technician screens must function without network. Use service worker + IndexedDB for order cache. Sync status shown via `<SyncStatusBadge>`.

**Key screens:**

### `/technician` — Active Order View
- Current order hero card (patient, facility, address, procedure)
- `<PriorityBadge>` prominent
- Action buttons: Navigate, Start Procedure, Mark Complete
- Battery + sync status in header
- Next order preview

### `/technician/manifest` — Daily Manifest
- Ordered list of today's assignments (time-sorted)
- `<OrderCard compact>` per order
- Status progression: pending → assigned → en-route → in-progress → complete
- Tap to expand order detail

### `/technician/equipment` — Equipment Checklist
- Pre-shift equipment verification list
- Checkbox items with sign-off
- Equipment ID (monospace) + last calibration date

### `/technician/offline` — Offline Sync Log
- `<SyncStatusBadge>` per record
- Conflict resolution UI (show field vs server value, choose one)
- "Sync All" button
- Pending upload count badge in tab

---

## Role: Billing Manager

**Identity:** REVENUE COMMAND — Revenue lifecycle and compliance

**Primary workflows:**
1. Review invoices for completed orders
2. Run CPT code compliance scrubbing
3. Audit flagged claims
4. Track revenue KPIs

**Key screens:**

### `/billing` — Revenue Dashboard
- KPI row: Total Revenue, Collection Rate, Clean Claim Rate, Avg Invoice Value
- `<CollectionGauge>` — collection rate vs target
- `<RevenueLineChart>` — WoW revenue trend
- `<CPTDonutChart>` — procedure mix
- `<CodeScrubberWidget>` — recent scrub alerts

### `/billing/invoices` — Invoice List
- `<DataTable>` with `<InvoiceRow>` rows
- Filter: status, date range, facility, CPT code
- Flagged invoices: warning icon, `hasFlag` prop
- Click → invoice detail modal

### `/billing/scrubbing` — Code Scrubbing
- `<CodeScrubberWidget>` — full view
- Run scrub on date range
- Fix / auto-correct / escalate per code
- Reconcile All action

### `/billing/audit` — Compliance Audit
- `<ComplianceAuditTable>` — verified / flagged / pending
- Revenue impact column (± dollar amounts)
- Filter by facility, CPT code, status
- Export audit report

### `/billing/reports` — Revenue Reports
- `<FacilityRevenueBar>` by facility
- `<RevenueAreaChart>` monthly trend
- `<ProcedureDistributionDonut>` procedure mix
- Date range, facility, and CPT code filters
- Download CSV / PDF

---

## Environment Variables

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=    # Mapbox GL JS public token (required for LiveMap)
NEXT_PUBLIC_SUPABASE_URL=    # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon key
```

Without `NEXT_PUBLIC_MAPBOX_TOKEN`, `<LiveMap>` falls back to `<MapWidget>` placeholder automatically.

---

## Development Rules

### Do
- Use `<PageLayout role={role}>` on every page
- Import domain types from `src/lib/utils.ts` — never redefine
- Use `cn()` from `src/lib/utils.ts` for conditional class merging
- Use `font-mono` for all CPT codes, ICD-10 codes, invoice IDs, license numbers, dollar amounts
- Use `<PriorityBadge>`, `<OrderStatusBadge>`, `<SyncStatusBadge>` — never hardcode status colors
- Wrap ECharts charts in `dynamic(() => import(...), { ssr: false })`
- Maintain 48px minimum touch targets on all interactive elements
- STAT orders must always show `pulse-stat` animation and `emergency-red` color

### Don't
- Don't create new color values outside `tailwind.config.ts`
- Don't build custom nav or sidebar — use `<Sidebar>` which is already role-aware
- Don't import ECharts with SSR — use dynamic import only
- Don't skip `SyncStatus` display on technician screens
- Don't hardcode facility or CPT data — fetch from Supabase
- Don't use `px-*` values outside the token scale for layout spacing

### File Naming
```
pages:      app/(role)/page-name/page.tsx
components: PascalCase.tsx
hooks:      use-hook-name.ts
utils:      kebab-case.ts
```

---

## Supabase Schema (To Build)

Tables needed:

```sql
orders          -- Core order records
technicians     -- Technician profiles + credentials
facilities      -- Healthcare facility directory
invoices        -- Billing records (linked to orders)
audit_log       -- Compliance audit trail
sync_queue      -- Offline sync pending items
```

Use Supabase Realtime for:
- Live order assignment (dispatcher sees instant updates)
- Technician location / status (fleet map)
- Invoice status changes (billing dashboard)

---

## Offline Strategy (Technician Role)

1. On login, prefetch today's manifest → IndexedDB
2. All order mutations write to IndexedDB first, queue to `sync_queue`
3. `SyncStatus` reflects local queue state
4. On reconnect, flush `sync_queue` → Supabase
5. Conflicts: surface in `/technician/offline`, require manual resolution
6. Service worker caches: app shell, manifest data, map tiles

---

## Medical Billing Notes

- **CPT Codes** identify procedures (e.g. 71046 = Chest X-Ray 2-View)
- **ICD-10 Codes** identify diagnoses (e.g. J18.9 = Pneumonia)
- **R0070** = portable X-ray equipment surcharge (always add to mobile orders)
- **Urgency Factor**: STAT = 2.0×, Urgent = 1.5×, Routine = 1.0× applied to base fee
- **Clean Claim Rate** = invoices accepted on first submission / total invoices
- **Collection Rate** = amount collected / amount billed

Always display CPT and ICD-10 codes in `font-mono`. Flag any invoice missing ICD-10.
