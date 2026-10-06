"use client";

import { LOCALES, type Locale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/context";

type Props = {
  compact?: boolean;
  className?: string;
  /** light landing chrome vs dark terminal vs CRM white */
  tone?: "light" | "dark" | "crm";
};

export default function LanguageSwitcher({ compact, className = "", tone = "light" }: Props) {
  const { locale, setLocale, t } = useI18n();

  const shell =
    tone === "dark"
      ? "border-[#2a2a2a] bg-[#0a0a0a] text-slate-200"
      : tone === "crm"
        ? "border-black/15 bg-white text-[#111111]"
        : "border-[rgba(16,20,37,0.14)] bg-white text-[#111111]";

  return (
    <label className={`inline-flex items-center gap-1.5 ${className}`}>
      {!compact && (
        <span className="sr-only sm:not-sr-only sm:text-[11px] sm:font-medium sm:text-[#5c657a]">
          {t("common.language")}
        </span>
      )}
      <select
        aria-label={t("common.language")}
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className={`rounded-full border px-2.5 py-1.5 text-[12px] font-semibold outline-none focus:ring-1 focus:ring-[#111111]/25 ${shell}`}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {code.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
