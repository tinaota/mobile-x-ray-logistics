import { cn } from "@/lib/utils";

interface RevenueAreaChartProps {
  className?: string;
}

const points = [80, 100, 90, 110, 70, 50, 60, 40, 55, 30, 45, 20, 35, 10, 0];
const W = 280;
const H = 150;
const step = W / (points.length - 1);

const pathD = points
  .map((y, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y}`)
  .join(" ");
const areaD = pathD + ` L${W},${H} L0,${H} Z`;

export function RevenueAreaChart({ className }: RevenueAreaChartProps) {
  return (
    <div className={cn(
      "bg-white p-6 rounded-xl shadow-md shadow-midnight-navy/5 border border-outline-variant/30 flex flex-col h-80",
      className
    )}>
      <div className="mb-4">
        <h4 className="font-label text-label-caps font-semibold uppercase tracking-wider text-midnight-navy">
          Revenue Trends
        </h4>
        <p className="text-slate-gray text-xs mt-0.5">Automated revenue scrubbing metrics (Last 30 Days)</p>
      </div>

      <div className="flex-1 relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] font-mono text-slate-gray pr-2 z-10">
          <span>$100k</span>
          <span>$75k</span>
          <span>$50k</span>
          <span>$25k</span>
          <span>$0</span>
        </div>

        {/* Chart area */}
        <div className="absolute inset-0 ml-8 border-l border-b border-outline-variant/50"
          style={{ backgroundImage: "radial-gradient(#e4e2e4 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
          <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#areaGrad)" />
            <path d={pathD} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="absolute -bottom-5 left-8 right-0 flex justify-between text-[10px] font-mono text-slate-gray">
          <span>01 SEP</span>
          <span>10 SEP</span>
          <span>20 SEP</span>
          <span>30 SEP</span>
        </div>
      </div>
    </div>
  );
}
