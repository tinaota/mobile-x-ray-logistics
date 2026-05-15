import { cn } from "@/lib/utils";
import type { Role, SyncStatus } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import type { ReactNode } from "react";

interface PageLayoutProps {
  role: Role;
  title: string;
  subtitle?: string;
  activeHref?: string;
  syncStatus?: SyncStatus;
  notificationCount?: number;
  userName?: string;
  userInitials?: string;
  children: ReactNode;
  className?: string;
  highContrast?: boolean;
}

export function PageLayout({
  role,
  title,
  subtitle,
  activeHref,
  syncStatus,
  notificationCount,
  userName,
  userInitials,
  children,
  className,
  highContrast,
}: PageLayoutProps) {
  return (
    <div className={cn("flex h-screen overflow-hidden", highContrast && "high-contrast")}>
      <Sidebar
        role={role}
        activeHref={activeHref}
        userName={userName}
        userInitials={userInitials}
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
        <main className={cn("flex-1 overflow-y-auto p-margin-desktop", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
