"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { CheckCircle, Circle, ShieldCheck, AlertTriangle, Wrench } from "lucide-react";

interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  equipmentId?: string;
  lastCalibration?: string;
  required: boolean;
  note?: string;
}

const CHECKLIST: ChecklistItem[] = [
  // Portable X-ray unit
  { id: "xr1",  category: "Portable X-Ray Unit",     label: "DR panel powered on & functional",    equipmentId: "DR-4412",  lastCalibration: "2025-04-15", required: true  },
  { id: "xr2",  category: "Portable X-Ray Unit",     label: "Generator output verified (≥100kV)",  equipmentId: "DR-4412",  lastCalibration: "2025-04-15", required: true  },
  { id: "xr3",  category: "Portable X-Ray Unit",     label: "Collimator operational",              equipmentId: "COL-117",  lastCalibration: "2025-03-22", required: true  },
  { id: "xr4",  category: "Portable X-Ray Unit",     label: "Exposure indicator within range",     equipmentId: "DR-4412",  lastCalibration: "2025-04-15", required: true  },
  // Safety
  { id: "sf1",  category: "Radiation Safety",        label: "Lead apron present & undamaged",      equipmentId: "LA-009",   lastCalibration: "2025-01-10", required: true  },
  { id: "sf2",  category: "Radiation Safety",        label: "Dosimeter worn & within limits",      equipmentId: "DOS-T02",  lastCalibration: "2025-04-01", required: true  },
  { id: "sf3",  category: "Radiation Safety",        label: "Radiation warning signs packed",                                                             required: true  },
  // Digital
  { id: "dt1",  category: "Digital & Connectivity",  label: "Tablet charged (≥60%)",               equipmentId: "TAB-P08",                               required: true  },
  { id: "dt2",  category: "Digital & Connectivity",  label: "PACS uplink tested",                  equipmentId: "TAB-P08",                               required: true  },
  { id: "dt3",  category: "Digital & Connectivity",  label: "Offline cache loaded",                equipmentId: "TAB-P08",                               required: false, note: "Auto-syncs on connect" },
  // Supplies
  { id: "sp1",  category: "Supplies",                label: "Cassette positioning sponges (×3)",                                                          required: true  },
  { id: "sp2",  category: "Supplies",                label: "Compression bands present",                                                                   required: false },
  { id: "sp3",  category: "Supplies",                label: "Disposable gloves stocked",                                                                   required: true  },
];

const CATEGORIES = [...new Set(CHECKLIST.map(i => i.category))];

export default function EquipmentPage() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [signedOff, setSignedOff] = useState(false);

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const required    = CHECKLIST.filter(i => i.required);
  const allRequired = required.every(i => checked.has(i.id));
  const totalDone   = checked.size;

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Progress header */}
      <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant">Pre-Shift Verification</p>
          <p className="text-2xl font-mono font-bold text-on-surface mt-0.5">
            {totalDone}<span className="text-sm text-on-surface-variant font-sans font-normal"> / {CHECKLIST.length}</span>
          </p>
        </div>
        <div className="text-right">
          {signedOff ? (
            <Badge variant="success" size="lg" className="gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Signed Off
            </Badge>
          ) : allRequired ? (
            <Badge variant="billed" size="lg">Ready to Sign Off</Badge>
          ) : (
            <Badge variant="pending" size="md">{required.length - required.filter(i => checked.has(i.id)).length} required remaining</Badge>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-surface-container rounded-full overflow-hidden">
        <div
          className="h-full bg-medical-blue rounded-full transition-all duration-300"
          style={{ width: `${(totalDone / CHECKLIST.length) * 100}%` }}
        />
      </div>

      {/* Checklist by category */}
      {CATEGORIES.map(category => {
        const items = CHECKLIST.filter(i => i.category === category);
        const catDone = items.filter(i => checked.has(i.id)).length;

        return (
          <div key={category} className="bg-white rounded-xl border border-outline-variant/40 shadow-card overflow-hidden">
            <div className="px-5 py-3 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container/50">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-on-surface-variant" />
                <h3 className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface">{category}</h3>
              </div>
              <span className="text-xs font-mono text-on-surface-variant">{catDone}/{items.length}</span>
            </div>

            <div className="divide-y divide-outline-variant/20">
              {items.map(item => {
                const isChecked = checked.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    className={cn(
                      "w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors",
                      isChecked ? "bg-green-50/50" : "hover:bg-surface-container/50"
                    )}
                  >
                    {isChecked
                      ? <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      : <Circle className="h-5 w-5 text-outline shrink-0 mt-0.5" />
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("text-sm", isChecked ? "text-on-surface line-through opacity-60" : "text-on-surface font-medium")}>
                          {item.label}
                        </span>
                        {item.required && !isChecked && (
                          <Badge variant="stat" size="sm">Required</Badge>
                        )}
                        {item.note && (
                          <span className="text-xs text-on-surface-variant italic">{item.note}</span>
                        )}
                      </div>
                      {(item.equipmentId || item.lastCalibration) && (
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-on-surface-variant font-mono">
                          {item.equipmentId && <span>ID: {item.equipmentId}</span>}
                          {item.lastCalibration && <span>Cal: {item.lastCalibration}</span>}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Warning if missing required */}
      {!allRequired && totalDone > 0 && (
        <div className="flex items-start gap-2 bg-amber-50 border border-warning-amber/40 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-warning-amber shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Complete all required items before signing off. Missing:{" "}
            <strong>{required.filter(i => !checked.has(i.id)).map(i => i.label).join(", ")}</strong>
          </p>
        </div>
      )}

      {/* Sign off button */}
      <Button
        variant={signedOff ? "outline" : "primary"}
        size="xl"
        className="w-full gap-2"
        disabled={!allRequired || signedOff}
        onClick={() => setSignedOff(true)}
      >
        {signedOff
          ? <><CheckCircle className="h-5 w-5 text-green-600" /> Equipment Verified & Signed Off</>
          : <><ShieldCheck className="h-5 w-5" /> Sign Off Equipment Check</>
        }
      </Button>
    </div>
  );
}
