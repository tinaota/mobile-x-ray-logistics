"use client";

import { useState } from "react";
import { getAccounts } from "@/lib/accounts";
import { cn } from "@/lib/utils";
import {
  Users, Shield, Copy, Check, AlertCircle,
  UserCheck, Mail, UserPlus, X, Send, Trash2,
} from "lucide-react";
// Copy + Check still used inside InviteModal for the fallback link copy button
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  dispatcher: { label: "RAD-COMMAND",      color: "bg-medical-blue/10 text-medical-blue"     },
  technician: { label: "RAD-FIELD",        color: "bg-green-500/10 text-green-700"            },
  billing:    { label: "Revenue Command",  color: "bg-warning-amber/10 text-warning-amber"    },
  client:     { label: "MY X-RAY",         color: "bg-rose-500/10 text-rose-600"              },
  admin:      { label: "SYS ADMIN",        color: "bg-purple-500/10 text-purple-600"          },
};


// ── Invite modal ─────────────────────────────────────────────────────────────
function InviteModal({ onClose }: { onClose: () => void }) {
  const [email,     setEmail]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<{ sent?: boolean; link?: string; email?: string } | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [copied,    setCopied]    = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    try {
      // No role — invited user picks their own role during onboarding
      const res  = await fetch("/api/auth/invite", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to send invite"); return; }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputCls = cn(
    "w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant",
    "text-on-surface text-sm placeholder:text-on-surface-variant/50",
    "focus:outline-none focus:ring-2 focus:ring-medical-blue focus:border-transparent transition-colors"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-navy/50 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-outline-variant/40 shadow-card-lg w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-outline-variant/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-medical-blue/10 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-medical-blue" />
            </div>
            <h3 className="text-base font-bold text-on-surface font-headline">Invite New User</h3>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {!result ? (
            <>
              <div>
                <label className="block text-[11px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@hospital.com"
                    className={cn(inputCls, "pl-9")}
                    onKeyDown={e => e.key === "Enter" && email && handleSend()}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-emergency-red/10 border border-emergency-red/20 rounded-lg px-3 py-2.5 text-emergency-red text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <p className="text-xs text-on-surface-variant leading-relaxed">
                The invited user will choose their own role during onboarding.
                If Supabase email is not configured, a copy-able link will be generated instead.
              </p>
            </>
          ) : result.sent ? (
            /* Supabase email sent */
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">Invite sent!</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  An invitation email has been sent to{" "}
                  <span className="font-mono text-on-surface">{result.email}</span>.
                  They&apos;ll be guided through onboarding when they click the link.
                </p>
              </div>
            </div>
          ) : (
            /* Fallback: copy link */
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-warning-amber text-xs bg-warning-amber/10 border border-warning-amber/20 rounded-lg px-3 py-2.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Supabase not configured — share this link manually.
              </div>
              <div>
                <label className="block text-[11px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Invite Link
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={result.link}
                    className={cn(inputCls, "flex-1 font-mono text-xs bg-surface-container")}
                  />
                  <button
                    onClick={() => result.link && copyLink(result.link)}
                    className={cn(
                      "flex items-center gap-1.5 h-10 px-3 rounded-lg text-xs font-semibold shrink-0 transition-colors",
                      copied
                        ? "bg-green-500/10 text-green-700"
                        : "bg-medical-blue/10 text-medical-blue hover:bg-medical-blue/20"
                    )}
                  >
                    {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                  </button>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant">
                Link expires in 48 hours. The recipient will go through the full onboarding flow.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 pb-5">
          {!result ? (
            <>
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                loading={loading}
                disabled={!email || loading}
                onClick={handleSend}
                className="gap-2"
              >
                <Send className="h-3.5 w-3.5" />
                Send Invite
              </Button>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={onClose}>Done</Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [accounts,       setAccounts]       = useState(() => getAccounts());
  const [showInvite,     setShowInvite]     = useState(false);
  const [confirmRemove,  setConfirmRemove]  = useState<string | null>(null);
  const [error,          setError]          = useState<string | null>(null);

  return (
    <div className="max-w-4xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-medical-blue/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-medical-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface font-headline">User Management</h2>
            <p className="text-sm text-on-surface-variant">Manage platform accounts and send invitations</p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowInvite(true)}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Invite New User
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-emergency-red/10 border border-emergency-red/20 rounded-lg px-4 py-3 text-emergency-red text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Accounts", value: accounts.length,                                 icon: Users     },
          { label: "Active Roles",   value: new Set(accounts.map(a => a.role)).size,         icon: Shield    },
          { label: "Admin Accounts", value: accounts.filter(a => a.role === "admin").length, icon: UserCheck },
        ].map(stat => (
          <Card key={stat.label} className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-5 w-5 text-on-surface-variant" />
                <span className="text-2xl font-bold font-mono text-on-surface">{stat.value}</span>
              </div>
              <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant">
                {stat.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Account table */}
      <Card className="shadow-card">
        <CardHeader>
          <h3 className="text-sm font-label font-semibold uppercase tracking-wider text-on-surface-variant">
            Demo Accounts
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-outline-variant/40">
            {accounts.length === 0 && (
              <p className="px-6 py-8 text-sm text-on-surface-variant text-center">
                No accounts. Use <span className="font-semibold">Invite New User</span> to add people.
              </p>
            )}
            {accounts.map(account => {
              const roleMeta  = ROLE_LABELS[account.role];
              const confirming = confirmRemove === account.email;

              return (
                <div
                  key={account.email}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container/40 transition-colors"
                >
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-medical-blue/10 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold font-mono text-medical-blue">{account.initials}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{account.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Mail className="h-3 w-3 text-on-surface-variant" />
                      <p className="text-xs text-on-surface-variant font-mono truncate">{account.email}</p>
                    </div>
                  </div>

                  {/* Role badge */}
                  <span className={cn(
                    "text-[10px] font-label font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0",
                    roleMeta.color
                  )}>
                    {roleMeta.label}
                  </span>

                  {/* Remove */}
                  <div className="flex items-center gap-2 shrink-0">
                    {confirming ? (
                      <>
                        <span className="text-xs text-on-surface-variant">Remove account?</span>
                        <button
                          onClick={() => setConfirmRemove(null)}
                          className="h-7 px-2.5 rounded-md text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setAccounts(prev => prev.filter(a => a.email !== account.email));
                            setConfirmRemove(null);
                          }}
                          className="h-7 px-2.5 rounded-md text-xs font-semibold bg-emergency-red/10 text-emergency-red hover:bg-emergency-red/20 transition-colors"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmRemove(account.email)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-on-surface-variant/50 hover:bg-emergency-red/10 hover:text-emergency-red transition-colors"
                        aria-label="Remove account"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="shadow-card border-warning-amber/20 bg-warning-amber/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-warning-amber mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-on-surface mb-1">Default Demo Credentials</p>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
                These demo accounts are seeded from <span className="font-mono">src/lib/accounts.ts</span>.
                Use <span className="font-semibold">Invite New User</span> to add real accounts via Supabase Auth.
                Override passwords via environment variables before deploying to production.
              </p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs font-mono text-on-surface-variant">
                {accounts.map(a => (
                  <div key={a.email} className="flex items-center gap-2">
                    <span className="text-on-surface">{a.email}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite modal */}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}
