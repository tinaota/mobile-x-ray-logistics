# Client Portal — UX Discovery & Journey Map
## Mobile X-Ray Logistics Platform

**Version:** 1.0
**Status:** Ready for Prototyping
**Audience:** UX/Product, Frontend, Stitch Design System

---

## Executive Summary

The client portal (`/client`) has one critical design failure: **patients are passive**. They can only view appointments created for them by a dispatcher. There is no way for a patient to request, initiate, or fill in their own appointment. The journey needs to start with the patient, not the dispatcher.

Additionally, the existing tracking page has three functional bugs and five missing features that break the experience after the appointment is confirmed.

---

## Persona

**Primary User: Patient / On-Site Caregiver**
- Needs: Peace of mind, accurate ETAs, clear instructions, transparent results timeline
- Context: Often elderly, anxious, or in a care facility — UI must be calm, clear, and simple
- Device: Mobile-first (phone in hand while waiting)

**Supporting Actor: Care Coordinator / Dispatcher**
- Receives appointment requests submitted by patient
- Assigns technician, updates order status
- Call volume deflected when patient has real-time tracking

---

## Current State vs. Correct Journey

### Current Flow (Broken)
```
Dispatcher creates order
    → Patient logs in
    → Patient sees appointment (passive, no agency)
    → Patient has no way to request, initiate, or add access info
```

### Correct Flow
```
Patient submits appointment request
    → Dispatcher reviews + assigns technician
    → Patient receives confirmation + prep instructions
    → Patient tracks technician in real time
    → Procedure completed
    → Patient tracks results until report delivered
```

---

## Corrected Journey Map

| | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 |
|---|---|---|---|---|---|---|
| **Name** | Request | Confirmation | Live Tracking | On-Site | Scan Complete | Results |
| **Patient action** | Fills appointment request form | Reviews confirmed details, reads prep checklist | Watches live tech location + ETA | Greets technician, procedure taken | Waits for radiologist review | Views report sent to doctor |
| **System trigger** | Patient submits `/client/request` | Order status → `assigned` | Order status → `en-route` | Order status → `in-progress` | Order status → `complete` | `reportStatus` → `delivered` |
| **UI shown** | Request form with address, procedure type, access notes | Appointment card + contextual prep checklist (dismissible) | Live map, ETA countdown, technician name | "Technician Has Arrived" banner, step 4 active | Results pending banner, step 5 active | Step 6 active, results CTA |
| **Patient emotion** | Empowered — I initiated this | Informed + prepared | Calm — I can see progress | Present, cooperative | Waiting, needs reassurance | Closure + gratitude |
| **Key risk** | Form is too complex → abandonment | Prep info not seen → delay on arrival | Map is static / stale → anxiety | — | No feedback on wait time → repeated calls | No clear next step → confusion |

---

## Screen Inventory

### Existing Screens
| Route | Current State | Issues |
|---|---|---|
| `/client` | Active order tracker with 6-step stepper, map, results banner | 3 bugs (see below), missing prep checklist + ETA + sticky CTA |
| `/client/history` | List of completed orders with report status badges | No issues — functional |
| `/client/contact` | Care coordinator card + FAQ + emergency 911 | Prep checklist buried here instead of contextual |

### Missing Screens
| Route | Purpose |
|---|---|
| `/client/request` | **NEW** — Patient appointment request form |

---

## Bug Report (Fix Before Prototyping)

### Bug 1: "Results Ready" Step Never Activates
**File:** `src/app/client/page.tsx` — `STATUS_TO_STEP`

Both `complete` and `billed` map to step 4 ("Scan Complete"). Step 5 ("Results Ready") has no trigger and will always display as grey/inactive regardless of report status.

**Fix:** Promote stepper to step 5 when `reportStatus === "delivered"`

```ts
// Current — broken
const STATUS_TO_STEP: Record<OrderStatus, number> = {
  complete: 4,
  billed:   4,   // ← step 5 never reached
};

// Fixed
const activeStep = reportStatus === "delivered" ? 5
  : order ? STATUS_TO_STEP[order.status]
  : -1;
```

---

### Bug 2: Hardcoded Map Coordinates
**File:** `src/app/client/page.tsx` — `mapMarkers`

Technician pin is pinned to static Phoenix coordinates `lat: 33.462, lng: -112.089` for all orders everywhere. It never moves.

**Fix:** Pull `lat` / `lng` from `technicians` table in real time via Supabase Realtime subscription on the `technicians` channel.

---

### Bug 3: No Real-Time Status Updates
**File:** `src/lib/hooks/useOrders.ts`

`useOrders()` fetches orders once on mount with no live subscription. Patient must manually refresh to see status change from `assigned` → `en-route` → `in-progress`.

