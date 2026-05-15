"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/utils";
import { RoleSelector } from "@/components/onboarding/RoleSelector";
import { Button } from "@/components/ui/Button";
import { Activity } from "lucide-react";

const roleDashboard: Record<Role, string> = {
  dispatcher: "/dispatcher",
  technician: "/technician",
  billing:    "/billing",
  client:     "/client",
};

const roleLabel: Record<Role, string> = {
  dispatcher: "Dispatcher Dashboard",
  technician: "Field View",
  billing:    "Billing Command",
  client:     "My Appointment",
};

export default function LandingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Role | undefined>();

  const handleEnter = () => {
    if (!selected) return;
    router.push(roleDashboard[selected]);
  };

  return (
    <div className="min-h-screen bg-midnight-navy flex flex-col items-center justify-center px-4 py-16">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-medical-blue flex items-center justify-center">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <span className="text-white font-bold text-xl tracking-tight font-label">
          RAD-OPS
        </span>
      </div>

      <h1 className="text-white text-headline-lg font-bold text-center mb-2">
        Mobile X-Ray Logistics
      </h1>
      <p className="text-on-primary-container text-body-lg text-center mb-12 max-w-md">
        Dispatch, field operations, and revenue management — in one platform.
      </p>

      {/* Role selection card */}
      <div className="w-full max-w-2xl bg-surface rounded-2xl shadow-card-lg p-8">
        <p className="text-label-caps text-on-surface-variant mb-5">
          Select your role to continue
        </p>

        <RoleSelector selected={selected} onSelect={setSelected} />

        <div className="mt-8 flex items-center justify-between gap-4">
          <p className="text-sm text-on-surface-variant">
            {selected
              ? `Entering ${roleLabel[selected]}`
              : "Choose a role above"}
          </p>
          <Button
            size="lg"
            variant="primary"
            disabled={!selected}
            onClick={handleEnter}
          >
            Enter Platform
          </Button>
        </div>
      </div>

      <p className="mt-8 text-xs text-on-primary-container opacity-50">
        RAD-OPS v1.0 · Mobile X-Ray Logistics Platform
      </p>
    </div>
  );
}
