"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LiveMap, type LiveMapMarker } from "@/components/domain/LiveMap";
import { useOrders } from "@/lib/hooks/useOrders";
import { useTechnicians } from "@/lib/hooks/useTechnicians";
import { useRatings } from "@/lib/hooks/useRatings";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/utils";
import {
  CheckCircle2, MapPin, Phone, Clock, User,
  AlertTriangle, CalendarCheck, MessageCircle,
  ChevronRight, Info, X, Send, Sparkles, Shield, Star,
} from "lucide-react";

type ReportStatus = "pending" | "dictated" | "signed" | "delivered";

const STEPS: { label: string; caption: string }[] = [
  { label: "Appointment Scheduled",  caption: "Your request has been received"           },
  { label: "Technician Assigned",    caption: "A technician has been assigned to you"    },
  { label: "Technician On the Way",  caption: "Your technician is heading to you now"    },
  { label: "Technician Has Arrived", caption: "Your X-ray is being taken"                },
  { label: "Scan Complete",          caption: "Your images have been captured"           },
  { label: "Results Ready",          caption: "Your report has been sent to your doctor" },
];

const STATUS_TO_STEP: Record<OrderStatus, number> = {
  pending:       0,
  assigned:      1,
  "en-route":    2,
  "in-progress": 3,
  "in-transit":  4,
  complete:      4,
  billed:        4,
};

const RESULT_MESSAGES: Record<ReportStatus, { text: string; cls: string }> = {
  pending:   { text: "Your images are being reviewed by a radiologist",   cls: "bg-slate-50 border-slate-200 text-slate-700"  },
  dictated:  { text: "A radiologist has reviewed your images",            cls: "bg-blue-50 border-blue-200 text-blue-700"     },
  signed:    { text: "Your report has been approved by a physician",      cls: "bg-green-50 border-green-200 text-green-700"  },
  delivered: { text: "Your report has been sent to your doctor",          cls: "bg-green-50 border-green-200 text-green-700"  },
};

const PREP_CHECKLIST = [
  "Remove all jewelry and metal accessories near the area being X-rayed",
  "Wear loose, comfortable clothing — avoid metal zippers or buttons",
  "Ensure a clear pathway to the room for portable equipment",
  "Have your ID and insurance card accessible",
  "A family member or caregiver is welcome to stay in the room",
];

// Haversine distance formula to calculate mileage between coordinates
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Hero Status Card configuration mapper based on active order status
function getHeroConfig(status: OrderStatus, reportStatus: ReportStatus, etaText: string) {
  if (reportStatus === "delivered") {
    return {
      tone: "green",
      icon: CheckCircle2,
      eyebrow: "Results ready",
      title: "Your report has been sent",
      sub: "Your results were delivered to your referring doctor. If you haven't heard from their office within 48 hours, please reach out to them directly.",
      eta: null
    };
  }
  switch (status) {
    case "pending":
      return {
        tone: "navy",
        icon: Clock,
        eyebrow: "Request received",
        title: "We've got your request",
        sub: "Your dispatcher is matching you with a technician. You'll get a confirmation here shortly — no need to call.",
        eta: null
      };
    case "assigned":
      return {
        tone: "blue",
        icon: CheckCircle2,
        eyebrow: "Appointment confirmed",
        title: "You're all set",
        sub: "Marcus Reyes is assigned to your visit and will arrive today during your scheduled window.",
        eta: null
      };
    case "en-route":
      return {
        tone: "blue",
        icon: MapPin,
        eyebrow: "Technician on the way",
        title: "Marcus is heading to you",
        sub: "You can track his arrival below. He will call you when he reaches the building.",
        eta: etaText
      };
    case "in-progress":
      return {
        tone: "green",
        icon: User,
        eyebrow: "Technician has arrived",
        title: "Your technician is here",
        sub: "Marcus is setting up the portable equipment. Your X-ray usually takes 15–30 minutes.",
        eta: null
      };
    case "complete":
    case "billed":
      return {
        tone: "navy",
        icon: Sparkles,
        eyebrow: "Scan complete",
        title: "Your images are in review",
        sub: "A radiologist is reviewing your X-ray. Results are typically ready within 24–48 hours.",
        eta: null
      };
    default:
      return null;
  }
}

