"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

const EXAMPLE = `{
  "token": "PARTNER_TOKEN",
  "firstName": "Ada",
  "lastName": "Yilmaz",
  "email": "ada@example.com",
  "phone": "+905551112233",
  "source": "google",
  "stream": "Search TR",
  "referrer": "https://l.facebook.com/",
  "landingUrl": "https://example.com/landing?utm_source=google&fbclid=IwAR",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "brand",
  "fbclid": "IwAR",
  "gclid": "",
  "ttclid": "",
  "msclkid": "",
  "userAgent": "Mozilla/5.0 (iPhone) Instagram 320.0.0.0 FBAN/FBIOS",
  "ip": "203.0.113.10"
}`;

const RESPONSE = `{
  "ok": true,
  "id": "…",
  "accountLoginId": "……………………",
  "password": "…"
}`;

export default function AffiliateDocsPage() {
  const { t } = useI18n();
  return (
    <div className="max-w-3xl">
      <div className="mb-2 text-[11px]">
        <Link href="/izcrm/analytics/affiliates/accounts" className="rounded border border-neutral-300 px-2 py-1">← {t("crm.aff.backAccounts")}</Link>
      </div>
      <h1 className="mb-1 text-lg font-semibold">{t("crm.aff.docsTitle")}</h1>
      <p className="mb-4 text-[11px] leading-relaxed text-neutral-500">{t("crm.aff.docsIntro")}</p>

      <h2 className="mb-1 text-[13px] font-semibold">POST /api/leads/intake</h2>
      <p className="mb-2 text-[11px] leading-relaxed text-neutral-600">{t("crm.aff.docsAuth")}</p>
      <p className="mb-2 text-[11px] leading-relaxed text-neutral-600">{t("crm.aff.docsSignals")}</p>
      <p className="mb-2 text-[11px] leading-relaxed text-neutral-600">{t("crm.aff.docsRules")}</p>
      <p className="mb-3 text-[11px] leading-relaxed text-neutral-600">{t("crm.aff.passwordOnce")}</p>

      <div className="mb-1 text-[11px] font-semibold text-neutral-500">{t("crm.aff.example")}</div>
      <pre className="mb-4 overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 font-mono text-[10px] leading-relaxed">{EXAMPLE}</pre>
      <pre className="mb-4 overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 font-mono text-[10px] leading-relaxed">{RESPONSE}</pre>

      <h2 className="mb-1 text-[13px] font-semibold">{t("crm.aff.docsLanding")}</h2>
      <p className="mb-3 text-[11px] leading-relaxed text-neutral-600">{t("crm.aff.docsLandingBody")}</p>
      <h2 className="mb-1 text-[13px] font-semibold">{t("crm.aff.docsImport")}</h2>
      <p className="text-[11px] leading-relaxed text-neutral-600">{t("crm.aff.docsImportBody")}</p>
    </div>
  );
}
