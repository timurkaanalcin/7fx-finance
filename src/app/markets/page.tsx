import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import PublicDoc from "@/components/public/PublicDoc";
import { marketingMetadata } from "@/lib/seo";
import { ASSET_PAGES } from "@/lib/public-pages";

export async function generateMetadata(): Promise<Metadata> {
  const h = headers();
  return marketingMetadata(h.get("x-forwarded-host") || h.get("host"), "/markets");
}

export default function MarketsPage() {
  return (
    <PublicDoc
      title="Markets"
      lede="7FX lists crypto, forex, commodities, indices, and stocks in one terminal. The names below are the built-in catalog. The terminal can also show symbols added by the desk."
    >
      <p>
        Each asset class has its own session rule. Stock orders are rejected when that stock&apos;s session is closed.
        Crypto is treated as open continuously. Forex, commodity, and index orders are not rejected only because the
        session label says closed.
      </p>
      <ul className="list-disc space-y-2 pl-5">
        {ASSET_PAGES.map((page) => (
          <li key={page.path}>
            <Link href={page.path} className="font-semibold underline underline-offset-4">
              {page.title}
            </Link>
            <span className="text-[#3f4248]"> — {page.lede}</span>
          </li>
        ))}
      </ul>
      <p>
        <Link href="/platform" className="font-semibold underline underline-offset-4">
          Platform overview
        </Link>
      </p>
    </PublicDoc>
  );
}
