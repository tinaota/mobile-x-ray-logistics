"use client";

import { useState } from "react";
import { LogOut, Sparkles, Loader2, Activity, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { PersonaSwitcher } from "@/components/copilot/PersonaSwitcher";
import { ChatWindow } from "@/components/copilot/ChatWindow";
import { ContextRail } from "@/components/copilot/ContextRail";
import { PERSONA_PRESETS } from "@/lib/copilot/personas";
import { useCopilotConversation } from "@/lib/hooks/useCopilotConversation";
import { useSession, logout } from "@/lib/hooks/useSession";
import type { CopilotPersona } from "@/lib/utils";

/**
 * Full-screen Co-Pilot workspace: persona rail | chat | live context rail.
 * Dedicated shell (no Sidebar/NavShell), following the TechnicianShell /
 * ClientShell precedent of role-specific chrome.
 */
export function CopilotShell() {
  const session = useSession();
  const [persona, setPersona] = useState<CopilotPersona>("dispatcher");
  const [statPriority, setStatPriority] = useState(false);
  // Below xl the context rail lives in a slide-over drawer
  const [contextOpen, setContextOpen] = useState(false);

  const preset = PERSONA_PRESETS[persona];
  const { conversationId, initialMessages, loading } = useCopilotConversation(persona);

  return (
    <div className="flex h-screen flex-col bg-ghost-white">
      {/* Top strip */}
      <header className="flex h-14 shrink-0 items-center justify-between bg-midnight-navy px-5 shadow-md">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-medical-blue" />
          <div>
            <p className="font-black leading-none tracking-tighter text-white">CO-PILOT</p>
            <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-slate-gray">
              AI Operations Assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Live-context drawer toggle — rail is static on xl+ */}
          <button
            onClick={() => setContextOpen(true)}
            className="xl:hidden flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Open live context panel"
          >
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline text-[10px] font-label font-semibold uppercase tracking-wider">
              Live Context
            </span>
          </button>
          <span className="hidden sm:block text-xs text-white/70">{session?.name ?? "Operator"}</span>
          <Avatar initials={session?.initials ?? "CP"} size="sm" status="online" />
          <button
            onClick={logout}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-emergency-red"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 3-column workspace */}
      <div className="flex flex-1 min-h-0">
        {/* Left: persona rail */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col bg-midnight-navy border-r border-white/10 overflow-y-auto">
          <PersonaSwitcher active={persona} onSelect={setPersona} />
        </aside>

        {/* Mobile persona strip */}
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 flex bg-midnight-navy border-t border-white/10">
          {(Object.keys(PERSONA_PRESETS) as CopilotPersona[]).map(p => {
            const Icon = PERSONA_PRESETS[p].icon;
            return (
              <button
                key={p}
                onClick={() => setPersona(p)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-[9px] font-label font-semibold uppercase tracking-wider ${
                  p === persona ? "text-medical-blue" : "text-slate-gray"
                }`}
              >
                <Icon className="h-5 w-5" />
                {PERSONA_PRESETS[p].name}
              </button>
            );
          })}
        </div>

        {/* Center: chat */}
        <main className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0">
          {loading ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-on-surface-variant">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs font-label font-semibold uppercase tracking-wider">
                Loading {preset.name} thread…
              </span>
            </div>
          ) : (
            <ChatWindow
              // Remount on persona/thread change so useChat re-seeds cleanly
              key={conversationId ?? persona}
              preset={preset}
              conversationId={conversationId}
              initialMessages={initialMessages}
              statPriority={statPriority}
              onStatPriorityChange={setStatPriority}
            />
          )}
        </main>

        {/* Right: live context rail (static on xl+) */}
        <aside className="hidden xl:block w-80 shrink-0 overflow-y-auto border-l border-outline-variant/40 bg-surface-container/30 px-4 py-5">
          <ContextRail persona={persona} />
        </aside>
      </div>

      {/* Live-context slide-over for tablet/mobile */}
      {contextOpen && (
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-midnight-navy/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setContextOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-ghost-white shadow-card-lg animate-fade-in">
            <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/40 bg-white px-4 py-3">
              <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">
                Live Context · {preset.name}
              </p>
              <button
                onClick={() => setContextOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container"
                aria-label="Close context panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <ContextRail persona={persona} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
