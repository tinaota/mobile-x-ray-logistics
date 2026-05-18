"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Legacy invite links (/join?token=...) now redirect through the onboarding flow.
// The JWT token is decoded client-side to extract the role for pre-filling onboarding.

function JoinRedirect() {
  const router  = useRouter();
  const params  = useSearchParams();
  const token   = params.get("token");

  useEffect(() => {
    let role = "";
    if (token) {
      try {
        const [, payload] = token.split(".");
        const data = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        if (data.type === "invite") role = data.role ?? "";
      } catch { /* ignore decode errors */ }
    }

    const qs = new URLSearchParams({ invited: "true" });
    if (role) qs.set("role", role);
    if (token) qs.set("token", token);
    router.replace(`/onboarding?${qs}`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-ghost-white flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-medical-blue/30 border-t-medical-blue animate-spin" />
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ghost-white flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-medical-blue/30 border-t-medical-blue animate-spin" />
      </div>
    }>
      <JoinRedirect />
    </Suspense>
  );
}
