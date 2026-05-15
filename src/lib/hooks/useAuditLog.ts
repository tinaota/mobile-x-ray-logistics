"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, type DbAuditLog } from "@/lib/supabase";

export interface AuditRow {
  id: string;
  cptCode: string;
  status: "verified" | "flagged" | "pending";
  revenueImpact: number;
  facility: string;
}

function toAuditRow(r: DbAuditLog): AuditRow {
  return {
    id:            r.id,
    cptCode:       r.cpt_code,
    status:        r.status,
    revenueImpact: r.revenue_impact,
    facility:      r.facility,
  };
}

export function useAuditLog() {
  const [rows, setRows]       = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { setError(error.message); return; }
    setRows((data ?? []).map(toAuditRow));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRows();

    const channel = supabase
      .channel("audit_log_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_log" }, () => {
        fetchRows();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchRows]);

  return { rows, loading, error, refetch: fetchRows };
}
