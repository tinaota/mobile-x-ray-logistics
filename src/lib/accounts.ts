import type { AuthRole } from "./auth";

export interface Account {
  email: string;
  role: AuthRole;
  name: string;
  initials: string;
  password: string;
}

export function getAccounts(): Account[] {
  return [
    {
      email:    "dispatcher@radops.com",
      role:     "dispatcher",
      name:     "Alex Rivera",
      initials: "AR",
      password: process.env.AUTH_DISPATCHER_PASSWORD ?? "dispatch123",
    },
    {
      email:    "tech@radops.com",
      role:     "technician",
      name:     "T. Parker",
      initials: "TP",
      password: process.env.AUTH_TECHNICIAN_PASSWORD ?? "field123",
    },
    {
      email:    "billing@radops.com",
      role:     "billing",
      name:     "R. Chen",
      initials: "RC",
      password: process.env.AUTH_BILLING_PASSWORD ?? "billing123",
    },
    {
      email:    "client@radops.com",
      role:     "client",
      name:     "Margaret Johnson",
      initials: "MJ",
      password: process.env.AUTH_CLIENT_PASSWORD ?? "patient123",
    },
    {
      email:    "admin@radops.com",
      role:     "admin",
      name:     "System Admin",
      initials: "SA",
      password: process.env.AUTH_ADMIN_PASSWORD ?? "admin123",
    },
    {
      email:    "copilot@radops.com",
      role:     "copilot",
      name:     "Co-Pilot Operator",
      initials: "CP",
      password: process.env.AUTH_COPILOT_PASSWORD ?? "copilot123",
    },
  ];
}
