"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { PersonaPreset } from "@/lib/copilot/personas";

interface ChatMessageBubbleProps {
  role: "user" | "assistant";
  text: string;
  preset: PersonaPreset;
}

/**
 * One chat turn — styled after the dispatcher/messages bubble conventions:
 * user turns right-aligned in navy, assistant turns left-aligned with the
 * persona icon avatar and markdown rendering.
 */
export function ChatMessageBubble({ role, text, preset }: ChatMessageBubbleProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-none bg-midnight-navy px-4 py-2.5 text-sm text-white shadow-card">
          {text}
        </div>
      </div>
    );
  }

  const Icon = preset.icon;
  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          preset.accent === "medical" && "bg-medical-blue",
          preset.accent === "warning" && "bg-warning-amber",
          preset.accent === "success" && "bg-laboratory-emerald",
        )}
      >
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl rounded-tl-none bg-white border border-outline-variant/40 px-4 py-3 text-sm text-on-surface shadow-card",
          // Markdown element styling without a typography plugin
          "[&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2",
          "[&_li]:mb-1 [&_strong]:font-semibold [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold",
          "[&_code]:font-mono [&_code]:text-xs [&_code]:bg-surface-container [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded",
        )}
      >
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    </div>
  );
}
