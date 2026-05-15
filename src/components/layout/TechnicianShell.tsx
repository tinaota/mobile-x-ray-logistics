"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Map, ClipboardList, FileText, LayoutDashboard, Wrench,
  Wifi, WifiOff, RefreshCw,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { SyncStatus } from "@/lib/utils";
import type { ReactNode } from "react";

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
  syncStatus = "synced",
  userName = "Technician", userInitials = "T",
  children,
}: TechnicianShellProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const sync     = SYNC_CONFIG[syncStatus];

  return (
    <div className="flex flex-col h-screen bg-ghost-white">

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
          {/* Sync status — taps to Offline Log */}
          <button
            onClick={() => router.push("/technician/offline")}
            aria-label={`Sync status: ${sync.label}. View offline log.`}
          >
            <Badge variant={sync.badge} size="sm" className="gap-1.5 cursor-pointer">
              {sync.icon}
              {sync.label}
            </Badge>
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
