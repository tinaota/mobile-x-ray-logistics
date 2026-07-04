import { NextRequest, NextResponse } from "next/server";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { verifySession, COOKIE_NAME } from "@/lib/auth";
import { buildSystemPrompt, isCopilotPersona } from "@/lib/copilot/prompts";
import { fetchPersonaContext } from "@/lib/copilot/context";
import { getOrCreateConversation, appendMessage, extractText } from "@/lib/copilot/conversations";

// jose (JWT verify) + the service-role Supabase client want Node, not edge
export const runtime = "nodejs";

const COPILOT_MODEL = "claude-sonnet-5";

export async function POST(req: NextRequest) {
  // First role-gated API route in the codebase — reuses the same session
  // primitives proxy.ts uses. Admin is allowed through to mirror the proxy's
  // admin bypass (an admin can open /copilot, so the chat must work there too).
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || (session.role !== "copilot" && session.role !== "admin")) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const { messages, persona, statPriority } = (body ?? {}) as {
    messages?: unknown;
    persona?: unknown;
    statPriority?: unknown;
  };
  if (!Array.isArray(messages)) {
    return new Response("Messages are required", { status: 400 });
  }
  if (!isCopilotPersona(persona)) {
    return new Response("Valid persona is required", { status: 400 });
  }

  // Live operational context — real platform data, fetched server-side
  const liveContext = await fetchPersonaContext(persona);

  // Persist the user's turn before the model call so a mid-stream page
  // reload never loses the prompt. Assistant turn persists in onFinish.
  const conversationId = await getOrCreateConversation(session.email, persona);
  const uiMessages = messages as UIMessage[];
  const lastMessage = uiMessages[uiMessages.length - 1];
  if (conversationId && lastMessage?.role === "user") {
    const text = extractText(lastMessage);
    if (text) await appendMessage(conversationId, "user", text, lastMessage.parts);
  }

  const result = streamText({
    model: anthropic(COPILOT_MODEL),
    system: buildSystemPrompt(persona, liveContext, statPriority === true),
    messages: await convertToModelMessages(uiMessages),
    onFinish: async ({ text }) => {
      // Fires server-side when the full stream completes — persists the
      // assistant's reply even if the browser disconnected mid-stream.
      if (conversationId && text.trim()) {
        await appendMessage(conversationId, "assistant", text);
      }
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: uiMessages,
    // Surface the real provider error (e.g. "credit balance too low",
    // invalid model) instead of the SDK's masked "An error occurred."
    onError: error =>
      error instanceof Error ? error.message : "Co-Pilot request failed — please try again.",
  });
}
