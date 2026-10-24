import type { Metadata, Viewport } from "next";
import InstallBanner from "@/components/InstallBanner";
import "./globals.css";
import "./mobile-luxe.css";
import PublicI18n from "@/components/i18n/PublicI18n";
import { inter, sora } from "@/lib/fonts";
import { DESCRIPTION, OG_ALT, OG_IMAGE, TITLE } from "@/lib/seo";
import { PRIMARY_ORIGIN } from "@/lib/seo-hosts";


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL(PRIMARY_ORIGIN),
  title: "7FX",
  description: DESCRIPTION,
  manifest: "/site.webmanifest",
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["tr_TR", "de_DE", "ru_RU", "ar_AR"],
    siteName: "7FX",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: OG_ALT }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
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
    <html
      lang="en"
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
        <PublicI18n>
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
