"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, supabaseConfigured, type DbSyncQueue } from "@/lib/supabase";
import type { SyncStatus } from "@/lib/utils";
import { MOCK_SYNC_QUEUE } from "@/lib/mock-data";

export interface SyncRecord {
  id: string;
  orderId: string;
  patientName: string;
  field: string;
  localValue: string;
  serverValue?: string;
  syncStatus: SyncStatus;
  timestamp: string;
  size?: string;
}

function toSyncRecord(r: DbSyncQueue): SyncRecord {
  return {
    id:          r.id,
    orderId:     r.order_id ?? "",
    patientName: r.patient_name,
    field:       r.field,
    localValue:  r.local_value,
    serverValue: r.server_value ?? undefined,
    syncStatus:  r.sync_status,
    timestamp:   r.timestamp,
    size:        r.size ?? undefined,
  };
}

export function useSyncQueue() {
  const [records, setRecords] = useState<SyncRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!supabaseConfigured) {
      setRecords(MOCK_SYNC_QUEUE);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("sync_queue")
      .select("*")
      .order("created_at");
    setLoading(false);
    if (error) { setError(error.message); return; }
    setRecords((data ?? []).map(toSyncRecord));
  }, []);

  useEffect(() => {
    fetchQueue();
    if (!supabaseConfigured) return;

    const channel = supabase
      .channel("sync_queue_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sync_queue" }, () => {
        fetchQueue();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchQueue]);

  const markSynced = async (id: string) => {
    if (!supabaseConfigured) return;
    const { error } = await supabase
      .from("sync_queue").update({ sync_status: "synced" }).eq("id", id);
    if (error) setError(error.message);
  };

  const syncAll = async () => {
    if (!supabaseConfigured) return;
    const { error } = await supabase
      .from("sync_queue").update({ sync_status: "synced" }).eq("sync_status", "pending");
    if (error) setError(error.message);
    else fetchQueue();
  };

  return { records, loading, error, markSynced, syncAll, refetch: fetchQueue };
}
