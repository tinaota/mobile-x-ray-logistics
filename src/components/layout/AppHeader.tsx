"use client";

import { cn } from "@/lib/utils";
import type { Role, SyncStatus } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Bell, AlertTriangle, CircleUser, Menu, X,
  Wifi, WifiOff, RefreshCw,
} from "lucide-react";
import { SyncStatusBadge } from "@/components/ui/StatusBadge";
import { useSyncQueue } from "@/lib/hooks/useSyncQueue";

interface AppHeaderProps {
  role: Role;
  activeHref?: string;
  syncStatus?: SyncStatus;
  notificationCount?: number;
  hasAlert?: boolean;
  systemHealth?: "optimal" | "degraded" | "offline";
  userName?: string;
  onNavigate?: (href: string) => void;
}

const roleLabel: Record<Role, string> = {
  dispatcher: "RAD-COMMAND",
  technician: "RAD-FIELD",
  billing:    "REVENUE COMMAND",
  client:     "MY X-RAY",
};

const roleSubtitle: Record<Role, string> = {
  dispatcher: "Dispatch & Fleet Operations",
  technician: "Field Technician Portal",
  billing:    "Unified Logistics Suite",
  client:     "Home & Care Visit",
};

const dispatcherNav = [
  { label: "Fleet",      href: "/dispatcher" },
  { label: "Invoices",   href: "/dispatcher/billing" },
  { label: "Facilities", href: "/dispatcher/intake" },
  { label: "Reports",    href: "/dispatcher/fleet" },
];

const billingNav = [
  { label: "Dashboard",  href: "/billing" },
  { label: "Ledger",     href: "/billing/ledger" },
  { label: "Audit Logs", href: "/billing/invoices" },
  { label: "Reports",    href: "/billing/reports" },
  { label: "Compliance", href: "/billing/scrubbing" },
];

const techNav = [
  { label: "Field View", href: "/technician" },
  { label: "Manifest",   href: "/technician/manifest" },
  { label: "Equipment",  href: "/technician/equipment" },
  { label: "Offline Log",href: "/technician/offline" },
];

const navByRole: Record<Role, { label: string; href: string }[]> = {
  dispatcher: dispatcherNav,
  billing:    billingNav,
  technician: techNav,
  client:     [
    { label: "Appointment", href: "/client" },
    { label: "History",     href: "/client/history" },
    { label: "Contact",     href: "/client/contact" },
  ],
};

const healthConfig = {
  optimal:  { label: "SYSTEM HEALTH: OPTIMAL",  dot: "bg-green-500" },
  degraded: { label: "SYSTEM HEALTH: DEGRADED", dot: "bg-warning-amber" },
  offline:  { label: "SYSTEM HEALTH: OFFLINE",  dot: "bg-emergency-red animate-pulse" },
};

export function AppHeader({
  role,
  activeHref,
  syncStatus: initialSyncStatus,
  notificationCount = 0,
  hasAlert,
  systemHealth = "optimal",
  onNavigate,
}: AppHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = navByRole[role];
  const health = healthConfig[systemHealth];

  // Dynamic Sync state binding
  const { records } = useSyncQueue();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const goOnline = () => setIsOnline(true);
      const goOffline = () => setIsOnline(false);
      window.addEventListener("online", goOnline);
      window.addEventListener("offline", goOffline);
      return () => {
        window.removeEventListener("online", goOnline);
        window.removeEventListener("offline", goOffline);
      };
    }
  }, []);

  const pendingCount = records.filter(r => r.syncStatus === "pending").length;
  let syncLabel = "Online · Synced";
  let syncDotColor = "bg-laboratory-emerald";
  let syncBgColor = "bg-laboratory-emerald/10 text-laboratory-emerald border-laboratory-emerald/20";
  
  if (!isOnline) {
    syncLabel = "Offline · Caching Locally";
    syncDotColor = "bg-error";
    syncBgColor = "bg-error/10 text-error border-error/20";
  } else if (pendingCount > 0) {
    syncLabel = "Syncing...";
    syncDotColor = "bg-warning-amber";
    syncBgColor = "bg-warning-amber/10 text-warning-amber border-warning-amber/20 animate-pulse";
  }

  return (
    <>
      {/* ── DESKTOP & TABLET HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-midnight-navy shadow-md">
        <div className="flex items-center justify-between h-16 px-gutter md:px-6 lg:px-8">

          {/* Left: brand + desktop nav */}
          <div className="flex items-center gap-6 lg:gap-8 min-w-0">
            {/* Mobile hamburger */}
            <button
              className="flex lg:hidden items-center justify-center h-10 w-10 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Brand */}
            <div className="shrink-0">
              <span className="font-black text-white tracking-tighter text-lg leading-none">
                {roleLabel[role]}
              </span>
              <span className="hidden md:block text-white/40 text-[10px] font-label font-semibold uppercase tracking-wider mt-0.5">
                {roleSubtitle[role]}
              </span>
            </div>

            {/* Desktop nav links */}
            <nav className="hidden lg:flex items-center gap-1">
              {nav.map((item) => {
                const isActive = activeHref === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => onNavigate?.(item.href)}
                    className={cn(
                      "px-3 py-1.5 text-label-caps font-label font-semibold uppercase tracking-wider transition-colors rounded-md",
                      isActive
                        ? "text-medical-blue border-b-2 border-medical-blue pb-0.5"
                        : "text-white/60 hover:text-white"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: sync health + actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Dynamic Sync Status Badge */}
            <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold font-mono tracking-wider", syncBgColor)}>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", syncDotColor, syncLabel === "Syncing..." && "animate-pulse")} />
              <span className="uppercase font-semibold">{syncLabel}</span>
            </div>

            {/* Notifications */}
            <button
              className="relative h-9 w-9 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount})` : ""}`}
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-emergency-red text-white text-[9px] font-bold flex items-center justify-center">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>

            {/* Emergency / alert */}
            <button
              className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
                hasAlert
                  ? "text-emergency-red hover:bg-emergency-red/20 animate-pulse"
                  : "text-white/40 hover:text-white/70 hover:bg-white/10"
              )}
              aria-label="Emergency alert"
            >
              <AlertTriangle className="h-5 w-5" />
            </button>

            {/* Profile */}
            <button className="h-9 w-9 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <CircleUser className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── MOBILE NAV DRAWER ── */}
        {mobileOpen && (
          <nav className="lg:hidden bg-midnight-navy border-t border-white/10 px-4 py-3 space-y-0.5 animate-fade-in">
            {nav.map((item) => {
              const isActive = activeHref === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => { onNavigate?.(item.href); setMobileOpen(false); }}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors touch-target",
                    isActive
                      ? "bg-primary-container text-medical-blue border-r-4 border-medical-blue"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {item.label}
                </button>
              );
            })}

            {/* Mobile system health */}
            <div className="flex items-center gap-2 px-4 py-2 mt-2 border-t border-white/10">
              <span className={cn("h-2 w-2 rounded-full", health.dot)} />
              <span className="text-[10px] font-label font-semibold uppercase tracking-wider text-white/50">
                {health.label}
              </span>
            </div>
          </nav>
        )}
      </header>

      {/* Header spacer */}
      <div className={cn("shrink-0", mobileOpen ? "h-[calc(4rem+160px)]" : "h-16")} />
    </>
  );
}
