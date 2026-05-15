"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, type DbOrder } from "@/lib/supabase";
import type { Order } from "@/lib/utils";

function toOrder(r: DbOrder): Order {
  return {
    id:            r.id,
    patientName:   r.patient_name,
    facilityName:  r.facility_name,
    address:       r.address,
    procedure:     r.procedure,
    cptCode:       r.cpt_code,
    priority:      r.priority,
    status:        r.status,
    scheduledTime: r.scheduled_time,
    distance:      r.distance ?? undefined,
    assignedTech:  r.assigned_tech ?? undefined,
    phone:         r.phone ?? undefined,
  };
}

export function useOrders() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("scheduled_time");
    if (error) { setError(error.message); return; }
    setOrders((data ?? []).map(toOrder));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) setError(error.message);
  };

  const assignOrder = async (id: string, technicianId: string, assignedTech: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ technician_id: technicianId, assigned_tech: assignedTech, status: "assigned" })
      .eq("id", id);
    if (error) setError(error.message);
  };

  return { orders, loading, error, updateOrderStatus, assignOrder, refetch: fetchOrders };
}
