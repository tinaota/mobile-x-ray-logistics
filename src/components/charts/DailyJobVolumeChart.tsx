import { cn } from "@/lib/utils";

interface DailyJobVolumeChartProps {
  className?: string;
}

const bars = [
  { completed: 24, pending: 12 },
  { completed: 32, pending: 16 },
  { completed: 40, pending: 8 },
  { completed: 28, pending: 20 },
  { completed: 36, pending: 24 },
  { completed: 44, pending: 12 },
];

const MAX = 56;

export function DailyJobVolumeChart({ className }: DailyJobVolumeChartProps) {
  return (
    <div className={cn(
      "bg-white p-6 rounded-xl shadow-md shadow-midnight-navy/5 border border-outline-variant/30 flex flex-col h-80",
      className
    )}>
      <div className="mb-4">
        <h4 className="font-label text-label-caps font-semibold uppercase tracking-wider text-midnight-navy">
          Daily Job Volume
        </h4>
        <p className="text-slate-gray text-xs mt-0.5">Completed vs. Pending technician dispatches</p>
      </div>

      <div className="flex-1 relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] font-mono text-slate-gray pr-2 z-10">
          <span>200</span>
          <span>150</span>
          <span>100</span>
          <span>50</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="absolute inset-0 ml-8 border-l border-b border-outline-variant/50 flex items-end justify-between px-2 gap-2"
          style={{ backgroundImage: "radial-gradient(#e4e2e4 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
          {bars.map((b, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-0.5 h-full pb-0">
              <div
                className="bg-midnight-navy w-full rounded-t-sm"
                style={{ height: `${(b.completed / MAX) * 100}%` }}
              />
              <div
                className="bg-medical-blue w-full rounded-t-sm"
                style={{ height: `${(b.pending / MAX) * 100}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-5 pt-2 border-t border-outline-variant/20">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-midnight-navy" />
          <span className="text-[10px] font-mono text-slate-gray">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-medical-blue" />
          <span className="text-[10px] font-mono text-slate-gray">Pending</span>
        </div>
      </div>
    </div>
  );
}
