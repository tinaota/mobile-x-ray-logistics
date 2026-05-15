import { cn } from "@/lib/utils";

interface RealtimeCounterCardProps {
  label?: string;
  value?: number;
  trend?: string;
  trendPositive?: boolean;
  icon?: string;
  className?: string;
}

const sparkHeights = [4, 6, 3, 8];

export function RealtimeCounterCard({
  label = "Units Online",
  value = 342,
  trend = "+12% vs LW",
  trendPositive = true,
  icon = "router",
  className,
}: RealtimeCounterCardProps) {
  return (
    <div className={cn(
      "bg-white p-6 rounded-xl shadow-md border border-outline-variant/30 flex flex-col justify-between",
      className
    )}>
      <div className="flex justify-between items-start">
        <span className="material-symbols-outlined text-medical-blue bg-medical-blue/10 p-2 rounded-lg text-xl">
          {icon}
        </span>
        <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
          <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
          LIVE
        </div>
      </div>

      <div className="mt-4">
        <h5 className="font-label text-label-caps font-semibold text-[11px] text-slate-gray uppercase tracking-wider">
          {label}
        </h5>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-4xl font-bold text-midnight-navy leading-none">{value}</span>
          <span className={cn("text-xs font-bold", trendPositive ? "text-green-600" : "text-emergency-red")}>
            {trend}
          </span>
        </div>
      </div>

      <div className="mt-4 h-8 flex items-end gap-1">
        {sparkHeights.map((h, i) => (
          <div
            key={i}
            className={cn("flex-1 rounded-sm", i === sparkHeights.length - 1 ? "bg-medical-blue" : "bg-surface-container-highest")}
            style={{ height: `${h * 4}px` }}
          />
        ))}
      </div>
    </div>
  );
}
