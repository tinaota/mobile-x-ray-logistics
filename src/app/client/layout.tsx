"use client";

import { usePathname } from "next/navigation";
import { ClientShell } from "@/components/layout/ClientShell";
import type { ReactNode } from "react";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/client":         { title: "My Appointment",      subtitle: "Today's visit status"        },
  "/client/history": { title: "Appointment History", subtitle: "Past visits & results"       },
  "/client/contact": { title: "Contact Us",          subtitle: "Reach your care coordinator" },
};

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? { title: "My X-Ray", subtitle: "" };

  return (
    <ClientShell
      title={meta.title}
      subtitle={meta.subtitle}
      userName="Margaret Johnson"
      userInitials="MJ"
    >
      {children}
    </ClientShell>
  );
}
