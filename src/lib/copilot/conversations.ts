// Server-only conversation persistence helpers shared by the
// /api/copilot/chat and /api/copilot/conversations route handlers.
// All access goes through supabaseAdmin (service role) — the copilot
// tables have RLS enabled with no policies, so the anon client sees nothing.

import { supabaseAdmin } from "@/lib/supabase-admin";
import type { CopilotPersona } from "@/lib/utils";
import type { UIMessage } from "ai";

export interface StoredCopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ui_parts: unknown;
  created_at: string;
}

/** One conversation per (user email, persona). Race-safe via the unique constraint. */
export async function getOrCreateConversation(
  email: string,
  persona: CopilotPersona,
): Promise<string | null> {
  if (!supabaseAdmin) return null;

  const { data: existing } = await supabaseAdmin
    .from("copilot_conversations")
    .select("id")
    .eq("user_email", email)
    .eq("persona", persona)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabaseAdmin
    .from("copilot_conversations")
    .insert({ user_email: email, persona })
    .select("id")
    .single();

  if (error) {
    // Unique-violation race: a parallel request created it first — re-read.
    const { data: retry } = await supabaseAdmin
      .from("copilot_conversations")
      .select("id")
      .eq("user_email", email)
      .eq("persona", persona)
      .maybeSingle();
    return retry?.id ?? null;
  }
  return created?.id ?? null;
}

export async function loadMessages(conversationId: string): Promise<StoredCopilotMessage[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("copilot_messages")
    .select("id, role, content, ui_parts, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return (data ?? []) as StoredCopilotMessage[];
}

export async function appendMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  uiParts?: unknown,
): Promise<void> {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from("copilot_messages").insert({
    conversation_id: conversationId,
    role,
    content,
    ui_parts: uiParts ?? null,
  });
  await supabaseAdmin
    .from("copilot_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

export function extractText(message: UIMessage): string {
  return message.parts
    .map(p => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
}
