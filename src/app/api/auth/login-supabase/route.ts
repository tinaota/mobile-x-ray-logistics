import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  COOKIE_NAME, DISPLAY_COOKIE, ROLE_DASHBOARDS, signSession,
  type AuthRole, type Session,
} from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const COOKIE_OPTS = {
  secure:   process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge:   60 * 60 * 24 * 7,
  path:     "/",
};

export async function POST(req: NextRequest) {
  const { accessToken } = await req.json().catch(() => ({}));

  if (!accessToken) {
    return NextResponse.json({ error: "Access token is required" }, { status: 400 });
  }

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !key) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  try {
    // 1. Verify the Supabase token and get the user
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      key,
      { auth: { persistSession: false } }
    );
    const { data: { user }, error: authError } = await anon.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json({ error: authError?.message ?? "Invalid access token" }, { status: 401 });
    }

    const email = user.email ?? "";

    // 2. Fetch the user's profile to resolve their role & name
    let profile = null;
    if (supabaseAdmin) {
      const { data, error: dbError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!dbError && data) {
        profile = data;
      }
    }

    // 3. If no profile exists, they need to go through onboarding
    if (!profile) {
      return NextResponse.json({
        onboardingRequired: true,
        email: email || user.phone || "",
      });
    }

    // 4. Resolve name and initials
    const name = profile.full_name || "New User";
    const initials = name
      .split(" ")
      .map((n: string) => n[0])
      .filter(Boolean)
      .join("")
      .toUpperCase() || "NU";

    const session: Session = {
      email: email || profile.phone || `user+${user.id}@radops.com`,
      role: profile.role as AuthRole,
      name,
      initials,
    };

    // 5. Sign the session and set the cookies
    const jwt = await signSession(session);
    const redirectUrl = ROLE_DASHBOARDS[profile.role as AuthRole] ?? "/";

    const res = NextResponse.json({ redirect: redirectUrl });

    res.cookies.set(COOKIE_NAME, jwt, { ...COOKIE_OPTS, httpOnly: true });
    res.cookies.set(
      DISPLAY_COOKIE,
      encodeURIComponent(JSON.stringify({
        name,
        initials,
        role: profile.role,
        email: session.email,
      })),
      { ...COOKIE_OPTS, httpOnly: false }
    );

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Authentication error" }, { status: 500 });
  }
}
