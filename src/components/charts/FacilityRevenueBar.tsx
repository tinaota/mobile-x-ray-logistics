import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface FacilityRow {
  name: string;
  amount: number;
  maxAmount?: number;
}

interface FacilityRevenueBarProps {
  data?: FacilityRow[];
  onFullReport?: () => void;
  className?: string;
}

const defaultData: FacilityRow[] = [
  { name: "St. Jude Medical Center",    amount: 420000 },
  { name: "Northwest General",          amount: 310500 },
  { name: "Children's Health Pavilion", amount: 285000 },
  { name: "City Urgent Care Hub",       amount: 152000 },
  { name: "Meadowbrook Nursing",        amount: 98400 },
];

export function FacilityRevenueBar({ data = defaultData, onFullReport, className }: FacilityRevenueBarProps) {
  const max = Math.max(...data.map((d) => d.amount));

  return (
    <div className={cn("bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30", className)}>
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-headline-md font-bold text-midnight-navy">Revenue by Facility</h3>
        <button
          onClick={onFullReport}
          className="text-medical-blue font-label text-label-caps font-semibold hover:underline flex items-center gap-1 transition-colors"
        >
          Full Report <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-6">
        {data.map((row) => {
          const pct = (row.amount / (row.maxAmount ?? max)) * 100;
          return (
            <div key={row.name} className="space-y-2">
              <div className="flex items-center justify-between text-body-sm font-medium">
                <span className="text-on-surface truncate pr-4">{row.name}</span>
                <span className="font-mono text-sm text-midnight-navy shrink-0">
                  ${row.amount.toLocaleString()}
                </span>
              </div>
              <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-medical-blue rounded-full transition-all duration-700"
                  style={{ width: `${pct.toFixed(1)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
