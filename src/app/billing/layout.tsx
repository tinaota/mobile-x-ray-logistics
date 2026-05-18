"use client";

import { usePathname } from "next/navigation";
import { NavShell } from "@/components/layout/NavShell";
import { useSession } from "@/lib/hooks/useSession";
import type { ReactNode } from "react";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/billing":           { title: "Revenue Dashboard",  subtitle: "REVENUE COMMAND · Billing View" },
  "/billing/ledger":    { title: "Ledger",             subtitle: "Transaction history"            },
  "/billing/invoices":  { title: "Audit Logs",         subtitle: "Completed order billing"        },
  "/billing/scrubbing": { title: "Compliance",         subtitle: "CPT compliance review"          },
  "/billing/audit":     { title: "Compliance Audit",   subtitle: "Claims verification log"        },
  "/billing/reports":   { title: "Revenue Reports",    subtitle: "Analytics & exports"            },
};

export default function BillingLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const session  = useSession();
  const meta     = PAGE_META[pathname] ?? { title: "Billing", subtitle: "" };

  return (
    <NavShell
      role="billing"
      title={meta.title}
      subtitle={meta.subtitle}
      syncStatus="synced"
      userName={session?.name ?? "R. Chen"}
      userInitials={session?.initials ?? "RC"}
    >
      {children}
    </NavShell>
  );
}
