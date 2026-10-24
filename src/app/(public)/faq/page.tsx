import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import PublicDoc from "@/components/public/PublicDoc";
import { publicLocaleFromCookie } from "@/lib/i18n/locales";
import { localizeMarketingMeta, metaFor, publicBundle } from "@/lib/public-doc-copy";
import { marketingMetadata } from "@/lib/seo";

function localeFromCookie() {
  return publicLocaleFromCookie(cookies().get("fx_lang")?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  const h = headers();
  const locale = localeFromCookie();
  const copy = metaFor(locale, "/faq");
  return localizeMarketingMeta(
    marketingMetadata(h.get("x-forwarded-host") || h.get("host"), "/faq"),
    locale,
    copy.title,
    copy.description
  );
}

export default function FaqPage() {
  const copy = publicBundle(localeFromCookie());
  return (
    <PublicDoc title={copy.faq.title} lede={copy.faq.lede} nav={copy.nav}>
      {copy.faq.items.map((item) => (
        <section key={item.q}>
          <h2 className="text-xl font-semibold">{item.q}</h2>
          <p className="mt-2">{item.a}</p>
        </section>
      ))}
      <p>
        <Link href="/markets" className="font-semibold underline underline-offset-4">
          {copy.faq.markets}
        </Link>
        {" · "}
        <Link href="/platform" className="font-semibold underline underline-offset-4">
          {copy.faq.platform}
        </Link>
        {" · "}
        <Link href="/register" className="font-semibold underline underline-offset-4">
          {copy.faq.register}
        </Link>
      </p>
    </PublicDoc>
  );
}
