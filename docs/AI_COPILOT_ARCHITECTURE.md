# AI Co-Pilot — Architecture

> Persona-aware operational intelligence layer for the Mobile Diagnostic Logistics platform (RAD-OPS).
> Shipped in commit `83ea156` as a dedicated `copilot` role. This document is the reference for the Co-Pilot subsystem — frontend, backend, and stack.

---

## Overview

The Co-Pilot is an embedded AI assistant that reasons over the platform's **live operational state** and proposes concrete next steps. It is not a generic chatbot — every request is grounded in a real-time snapshot of orders, technicians, specimens, and invoices pulled from the database at request time.

It exposes three **personas**, each a specialized operational module:

| Persona | Module | Mission |
|---------|--------|---------|
| `dispatcher` | Smart Fleet Orchestrator | STAT coverage, density-vs-priority, specimen stability, assignment reasoning |
| `billing` | Revenue Cycle Guard | Pre-scrub claims, audit invoice formula, catch missing ICD-10, denial-risk ranking |
| `field-tech` | Field Operations Assistant | Active assignments, chain-of-custody steps, offline sync-queue questions |

**Defining principle — two independent context channels.** The model receives a compact text snapshot (`context.ts`); the operator sees live-updating React UI (`ContextRail.tsx`). They share no code by design: one feeds the LLM, the other feeds the human eye.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | Anthropic `claude-sonnet-5` |
| AI orchestration | Vercel AI SDK — `ai`, `@ai-sdk/anthropic`, `@ai-sdk/react` |
| Streaming protocol | AI SDK UI message stream (`streamText` → `toUIMessageStreamResponse` ↔ `useChat`) |
| Backend | Next.js 15 Route Handlers (`runtime = "nodejs"`) |
| Auth | Custom JWT cookie (`rad-session`, `jose`), role-gated to `copilot` + `admin` |
| Persistence | Supabase (PostgreSQL) via **service-role** client, RLS-locked |
| Frontend | React 19 client components, Tailwind CSS 3 design tokens |
| Deployment | Vercel (requires `ANTHROPIC_API_KEY`) |

---

## Component Map

```
src/
├── app/
│   ├── copilot/page.tsx ............... /copilot route → renders CopilotShell
│   └── api/copilot/
│       ├── chat/route.ts ............. POST — streaming chat + persistence
│       └── conversations/route.ts .... GET  — rehydrate history for (user, persona)
├── components/copilot/
│   ├── CopilotShell.tsx .............. full-screen 3-column workspace (own chrome)
│   ├── PersonaSwitcher.tsx .......... dispatcher | billing | field-tech
│   ├── ChatWindow.tsx ............... useChat streaming pane
│   ├── ChatMessageBubble.tsx ........ single message render
│   ├── QuickActionBar.tsx ........... preset prompts + STAT toggle + stop
│   └── ContextRail.tsx .............. LIVE data rail (own realtime hooks)
├── lib/
│   ├── copilot/
│   │   ├── personas.ts .............. client-safe persona presets (UI)
│   │   ├── prompts.ts ............... server-safe system-prompt assembly
│   │   ├── context.ts ............... server-side live-context builder (→ model)
│   │   └── conversations.ts ......... conversation/message persistence helpers
│   └── hooks/
│       └── useCopilotConversation.ts  loads persisted thread per persona
└── supabase/migrations/
    └── 012_ai_copilot.sql ........... copilot_conversations + copilot_messages
```

---

## Frontend

```
/copilot (page.tsx)
└─ CopilotShell.tsx ................. full-screen, own chrome (no Sidebar/NavShell)
   ├─ PersonaSwitcher ............... left rail; bottom tab strip on mobile
   ├─ ChatWindow .................... center; useChat streaming
   │  ├─ ChatMessageBubble
   │  └─ QuickActionBar ............. preset prompts + STAT toggle + stop
   └─ ContextRail ................... right rail; slide-over drawer below xl
```

**`CopilotShell`** — Owns the two pieces of UI state: `persona` and `statPriority`. Three-column responsive layout: the persona rail collapses to a bottom tab strip on mobile; the live-context rail drops into a slide-over drawer below the `xl` breakpoint. Follows the app's role-specific shell precedent (TechnicianShell / ClientShell) — no shared Sidebar.

**`ChatWindow`** — The streaming engine, built on `useChat` from `@ai-sdk/react`. Wires a `DefaultChatTransport` to `/api/copilot/chat`, sending `{ persona, statPriority }` in the request body. Keyed by `conversationId` so switching persona cleanly resets and re-seeds the thread. Renders token-by-token, shows a "thinking" state on `submitted`, and surfaces the real provider error on failure. **Holds no persistence logic** — that lives server-side.

**`personas.ts`** — Client-safe presets (name, tagline, Lucide icon, design-token accent, greeting, quick actions, STAT toggle label). Deliberately separated from `prompts.ts` so no React/icon imports leak into the Node route handler.

**`ContextRail`** — Renders live, persona-relevant operational data from the app's existing realtime hooks (`useOrders`, `useTechnicians`, `useInvoices`, `useSpecimens`, `useSyncQueue`). This is the **human-facing** context channel — it updates independently of the model's text snapshot.

---

## Backend

Two Next.js Route Handlers, both `runtime = "nodejs"` (required by `jose` JWT verification and the service-role Supabase client), both gated by `verifySession()` → role must be `copilot` or `admin` (admin bypass mirrors `proxy.ts`).

### `POST /api/copilot/chat` — the streaming brain

Per request:

