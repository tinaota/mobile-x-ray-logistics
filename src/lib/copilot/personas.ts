"use client";

// Client-safe persona presets for the Co-Pilot workspace UI.
// Server-side prompt construction lives in prompts.ts (no React imports there).

import { Truck, ReceiptText, Radio, type LucideIcon } from "lucide-react";
import type { CopilotPersona } from "@/lib/utils";

export interface QuickAction {
  label: string;
  prompt: string;
}

export interface PersonaPreset {
  persona: CopilotPersona;
  name: string;
  module: string;
  tagline: string;
  icon: LucideIcon;
  /** Maps to platform design tokens in the components (never hardcode hex). */
  accent: "medical" | "warning" | "success";
  greeting: string;
  placeholder: string;
  quickActions: QuickAction[];
  /** Dispatcher-only: label for the STAT priority context toggle. */
  toggleLabel?: string;
  /** Field-tech-only: voice dictation mic (stretch goal, not v1). */
  showVoiceMic?: boolean;
}

export const PERSONA_PRESETS: Record<CopilotPersona, PersonaPreset> = {
  dispatcher: {
    persona: "dispatcher",
    name: "Dispatcher",
    module: "Smart Fleet Orchestrator",
    tagline: "Density vs. priority — resolved in real time.",
    icon: Truck,
    accent: "medical",
    greeting:
      "Fleet is live. I'm reading the platform's current orders and technician roster. Ask me to cover a STAT, check specimen stability, or flag SLA risk.",
    placeholder: "e.g. Who should cover the unassigned STAT orders right now?",
    toggleLabel: "STAT priority context",
    quickActions: [
      { label: "Find STAT coverage", prompt: "Which technician should cover each unassigned STAT order right now, and why?" },
      { label: "Specimen watch", prompt: "Are any laboratory specimens in transit at risk of expiring? What should I do about them?" },
      { label: "Fleet load check", prompt: "How is today's workload balanced across the fleet? Flag anyone overloaded or idle." },
    ],
  },
  billing: {
    persona: "billing",
    name: "Billing Manager",
    module: "Revenue Cycle Guard",
    tagline: "Pre-scrub compliance before the clearinghouse.",
    icon: ReceiptText,
    accent: "warning",
    greeting:
      "I pre-scrub claims before submission — auditing the invoice formula, catching missing ICD-10 codes, and flagging denial risk on live invoices.",
    placeholder: "e.g. Pre-scrub the flagged invoices for denial risk.",
    quickActions: [
      { label: "Pre-scrub flagged", prompt: "Pre-scrub every currently flagged invoice and list the compliance issues on each." },
      { label: "Missing ICD-10", prompt: "Which invoices are missing an ICD-10 code, and what should I do to fix each one?" },
      { label: "Denial risk", prompt: "Rank the open invoices by denial risk and explain the top risks." },
    ],
  },
  "field-tech": {
    persona: "field-tech",
    name: "Field Tech",
    module: "Field Operations Assistant",
    tagline: "Procedures, custody, and sync — answered fast.",
    icon: Radio,
    accent: "success",
    greeting:
      "Field support ready. Ask about active assignments across the fleet, chain-of-custody steps for lab draws, or what's sitting in the offline sync queue.",
    placeholder: "e.g. Walk me through the drop-off custody steps for a lab specimen.",
    showVoiceMic: false, // Web Speech dictation is a documented stretch goal, not v1
    quickActions: [
      { label: "Active assignments", prompt: "Summarize the fleet's active assignments right now — who is on what, and what's next?" },
      { label: "Custody steps", prompt: "Walk me through the full chain-of-custody flow for a laboratory draw, from accession scan to drop-off." },
      { label: "Sync queue", prompt: "What's pending in the offline sync queue and what happens when devices reconnect?" },
    ],
  },
};

export const PERSONA_ORDER: CopilotPersona[] = ["dispatcher", "billing", "field-tech"];
