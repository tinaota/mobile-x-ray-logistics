"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, supabaseConfigured, type DbOrder } from "@/lib/supabase";
import { normalizeOrderStatus, type Order } from "@/lib/utils";
import { MOCK_ORDERS } from "@/lib/mock-data";
import { submitWrite } from "@/lib/offline-queue";

function toOrder(r: DbOrder): Order {
  return {
    id:              r.id,
    patientName:     r.patient_name,
    facilityName:    r.facility_name,
    address:         r.address,
    procedure:       r.procedure,
    cptCode:         r.cpt_code,
    priority:        r.priority,
    status:          normalizeOrderStatus(r.status),
    scheduledTime:   r.scheduled_time,
    distance:        r.distance ?? undefined,
    assignedTech:    r.assigned_tech ?? undefined,
    phone:           r.phone ?? undefined,
    reportStatus:    r.report_status ?? undefined,
    technicianId:    r.technician_id ?? undefined,
    modality:        r.modality ?? undefined,
    fastingRequired: r.fasting_required ?? undefined,
    priorAuthNumber: r.prior_auth_number ?? undefined,
  };
}

export function useOrders() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!supabaseConfigured) {
      setOrders(MOCK_ORDERS);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("scheduled_time");
    setLoading(false);
    if (error) { setError(error.message); return; }
    setOrders((data ?? []).map(toOrder));
  }, []);

  useEffect(() => {
    fetchOrders();
    if (!supabaseConfigured) return;

    const channel = supabase
      .channel("orders_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    if (!supabaseConfigured) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      return;
    }

    // Offline-first: apply optimistically and buffer the write locally.
    // flushWrites() replays it (in order) when connectivity returns.
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      await submitWrite({ kind: "order_status", orderId: id, status });
      return;
    }

    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { setError(error.message); return; }

    // Fire-and-forget SMS notification to patient on key status transitions
    const notifiable = ["assigned", "en-route", "in-progress", "complete"];
    if (notifiable.includes(status)) {
      const order = orders.find(o => o.id === id);
      if (order?.phone) {
        fetch("/api/sms/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId:       id,
            status,
            patientName:   order.patientName,
            phone:         order.phone,
            assignedTech:  order.assignedTech,
            scheduledTime: order.scheduledTime,
          }),
        }).catch(() => {});
      }
    }
  };

  const assignOrder = async (id: string, technicianId: string, assignedTech: string) => {
    if (!supabaseConfigured) return;
    const { error } = await supabase
      .from("orders")
      .update({ technician_id: technicianId, assigned_tech: assignedTech, status: "assigned" })
      .eq("id", id);
    if (error) setError(error.message);
  };

  return { orders, loading, error, updateOrderStatus, assignOrder, refetch: fetchOrders };
}
