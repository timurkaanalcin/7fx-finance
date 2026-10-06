import type { Metadata, Viewport } from "next";
import "./globals.css";
import PublicI18n from "@/components/i18n/PublicI18n";


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL
  ? process.env.NEXT_PUBLIC_APP_URL
  : process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : "https://7fx.customer.org.tr";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "7FX",
  description:
    "7FX — international multi-asset trading platform. Secure web access to stocks, crypto, forex and commodities.",
  manifest: "/site.webmanifest",
  openGraph: {
    title: "7FX",
    description:
      "7FX international broker / trading platform: stocks, crypto, forex and commodities — secure session, 24/7 access.",
    images: [{ url: "/7fx-logo.png", width: 1200, height: 630, alt: "7FX" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "7FX",
  },
  applicationName: "7FX",
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/icons/v3/favicon.ico", sizes: "any" },
      { url: "/icons/v3/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/v3/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/v3/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/v3/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/v3/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/v3/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icons/v3/favicon.ico"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Sora:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <PublicI18n>
          {children}
        </PublicI18n>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){var hadSW=!!navigator.serviceWorker.controller,reloaded=false;navigator.serviceWorker.addEventListener('controllerchange',function(){if(hadSW&&!reloaded){reloaded=true;location.reload()}});window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(function(r){r.update().catch(function(){})}).catch(function(){})})}`,
          }}
        />
      </body>
    </html>
  );
}
