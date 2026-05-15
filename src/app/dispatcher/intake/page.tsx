"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { supabase } from "@/lib/supabase";
import type { Facility } from "@/lib/utils";
import { Building2, Phone, MapPin, Plus, Pencil, ClipboardList, CheckCircle2, AlertCircle } from "lucide-react";

// ── Facility seed data ────────────────────────────────────────────────────────
const FACILITIES: Facility[] = [
  { id: "F1", name: "Sunrise Medical Center",   address: "1234 E Van Buren St, Phoenix, AZ",   phone: "(602) 555-0121", contactName: "Dr. Sarah Kim",       activeOrderCount: 3 },
  { id: "F2", name: "Desert Valley Hospital",    address: "890 W Thomas Rd, Phoenix, AZ",       phone: "(602) 555-0189", contactName: "Nurse James Osei",    activeOrderCount: 2 },
  { id: "F3", name: "Camelback Rehab Center",    address: "455 N Camelback Rd, Phoenix, AZ",    phone: "(602) 555-0234", contactName: "Dr. Mark Torres",     activeOrderCount: 1 },
  { id: "F4", name: "Phoenix Care Facility",     address: "200 S Central Ave, Phoenix, AZ",     phone: "(602) 555-0301", contactName: "Coordinator R. Hall", activeOrderCount: 2 },
  { id: "F5", name: "Valley View Nursing Home",  address: "78 W Indian School Rd, Phoenix, AZ", phone: "(602) 555-0418", contactName: "Admin Linda Cross",   activeOrderCount: 1 },
  { id: "F6", name: "Scottsdale Surgery Center", address: "312 N Scottsdale Rd, Scottsdale, AZ", phone: "(480) 555-0556", contactName: "Dr. A. Patel",       activeOrderCount: 0 },
];

// ── CPT code catalog (common mobile X-ray procedures) ─────────────────────────
const PROCEDURES = [
  { value: "71046", procedure: "Chest X-Ray 2-View",           label: "71046 — Chest X-Ray 2-View" },
  { value: "71010", procedure: "Chest X-Ray 1-View",           label: "71010 — Chest X-Ray 1-View" },
  { value: "73521", procedure: "Hip X-Ray 2-View",             label: "73521 — Hip X-Ray 2-View" },
  { value: "72100", procedure: "Lumbar Spine X-Ray 2-3 Views", label: "72100 — Lumbar Spine X-Ray 2-3 Views" },
  { value: "73000", procedure: "Shoulder X-Ray 2-View",        label: "73000 — Shoulder X-Ray 2-View" },
  { value: "73600", procedure: "Ankle X-Ray 2-View",           label: "73600 — Ankle X-Ray 2-View" },
  { value: "73560", procedure: "Knee X-Ray 2-View",            label: "73560 — Knee X-Ray 2-View" },
];

