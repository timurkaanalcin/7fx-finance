/** CRM pages a scoped staff member may open. */
export function scopedPageAllowed(pathname: string): boolean {
  return (
    pathname === "/izcrm/traders" ||
    pathname.startsWith("/izcrm/traders/") ||
    pathname === "/izcrm/chat" ||
    pathname === "/izcrm/analytics/affiliates" ||
    pathname.startsWith("/izcrm/chat/")
  );
}
