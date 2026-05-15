"use client";

import { useRouter, usePathname } from "next/navigation";
import { CalendarCheck, History, Phone, Bell } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const CLIENT_NAV = [
  { label: "Appointment", icon: CalendarCheck, href: "/client"         },
  { label: "History",     icon: History,       href: "/client/history" },
  { label: "Contact",     icon: Phone,         href: "/client/contact" },
];

interface ClientShellProps {
  title: string;
  subtitle?: string;
  userName?: string;
  userInitials?: string;
  children: ReactNode;
}

export function ClientShell({
  title, subtitle,
  userName = "Patient", userInitials = "P",
  children,
}: ClientShellProps) {
  const router   = useRouter();
  const pathname = usePathname();

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
          <button
            className="relative h-9 w-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          <Avatar initials={userInitials} size="sm" status="online" />
        </div>
      </header>

      {/* ── Scrollable content — pb clears bottom nav ── */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* ── Bottom navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-midnight-navy border-t border-white/10
        shadow-[0_-4px_20px_rgba(0,0,0,0.25)]">
        <div className="flex items-stretch max-w-2xl mx-auto">
          {CLIENT_NAV.map(({ label, icon: Icon, href }) => {
            const isActive = pathname === href;
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[60px] transition-colors",
                  isActive ? "text-rose-400" : "text-slate-gray hover:text-white"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <div className={cn(
                  "flex items-center justify-center w-9 h-6 rounded-xl transition-colors",
                  isActive ? "bg-rose-500/20" : ""
                )}>
                  <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                </div>
                <span className={cn(
                  "text-[9px] font-label font-semibold uppercase tracking-wider leading-none",
                  isActive ? "text-rose-400" : "text-slate-gray"
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
