import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import LicensesChrome from "@/components/licenses/LicensesChrome";
import LicenseSheet from "@/components/licenses/LicenseSheet";
import { listPublicLicenses } from "@/lib/license-public";
import { publicLocaleFromCookie } from "@/lib/i18n/locales";
import { publicBundle } from "@/lib/public-doc-copy";
import { marketingMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const h = headers();
  return marketingMetadata(h.get("x-forwarded-host") || h.get("host"), "/licenses");
}

export default async function LicensesPage() {
  const locale = publicLocaleFromCookie(cookies().get("fx_lang")?.value);
  const bundle = publicBundle(locale);
  const signedIn = Boolean(cookies().get("7fx_session")?.value || cookies().get("deskflow_session")?.value);
  const rows = await listPublicLicenses();
  return (
    <LicensesChrome nav={bundle.nav} copy={bundle.licenses} signedIn={signedIn} mode="list">
      {rows.length === 0 ? (
        <LicenseSheet copy={bundle.licenses} mode="list" />
      ) : (
        rows.map((row) => <LicenseSheet key={row.id} copy={bundle.licenses} row={row} mode="list" />)
      )}
    </LicensesChrome>
  );
}