export default function ClientAppointmentPage() {
  const { orders, loading } = useOrders();
  const { technicians } = useTechnicians();

  const order = orders.find(o => o.status !== "complete" && o.status !== "billed") ?? null;
  const reportStatus = (order?.reportStatus ?? "pending") as ReportStatus;

  // Find dynamic technician tracking data
  const activeTech = order && technicians.length > 0
    ? technicians.find(t => t.id === order.technicianId || t.name === order.assignedTech) ?? null
    : null;

  // Compute travel-time geodetic ETA
  let etaText = "~15 min away";
  let distanceMiles = 0;
  if (order && activeTech && activeTech.latitude && activeTech.longitude) {
    distanceMiles = getHaversineDistance(
      activeTech.latitude, activeTech.longitude,
      33.462, -112.089 // default facility / service destination lat/lng
    );
    if (distanceMiles < 0.1) {
      etaText = "Arriving now";
    } else {
      const travelMinutes = Math.max(2, Math.round(distanceMiles * 2.4));
      etaText = `~${travelMinutes} min away (${distanceMiles.toFixed(1)} mi)`;
    }
  }

  // Get dynamic Hero Card configuration
  const heroCfg = order ? getHeroConfig(order.status, reportStatus, etaText) : null;

  // Bug fix: Results Ready (step 5) activates when report is delivered
  const activeStep = reportStatus === "delivered"
    ? 5
    : order ? STATUS_TO_STEP[order.status] : -1;

  // Prep checklist — dismissed per order in localStorage
  const prepKey = order ? `prep-dismissed-${order.id}` : null;
  const [prepDismissed, setPrepDismissed] = useState(false);
  useEffect(() => {
    if (prepKey) setPrepDismissed(!!localStorage.getItem(prepKey));
  }, [prepKey]);
  const dismissPrep = () => {
    if (prepKey) localStorage.setItem(prepKey, "1");
    setPrepDismissed(true);
  };

  // Visit rating — asked once per order after scan complete
  const { submitRating } = useRatings();
  const ratingKey = order ? `visit-rated-${order.id}` : null;
  const [rated, setRated]             = useState(false);
  const [starHover, setStarHover]     = useState(0);
  const [starValue, setStarValue]     = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  useEffect(() => {
    if (ratingKey) setRated(!!localStorage.getItem(ratingKey));
  }, [ratingKey]);
  const sendRating = async () => {
    if (!order || starValue === 0) return;
    await submitRating(order.id, order.facilityName, starValue, ratingComment);
    if (ratingKey) localStorage.setItem(ratingKey, "1");
    setRated(true);
  };

  // Interactive Checklist Checkboxes state
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const toggleCheck = (idx: number) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };
  const prepDoneCount = Object.values(checkedItems).filter(Boolean).length;

  // Access instructions message — direct DB insert & chat log simulation
  const [accessNote, setAccessNote]   = useState("");
  const [messages, setMessages] = useState<{ id: string; sender_role: string; sender_name: string; content: string; created_at: string; read_at: string | null }[]>([]);

  // Fetch initial messages & subscribe to real-time updates for this order
  useEffect(() => {
    if (!order) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("order_id", order.id)
        .order("created_at", { ascending: true });
      if (!error && data) {
        setMessages(data);
      }
    };
    fetchMessages();

    const channel = supabase
      .channel(`order-messages-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `order_id=eq.${order.id}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order]);

  // Reading the thread clears inbound (dispatcher/technician) unread state
  useEffect(() => {
    if (!order) return;
    const unreadInbound = messages.filter(m => m.sender_role !== "patient" && !m.read_at);
    if (unreadInbound.length === 0) return;
    supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadInbound.map(m => m.id))
      .then(() => {});
  }, [messages, order]);

  const sendAccessNote = async () => {
    if (!accessNote.trim() || !order) return;
    const { error } = await supabase.from("messages").insert({
      order_id: order.id,
      sender_role: "patient",
      sender_name: "Patient",
      content: `Access Instructions: ${accessNote}`,
      channel: "in_app"
    });
    if (!error) {
      setAccessNote("");
    }
  };

  const mapMarkers: LiveMapMarker[] = order ? [
    { id: "home", lat: 33.462, lng: -112.089, type: "order", label: order.facilityName, priority: order.priority, color: "#16a34a" },
    ...( ["en-route", "in-progress"].includes(order.status) && activeTech ? [{
      id: "tech",
      lat: activeTech.latitude ?? 33.479,
      lng: activeTech.longitude ?? -112.063,
      type: "technician" as const,
      label: activeTech.name ?? "Your Technician",
      status: order.status === "en-route" ? "En Route" : "Arrived",
    }] : []),
  ] : [];

  // Travel path technician → home while en-route (dashed, Uber-style)
  const mapRoutes = order?.status === "en-route" && activeTech ? [{
    id: "route",
    positions: [
      [activeTech.latitude ?? 33.479, activeTech.longitude ?? -112.063],
      [33.462, -112.089],
    ] as [number, number][],
    color: "#3B82F6",
  }] : [];

  const showPrep      = order?.status === "assigned" && !prepDismissed;
  const showMap       = mapMarkers.length > 0;
  const showAccessMsg = order?.status === "assigned" || order?.status === "en-route";
  const showResults   = order?.status === "complete" || order?.status === "billed";
  const isComplete    = showResults;
  const isTracking    = order && ["en-route", "in-progress"].includes(order.status);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-8 animate-pulse">
        <div className="h-40 bg-white rounded-proto-lg border border-outline-variant/40" />
        <div className="h-72 bg-white rounded-proto-lg border border-outline-variant/40" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-4">
        <Card className="rounded-proto-lg shadow-proto-card border border-outline-variant/40 bg-white overflow-hidden">
          <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-blue-tint flex items-center justify-center">
              <CalendarCheck className="h-8 w-8 text-medical-blue" />
            </div>
            <div>
              <p className="text-lg font-semibold text-on-surface">No active appointment</p>
              <p className="text-sm text-on-surface-variant max-w-xs mt-1 leading-relaxed">
                Request a mobile X-ray visit and a dispatcher will confirm your appointment.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
              <Button variant="primary" size="lg" className="w-full h-12 rounded-proto-md shadow-proto-fab hover:bg-blue-600 transition-all duration-150 gap-2" onClick={() => window.location.href = "/client/request"}>
                <Sparkles className="h-4 w-4" />
                Request Appointment
              </Button>
              <Button variant="outline" size="lg" className="w-full h-12 rounded-proto-md transition-colors gap-2">
                <Phone className="h-4 w-4" />
                Call Care Coordinator
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-proto-lg shadow-proto-card border border-outline-variant/30 bg-white overflow-hidden">
          <CardContent className="py-5 space-y-3">
            <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-4">
              What to Expect
            </p>
            {[
              { icon: Clock,     text: "Most visits take 15–30 minutes from arrival" },
              { icon: User,      text: "Your technician will call ahead before arriving" },
              { icon: MessageCircle, text: "Results sent to your doctor within 24–48 hours" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-on-surface-variant">
                <Icon className="h-4 w-4 shrink-0 text-medical-blue" />
                <span>{text}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24 pt-4">

      {/* Dynamic Hero Status Card — Liquid Glass Gradient treatments */}
      {heroCfg && (
        <div
          role="status"
          aria-live="polite"
          className="relative overflow-hidden rounded-proto-xl p-6 text-white shadow-proto-pop bg-gradient-to-br from-slate-700 to-midnight-navy animate-fade-in"
        >
          {/* Gradient layers crossfade on status change — background-image itself can't transition */}
          {([
            ["blue",  "bg-gradient-to-br from-blue-500 to-blue-700"],
            ["navy",  "bg-gradient-to-br from-slate-700 to-midnight-navy"],
            ["amber", "bg-gradient-to-br from-amber-500 to-warning-amber"],
            ["green", "bg-gradient-to-br from-green-500 to-green-700"],
          ] as const).map(([tone, gradient]) => (
            <div
              key={tone}
              aria-hidden="true"
              className={cn(
                "absolute inset-0 pointer-events-none transition-opacity duration-700 ease-in-out",
                gradient,
                heroCfg.tone === tone ? "opacity-100" : "opacity-0"
              )}
            />
          ))}
          {/* Background shine sphere */}
          <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-white/10 filter blur-md pointer-events-none" />

          <div className="relative">
          <div className="flex items-center gap-2 text-[10px] font-label font-semibold uppercase tracking-wider text-white/80">
            <heroCfg.icon className="h-4 w-4 shrink-0" />
            {heroCfg.eyebrow}
          </div>

          <p className="text-2xl font-bold leading-tight mt-3 mb-1.5">{heroCfg.title}</p>
          <p className="text-sm text-white/95 leading-relaxed">{heroCfg.sub}</p>

          {heroCfg.eta && (
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                </span>
                <div className="flex items-baseline">
                  <span className="font-mono text-3xl font-semibold tracking-tight">{heroCfg.eta.split(" ")[0]}</span>
                  <span className="text-xs ml-1 opacity-90">{heroCfg.eta.split(" ").slice(1).join(" ")}</span>
                </div>
              </div>
              <p className="text-xs text-white/80 text-right leading-snug">
                Arriving by<br />
                <strong className="font-semibold text-white">Soon</strong>
              </p>
            </div>
          )}
          </div>
        </div>
      )}

      {/* STAT notice — rendered contextually below hero block */}
      {order.priority === "stat" && heroCfg?.tone !== "amber" && (
        <div className="flex items-start gap-3 bg-warning-amber-tint border border-warning-amber/40 rounded-proto-md px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-warning-amber-ink shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-warning-amber-ink">
            Your appointment is high priority — a technician is being dispatched as soon as possible.
          </p>
        </div>
      )}

      {/* Contextual prep checklist — shown when assigned, dismissible and stateful */}
      {showPrep && (
        <Card className="border-medical-blue/30 bg-blue-tint rounded-proto-lg shadow-proto-card overflow-hidden">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-medical-blue text-white flex items-center justify-center shrink-0">
                  <Shield className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface leading-tight">Before your technician arrives</p>
                  <p className="text-xs text-medical-blue font-medium mt-0.5">
                    {prepDoneCount} of {PREP_CHECKLIST.length} ready · takes 2 minutes
                  </p>
                </div>
              </div>
              <button
                onClick={dismissPrep}
                className="h-6 w-6 rounded flex items-center justify-center text-on-surface-variant hover:bg-medical-blue/10 transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            
            <ul className="divide-y divide-blue-500/10">
              {PREP_CHECKLIST.map((item, idx) => {
                const isChecked = !!checkedItems[idx];
                return (
                  <li
                    key={item}
                    onClick={() => toggleCheck(idx)}
                    className={cn(
                      "flex items-start gap-3 py-3 cursor-pointer select-none transition-all duration-150",
                      isChecked ? "opacity-50 line-through decoration-blue-500/40" : ""
                    )}
                  >
                    <div className={cn(
                      "h-5 w-5 rounded-md border-2 border-medical-blue bg-white flex items-center justify-center shrink-0 mt-0.5 transition-all",
                      isChecked ? "bg-medical-blue" : ""
                    )}>
                      {isChecked && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <span className="text-sm text-slate-800 leading-snug">{item}</span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Appointment card */}
      <Card className="rounded-proto-lg shadow-proto-card border border-outline-variant/40 bg-white overflow-hidden">
        <CardContent className="space-y-4 py-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">
              Your Appointment
            </p>
            <div className="flex items-center gap-3">
              {prepDismissed && order.status === "assigned" && (
                <button
                  onClick={() => {
                    if (prepKey) localStorage.removeItem(prepKey);
                    setPrepDismissed(false);
                  }}
                  className="text-xs text-medical-blue hover:underline font-semibold"
                >
                  Show Prep Checklist
                </button>
              )}
              <span className="font-mono text-xs font-bold text-on-surface-variant">{order.id}</span>
            </div>
          </div>

          <div>
            <p className="text-xl font-semibold text-on-surface">{order.procedure}</p>
            <p className="text-sm text-on-surface-variant mt-0.5">{order.patientName} · DOB 04/18/1948</p>
          </div>

          <div className="space-y-3 text-sm text-on-surface-variant">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-medical-blue" />
              <span className="font-mono font-semibold text-on-surface">{order.scheduledTime}</span>
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-medical-blue" />
              <span className="truncate">{order.address || order.facilityName}</span>
            </span>
            
            {/* Extended Technician Profile Avatar & Circular Call Button */}
            {activeTech && (
              <div className="border-t border-outline-variant/40 pt-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white font-label font-bold text-sm flex items-center justify-center shrink-0">
                  {activeTech.initials || activeTech.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-on-surface leading-none">{activeTech.name}</span>
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 leading-none",
                      order.status === "en-route" ? "bg-blue-tint text-medical-blue" : "bg-green-tint text-green-ink"
                    )}>
                      {order.status === "en-route" ? "En Route" : "Arrived"}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant/75 mt-1">
                    Licensed Radiologic Tech · {activeTech.licenseNumber || "RT-AZ-29841"}
                  </p>
                </div>
                <a
                  href="tel:(602) 555-0100"
                  className="h-10 w-10 rounded-xl bg-blue-tint text-medical-blue hover:bg-medical-blue/15 active:scale-95 transition-all duration-150 flex items-center justify-center shrink-0 border border-medical-blue/10"
                  aria-label="Call technician"
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Access instructions — with dynamic delivered chat log bubbles */}
      {showAccessMsg && (
        <Card className="rounded-proto-lg shadow-proto-card border border-outline-variant/40 bg-white overflow-hidden">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2 mb-1 text-medical-blue">
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span className="text-[10px] font-label font-semibold uppercase tracking-wider text-medical-blue">
                Message your technician
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">Gate code, parking info, or floor number for your technician.</p>
            
            {/* Dynamic message bubble stream */}
            {messages.length > 0 && (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 mb-4 scrollbar-thin">
                {messages.map((msg) => {
                  const isPatient = msg.sender_role === "patient";
                  const contentStr = msg.content.replace(/^Access Instructions:\s*/, "").replace(/^Special Notes:\s*/, "");
                  return (
                    <div
                      key={msg.id}
                      className={cn("flex w-full mb-1", isPatient ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2 text-sm max-w-[85%] shadow-sm transition-all duration-150",
                          isPatient
                            ? "bg-medical-blue text-white rounded-tr-sm"
                            : "bg-slate-100 text-slate-800 border border-slate-200/60 rounded-tl-sm"
                        )}
                      >
                        {!isPatient && (
                          <span className="block text-[9px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wide">
                            {msg.sender_name || "Support"}
                          </span>
                        )}
                        <p className="leading-snug">{contentStr}</p>
                        <div className={cn("flex items-center gap-1 text-[9px] mt-1", isPatient ? "text-white/80 justify-end" : "text-slate-400 justify-start")}>
                          {isPatient && <CheckCircle2 className="h-3 w-3 text-white/90" />}
                          <span>{isPatient && msg.read_at ? "Read" : "Delivered"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={accessNote}
                onChange={e => setAccessNote(e.target.value)}
                placeholder="Send a note to technician..."
                className="flex-1 h-12 px-3 rounded-proto-md bg-slate-50 border border-outline-variant text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-medical-blue focus:border-transparent"
              />
              <button
                onClick={sendAccessNote}
                disabled={!accessNote.trim()}
                className="h-12 px-4 rounded-proto-md bg-medical-blue text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none hover:bg-blue-600 transition-all duration-150 shadow-proto-fab active:scale-[0.98]"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visit status stepper */}
      <Card className="rounded-proto-lg shadow-proto-card border border-outline-variant/40 bg-white overflow-hidden">
        <CardContent className="py-5">
          <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-5">
            Visit Status
          </p>
          {/* Announces step changes to screen readers without re-reading the whole list */}
          <p className="sr-only" role="status" aria-live="polite">
            Current step: {STEPS[activeStep]?.label}. {STEPS[activeStep]?.caption}
          </p>
          <div className="flex flex-col">
            {STEPS.map((step, i) => {
              const state = i < activeStep ? "done" : i === activeStep ? "active" : "future";
              return (
                <div key={step.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-all",
                      state === "done"   ? "bg-green-500" :
                      state === "active" ? "bg-medical-blue ring-4 ring-medical-blue/20" :
                                           "bg-outline-variant/30"
                    )}>
                      {state === "done"
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        : state === "active"
                        ? <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        : <span className="h-2 w-2 rounded-full bg-outline-variant/50" />
                      }
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={cn(
                        "w-0.5 my-1 flex-1 min-h-[1.25rem]",
                        i < activeStep ? "bg-green-400" : "bg-outline-variant/30"
                      )} />
                    )}
                  </div>
                  <div className="pb-4 pt-0.5">
                    <p className={cn(
                      "text-sm font-semibold leading-tight",
                      state === "done"   ? "text-green-700" :
                      state === "active" ? "text-on-surface" :
                                           "text-on-surface-variant/40"
                    )}>
                      {step.label}
                    </p>
                    {state !== "future" && (
                      <p className="text-xs text-on-surface-variant mt-0.5">{step.caption}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Live map — en-route or in-progress only */}
      {showMap && <LiveMap markers={mapMarkers} routes={mapRoutes} height="h-48" showLegend={false} />}

      {/* Results status — after scan complete */}
      {showResults && (
        <div className={cn(
          "flex items-start gap-3 rounded-proto-lg border px-4 py-3 shadow-proto-card bg-white",
          RESULT_MESSAGES[reportStatus].cls
        )}>
          <MessageCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">{RESULT_MESSAGES[reportStatus].text}</p>
            {reportStatus === "delivered" && (
              <p className="text-xs mt-1 opacity-80">
                If you haven&apos;t heard from your doctor within 48 hours, contact their office directly.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Visit rating — once per order, after scan complete */}
      {showResults && (
        <Card className="rounded-proto-lg shadow-proto-card border border-outline-variant/40 bg-white overflow-hidden">
          <CardContent className="py-5 space-y-3">
            {rated ? (
              <div className="flex items-center gap-2.5 text-green-ink">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">Thank you — your feedback helps us improve every visit.</p>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">
                  How was your visit?
                </p>
                <div className="flex items-center gap-1" role="radiogroup" aria-label="Rate your visit from 1 to 5 stars">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={starValue === n}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      onClick={() => setStarValue(n)}
                      onMouseEnter={() => setStarHover(n)}
                      onMouseLeave={() => setStarHover(0)}
                      className="h-12 w-12 flex items-center justify-center rounded-proto-sm transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-medical-blue"
                    >
                      <Star className={cn(
                        "h-7 w-7 transition-colors",
                        (starHover || starValue) >= n
                          ? "fill-warning-amber text-warning-amber"
                          : "text-outline-variant"
                      )} />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ratingComment}
                    onChange={e => setRatingComment(e.target.value)}
                    placeholder="Anything we should know? (optional)"
                    aria-label="Feedback comment (optional)"
                    className="flex-1 h-12 px-3 rounded-proto-md bg-slate-50 border border-outline-variant text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-medical-blue focus:border-transparent"
                  />
                  <button
                    onClick={sendRating}
                    disabled={starValue === 0}
                    className="h-12 px-4 rounded-proto-md bg-medical-blue text-white text-sm font-semibold disabled:opacity-40 disabled:pointer-events-none hover:bg-blue-600 transition-all duration-150"
                  >
                    Submit
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help card — hidden after results delivered */}
      {reportStatus !== "delivered" && (
        <Card className="rounded-proto-lg shadow-proto-card border border-outline-variant/40 bg-white overflow-hidden">
          <CardContent className="py-5 space-y-3">
            <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">
              Need Help?
            </p>
            <p className="text-sm text-on-surface-variant">
              Questions about your appointment or arrival time? Your care coordinator is available to help.
            </p>
            <Button variant="primary" size="lg" className="w-full h-12 rounded-proto-md shadow-proto-fab gap-2 hover:bg-blue-600 transition-all duration-150">
              <Phone className="h-4 w-4" /> Call Care Coordinator
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sticky FAB — Call Care Coordinator */}
      {!isComplete && !isTracking && (
        <div className="fixed bottom-20 right-4 z-30 animate-bounce">
          <button
            className="h-14 w-14 rounded-full bg-medical-blue shadow-proto-fab flex items-center justify-center text-white hover:bg-blue-600 active:scale-90 transition-all duration-150"
            aria-label="Call Care Coordinator"
          >
            <Phone className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
