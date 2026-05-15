import { cn } from "@/lib/utils";

interface CPTCodeBadgeProps {
  code: string;
  description?: string;
  modifier?: string;
  flagged?: boolean;
  className?: string;
}

export function CPTCodeBadge({ code, description, modifier, flagged, className }: CPTCodeBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border",
        flagged
          ? "bg-red-50 border-emergency-red/30 text-emergency-red"
          : "bg-surface-container border-outline-variant/40",
        className
      )}
    >
      <span className="code-mono text-sm font-bold">{code}</span>
      {modifier && (
        <span className="code-mono text-xs text-on-surface-variant border-l border-outline-variant pl-2">
          -{modifier}
        </span>
      )}
      {description && (
        <span className="text-xs text-on-surface-variant max-w-[180px] truncate">
          {description}
        </span>
      )}
    </div>
  );
}

interface ICD10BadgeProps {
  code: string;
  description?: string;
  primary?: boolean;
  className?: string;
}

export function ICD10Badge({ code, description, primary, className }: ICD10BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs",
        primary
          ? "bg-midnight-navy/5 border-midnight-navy/20 text-midnight-navy"
          : "bg-surface-container border-outline-variant/40 text-on-surface-variant",
        className
      )}
    >
      <span className="code-mono font-semibold">{code}</span>
      {description && <span className="truncate max-w-[160px]">{description}</span>}
      {primary && (
        <span className="font-label text-[9px] font-bold uppercase tracking-wider bg-midnight-navy text-white px-1 py-0.5 rounded">
          DX
        </span>
      )}
    </div>
  );
}
