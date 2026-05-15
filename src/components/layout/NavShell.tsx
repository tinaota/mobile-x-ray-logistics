"use client";

import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { cn } from "@/lib/utils";
import type { Role, SyncStatus } from "@/lib/utils";
import type { ReactNode } from "react";

interface NavShellProps {
  role: Role;
  title: string;
  subtitle?: string;
  syncStatus?: SyncStatus;
  notificationCount?: number;
  userName?: string;
  userInitials?: string;
  children: ReactNode;
  className?: string;
}

export function NavShell({
  role, title, subtitle, syncStatus, notificationCount,
  userName = "Dispatcher", userInitials = "D",
  children, className,
}: NavShellProps) {
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-ghost-white">
      <Sidebar
        role={role}
        activeHref={pathname}
        userName={userName}
        userInitials={userInitials}
        onNavigate={(href) => router.push(href)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNav
          title={title}
          subtitle={subtitle}
          syncStatus={syncStatus}
          notificationCount={notificationCount}
          userName={userName}
          userInitials={userInitials}
        />
        <main className={cn("flex-1 overflow-y-auto p-6", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
