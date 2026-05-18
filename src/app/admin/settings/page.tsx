"use client";

import { useState } from "react";
import {
  Settings, Shield, Bell, Plug2, AlertTriangle,
  Check, Globe, Clock, Mail, Phone, Database,
  Wifi, WifiOff, RefreshCw, ChevronRight,
  MessageSquare, Siren, Zap,
} from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// ── Toggle switch primitive ─────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
        "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-medical-blue focus:ring-offset-2",
        checked ? "bg-medical-blue" : "bg-outline-variant"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm",
          "transform transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

// ── Setting row ──────────────────────────────────────────────────────────────
function SettingRow({
  label, description, children, border = true,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between gap-6 py-4",
      border && "border-b border-outline-variant/40 last:border-0"
    )}>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-on-surface">{label}</p>
        {description && <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ ok, label }: { ok: boolean; label?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-[11px] font-label font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full",
      ok
        ? "bg-green-500/10 text-green-700"
        : "bg-emergency-red/10 text-emergency-red"
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-green-500" : "bg-emergency-red")} />
      {label ?? (ok ? "Connected" : "Not Configured")}
    </span>
  );
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon, title, description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="h-9 w-9 rounded-lg bg-medical-blue/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4.5 w-4.5 text-medical-blue" style={{ width: 18, height: 18 }} />
      </div>
      <div>
        <h3 className="text-base font-bold text-on-surface font-headline">{title}</h3>
        <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>
      </div>
    </div>
  );
}

