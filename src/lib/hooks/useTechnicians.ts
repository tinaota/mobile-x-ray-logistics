"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, supabaseConfigured, type DbTechnician } from "@/lib/supabase";
import type { Technician } from "@/lib/utils";
import { MOCK_TECHNICIANS } from "@/lib/mock-data";

const TECH_FALLBACK_COORDS: Record<string, { lat: number; lng: number }> = {
  "tech-001": { lat: 33.479213, lng: -112.063412 }, // T. Parker
  "tech-002": { lat: 33.501415, lng: -112.018241 }, // M. Rivera
  "tech-003": { lat: 33.434190, lng: -112.108412 }, // J. Thompson
};

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
    latitude:         r.latitude !== undefined && r.latitude !== null ? Number(r.latitude) : (TECH_FALLBACK_COORDS[r.id]?.lat ?? 33.479213),
    longitude:        r.longitude !== undefined && r.longitude !== null ? Number(r.longitude) : (TECH_FALLBACK_COORDS[r.id]?.lng ?? -112.063412),
  };
}

export function useTechnicians() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const fetchTechnicians = useCallback(async () => {
    if (!supabaseConfigured) {
      setTechnicians(MOCK_TECHNICIANS);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("technicians")
      .select("*")
      .order("name");
    setLoading(false);
    if (error) { setError(error.message); return; }
    setTechnicians((data ?? []).map(toTechnician));
  }, []);

  useEffect(() => {
    fetchTechnicians();
    if (!supabaseConfigured) return;

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
