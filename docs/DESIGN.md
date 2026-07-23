---
name: Mobile X-Ray Logistics System
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd8e5'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#f0ecf9'
  surface-container-high: '#eae6f4'
  surface-container-highest: '#e4e1ee'
  on-surface: '#1b1b24'
  on-surface-variant: '#464555'
  inverse-surface: '#302f39'
  inverse-on-surface: '#f3effc'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#ba0035'
  on-secondary: '#ffffff'
  secondary-container: '#e21e49'
  on-secondary-container: '#fffbff'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  background: '#F8FAFC'
  on-background: '#1b1b24'
  surface-variant: '#e4e1ee'
  border-subtle: '#E2E8F0'
  midnight-navy: '#0F172A'
  medical-blue: '#3B82F6'
  emergency-red: '#EF4444'
  stat-badge-red: '#DC2626'
  warning-amber: '#F59E0B'
  ghost-white: '#F8FAFC'
  slate-gray: '#475569'
  radiology-indigo: '#4F46E5'
  radiology-indigo-deep: '#312E81'
  laboratory-rose: '#E11D48'
  laboratory-emerald: '#059669'
  acuity-high: '#DC2626'
  acuity-medium: '#D97706'
  acuity-low: '#2563EB'
  blue-tint: '#eff5ff'
  green-ink: '#14633a'
  green-tint: '#effaf2'
  warning-amber-ink: '#92560a'
  warning-amber-tint: '#fef6e7'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: -0.02em
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
  proto-sm: 10px
  proto-md: 14px
  proto-lg: 20px
  proto-xl: 26px
spacing:
  touch-target-min: 48px
  touch-target: 44px
  gutter: 1rem
  margin-mobile: 1.5rem
  margin-desktop: 2rem
  widget-gap: 1.25rem
  section-padding: 1.5rem
  card-padding: 1rem
---

# Design System — Mobile X-Ray Logistics Platform

> Source of truth: `tailwind.config.ts`. This document mirrors it for designers; if they
> ever disagree, the Tailwind config wins and this file must be updated.
> Visual reference: the hi-fi prototypes at https://marsh-slush-59084662.figma.site
> (toggle Lo-Fi / ✦ Hi-Fi per screen). Designer workflow: see `docs/design-handoff.md`.

## 1. Brand identity

Dual-service field-medicine platform (Radiology + Laboratory) with six product areas, each
with its own identity but one shared system:

| Area | Identity | Shell |
|---|---|---|
| Dispatcher | **RAD-COMMAND** — Dispatch & Fleet Ops | Desktop, navy sidebar |
| Technician | **RAD-FIELD** — Field Technician | Mobile-first, bespoke shell |
| Billing | **REVENUE COMMAND** — Unified Logistics Suite | Desktop, navy sidebar |
| Client | **MY X-RAY** — Home & Care Visit | Mobile, centered column |
| Copilot | **CO-PILOT** — AI Operations Assistant | Full-screen chat |
| Admin | Config & users | Desktop, navy sidebar |

Service-line accents run through every role: **Radiology = indigo `#4F46E5`** (deep
`#312E81`), **Laboratory = rose `#E11D48`** with emerald `#059669` for lab-success states.

## 2. Color

### 2.1 Brand & status

| Token | Hex | Usage |
|---|---|---|
| `midnight-navy` | `#0F172A` | Sidebar, dark surfaces, primary text on light |
| `medical-blue` | `#3B82F6` | Primary actions, links, routine priority, active nav |
| `emergency-red` | `#EF4444` | STAT *surfaces & accents* (borders, map markers, tints) |
| **STAT badge red** | `#DC2626` | **Any red background carrying white text.** `#EF4444` + white = 3.76:1 and fails WCAG 1.4.3; `#DC2626` + white ≈ 4.8:1 passes |
| `warning-amber` | `#F59E0B` | Urgent priority, warnings (pair with navy text, never white) |
| `ghost-white` | `#F8FAFC` | Page background |
| `slate-gray` | `#475569` | Secondary text, inactive icons |
| `acuity-high/medium/low` | `#DC2626` / `#D97706` / `#2563EB` | Clinical acuity scale |

### 2.2 Surface system (Material-style, lilac-tinted)

surface `#fcf8ff` → containers: lowest `#ffffff`, low `#f5f2ff`, default `#f0ecf9`,
high `#eae6f4`, highest `#e4e1ee`. Text: on-surface `#1b1b24`, on-surface-variant
`#464555`. Strokes: outline `#777587`, outline-variant `#c7c4d8`, border-subtle `#E2E8F0`.
Accent primary `#3525cd` (container `#4f46e5`), secondary `#ba0035`, error `#ba1a1a`.

Cards sit on white or container-lowest; the page canvas is ghost-white/surface; hover and
selected fills step up the container scale.

## 3. Typography

Four families, strict roles — mixing them is the fastest way to break the look:

| Family | Role | Never used for |
|---|---|---|
| **Inter** | Body copy, UI text, form values | Data values, labels |
| **JetBrains Mono** | CPT codes, ICD-10, license numbers, invoice IDs, dollar amounts, ETAs, equipment IDs, KPI values | Prose |
| **Space Grotesk** | Uppercase labels, eyebrows, nav items, badge text (12px/600, wide tracking) | Body copy |
| **Hanken Grotesk** | Headlines (headline-lg 32px/700, headline-md 24px/600) | Data |

Rule of thumb: *if a screen reader would spell it out character by character, it's
JetBrains Mono.*

