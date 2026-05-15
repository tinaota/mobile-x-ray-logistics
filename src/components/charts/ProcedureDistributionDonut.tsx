import { cn } from "@/lib/utils";

interface ProcedureDistributionDonutProps {
  className?: string;
  total?: number;
  segments?: { label: string; pct: number; color: string }[];
}

const defaultSegments = [
  { label: "CPT-99213", pct: 70, color: "#3B82F6" },
  { label: "CPT-99214", pct: 30, color: "#0F172A" },
];

// SVG donut — viewBox 36×36, r=16, circumference ≈ 100.53
const C = 100.53;

export function ProcedureDistributionDonut({
  className,
  total = 1482,
  segments = defaultSegments,
}: ProcedureDistributionDonutProps) {
  let offset = 0;
  return (
    <div className={cn(
      "bg-white p-6 rounded-xl shadow-md shadow-midnight-navy/5 border border-outline-variant/30 flex flex-col h-80",
      className
    )}>
      <div className="mb-4">
        <h4 className="font-label text-label-caps font-semibold uppercase tracking-wider text-midnight-navy">
          Procedure Distribution
        </h4>
        <p className="text-slate-gray text-xs mt-0.5">Analysis of CPT code frequency</p>
      </div>

      <div className="flex-1 flex items-center justify-around">
        {/* Donut */}
        <div className="relative w-32 h-32 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            {/* Track */}
            <circle cx="18" cy="18" r="16" fill="none" stroke="#e4e2e4" strokeWidth="4" />
            {/* Segments */}
            {segments.map((seg) => {
              const len = (seg.pct / 100) * C;
              const dashOffset = -offset;
              offset += len;
              return (
                <circle
                  key={seg.label}
                  cx="18" cy="18" r="16"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="4"
                  strokeDasharray={`${len} ${C}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                />
              );
            })}
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-midnight-navy text-lg font-bold leading-none">
              {total.toLocaleString()}
            </span>
            <span className="text-[8px] text-slate-gray uppercase tracking-wider mt-0.5">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="font-mono text-xs text-slate-gray">
                {seg.label} ({seg.pct}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