// ── Save feedback ─────────────────────────────────────────────────────────────
function useSaveFeedback() {
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const save = () => {
    setState("saving");
    setTimeout(() => { setState("saved"); setTimeout(() => setState("idle"), 2000); }, 800);
  };
  return { state, save };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SystemSettingsPage() {

  // General
  const [platformName,    setPlatformName]    = useState("RAD-COMMAND");
  const [orgName,         setOrgName]         = useState("RAD-OPS Network");
  const [supportEmail,    setSupportEmail]    = useState("support@radops.com");
  const [timezone,        setTimezone]        = useState("America/Chicago");

  // Security
  const [sessionDays,     setSessionDays]     = useState("7");
  const [require2FA,      setRequire2FA]      = useState(false);
  const [auditLogging,    setAuditLogging]    = useState(true);

  // Notifications
  const [statAlerts,      setStatAlerts]      = useState(true);
  const [patientSms,      setPatientSms]      = useState(true);
  const [batteryAlerts,   setBatteryAlerts]   = useState(true);
  const [emailDigest,     setEmailDigest]     = useState(false);

  const generalSave       = useSaveFeedback();
  const securitySave      = useSaveFeedback();
  const notifSave         = useSaveFeedback();

  // Integration status (read from env at render time via a fetch — simulated here)
  const twilioOk          = !!(process.env.NEXT_PUBLIC_TWILIO_CONFIGURED === "true");
  const supabaseOk        = !!(process.env.NEXT_PUBLIC_SUPABASE_URL);

  // Danger zone
  const [dangerInput,     setDangerInput]     = useState("");
  const [sessionCleared,  setSessionCleared]  = useState(false);

  const inputCls = cn(
    "w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant",
    "text-on-surface text-sm placeholder:text-on-surface-variant/50",
    "focus:outline-none focus:ring-2 focus:ring-medical-blue focus:border-transparent transition-colors"
  );

  const selectCls = cn(inputCls, "cursor-pointer appearance-none pr-8 bg-[right_0.75rem_center] bg-no-repeat");

  return (
    <div className="max-w-2xl space-y-8">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-medical-blue/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-medical-blue" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-on-surface font-headline">System Settings</h2>
          <p className="text-sm text-on-surface-variant">Configure platform behaviour and integrations</p>
        </div>
      </div>

      {/* ── 1. General ──────────────────────────────────────────────────── */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <SectionHeader
            icon={Globe}
            title="General"
            description="Platform identity and regional defaults"
          />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Platform Name
                </label>
                <input
                  value={platformName}
                  onChange={e => setPlatformName(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[11px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Organisation Name
                </label>
                <input
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Support Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={e => setSupportEmail(e.target.value)}
                    className={cn(inputCls, "pl-9")}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Timezone
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50 pointer-events-none z-10" />
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className={cn(selectCls, "pl-9")}
                  >
                    <option value="America/New_York">Eastern (ET)</option>
                    <option value="America/Chicago">Central (CT)</option>
                    <option value="America/Denver">Mountain (MT)</option>
                    <option value="America/Los_Angeles">Pacific (PT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-6 py-3 flex justify-end">
          <Button
            variant={generalSave.state === "saved" ? "outline" : "primary"}
            size="sm"
            loading={generalSave.state === "saving"}
            onClick={generalSave.save}
            className="gap-2"
          >
            {generalSave.state === "saved"
              ? <><Check className="h-4 w-4" /> Saved</>
              : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>

      {/* ── 2. Security ─────────────────────────────────────────────────── */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <SectionHeader
            icon={Shield}
            title="Security"
            description="Session management and access controls"
          />
          <div className="divide-y divide-outline-variant/40">
            <SettingRow
              label="Session Duration"
              description="How long users stay logged in before re-authentication is required"
              border={false}
            >
              <div className="flex items-center gap-2">
                <select
                  value={sessionDays}
                  onChange={e => setSessionDays(e.target.value)}
                  className={cn(selectCls, "w-28")}
                >
                  <option value="1">1 day</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
            </SettingRow>
            <SettingRow
              label="Require Two-Factor Authentication"
              description="Enforce 2FA for all admin and dispatcher accounts"
            >
              <Toggle checked={require2FA} onChange={setRequire2FA} />
            </SettingRow>
            <SettingRow
              label="Audit Logging"
              description="Record all admin actions to the compliance audit trail"
            >
              <Toggle checked={auditLogging} onChange={setAuditLogging} />
            </SettingRow>
          </div>
        </CardContent>
        <CardFooter className="px-6 py-3 flex justify-end">
          <Button
            variant={securitySave.state === "saved" ? "outline" : "primary"}
            size="sm"
            loading={securitySave.state === "saving"}
            onClick={securitySave.save}
            className="gap-2"
          >
            {securitySave.state === "saved"
              ? <><Check className="h-4 w-4" /> Saved</>
              : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>

      {/* ── 3. Notifications ────────────────────────────────────────────── */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <SectionHeader
            icon={Bell}
            title="Notifications"
            description="Automated alerts and SMS messaging behaviour"
          />
          <div className="divide-y divide-outline-variant/40">
            <SettingRow
              label="STAT Order Alerts"
              description="Immediately notify all online dispatchers when a STAT order is created"
              border={false}
            >
              <div className="flex items-center gap-3">
                <Siren className="h-4 w-4 text-emergency-red" />
                <Toggle checked={statAlerts} onChange={setStatAlerts} />
              </div>
            </SettingRow>
            <SettingRow
              label="Patient SMS Notifications"
              description="Automatically send status updates to patients via SMS on order progress"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-medical-blue" />
                <Toggle checked={patientSms} onChange={setPatientSms} />
              </div>
            </SettingRow>
            <SettingRow
              label="Low Battery Alerts"
              description="Alert dispatchers when a technician device battery falls below 20%"
            >
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-warning-amber" />
                <Toggle checked={batteryAlerts} onChange={setBatteryAlerts} />
              </div>
            </SettingRow>
            <SettingRow
              label="Daily Email Digest"
              description="Send a daily operational summary email to admin accounts"
            >
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-on-surface-variant" />
                <Toggle checked={emailDigest} onChange={setEmailDigest} />
              </div>
            </SettingRow>
          </div>
        </CardContent>
        <CardFooter className="px-6 py-3 flex justify-end">
          <Button
            variant={notifSave.state === "saved" ? "outline" : "primary"}
            size="sm"
            loading={notifSave.state === "saving"}
            onClick={notifSave.save}
            className="gap-2"
          >
            {notifSave.state === "saved"
              ? <><Check className="h-4 w-4" /> Saved</>
              : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>

      {/* ── 4. Integrations ─────────────────────────────────────────────── */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <SectionHeader
            icon={Plug2}
            title="Integrations"
            description="External service connections and API credentials"
          />
          <div className="space-y-3">

            {/* Twilio */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container border border-outline-variant/60 hover:border-outline-variant transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Twilio SMS</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {twilioOk
                      ? "Account SID and Auth Token are configured"
                      : "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env.local"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge ok={twilioOk} />
                <ChevronRight className="h-4 w-4 text-on-surface-variant/40" />
              </div>
            </div>

            {/* Supabase */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container border border-outline-variant/60 hover:border-outline-variant transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Database className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Supabase</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {supabaseOk
                      ? "Database and real-time subscriptions active"
                      : "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY — using mock data"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge ok={supabaseOk} label={supabaseOk ? "Connected" : "Mock Data"} />
                <ChevronRight className="h-4 w-4 text-on-surface-variant/40" />
              </div>
            </div>

            {/* JWT / Auth */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container border border-outline-variant/60">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-medical-blue/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-medical-blue" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">JWT Auth</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    HS256 · httpOnly cookie · 7-day expiry — set JWT_SECRET in .env.local for production
                  </p>
                </div>
              </div>
              <StatusBadge ok label="Active" />
            </div>

          </div>
        </CardContent>
      </Card>

      {/* ── 5. Danger Zone ──────────────────────────────────────────────── */}
      <Card className="shadow-card border-emergency-red/20">
        <CardContent className="p-6">
          <SectionHeader
            icon={AlertTriangle}
            title="Danger Zone"
            description="Irreversible actions — proceed with caution"
          />

          <div className="space-y-4">

            {/* Force logout */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-emergency-red/20 bg-emergency-red/5">
              <div>
                <p className="text-sm font-semibold text-on-surface">Force Logout All Users</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Invalidates all active sessions. Users will need to log in again immediately.
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setSessionCleared(true)}
                className="gap-2 shrink-0 ml-4"
                disabled={sessionCleared}
              >
                {sessionCleared
                  ? <><Check className="h-4 w-4" /> Done</>
                  : <><RefreshCw className="h-4 w-4" /> Clear Sessions</>}
              </Button>
            </div>

            {/* Confirm-to-reset */}
            <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container">
              <p className="text-sm font-semibold text-on-surface mb-1">Reset to Demo Data</p>
              <p className="text-xs text-on-surface-variant mb-3">
                Wipes all orders, messages, and invoices and restores the seed data. Type{" "}
                <code className="font-mono bg-surface-container-high px-1.5 py-0.5 rounded text-emergency-red text-[11px]">
                  reset demo
                </code>{" "}
                to confirm.
              </p>
              <div className="flex gap-2">
                <input
                  value={dangerInput}
                  onChange={e => setDangerInput(e.target.value)}
                  placeholder='Type "reset demo" to confirm'
                  className={cn(inputCls, "flex-1")}
                />
                <Button
                  variant="danger"
                  size="sm"
                  disabled={dangerInput !== "reset demo"}
                  className="shrink-0"
                >
                  Reset
                </Button>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

    </div>
  );
}
