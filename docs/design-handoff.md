# Designer Handoff — Matching the Hi-Fi Prototypes 1:1

> Audience: designers joining the Mobile X-Ray Logistics project.
> Goal: any screen you produce must be indistinguishable from the hi-fi prototypes.
>
> **References, in order of authority:**
> 1. Design tokens — [`docs/DESIGN.md`](DESIGN.md) (mirrors `tailwind.config.ts`, the source of truth)
> 2. Hi-fi prototypes — https://marsh-slush-59084662.figma.site (toggle **✦ Hi-Fi** per screen; keep Lo-Fi for before/after context only — never restyle the lo-fi set)
> 3. Figma Make working file — https://www.figma.com/make/Azr413IXIofmQZWOOU8MRE
> 4. Full screen-by-screen spec — [`docs/figma-make-hifi-prompt.md`](figma-make-hifi-prompt.md)

---

## 1. The 1:1 rules

Match these exactly — they are what makes a screen read as "ours":

| Element | Spec |
|---|---|
| Desktop frame | 1280 × 720 minimum; content column max-w per screen (billing 1152px, client 672px) |
| Mobile frame | 390px wide, mobile-first for technician & client |
| Sidebar | 256px fixed, `#0F172A`, nav = Space Grotesk 12px uppercase, active item = `#3B82F6` text + 4px right border + translucent indigo fill |
| TopNav | 64px sticky, white @90% + blur, hairline bottom border `#c7c4d8` |
| Page padding | 32px desktop, 24px mobile; widget gap 20px, gutter 16px |
| Cards | White, radius 12px (dense UI) or 14px (proto), border `#c7c4d8` @30%, shadow 0 2px 4px rgba(0,0,0,.08) |
| Hero cards (client) | Radius 26px, shadow 0 8px 30px rgba(15,23,42,.14), state-driven gradient (blue → navy → amber → green) |
| KPI values, codes, money, ETAs | JetBrains Mono — no exceptions |
| Labels/eyebrows/badges | Space Grotesk 12px/600 uppercase, wide tracking |
| Headlines | Hanken Grotesk 32/700, 24/600 |
| Body | Inter 16/400, 14/400 |
| STAT anything | `#DC2626` under white text, pulsing dot, top of queue |
| Buttons | Heights 32/40/48/56px; primary `#3B82F6`; warning amber + **navy** text |
| Touch targets | ≥48px mobile, ≥44px inputs |
| Focus | Visible 2px ring, offset 2, in the control's accent color |

Full component redlines (badges, KPICard anatomy, forms, modals) are in
[`DESIGN.md`](DESIGN.md) §5 — treat that section as the redline sheet.

**Per-screen acceptance:** open the hi-fi prototype for the screen, put your design next
to it, and check: same layout skeleton, same token values (eyedropper the hex), same type
families in the same slots, same badge treatments, same corner radii and shadows. "Close"
is not 1:1.

## 2. Photography — Pexels sourcing guide

The hi-fi prototypes use placeholders where real photography belongs (avatars, facility
imagery, onboarding/empty states). All photography comes from **Pexels** (pexels.com —
free for commercial use, no attribution required; do not use identifiable real patients
from any other source).

### 2.1 Search terms per context

| Context | Pexels search terms | Pick |
|---|---|---|
| Technician avatars / roster | "medical professional portrait", "nurse portrait", "healthcare worker smiling" | Neutral background, head-and-shoulders, looking at camera |
| Field / fleet imagery | "medical van", "ambulance street", "mobile clinic" | Daylight, urban/suburban, no visible branding |
| Facility cards (SNF, ER, rehab) | "hospital exterior", "nursing home building", "clinic reception" | Architectural, empty of close-up faces |
| Client portal warmth (onboarding, empty states) | "home care elderly", "caregiver patient home", "nurse home visit" | Warm light, genuine interaction, respectful framing |
| Radiology context | "x ray equipment", "radiology room", "medical imaging" | Equipment-forward, clean |
| Laboratory context | "blood test tubes", "phlebotomy", "medical laboratory" | Specimen/equipment-forward |
| Copilot / abstract tech | "abstract blue technology", "data visualization screen" | Cool tones matching medical-blue |

### 2.2 Treatment rules (so photos look like one set)

1. **Tone**: cool, slightly desaturated. If a photo runs warm, overlay midnight-navy
   `#0F172A` at 10–20% or drop saturation ~15%. Client-portal photos may stay warmer.
2. **Crops**: avatars 1:1, circle-masked; facility cards 16:9; hero/empty-state 3:2.
   Faces never crop at the chin or forehead.
3. **Overlays for text-on-photo**: navy gradient scrim (transparent → `#0F172A` @60%)
   from the text edge; text always white and still ≥4.5:1 against the scrim.
4. **What to reject**: visible brand logos, watermarks, staged stock-smile clichés,
   anything reading as a real identifiable patient in distress, US-flag-adjacent
   insurance imagery, dated equipment.
5. **Consistency beats beauty**: pick one photographer/series per surface where possible;
   a matched mediocre set looks better than mixed spectacular ones.
6. **File hygiene**: name downloads `pexels-<subject>-<id>.jpg`, keep a
   `credits.md` listing photo IDs per screen so any image can be re-sourced.

## 3. Do / Don't

**Do**
- Start every screen from the shell (sidebar/TopNav or mobile shell), never from a blank frame
- Use the container scale (`#f5f2ff` → `#e4e1ee`) for hover/selected fills
- Pair every status color with its text label
- Animate state changes (fade-in 0.2s, slide-up 0.3s, pulse-stat 1.5s)

**Don't**
- Invent colors, radii, or shadows outside the token set
- Put data values (money, codes, ETAs) in Inter
- Use `#EF4444` behind white text (that's `#DC2626`'s job)
- Restyle or "improve" the lo-fi wireframes — they are presentation artifacts, frozen
- Use white text on amber, or amber on white, for anything that must be read

## 4. Handoff checklist (before you call a screen done)

- [ ] Side-by-side with the hi-fi prototype: layout, tokens, type slots all match
- [ ] All hex values eyedropper-verified against `DESIGN.md`
- [ ] STAT elements: `#DC2626`, pulse, top position
- [ ] Every input shows an attached label; focus states designed
- [ ] Touch targets ≥48px (mobile) / inputs ≥44px
- [ ] Photos from Pexels, treated per §2.2, logged in credits
- [ ] Both viewports covered where the viewer shows both (1280px + 390px)
- [ ] Text contrast spot-checked (≥4.5:1)
