"use client";

import { cn } from "@/lib/utils";
import type { Role } from "@/lib/utils";
import { Monitor, Smartphone, DollarSign, CheckCircle, HeartPulse } from "lucide-react";
import type { ReactNode } from "react";

interface RoleOption {
  role: Role;
  label: string;
  description: string;
  hardware: string;
  icon: ReactNode;
  color: string;
  bg: string;
}

const roles: RoleOption[] = [
  {
    role: "dispatcher",
    label: "Dispatcher",
    description: "Logistics & fleet orchestration from command center.",
    hardware: "Desktop / Large Display",
    icon: <Monitor className="h-7 w-7" />,
    color: "text-medical-blue",
    bg: "bg-medical-blue/10 group-hover:bg-medical-blue/20 group-data-[selected=true]:bg-medical-blue/20",
  },
  {
    role: "technician",
    label: "Field Technician",
    description: "Clinical procedures & field execution via mobile PWA.",
    hardware: "Mobile / Tablet",
    icon: <Smartphone className="h-7 w-7" />,
    color: "text-green-600",
    bg: "bg-green-50 group-hover:bg-green-100 group-data-[selected=true]:bg-green-100",
  },
  {
    role: "billing",
    label: "Billing Manager",
    description: "Revenue lifecycle management & compliance audit.",
    hardware: "Desktop / Laptop",
    icon: <DollarSign className="h-7 w-7" />,
    color: "text-warning-amber",
    bg: "bg-amber-50 group-hover:bg-amber-100 group-data-[selected=true]:bg-amber-100",
  },
  {
    role: "client",
    label: "Patient / Client",
    description: "Track your home or care home X-ray appointment and results.",
    hardware: "Mobile / Any Device",
    icon: <HeartPulse className="h-7 w-7" />,
    color: "text-rose-500",
    bg: "bg-rose-50 group-hover:bg-rose-100 group-data-[selected=true]:bg-rose-100",
  },
];

interface RoleSelectorProps {
  selected?: Role;
  onSelect: (role: Role) => void;
}

export function RoleSelector({ selected, onSelect }: RoleSelectorProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {roles.map((opt) => {
        const isSelected = selected === opt.role;
        return (
          <button
            key={opt.role}
            data-selected={isSelected}
            onClick={() => onSelect(opt.role)}
            className={cn(
              "group relative flex flex-col items-start gap-3 p-5 rounded-xl border-2 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-medical-blue focus-visible:ring-offset-2",
              isSelected
                ? "border-current shadow-card-md"
                : "border-outline-variant hover:border-outline",
              opt.color
            )}
          >
            {isSelected && (
              <CheckCircle className="absolute top-3 right-3 h-5 w-5" />
            )}
            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center transition-colors", opt.bg)}>
              {opt.icon}
            </div>
            <div>
              <p className="font-semibold text-on-surface">{opt.label}</p>
              <p className="text-xs text-on-surface-variant mt-1">{opt.description}</p>
              <p className="text-[11px] font-label font-semibold uppercase tracking-wider mt-2 opacity-70">
                {opt.hardware}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
