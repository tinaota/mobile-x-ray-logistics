# Software Architecture — Mobile X-Ray Logistics Platform

---

## Overview

A full-stack, role-based mobile X-ray logistics platform for dispatching portable X-ray technicians to healthcare facilities, managing field operations, and processing medical billing. Five distinct user roles, each with their own dashboard and workflow.

**Live URL:** https://mobile-x-ray-logistics.vercel.app
**Repository:** https://github.com/tinaota/mobile-x-ray-logistics

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI Library | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 3 |
| Database | Supabase (PostgreSQL) |
| Auth | Custom JWT + Supabase Auth |
| SMS | Twilio |
| Maps | Mapbox GL JS |
| Charts | Apache ECharts |
| Deployment | Vercel |
| Email | Supabase Auth (SMTP configurable via Resend) |

---

## Repository Structure

```
src/
├── app/                          # Next.js App Router pages + API routes
│   ├── layout.tsx                # Root layout (fonts, metadata)
│   ├── page.tsx                  # Landing / role selector
│   ├── login/                    # Login page
│   ├── onboarding/               # Multi-step onboarding wizard
│   ├── join/                     # Invite token entry point
│   ├── auth/callback/            # Supabase OAuth / OTP callback
│   ├── admin/                    # Admin dashboard + settings
│   ├── dispatcher/               # Dispatcher role pages
│   ├── technician/               # Technician role pages
│   ├── billing/                  # Billing manager pages
│   ├── client/                   # Client role pages
│   └── api/
│       ├── auth/                 # login, logout, invite, join, onboarding-complete
│       └── sms/                  # send, notify, webhook
├── components/
│   ├── ui/                       # Primitive UI components
│   ├── layout/                   # Shell components (NavShell, Sidebar, TopNav)
│   ├── charts/                   # ECharts data visualizations (SSR-disabled)
│   ├── domain/                   # Business-logic components (OrderCard, etc.)
│   └── onboarding/               # Onboarding flow components
└── lib/
    ├── utils.ts                  # Core domain types + cn() utility
    ├── auth.ts                   # JWT session + invite token logic
    ├── accounts.ts               # Demo account definitions
    ├── supabase.ts               # Supabase browser client
    ├── supabase-admin.ts         # Supabase server-side admin client
    ├── twilio.ts                 # Twilio SMS client + message templates
    └── hooks/
        └── useSession.ts         # Client-side session hook
```

---

## Authentication System

### Session Model
Custom JWT-based session stored in two cookies:

| Cookie | Type | Expiry | Contents |
|--------|------|--------|----------|
| `rad-session` | httpOnly JWT | 7 days | `{ email, role, name, initials }` |
| `rad-user` | JSON (readable by client) | 7 days | `{ email, role, name, initials }` |

### Roles

| Role | Code | Dashboard |
|------|------|-----------|
| Dispatcher | `dispatcher` | `/dispatcher` |
| Technician | `technician` | `/technician` |
| Billing Manager | `billing` | `/billing` |
| Client | `client` | `/client` |
| System Admin | `admin` | `/admin` |

### Auth Flows

**1. Demo login** (`POST /api/auth/login`)
- Email + password matched against `src/lib/accounts.ts` seed accounts
- Passwords overridable via env vars (`AUTH_*_PASSWORD`)
- Returns `rad-session` + `rad-user` cookies, redirects to role dashboard

**2. Supabase invite** (`POST /api/auth/invite` — admin only)
- Calls `supabaseAdmin.auth.admin.inviteUserByEmail()`
- Supabase sends invite email → user clicks → lands on `/auth/callback`
- Callback exchanges token → stores `sb_access_token` in `sessionStorage`
- User completes onboarding → `POST /api/auth/onboarding-complete` mints platform JWT

**3. JWT fallback invite** (when Supabase not configured)
- `signInvite(email, role)` creates a 48h JWT
- Link: `/join?token=...` → decodes token → redirects to `/onboarding`

**4. Onboarding wizard** (`/onboarding`)
- 5 steps: Role → Identity → Agreements → Credentials → Complete
- On complete: calls `/api/auth/onboarding-complete` with name, role, Supabase access token
- Platform mints `rad-session` cookie → redirects to role dashboard

