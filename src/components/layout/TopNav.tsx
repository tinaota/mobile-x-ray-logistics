"use client";

import { cn } from "@/lib/utils";
import type { SyncStatus } from "@/lib/utils";
import { Bell, Search, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";

interface TopNavProps {
  title: string;
  subtitle?: string;
  syncStatus?: SyncStatus;
  notificationCount?: number;
  userName?: string;
  userInitials?: string;
  onSearch?: () => void;
  onNotifications?: () => void;
  className?: string;
}

const syncConfig: Record<SyncStatus, { icon: React.ReactNode; label: string; badge: React.ComponentProps<typeof Badge>["variant"] }> = {
  synced:   { icon: <Wifi className="h-4 w-4 text-green-600" />,         label: "Synced",   badge: "synced" },
  pending:  { icon: <RefreshCw className="h-4 w-4 text-warning-amber animate-spin" />, label: "Syncing", badge: "pending" },
  conflict: { icon: <RefreshCw className="h-4 w-4 text-orange-500" />,   label: "Conflict", badge: "conflict" },
  offline:  { icon: <WifiOff className="h-4 w-4 text-slate-gray" />,     label: "Offline",  badge: "offline" },
};

export function TopNav({
  title,
  subtitle,
  syncStatus,
  notificationCount = 0,
  userName = "User",
  userInitials = "U",
  onSearch,
  onNotifications,
  className,
}: TopNavProps) {
  const sync = syncStatus ? syncConfig[syncStatus] : null;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center gap-4 h-16 px-6 bg-surface-container-lowest/90 backdrop-blur border-b border-outline-variant/40",
        className
      )}
    >
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-on-surface truncate">{title}</h1>
        {subtitle && <p className="text-xs text-on-surface-variant truncate">{subtitle}</p>}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        {sync && (
          <Badge variant={sync.badge} size="sm" className="gap-1.5">
            {sync.icon}
            {sync.label}
          </Badge>
        )}

        {onSearch && (
          <button
            onClick={onSearch}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={onNotifications}
          className="relative h-9 w-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount})` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-emergency-red text-white text-[9px] font-bold flex items-center justify-center">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        <Avatar initials={userInitials} size="sm" status="online" />
      </div>
    </header>
  );
}
