import { cn } from "@/lib/utils";

interface ServiceSplitDonutProps {
  stat?: number;
  routine?: number;
  className?: string;
}

export function ServiceSplitDonut({ stat = 30, routine = 70, className }: ServiceSplitDonutProps) {
  // SVG donut — r=80, circumference = 2π×80 ≈ 502.65
  const C = 502.65;
  const routineLen = (routine / 100) * C;
  const statLen    = (stat / 100) * C;
  // Routine starts at top (offset 0), STAT follows
  const statOffset = C - routineLen;

  return (
    <div className={cn("bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between", className)}>
      <div>
        <h3 className="text-headline-md font-bold text-midnight-navy mb-1">Service Split</h3>
        <p className="text-body-sm text-slate-gray mb-6">Revenue distribution by urgency level</p>
      </div>

      {/* SVG Donut — exact wireframe */}
      <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
          {/* Track */}
          <circle
            cx="96" cy="96" r="80" fill="transparent"
            stroke="#f0edef" strokeWidth="24"
          />
          {/* Routine — medical blue */}
          <circle
            cx="96" cy="96" r="80" fill="transparent"
            stroke="#3B82F6" strokeWidth="24"
            strokeDasharray={`${routineLen} ${C}`}
            strokeDashoffset="0"
            strokeLinecap="butt"
          />
          {/* STAT — emergency red, offset after routine */}
          <circle
            cx="96" cy="96" r="80" fill="transparent"
            stroke="#EF4444" strokeWidth="24"
            strokeDasharray={`${statLen} ${C}`}
            strokeDashoffset={`-${routineLen}`}
            strokeLinecap="butt"
          />
        </svg>
        {/* Center label */}
        <div className="absolute flex flex-col items-center pointer-events-none">
          <span className="text-headline-md font-bold text-midnight-navy leading-none">{routine}%</span>
          <span className="font-label text-label-caps font-semibold uppercase tracking-wider text-slate-gray mt-1">
            Routine
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emergency-red shrink-0" />
            <span className="text-body-sm font-medium text-on-surface">STAT Services</span>
          </div>
          <span className="font-mono text-sm font-bold text-emergency-red">{stat}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-medical-blue shrink-0" />
            <span className="text-body-sm font-medium text-on-surface">Routine Delivery</span>
          </div>
          <span className="font-mono text-sm font-bold text-medical-blue">{routine}%</span>
        </div>
      </div>
    </div>
  );
}
