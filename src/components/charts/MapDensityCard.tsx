import { cn } from "@/lib/utils";

interface MapDensityCardProps {
  node?: string;
  utilization?: number;
  waitTime?: string;
  refreshRate?: string;
  className?: string;
}

export function MapDensityCard({
  node = "NODE ALPHA",
  utilization = 85,
  waitTime = "0.4s",
  refreshRate = "1.2ms",
  className,
}: MapDensityCardProps) {
  return (
    <div className={cn(
      "bg-midnight-navy p-6 rounded-xl shadow-md flex flex-col justify-between",
      className
    )}>
      <div className="flex justify-between items-start">
        <span className="material-symbols-outlined text-medical-blue">hub</span>
        <span className="text-[10px] text-medical-blue font-bold border border-medical-blue px-2 py-0.5 rounded font-label tracking-wider uppercase">
          {node}
        </span>
      </div>

      <div className="mt-4">
        <h5 className="font-label text-label-caps font-semibold text-[11px] text-slate-gray uppercase tracking-wider">
          Active Map Load
        </h5>
        <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-medical-blue h-full rounded-full transition-all duration-700"
            style={{ width: `${utilization}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-ghost-white font-mono">{utilization}% Utilization</span>
          <span className="text-[10px] text-slate-gray font-mono">High Density</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="bg-white/5 p-2 rounded">
          <p className="text-[8px] text-slate-gray uppercase font-label tracking-wider">Wait Time</p>
          <p className="text-xs text-ghost-white font-mono mt-0.5">{waitTime}</p>
        </div>
        <div className="bg-white/5 p-2 rounded">
          <p className="text-[8px] text-slate-gray uppercase font-label tracking-wider">Refreshes</p>
          <p className="text-xs text-ghost-white font-mono mt-0.5">{refreshRate}</p>
        </div>
      </div>
    </div>
  );
}