1. Verify the JWT session cookie and enforce the role gate (401 otherwise).
2. Check `ANTHROPIC_API_KEY` is configured (503 if absent).
3. Validate `messages` (array) and `persona` (one of the three).
4. **`fetchPersonaContext(persona)`** → build a live operational-data text block from the database.
5. **Persist the user turn before the model call** — a mid-stream page reload never loses the prompt.
6. `streamText({ model: claude-sonnet-5, system: buildSystemPrompt(...), messages })`.
7. `onFinish` → persist the assistant turn server-side, even if the browser disconnected mid-stream.
8. `onError` → surface the real provider error (e.g. "credit balance too low") instead of a masked generic message.

### `GET /api/copilot/conversations` — history rehydration

Returns `{ conversationId, messages }` for the `(user_email, persona)` pair. Called by `useCopilotConversation` on mount and on every persona switch. Returns `{ conversationId: null, messages: [] }` when Supabase is unconfigured (mock mode) — chat still streams, just unpersisted.

### System-prompt assembly — `prompts.ts`

```
BASE_PROMPT              RAD-OPS identity + anti-hallucination + PHI guardrails
  + PERSONA_MISSION      per-persona module directive
  + LIVE OPERATIONAL     text snapshot from context.ts
    CONTEXT
  + STAT_PRIORITY        appended only when the dispatcher STAT toggle is on
    DIRECTIVE
```

Key guardrail: *"Never state a fact about a specific order, patient, technician, specimen, or invoice that is not present in the live context — if the data isn't there, say so."* Plus an explicit no-inventing-PHI rule.

### Live context builder — `context.ts` (server-only)

Reads real tables via `supabaseAdmin` and formats a compact markdown block **per persona**:

- **dispatcher** — open STAT orders, specimen stability windows (minutes-to-expiry), field-staff roster, assignment rules.
- **billing** — flagged invoices, open (unbilled) revenue total, the invoice formula.
- **field-tech** — active fleet assignments, sync-queue counts, chain-of-custody steps.

Falls back to `MOCK_*` data when Supabase is unconfigured, so the whole subsystem runs in demo mode without a database.

---

## Data Flow

```
User types in ChatWindow
   │
   ▼
useChat ──POST { messages, persona, statPriority }──▶ /api/copilot/chat
                                                        │ verifySession → role gate
                                                        │ fetchPersonaContext ──▶ Supabase (service role)
                                                        │ persist USER turn
                                                        │ streamText(claude-sonnet-5)
   ◀────────────── SSE UI message stream ───────────────┤
   render token-by-token                                │ onFinish → persist ASSISTANT turn
                                                        ▼
                                                 copilot_messages

On mount / persona switch:
useCopilotConversation ──GET /api/copilot/conversations?persona=…──▶ history rehydrate
```

---

## Persistence — `012_ai_copilot.sql`

```
copilot_conversations
  id           text pk
  user_email   text
  persona      text  check in (dispatcher | billing | field-tech)
  title        text
  created_at / updated_at
  UNIQUE (user_email, persona)        ← one conversation per persona per user

copilot_messages
  id               text pk
  conversation_id  text fk → copilot_conversations (on delete cascade)
  role             text  check in (user | assistant)
  content          text
  ui_parts         jsonb                ← preserves rich AI-SDK message structure
  created_at       timestamptz
  index (conversation_id, created_at)
```

**One conversation per `(user_email, persona)`**, enforced by the unique constraint. `getOrCreateConversation` is race-safe: a parallel unique-violation triggers a re-read rather than an error.

**RLS is enabled with zero policies — a deliberate lockdown.** Because Co-Pilot users authenticate via the custom JWT cookie (not Supabase Auth), `auth.uid()` is always null, so `auth.uid()`-keyed policies would return nothing anyway. All reads/writes flow exclusively through the `/api/copilot/*` route handlers using the service-role client (which bypasses RLS), gated at the application layer by `verifySession()`.

---

## Key Design Decisions

- **Server-side persistence only.** The user turn is saved before the model call, the assistant turn in `onFinish`. A mid-stream reload or browser disconnect never loses data, and the client carries zero persist logic.
- **Two context channels, never shared.** `context.ts` (text → model) vs `ContextRail.tsx` (React → human). Keeps the LLM snapshot decoupled from UI rendering.
- **Grounded-only responses.** The system prompt forbids asserting any specific operational fact absent from the injected live context, and forbids inventing PHI.
- **Graceful mock mode.** No Supabase → `conversationId` is null; chat still streams live against mock data, just unpersisted.
- **Real error surfacing.** `onError` returns the actual provider message so operators and developers see the true failure cause.
- **Admin bypass** mirrors `proxy.ts` — an admin opening `/copilot` gets a fully working chat.

---

## Environment Variables

```bash
ANTHROPIC_API_KEY=            # required — Co-Pilot returns 503 without it
NEXT_PUBLIC_SUPABASE_URL=     # persistence + live context (optional → mock mode)
SUPABASE_SERVICE_ROLE_KEY=    # service-role client (server-only, bypasses RLS)
```

---

## Extension Points

- **Additional personas** — add to the `CopilotPersona` union, `PERSONA_PRESETS`, `PERSONA_MISSION`, the persona `check` constraint, and a `fetchPersonaContext` branch.
- **Tool calling** — `streamText` supports AI SDK tools; live context is currently read-only injection. Actions (assign order, reconcile invoice) would move from "recommend" to "execute."
- **Voice dictation** — `field-tech` preset carries a `showVoiceMic` flag (Web Speech), documented as a post-v1 stretch goal.
