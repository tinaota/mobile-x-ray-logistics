import { cn } from "@/lib/utils";

interface ResponseTimeCardProps {
  value?: number;
  unit?: string;
  target?: number;
  onTrack?: boolean;
  className?: string;
}

const sparkPath = "M0,35 Q10,10 20,30 T40,20 T60,35 T80,5 T100,25";

export function ResponseTimeCard({
  value = 14.2,
  unit = "min",
  target = 15.0,
  onTrack = true,
  className,
}: ResponseTimeCardProps) {
  return (
    <div className={cn(
      "bg-white p-6 rounded-xl shadow-md border border-outline-variant/30 flex flex-col",
      className
    )}>
      <h5 className="font-label text-label-caps font-semibold text-[11px] text-slate-gray uppercase tracking-wider mb-1">
        Response Time (Avg)
      </h5>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-midnight-navy leading-none">{value}</span>
          <span className="text-lg font-normal text-slate-gray ml-1">{unit}</span>
        </div>
        <div className="w-20 h-10">
          <svg className="w-full h-full" viewBox="0 0 100 40">
            <path
              d={sparkPath}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-outline-variant/20">
        <div className="flex justify-between text-[10px] text-slate-gray font-label font-semibold uppercase tracking-wider">
          <span>Target: {target.toFixed(1)}m</span>
          <span className={onTrack ? "text-green-600" : "text-emergency-red"}>
            {onTrack ? "On Track" : "At Risk"}
          </span>
        </div>
      </div>
    </div>
  );
}
