import type { Permission } from "@/core/rbac/permissions";

export type NavItem = { href: string; labelKey: string; perm: Permission; icon: "dash" | "users" | "cal" | "queue" | "bill" | "book" | "shield" };

/** Hiding items is cosmetic. Every page and action still authorizes server-side. */
export const NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", perm: "dashboard:view", icon: "dash" },
  { href: "/patients", labelKey: "nav.patients", perm: "patients:view", icon: "users" },
  { href: "/appointments", labelKey: "nav.appointments", perm: "appointments:view", icon: "cal" },
  { href: "/queue", labelKey: "nav.queue", perm: "queue:view", icon: "queue" },
  { href: "/billing", labelKey: "nav.billing", perm: "billing:view", icon: "bill" },
  { href: "/accounting", labelKey: "nav.accounting", perm: "ledger:view", icon: "book" },
  { href: "/settings/security", labelKey: "nav.settings", perm: "dashboard:view", icon: "shield" },
];
