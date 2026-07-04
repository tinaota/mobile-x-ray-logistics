"use client";

import { useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { ChatMessageBubble } from "@/components/copilot/ChatMessageBubble";
import { QuickActionBar } from "@/components/copilot/QuickActionBar";
import type { PersonaPreset } from "@/lib/copilot/personas";

interface ChatWindowProps {
  preset: PersonaPreset;
  /** Null in mock mode (no Supabase) — chat still streams, just unpersisted. */
  conversationId: string | null;
  initialMessages: UIMessage[];
  statPriority: boolean;
  onStatPriorityChange: (v: boolean) => void;
}

function partsToText(message: UIMessage): string {
  return message.parts
    .map(p => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
}

/**
 * Streaming chat pane. Persistence happens server-side inside the chat
 * route (user turn before the model call, assistant turn in onFinish),
 * so this component has no persist-after-settle logic.
 */
export function ChatWindow({
  preset, conversationId, initialMessages, statPriority, onStatPriorityChange,
}: ChatWindowProps) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/copilot/chat",
        body: { persona: preset.persona, statPriority },
      }),
    [preset.persona, statPriority],
  );

  const { messages, sendMessage, status, stop, error } = useChat({
    // Keying by conversation resets the thread when the persona switches
    id: conversationId ?? `local-${preset.persona}`,
    messages: initialMessages,
    transport,
  });

  const isLoading = status === "submitted" || status === "streaming";

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Message stream */}
      <div ref={scrollRef} className="flex-1 min-h-0 space-y-5 overflow-y-auto px-4 py-6 sm:px-8">
        {messages.length === 0 && (
          <Card className="mx-auto max-w-2xl">
            <CardContent className="py-5">
              <p className="text-label-caps font-label font-semibold uppercase tracking-wider text-medical-blue">
                {preset.module}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-on-surface">{preset.greeting}</p>
            </CardContent>
          </Card>
        )}

        {messages.map(m => {
          const text = partsToText(m);
          if (!text || (m.role !== "user" && m.role !== "assistant")) return null;
          return <ChatMessageBubble key={m.id} role={m.role} text={text} preset={preset} />;
        })}

        {status === "submitted" && (
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-label font-semibold uppercase tracking-wider">Co-Pilot is thinking…</span>
          </div>
        )}

        {error && (
          <div className="mx-auto flex max-w-2xl items-start gap-2 rounded-xl border border-emergency-red/30 bg-emergency-red/5 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-emergency-red" />
            <p className="text-xs text-emergency-red">
              <span className="font-semibold">Co-Pilot ran into a problem:</span>{" "}
              {error.message?.trim() || "Unknown error — check the server logs and that ANTHROPIC_API_KEY is configured."}
            </p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-outline-variant/40 bg-surface-container/40 px-4 py-4 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <QuickActionBar
            preset={preset}
            disabled={isLoading}
            streaming={isLoading}
            onSend={text => sendMessage({ text })}
            onStop={stop}
            statPriority={statPriority}
            onStatPriorityChange={onStatPriorityChange}
          />
        </div>
      </div>
    </div>
  );
}
