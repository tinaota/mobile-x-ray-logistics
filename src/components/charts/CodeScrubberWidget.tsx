import { cn } from "@/lib/utils";

interface ScrubberItem {
  code: string;
  status: "error" | "ok";
}

interface CodeScrubberWidgetProps {
  items?: ScrubberItem[];
  className?: string;
  onReconcile?: () => void;
}

const defaultItems: ScrubberItem[] = [
  { code: "ERR_ICD_10", status: "error" },
  { code: "CPT_VALIDATED", status: "ok" },
];

export function CodeScrubberWidget({
  items = defaultItems,
  className,
  onReconcile,
}: CodeScrubberWidgetProps) {
  return (
    <div className={cn(
      "bg-white p-6 rounded-xl shadow-md border border-outline-variant/30",
      className
    )}>
      <div className="flex justify-between mb-4">
        <h5 className="font-label text-label-caps font-semibold text-[11px] text-midnight-navy uppercase tracking-wider">
          One-Click Scrubber
        </h5>
        <span className="material-symbols-outlined text-slate-gray text-sm">more_vert</span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.code}
            className="flex items-center justify-between p-2 bg-ghost-white rounded border border-outline-variant/20"
          >
            <div className="flex items-center gap-2">
              <span className={cn(
                "material-symbols-outlined text-sm",
                item.status === "error" ? "text-warning-amber" : "text-medical-blue"
              )}>
                {item.status === "error" ? "error" : "check_circle"}
              </span>
              <span className="font-mono text-xs text-on-surface">{item.code}</span>
            </div>
            {item.status === "error" ? (
              <button className="text-[10px] text-medical-blue font-bold uppercase hover:underline">
                Fix
              </button>
            ) : (
              <span className="text-[10px] text-slate-gray uppercase font-semibold">Auto</span>
            )}
          </div>
        ))}

        <button
          onClick={onReconcile}
          className="w-full bg-midnight-navy text-white py-2 rounded font-label text-label-caps font-semibold uppercase tracking-widest mt-2 hover:bg-primary-container transition-colors"
        >
          Reconcile All
        </button>
      </div>
    </div>
  );
}
