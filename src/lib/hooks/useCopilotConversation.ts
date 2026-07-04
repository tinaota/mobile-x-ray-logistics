"use client";

import { useEffect, useState } from "react";
import type { UIMessage } from "ai";
import type { CopilotPersona } from "@/lib/utils";

interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ui_parts: unknown;
}

/**
 * Loads the persisted conversation (id + history) for the active persona.
 * Fetches on mount and whenever the persona switches — mirroring the
 * useEffect-on-mount pattern the rest of the app's hooks use.
 */
export function useCopilotConversation(persona: CopilotPersona) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/copilot/conversations?persona=${persona}`)
      .then(r => (r.ok ? r.json() : { conversationId: null, messages: [] }))
      .then(({ conversationId, messages }: { conversationId: string | null; messages: StoredMessage[] }) => {
        if (cancelled) return;
        setConversationId(conversationId);
        setInitialMessages(
          (messages ?? []).map(m => ({
            id: m.id,
            role: m.role,
            parts: Array.isArray(m.ui_parts) && m.ui_parts.length > 0
              ? (m.ui_parts as UIMessage["parts"])
              : [{ type: "text" as const, text: m.content }],
          })),
        );
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setConversationId(null);
        setInitialMessages([]);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [persona]);

  return { conversationId, initialMessages, loading };
}