### Middleware (`src/proxy.ts`)

Runs on every request before page render:

```
Public paths (no auth required):
  /api/auth, /api/sms, /auth, /onboarding, /join, /_next, /favicon

Role-protected paths:
  /dispatcher  → requires role: dispatcher
  /technician  → requires role: technician
  /billing     → requires role: billing
  /client      → requires role: client
  /admin       → requires role: admin
  (admin role can access all paths)

Special rules:
  /            → redirect to dashboard if authenticated, else /login
  /login       → redirect to dashboard if already authenticated
```

---

## API Routes

### Auth

| Method | Path | Auth Required | Description |
|--------|------|---------------|-------------|
| POST | `/api/auth/login` | None | Email + password → session cookies |
| POST | `/api/auth/logout` | Any | Clear session cookies |
| POST | `/api/auth/invite` | Admin | Send Supabase invite email |
| POST | `/api/auth/join` | None | Verify JWT invite token → session |
| POST | `/api/auth/onboarding-complete` | None | Name + role + token → platform session |

### SMS

| Method | Path | Auth Required | Description |
|--------|------|---------------|-------------|
| POST | `/api/sms/send` | Dispatcher/Admin | Manual SMS to patient/tech |
| POST | `/api/sms/notify` | Any | Automated status-triggered notification |
| POST | `/api/sms/webhook` | Twilio signature | Inbound SMS from patient |

---

## SMS Notification Templates

Triggered automatically on order status changes via `POST /api/sms/notify`:

| Status | Message |
|--------|---------|
| `assigned` | "Hi {first}, your mobile X-ray technician {tech} has been confirmed for {time}." |
| `en-route` | "Hi {first}, {tech} is on the way to you now. Please be available." |
| `in-progress` | "Hi {first}, your technician has arrived and is setting up your X-ray." |
| `complete` | "Hi {first}, your X-ray is complete. Results sent within 24 hours." |

Inbound SMS from patients is matched to an order by phone number, stored in `messages` table, and pushed to the dispatcher in real time via Supabase Realtime.

---

## Page Routes

### Dispatcher (`/dispatcher/*`)
| Path | Description |
|------|-------------|
| `/dispatcher` | Fleet dashboard — KPIs, live map, order queue |
| `/dispatcher/assignment` | Order assignment workflow |
| `/dispatcher/fleet` | Technician fleet management |
| `/dispatcher/intake` | Facility management |
| `/dispatcher/billing` | Billing integration view |
| `/dispatcher/credentials` | Technician license management |
| `/dispatcher/messages` | Order communication threads |
| `/dispatcher/monitoring` | Live monitoring view |
| `/dispatcher/orders` | Full order queue |
| `/dispatcher/reports` | Analytics and reports |

### Technician (`/technician/*`)
| Path | Description |
|------|-------------|
| `/technician` | Active order hero view |
| `/technician/manifest` | Daily order list |
| `/technician/equipment` | Equipment checklist |
| `/technician/offline` | Offline sync log + conflict resolution |
| `/technician/scan` | Document scanning |
| `/technician/clinical` | Clinical notes |

### Billing (`/billing/*`)
| Path | Description |
|------|-------------|
| `/billing` | Revenue dashboard — KPIs, charts |
| `/billing/invoices` | Invoice list and detail |
| `/billing/ledger` | Transaction history |
| `/billing/scrubbing` | CPT code compliance scrubbing |
| `/billing/audit` | Compliance audit log |
| `/billing/reports` | Revenue reports |

### Client (`/client/*`)
| Path | Description |
|------|-------------|
| `/client` | Client dashboard |
| `/client/history` | Order history |
| `/client/contact` | Contact information |

### Admin (`/admin/*`)
| Path | Description |
|------|-------------|
| `/admin` | User management — invite, remove, view accounts |
| `/admin/settings` | System settings |

---

## Data Flow

