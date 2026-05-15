"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, type DbTechnician } from "@/lib/supabase";
import type { Technician } from "@/lib/utils";

function toTechnician(r: DbTechnician): Technician {
  return {
    id:               r.id,
    name:             r.name,
    initials:         r.initials,
    licenseNumber:    r.license_number,
    zone:             r.zone,
    activeOrders:     r.active_orders,
    completedToday:   r.completed_today,
    syncStatus:       r.sync_status,
    batteryLevel:     r.battery_level ?? undefined,
    lastSeen:         r.last_seen ?? undefined,
    credentialExpiry: r.credential_expiry ?? undefined,
    online:           r.online,
  };
}

export function useTechnicians() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const fetchTechnicians = useCallback(async () => {
    const { data, error } = await supabase
      .from("technicians")
      .select("*")
      .order("name");
    if (error) { setError(error.message); return; }
    setTechnicians((data ?? []).map(toTechnician));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTechnicians();

    const channel = supabase
      .channel("technicians_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "technicians" }, () => {
        fetchTechnicians();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTechnicians]);

  return { technicians, loading, error, refetch: fetchTechnicians };
}