## 4. Shape, depth, motion

- **Radii** — standard scale (`sm` 2px → `xl` 12px) for dense UI; **proto scale** for the
  "Liquid Glass" prototype look: proto-sm 10px (inputs, chips), proto-md 14px (cards),
  proto-lg 20px (panels, modals), proto-xl 26px (hero cards).
- **Shadows** — `card` 0 2px 4px rgba(0,0,0,.08) · `card-lg` 0 8px 24px rgba(0,0,0,.12) ·
  `sidebar` 2px 0 8px rgba(15,23,42,.15) · `proto-card` 0 1px 2px + 0 4px 14px
  rgba(15,23,42,.05) · `proto-pop` 0 8px 30px rgba(15,23,42,.14) (hero cards, modals) ·
  `proto-fab` 0 10px 24px rgba(59,130,246,.38).
- **Motion** — `pulse-stat` opacity 1→0.7, 1.5s ease-in-out infinite (mandatory on STAT
  indicators) · `fade-in` 0.2s + 4px rise (content entering) · `slide-up` 0.3s
  cubic-bezier(0.32,0.72,0,1) (sheets) · `slide-in` 0.25s (sidebar). State changes are
  always animated — instantaneous swaps were an explicit UX-review finding.

## 5. Components

### 5.1 Buttons (`Button.tsx`)

Variants: `primary` medical-blue/white · `secondary` navy/white · `outline` outline stroke ·
`ghost` · `danger` emergency-red · `warning` amber + **navy** text · `stat` red, bold
uppercase wide-tracked. Sizes: sm h-32px, md h-40px, lg h-48px, xl h-56px, icon 40×40px.
All buttons: semibold, visible focus ring (2px, offset 2, in the variant color), 50%
opacity when disabled, spinner replaces leading icon when loading.

### 5.2 Badges (`StatusBadge.tsx`) — status is never color-only; every badge has a text label

- **PriorityBadge** — pill, Space Grotesk bold uppercase widest-tracking, leading 6px dot.
  STAT = solid red + white text/dot (**use `#DC2626` under white text**), dot pulses when
  animated. URGENT = amber bg + navy text/dot. ROUTINE = surface-container-high +
  on-surface-variant.
- **OrderStatusBadge** — pastel bordered pills: pending amber-tint, assigned blue,
  en-route indigo, in-progress green, in-transit rose (lab), complete emerald, billed
  neutral container.
- **SyncStatusBadge** — synced green, syncing blue (pulsing dot), conflict orange,
  offline slate. Required on every technician surface.

### 5.3 KPICard

White card, rounded-xl, shadow-sm, `outline-variant/30` border, p-24px. Anatomy top→down:
Space Grotesk uppercase label (slate-gray, 8px below) → value in **JetBrains Mono 30px
bold** (navy by default) → 16px gap → footer row: 16px trend icon + bold colored subtext
(positive green-600, negative emergency-red, warning amber, info medical-blue).

### 5.4 Shells

- **Desktop sidebar** (dispatcher/billing/admin): fixed 256px, midnight-navy, sidebar
  shadow. Brand block top; nav = Space Grotesk uppercase 12px, rounded-lg, px-16 py-12;
  active = medical-blue text + 4px right border + translucent primary-container fill +
  slight right shift. Footer: Settings / Help & Support / Sign Out (hover red) + avatar
  with status dot.
- **TopNav**: sticky 64px, `surface-container-lowest/90` + backdrop blur, hairline bottom
  border. Left: 16px semibold title + subtitle. Dispatcher center: segmented pill
  All Fleets / ⚡ Radiology / 💧 Laboratory (active segment white with service-line accent
  text). Right: sync badge, search, bell with red count dot, avatar.
- **Technician / Client / Copilot** use bespoke mobile-first shells — never the navy
  sidebar.

### 5.5 Forms & modals

Inputs 44px tall, proto-sm radius, medical-blue focus ring; every input has a visible
label above it, programmatically associated (`htmlFor`/`id`). Errors in `#ba1a1a` with
icon + text. Modals: proto-lg radius, proto-pop shadow; focus moves into the dialog on
open, Tab is trapped, Escape closes, focus returns to the trigger on close.

## 6. Accessibility (non-negotiable)

1. Text contrast ≥ 4.5:1 — the reason STAT badges use `#DC2626` under white.
2. Status/priority always color **plus** text label (WCAG 1.4.1).
3. Touch targets ≥ 48px on mobile surfaces; 44px minimum inputs on desktop.
4. Visible focus rings on all interactive elements; modal focus trap + return.
5. Live status (client tracking status/ETA) announced via polite live regions.
6. All form labels associated with their inputs; icon-only buttons have `aria-label`.
7. High-contrast mode for technician field screens (high ambient light).

> Known code drift (2026-07): `PriorityBadge` still ships `bg-emergency-red`, and
> `Modal.tsx` lacks the focus trap — `docs/ada_accessibility_fixes.patch` contains both
> fixes and has not been applied yet. Design specs above describe the *required* state.

## 7. Medical data display rules

- CPT (`71046`), ICD-10 (`J18.9`), R0070 surcharge, invoice IDs, license numbers, dollar
  amounts: always JetBrains Mono.
- Invoice math: `(CPT base + R0070) × urgency factor (STAT 2.0 / Urgent 1.5 / Routine 1.0)
  + mileage`. Flag any invoice missing an ICD-10.
- STAT is sacred: red + pulse + top of every queue, in every role, at every fidelity.
