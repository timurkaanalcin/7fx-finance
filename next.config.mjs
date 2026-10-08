/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "mammoth", "xlsx", "geoip-country"],
  },
  poweredByHeader: false,
  webpack: (config) => {
    // pdfjs-dist optionally requires node "canvas"; never bundle it.
    config.resolve.alias = { ...(config.resolve.alias || {}), canvas: false };
    return config;
  },
  async redirects() {
    return [
      { source: "/apk", destination: "/downloads/7FX.apk", permanent: false },
      { source: "/download/apk", destination: "/downloads/7FX.apk", permanent: false },
    ];
  },
  async headers() {
    // Static files bypass middleware (see matcher), so give them the same baseline
    // security headers here. Pages/API get the full set (incl. CSP) from middleware.
    const staticSecurity = [
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
    ];
    return [
      { source: "/_next/static/:path*", headers: staticSecurity },
      {
        source: "/:file((?:.*/)?[^/]+\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|txt|xml|webmanifest|apk))",
        headers: staticSecurity,
      },
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      {
        source: "/izcrm/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
