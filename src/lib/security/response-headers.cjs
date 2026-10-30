"use strict";

/** Shared response headers for middleware, next.config, and the cPanel server. */
const FRAME_OPTIONS = "DENY";
const REFERRER_POLICY = "strict-origin-when-cross-origin";
const PERMISSIONS_POLICY = "camera=(), microphone=(), geolocation=(), payment=(), usb=()";
const HSTS_VALUE = "max-age=15552000; includeSubDomains";

function contentSecurityPolicy({ https, dev }) {
  const scriptSrc = dev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";
  const styleSrc = "style-src 'self' 'unsafe-inline'";
  const fontSrc = "font-src 'self' data:";
  const directives = [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    "img-src 'self' data: blob: https:",
    fontSrc,
    "connect-src 'self' https://query1.finance.yahoo.com https://query2.finance.yahoo.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  // upgrade-insecure-requests on plain HTTP rewrites script and fetch URLs to HTTPS.
  if (https) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

function requestIsHttps(forwardedProto, protocol) {
  const forwarded = String(forwardedProto || "").split(",")[0].trim().toLowerCase();
  if (forwarded === "https") return true;
  return String(protocol || "").replace(":", "") === "https";
}

/** Headers for static files that skip middleware. HSTS is ignored by browsers on HTTP. */
function staticSecurityHeaders() {
  return [
    { key: "X-Frame-Options", value: FRAME_OPTIONS },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: REFERRER_POLICY },
    { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
    { key: "Content-Security-Policy", value: contentSecurityPolicy({ https: false, dev: false }) },
    { key: "Strict-Transport-Security", value: HSTS_VALUE },
  ];
}

function applyNodeSecurityHeaders(res, { https, dev }) {
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Frame-Options", FRAME_OPTIONS);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", REFERRER_POLICY);
  res.setHeader("Permissions-Policy", PERMISSIONS_POLICY);
  res.setHeader("Content-Security-Policy", contentSecurityPolicy({ https, dev }));
  if (https) res.setHeader("Strict-Transport-Security", HSTS_VALUE);
}

module.exports = {
  FRAME_OPTIONS,
  REFERRER_POLICY,
  PERMISSIONS_POLICY,
  HSTS_VALUE,
  contentSecurityPolicy,
  requestIsHttps,
  staticSecurityHeaders,
  applyNodeSecurityHeaders,
};
