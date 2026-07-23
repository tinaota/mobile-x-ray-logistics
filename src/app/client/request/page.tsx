"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LabPanelCombobox } from "@/components/domain/LabPanelCombobox";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/hooks/useSession";
import { cn } from "@/lib/utils";
import {
  User, MapPin, Stethoscope, Calendar, Droplet, Zap,
  Lock, FileText, ChevronLeft, CheckCircle2, Info, RefreshCw
} from "lucide-react";

const RADIOLOGY_PROCEDURES = [
  "Chest X-Ray 2-View (71046)",
  "Chest X-Ray 1-View (71045)",
  "Hip X-Ray (73521)",
  "Knee X-Ray (73564)",
  "Spine — Lumbar (72100)",
  "Spine — Cervical (72040)",
  "Extremity — Upper (73090)",
  "Extremity — Lower (73600)",
  "Abdomen X-Ray (74018)",
  "Other Radiology — describe in notes",
];

const LABORATORY_PROCEDURES = [
  "CBC w/ Diff (85025)",
  "CMP / Blood Panel (80053)",
  "STAT: Lactic Acid (83605)",
  "Lipid Panel (80061)",
  "Urinalysis (81003)",
  "TSH Assay (84443)",
  "Hemoglobin A1c (83036)",
  "Prothrombin Time (PT/INR) (85610)",
  "Basic Metabolic Panel (80048)",
  "Other Lab Panel — describe in notes",
];

const inputCls = cn(
  "w-full h-[50px] px-3.5 rounded-proto-md bg-white border border-outline-variant/60",
  "text-on-surface text-sm placeholder:text-on-surface-variant/50",
  "focus:outline-none focus:ring-2 focus:ring-medical-blue focus:border-transparent transition-colors"
);

const labelCls = "block text-[11px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5";

