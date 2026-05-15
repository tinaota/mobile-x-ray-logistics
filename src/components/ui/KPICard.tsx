import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Clock, Zap, AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

type KPIIntent = "neutral" | "positive" | "negative" | "info" | "warning";

interface KPICardProps {
  label: string;
  value: string;
  valueColor?: string;
  subtext: string;
  subIntent?: KPIIntent;
  subIcon?: "trending_up" | "trending_down" | "clock" | "speed" | "warning";
  className?: string;
}

const subIconMap: Record<NonNullable<KPICardProps["subIcon"]>, ReactNode> = {
  trending_up:   <TrendingUp className="h-4 w-4 shrink-0" />,
  trending_down: <TrendingDown className="h-4 w-4 shrink-0" />,
  clock:         <Clock className="h-4 w-4 shrink-0" />,
  speed:         <Zap className="h-4 w-4 shrink-0" />,
  warning:       <AlertTriangle className="h-4 w-4 shrink-0" />,
};

const subIntentColor: Record<KPIIntent, string> = {
  neutral:  "text-slate-gray",
  positive: "text-green-600",
  negative: "text-emergency-red",
  info:     "text-medical-blue",
  warning:  "text-warning-amber",
};

export function KPICard({
  label,
  value,
  valueColor = "text-midnight-navy",
  subtext,
  subIntent = "neutral",
  subIcon,
  className,
}: KPICardProps) {
  return (
    <div className={cn(
      "bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col",
      className
    )}>
      <span className="font-label text-label-caps font-semibold uppercase tracking-wider text-slate-gray mb-2">
        {label}
      </span>
      <span className={cn("font-mono text-3xl font-bold leading-tight", valueColor)}>
        {value}
      </span>
      <div className={cn(
        "mt-4 flex items-center gap-1.5 text-body-sm font-bold",
        subIntentColor[subIntent]
      )}>
        {subIcon && subIconMap[subIcon]}
        <span>{subtext}</span>
      </div>
    </div>
  );
}
