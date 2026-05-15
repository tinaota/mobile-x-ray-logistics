"use client";

import { useState } from "react";
import { CodeScrubberWidget } from "@/components/charts/CodeScrubberWidget";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { RefreshCw, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";

interface ScrubResult {
  id: string;
  orderId: string;
  patientName: string;
  cptCode: string;
  issue: string;
  severity: "error" | "warning" | "ok";
  action?: "fix" | "escalate" | "ignore";
}

const SCRUB_RESULTS: ScrubResult[] = [
  { id: "s1", orderId: "ORD-043", patientName: "James Okafor",   cptCode: "71046", issue: "Missing ICD-10 diagnosis code",              severity: "error"   },
  { id: "s2", orderId: "ORD-038", patientName: "Robert Hayes",   cptCode: "72100", issue: "Modifier conflict: 26 + TC on same claim",    severity: "error"   },
  { id: "s3", orderId: "ORD-041", patientName: "Maria Santos",   cptCode: "71046", issue: "Duplicate claim within 30-day window",         severity: "error"   },
  { id: "s4", orderId: "ORD-039", patientName: "Linda Chen",     cptCode: "72100", issue: "ICD-10 M54.5 not matching procedure site",     severity: "warning" },
  { id: "s5", orderId: "ORD-044", patientName: "Angela Torres",  cptCode: "73521", issue: "Missing R0070 portable surcharge",             severity: "warning" },
  { id: "s6", orderId: "ORD-045", patientName: "David Nguyen",   cptCode: "71046", issue: "CPT validated",                                severity: "ok"      },
  { id: "s7", orderId: "ORD-037", patientName: "Susan Park",     cptCode: "71045", issue: "CPT validated",                                severity: "ok"      },
  { id: "s8", orderId: "ORD-046", patientName: "Patricia Moore", cptCode: "73562", issue: "CPT validated",                                severity: "ok"      },
];

const DATE_OPTIONS = [
  { value: "today",  label: "Today"        },
  { value: "week",   label: "This Week"    },
  { value: "month",  label: "This Month"   },
  { value: "custom", label: "Custom Range" },
];

const severityConfig = {
  error:   { label: "Error",   className: "bg-red-50 text-emergency-red border-emergency-red/30",   dot: "bg-emergency-red"   },
  warning: { label: "Warning", className: "bg-amber-50 text-warning-amber border-warning-amber/30", dot: "bg-warning-amber"   },
  ok:      { label: "OK",      className: "bg-green-50 text-green-700 border-green-200",             dot: "bg-green-600"       },
};

export default function ScrubbingPage() {
  const [dateRange, setDateRange]   = useState("today");
  const [running, setRunning]       = useState(false);
  const [results, setResults]       = useState(SCRUB_RESULTS);
  const [actions, setActions]       = useState<Record<string, ScrubResult["action"]>>({});

  const errors   = results.filter(r => r.severity === "error").length;
  const warnings = results.filter(r => r.severity === "warning").length;
  const clean    = results.filter(r => r.severity === "ok").length;

  const handleRunScrub = async () => {
    setRunning(true);
    await new Promise(r => setTimeout(r, 1800));
    setRunning(false);
  };

  const setAction = (id: string, action: ScrubResult["action"]) => {
    setActions(prev => ({ ...prev, [id]: action }));
  };

  const handleReconcile = () => {
    setResults(prev =>
      prev.map(r =>
        actions[r.id] === "fix" ? { ...r, severity: "ok" as const, issue: "Auto-corrected" } : r
      )
    );
  };

  const scrubWidgetItems = results
    .filter(r => r.severity !== "ok")
    .map(r => ({ code: `${r.severity === "error" ? "ERR" : "WARN"}_${r.cptCode} · ${r.orderId}`, status: r.severity === "error" ? "error" as const : "ok" as const }));

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Controls */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="w-44">
          <Select
            label="Date Range"
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            options={DATE_OPTIONS}
          />
        </div>
        <Button
          variant="primary"
          size="md"
          className="gap-2"
          onClick={handleRunScrub}
          disabled={running}
        >
          {running
            ? <><RefreshCw className="h-4 w-4 animate-spin" /> Running Scrub…</>
            : <><RefreshCw className="h-4 w-4" /> Run Scrub</>
          }
        </Button>
        <div className="ml-auto flex items-center gap-3">
          <Badge variant="stat"    size="md">{errors} Errors</Badge>
          <Badge variant="urgent"  size="md">{warnings} Warnings</Badge>
          <Badge variant="success" size="md">{clean} Clean</Badge>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Results list */}
        <div className="lg:col-span-2 space-y-2">
          {results.map(result => {
            const sc = severityConfig[result.severity];
            const chosenAction = actions[result.id];
            return (
              <div
                key={result.id}
                className={cn(
                  "bg-white rounded-xl border shadow-card px-4 py-3.5 space-y-2",
                  result.severity === "error"   ? "border-emergency-red/30" :
                  result.severity === "warning" ? "border-warning-amber/30" :
                  "border-outline-variant/40"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5 h-2 w-2 rounded-full shrink-0 mt-1.5", sc.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-on-surface">{result.patientName}</span>
                      <span className="font-mono text-xs text-on-surface-variant">{result.orderId}</span>
                      <span className="font-mono text-xs font-bold text-medical-blue">{result.cptCode}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">{result.issue}</p>
                  </div>
                  <span className={cn("shrink-0 text-[10px] font-label font-semibold uppercase tracking-wider px-2 py-1 rounded-full border", sc.className)}>
                    {sc.label}
                  </span>
                </div>

                {result.severity !== "ok" && (
                  <div className="flex items-center gap-2 pl-5">
                    {(["fix", "escalate", "ignore"] as const).map(act => (
                      <button
                        key={act}
                        onClick={() => setAction(result.id, act)}
                        className={cn(
                          "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all capitalize",
                          chosenAction === act
                            ? act === "fix"      ? "bg-medical-blue text-white border-medical-blue"
                            : act === "escalate" ? "bg-emergency-red text-white border-emergency-red"
                            :                      "bg-slate-200 text-slate-700 border-slate-300"
                            : "border-outline-variant text-on-surface-variant hover:border-medical-blue/50"
                        )}
                      >
                        {act === "fix" && <CheckCircle className="inline h-3 w-3 mr-1" />}
                        {act === "escalate" && <AlertCircle className="inline h-3 w-3 mr-1" />}
                        {act === "ignore" && <ChevronRight className="inline h-3 w-3 mr-1" />}
                        {act}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scrubber widget sidebar */}
        <div className="space-y-4">
          <CodeScrubberWidget items={scrubWidgetItems.length ? scrubWidgetItems : undefined} onReconcile={handleReconcile} />
          <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card px-4 py-4 space-y-2">
            <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">Actions Pending</p>
            <p className="font-mono text-2xl font-bold text-on-surface">{Object.keys(actions).length}</p>
            <Button
              variant="primary"
              size="md"
              className="w-full gap-2 mt-2"
              disabled={Object.keys(actions).length === 0}
              onClick={handleReconcile}
            >
              <CheckCircle className="h-4 w-4" /> Apply All Actions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
