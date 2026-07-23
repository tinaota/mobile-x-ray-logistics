# Figma Make Prompt — High-Fidelity Upgrade of Mobile X-Ray Logistics Wireframes

> Paste everything below the divider into the Figma Make chat for the wireframe file
> (`iOS Toggle Switch Animation` / `Azr413IXIofmQZWOOU8MRE`).
> Source of truth for all values: `tailwind.config.ts` in github.com/tinaota/mobile-x-ray-logistics
> (NOT `docs/DESIGN.md`, which is a stale token export).

---

Add a **high-fidelity design set that matches the production prototype** of the Mobile X-Ray Logistics platform to this file — **WITHOUT touching the existing grayscale wireframes**. I will present low-fidelity and high-fidelity side by side to stakeholders, so both must coexist:

- **Keep every existing lo-fi wireframe screen exactly as it is** (grayscale, unchanged).
- **Build a parallel hi-fi version of every screen** using the visual system below, plus every missing screen listed in section 6 (missing screens only need a hi-fi version).
- Add a **Lo-Fi / Hi-Fi toggle** (segmented control in the viewer's top toolbar, next to the role tabs) so any screen can be flipped between fidelities during a presentation; default to Hi-Fi.
- Keep the Architecture / Site Map / User Flows / User Journeys section exactly as it is (teal treatment, unchanged), and keep the existing viewer structure (role tabs, desktop 1280px + mobile widths).

## 1. Design tokens (use these exact values)

**Brand & status colors**
- `midnight-navy #0F172A` — sidebar background, dark surfaces, headers
- `medical-blue #3B82F6` — primary actions, links, routine priority, active nav
- `emergency-red #EF4444` — STAT surfaces, alert accents. **Exception:** any red background that carries white text (e.g. the STAT badge) must use `#DC2626` instead — `#EF4444` with white text is only 3.76:1 contrast and fails WCAG 1.4.3.
- `warning-amber #F59E0B` — urgent priority, warnings
- `ghost-white #F8FAFC` — page background · `slate-gray #475569` — secondary text
- Service-line accents: radiology `indigo #4F46E5` (deep `#312E81`), laboratory `rose #E11D48` and `emerald #059669`
- Acuity scale: high `#DC2626`, medium `#D97706`, low `#2563EB`

**Surface system (Material-style, lilac-tinted)**
- surface `#fcf8ff`; containers: lowest `#ffffff`, low `#f5f2ff`, default `#f0ecf9`, high `#eae6f4`, highest `#e4e1ee`
- on-surface `#1b1b24`, on-surface-variant `#464555`; outline `#777587`, outline-variant `#c7c4d8`, subtle border `#E2E8F0`
- primary `#3525cd` (container `#4f46e5`); secondary `#ba0035`; error `#ba1a1a`

**Typography**
- Body/UI: **Inter**
- Data (CPT codes, ICD-10, license numbers, invoice IDs, dollar amounts, ETAs, equipment IDs): **JetBrains Mono**, 0.875rem/500, letter-spacing −0.02em — data is NEVER in Inter
- Labels/eyebrows/nav: **Space Grotesk**, 0.75rem/600, uppercase, wide tracking
- Headlines: **Hanken Grotesk** — headline-lg 2rem/700, headline-md 1.5rem/600

**Shape, depth, motion**
- Radii: proto-sm 10px (inputs, chips), proto-md 14px (cards), proto-lg 20px (panels), proto-xl 26px (hero cards) — the iOS "Liquid Glass" curves
- Shadows: card `0 2px 4px rgba(0,0,0,.08)`; proto-card `0 1px 2px + 0 4px 14px rgba(15,23,42,.05)`; proto-pop `0 8px 30px rgba(15,23,42,.14)` (hero cards, modals); proto-fab `0 10px 24px rgba(59,130,246,.38)`; sidebar `2px 0 8px rgba(15,23,42,.15)`
- Animations: `pulse-stat` (opacity 1→0.7, 1.5s ease-in-out, infinite) on all STAT indicators; fade-in 0.2s with 4px translateY on content; slide-up with cubic-bezier(.32,.72,0,1) for sheets; animated (not instantaneous) state transitions — the lo-fi's instant swaps were flagged in UX review

## 2. Shells

- **Dispatcher, Billing, Admin** — desktop shell: fixed 256px sidebar in midnight-navy with shadow; brand block on top (bold title + slate-gray subtitle); nav buttons are Space Grotesk uppercase 12px, rounded-lg; active item = medical-blue text, 4px right border in medical-blue, translucent primary-container fill, slight right shift; footer: Settings, Help & Support, Sign Out (hover red) + avatar with online dot. To its right, a sticky 64px TopNav: translucent white (`surface-container-lowest` at 90% + backdrop blur), hairline bottom border; left = page title (16px semibold) + subtitle; right = sync-status badge (Synced/Syncing/Conflict/Offline with colored icon), search, bell (red count dot), avatar.
- **Dispatcher TopNav center**: segmented pill control "All Fleets / ⚡ Radiology / 💧 Laboratory" — active segment is white with the service-line accent text (indigo for radiology, rose for laboratory).
- **Technician** — bespoke mobile-first shell (no navy sidebar): bottom/compact nav "Field View, Manifest, Clinical, Scan & QC, Equipment, Offline Log", battery + sync status always visible.
- **Client** — bespoke mobile shell "MY X-RAY / Home & Care Visit", centered max-width column, sticky FAB bottom-right.
- **Copilot** — full-screen dedicated chat chrome "CO-PILOT / AI Operations Assistant".

**Role identities:** Dispatcher "RAD-COMMAND / Dispatch & Fleet Ops" · Technician "RAD-FIELD / Field Technician" · Billing "REVENUE COMMAND / Unified Logistics Suite" (with a "New Reconciliation" primary CTA in the TopNav) · Client "MY X-RAY" · Copilot "CO-PILOT".

**Nav items per role** — Dispatcher: Operations, Assignment, Intake, Credentials, Billing, Reports. Technician: Field View, Manifest, Clinical, Scan & QC, Equipment, Offline Log. Billing: Dashboard, Ledger, Audit Logs, Reports, Compliance. Client: Appointment, Request, History, Contact.

## 3. Component rules

- **KPICard**: white card, rounded-xl, subtle border + soft shadow; uppercase Space Grotesk label; big value in JetBrains Mono 3xl bold (navy); footer row = trend icon + bold colored subtext (green positive / red negative / amber warning / blue info).
- **PriorityBadge**: pill, uppercase Space Grotesk. STAT = solid `#DC2626` bg, white text, white dot, `pulse-stat` animation. URGENT = warning-amber on navy. ROUTINE = surface-container-high pill with dark text. Every badge pairs color WITH a text label — never color-only.
- **OrderStatusBadge**: pastel bordered pills — assigned blue, en-route indigo, in-transit rose, in-progress amber, complete emerald, billed slate.
- **SyncStatusBadge**: synced green, pending amber, conflict red, offline gray — required on every technician screen.
- **Map (LiveMap)**: full-bleed map panel with hub marker, technician markers, order markers colored by priority (STAT red pulsing).
- **Buttons**: minimum touch target 48px; primary = medical-blue; danger = red; visible focus ring on everything interactive.
- **Forms**: every input has a visible attached label directly above it (annotate label-for-input association); 44px input height; focus ring in medical-blue; error text in `#ba1a1a` with icon.
- **Modals**: rounded-proto-lg, shadow proto-pop, annotate "focus moves into dialog on open, returns to trigger on close".

## 4. Screens — hi-fi versions of the existing wireframes (lo-fi originals stay untouched)

**Dispatcher** — Operations hub: tabbed (Fleet / Monitoring / Field Units / Messages); 4-up KPI row (Active Orders, Technicians Online n/total, Avg Response Time 14 min, Completion Rate 94%); LiveMap; order queue grouped STAT (red, pulsing) → Urgent (amber) → Routine (blue); technician cards with battery/sync. Intake: patient intake form with Radiology/Laboratory modality selector as real selectable cards (keyboard accessible, labeled group). Reports: response-time and completion analytics with date range.

**Technician** — Field View: mobile-first, full-bleed map with "You" + destination markers; active-order hero card with Priority/OrderStatus/Sync badges; big stacked action buttons driving the status machine (Start Navigation → Start Procedure → Complete); success overlay on completion; lab orders swap in a phlebotomy draw panel. Manifest: time-sorted compact order cards. Equipment: checklist with JetBrains Mono equipment IDs + calibration dates. Offline Log: sync queue with conflict resolution (field vs server value, choose one) and "Sync All".

**Billing** — Dashboard: 5-up KPI row (Total Revenue $1.27M +12.4%, Collection Rate 94.2%, Clean Claim Rate 91.8%, Avg Invoice Value $312, DSO colored vs 45/55-day target); radial collection gauge + revenue line chart side by side; CPT donut + code-scrubber log widget (rows like `ERR_MISSING_ICD10 · ORD-008`). Invoices: table with flag icons on flagged rows; all codes/amounts in JetBrains Mono. Scrubbing: run-scrub panel with fix/auto-correct/escalate per finding. Audit: verified/flagged/pending table with ± revenue impact column.

**Client** — Appointment tracking: gradient hero status card (rounded 26px, proto-pop shadow, white text; gradient shifts by state — blue `#3B82F6→#1D4ED8` scheduled, navy en-route, amber in-progress, green complete) containing eyebrow label, big title, and live ETA in JetBrains Mono 3xl with a pinging dot; annotate the hero card as a live region (status changes announced). Below: vertical status stepper, **contextual prep checklist**, "What to Expect" card. Sticky FAB labeled **"Call Care Coordinator"** (not "Call Dispatcher"). STAT visits show an amber-tint alert banner. Request: full request form (labeled inputs, preferred-time as a radio group). History, Contact: consistent card styling.

**Copilot** — full-screen chat: message thread, persona-aware suggestions, quick-action chips, JetBrains Mono for any order/CPT references.

**Admin** — settings/overview pages in the standard desktop shell.

## 5. Fix list — what was wrong in the lo-fi, and the required correction (applied in the hi-fi set; the lo-fi originals are kept as-is for the before/after presentation)

| # | Lo-fi problem | Hi-fi correction |
|---|---|---|
| 1 | Grayscale, no brand system | Apply full token system from section 1 (navy sidebar, colors, 4 font families, proto radii/shadows) |
| 2 | Built on stale 3-role spec | All 6 areas present: dispatcher, technician, billing, client, copilot, admin |
| 3 | STAT emphasis illegible/flat | STAT = `#DC2626` + white + pulse everywhere (≥4.5:1 contrast) |
| 4 | Inputs without attached labels | Every form field gets a visible, associated label |
| 5 | No focus/keyboard affordances | Visible focus rings; modals annotated for focus trap + return |
| 6 | No live-status affordance | Client hero status/ETA annotated as polite live region |
| 7 | Small touch targets | All interactive elements ≥48px |
| 8 | Instant state changes | Animated transitions (fade-in, slide-up, pulse-stat) |
| 9 | "Call Dispatcher" label | "Call Care Coordinator" |
| 10 | Missing prep checklist on client tracking | Add contextual prep checklist section |

## 6. Missing screens — add these (hi-fi, same system)

1. **Dispatcher / Assignment** — order-to-technician assignment board: unassigned queue on the left (STAT first), technician roster on the right with zone, load, and distance; assign action per pair; include a **no-show / reassign** affordance on active assignments.
2. **Dispatcher / Messages** — split conversation view: thread list left, active conversation right, quick-reply chips ("REQUEST ETA", "REROUTE SENT"), SMS toggle.
3. **Dispatcher / Monitoring** — realtime counters, response-time card with sparkline, map density / network health card.
4. **Dispatcher / Credentials** — technician credential table: license number (JetBrains Mono), credential expiry, status pills Valid / Expiring / Expired.
5. **Dispatcher / Billing** — dispatcher-side billing summary linking completed orders to invoice status.
6. **Technician / Scan & QC** — image capture list with QC pass/fail states and PACS upload status.
7. **Technician / Clinical** — clinical documentation form (labeled fields) with procedure notes and vitals.
8. **Billing / Ledger** — transaction history table: date, invoice ID, facility, amount (all data in JetBrains Mono), running balance.
9. **Onboarding — 5 steps** (wireframe only had 3): Role → Identity → **Agreements (HIPAA)** → Credentials → Complete, with a step indicator.
10. **Auth** — Login screen + **/join invite-token flow** (enter invite code → set up profile).

Desktop screens at 1280px; technician and client screens mobile-first at 390px with a desktop variant where the viewer supports both.
