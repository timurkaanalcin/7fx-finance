import { fallbackSiteOrigin } from "@/lib/site-origin";

/**
 * Auto-login links are opened as a top-level navigation (CRM copy, email, another domain).
 * The session cookie is host-only, so the redirect must stay on the host that set it.
 * `0.0.0.0` is an internal bind the browser never used; localhost and 127.0.0.1 are real
 * browser hosts during local runs and must not be rewritten to a canonical production origin.
 */

export type HeaderSource = { get(name: string): string | null };

const BIND_HOSTS = new Set(["0.0.0.0", "::", "[::]"]);

export function splitHostPort(raw: string): { hostname: string; port: string } {
  const first = raw.split(",")[0]?.trim() || "";
  if (!first) return { hostname: "", port: "" };
  if (first.startsWith("[")) {
    const m = first.match(/^(\[[^\]]+\])(?::(\d+))?$/);
    const hostname = (m?.[1] || first).replace(/^\[|\]$/g, "");
    return { hostname, port: m?.[2] || "" };
  }
  const idx = first.lastIndexOf(":");
  if (idx > 0 && /^\d+$/.test(first.slice(idx + 1))) {
    return { hostname: first.slice(0, idx), port: first.slice(idx + 1) };
  }
  return { hostname: first, port: "" };
}

export function isBindHost(hostname: string): boolean {
  const h = hostname.trim().toLowerCase();
  return !h || BIND_HOSTS.has(h);
}

function formatOrigin(proto: string, hostname: string, port: string): string {
  const scheme = proto === "http" ? "http" : "https";
  const keepPort =
    port && !((scheme === "https" && port === "443") || (scheme === "http" && port === "80"));
  return `${scheme}://${hostname}${keepPort ? `:${port}` : ""}`;
}

function protoFor(hostname: string, headerProto: string, requestProto: string): string {
  const p = headerProto.toLowerCase();
  if (p === "http" || p === "https") return p;
  if (requestProto === "http" || requestProto === "https") {
    if (hostname === "localhost" || hostname.startsWith("127.")) return requestProto;
  }
  if (hostname === "localhost" || hostname.startsWith("127.")) return "http";
  return "https";
}

/** Origin that will store the host-only session cookie and receive the next navigation. */
export function autoLoginOrigin(req: { url: string; headers: HeaderSource }): string {
  const xf = splitHostPort(req.headers.get("x-forwarded-host") || "");
  const host = splitHostPort(req.headers.get("host") || "");
  const headerProto = (req.headers.get("x-forwarded-proto") || "").split(",")[0]?.trim() || "";
  let requestProto = "";
  let requestOrigin = "";
  try {
    const u = new URL(req.url);
    requestProto = u.protocol.replace(":", "");
    requestOrigin = u.origin;
    if (isBindHost(u.hostname)) requestOrigin = "";
  } catch {
    /* ignore */
  }

  const chosen = !isBindHost(xf.hostname) ? xf : !isBindHost(host.hostname) ? host : null;
  if (chosen) {
    return formatOrigin(protoFor(chosen.hostname, headerProto, requestProto), chosen.hostname, chosen.port);
  }
  if (requestOrigin) return requestOrigin;

  // No browser host at all (internal bind). Canonical origin from APP_URL / MAIN_SITE_ORIGIN.
  return fallbackSiteOrigin();
}

export function autoLoginRedirectUrl(req: { url: string; headers: HeaderSource }, path: string): URL {
  const origin = autoLoginOrigin(req);
  const p = path.startsWith("/") ? path : `/${path}`;
  return new URL(p, origin.endsWith("/") ? origin : `${origin}/`);
}

/**
 * Query parsers turn `+` into space, and some mail gateways encode the token twice.
 * Return lookup candidates, most-literal first. Hex tokens stay a single candidate.
 */
export function loginTokenCandidates(raw: string): string[] {
  const trimmed = String(raw || "").trim();
  const out: string[] = [];
  const add = (v: string) => {
    const s = v.trim();
    if (s && s.length <= 64 && !out.includes(s)) out.push(s);
  };
  const expand = (v: string) => {
    add(v);
    if (v.includes(" ")) add(v.replace(/ /g, "+"));
  };
  expand(trimmed);
  try {
    const decoded = decodeURIComponent(trimmed);
    if (decoded !== trimmed) expand(decoded);
  } catch {
    /* ignore malformed escape */
  }
  return out;
}
