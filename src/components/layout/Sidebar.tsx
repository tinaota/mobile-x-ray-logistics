"use client";

import { cn } from "@/lib/utils";
import type { Role } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  LayoutDashboard, Map, ClipboardList, Users, FileText,
  DollarSign, Wrench, WifiOff, PlusCircle,
  Wallet, History, BarChart3, ShieldCheck,
  CalendarCheck, Phone, LogOut,
} from "lucide-react";
import type { ReactNode } from "react";

interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
}

const navByRole: Record<Role, NavItem[]> = {
  dispatcher: [
    { label: "Operations",  icon: <LayoutDashboard className="h-5 w-5" />, href: "/dispatcher" },
    { label: "Assignment",  icon: <ClipboardList className="h-5 w-5" />,   href: "/dispatcher/assignment" },
    { label: "Intake",      icon: <FileText className="h-5 w-5" />,        href: "/dispatcher/intake" },
    { label: "Credentials", icon: <Users className="h-5 w-5" />,           href: "/dispatcher/credentials" },
    { label: "Billing",     icon: <DollarSign className="h-5 w-5" />,      href: "/dispatcher/billing" },
    { label: "Reports",     icon: <BarChart3 className="h-5 w-5" />,       href: "/dispatcher/reports" },
  ],
  technician: [
    { label: "Field View",  icon: <Map className="h-5 w-5" />,             href: "/technician" },
    { label: "Manifest",    icon: <ClipboardList className="h-5 w-5" />,   href: "/technician/manifest" },
    { label: "Clinical",    icon: <FileText className="h-5 w-5" />,        href: "/technician/clinical" },
    { label: "Scan & QC",   icon: <LayoutDashboard className="h-5 w-5" />, href: "/technician/scan" },
    { label: "Equipment",   icon: <Wrench className="h-5 w-5" />,          href: "/technician/equipment" },
    { label: "Offline Log", icon: <WifiOff className="h-5 w-5" />,         href: "/technician/offline" },
  ],
  client: [
    { label: "Appointment", icon: <CalendarCheck className="h-5 w-5" />, href: "/client" },
    { label: "History",     icon: <History className="h-5 w-5" />,       href: "/client/history" },
    { label: "Contact",     icon: <Phone className="h-5 w-5" />,         href: "/client/contact" },
  ],
  billing: [
    { label: "Dashboard",  icon: <LayoutDashboard className="h-5 w-5" />, href: "/billing" },
    { label: "Ledger",     icon: <Wallet className="h-5 w-5" />,          href: "/billing/ledger" },
    { label: "Audit Logs", icon: <History className="h-5 w-5" />,         href: "/billing/invoices" },
    { label: "Reports",    icon: <BarChart3 className="h-5 w-5" />,       href: "/billing/reports" },
    { label: "Compliance", icon: <ShieldCheck className="h-5 w-5" />,     href: "/billing/scrubbing" },
  ],
};

const roleMeta: Record<Role, { title: string; subtitle: string; ctaLabel?: string }> = {
  dispatcher: { title: "RAD-COMMAND",      subtitle: "Dispatch & Fleet Ops" },
  technician: { title: "RAD-FIELD",        subtitle: "Field Technician" },
  billing:    { title: "Revenue Command",  subtitle: "Unified Logistics Suite", ctaLabel: "New Reconciliation" },
  client:     { title: "MY X-RAY",         subtitle: "Home & Care Visit" },
};

interface SidebarProps {
  role: Role;
  activeHref?: string;
  userName?: string;
  userInitials?: string;
  onNavigate?: (href: string) => void;
  onLogout?: () => void;
}

export function Sidebar({ role, activeHref, userName = "User", userInitials = "U", onNavigate, onLogout }: SidebarProps) {
  const items = navByRole[role];
  const meta = roleMeta[role];

  return (
    <aside className="hidden lg:flex flex-col h-screen w-64 bg-midnight-navy shadow-xl z-40 shrink-0">

      {/* Brand */}
      <div className="px-6 py-8 border-b border-white/10">
        <p className="font-black text-white tracking-tighter text-xl leading-none">{meta.title}</p>
        <p className="text-slate-gray text-sm mt-1 font-medium">{meta.subtitle}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const isActive = activeHref === item.href;
          return (
            <button
              key={item.href}
              onClick={() => onNavigate?.(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-label-caps font-label font-semibold uppercase tracking-wider transition-all duration-150",
                isActive
                  ? "text-medical-blue border-r-4 border-medical-blue bg-primary-container/50 translate-x-0.5"
                  : "text-slate-gray font-medium hover:text-white hover:bg-primary-container transition-colors"
              )}
              title={item.label}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* CTA for billing role */}
      {meta.ctaLabel && (
        <div className="px-4 pb-4">
          <Button variant="primary" size="lg" className="w-full gap-2">
            <PlusCircle className="h-4 w-4" />
            {meta.ctaLabel}
          </Button>
        </div>
      )}

      {/* User footer */}
      <div className="px-4 pb-6 border-t border-white/10 pt-4 space-y-0.5">
        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-gray hover:text-white hover:bg-primary-container transition-colors text-sm font-medium">
          <FileText className="h-4 w-4 shrink-0" />
          Settings
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-gray hover:text-white hover:bg-primary-container transition-colors text-sm font-medium">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Help & Support
        </button>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-gray hover:text-emergency-red hover:bg-emergency-red/10 transition-colors text-sm font-medium"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        )}
        <div className="flex items-center gap-3 px-4 py-2 mt-2">
          <Avatar initials={userInitials} size="sm" status="online" />
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{userName}</p>
            <p className="text-slate-gray text-xs truncate">{meta.subtitle}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
