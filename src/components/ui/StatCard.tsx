import { cn } from "@/lib/utils";
import { Card, CardContent } from "./Card";
import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  icon?: ReactNode;
  iconBg?: string;
  loading?: boolean;
  className?: string;
  mono?: boolean;
}

export function StatCard({
  label,
  value,
  unit,
  trend,
  trendLabel,
  icon,
  iconBg = "bg-medical-blue/10",
  loading,
  className,
  mono,
}: StatCardProps) {
  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;
  const trendNeutral  = trend !== undefined && trend === 0;

  return (
    <Card className={cn("hover:shadow-card-md transition-shadow", className)}>
      <CardContent className="flex items-start justify-between gap-3 py-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold font-label uppercase tracking-wider text-on-surface-variant">
            {label}
          </p>
          {loading ? (
            <div className="mt-2 h-8 w-24 bg-surface-container rounded animate-pulse" />
          ) : (
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={cn(
                  "text-2xl font-bold text-on-surface",
                  mono && "font-mono code-mono text-2xl"
                )}
              >
                {value}
              </span>
              {unit && <span className="text-sm text-on-surface-variant">{unit}</span>}
            </div>
          )}
          {trend !== undefined && !loading && (
            <div className="mt-1.5 flex items-center gap-1">
              {trendPositive && <TrendingUp className="h-3.5 w-3.5 text-green-600" />}
              {trendNegative && <TrendingDown className="h-3.5 w-3.5 text-emergency-red" />}
              {trendNeutral  && <Minus className="h-3.5 w-3.5 text-slate-gray" />}
              <span
                className={cn(
                  "text-xs font-medium",
                  trendPositive && "text-green-600",
                  trendNegative && "text-emergency-red",
                  trendNeutral  && "text-slate-gray"
                )}
              >
                {trend > 0 && "+"}
                {trend}% {trendLabel}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn("shrink-0 h-11 w-11 rounded-xl flex items-center justify-center", iconBg)}>
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
