---
name: Mobile X-Ray Logistics System
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
  midnight-navy: '#0F172A'
  medical-blue: '#3B82F6'
  emergency-red: '#EF4444'
  warning-amber: '#F59E0B'
  ghost-white: '#F8FAFC'
  slate-gray: '#475569'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
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
spacing:
  touch-target-min: 48px
  gutter: 1rem
  margin-mobile: 1.5rem
  margin-desktop: 2rem
  widget-gap: 1.25rem
---

This `design.md` file is structured specifically for your project workflow, integrating the brand standards, onboarding logic, and technical requirements from your documentation.

# Design Specification: Mobile X-Ray Operations & Billing Platform (v5.0)

## 1. Brand Identity & Design System
The visual identity is designed to bridge the gap between clinical precision and logistical velocity. It establishes a "Unified Command" that is authoritative for administrative roles while remaining highly functional for field use.

### 1.1 Core Color Palette
| Name | Hex | Usage |
| :--- | :--- | :--- |
| **Midnight Navy** | `#0F172A` | Primary Brand, Sidebars, and Headers. |
| **Medical Blue** | `#3B82F6` | Primary Actions, Buttons, and Links. |
| **Emergency Red** | `#EF4444` | STAT Priority, Alerts, and Critical Errors. |
| **Warning Amber** | `#F59E0B` | Pending status, Warning, and Interstitial states. |
| **Ghost White** | `#F8FAFC` | Main background canvas. |
| **Slate Gray** | `#475569` | Secondary text and inactive icons. |

### 1.2 Typography
* **Inter / Geist:** Primary UI Sans-serif optimized for legibility in high-density dashboards.
* **JetBrains Mono:** Code/Data Monospaced used for CPT codes, ICD-10, and numeric Billing identifiers.

### 1.3 Component Standards
* **Touch Targets:** Minimum 48px x 48px for all mobile interactive elements in the Technician PWA.
* **Corner Radius:** 6px - 8px radius for containers and primary buttons to maintain a "soft-tech" feel.
* **Shadows:** Subtle 2px-4px elevation for cards to separate dashboard widgets.
* **High-Contrast Mode:** Mandatory implementation for Technician mobile views to counteract high ambient light in the field.

---

## 2. Onboarding & User Access Architecture

### 2.1 The Gatekeeper Logic
The onboarding flow serves as a HIPAA-compliant filter that routes users to interfaces optimized for their specific hardware and role.

1.  **Secure Account Creation:** Initiates AES-256 encryption for user profiles and prepares the tamper-proof audit log.
2.  **Verification:** Users link accounts to a Facility ID; Technicians upload digital credentials for automated verification.
3.  **The Role Selection Fork:** Users choose between Dispatcher, Field Technician, or Billing Manager, which dictates the UI layout and permission sets.
4.  **Device-Aware Routing:** System detects hardware to prompt PWA installation for Technicians or desktop routing for Dispatchers.

### 2.2 Role Mapping
| Role | Optimal Hardware | Core Functional Focus |
| :--- | :--- | :--- |
| **Dispatcher** | Desktop / Large Display | Logistics & Fleet Orchestration. |
| **Field Technician** | Mobile / Tablet PWA | Clinical Procedures & Field Execution. |
| **Billing Manager** | Desktop / Laptop | Revenue Lifecycle & Compliance Audit. |

---

## 3. The Billing Engine (Revenue Manufacturing)
The platform automatically "manufactures" invoices by aggregating clinical data and logistics metrics immediately upon job completion.

### 3.1 The Revenue Formula
Total Invoice = (CPT Base + R0070) x Urgency Factor + (Distance x $/Mile)

### 3.2 Calculation Variables
* **Clinical Base (CPT):** Determined by specific procedure codes like Chest X-ray 71045.
* **Logistics (R0070):** Automatic application of the Portable X-Ray Equipment surcharge.
* **Mileage & Zone:** GPS-calculated fees based on hub-to-patient distance.
* **Urgency Modifiers:** Automatic percentage markups for "STAT" or after-hours service.

---

## 4. UX Design Challenges

### 4.1 Dispatcher (Orchestration)
* **Density vs. Priority:** Managing high-volume unit markers via Mapbox GL JS without losing visibility of "STAT" orders.
* **Trust:** Visualizing the logic behind automated suggestions to build trust in system orchestration.

### 4.2 Field Technician (Execution)
* **Contextual Reliability:** Designing high-contrast themes and large touch targets for low-light or shielded environments.
* **Offline-First:** Robust logging for areas with zero signal.

### 4.3 Billing Manager (Audit)
* **Auditable Automation:** Designing a UI that "shows its work" regarding manufactured fees.
* **Efficiency:** One-click scrubbing interfaces to fix CPT/ICD-10 misalignments.

---

## 5. Technical & Compliance Specs
* **Logistics:** Mapbox GL JS, 50-meter Geofencing, and Route Optimization.
* **Security:** AES-256 encryption at rest, TLS 1.3 in transit, and tamper-proof HIPAA audit logs.
* **Stack:** React.js, React Native, Node.js, and PostgreSQL.
