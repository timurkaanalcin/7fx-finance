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

type HeaderSource = { get(name: string): string | null };

function splitHostPort(raw: string): { hostname: string; port: string } {
  const first = raw.split(",")[0]?.trim() || "";
  if (!first) return { hostname: "", port: "" };
  const idx = first.lastIndexOf(":");
  if (idx > 0 && /^\d+$/.test(first.slice(idx + 1))) {
    return { hostname: first.slice(0, idx), port: first.slice(idx + 1) };
  }
  return { hostname: first, port: "" };
}

function isBindHost(hostname: string): boolean {
  const h = hostname.trim().toLowerCase();
  return !h || h === "0.0.0.0" || h === "::" || h === "[::]";
}

/**
 * Absolute Location for a same-site path.
 * X-Forwarded-Host wins over Host, and both win over req.url, so Next's
 * internal URL (127.0.0.1 rewritten to localhost) cannot pick the domain.
 * localhost and 127.0.0.1 stay when they are the forwarded host: they are real
 * browser hosts in local runs.
 */
export function locationForRequest(req: { url: string; headers: HeaderSource }, path: string): string {
  if (path.startsWith("https://") || path.startsWith("http://")) return path;
  const xf = splitHostPort(req.headers.get("x-forwarded-host") || "");
  const host = splitHostPort(req.headers.get("host") || "");
  const headerProto = (req.headers.get("x-forwarded-proto") || "").split(",")[0]?.trim().toLowerCase() || "";
  let requestProto = "";
  try {
    requestProto = new URL(req.url).protocol.replace(":", "");
  } catch {
    /* req.url is only a last resort */
  }
  const chosen = !isBindHost(xf.hostname) ? xf : !isBindHost(host.hostname) ? host : null;
  let origin = "";
  if (chosen) {
    const hostname = chosen.hostname.toLowerCase();
    const local = hostname === "localhost" || hostname.startsWith("127.");
    const proto =
      headerProto === "http" || headerProto === "https"
        ? headerProto
        : local
          ? requestProto === "http" || requestProto === "https"
            ? requestProto
            : "http"
          : "https";
    const keepPort =
      chosen.port && !((proto === "https" && chosen.port === "443") || (proto === "http" && chosen.port === "80"));
    origin = `${proto}://${hostname}${keepPort ? `:${chosen.port}` : ""}`;
  } else {
    try {
      const u = new URL(req.url);
      if (!isBindHost(u.hostname)) origin = u.origin;
    } catch {
      /* ignore */
    }
    if (!origin) origin = "https://7fx.customer.org.tr";
  }
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${p}`;
}
