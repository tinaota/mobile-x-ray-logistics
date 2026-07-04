"use client";

import { cn } from "@/lib/utils";
import type { CopilotPersona } from "@/lib/utils";
import { PERSONA_PRESETS, PERSONA_ORDER } from "@/lib/copilot/personas";

interface PersonaSwitcherProps {
  active: CopilotPersona;
  onSelect: (persona: CopilotPersona) => void;
}

/** Left rail — one workspace, three operational lenses. */
export function PersonaSwitcher({ active, onSelect }: PersonaSwitcherProps) {
  return (
    <nav className="space-y-1.5 px-3 py-4">
      <p className="px-2 pb-2 text-[10px] font-label font-semibold uppercase tracking-wider text-slate-gray">
        Operational Lens
      </p>
      {PERSONA_ORDER.map(persona => {
        const preset = PERSONA_PRESETS[persona];
        const Icon = preset.icon;
        const isActive = persona === active;
        return (
          <button
            key={persona}
            onClick={() => onSelect(persona)}
            className={cn(
              "w-full flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-all duration-150",
              isActive
                ? "bg-primary-container/50 border-r-4 border-medical-blue translate-x-0.5"
                : "hover:bg-primary-container/30",
            )}
            aria-current={isActive ? "true" : undefined}
          >
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                preset.accent === "medical" && "bg-medical-blue/20 text-medical-blue",
                preset.accent === "warning" && "bg-warning-amber/20 text-warning-amber",
                preset.accent === "success" && "bg-laboratory-emerald/20 text-laboratory-emerald",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className={cn("block text-sm font-semibold", isActive ? "text-white" : "text-white/80")}>
                {preset.name}
              </span>
              <span className="block text-[11px] leading-snug text-slate-gray mt-0.5">
                {preset.module}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
