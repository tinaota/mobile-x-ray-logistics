-- ============================================================
-- 012 — AI Co-Pilot
--   • Conversation + message persistence for the AI chat assistant
--   • Scoped by (user email, persona) — one conversation per persona per user
--   • Written exclusively via the service-role client from the
--     streaming chat route — see note below on RLS
-- ============================================================

create table if not exists copilot_conversations (
  id           text primary key default gen_random_uuid()::text,
  user_email   text not null,
  persona      text not null
                 check (persona in ('dispatcher', 'billing', 'field-tech')),
  title        text not null default 'Co-Pilot',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (user_email, persona)
);

create table if not exists copilot_messages (
  id               text primary key default gen_random_uuid()::text,
  conversation_id  text not null references copilot_conversations(id) on delete cascade,
  role             text not null check (role in ('user', 'assistant')),
  content          text not null,
  ui_parts         jsonb,
  created_at       timestamptz default now()
);

create index if not exists copilot_messages_conversation_idx
  on copilot_messages (conversation_id, created_at);

-- RLS enabled defensively with NO permissive policies: this app's demo
-- accounts (src/lib/accounts.ts) authenticate via a custom JWT cookie
-- (rad-session, src/lib/auth.ts), not Supabase Auth — auth.uid() is
-- always null for these requests. All reads/writes to these two tables
-- happen exclusively through src/app/api/copilot/* route handlers using
-- supabaseAdmin (service-role key, bypasses RLS), gated by verifySession().
alter table copilot_conversations enable row level security;
alter table copilot_messages enable row level security;
