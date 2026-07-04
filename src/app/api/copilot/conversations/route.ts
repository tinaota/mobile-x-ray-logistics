import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/auth";
import { isCopilotPersona } from "@/lib/copilot/prompts";
import { getOrCreateConversation, loadMessages } from "@/lib/copilot/conversations";

export const runtime = "nodejs";

/** Returns the (user, persona) conversation id + full message history. */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || (session.role !== "copilot" && session.role !== "admin")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const persona = req.nextUrl.searchParams.get("persona");
  if (!isCopilotPersona(persona)) {
    return new Response("Valid persona is required", { status: 400 });
  }

  const conversationId = await getOrCreateConversation(session.email, persona);
  if (!conversationId) {
    // Supabase not configured (mock mode) — chat still works, just unpersisted
    return NextResponse.json({ conversationId: null, messages: [] });
  }

  const messages = await loadMessages(conversationId);
  return NextResponse.json({ conversationId, messages });
}
