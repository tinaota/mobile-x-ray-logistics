# Mobile X-Ray Logistics Platform — Development Guide

> Claude Code's primary reference for this repo. Updated 2026-07 to match the shipped
> platform — if something here disagrees with the code, the code wins; update this file.

---

## Project Overview

A full-stack, role-based **dual-service** field-medicine platform: mobile **Radiology**
(portable X-ray/ultrasound/EKG) and mobile **Laboratory** (phlebotomy + specimen
logistics). Six product areas, each with its own shell and workflow.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 3 ·
Recharts + ECharts · Leaflet (react-leaflet) · Supabase (Postgres + Realtime) · Twilio SMS

**Design system source of truth:** `tailwind.config.ts`, mirrored for designers in
[docs/DESIGN.md](docs/DESIGN.md). Designer workflow: [docs/design-handoff.md](docs/design-handoff.md).
Wireframes (lo-fi + hi-fi, presentation): Figma Make file `Azr413IXIofmQZWOOU8MRE`,
published at https://marsh-slush-59084662.figma.site

---

## Product Areas & Routes

| Area | Identity | Shell | Routes |
|---|---|---|---|
| Dispatcher | RAD-COMMAND | `NavShell` + navy Sidebar | `/dispatcher` (ops hub: Fleet/Monitoring/Field Units/Messages tabs), `/assignment`, `/intake`, `/credentials`, `/results`, `/billing`, `/reports` — plus `/fleet`, `/monitoring`, `/orders`, `/messages` |
| Technician | RAD-FIELD | `TechnicianShell` (mobile-first, bottom nav, high-contrast toggle) | `/technician` (field view), `/manifest`, `/scan`, `/clinical`, `/equipment`, `/offline` |
| Billing | REVENUE COMMAND | `NavShell` + Sidebar | `/billing`, `/ledger`, `/invoices`, `/scrubbing`, `/audit`, `/reports` |
| Client | MY X-RAY (patient portal) | `ClientShell` (mobile, bottom nav) | `/client` (tracking), `/request`, `/history`, `/contact` |
| Copilot | CO-PILOT (AI assistant) | `CopilotShell` (full-screen chat) | `/copilot` |
| Admin | Config & users | Own layout | `/admin`, `/admin/settings` |

Auth: `/login` (staff invite via Supabase + passwordless OTP for clients, Twilio SMS),
`/join` (invite token), `/onboarding`. Session = `rad-session` JWT cookie signed in
`src/lib/auth.ts`; route protection in `src/proxy.ts`. Admin can access every area.

**Dual-service:** `ServiceLineContext` + TopNav segmented control (All Fleets / ⚡
Radiology / 💧 Laboratory). Orders carry `modality`; lab flows add `PhlebotomyDrawPanel`,
`LabPanelCombobox`, `BarcodeScanner`, `SpecimenStabilityBadge`.

---

## Core Domain Types

All in [src/lib/utils.ts](src/lib/utils.ts) — never redefine elsewhere. Key ones:

- `Role` = dispatcher | technician | billing | client | copilot (admin handled in auth as `AuthRole`)
- `Priority` = stat | urgent | routine · `SyncStatus` = synced | pending | conflict | offline
- `OrderStatus` = pending | assigned | en-route | in-progress | in-transit (lab) | complete | billed
- `Order.reportStatus` = pending | dictated | signed | delivered (interpretation pipeline)
- `Order`, `Technician` (discipline: imaging | phlebotomy | dual), `Invoice`

Data hooks in `src/lib/hooks/`: `useOrders` (+ `assignOrder`, `unassignOrder`,
`updateReportStatus`, offline-first `updateOrderStatus`), `useTechnicians`, `useInvoices`,
`useMessages`/`useAllMessages` (realtime, `markRead`), `useRatings` (satisfaction),
`useSyncQueue`, `useOfflineWrites`, `useSession`. All fall back to mock data when
Supabase is unconfigured.

---

## Design System (summary — full spec in docs/DESIGN.md)

- Brand: midnight-navy `#0F172A`, medical-blue `#3B82F6`, emergency-red `#EF4444`
  (surfaces only — **red backgrounds carrying white text use red-600 `#DC2626`**, WCAG),
  warning-amber `#F59E0B` (navy text on it, never white)
