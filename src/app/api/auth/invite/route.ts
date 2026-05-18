import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, signInvite, COOKIE_NAME } from "@/lib/auth";
import { supabaseAdmin, supabaseAdminConfigured } from "@/lib/supabase-admin";
import type { AuthRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const jar     = await cookies();
  const token   = jar.get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // role is optional — invited user chooses their own role during onboarding
  const { email, role } = await req.json().catch(() => ({}));
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const baseUrl = req.nextUrl.origin;

  // Supabase path — sends real invite email
  if (supabaseAdminConfigured && supabaseAdmin) {
    const metadata: Record<string, string> = { invited_by: session.email };
    if (role) metadata.role = role; // pre-fill role step if provided

    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${baseUrl}/auth/callback`,
      data: metadata,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ sent: true, email, role });
  }

  // Fallback — generate JWT invite link for demo/local use
  const inviteToken = await signInvite(email, role as AuthRole);
  return NextResponse.json({
    sent:  false,
    link:  `${baseUrl}/join?token=${inviteToken}`,
    email,
    role,
  });
}
