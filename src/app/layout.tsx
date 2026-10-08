import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import InstallBanner from "@/components/InstallBanner";
import "./globals.css";
import "./mobile-luxe.css";
import PublicI18n from "@/components/i18n/PublicI18n";
import { getPublicLocale } from "@/lib/i18n/server";
import { LOCALE_META } from "@/lib/i18n/locales";

/*
 * Fonts are self-hosted at build time via next/font. The previous <link> to
 * fonts.googleapis.com was blocked by our own CSP (style-src 'self'), so every page
 * silently fell back to system fonts; self-hosting fixes that without loosening CSP.
 */
const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});
const sora = Sora({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-sora",
});

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
  title: { default: "7FX", template: "%s · 7FX" },
  description:
    "7FX — international multi-asset trading platform. Secure web access to stocks, crypto, forex and commodities.",
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "7FX",
    title: "7FX",
    description:
      "7FX international broker / trading platform: stocks, crypto, forex and commodities — secure session, 24/7 access.",
    images: [{ url: "/brand/og-7fx.png", width: 1200, height: 630, alt: "7FX" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/og-7fx.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "7FX",
  },
  applicationName: "7FX",
  formatDetection: { telephone: false },
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
  // Resolve the public locale on the server (cookie → Accept-Language) so the first
  // paint is already in the visitor's language and <html lang/dir> is correct for SEO/a11y.
  const locale = getPublicLocale();
  const meta = LOCALE_META[locale];
  return (
    <html
      lang={meta.htmlLang}
      dir={meta.dir}
      className={`${inter.variable} ${sora.variable}`}
      data-fx-theme="light"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("fx-theme");document.documentElement.setAttribute("data-fx-theme",t==="dark"?"dark":"light")}catch(e){}`,
          }}
        />
      </head>
      <body className="antialiased">
        <PublicI18n initialLocale={locale}>
          {children}
        </PublicI18n>
        <InstallBanner />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){var hadSW=!!navigator.serviceWorker.controller,reloaded=false;navigator.serviceWorker.addEventListener('controllerchange',function(){if(hadSW&&!reloaded){reloaded=true;location.reload()}});window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(function(r){r.update().catch(function(){})}).catch(function(){})})}`,
          }}
        />
      </body>
    </html>
  );
}