- Service accents: radiology-indigo `#4F46E5`, laboratory-rose `#E11D48`, laboratory-emerald `#059669`
- Material-style lilac surface scale `#fcf8ff` → `#e4e1ee`; primary `#3525cd`
- Fonts: Inter (body) · JetBrains Mono (CPT/ICD-10/IDs/amounts/ETAs — always) ·
  Space Grotesk (uppercase labels) · Hanken Grotesk (headlines)
- Radii: standard scale + proto-sm 10 / proto-md 14 / proto-lg 20 / proto-xl 26 ("Liquid
  Glass"); shadows proto-card / proto-pop / proto-fab; `pulse-stat` animation on STAT

### Component rules
- Every page under a role layout — layouts provide the shell; never build custom nav
- `<PriorityBadge>` / `<OrderStatusBadge>` / `<SyncStatusBadge>` — never hardcode status colors; status is never color-only
- ECharts/Recharts components: `dynamic(..., { ssr: false })` only
- Maps: `LiveMap` (Leaflet wrapper; `markers` + `routes` props); never import Leaflet in SSR
- Touch targets ≥48px mobile / inputs ≥44px; visible focus rings; labels associated
  (`htmlFor`/`id`); Modal has focus trap + focus return — keep it that way

---

## Supabase

Schema via `supabase/migrations/` (001–014): orders, technicians, facilities, invoices,
audit_log, sync_queue, messages (+sms channel), report_status, labor cost, tech
coordinates, patient linkage, RLS policies, laboratory workflow, dual-service ops,
ai_copilot, technician active_orders trigger, visit_ratings (014 — check applied before
relying on it; `useRatings` degrades to mock data if missing).

Realtime: orders, messages, visit_ratings. App runs as anon with RLS policies (see 009);
staff auth via invite, client via OTP.

**Never apply migrations to prod without explicit user approval.**

---

## Offline Strategy (Technician)

Mutations write optimistically and buffer via `src/lib/offline-queue.ts` when
`navigator.onLine` is false; `useSyncQueue`/`useOfflineWrites` drive the shell's sync
badge; conflicts surface in `/technician/offline`. Don't bypass `updateOrderStatus`.

---

## Medical Billing Notes

- CPT identifies procedure (71046 chest 2-view); ICD-10 identifies diagnosis (J18.9)
- R0070 = portable equipment surcharge, always on mobile orders
- Total = (CPT base + R0070) × urgency (STAT 2.0 / Urgent 1.5 / Routine 1.0) + mileage
- Clean Claim Rate = first-pass accepted / total; flag invoices missing ICD-10
- All codes/amounts render in `font-mono`

---

## Environment

```bash
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server-side (invites)
JWT_SECRET=                      # session signing (dev fallback exists)
TWILIO_ACCOUNT_SID= TWILIO_AUTH_TOKEN= TWILIO_FROM=   # SMS
NEXT_PUBLIC_MAPBOX_TOKEN=        # optional; Leaflet/CARTO tiles used by default
```

Deploy target: Vercel — set env vars at build time (Supabase/Twilio gotchas).

Dev: `npm run dev` → http://localhost:3000. Local page verification requires a session —
mint a `rad-session` JWT with `src/lib/auth.ts` semantics (dev secret fallback) rather
than logging in through OTP.

---

## Docs Index

- [docs/DESIGN.md](docs/DESIGN.md) — design system (tokens, components, a11y)
- [docs/design-handoff.md](docs/design-handoff.md) — designer 1:1 spec + Pexels imagery guide
- [docs/figma-make-hifi-prompt.md](docs/figma-make-hifi-prompt.md) — hi-fi wireframe prompt
- [docs/rad-command_workflow_ada_audit.txt](docs/rad-command_workflow_ada_audit.txt) — ADA audit + competitive analysis (fixes applied 2026-07)
- docs/UX_EVALUATION.md, docs/SOFTWARE_ARCHITECTURE.md, docs/DATABASE_SCHEMA.md,
  docs/AI_COPILOT_ARCHITECTURE.md — deeper references
