"use client";

import { usePathname } from "next/navigation";
import { NavShell } from "@/components/layout/NavShell";
import { useSession } from "@/lib/hooks/useSession";
import type { ReactNode } from "react";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/dispatcher":              { title: "Operations Hub",        subtitle: "Fleet · Monitoring · Field Units" },
  "/dispatcher/messages":     { title: "Communications",       subtitle: "Dispatcher ↔ Field messaging"    },
  "/dispatcher/monitoring":   { title: "Live Monitoring",      subtitle: "Real-time field operations"      },
  "/dispatcher/assignment":   { title: "Assignment",           subtitle: "Order-to-technician dispatch"    },
  "/dispatcher/orders":       { title: "Order Queue",          subtitle: "Incoming & assigned orders"      },
  "/dispatcher/fleet":        { title: "Fleet Management",     subtitle: "Technician status & zones"       },
  "/dispatcher/credentials":  { title: "Credentials",         subtitle: "License & certification tracking" },
  "/dispatcher/billing":      { title: "Billing Overview",     subtitle: "Revenue from completed orders"   },
  "/dispatcher/intake":       { title: "Facility Management",  subtitle: "Healthcare facility directory"   },
  "/dispatcher/reports":      { title: "Analytics & Reports",  subtitle: "Operational performance"         },
};

import { ServiceLineProvider } from "@/lib/context/ServiceLineContext";

export default function DispatcherLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const session  = useSession();
  const meta     = PAGE_META[pathname] ?? { title: "Dispatcher", subtitle: "" };

  return (
    <ServiceLineProvider>
      <NavShell
        role="dispatcher"
        title={meta.title}
        subtitle={meta.subtitle}
        syncStatus="synced"
        notificationCount={3}
        userName={session?.name ?? "Alex Rivera"}
        userInitials={session?.initials ?? "AR"}
      >
        {children}
      </NavShell>
    </ServiceLineProvider>
  );
}
