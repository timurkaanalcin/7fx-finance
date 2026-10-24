import { CRM_HOSTNAMES } from "@/lib/crm-host";

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

/** Trading sites. CRM hosts come from CRM_HOSTNAMES. */
const PRODUCTION_REDIRECT_HOSTS = new Set([
  "7fx.customer.org.tr",
  "7fx.financeunit.co",
  "7fx.control.org.tr",
  "7fx.login.org.tr",
]);

/** This project's Vercel host and its preview deployments, not every *.vercel.app site. */
const VERCEL_PROJECT_HOST = "7fx-finance.vercel.app";
const VERCEL_PREVIEW_HOST = /^7fx-finance-[a-z0-9-]+\.vercel\.app$/;

/**
 * Hosts we will copy into a Location header. Anything else is ignored so a
 * forged X-Forwarded-Host cannot turn a login redirect into an open redirect.
 */
export function isTrustedRedirectHost(hostname: string): boolean {
  const h = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!h || h.includes("..") || !/^[a-z0-9.-]+$/.test(h)) return false;
  if (h === "localhost" || h === "127.0.0.1") return true;
  if (PRODUCTION_REDIRECT_HOSTS.has(h) || CRM_HOSTNAMES.has(h)) return true;
  if (h === "crm7fx.localhost" || h.endsWith(".crm7fx.localhost")) return true;
  if (h === VERCEL_PROJECT_HOST || VERCEL_PREVIEW_HOST.test(h)) return true;
  return false;
}

/**
 * Absolute Location for a same-site path.
 * A trusted X-Forwarded-Host wins over a trusted Host, and both win over req.url,
 * so Next's internal URL (127.0.0.1 rewritten to localhost) cannot pick the domain.
 * An untrusted header is dropped and the origin falls back to req.url.
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
  const xfOk = isTrustedRedirectHost(xf.hostname);
  const hostOk = isTrustedRedirectHost(host.hostname);
  const chosen = xfOk ? xf : hostOk ? host : null;
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