// ── Validation helpers ────────────────────────────────────────────────────────
function validateICD10(code: string): string | null {
  if (!code.trim()) return "ICD-10 code is required for billing";
  if (!/^[A-Z]\d{2}(\.\d{0,4})?$/i.test(code.trim())) return "Invalid format — use e.g. J18.9 or M54.5";
  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface FacilityFormState {
  name: string;
  address: string;
  phone: string;
  contactName: string;
}

interface OrderFormState {
  facilityId: string;
  patientName: string;
  cptCode: string;
  icd10Code: string;
  priority: string;
  scheduledTime: string;
}

const EMPTY_FACILITY: FacilityFormState = { name: "", address: "", phone: "", contactName: "" };
const EMPTY_ORDER: OrderFormState = {
  facilityId: "", patientName: "", cptCode: "", icd10Code: "", priority: "routine", scheduledTime: "",
};

export default function IntakePage() {
  // Facility tab state
  const [search,     setSearch]     = useState("");
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState<Facility | null>(null);
  const [facForm,    setFacForm]    = useState<FacilityFormState>(EMPTY_FACILITY);

  // Order tab state
  const [order,       setOrder]       = useState<OrderFormState>(EMPTY_ORDER);
  const [attempted,   setAttempted]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");

  const filtered = FACILITIES.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.address.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditTarget(null); setFacForm(EMPTY_FACILITY); setModalOpen(true); };
  const openEdit = (f: Facility) => {
    setEditTarget(f);
    setFacForm({ name: f.name, address: f.address, phone: f.phone, contactName: f.contactName });
    setModalOpen(true);
  };

  // Inline validation errors (only shown after first submit attempt)
  const facilityError  = attempted && !order.facilityId ? "Facility is required" : undefined;
  const nameError      = attempted && !order.patientName.trim() ? "Patient name is required" : undefined;
  const cptError       = attempted && !order.cptCode ? "Procedure is required" : undefined;
  const icd10Error     = attempted ? (validateICD10(order.icd10Code) ?? undefined) : undefined;
  const priorityError  = attempted && !order.priority ? "Priority is required" : undefined;

  const hasErrors = !!(facilityError || nameError || cptError || icd10Error || priorityError);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (hasErrors || !order.facilityId || !order.patientName.trim() || !order.cptCode || validateICD10(order.icd10Code)) return;

    setSubmitting(true);
    const selectedFacility = FACILITIES.find(f => f.id === order.facilityId);
    const selectedProc     = PROCEDURES.find(p => p.value === order.cptCode);

    const { error } = await supabase.from("orders").insert({
      patient_name:   order.patientName.trim(),
      facility_name:  selectedFacility?.name ?? "",
      address:        selectedFacility?.address ?? "",
      procedure:      selectedProc?.procedure ?? "",
      cpt_code:       order.cptCode,
      priority:       order.priority,
      status:         "pending",
      scheduled_time: order.scheduledTime || "TBD",
    });

    setSubmitting(false);
    if (error) {
      setSubmitState("error");
    } else {
      setSubmitState("success");
      setOrder(EMPTY_ORDER);
      setAttempted(false);
      setTimeout(() => setSubmitState("idle"), 4000);
    }
  };

  return (
    <div className="space-y-5">
      <Tabs defaultValue="facilities">
        <TabsList>
          <TabsTrigger value="facilities">
            <Building2 className="h-3.5 w-3.5 mr-1.5" />
            Facilities
          </TabsTrigger>
          <TabsTrigger value="new-order">
            <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
            New Order
          </TabsTrigger>
        </TabsList>

        {/* ── Facilities tab ────────────────────────────────────────────── */}
        <TabsContent value="facilities" className="mt-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search facilities…"
                className="w-full h-10 pl-9 pr-4 rounded-lg border border-outline-variant bg-white text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-medical-blue"
              />
            </div>
            <Button variant="primary" size="md" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Facility
            </Button>
          </div>

          <p className="text-xs text-on-surface-variant">
            {filtered.length} facilities · {FACILITIES.reduce((s, f) => s + f.activeOrderCount, 0)} active orders
          </p>

          <div className="space-y-3">
            {filtered.map(facility => (
              <div
                key={facility.id}
                className="bg-white rounded-xl border border-outline-variant/40 p-5 shadow-card flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="h-10 w-10 rounded-xl bg-midnight-navy/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-midnight-navy" />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-on-surface">{facility.name}</h3>
                    {facility.activeOrderCount > 0 ? (
                      <Badge variant="pending" size="sm">{facility.activeOrderCount} active</Badge>
                    ) : (
                      <Badge variant="default" size="sm">No active orders</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{facility.address}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{facility.phone}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Contact: {facility.contactName}</p>
                </div>
                <button
                  onClick={() => openEdit(facility)}
                  className="shrink-0 h-9 w-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                  aria-label="Edit facility"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add / Edit Facility Modal */}
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title={editTarget ? "Edit Facility" : "Add Facility"}
            description={editTarget ? `Editing ${editTarget.name}` : "Add a new healthcare facility to the network."}
            size="md"
          >
            <div className="space-y-4">
              <Input label="Facility Name" value={facForm.name} onChange={e => setFacForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sunrise Medical Center" />
              <Input label="Address" value={facForm.address} onChange={e => setFacForm(f => ({ ...f, address: e.target.value }))} placeholder="Full street address" />
              <Input label="Phone" value={facForm.phone} onChange={e => setFacForm(f => ({ ...f, phone: e.target.value }))} placeholder="(602) 555-0000" />
              <Input label="Primary Contact" value={facForm.contactName} onChange={e => setFacForm(f => ({ ...f, contactName: e.target.value }))} placeholder="Dr. / Nurse / Coordinator name" />
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => setModalOpen(false)}>
                  {editTarget ? "Save Changes" : "Add Facility"}
                </Button>
              </div>
            </div>
          </Modal>
        </TabsContent>

        {/* ── New Order tab ─────────────────────────────────────────────── */}
        <TabsContent value="new-order" className="mt-5">
          <form onSubmit={handleOrderSubmit} noValidate>
            <div className="max-w-2xl space-y-6">

              {/* Success / Error banners */}
              {submitState === "success" && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium">Order created and queued for dispatch.</p>
                </div>
              )}
              {submitState === "error" && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-emergency-red/30 text-emergency-red">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium">Failed to create order. Please try again.</p>
                </div>
              )}

              {/* Patient & Facility */}
              <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card p-5 space-y-4">
                <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant">
                  Patient & Facility
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Patient Name"
                    value={order.patientName}
                    onChange={e => setOrder(o => ({ ...o, patientName: e.target.value }))}
                    placeholder="First Last"
                    error={nameError}
                  />
                  <Select
                    label="Facility"
                    value={order.facilityId}
                    onChange={e => setOrder(o => ({ ...o, facilityId: e.target.value }))}
                    placeholder="Select facility…"
                    options={FACILITIES.map(f => ({ value: f.id, label: f.name }))}
                    error={facilityError}
                  />
                </div>
              </div>

              {/* Clinical */}
              <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card p-5 space-y-4">
                <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant">
                  Clinical
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Procedure / CPT Code"
                    value={order.cptCode}
                    onChange={e => setOrder(o => ({ ...o, cptCode: e.target.value }))}
                    placeholder="Select procedure…"
                    options={PROCEDURES.map(p => ({ value: p.value, label: p.label }))}
                    error={cptError}
                  />
                  <Input
                    label="ICD-10 Diagnosis Code"
                    value={order.icd10Code}
                    onChange={e => setOrder(o => ({ ...o, icd10Code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. J18.9"
                    hint="Required for billing — format: A00.0"
                    error={icd10Error}
                  />
                </div>
                {order.cptCode && !icd10Error && order.icd10Code && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    CPT {order.cptCode} + ICD-10 {order.icd10Code} validated
                  </p>
                )}
              </div>

              {/* Dispatch */}
              <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card p-5 space-y-4">
                <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant">
                  Dispatch
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Priority"
                    value={order.priority}
                    onChange={e => setOrder(o => ({ ...o, priority: e.target.value }))}
                    options={[
                      { value: "stat",    label: "STAT — Immediate response" },
                      { value: "urgent",  label: "Urgent — Within 2 hours" },
                      { value: "routine", label: "Routine — Scheduled" },
                    ]}
                    error={priorityError}
                  />
                  <Input
                    label="Scheduled Time"
                    type="time"
                    value={order.scheduledTime}
                    onChange={e => setOrder(o => ({ ...o, scheduledTime: e.target.value }))}
                    hint="Leave blank to assign ASAP"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setOrder(EMPTY_ORDER); setAttempted(false); setSubmitState("idle"); }}
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  variant={order.priority === "stat" ? "stat" : "primary"}
                  loading={submitting}
                >
                  <ClipboardList className="h-4 w-4" />
                  Create Order
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
