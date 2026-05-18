import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySession, COOKIE_NAME, ROLE_DASHBOARDS } from "@/lib/auth";

export default async function RootPage() {
  const jar     = await cookies();
  const token   = jar.get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  redirect(session ? ROLE_DASHBOARDS[session.role] : "/login");
}
