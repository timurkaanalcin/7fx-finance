/**
 * Public site origin for redirects and shareable links.
 * Prefer the host the browser actually used (customer / financeunit / control / login)
 * so a session cookie set without Domain stays on that host. NEXT_PUBLIC_APP_URL is
 * only a fallback for internal binds (`https://0.0.0.0:8080`), never a cross-host redirect.
 */
export function publicRequestOrigin(req: Request): string {
  const xfHostRaw = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const host = xfHostRaw.split(",")[0].trim().replace(/:\d+$/, "");
  const looksInternal =
    !host ||
    host.startsWith("0.0.0.0") ||
    host.startsWith("127.") ||
    host === "localhost" ||
    host.startsWith("[::]");

  if (!looksInternal) {
    const xfProtoRaw = req.headers.get("x-forwarded-proto") || "https";
    const proto = xfProtoRaw.split(",")[0].trim() || "https";
    return `${proto}://${host}`;
  }

  const env =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";
  if (env) {
    try {
      return new URL(env).origin;
    } catch {
      /* ignore bad env */
    }
  }

  // Last resort — prefer known production host over broken internal bind.
  try {
    const fromReq = new URL(req.url).origin;
    if (!fromReq.includes("0.0.0.0") && !fromReq.includes("127.0.0.1")) {
      return fromReq;
    }
  } catch {
    /* ignore */
  }
  return "https://7fx.customer.org.tr";
}

export function publicAbsoluteUrl(req: Request, path: string): string {
  const origin = publicRequestOrigin(req);
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${p}`;
}
