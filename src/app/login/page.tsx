"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Shield, Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim(), password }),
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

      {/* Card */}
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-card-lg p-8 border border-outline-variant/40">
        <h1 className="text-on-surface text-2xl font-bold font-headline mb-1">
          Sign in to your account
        </h1>
        <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">
          Enter your credentials to access the Unified Command
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
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
              className={cn(
                "w-full h-11 px-4 rounded-lg bg-surface-container border border-outline-variant",
                "text-on-surface placeholder:text-on-surface-variant/50 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-medical-blue focus:border-transparent",
                "transition-colors"
              )}
            />
          </div>

          {/* Password */}
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
                className={cn(
                  "w-full h-11 px-4 pr-11 rounded-lg bg-surface-container border border-outline-variant",
                  "text-on-surface placeholder:text-on-surface-variant/50 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-medical-blue focus:border-transparent",
                  "transition-colors"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye    className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-emergency-red text-sm bg-emergency-red/10 border border-emergency-red/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full h-11 rounded-lg bg-medical-blue text-white font-label font-semibold text-sm uppercase tracking-wider",
              "hover:bg-blue-500 active:bg-blue-600 transition-colors",
              "disabled:opacity-50 disabled:pointer-events-none",
              "flex items-center justify-center gap-2 mt-2"
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

        <p className="mt-5 text-center">
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
