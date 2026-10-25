import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import PublicDoc from "@/components/public/PublicDoc";
import { publicLocaleFromCookie } from "@/lib/i18n/locales";
import { publicBundle } from "@/lib/public-doc-copy";
import { marketingMetadata } from "@/lib/seo";

function localeFromCookie() {
  return publicLocaleFromCookie(cookies().get("fx_lang")?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  const h = headers();
  return marketingMetadata(h.get("x-forwarded-host") || h.get("host"), "/platform");
}

export default function PlatformPage() {
  const copy = publicBundle(localeFromCookie());
  const page = copy.platform;
  return (
    <PublicDoc title={page.title} lede={page.lede} nav={copy.nav}>
      <h2 className="text-xl font-semibold">{page.includes}</h2>
      <ul className="list-disc space-y-2 pl-5">
        {page.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h2 className="text-xl font-semibold">{page.language}</h2>
      <p>
        {page.languageBody.split("fx_lang")[0]}
        <span className="font-semibold">fx_lang</span>
        {page.languageBody.split("fx_lang")[1] || ""}
      </p>
      <h2 className="text-xl font-semibold">{page.phone}</h2>
      <p>
        {page.phoneBefore}{" "}
        <Link href="/ios" className="font-semibold underline underline-offset-4">
          {page.phoneLink}
        </Link>
        .
      </p>
      <h2 className="text-xl font-semibold">{page.money}</h2>
      <p>{page.moneyBody}</p>
      <p>
        <Link href="/markets" className="font-semibold underline underline-offset-4">
          {page.marketsLink}
        </Link>
      </p>
    </PublicDoc>
  );
}
