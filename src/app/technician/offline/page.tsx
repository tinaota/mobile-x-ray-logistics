"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SyncStatusBadge } from "@/components/ui/StatusBadge";
import { useSyncQueue } from "@/lib/hooks/useSyncQueue";
import { cn } from "@/lib/utils";
import type { SyncStatus } from "@/lib/utils";
import {
  CheckCircle, AlertTriangle, Clock, RefreshCw,
  ChevronDown, ChevronUp, Wifi, WifiOff,
} from "lucide-react";

type ConflictChoice = "local" | "server";

export default function OfflinePage() {
  const { records, loading, syncAll } = useSyncQueue();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [choices,  setChoices]  = useState<Record<string, ConflictChoice>>({});
  const [syncing,  setSyncing]  = useState(false);
  const [isOnline]              = useState(true);

  const pending   = records.filter(r => r.syncStatus === "pending").length;
  const conflicts = records.filter(r => r.syncStatus === "conflict").length;
  const synced    = records.filter(r => r.syncStatus === "synced").length;

  const pendingSizeKB = records
    .filter(r => r.syncStatus === "pending" && r.size)
    .reduce((acc, r) => {
      const num = parseFloat(r.size?.replace(/[^0-9.]/g, "") ?? "0");
      return acc + (r.size?.includes("MB") ? num * 1024 : num);
    }, 0);
  const pendingSizeLabel = pendingSizeKB > 1024
    ? `${(pendingSizeKB / 1024).toFixed(1)} MB`
    : `${pendingSizeKB.toFixed(0)} KB`;

  const resolveConflict = (id: string, choice: ConflictChoice) =>
    setChoices(prev => ({ ...prev, [id]: choice }));

  const handleSyncAll = async () => {
    setSyncing(true);
    await syncAll();
    setSyncing(false);
  };

  const statusIcon: Record<SyncStatus, React.ReactNode> = {
    synced:   <CheckCircle className="h-4 w-4 text-green-600" />,
    pending:  <Clock className="h-4 w-4 text-warning-amber" />,
    conflict: <AlertTriangle className="h-4 w-4 text-emergency-red" />,
    offline:  <WifiOff className="h-4 w-4 text-slate-gray" />,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Connection + summary */}
      <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline
              ? <><Wifi className="h-4 w-4 text-green-600" /><span className="text-sm font-semibold text-green-700">Online</span></>
              : <><WifiOff className="h-4 w-4 text-slate-gray" /><span className="text-sm font-semibold text-slate-600">Offline</span></>
            }
          </div>
          <SyncStatusBadge status={pending > 0 ? "pending" : "synced"} />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-green-50 rounded-xl py-2.5">
            <p className="text-xl font-mono font-bold text-green-700">{synced}</p>
            <p className="text-[11px] text-green-600 font-semibold font-label uppercase tracking-wider mt-0.5">Synced</p>
          </div>
          <div className="bg-amber-50 rounded-xl py-2.5">
            <p className="text-xl font-mono font-bold text-warning-amber">{pending}</p>
            <p className="text-[11px] text-amber-600 font-semibold font-label uppercase tracking-wider mt-0.5">Pending</p>
          </div>
          <div className="bg-red-50 rounded-xl py-2.5">
            <p className="text-xl font-mono font-bold text-emergency-red">{conflicts}</p>
            <p className="text-[11px] text-red-600 font-semibold font-label uppercase tracking-wider mt-0.5">Conflicts</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="primary" size="md" className="flex-1 gap-2"
          disabled={pending === 0 || syncing || !isOnline}
          onClick={handleSyncAll}
        >
          {syncing
            ? <><RefreshCw className="h-4 w-4 animate-spin" /> Syncing…</>
            : <><RefreshCw className="h-4 w-4" /> Sync All ({pendingSizeLabel})</>
          }
        </Button>
        {conflicts > 0 && (
          <Button
            variant="warning" size="md" className="flex-1 gap-2"
            disabled={Object.keys(choices).length < conflicts}
          >
            <CheckCircle className="h-4 w-4" /> Resolve All
          </Button>
        )}
      </div>

      {/* Records */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-white rounded-xl border border-outline-variant/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(record => {
            const isExpanded = expanded === record.id;
            const isConflict = record.syncStatus === "conflict";
            const choice     = choices[record.id];

            return (
              <div
                key={record.id}
                className={cn(
                  "bg-white rounded-xl border shadow-card overflow-hidden transition-all",
                  isConflict ? "border-emergency-red/40" : "border-outline-variant/40"
                )}
              >
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-container/40 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : record.id)}
                >
                  {statusIcon[record.syncStatus]}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-on-surface">{record.patientName}</span>
                      <span className="font-mono text-xs text-on-surface-variant">{record.orderId}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">{record.field} · {record.timestamp}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {record.size && <span className="text-[11px] font-mono text-on-surface-variant">{record.size}</span>}
                    <SyncStatusBadge status={record.syncStatus} />
                    {isExpanded
                      ? <ChevronUp className="h-4 w-4 text-on-surface-variant" />
                      : <ChevronDown className="h-4 w-4 text-on-surface-variant" />
                    }
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-outline-variant/30 px-4 py-3 space-y-3 bg-surface-container/30 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Field</p>
                        <p className="text-sm text-on-surface">{record.field}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Local Value</p>
                        <p className="text-sm font-mono text-on-surface">{record.localValue}</p>
                      </div>
                    </div>

                    {isConflict && record.serverValue && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-emergency-red">Conflict — choose which value to keep:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(["local", "server"] as ConflictChoice[]).map(side => (
                            <button
                              key={side}
                              onClick={() => resolveConflict(record.id, side)}
                              className={cn(
                                "rounded-xl border-2 p-3 text-left text-sm transition-all",
                                choice === side
                                  ? "border-medical-blue bg-blue-50"
                                  : "border-outline-variant hover:border-medical-blue/50"
                              )}
                            >
                              <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                                {side === "local" ? "Local (mine)" : "Server"}
                              </p>
                              <p className="font-mono text-on-surface">
                                {side === "local" ? record.localValue : record.serverValue}
                              </p>
                            </button>
                          ))}
                        </div>
                        {choice && (
                          <p className="text-xs text-medical-blue">
                            Will keep <strong>{choice}</strong> value on next sync.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && pending === 0 && conflicts === 0 && records.length > 0 && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-sm font-semibold text-on-surface">All records synced</p>
        </div>
      )}
    </div>
  );
}
