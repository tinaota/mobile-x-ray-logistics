"use client";

import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/hooks/useSession";
import { Avatar } from "@/components/ui/Avatar";
import {
  Users, Activity, Settings, LogOut, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const ADMIN_NAV = [
  { label: "User Management", icon: Users,       href: "/admin"          },
  { label: "System Settings", icon: Settings,    href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const session  = useSession();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-ghost-white">

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col h-screen w-64 bg-midnight-navy shadow-xl z-40 shrink-0">

        {/* Brand */}
        <div className="px-6 py-8 border-b border-white/10">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-7 w-7 rounded-lg bg-medical-blue flex items-center justify-center">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <p className="font-black text-white tracking-tighter text-lg leading-none">SYS ADMIN</p>
          </div>
          <p className="text-slate-gray text-sm font-medium mt-1">RAD-COMMAND Platform</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-0.5">
          {ADMIN_NAV.map(item => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[11px] font-label font-semibold uppercase tracking-wider transition-all",
                  isActive
                    ? "text-medical-blue border-r-4 border-medical-blue bg-primary-container/50 translate-x-0.5"
                    : "text-slate-gray hover:text-white hover:bg-primary-container"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-4 pb-6 border-t border-white/10 pt-4 space-y-0.5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-gray hover:text-emergency-red hover:bg-emergency-red/10 transition-colors text-sm font-medium"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
          <div className="flex items-center gap-3 px-4 py-2 mt-2">
            <Avatar initials={session?.initials ?? "SA"} size="sm" status="online" />
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{session?.name ?? "System Admin"}</p>
              <p className="text-slate-gray text-xs truncate">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="sticky top-0 z-30 flex items-center gap-4 h-16 px-6 bg-surface-container-lowest/90 backdrop-blur border-b border-outline-variant/40">
          <ShieldCheck className="h-5 w-5 text-medical-blue shrink-0" />
          <div className="flex-1">
            <h1 className="text-base font-semibold text-on-surface">System Administration</h1>
            <p className="text-xs text-on-surface-variant">User management & platform control</p>
          </div>
          <Avatar initials={session?.initials ?? "SA"} size="sm" status="online" />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
