"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Map, ClipboardList, FileText, LayoutDashboard, Wrench,
  Wifi, WifiOff, RefreshCw, LogOut, Contrast,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { SyncStatus } from "@/lib/utils";
import type { ReactNode } from "react";
import { useSyncQueue } from "@/lib/hooks/useSyncQueue";
import { useOfflineWrites } from "@/lib/hooks/useOfflineWrites";
import { useState, useEffect } from "react";

const TECH_NAV = [
  { label: "Field View", icon: Map,             href: "/technician"           },
  { label: "Manifest",   icon: ClipboardList,   href: "/technician/manifest"  },
  { label: "Scan & QC",  icon: LayoutDashboard, href: "/technician/scan"      },
  { label: "Clinical",   icon: FileText,        href: "/technician/clinical"  },
  { label: "Equipment",  icon: Wrench,          href: "/technician/equipment" },
];

const SYNC_CONFIG: Record<SyncStatus, {
  icon: ReactNode;
  label: string;
  badge: "synced" | "pending" | "conflict" | "offline";
}> = {
  synced:   { icon: <Wifi className="h-3.5 w-3.5 text-green-600" />,                              label: "Synced",   badge: "synced"   },
  pending:  { icon: <RefreshCw className="h-3.5 w-3.5 text-warning-amber animate-spin" />,        label: "Syncing",  badge: "pending"  },
  conflict: { icon: <RefreshCw className="h-3.5 w-3.5 text-orange-500" />,                        label: "Conflict", badge: "conflict" },
  offline:  { icon: <WifiOff className="h-3.5 w-3.5 text-slate-gray" />,                          label: "Offline",  badge: "offline"  },
};

interface TechnicianShellProps {
  title: string;
  subtitle?: string;
  syncStatus?: SyncStatus;
  userName?: string;
  userInitials?: string;
  children: ReactNode;
}

export function TechnicianShell({
  title, subtitle,
  syncStatus: initialSyncStatus,
  userName = "Technician", userInitials = "T",
  children,
}: TechnicianShellProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const { records } = useSyncQueue();
  const { pendingWrites } = useOfflineWrites();
  const [isOnline, setIsOnline] = useState(true);

  // High-contrast field mode — counters bright ambient light (DESIGN.md requirement)
  const [highContrast, setHighContrast] = useState(false);
  useEffect(() => {
    setHighContrast(localStorage.getItem("rad-field-hc") === "1");
  }, []);
  const toggleContrast = () => {
    setHighContrast(prev => {
      localStorage.setItem("rad-field-hc", prev ? "0" : "1");
      return !prev;
    });
  };

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

  const pendingCount = records.filter(r => r.syncStatus === "pending").length + pendingWrites;
  const activeSyncStatus: SyncStatus = !isOnline
    ? "offline"
    : pendingCount > 0
      ? "pending"
      : "synced";

  const sync = SYNC_CONFIG[activeSyncStatus];

  return (
    <div className={cn(
      "flex flex-col h-screen bg-ghost-white",
      highContrast && "contrast-125 saturate-[1.15] [&_.text-on-surface-variant]:text-on-surface"
    )}>

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 flex items-center gap-3 h-16 px-5
        bg-surface-container-lowest/90 backdrop-blur border-b border-outline-variant/40 shrink-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-on-surface truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-on-surface-variant truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleContrast}
            aria-pressed={highContrast}
            aria-label={`High-contrast field mode ${highContrast ? "on" : "off"}`}
            className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
              highContrast
                ? "bg-midnight-navy text-white"
                : "text-on-surface-variant hover:bg-surface-container"
            )}
          >
            <Contrast className="h-4 w-4" />
          </button>
          {/* Sync status — taps to Offline Log */}
          <button
            onClick={() => router.push("/technician/offline")}
            aria-label={`Sync status: ${sync.label}. View offline log.`}
          >
            <Badge variant={sync.badge} size="sm" className="gap-1.5 cursor-pointer">
              {sync.icon}
              {sync.label}{pendingCount > 0 && ` (${pendingCount})`}
            </Badge>
          </button>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-emergency-red transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
          <Avatar initials={userInitials} size="sm" status="online" />
        </div>
      </header>

      {/* ── Scrollable content — pb clears bottom nav ── */}
      <main className="flex-1 overflow-y-auto pb-20 px-4 py-5">
        {children}
      </main>

      {/* ── Bottom navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-midnight-navy border-t border-white/10
        shadow-[0_-4px_20px_rgba(0,0,0,0.25)]">
        <div className="flex items-stretch">
          {TECH_NAV.map(({ label, icon: Icon, href }) => {
            const isActive = pathname === href;
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[60px] transition-colors",
                  isActive ? "text-green-400" : "text-slate-gray hover:text-white"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <div className={cn(
                  "flex items-center justify-center w-9 h-6 rounded-xl transition-colors",
                  isActive ? "bg-green-500/20" : ""
                )}>
                  <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                </div>
                <span className={cn(
                  "text-[9px] font-label font-semibold uppercase tracking-wider leading-none",
                  isActive ? "text-green-400" : "text-slate-gray"
                )}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
