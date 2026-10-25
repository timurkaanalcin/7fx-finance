import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import PublicDoc from "@/components/public/PublicDoc";
import MarketsLiveTable, { type QuoteRow } from "@/components/public/MarketsLiveTable";
import { publicLocaleFromCookie } from "@/lib/i18n/locales";
import { publicBundle } from "@/lib/public-doc-copy";
import { ASSET_PAGES } from "@/lib/public-pages";
import { marketingMetadata } from "@/lib/seo";
import { BUILTIN_SYMBOLS } from "@/lib/symbols";

const QUOTE_SAMPLE: { symbol: string; slug: "forex" | "commodities" | "indices" | "stocks" | "crypto" }[] = [
  { symbol: "EURUSD", slug: "forex" },
  { symbol: "GBPUSD", slug: "forex" },
  { symbol: "USDJPY", slug: "forex" },
  { symbol: "XAUUSD", slug: "commodities" },
  { symbol: "UKOIL", slug: "commodities" },
  { symbol: "US30", slug: "indices" },
  { symbol: "NAS100", slug: "indices" },
  { symbol: "AAPL", slug: "stocks" },
  { symbol: "NVDA", slug: "stocks" },
  { symbol: "XOM", slug: "stocks" },
  { symbol: "BTCUSD", slug: "crypto" },
  { symbol: "ETHUSD", slug: "crypto" },
];

function quoteRows(labels: Record<(typeof QUOTE_SAMPLE)[number]["slug"], string>): QuoteRow[] {
  return QUOTE_SAMPLE.map((item) => {
    const def = BUILTIN_SYMBOLS.find((row) => row.symbol === item.symbol);
    return {
      symbol: item.symbol,
      name: def?.name ?? item.symbol,
      market: labels[item.slug],
      href: `/markets/${item.slug}`,
      digits: def?.digits ?? 2,
    };
  });
}

function localeFromCookie() {
  return publicLocaleFromCookie(cookies().get("fx_lang")?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  const h = headers();
  return marketingMetadata(h.get("x-forwarded-host") || h.get("host"), "/markets");
}

export default function MarketsPage() {
  const copy = publicBundle(localeFromCookie());
  const labels = {
    forex: copy.assets.forex.title,
    commodities: copy.assets.commodities.title,
    indices: copy.assets.indices.title,
    stocks: copy.assets.stocks.title,
    crypto: copy.assets.crypto.title,
  };
  return (
    <PublicDoc title={copy.markets.title} lede={copy.markets.lede} nav={copy.nav}>
      <p>{copy.markets.intro}</p>
      <MarketsLiveTable rows={quoteRows(labels)} />
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
