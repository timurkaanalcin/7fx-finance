export type CrmxDecision =
  | { allow: true }
  | { allow: false; redirect: "/login" | "/trade" };

/**
 * Signed-out visitors go to the admin login.
 * A session that is not ADMIN (traders, unknown roles) is blocked from /crmx.
 * Role is checked after /api/auth/me, the same way /izcrm does it.
 */
export function decideCrmxSession(input: {
  authenticated: boolean;
  role?: string | null;
}): CrmxDecision {
  if (!input.authenticated) return { allow: false, redirect: "/login" };
  if (input.role !== "ADMIN") return { allow: false, redirect: "/trade" };
  return { allow: true };
}

/** Same deny list as scoped /izcrm pages, expressed on the /crmx tree. */
const CRMX_SCOPED_DENY = ["/crmx/import", "/crmx/licenses", "/crmx/mail"];

export function scopedCrmxPageAllowed(pathname: string): boolean {
  if (!pathname.startsWith("/crmx")) return false;
  for (const denied of CRMX_SCOPED_DENY) {
    if (pathname === denied || pathname.startsWith(`${denied}/`)) return false;
  }
  return true;
}