**Fix:** Add Supabase Realtime `.channel().on('postgres_changes', { event: 'UPDATE', table: 'orders' })` subscription inside the hook.

---

## Missing Features (Prototyping Sprint)

### Feature 1: Appointment Request Form
**Route:** `/client/request`
**Trigger:** "Request Appointment" button on empty state + persistent nav item

**Form fields:**
| Field | Type | Required |
|---|---|---|
| Patient name | Text (pre-filled from session) | Yes |
| Date of birth | Date | Yes |
| Service address | Text + unit/floor/room | Yes |
| Procedure type | Dropdown (Chest X-Ray, Hip X-Ray, Spine, Extremity, etc.) | Yes |
| Preferred date | Date picker | Yes |
| Preferred time | Time selector (Morning / Afternoon / Evening) | Yes |
| Access instructions | Textarea (gate code, parking, elevator, floor) | No |
| Special notes | Textarea | No |
| Emergency contact | Phone | No |

**On submit:** Creates order row in `orders` table with `status: pending`, notifies dispatcher queue via Supabase Realtime.

**Empty state CTA:** Update `/client` empty state — replace "Your care coordinator will be in touch" with a primary **"Request Appointment"** button linking to `/client/request`.

---

### Feature 2: Contextual Prep Checklist
**Trigger:** Order status changes to `assigned`
**Placement:** Dismissible card above appointment card
**Dismiss:** Stored in `localStorage` per order ID so it doesn't reappear

**Checklist items:**
- Remove all jewelry and metal accessories near the area being X-rayed
- Wear loose, comfortable clothing (avoid metal zippers/buttons)
- Clear a pathway to the room — the technician brings portable equipment
- Have your ID and insurance card accessible
- A family member or caregiver is welcome to stay in the room

**Note:** This information currently exists as FAQ in `/client/contact` but is not surfaced contextually. It needs to appear at the right moment — when the patient is confirmed, not buried in a help page.

---

### Feature 3: ETA Display
**Trigger:** Order status = `en-route`
**Placement:** Beneath technician name in appointment card
**Display:** "~12 min away" — derived from technician `last_seen` timestamp + distance field on order

---

### Feature 4: Access Instructions Message
**Trigger:** Status = `assigned` or `en-route`
**Placement:** Below appointment card — single text field with "Send to Technician" button
**Purpose:** Patient can send gate code, parking instructions, or floor number
**Backend:** Writes to `messages` table with `sender_role: "patient"`, `channel: "in_app"`
**Tech sees it:** In `/dispatcher/messages` order thread

---

### Feature 5: Sticky "Call Care Coordinator" Button
**Current state:** Buried at the bottom of the page inside a card — patient must scroll past the entire stepper to find it
**Fix:** Float as FAB (bottom-right, above nav) when an active order exists
**Dismiss condition:** Hidden after order status = `complete`

---

## Post-Results State (Phase 6)

When `reportStatus === "delivered"`:

1. Stepper step 6 activates ("Results Ready")
2. Results banner updates to green: "Your report has been sent to your doctor"
3. Bottom CTA changes from "Call Care Coordinator" → "Results Sent to Your Doctor"
4. Add supporting copy: "If you haven't heard from your referring doctor within 48 hours, contact their office directly."

---

## Navigation Changes

| Current nav item | Proposed change |
|---|---|
| (no request entry point) | Add "Request Appointment" to nav + empty state |
| "Contact" | Keep — but remove prep checklist from FAQ (it's contextual now) |

---

## Design Principles for This Portal

1. **One thing per screen.** The patient should never feel overwhelmed. Each phase has one primary action.
2. **Calm palette.** No emergency red in the patient UI. STAT orders use amber (`warning-amber`), not red.
3. **Progress = trust.** Every status change should feel like a positive signal, not clinical jargon.
4. **Mobile-first.** Max width `max-w-2xl`, large touch targets (`h-12` minimum), readable at arm's length.
5. **Contextual information.** Don't put everything on one page. Surface the right info at the right moment.

---

## Prototype Scope (Sprint 1)

| Priority | Item | Effort |
|---|---|---|
| P0 | Fix Bug 1 — Results Ready step | 30 min |
| P0 | Fix Bug 3 — Realtime subscription | 1 hour |
| P1 | Appointment Request Form `/client/request` | 1 day |
| P1 | Contextual Prep Checklist | 2 hours |
| P1 | Sticky Care Coordinator FAB | 1 hour |
| P1 | Empty state → Request CTA | 30 min |
| P2 | ETA display | 2 hours |
| P2 | Access instructions message | 2 hours |
| P2 | Fix Bug 2 — Live map coordinates | 3 hours |
| P2 | Post-results state (Phase 6) | 1 hour |
