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
    return [
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
