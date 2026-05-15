"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, type DbInvoice } from "@/lib/supabase";
import type { Invoice } from "@/components/domain/InvoiceRow";

function toInvoice(r: DbInvoice): Invoice {
  return {
    id:            r.id,
    patientName:   r.patient_name,
    facilityName:  r.facility_name,
    serviceDate:   r.service_date,
    cptCode:       r.cpt_code,
    icd10Code:     r.icd10_code,
    urgencyFactor: r.urgency_factor,
    baseFee:       r.base_fee,
    r0070Fee:      r.r0070_fee,
    mileageFee:    r.mileage_fee,
    totalAmount:   r.total_amount,
    status:        r.status,
    hasFlag:       r.has_flag,
    flagReason:    r.flag_reason ?? undefined,
  };
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { setError(error.message); return; }
    setInvoices((data ?? []).map(toInvoice));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();

    const channel = supabase
      .channel("invoices_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => {
        fetchInvoices();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchInvoices]);

  const updateInvoiceStatus = async (id: string, status: Invoice["status"]) => {
    const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
    if (error) setError(error.message);
  };

  return { invoices, loading, error, updateInvoiceStatus, refetch: fetchInvoices };
}
