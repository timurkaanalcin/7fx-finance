import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import InstallBanner from "@/components/InstallBanner";
import PublicI18n from "@/components/i18n/PublicI18n";
import KeyboardInset from "@/components/system/KeyboardInset";
import { inter } from "@/lib/fonts";
import { LOCALE_META, publicLocaleFromCookie, type Locale } from "@/lib/i18n/locales";
import type { Dict } from "@/lib/i18n/types";
import { DESCRIPTION, OG_ALT, OG_IMAGE, TITLE } from "@/lib/seo";
import { primaryOrigin } from "@/lib/seo-hosts";

async function publicDict(locale: Locale): Promise<Dict | undefined> {
  if (locale === "ru") return (await import("@/lib/i18n/dictionaries/ru")).ru;
  if (locale === "ar") return (await import("@/lib/i18n/dictionaries/ar")).ar;
  if (locale === "tr") return (await import("@/lib/i18n/dictionaries/tr")).tr;
  if (locale === "de") return (await import("@/lib/i18n/dictionaries/de")).de;
  return undefined;
}


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#07090d",
};

export const metadata: Metadata = {
  metadataBase: new URL(primaryOrigin()),
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const rawLang = cookies().get("fx_lang")?.value;
  const hasLocaleCookie = typeof rawLang === "string" && rawLang.trim() !== "";
  const locale = publicLocaleFromCookie(rawLang);
  const initialDict = await publicDict(locale);
  const meta = LOCALE_META[locale];
  return (
    <html
      lang={meta.htmlLang}
      dir={meta.dir}
      className={inter.variable}
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
        <KeyboardInset />
        <PublicI18n initialLocale={locale} initialDict={initialDict} hasLocaleCookie={hasLocaleCookie}>
          {children}
        </PublicI18n>
        <InstallBanner />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.addEventListener("pageshow",function(e){if(e.persisted)location.reload()});if('serviceWorker' in navigator){var hadSW=!!navigator.serviceWorker.controller,reloaded=false;navigator.serviceWorker.addEventListener('controllerchange',function(){if(hadSW&&!reloaded){reloaded=true;location.reload()}});window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(function(r){r.update().catch(function(){})}).catch(function(){})})};(function(){function bad(v){var s="";try{s=String((v&&(v.name||v.message||v.filename))||v||"")}catch(e){}return /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module/i.test(s)}function show(){if(document.getElementById("fx-chunk-reload"))return;var bar=document.createElement("div");bar.id="fx-chunk-reload";bar.setAttribute("role","status");bar.style.cssText="position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483646;background:#111111;color:#f4f7fb;padding:14px 16px;border-radius:12px;font:400 14px/1.45 Inter,system-ui,sans-serif";var p=document.createElement("p");p.textContent="This page is out of date. Reload to open the latest version.";p.style.margin="0 0 10px";var b=document.createElement("button");b.type="button";b.textContent="Reload";b.style.cssText="min-height:40px;min-width:40px;padding:0 16px;border:0;border-radius:999px;background:#f4f7fb;color:#111111;font:500 14px/1 Inter,system-ui,sans-serif";b.onclick=function(){location.reload()};bar.appendChild(p);bar.appendChild(b);(document.body||document.documentElement).appendChild(bar)}window.addEventListener("error",function(e){if(bad(e.error)||bad(e.message)||bad(e.filename))show()});window.addEventListener("unhandledrejection",function(e){if(bad(e.reason))show()})})()`,
          }}
        />
      </body>
    </html>
  );
}
