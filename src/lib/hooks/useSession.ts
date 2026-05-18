"use client";

import { useState, useEffect } from "react";
import type { AuthRole } from "@/lib/auth";

export interface ClientSession {
  name: string;
  initials: string;
  role: AuthRole;
  email: string;
}

export function useSession(): ClientSession | null {
  const [session, setSession] = useState<ClientSession | null>(null);

  useEffect(() => {
    const match = document.cookie.match(/rad-user=([^;]+)/);
    if (match) {
      try {
        setSession(JSON.parse(decodeURIComponent(match[1])));
      } catch { /* ignore malformed cookie */ }
    }
  }, []);

  return session;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}
