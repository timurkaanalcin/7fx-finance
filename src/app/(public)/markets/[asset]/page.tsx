import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import PublicDoc from "@/components/public/PublicDoc";
import { publicLocaleFromCookie } from "@/lib/i18n/locales";
import { publicBundle } from "@/lib/public-doc-copy";
import { ASSET_PAGES, assetBySlug } from "@/lib/public-pages";
import { marketingMetadata } from "@/lib/seo";
import { BUILTIN_SYMBOLS } from "@/lib/symbols";

type Params = { params: { asset: string } };

function localeFromCookie() {
  return publicLocaleFromCookie(cookies().get("fx_lang")?.value);
}

export function generateStaticParams() {
  return ASSET_PAGES.map((page) => ({ asset: page.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const page = assetBySlug(params.asset);
  const h = headers();
  if (!page) return { robots: { index: false, follow: false } };
  return marketingMetadata(h.get("x-forwarded-host") || h.get("host"), page.path);
}

export default function AssetMarketPage({ params }: Params) {
  const page = assetBySlug(params.asset);
  if (!page) notFound();
  const locale = localeFromCookie();
  const bundle = publicBundle(locale);
  const copy = bundle.assets[page.slug as keyof typeof bundle.assets];
  const symbols = BUILTIN_SYMBOLS.filter((row) => row.class === page.assetClass);
  return (
    <PublicDoc title={copy.title} lede={copy.lede} nav={bundle.nav}>
      {copy.session.map((line) => (
        <p key={line}>{line}</p>
      ))}
      <h2 className="text-xl font-semibold">{copy.symbolsHeading}</h2>
      <p>{copy.symbolsNote}</p>
      <ul className="grid gap-1 sm:grid-cols-2">
        {symbols.map((row) => (
          <li key={row.symbol}>
            <span className="font-semibold">{row.symbol}</span>
            <span className="text-[#3f4248]"> — {row.name}</span>
          </li>
        ))}
      </ul>
      <p>
        <Link href="/markets" className="font-semibold underline underline-offset-4">
          {copy.allMarkets}
        </Link>
      </p>
    </PublicDoc>
  );
}
