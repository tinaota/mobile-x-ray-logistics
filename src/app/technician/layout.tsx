"use client";

import { usePathname } from "next/navigation";
import { TechnicianShell } from "@/components/layout/TechnicianShell";
import type { ReactNode } from "react";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/technician":           { title: "Active Order",        subtitle: "RAD-FIELD · Field View"          },
  "/technician/manifest":  { title: "Daily Manifest",      subtitle: "Today's assignments"             },
  "/technician/clinical":  { title: "Clinical Docs",       subtitle: "Procedure documentation"         },
  "/technician/scan":      { title: "Scan & QC",           subtitle: "Image capture & quality control" },
  "/technician/equipment": { title: "Equipment Checklist", subtitle: "Pre-shift verification"          },
  "/technician/offline":   { title: "Offline Sync Log",    subtitle: "Pending uploads & conflicts"     },
};

export default function TechnicianLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? { title: "Field View", subtitle: "" };

  return (
    <TechnicianShell
      title={meta.title}
      subtitle={meta.subtitle}
      syncStatus="synced"
      userName="T. Parker"
      userInitials="TP"
    >
      {children}
    </TechnicianShell>
  );
}
