"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Specimen } from "@/lib/utils";

interface SpecimenStabilityBadgeProps {
  specimen: Specimen;
  className?: string;
}

function formatCountdown(diffMs: number): string {
  const hrs  = Math.floor(diffMs / 3_600_000);
  const mins = Math.floor((diffMs % 3_600_000) / 60_000);
  const secs = Math.floor((diffMs % 60_000) / 1000);
  if (hrs > 0) return `${hrs}h ${mins.toString().padStart(2, "0")}m`;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Live specimen stability countdown for dispatcher views. Green while
 * comfortable, amber under 50% of the window, red + pulse under 20%.
 * Shows "Delivered" once custody has transferred.
 */
export function SpecimenStabilityBadge({ specimen, className }: SpecimenStabilityBadgeProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (specimen.deliveredAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [specimen.deliveredAt]);

  if (specimen.deliveredAt) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider",
        "bg-laboratory-emerald/10 text-laboratory-emerald border-laboratory-emerald/20",
        className
      )}>
        <Timer className="h-3 w-3" /> Delivered
      </span>
    );
  }

  const expiry = new Date(specimen.expiresAt).getTime();
  const collected = new Date(specimen.collectedAt).getTime();
  const totalWindow = Math.max(expiry - collected, 60_000);
  const diff = expiry - now;
  const pct = Math.max(0, Math.min(100, (diff / totalWindow) * 100));

  const expired = diff <= 0;
  const tone = expired
    ? "bg-red-600 text-white border-red-600 animate-pulse"
    : pct > 50
      ? "bg-laboratory-emerald/10 text-laboratory-emerald border-laboratory-emerald/20"
      : pct > 20
        ? "bg-warning-amber/15 text-amber-700 border-warning-amber/30"
        : "bg-emergency-red/10 text-emergency-red border-emergency-red/30 animate-pulse";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider",
        tone,
        className
      )}
      title={`Specimen ${specimen.accessionNumber} · stability window ends ${new Date(specimen.expiresAt).toLocaleTimeString()}`}
    >
      <Timer className="h-3 w-3" />
      {expired ? "EXPIRED" : formatCountdown(diff)}
    </span>
  );
}
