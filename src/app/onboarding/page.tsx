"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Role } from "@/lib/utils";
import { RoleSelector } from "@/components/onboarding/RoleSelector";
import { CredentialUpload } from "@/components/onboarding/CredentialUpload";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { Button } from "@/components/ui/Button";
import { Activity, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

const STEPS = [
  { label: "Select Role",     description: "Choose your access level" },
  { label: "Credentials",     description: "Upload your license" },
  { label: "Ready",           description: "Access granted" },
];

const roleDashboard: Record<Role, string> = {
  dispatcher: "/dispatcher",
  technician: "/technician",
  billing:    "/billing",
  client:     "/client",
};

const roleCredentialLabel: Record<Role, string> = {
  dispatcher: "Dispatch Authorization",
  technician: "Radiologic Technologist License",
  billing:    "Billing Manager Credential",
  client:     "Patient ID",
};

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingFlow />
    </Suspense>
  );
}

function OnboardingFlow() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const initialRole = (searchParams.get("role") as Role | null) ?? undefined;
  const [step,     setStep]     = useState(initialRole ? 1 : 0);
  const [role,     setRole]     = useState<Role | undefined>(initialRole);
  const [uploaded, setUploaded] = useState(false);

  const handleRoleNext = () => {
    if (role) setStep(1);
  };

  const handleUpload = async (_file: File) => {
    await new Promise((r) => setTimeout(r, 1200));
    setUploaded(true);
    setStep(2);
  };

  const handleEnter = () => {
    if (role) router.push(roleDashboard[role]);
  };

  return (
    <div className="min-h-screen bg-ghost-white flex flex-col">
      {/* Top bar */}
      <header className="h-14 bg-midnight-navy flex items-center px-6 gap-3">
        <div className="h-7 w-7 rounded-lg bg-medical-blue flex items-center justify-center">
          <Activity className="h-4 w-4 text-white" />
        </div>
        <span className="text-white font-bold text-sm font-label tracking-tight">RAD-OPS</span>
      </header>

      <div className="flex flex-1 max-w-4xl mx-auto w-full px-4 py-10 gap-10">
        {/* Step indicator sidebar */}
        <aside className="hidden sm:block w-48 shrink-0 pt-1">
          <StepIndicator steps={STEPS} currentStep={step} />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">

          {/* Step 0 — Role selection */}
          {step === 0 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-headline-md font-semibold text-on-surface">Select your role</h2>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Your role determines your dashboard, permissions, and available features.
                </p>
              </div>
              <RoleSelector selected={role} onSelect={setRole} />
              <div className="flex justify-end pt-2">
                <Button
                  size="lg"
                  variant="primary"
                  disabled={!role}
                  onClick={handleRoleNext}
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 1 — Credential upload */}
          {step === 1 && role && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-headline-md font-semibold text-on-surface">Upload your credentials</h2>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Your credential is verified before platform access is granted.
                </p>
              </div>

              <div className="bg-surface rounded-xl border border-outline-variant p-6 space-y-5">
                <CredentialUpload
                  label={roleCredentialLabel[role]}
                  required
                  onUpload={handleUpload}
                />
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" size="md" onClick={() => setStep(0)}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                {uploaded && (
                  <Button size="lg" variant="primary" onClick={() => setStep(2)}>
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step 2 — Confirmed */}
          {step === 2 && role && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col items-center text-center py-10 gap-5">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-headline-md font-semibold text-on-surface">You&apos;re all set</h2>
                  <p className="text-body-sm text-on-surface-variant mt-2 max-w-sm">
                    Your credentials have been verified. You can now access the platform.
                  </p>
                </div>
                <Button size="xl" variant="primary" onClick={handleEnter}>
                  Enter Platform <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