export default function RequestAppointmentPage() {
  const router = useRouter();
  const session = useSession();

  const [form, setForm] = useState({
    dob:          "",
    address:      "",
    unit:         "",
    procedure:    "",
    date:         "",
    timeSlot:     "",
    accessNotes:  "",
    specialNotes: "",
    modality:     "" as "radiology" | "laboratory" | "",
    fastingRequired: false,
  });

  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Switch modality and purge fields
  const handleSwitchModality = (mod: "radiology" | "laboratory") => {
    setForm(f => ({
      ...f,
      procedure: "",          // Clear modality-specific procedures
      fastingRequired: false, // Lab-only flag never leaks across tracks
      modality: mod,
    }));
  };

  // Address validation helper state & listener
  const [addressWarning, setAddressWarning] = useState<string | null>(null);
  useEffect(() => {
    if (!form.address.trim()) {
      setAddressWarning(null);
      return;
    }
    const hasSuffix = /\b(st|street|rd|road|ave|avenue|blvd|boulevard|way|ln|lane|dr|drive|pl|place|ct|court)\b/i.test(form.address);
    const hasZip = /\b\d{5}\b/.test(form.address);
    if (!hasSuffix && !hasZip) {
      setAddressWarning("Include a street suffix (e.g., St, Ave) and a ZIP code.");
    } else if (!hasSuffix) {
      setAddressWarning("Include a street suffix (e.g., St, Ave, Dr).");
    } else if (!hasZip) {
      setAddressWarning("Include a 5-digit ZIP code (e.g., 85001).");
    } else {
      setAddressWarning(null);
    }
  }, [form.address]);

  // Preferred Date options generator (7 days rolling)
  const [dateOptions, setDateOptions] = useState<{ value: string; dayName: string; dayNum: string; monthName: string }[]>([]);
  useEffect(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const value = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = d.toLocaleDateString("en-US", { day: "numeric" });
      const monthName = d.toLocaleDateString("en-US", { month: "short" });
      options.push({ value, dayName, dayNum, monthName });
    }
    setDateOptions(options);
  }, []);

  const procedures = form.modality === "radiology" ? RADIOLOGY_PROCEDURES : LABORATORY_PROCEDURES;
  const canSubmit = form.address && form.procedure && form.date && form.timeSlot && form.dob && form.modality;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
      const patientName = session?.name ?? "Patient";
      const cptMatch = form.procedure.match(/\((\d+)\)/);
      const cptCode = cptMatch ? cptMatch[1] : "71046";

      // 1. Insert order record
      const { error: orderErr } = await supabase.from("orders").insert({
        id: orderId,
        patient_name: patientName,
        facility_id: null,
        facility_name: "Home Visit",
        address: form.address + (form.unit ? `, ${form.unit}` : ""),
        procedure: form.procedure,
        cpt_code: cptCode,
        priority: "routine",
        status: "pending",
        scheduled_time: `${form.date} (${form.timeSlot})`,
        report_status: "pending",
        modality: form.modality,
        fasting_required: form.modality === "laboratory" ? form.fastingRequired : false,
      });

      if (orderErr) throw new Error(orderErr.message);

      // 2. Insert access instructions as message if provided
      if (form.accessNotes.trim()) {
        await supabase.from("messages").insert({
          order_id: orderId,
          sender_role: "patient",
          sender_name: "Patient",
          content: `Access Instructions: ${form.accessNotes}`,
          channel: "in_app"
        });
      }

      // 3. Insert special notes as message if provided
      if (form.specialNotes.trim()) {
        await supabase.from("messages").insert({
          order_id: orderId,
          sender_role: "patient",
          sender_name: "Patient",
          content: `Special Notes: ${form.specialNotes}`,
          channel: "in_app"
        });
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again or call your dispatcher.");
    } finally {
      setLoading(false);
    }
  };

  const patientName = session?.name ?? "Patient";

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="rounded-proto-lg shadow-proto-card border border-outline-variant/40 bg-white overflow-hidden">
          <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-green-tint flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-ink" />
            </div>
            <div>
              <p className="text-xl font-bold text-on-surface">Request Submitted</p>
              <p className="text-sm text-on-surface-variant mt-2 max-w-xs leading-relaxed">
                Your request has been sent. You&apos;ll be notified when a technician is assigned.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs mt-4">
              <Button variant="primary" size="lg" className="w-full h-12 rounded-proto-md shadow-proto-fab hover:bg-blue-600 transition-all duration-150" onClick={() => router.push("/client")}>
                Back to Dashboard
              </Button>
              <Button variant="ghost" size="lg" className="w-full h-12 rounded-proto-md transition-colors" onClick={() => { setSubmitted(false); setForm({ dob: "", address: "", unit: "", procedure: "", date: "", timeSlot: "", accessNotes: "", specialNotes: "", modality: "", fastingRequired: false }); }}>
                Submit Another Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8 pt-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="h-9 w-9 rounded-proto-sm flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-on-surface">Request Appointment</h2>
          <p className="text-xs text-on-surface-variant">A coordinator will confirm your visit</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-blue-tint border border-medical-blue/20 rounded-proto-md px-4 py-3 animate-fade-in">
        <Info className="h-4.5 w-4.5 text-medical-blue shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-blue-700 leading-snug">
          This takes about a minute. A dispatcher confirms every request before a technician is sent.
        </p>
      </div>

      {/* Modality selector twin cards (Failsafe Inception) */}
      {!form.modality ? (
        <div className="space-y-3">
          <p id="service-type-label" className="text-[11.5px] font-label font-semibold uppercase tracking-wider text-on-surface-variant pl-1">
            Choose Service Type
          </p>
          <div role="group" aria-labelledby="service-type-label" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Radiology Card */}
            <button
              type="button"
              onClick={() => handleSwitchModality("radiology")}
              className="bg-white border-2 border-border-subtle p-6 rounded-xl hover:border-radiology-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-radiology-indigo transition-all cursor-pointer shadow-card hover:shadow-md flex flex-col justify-between min-h-[140px] text-left"
            >
              <div className="bg-radiology-indigo/10 text-radiology-indigo p-2.5 rounded-lg w-fit">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface mt-4">Bedside Radiology</h4>
                <p className="text-xs text-on-surface-variant mt-1 leading-normal">X-Ray, Ultrasound, or EKG diagnostics</p>
              </div>
            </button>

            {/* Laboratory Card */}
            <button
              type="button"
              onClick={() => handleSwitchModality("laboratory")}
              className="bg-white border-2 border-border-subtle p-6 rounded-xl hover:border-laboratory-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-laboratory-rose transition-all cursor-pointer shadow-card hover:shadow-md flex flex-col justify-between min-h-[140px] text-left"
            >
              <div className="bg-laboratory-rose/10 text-laboratory-rose p-2.5 rounded-lg w-fit">
                <Droplet className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface mt-4">Mobile Phlebotomy</h4>
                <p className="text-xs text-on-surface-variant mt-1 leading-normal">Blood draws, processing, & lab deliveries</p>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Active Track Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            form.modality === "radiology" 
              ? "bg-radiology-indigo/5 border-radiology-indigo/20 text-radiology-indigo"
              : "bg-laboratory-rose/5 border-laboratory-rose/20 text-laboratory-rose"
          }`}>
            <div className="flex items-center gap-2">
              {form.modality === "radiology" ? <Zap className="h-4.5 w-4.5" /> : <Droplet className="h-4.5 w-4.5" />}
              <span className="font-mono text-xs font-bold uppercase tracking-widest">
                {form.modality === "radiology" ? "Radiology Services" : "Laboratory / Blood Services"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, modality: "" }))}
              className="text-xs underline font-semibold hover:opacity-85 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Change Service
            </button>
          </div>

          {/* Patient Details */}
          <div className="space-y-1.5">
            <p className="text-[11.5px] font-label font-semibold uppercase tracking-wider text-on-surface-variant/80 pl-1">
              Patient
            </p>
            <Card className="rounded-proto-lg shadow-proto-card border border-outline-variant/40 bg-white overflow-hidden">
              <CardContent className="py-5 space-y-4">
                <div>
                  <label htmlFor="patient-name" className={labelCls}>Patient Name</label>
                  <input
                    id="patient-name"
                    type="text"
                    readOnly
                    value={patientName}
                    className={cn(inputCls, "bg-slate-100/60 text-on-surface-variant/85 cursor-not-allowed border-none shadow-none")}
                  />
                </div>

                <div>
                  <label htmlFor="patient-dob" className={labelCls}>Date of Birth</label>
                  <input
                    id="patient-dob"
                    type="date"
                    value={form.dob}
                    onChange={e => set("dob", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <p className="text-[11.5px] font-label font-semibold uppercase tracking-wider text-on-surface-variant/80 pl-1">
              Where should we come?
            </p>
            <Card className="rounded-proto-lg shadow-proto-card border border-outline-variant/40 bg-white overflow-hidden">
              <CardContent className="py-5 space-y-4">
                <div>
                  <label htmlFor="street-address" className={labelCls}>Street Address</label>
                  <input
                    id="street-address"
                    type="text"
                    value={form.address}
                    onChange={e => set("address", e.target.value)}
                    placeholder="123 Main St, Phoenix, AZ 85001"
                    aria-describedby={addressWarning ? "address-warning" : undefined}
                    className={inputCls}
                  />
                  {addressWarning && (
                    <p id="address-warning" className="text-[11px] text-amber-600 font-semibold mt-1.5 flex items-center gap-1">
                      ⚠️ {addressWarning}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="unit-floor-room" className={labelCls}>Unit / Floor / Room <span className="normal-case font-normal text-on-surface-variant/60">(optional)</span></label>
                  <input
                    id="unit-floor-room"
                    type="text"
                    value={form.unit}
                    onChange={e => set("unit", e.target.value)}
                    placeholder="e.g. Unit 4B, Floor 3, Room 214"
                    className={inputCls}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* What do you need? */}
          <div className="space-y-1.5">
            <p className="text-[11.5px] font-label font-semibold uppercase tracking-wider text-on-surface-variant/80 pl-1">
              Appointment Schedule & Details
            </p>
            <Card className="rounded-proto-lg shadow-proto-card border border-outline-variant/40 bg-white overflow-hidden">
              <CardContent className="py-5 space-y-5">
                <div>
                  <label htmlFor="requested-procedure" className={labelCls}>Requested Study / Panel</label>
                  {form.modality === "laboratory" ? (
                    <LabPanelCombobox
                      id="requested-procedure"
                      value={form.procedure}
                      onChange={v => set("procedure", v)}
                      options={LABORATORY_PROCEDURES}
                      placeholder="Search lab panels (CBC, CMP, Lipid…)"
                      inputClassName="rounded-proto-md"
                    />
                  ) : (
                    <div className="relative">
                      <select
                        id="requested-procedure"
                        value={form.procedure}
                        onChange={e => set("procedure", e.target.value)}
                        className={cn(inputCls, "appearance-none pr-8 cursor-pointer")}
                      >
                        <option value="">Select a procedure…</option>
                        {procedures.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center">
                        <svg className="h-4 w-4 text-on-surface-variant" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fasting toggle — laboratory track only */}
                {form.modality === "laboratory" && (
                  <div className="flex items-center justify-between bg-laboratory-rose/5 border border-laboratory-rose/20 rounded-proto-md px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Fasting Required</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Patient must not eat or drink (except water) for 8–12 hours before the draw
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.fastingRequired}
                      onClick={() => setForm(f => ({ ...f, fastingRequired: !f.fastingRequired }))}
                      className={cn(
                        "relative h-7 w-12 rounded-full transition-colors shrink-0",
                        form.fastingRequired ? "bg-laboratory-rose" : "bg-outline-variant/60"
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all",
                        form.fastingRequired ? "left-[22px]" : "left-0.5"
                      )} />
                    </button>
                  </div>
                )}

                <div>
                  <label htmlFor="preferred-date" className={labelCls}>Preferred Date</label>
                  <div className="relative">
                    <input
                      id="preferred-date"
                      type="date"
                      value={form.date}
                      onChange={e => set("date", e.target.value)}
                      className={cn(inputCls, "pr-10")}
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                      <Calendar className="h-4.5 w-4.5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label id="preferred-time-label" className={labelCls}>Preferred Time</label>
                  <div
                    role="radiogroup"
                    aria-labelledby="preferred-time-label"
                    className="grid grid-cols-3 gap-1 bg-[#eef1f6] p-1 rounded-proto-md"
                  >
                    {[
                      { label: "Morning",   sub: "7a-12p" },
                      { label: "Afternoon", sub: "12p-5p" },
                      { label: "Evening",   sub: "5p-7p" },
                    ].map(slot => {
                      const isSelected = form.timeSlot === slot.label;
                      return (
                        <button
                          key={slot.label}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => set("timeSlot", slot.label)}
                          className={cn(
                            "flex flex-col items-center justify-center py-2 px-1 rounded-proto-sm transition-all duration-150",
                            isSelected
                              ? "bg-white text-medical-blue shadow-sm font-semibold"
                              : "text-on-surface-variant hover:text-on-surface"
                          )}
                        >
                          <span className="text-sm">{slot.label}</span>
                          <span className={cn("text-[10.5px] font-medium mt-0.5", isSelected ? "text-medical-blue/80" : "text-on-surface-variant/70")}>
                            {slot.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Access & Notes */}
          <div className="space-y-1.5">
            <p className="text-[11.5px] font-label font-semibold uppercase tracking-wider text-on-surface-variant/80 pl-1">
              Help us find you
            </p>
            <Card className="rounded-proto-lg shadow-proto-card border border-outline-variant/40 bg-white overflow-hidden">
              <CardContent className="py-5 space-y-4">
                <div>
                  <label htmlFor="access-instructions" className={labelCls}>Access Instructions</label>
                  <textarea
                    id="access-instructions"
                    value={form.accessNotes}
                    onChange={e => set("accessNotes", e.target.value)}
                    placeholder="Gate code, parking instructions, elevator location…"
                    rows={2}
                    className={cn(inputCls, "h-auto py-2.5 resize-none")}
                  />
                </div>

                <div>
                  <label htmlFor="special-notes" className={labelCls}>Special Notes for Technician</label>
                  <textarea
                    id="special-notes"
                    value={form.specialNotes}
                    onChange={e => set("specialNotes", e.target.value)}
                    placeholder="Anything the technician should know before arriving…"
                    rows={2}
                    className={cn(inputCls, "h-auto py-2.5 resize-none")}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* What happens next */}
          <Card className="rounded-proto-lg shadow-proto-card border border-outline-variant/30 bg-slate-50 overflow-hidden">
            <CardContent className="py-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-on-surface-variant shrink-0" />
                <p className="text-xs font-semibold text-on-surface-variant">What happens after you submit</p>
              </div>
              {[
                "A dispatcher reviews your request",
                "A technician is assigned and you receive confirmation",
                "You can track your technician in real time on this app",
              ].map((step, i) => (
                <div key={step} className="flex items-start gap-2 text-xs text-on-surface-variant pl-6">
                  <span className="font-mono font-bold text-medical-blue shrink-0">{i + 1}.</span>
                  {step}
                </div>
              ))}
            </CardContent>
          </Card>

          {error && (
            <div className="text-sm text-emergency-red bg-emergency-red/10 border border-emergency-red/20 rounded-proto-sm px-4 py-3">
              {error}
            </div>
          )}

          {/* Submit */}
          <Button
            variant="primary"
            size="lg"
            className="w-full h-12 rounded-proto-md shadow-proto-fab hover:bg-blue-600 transition-all duration-150 mt-2"
            disabled={!canSubmit || loading}
            loading={loading}
            onClick={handleSubmit}
          >
            Submit Request
          </Button>
        </>
      )}

      <p className="text-center text-xs text-on-surface-variant pb-2">
        Need help? Call <span className="text-medical-blue font-semibold">(602) 555-0100</span>
      </p>
    </div>
  );
}
