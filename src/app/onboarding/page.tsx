"use client";

import { Fragment, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Role } from "@/lib/utils";
import { CredentialUpload } from "@/components/onboarding/CredentialUpload";
import {
  Activity, ArrowRight, ArrowLeft, Check, CheckCircle2,
  Monitor, Smartphone, DollarSign, HeartPulse,
  FileCheck, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Role"        },
  { id: 2, label: "Identity"    },
  { id: 3, label: "Agreement"   },
  { id: 4, label: "Credentials" },
  { id: 5, label: "Done"        },
];

const HEADINGS = [
  { title: "Choose your role",          sub: "Select the access level that matches your position."               },
  { title: "Tell us who you are",       sub: "Your display name will be visible to other team members."          },
  { title: "Agree to platform terms",   sub: "Required before accessing patient data and clinical tools."        },
  { title: "Upload your credentials",   sub: "Verify your professional licence or ID document."                  },
  { title: "You're all set!",           sub: "Your account is ready — enter the platform below."                 },
];

// ── Role options ───────────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  {
    value:     "dispatcher" as Role,
    label:     "Dispatcher",
    code:      "RAD-COMMAND",
    desc:      "Fleet orchestration & order assignment",
    Icon:      Monitor,
    iconColor: "text-medical-blue",
    iconBg:    "bg-medical-blue/10",
    border:    "border-medical-blue",
    check:     "text-medical-blue",
  },
  {
    value:     "technician" as Role,
    label:     "Field Technician",
    code:      "RAD-FIELD",
    desc:      "Clinical procedures & field execution",
    Icon:      Smartphone,
    iconColor: "text-green-600",
    iconBg:    "bg-green-50",
    border:    "border-green-500",
    check:     "text-green-600",
  },
  {
    value:     "billing" as Role,
    label:     "Billing Manager",
    code:      "REVENUE CMD",
    desc:      "Revenue lifecycle & compliance audit",
    Icon:      DollarSign,
    iconColor: "text-warning-amber",
    iconBg:    "bg-amber-50",
    border:    "border-warning-amber",
    check:     "text-warning-amber",
  },
  {
    value:     "client" as Role,
    label:     "Patient / Client",
    code:      "MY X-RAY",
    desc:      "Track X-ray appointments & results",
    Icon:      HeartPulse,
    iconColor: "text-rose-500",
    iconBg:    "bg-rose-50",
    border:    "border-rose-400",
    check:     "text-rose-500",
  },
];

const ROLE_CREDENTIAL: Record<Role, string> = {
  dispatcher: "Dispatch Authorization",
  technician: "Radiologic Technologist License",
  billing:    "Billing Manager Credential",
  client:     "Patient ID",
  // Copilot accounts are provisioned directly (accounts.ts), never via this
  // wizard — ROLE_OPTIONS above intentionally has no copilot card.
  copilot:    "Co-Pilot Operator Access",
};

const ROLE_META: Record<Role, { label: string; color: string }> = {
  dispatcher: { label: "RAD-COMMAND",     color: "bg-medical-blue/10 text-medical-blue"   },
  technician: { label: "RAD-FIELD",       color: "bg-green-500/10 text-green-700"         },
  billing:    { label: "Revenue Command", color: "bg-warning-amber/10 text-warning-amber" },
  client:     { label: "MY X-RAY",        color: "bg-rose-500/10 text-rose-600"           },
  copilot:    { label: "CO-PILOT",        color: "bg-radiology-indigo/10 text-radiology-indigo" },
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-midnight-navy flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    }>
      <OnboardingWizard />
    </Suspense>
  );
}

