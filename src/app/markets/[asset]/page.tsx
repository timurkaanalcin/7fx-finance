import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import PublicDoc from "@/components/public/PublicDoc";
import { marketingMetadata } from "@/lib/seo";
import { ASSET_PAGES, assetBySlug } from "@/lib/public-pages";
import { BUILTIN_SYMBOLS } from "@/lib/symbols";

type Params = { params: { asset: string } };

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
  const symbols = BUILTIN_SYMBOLS.filter((row) => row.class === page.assetClass);
  return (
    <PublicDoc title={page.title} lede={page.lede}>
      {page.session.map((line) => (
        <p key={line}>{line}</p>
      ))}
      <h2 className="text-xl font-semibold">Built-in symbols</h2>
      <p>These names ship with 7FX. A desk can add more. This page does not publish live prices.</p>
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
          All markets
        </Link>
      </p>
    </PublicDoc>
  );
}
