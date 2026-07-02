"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase, supabaseConfigured, type DbSpecimen } from "@/lib/supabase";
import type { Specimen } from "@/lib/utils";
import { MOCK_SPECIMENS } from "@/lib/mock-data";

function toSpecimen(r: DbSpecimen): Specimen {
  return {
    id:                   r.id,
    orderId:              r.order_id,
    accessionNumber:      r.accession_number,
    specimenType:         r.specimen_type,
    collectedAt:          r.collected_at,
    expiresAt:            r.expires_at,
    deliveredAt:          r.delivered_at ?? undefined,
    custodyTransferredTo: r.custody_transferred_to ?? undefined,
  };
}

/**
 * Live specimen chain-of-custody records. Dispatchers use this to watch
 * stability windows for samples in transit and to compute turnaround time.
 */
export function useSpecimens() {
  const [specimens, setSpecimens] = useState<Specimen[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetchSpecimens = useCallback(async () => {
    if (!supabaseConfigured) {
      setSpecimens(MOCK_SPECIMENS);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("specimens")
      .select("*")
      .order("collected_at", { ascending: false });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSpecimens((data ?? []).map(toSpecimen));
  }, []);

  useEffect(() => {
    fetchSpecimens();
    if (!supabaseConfigured) return;

    const channel = supabase
      .channel("specimens_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "specimens" }, () => {
        fetchSpecimens();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchSpecimens]);

  const byOrderId = useMemo(() => {
    const map = new Map<string, Specimen>();
    for (const s of specimens) if (!map.has(s.orderId)) map.set(s.orderId, s);
    return map;
  }, [specimens]);

  /** Average collected→delivered turnaround in minutes, null if no deliveries. */
  const avgTurnaroundMinutes = useMemo(() => {
    const delivered = specimens.filter(s => s.deliveredAt);
    if (delivered.length === 0) return null;
    const totalMs = delivered.reduce(
      (sum, s) => sum + (new Date(s.deliveredAt!).getTime() - new Date(s.collectedAt).getTime()),
      0
    );
    return Math.round(totalMs / delivered.length / 60000);
  }, [specimens]);

  return { specimens, byOrderId, avgTurnaroundMinutes, loading, error, refetch: fetchSpecimens };
}
