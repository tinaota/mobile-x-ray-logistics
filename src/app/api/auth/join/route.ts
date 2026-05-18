import { NextRequest, NextResponse } from "next/server";
import {
  verifyInvite, COOKIE_NAME, DISPLAY_COOKIE,
  ROLE_DASHBOARDS, signSession, type Session,
} from "@/lib/auth";
import { getAccounts } from "@/lib/accounts";

const COOKIE_OPTS = {
  secure:   process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge:   60 * 60 * 24 * 7,
  path:     "/",
};

export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({}));

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const invite = await verifyInvite(token);
  if (!invite) {
    return NextResponse.json({ error: "Invalid or expired invite link" }, { status: 401 });
  }

  const account = getAccounts().find(a => a.email.toLowerCase() === invite.email.toLowerCase());
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const session: Session = {
    email:    account.email,
    role:     account.role,
    name:     account.name,
    initials: account.initials,
  };

  const jwt = await signSession(session);
  const res = NextResponse.json({ redirect: ROLE_DASHBOARDS[account.role] });

  res.cookies.set(COOKIE_NAME, jwt, { ...COOKIE_OPTS, httpOnly: true });
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
