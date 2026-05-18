import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, DISPLAY_COOKIE, ROLE_DASHBOARDS, signSession, type Session } from "@/lib/auth";
import { getAccounts } from "@/lib/accounts";

const COOKIE_OPTS = {
  secure:   process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge:   60 * 60 * 24 * 7,
  path:     "/",
};

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));

  const accounts = getAccounts();
  const account  = accounts.find(
    a =>
      a.email.toLowerCase() === String(email ?? "").toLowerCase().trim() &&
      a.password === password,
  );

  if (!account) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const session: Session = {
    email:    account.email,
    role:     account.role,
    name:     account.name,
    initials: account.initials,
  };

  const token = await signSession(session);
  const res   = NextResponse.json({ redirect: ROLE_DASHBOARDS[account.role] });

  res.cookies.set(COOKIE_NAME, token, { ...COOKIE_OPTS, httpOnly: true });
  res.cookies.set(
    DISPLAY_COOKIE,
    encodeURIComponent(JSON.stringify({
      name:     account.name,
      initials: account.initials,
      role:     account.role,
      email:    account.email,
    })),
    { ...COOKIE_OPTS, httpOnly: false },
  );

  return res;
}
