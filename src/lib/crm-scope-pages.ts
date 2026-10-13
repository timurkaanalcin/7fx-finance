/** CRM pages a scoped staff member may open (data is server-side scoped to assigned customers). */
const DENY = ["/izcrm/import", "/izcrm/licenses", "/izcrm/mail"];
export function scopedPageAllowed(pathname: string): boolean {
  if (!pathname.startsWith("/izcrm")) return false;
  return !DENY.some((d) => pathname === d || pathname.startsWith(d + "/"));
}
