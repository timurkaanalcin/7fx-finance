"use client";

import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/context";

type Props = {
  compact?: boolean;
  className?: string;
  /** light landing chrome vs dark terminal vs CRM white */
  tone?: "light" | "dark" | "crm";
};

/**
 * Public / terminal: an always-visible segmented control (no dropdown that opens downward).
 * CRM keeps its native <select> so the admin panel stays exactly as it was.
 */
export default function LanguageSwitcher({ compact, className = "", tone = "light" }: Props) {
  const { locale, setLocale, t } = useI18n();

  if (tone === "crm") {
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
          className="rounded-full border border-black/15 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#111111] outline-none focus:ring-1 focus:ring-[#111111]/25"
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

  const dark = tone === "dark";
  const shell = dark
    ? "border-[#2a2a2a] bg-[#0a0a0a]"
    : "border-[rgba(16,20,37,0.14)] bg-white";
  const idle = dark
    ? "text-slate-400 hover:text-white"
    : "text-[#5c657a] hover:text-[#111111]";
  const active = dark ? "bg-white text-black" : "bg-[#111111] text-white";
  const size = compact ? "h-7 min-w-[30px] px-1.5 text-[11px]" : "h-8 min-w-[36px] px-2 text-[12px]";

  return (
    <div
      role="radiogroup"
      aria-label={t("common.language")}
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border p-0.5 ${shell} ${className}`}
    >
      {LOCALES.map((code) => {
        const on = code === locale;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={on}
            lang={LOCALE_META[code].htmlLang}
            title={LOCALE_META[code].native}
            onClick={() => setLocale(code)}
            className={`inline-flex items-center justify-center rounded-full font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current ${size} ${
              on ? active : idle
            }`}
          >
            <span aria-hidden>{code.toUpperCase()}</span>
            <span className="sr-only">{LOCALE_META[code].native}</span>
          </button>
        );
      })}
    </div>
  );
}
