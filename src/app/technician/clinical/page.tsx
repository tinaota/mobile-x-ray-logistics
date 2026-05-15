"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { CPTCodeBadge } from "@/components/domain/CPTCodeBadge";
import { useOrders } from "@/lib/hooks/useOrders";
import { CheckCircle, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const VIEW_OPTIONS = [
  { value: "AP",    label: "AP (Anteroposterior)" },
  { value: "LAT",   label: "Lateral"              },
  { value: "PA",    label: "PA (Posteroanterior)"  },
  { value: "OBL",   label: "Oblique"              },
];

const TECHNIQUE_OPTIONS = [
  { value: "70-80kV / 5mAs",  label: "70-80 kV / 5 mAs (Chest, portable)" },
  { value: "80-90kV / 8mAs",  label: "80-90 kV / 8 mAs (Chest, AP erect)" },
  { value: "60-70kV / 10mAs", label: "60-70 kV / 10 mAs (Extremities)"    },
  { value: "90-100kV / 12mAs",label: "90-100 kV / 12 mAs (Abdomen)"       },
];

interface DocState {
  view: string;
  technique: string;
  notes: string;
  patientPositioning: string;
  saved: boolean;
}

export default function ClinicalPage() {
  const { orders, loading } = useOrders();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [docs, setDocs]         = useState<Record<string, DocState>>({});

  const activeOrders = orders.filter(o =>
    o.status === "in-progress" || o.status === "assigned" || o.status === "en-route"
  );

  const updateDoc = (id: string, field: keyof DocState, value: string | boolean) => {
    setDocs(prev => ({
      ...prev,
      [id]: { ...(prev[id] ?? { view: "", technique: "", notes: "", patientPositioning: "", saved: false }), [field]: value },
    }));
  };

  const saveDoc = (id: string) => {
    updateDoc(id, "saved", true);
    setExpanded(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      <div className="flex items-center justify-between">
        <h2 className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant">
          Clinical Documentation · {activeOrders.length} Active
        </h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-outline-variant/40 animate-pulse" />
          ))}
        </div>
      ) : activeOrders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle className="h-10 w-10 text-green-500" />
          <p className="text-sm font-semibold text-on-surface">No active orders requiring documentation</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeOrders.map(order => {
            const isExpanded = expanded === order.id;
            const doc = docs[order.id];
            const isSaved = doc?.saved;

            return (
              <div
                key={order.id}
                className={cn(
                  "bg-white rounded-xl border shadow-card overflow-hidden",
                  isSaved ? "border-green-300" : "border-outline-variant/40"
                )}
              >
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-container/30 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                >
                  {isSaved
                    ? <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                    : <FileText className="h-5 w-5 text-on-surface-variant shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-on-surface">{order.patientName}</span>
                      <CPTCodeBadge code={order.cptCode} />
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5 truncate">{order.procedure} · {order.facilityName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isSaved && <Badge variant="success" size="sm">Saved</Badge>}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-on-surface-variant" /> : <ChevronDown className="h-4 w-4 text-on-surface-variant" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-outline-variant/30 px-4 py-4 space-y-4 bg-surface-container/20 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        label="View / Projection"
                        value={doc?.view ?? ""}
                        onChange={e => updateDoc(order.id, "view", e.target.value)}
                        options={[{ value: "", label: "Select view…" }, ...VIEW_OPTIONS]}
                      />
                      <Select
                        label="Technique"
                        value={doc?.technique ?? ""}
                        onChange={e => updateDoc(order.id, "technique", e.target.value)}
                        options={[{ value: "", label: "Select technique…" }, ...TECHNIQUE_OPTIONS]}
                      />
                    </div>
                    <Input
                      label="Patient Positioning"
                      placeholder="e.g. Supine, portable AP…"
                      value={doc?.patientPositioning ?? ""}
                      onChange={e => updateDoc(order.id, "patientPositioning", e.target.value)}
                    />
                    <div>
                      <label className="block text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                        Clinical Notes
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Technologist notes, patient cooperation, repeat exposures…"
                        value={doc?.notes ?? ""}
                        onChange={e => updateDoc(order.id, "notes", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-white text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-medical-blue resize-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setExpanded(null)}>Cancel</Button>
                      <Button
                        variant="primary" size="sm" className="gap-1.5"
                        disabled={!doc?.view || !doc?.technique}
                        onClick={() => saveDoc(order.id)}
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Save Documentation
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
