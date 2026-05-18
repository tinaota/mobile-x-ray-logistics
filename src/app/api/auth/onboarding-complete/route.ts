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
  const { name, initials, role, accessToken, email: bodyEmail } =
    await req.json().catch(() => ({}));

  if (!name || !initials || !role) {
    return NextResponse.json({ error: "name, initials, and role are required" }, { status: 400 });
  }

  let email = bodyEmail ?? `user+${Date.now()}@radops.com`;

  // If we have a Supabase access token, validate it and update user metadata
  if (
    accessToken &&
    supabaseAdmin &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    // Validate the token and get the user
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    );
    const { data: { user } } = await anon.auth.getUser(accessToken);

    if (user) {
      email = user.email ?? email;
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: { name, initials, role },
      });
    }
  }

  const session: Session = {
    email,
    role: role as AuthRole,
    name,
    initials,
  };

  const jwt = await signSession(session);
  const res = NextResponse.json({
    redirect: ROLE_DASHBOARDS[role as AuthRole] ?? "/",
  });

  res.cookies.set(COOKIE_NAME, jwt, { ...COOKIE_OPTS, httpOnly: true });
  res.cookies.set(
    DISPLAY_COOKIE,
    encodeURIComponent(JSON.stringify({ name, initials, role, email })),
    { ...COOKIE_OPTS, httpOnly: false },
  );

  return res;
}
