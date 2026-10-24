import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import PublicDoc from "@/components/public/PublicDoc";
import { publicLocaleFromCookie } from "@/lib/i18n/locales";
import { localizeMarketingMeta, metaFor, publicBundle } from "@/lib/public-doc-copy";
import { ASSET_PAGES } from "@/lib/public-pages";
import { marketingMetadata } from "@/lib/seo";

function localeFromCookie() {
  return publicLocaleFromCookie(cookies().get("fx_lang")?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  const h = headers();
  const locale = localeFromCookie();
  const copy = metaFor(locale, "/markets");
  return localizeMarketingMeta(
    marketingMetadata(h.get("x-forwarded-host") || h.get("host"), "/markets"),
    locale,
    copy.title,
    copy.description
  );
}

export default function MarketsPage() {
  const copy = publicBundle(localeFromCookie());
  return (
    <PublicDoc title={copy.markets.title} lede={copy.markets.lede} nav={copy.nav}>
      <p>{copy.markets.intro}</p>
      <ul className="list-disc space-y-2 pl-5">
        {ASSET_PAGES.map((page) => (
          <li key={page.path}>
            <Link href={page.path} className="font-semibold underline underline-offset-4">
              {copy.assets[page.slug as keyof typeof copy.assets].title}
            </Link>
            <span className="text-[#3f4248]"> — {copy.assets[page.slug as keyof typeof copy.assets].lede}</span>
          </li>
        ))}
      </ul>
      <p>
        <Link href="/platform" className="font-semibold underline underline-offset-4">
          {copy.markets.platformLink}
        </Link>
      </p>
    </PublicDoc>
  );
}
