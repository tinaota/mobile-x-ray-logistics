"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CPTCodeBadge } from "@/components/domain/CPTCodeBadge";
import { useOrders } from "@/lib/hooks/useOrders";
import { SyncStatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import {
  CheckCircle, Circle, AlertTriangle, Upload,
  ZoomIn, RotateCw, Layers, Eye,
} from "lucide-react";

interface QCItem {
  id: string;
  label: string;
  description: string;
}

const QC_CHECKLIST: QCItem[] = [
  { id: "q1", label: "Anatomy fully included",   description: "All relevant anatomy within the field" },
  { id: "q2", label: "Exposure adequate",         description: "No under/over-exposure artifacts" },
  { id: "q3", label: "Patient ID on image",       description: "Name, DOB, and MRN visible" },
  { id: "q4", label: "Correct marker (L/R)",      description: "Left/right anatomical marker placed" },
  { id: "q5", label: "No motion artifact",        description: "Image is sharp with no blur" },
  { id: "q6", label: "Projection correct",        description: "Matches ordered view (AP/PA/Lat)" },
];

type UploadState = "idle" | "uploading" | "done" | "error";

interface UploadRecord { time: Date; success: boolean; }

function formatUploadTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// Seeded with representative previous uploads so the ribbon is useful from first load
const INITIAL_LOG: UploadRecord[] = [
  { time: new Date(Date.now() - 2 * 60 * 60 * 1000), success: true  },
  { time: new Date(Date.now() - 3 * 60 * 60 * 1000), success: true  },
  { time: new Date(Date.now() - 4 * 60 * 60 * 1000), success: false },
  { time: new Date(Date.now() - 5 * 60 * 60 * 1000), success: true  },
];

export default function ScanPage() {
  const { orders, loading } = useOrders();
  const [activeOrder, setActiveOrder] = useState<string | null>(null);
  const [checked,     setChecked]     = useState<Set<string>>(new Set());
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [retakeMode,  setRetakeMode]  = useState(false);
  const [uploadLog,   setUploadLog]   = useState<UploadRecord[]>(INITIAL_LOG);

  const inProgress = orders.filter(o => o.status === "in-progress");
  const currentOrder = inProgress[0];

  const allQCPassed = QC_CHECKLIST.every(q => checked.has(q.id));

  // Upload KPI ribbon computations
  const successCount = uploadLog.filter(r => r.success).length;
  const successRate  = uploadLog.length > 0
    ? Math.round((successCount / uploadLog.length) * 100)
    : 0;
  const lastUpload   = uploadLog.length > 0 ? uploadLog[0] : null;

  const toggleCheck = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleUpload = async () => {
    setUploadState("uploading");
    await new Promise(r => setTimeout(r, 2000));
    const success = Math.random() > 0.1; // 90% success rate simulation
    setUploadState(success ? "done" : "error");
    setUploadLog(prev => [{ time: new Date(), success }, ...prev]);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Image Upload KPI Ribbon */}
      <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card flex divide-x divide-outline-variant/40">
        <div className="flex-1 px-4 py-3">
          <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-0.5">
            Uploads Today
          </p>
          <p className="font-mono text-xl font-bold text-on-surface">{uploadLog.length}</p>
        </div>
        <div className="flex-1 px-4 py-3">
          <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-0.5">
            Success Rate
          </p>
          <p className={`font-mono text-xl font-bold ${successRate >= 90 ? "text-green-600" : successRate >= 75 ? "text-warning-amber" : "text-emergency-red"}`}>
            {successRate}%
          </p>
        </div>
        <div className="flex-1 px-4 py-3">
          <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-0.5">
            Last Upload
          </p>
          {lastUpload ? (
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${lastUpload.success ? "bg-green-500" : "bg-emergency-red"}`} />
              <p className="font-mono text-sm font-semibold text-on-surface">{formatUploadTime(lastUpload.time)}</p>
            </div>
          ) : (
            <p className="font-mono text-sm text-slate-gray">—</p>
          )}
        </div>
      </div>

      {/* Order selector */}
      {loading ? (
        <div className="h-20 bg-white rounded-xl border border-outline-variant/40 animate-pulse" />
      ) : !currentOrder ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center bg-white rounded-xl border border-outline-variant/40 shadow-card">
          <CheckCircle className="h-10 w-10 text-green-500" />
          <p className="text-sm font-semibold text-on-surface">No orders currently in progress</p>
          <p className="text-xs text-on-surface-variant">Start a procedure from the Active Order screen</p>
        </div>
      ) : (
        <>
          {/* Active order card */}
          <div className="bg-white rounded-xl border border-medical-blue/30 shadow-card px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">Active Scan</p>
              <SyncStatusBadge status="synced" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-on-surface">{currentOrder.patientName}</p>
                <p className="text-sm text-on-surface-variant">{currentOrder.facilityName}</p>
                <p className="text-sm text-on-surface-variant">{currentOrder.procedure}</p>
              </div>
              <CPTCodeBadge code={currentOrder.cptCode} />
            </div>
          </div>

          {/* Image preview placeholder */}
          <div className="bg-midnight-navy rounded-xl overflow-hidden relative">
            <div className="h-48 flex items-center justify-center">
              {uploadState === "done" ? (
                <div className="flex flex-col items-center gap-2 text-green-400">
                  <CheckCircle className="h-12 w-12" />
                  <p className="text-sm font-semibold">Image uploaded to PACS</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Layers className="h-12 w-12 opacity-40" />
                  <p className="text-sm">{retakeMode ? "Retake in progress…" : "DICOM image will appear here"}</p>
                </div>
              )}
            </div>
            {/* Image controls */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              {[ZoomIn, RotateCw, Eye].map((Icon, i) => (
                <button key={i} className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <Icon className="h-4 w-4 text-white" />
                </button>
              ))}
            </div>
          </div>

          {/* QC Checklist */}
          <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card overflow-hidden">
            <div className="px-5 py-3 border-b border-outline-variant/30 bg-surface-container/50 flex items-center justify-between">
              <h3 className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface">Quality Check</h3>
              <span className="text-xs font-mono text-on-surface-variant">{checked.size}/{QC_CHECKLIST.length}</span>
            </div>
            <div className="divide-y divide-outline-variant/20">
              {QC_CHECKLIST.map(item => {
                const isChecked = checked.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={cn(
                      "w-full flex items-start gap-3 px-5 py-3 text-left transition-colors",
                      isChecked ? "bg-green-50/50" : "hover:bg-surface-container/40"
                    )}
                  >
                    {isChecked
                      ? <CheckCircle className="h-4.5 w-4.5 text-green-600 shrink-0 mt-0.5" />
                      : <Circle className="h-4.5 w-4.5 text-outline shrink-0 mt-0.5" />
                    }
                    <div>
                      <p className={cn("text-sm font-medium", isChecked && "line-through opacity-60")}>
                        {item.label}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Warning if QC incomplete */}
          {!allQCPassed && checked.size > 0 && (
            <div className="flex items-start gap-2 bg-amber-50 border border-warning-amber/40 rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-warning-amber shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">Complete all QC checks before uploading to PACS.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline" size="lg" className="flex-1 gap-2"
              onClick={() => { setRetakeMode(true); setUploadState("idle"); setChecked(new Set()); }}
            >
              <RotateCw className="h-4 w-4" /> Retake
            </Button>
            <Button
              variant="primary" size="lg" className="flex-1 gap-2"
              disabled={!allQCPassed || uploadState === "uploading" || uploadState === "done"}
              onClick={handleUpload}
            >
              {uploadState === "uploading"
                ? <><RotateCw className="h-4 w-4 animate-spin" /> Uploading…</>
                : uploadState === "done"
                ? <><CheckCircle className="h-4 w-4" /> Sent to PACS</>
                : uploadState === "error"
                ? <><AlertTriangle className="h-4 w-4" /> Retry Upload</>
                : <><Upload className="h-4 w-4" /> Upload to PACS</>
              }
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
