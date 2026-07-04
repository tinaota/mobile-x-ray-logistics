"use client";

import { useState } from "react";
import { Send, Square, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { PersonaPreset } from "@/lib/copilot/personas";

interface QuickActionBarProps {
  preset: PersonaPreset;
  disabled: boolean;
  streaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  statPriority: boolean;
  onStatPriorityChange: (v: boolean) => void;
}

/**
 * Quick-action chips + prompt input + send/stop, with the dispatcher-only
 * STAT priority toggle. Enter sends; Shift+Enter inserts a newline.
 */
export function QuickActionBar({
  preset, disabled, streaming, onSend, onStop, statPriority, onStatPriorityChange,
}: QuickActionBarProps) {
  const [draft, setDraft] = useState("");

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setDraft("");
  };

  return (
    <div className="space-y-3">
      {/* Quick-action chips scroll; the STAT toggle stays pinned outside the scroll area */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 min-w-0 items-center gap-2 overflow-x-auto hide-scrollbar">
          {preset.quickActions.map(action => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => submit(action.prompt)}
              className="shrink-0 rounded-full text-xs"
            >
              {action.label}
            </Button>
          ))}
        </div>

        {/* Dispatcher-only STAT priority toggle — always visible */}
        {preset.toggleLabel && (
          <button
            type="button"
            role="switch"
            aria-checked={statPriority}
            onClick={() => onStatPriorityChange(!statPriority)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-full border text-[10px] font-label font-semibold uppercase tracking-wider transition-colors",
              statPriority
                ? "bg-emergency-red/10 text-emergency-red border-emergency-red/40"
                : "bg-white text-on-surface-variant border-outline-variant/60 hover:border-outline-variant",
            )}
            title={preset.toggleLabel}
          >
            <Zap className={cn("h-3 w-3", statPriority && "animate-pulse")} />
            <span className="hidden sm:inline">{preset.toggleLabel}</span>
            <span className="sm:hidden">STAT</span>
          </button>
        )}
      </div>

      {/* Input row */}
      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(draft);
            }
          }}
          placeholder={preset.placeholder}
          rows={2}
          className="flex-1 min-w-0 resize-none rounded-xl border border-outline-variant/60 bg-white px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-medical-blue"
        />
        {streaming ? (
          <Button
            variant="outline"
            size="lg"
            className="h-12 gap-2 shrink-0"
            onClick={onStop}
          >
            <Square className="h-4 w-4" /> Stop
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            className="h-12 gap-2 shrink-0"
            disabled={!draft.trim() || disabled}
            onClick={() => submit(draft)}
          >
            <Send className="h-4 w-4" /> Send
          </Button>
        )}
      </div>
    </div>
  );
}
