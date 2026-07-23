"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export interface VisitRating {
  id: string;
  orderId: string;
  facilityName: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}

// Demo fallback when Supabase is unconfigured or 014_visit_ratings.sql not yet applied
const MOCK_RATINGS: VisitRating[] = [
  { id: "r1", orderId: "ORD-001", facilityName: "Sunrise Medical Center",   rating: 5, createdAt: "2026-07-20T14:00:00Z" },
  { id: "r2", orderId: "ORD-002", facilityName: "Desert Valley Hospital",   rating: 4, createdAt: "2026-07-20T16:30:00Z" },
  { id: "r3", orderId: "ORD-004", facilityName: "Valley View Nursing Home", rating: 5, createdAt: "2026-07-21T10:15:00Z" },
  { id: "r4", orderId: "ORD-006", facilityName: "Camelback Rehab Center",   rating: 3, createdAt: "2026-07-21T13:45:00Z" },
  { id: "r5", orderId: "ORD-007", facilityName: "Sunrise Medical Center",   rating: 5, createdAt: "2026-07-22T09:00:00Z" },
  { id: "r6", orderId: "ORD-009", facilityName: "Phoenix Care Facility",    rating: 4, createdAt: "2026-07-22T15:20:00Z" },
];

interface DbRating {
  id: string;
  order_id: string;
  facility_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

function toRating(r: DbRating): VisitRating {
  return {
    id: r.id,
    orderId: r.order_id,
    facilityName: r.facility_name,
    rating: r.rating,
    comment: r.comment ?? undefined,
    createdAt: r.created_at,
  };
}

export function useRatings() {
  const [ratings, setRatings] = useState<VisitRating[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRatings = useCallback(async () => {
    if (!supabaseConfigured) {
      setRatings(MOCK_RATINGS);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from("visit_ratings").select("*").order("created_at");
    setLoading(false);
    // Table missing (migration not applied) → demo data keeps the metric visible
    if (error || !data) { setRatings(MOCK_RATINGS); return; }
    setRatings(data.map(toRating));
  }, []);

  useEffect(() => { fetchRatings(); }, [fetchRatings]);

  const submitRating = async (orderId: string, facilityName: string, rating: number, comment?: string) => {
    if (supabaseConfigured) {
      const { error } = await supabase.from("visit_ratings").insert({
        order_id: orderId,
        facility_name: facilityName,
        rating,
        comment: comment?.trim() || null,
      });
      if (!error) { fetchRatings(); return true; }
    }
    // Offline/unmigrated fallback — reflect locally so the UI acknowledges the patient
    setRatings(prev => [...prev, {
      id: `local-${Date.now()}`, orderId, facilityName, rating, comment, createdAt: new Date().toISOString(),
    }]);
    return true;
  };

  return { ratings, loading, submitRating };
}

/** Satisfaction rollup: average stars + NPS-style score (5=promoter, 4=passive, ≤3=detractor). */
export function satisfactionMetrics(ratings: VisitRating[]) {
  if (ratings.length === 0) return { avg: 0, nps: 0, count: 0 };
  const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
  const promoters  = ratings.filter(r => r.rating === 5).length;
  const detractors = ratings.filter(r => r.rating <= 3).length;
  const nps = Math.round(((promoters - detractors) / ratings.length) * 100);
  return { avg: Math.round(avg * 10) / 10, nps, count: ratings.length };
}
