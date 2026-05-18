"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function CallbackHandler() {
  const router  = useRouter();
  const params  = useSearchParams();
  const [err,   setErr] = useState("");

  useEffect(() => {
    const run = async () => {
      const tokenHash       = params.get("token_hash");
      const type            = params.get("type");
      const code            = params.get("code");
      const errorParam      = params.get("error");
      const errorDesc       = params.get("error_description");

      if (errorParam) {
        setErr(errorDesc ?? errorParam);
        return;
      }

      let sessionData = null;
      let sessionErr  = null;

      if (tokenHash && type) {
        // OTP invite flow — token_hash + type in query params
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "invite" | "email" | "signup" | "magiclink" | "recovery",
        });
        sessionData = data?.session;
        sessionErr  = error;
      } else if (code) {
        // PKCE flow — code in query params
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        sessionData = data?.session;
        sessionErr  = error;
      } else {
        // Implicit flow — Supabase auto-processes #access_token= hash fragment
        const { data, error } = await supabase.auth.getSession();
        sessionData = data?.session ?? null;
        sessionErr  = error;
        if (!sessionData) {
          setErr("Invalid callback — missing token.");
          return;
        }
      }

      if (sessionErr || !sessionData) {
        setErr(sessionErr?.message ?? "Authentication failed. The link may have expired.");
        return;
      }

      const role  = sessionData.user.user_metadata?.role ?? "";
      const email = sessionData.user.email ?? "";

      sessionStorage.setItem("sb_access_token", sessionData.access_token);
      sessionStorage.setItem("sb_email", email);

      const qs = new URLSearchParams({ invited: "true" });
      if (role) qs.set("role", role);
      router.replace(`/onboarding?${qs}`);
    };

    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (err) {
    return (
      <div className="min-h-screen bg-ghost-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-base font-semibold text-on-surface mb-2">Link expired or invalid</p>
          <p className="text-sm text-on-surface-variant mb-4">{err}</p>
          <a
            href="/login"
            className="text-sm text-medical-blue hover:underline"
          >
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ghost-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-medical-blue/30 border-t-medical-blue animate-spin" />
        <p className="text-sm text-on-surface-variant">Setting up your account…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ghost-white flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-medical-blue/30 border-t-medical-blue animate-spin" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