### Order Lifecycle
```
Facility request
    → Order created (status: pending)
    → Dispatcher assigns technician (status: assigned)
        → SMS: "Technician confirmed for [time]"
    → Technician departs (status: en-route)
        → SMS: "Technician is on the way"
    → Technician arrives (status: in-progress)
        → SMS: "Technician has arrived"
    → Procedure complete (status: complete)
        → SMS: "X-ray complete. Results in 24 hours"
    → Invoice generated (status: billed)
        → CPT/ICD-10 scrubbing
        → Audit log entry
```

### Offline Sync (Technician)
```
Field mutation (no connectivity)
    → Write to IndexedDB
    → Add to sync_queue (status: pending)
    → Display SyncStatusBadge: "pending"

On reconnect
    → Flush sync_queue → Supabase
    → On conflict: surface in /technician/offline
    → Manual resolution: choose local or server value
    → sync_queue record: status → "synced"
```

---

## Realtime Architecture

Supabase Realtime subscriptions power live updates across all roles:

| Table | Subscriber | Trigger |
|-------|-----------|---------|
| `orders` | Dispatcher fleet map, order queue | Status changes, new orders |
| `technicians` | Fleet status panel | Online/offline, battery |
| `invoices` | Billing dashboard | Status changes |
| `sync_queue` | Technician offline screen | Sync status changes |
| `messages` | Dispatcher message panel | New inbound SMS |

---

## Environment Variables

### Required for Production

| Variable | Side | Description |
|----------|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client | Supabase publishable key (`sb_publishable_...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Supabase admin key — bypasses RLS |
| `JWT_SECRET` | Server only | Min 32 chars — signs session + invite tokens |

### Optional Services

| Variable | Side | Description |
|----------|------|-------------|
| `TWILIO_ACCOUNT_SID` | Server only | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Server only | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Server only | SMS sender number |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Client | Mapbox GL — falls back to placeholder map if absent |
| `RESEND_API_KEY` | Server only | Resend email API (for custom SMTP in Supabase) |

### Auth Password Overrides (Optional)

| Variable | Default |
|----------|---------|
| `AUTH_DISPATCHER_PASSWORD` | `dispatch123` |
| `AUTH_TECHNICIAN_PASSWORD` | `field123` |
| `AUTH_BILLING_PASSWORD` | `billing123` |
| `AUTH_CLIENT_PASSWORD` | `patient123` |
| `AUTH_ADMIN_PASSWORD` | `admin123` |

---

## Component Architecture

### Layout Shell
Every page renders inside `NavShell` which provides:
- Role-aware `Sidebar` with nav items
- `TopNav` with sync status, user avatar, notifications
- `<main className="flex-1 overflow-y-auto p-6">` content area

### UI Primitives (`src/components/ui/`)
`Button`, `Card`, `Badge`, `Avatar`, `Input`, `Select`, `Modal`, `Tabs`, `DataTable`, `Toast`, `KPICard`, `StatCard`

### Domain Components (`src/components/domain/`)
`OrderCard`, `TechnicianCard`, `CPTCodeBadge`, `ICD10Badge`, `InvoiceRow`, `ComplianceAuditTable`, `LiveMap`, `MapWidget`

### Chart Components (`src/components/charts/`)
All ECharts components are dynamically imported with `ssr: false`:
`RevenueAreaChart`, `DailyJobVolumeChart`, `ProcedureDistributionDonut`, `OrderBarChart`, `RevenueLineChart`, `CPTDonutChart`, `CollectionGauge`, `TechnicianActivityChart`

---

## Design System Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `midnight-navy` | `#0F172A` | App shell, headers |
| `medical-blue` | `#3B82F6` | Primary actions, routine orders |
| `emergency-red` | `#EF4444` | STAT orders, critical alerts |
| `warning-amber` | `#F59E0B` | Urgent orders, warnings |
| `ghost-white` | `#F8FAFC` | Page backgrounds |
| `surface` | `#fcf8fa` | Card surfaces |
| `outline-variant` | `#c6c6cd` | Borders, dividers |

STAT orders always display with `pulse-stat` animation + `emergency-red` border.
CPT codes, ICD-10 codes, invoice IDs, dollar amounts — always `font-mono`.