function OnboardingWizard() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const initialRole = (searchParams.get("role") as Role | null) ?? undefined;
  const isInvited   = searchParams.get("invited") === "true";

  const [step,       setStep]       = useState(initialRole ? 1 : 0);
  const [role,       setRole]       = useState<Role | undefined>(initialRole);
  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [hipaa,      setHipaa]      = useState(false);
  const [terms,      setTerms]      = useState(false);
  const [credDone,   setCredDone]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const initials = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase();
  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const roleMeta = role ? ROLE_META[role] : null;
  const heading  = HEADINGS[step];

  const canContinue = (
    step === 0 ? !!role :
    step === 1 ? firstName.trim().length >= 1 && lastName.trim().length >= 1 :
    step === 2 ? hipaa && terms :
    true
  );

  const handleNext = () => {
    if (step < STEPS.length - 1) { setStep(s => s + 1); return; }
    handleComplete();
  };

  const handleUpload = async (_file: File) => {
    await new Promise(r => setTimeout(r, 1200));
    setCredDone(true);
  };

  const handleComplete = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const accessToken = typeof sessionStorage !== "undefined"
        ? (sessionStorage.getItem("sb_access_token") ?? "") : "";
      const email = typeof sessionStorage !== "undefined"
        ? (sessionStorage.getItem("sb_email") ?? "") : "";

      const res  = await fetch("/api/auth/onboarding-complete", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:     fullName || "New User",
          initials: initials || "NU",
          role:     role     || "client",
          accessToken,
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Setup failed. Please try again."); return; }

      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem("sb_access_token");
        sessionStorage.removeItem("sb_email");
      }
      router.push(data.redirect);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = cn(
    "w-full h-11 px-4 rounded-lg bg-surface-container border border-outline-variant",
    "text-on-surface text-sm placeholder:text-on-surface-variant/50",
    "focus:outline-none focus:ring-2 focus:ring-medical-blue focus:border-transparent transition-colors"
  );

  return (
    <div className="min-h-screen bg-midnight-navy flex flex-col items-center justify-center px-4 py-8">

      {/* Brand */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="h-8 w-8 rounded-lg bg-medical-blue flex items-center justify-center">
          <Activity className="h-4 w-4 text-white" />
        </div>
        <span className="text-white font-black text-lg tracking-tighter font-label uppercase">RAD-OPS</span>
        {isInvited && (
          <span className="ml-1 text-white/40 text-xs font-label uppercase tracking-wider">· Invitation</span>
        )}
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* ── Step progress ────────────────────────────────── */}
        <div className="flex items-start px-8 pt-6 pb-5 border-b border-outline-variant/40">
          {STEPS.map((s, i) => {
            const done    = i < step;
            const current = i === step;
            const isLast  = i === STEPS.length - 1;
            return (
              <Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    done    ? "bg-medical-blue text-white" :
                    current ? "bg-white border-2 border-medical-blue text-medical-blue" :
                              "bg-ghost-white border border-outline-variant/50 text-on-surface-variant/40"
                  )}>
                    {done ? <Check className="h-4 w-4" /> : <span>{s.id}</span>}
                  </div>
                  <span className={cn(
                    "text-[9px] font-label font-semibold uppercase tracking-wider whitespace-nowrap",
                    current ? "text-medical-blue" :
                    done    ? "text-on-surface-variant" :
                              "text-on-surface-variant/30"
                  )}>
                    {s.label}
                  </span>
                </div>

                {!isLast && (
                  <div className={cn(
                    "h-0.5 flex-1 self-center mx-2 mb-5 rounded-full transition-colors",
                    done ? "bg-medical-blue" : "bg-outline-variant/30"
                  )} />
                )}
              </Fragment>
            );
          })}
        </div>

        {/* ── Step content ─────────────────────────────────── */}
        <div className="px-8 py-7 min-h-[340px] flex flex-col">

          {/* Heading */}
          <div className="mb-5">
            <h2 className="text-xl font-bold text-on-surface font-headline">{heading.title}</h2>
            <p className="text-sm text-on-surface-variant mt-1">{heading.sub}</p>
          </div>

          <div className="flex-1 flex flex-col">

            {/* Step 0 — Role selection */}
            {step === 0 && (
              <div className="grid grid-cols-2 gap-3">
                {ROLE_OPTIONS.map(opt => {
                  const sel = role === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setRole(opt.value)}
                      className={cn(
                        "relative flex flex-col items-start gap-2.5 p-4 rounded-xl border-2 text-left transition-all",
                        sel
                          ? `${opt.border} shadow-sm`
                          : "border-outline-variant hover:border-outline hover:shadow-sm"
                      )}
                    >
                      {sel && (
                        <CheckCircle2 className={cn("absolute top-3 right-3 h-4 w-4 shrink-0", opt.check)} />
                      )}
                      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", opt.iconBg)}>
                        <opt.Icon className={cn("h-5 w-5", opt.iconColor)} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{opt.label}</p>
                        <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant/60 mt-0.5">
                          {opt.code}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 1 — Identity */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                      First Name
                    </label>
                    <input
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Alex"
                      className={inputCls}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                      Last Name
                    </label>
                    <input
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Rivera"
                      className={inputCls}
                    />
                  </div>
                </div>

                {(firstName || lastName) && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-container border border-outline-variant/40">
                    <div className="h-11 w-11 rounded-full bg-medical-blue/10 border-2 border-medical-blue/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold font-mono text-medical-blue">
                        {initials || "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">{fullName || "—"}</p>
                      <p className="text-xs text-on-surface-variant">Platform display name</p>
                    </div>
                    {roleMeta && (
                      <span className={cn(
                        "text-[10px] font-label font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0",
                        roleMeta.color
                      )}>
                        {roleMeta.label}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2 — Agreements */}
            {step === 2 && (
              <div className="space-y-3">
                {[
                  {
                    id: "terms", checked: terms, set: setTerms,
                    label: "Terms of Service",
                    desc: "I agree to the platform Terms of Service and acceptable use policy.",
                  },
                  {
                    id: "hipaa", checked: hipaa, set: setHipaa,
                    label: "HIPAA Compliance",
                    desc: "I agree to handle all patient data in accordance with HIPAA regulations and data privacy standards.",
                  },
                ].map(item => (
                  <label
                    key={item.id}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      item.checked
                        ? "border-medical-blue bg-medical-blue/5"
                        : "border-outline-variant hover:border-outline"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                      item.checked ? "bg-medical-blue border-medical-blue" : "border-outline-variant"
                    )}>
                      {item.checked && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={item.checked}
                      onChange={e => item.set(e.target.checked)}
                    />
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{item.label}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Step 3 — Credentials */}
            {step === 3 && role && (
              <div className="space-y-3">
                <CredentialUpload
                  label={ROLE_CREDENTIAL[role]}
                  required
                  onUpload={handleUpload}
                />
                {!credDone && (
                  <p className="text-xs text-on-surface-variant text-center pt-1">
                    You can{" "}
                    <button
                      className="underline hover:text-on-surface"
                      onClick={() => setStep(4)}
                    >
                      skip for now
                    </button>
                    {" "}and upload later from your profile settings.
                  </p>
                )}
              </div>
            )}

            {/* Step 4 — Complete */}
            {step === 4 && (
              <div className="flex flex-col items-center text-center gap-5 py-4 flex-1 justify-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <FileCheck className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-on-surface font-headline">
                    Welcome{firstName ? `, ${firstName}` : " aboard"}!
                  </p>
                  <p className="text-sm text-on-surface-variant mt-1.5 max-w-xs leading-relaxed">
                    Your account is configured and ready. Click below to access your dashboard.
                  </p>
                </div>
                {roleMeta && (
                  <span className={cn(
                    "text-[10px] font-label font-bold uppercase tracking-wider px-3 py-1.5 rounded-full",
                    roleMeta.color
                  )}>
                    {roleMeta.label}
                  </span>
                )}
                {error && (
                  <div className="flex items-center gap-2 bg-emergency-red/10 border border-emergency-red/20 rounded-lg px-4 py-3 text-emergency-red text-sm w-full max-w-sm text-left">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ── Footer nav ──────────────────────────────────── */}
        <div className="px-8 py-5 border-t border-outline-variant/40 flex items-center justify-between">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className={cn(
              "flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold transition-colors",
              "text-on-surface-variant hover:text-on-surface hover:bg-surface-container",
              "disabled:invisible"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canContinue || submitting}
            className={cn(
              "flex items-center gap-2 h-11 px-6 rounded-xl bg-medical-blue text-white",
              "text-sm font-semibold uppercase tracking-wider",
              "hover:bg-blue-600 shadow-sm transition-all",
              "disabled:opacity-40 disabled:pointer-events-none"
            )}
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Setting up…
              </>
            ) : step === STEPS.length - 1 ? (
              <>Enter Platform <ArrowRight className="h-4 w-4" /></>
            ) : (
              <>Continue <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>

      </div>

      {/* Security footer */}
      <p className="text-white/25 text-[10px] mt-6 font-label uppercase tracking-wider">
        Secure Portal · HIPAA Compliant · AES-256
      </p>

    </div>
  );
}
