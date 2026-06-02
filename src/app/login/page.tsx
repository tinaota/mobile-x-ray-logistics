"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Shield, Eye, EyeOff, Lock, Phone, Mail, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

function formatPhoneForSupabase(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return raw.startsWith("+") ? raw : `+${digits}`;
}

export default function LoginPage() {
  const router = useRouter();
  
  // Auth Modes: "password" (Staff), "sms" (Patient SMS OTP), "email" (Patient Email OTP)
  const [authMode, setAuthMode] = useState<"password" | "sms" | "email">("password");
  
  // Credentials Auth State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP Auth State (Phone / Email)
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  
  // Shared UI State
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle Staff password-based authentication
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed. Please try again.");
        return;
      }

      router.push(data.redirect);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP code (SMS or Email)
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOtpLoading(true);

    try {
      let result;
      if (authMode === "sms") {
        const formattedPhone = formatPhoneForSupabase(phoneInput);
        if (formattedPhone.length < 11) {
          setError("Please enter a valid 10-digit phone number.");
          setOtpLoading(false);
          return;
        }
        result = await supabase.auth.signInWithOtp({ phone: formattedPhone });
      } else {
        if (!emailInput.trim()) {
          setError("Please enter a valid email address.");
          setOtpLoading(false);
          return;
        }
        result = await supabase.auth.signInWithOtp({ email: emailInput.trim() });
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        setOtpSent(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send code. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 2: Verify OTP code and establish local cookie session
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      if (authMode === "sms") {
        const formattedPhone = formatPhoneForSupabase(phoneInput);
        result = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token: verificationCode.trim(),
          type: "sms",
        });
      } else {
        result = await supabase.auth.verifyOtp({
          email: emailInput.trim(),
          token: verificationCode.trim(),
          type: "email",
        });
      }

      if (result.error || !result.data.session) {
        setError(result.error?.message ?? "Invalid or expired verification code.");
        setLoading(false);
        return;
      }

      // Exchange Supabase token for local Next.js session cookies
      const res = await fetch("/api/auth/login-supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: result.data.session.access_token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to finalize session.");
        return;
      }

      if (data.onboardingRequired) {
        // Redirect new users to onboarding flow
        const qs = new URLSearchParams({
          invited: "true",
          role: "client",
          email: data.email,
        });
        sessionStorage.setItem("sb_access_token", result.data.session.access_token);
        sessionStorage.setItem("sb_email", data.email);
        router.push(`/onboarding?${qs}`);
      } else {
        // Logged-in existing users go to their dashboard
        router.push(data.redirect);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify code.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (mode: "password" | "sms" | "email") => {
    setAuthMode(mode);
    setError(null);
    setOtpSent(false);
    setVerificationCode("");
  };

  const inputCls = cn(
    "w-full h-11 px-4 rounded-lg bg-surface-container border border-outline-variant",
    "text-on-surface placeholder:text-on-surface-variant/50 text-sm",
    "focus:outline-none focus:ring-2 focus:ring-medical-blue focus:border-transparent",
    "transition-colors"
  );

  return (
    <div className="min-h-screen bg-midnight-navy flex flex-col items-center justify-center px-4">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-10">
        <div className="h-10 w-10 rounded-xl bg-medical-blue flex items-center justify-center shadow-lg">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <span className="text-white font-black text-xl tracking-tighter font-label uppercase">
          RAD-COMMAND
        </span>
        <div className="h-4 w-px bg-white/20 mx-1" />
        <Shield className="h-4 w-4 text-white/30" />
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-card-lg p-8 border border-outline-variant/40">
        <h1 className="text-on-surface text-2xl font-bold font-headline mb-1">
          {authMode === "password" ? "Staff Login" : "Patient Portal"}
        </h1>
        <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
          {authMode === "password" 
            ? "Enter credentials to access the Unified Command" 
            : "Sign up or log in to track your appointment & view results"}
        </p>

        {/* Dynamic Segmented Mode Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-outline-variant/30">
          <button
            type="button"
            onClick={() => handleTabChange("password")}
            className={cn(
              "flex-1 py-2 px-1 text-center rounded-lg text-[10.5px] font-label font-bold uppercase tracking-wider transition-all duration-150",
              authMode === "password" 
                ? "bg-white text-medical-blue shadow-sm border border-outline-variant/20" 
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            Staff
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("sms")}
            className={cn(
              "flex-1 py-2 px-1 text-center rounded-lg text-[10.5px] font-label font-bold uppercase tracking-wider transition-all duration-150",
              authMode === "sms" 
                ? "bg-white text-medical-blue shadow-sm border border-outline-variant/20" 
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            Phone OTP
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("email")}
            className={cn(
              "flex-1 py-2 px-1 text-center rounded-lg text-[10.5px] font-label font-bold uppercase tracking-wider transition-all duration-150",
              authMode === "email" 
                ? "bg-white text-medical-blue shadow-sm border border-outline-variant/20" 
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            Email OTP
          </button>
        </div>

        {/* ── Form Section ── */}

        {/* 1. Staff Password Form */}
        {authMode === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2 font-label">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@radops.com"
                required
                autoComplete="email"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2 font-label">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className={cn(inputCls, "pr-11")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-emergency-red text-sm bg-emergency-red/10 border border-emergency-red/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full h-11 rounded-lg bg-medical-blue text-white font-label font-semibold text-sm uppercase tracking-wider",
                "hover:bg-blue-500 active:bg-blue-600 transition-colors",
                "disabled:opacity-50 disabled:pointer-events-none",
                "flex items-center justify-center gap-2 mt-2 shadow-sm"
              )}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        )}

        {/* 2. Patient Phone OTP Form */}
        {authMode === "sms" && (
          <div className="space-y-5 animate-fade-in">
            {!otpSent ? (
              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2 font-label">
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={e => setPhoneInput(e.target.value)}
                      placeholder="(602) 555-0100"
                      required
                      className={cn(inputCls, "pl-11")}
                    />
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/40" />
                  </div>
                  <p className="text-[11px] text-on-surface-variant/70 mt-2 leading-relaxed">
                    Uses Supabase Phone Emulator. Type test phone number registered in Dashboard (e.g. 6025550100).
                  </p>
                </div>

                {error && (
                  <div className="text-emergency-red text-sm bg-emergency-red/10 border border-emergency-red/20 rounded-lg px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otpLoading}
                  className={cn(
                    "w-full h-11 rounded-lg bg-medical-blue text-white font-label font-semibold text-sm uppercase tracking-wider",
                    "hover:bg-blue-500 active:bg-blue-600 transition-colors",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    "flex items-center justify-center gap-2 shadow-sm"
                  )}
                >
                  {otpLoading ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>Send Verification Code <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2 font-label">
                    Enter SMS Verification Code
                  </label>
                  <input
                    type="text"
                    pattern="\d*"
                    maxLength={6}
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    required
                    className={inputCls}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[11px] text-on-surface-variant/75">
                      Code sent to <strong className="font-semibold">{formatPhoneForSupabase(phoneInput)}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[11px] text-medical-blue font-semibold hover:underline"
                    >
                      Change Phone
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-emergency-red text-sm bg-emergency-red/10 border border-emergency-red/20 rounded-lg px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "w-full h-11 rounded-lg bg-medical-blue text-white font-label font-semibold text-sm uppercase tracking-wider",
                    "hover:bg-blue-500 active:bg-blue-600 transition-colors",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    "flex items-center justify-center gap-2 shadow-sm"
                  )}
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Log In"
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* 3. Patient Email OTP Form */}
        {authMode === "email" && (
          <div className="space-y-5 animate-fade-in">
            {!otpSent ? (
              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2 font-label">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      placeholder="patient@example.com"
                      required
                      className={cn(inputCls, "pl-11")}
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/40" />
                  </div>
                  <p className="text-[11px] text-on-surface-variant/70 mt-2 leading-relaxed">
                    Uses free Email SMTP provider setup in Supabase to deliver magic link code.
                  </p>
                </div>

                {error && (
                  <div className="text-emergency-red text-sm bg-emergency-red/10 border border-emergency-red/20 rounded-lg px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otpLoading}
                  className={cn(
                    "w-full h-11 rounded-lg bg-medical-blue text-white font-label font-semibold text-sm uppercase tracking-wider",
                    "hover:bg-blue-500 active:bg-blue-600 transition-colors",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    "flex items-center justify-center gap-2 shadow-sm"
                  )}
                >
                  {otpLoading ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    <>Send Verification Code <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2 font-label">
                    Enter Email Verification Code
                  </label>
                  <input
                    type="text"
                    pattern="\d*"
                    maxLength={6}
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    required
                    className={inputCls}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[11px] text-on-surface-variant/75">
                      Code sent to <strong className="font-semibold">{emailInput}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[11px] text-medical-blue font-semibold hover:underline"
                    >
                      Change Email
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-emergency-red text-sm bg-emergency-red/10 border border-emergency-red/20 rounded-lg px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "w-full h-11 rounded-lg bg-medical-blue text-white font-label font-semibold text-sm uppercase tracking-wider",
                    "hover:bg-blue-500 active:bg-blue-600 transition-colors",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    "flex items-center justify-center gap-2 shadow-sm"
                  )}
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Log In"
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        <p className="mt-6 text-center">
          <button
            type="button"
            className="text-xs text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
          >
            Forgot password? Contact your system administrator.
          </button>
        </p>
      </div>

      {/* Security footer */}
      <div className="flex items-center gap-2 mt-8 text-white/25 text-[11px] font-label uppercase tracking-widest">
        <Lock className="h-3 w-3" />
        <span>Secure Portal · AES-256</span>
      </div>
    </div>
  );
}
