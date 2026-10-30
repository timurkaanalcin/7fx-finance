import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import LicensesChrome from "@/components/licenses/LicensesChrome";
import LicenseSheet from "@/components/licenses/LicenseSheet";
import { getPublicLicense } from "@/lib/license-public";
import { publicLocaleFromCookie } from "@/lib/i18n/locales";
import { publicBundle } from "@/lib/public-doc-copy";
import { privateEnglishMetadata } from "@/lib/seo";

type Params = { params: { id: string } };

function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 120);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const row = await getPublicLicense(params.id);
  const title = row ? `${oneLine(row.regulator)} · ${oneLine(row.number)}` : "License record";
  return privateEnglishMetadata(
    `${title} · 7FX`,
    "A license record published on 7FX. Fields that are not stored are left blank.",
    `/licenses/${params.id}`
  );
}

export default async function LicenseDocumentPage({ params }: Params) {
  const row = await getPublicLicense(params.id);
  if (!row) notFound();
  const locale = publicLocaleFromCookie(cookies().get("fx_lang")?.value);
  const bundle = publicBundle(locale);
  const signedIn = Boolean(cookies().get("7fx_session")?.value || cookies().get("deskflow_session")?.value);
  return (
    <LicensesChrome nav={bundle.nav} copy={bundle.licenses} signedIn={signedIn} mode="full">
      <LicenseSheet copy={bundle.licenses} row={row} mode="full" locale={locale} />
    </LicensesChrome>
  );
}
