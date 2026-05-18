import { SignJWT, jwtVerify } from "jose";

export type AuthRole = "dispatcher" | "technician" | "billing" | "client" | "admin";

export interface Session {
  email: string;
  role: AuthRole;
  name: string;
  initials: string;
}

export const COOKIE_NAME    = "rad-session"; // httpOnly JWT — used by middleware
export const DISPLAY_COOKIE = "rad-user";    // non-httpOnly JSON — used by client layouts

export const ROLE_DASHBOARDS: Record<AuthRole, string> = {
  dispatcher: "/dispatcher",
  technician: "/technician",
  billing:    "/billing",
  client:     "/client",
  admin:      "/admin",
};

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET ?? "rad-ops-dev-secret-please-change-in-prod-32ch";
  return new TextEncoder().encode(s);
}

export async function signSession(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      email:    payload.email    as string,
      role:     payload.role     as AuthRole,
      name:     payload.name     as string,
      initials: payload.initials as string,
    };
  } catch {
    return null;
  }
}

export async function signInvite(email: string, role: AuthRole): Promise<string> {
  return new SignJWT({ email, role, type: "invite" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("48h")
    .sign(getSecret());
}

export async function verifyInvite(token: string): Promise<{ email: string; role: AuthRole } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.type !== "invite") return null;
    return { email: payload.email as string, role: payload.role as AuthRole };
  } catch {
    return null;
  }
}
