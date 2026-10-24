/** Allowed browser Origins for credentialed / mutating API calls in production. */
export const API_ALLOWED_ORIGINS = new Set(
  [
    "https://7fx.control.org.tr",
    "https://crm.control.org.tr",
    "https://7fx-finance.vercel.app",
    "https://7fx.customer.org.tr",
    "https://crm7fx.customer.org.tr",
    "https://7fx-finance-production.up.railway.app",
    process.env.NEXT_PUBLIC_SITE_ORIGIN,
    process.env.MAIN_SITE_ORIGIN,
    // local / preview
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].filter(Boolean) as string[]
);

export function isAllowedApiOrigin(origin: string | null): boolean {
  if (!origin) return true; // same-origin navigations / server-to-server / mobile often omit Origin
  if (API_ALLOWED_ORIGINS.has(origin)) return true;
  // Capacitor / WebView
  if (origin.startsWith("capacitor://") || origin.startsWith("ionic://")) return true;
  if (origin === "http://localhost" || origin === "https://localhost") return true;
  // Any *.up.railway.app for this project's preview deploys
  try {
    const u = new URL(origin);
    if (u.hostname.endsWith(".up.railway.app") && u.protocol === "https:") return true;
  } catch {
    /* ignore */
  }
  return false;
}
