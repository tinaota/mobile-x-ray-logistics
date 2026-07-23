"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import type { AuthRole } from "@/lib/auth";

export interface PlatformUser {
  id: string;
  email: string;
  name: string;
  initials: string;
  role: AuthRole;
  locked: boolean;
  lastActiveAt?: string;
}

export interface AdminInvite {
  id: string;
  email: string;
  expiresAt: string;
  acceptedAt?: string;
}

const MIN = 60_000;

// Demo fallback when Supabase is unconfigured or 015_admin_user_management.sql
// has not been applied — keeps the console fully presentable.
const now = Date.now();
const MOCK_USERS: PlatformUser[] = [
  { id: "u1", email: "dispatcher@radops.com", name: "Alex Rivera",      initials: "AR", role: "dispatcher", locked: false, lastActiveAt: new Date(now - 1 * MIN).toISOString() },
  { id: "u2", email: "tech@radops.com",       name: "T. Parker",        initials: "TP", role: "technician", locked: false, lastActiveAt: new Date(now - 5 * MIN).toISOString() },
  { id: "u3", email: "billing@radops.com",    name: "R. Chen",          initials: "RC", role: "billing",    locked: false, lastActiveAt: new Date(now - 2 * 60 * MIN).toISOString() },
  { id: "u4", email: "client@radops.com",     name: "Margaret Johnson", initials: "MJ", role: "client",     locked: true,  lastActiveAt: new Date(now - 3 * 24 * 60 * MIN).toISOString() },
  { id: "u5", email: "copilot@radops.com",    name: "Ops Co-Pilot",     initials: "CP", role: "copilot",    locked: false, lastActiveAt: new Date(now - 30 * MIN).toISOString() },
  { id: "u6", email: "admin@radops.com",      name: "System Admin",     initials: "SA", role: "admin",      locked: false, lastActiveAt: new Date(now - 0.5 * MIN).toISOString() },
];
const MOCK_INVITES: AdminInvite[] = [
  { id: "i1", email: "new.tech@radops.com",     expiresAt: new Date(now + 40 * 60 * MIN).toISOString() },
  { id: "i2", email: "j.morales@radops.com",    expiresAt: new Date(now + 6 * 60 * MIN).toISOString()  },
  { id: "i3", email: "s.okafor@mercygen.org",   expiresAt: new Date(now + 2 * 60 * MIN).toISOString()  },
  { id: "i4", email: "onboard@sunrisemed.com",  expiresAt: new Date(now + 44 * 60 * MIN).toISOString() },
];

export function useAdminUsers() {
  const [users, setUsers]     = useState<PlatformUser[]>([]);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo]       = useState(false);

  const fetchAll = useCallback(async () => {
    if (!supabaseConfigured) {
      setUsers(MOCK_USERS); setInvites(MOCK_INVITES); setDemo(true); setLoading(false);
      return;
    }
    const [u, i] = await Promise.all([
      supabase.from("platform_users").select("*").order("last_active_at", { ascending: false }),
      supabase.from("admin_invites").select("*").is("accepted_at", null).order("expires_at"),
    ]);
    setLoading(false);
    // Tables missing (migration 015 not applied) → demo data keeps the console usable
    if (u.error || i.error || !u.data) {
      setUsers(MOCK_USERS); setInvites(MOCK_INVITES); setDemo(true);
      return;
    }
    setDemo(false);
    setUsers(u.data.map(r => ({
      id: r.id, email: r.email, name: r.name, initials: r.initials,
      role: r.role, locked: r.locked, lastActiveAt: r.last_active_at ?? undefined,
    })));
    setInvites((i.data ?? []).map(r => ({
      id: r.id, email: r.email, expiresAt: r.expires_at, acceptedAt: r.accepted_at ?? undefined,
    })));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const setLocked = async (id: string, locked: boolean) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, locked } : u));
    if (!supabaseConfigured || demo) return;
    const { error } = await supabase.from("platform_users").update({ locked }).eq("id", id);
    if (error) fetchAll();
  };

  return { users, invites, loading, demo, setLocked, refetch: fetchAll };
}

/** "Active" = seen in the last 15 minutes; "Away" = within 8 hours; else offline. */
export function presenceOf(u: PlatformUser): "active" | "away" | "offline" | "locked" {
  if (u.locked) return "locked";
  if (!u.lastActiveAt) return "offline";
  const age = Date.now() - new Date(u.lastActiveAt).getTime();
  if (age < 15 * MIN) return "active";
  if (age < 8 * 60 * MIN) return "away";
  return "offline";
}

export function lastActiveLabel(iso?: string): string {
  if (!iso) return "Never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / MIN);
  if (mins < 2)        return "Just now";
  if (mins < 60)       return `${mins} min ago`;
  if (mins < 24 * 60)  return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / (24 * 60))}d ago`;
}
