"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { isLocale, LOCALES, type Locale } from "@/lib/i18n/locales";

/** Language control for server-rendered public pages. Writes fx_lang, then refreshes the document. */
export default function PublicLanguageMenu({ label }: { label: string }) {
  const { locale, setLocale } = useI18n();
  const router = useRouter();

  return (
    <label className="inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={locale}
        className="min-h-11 rounded-full border border-black/15 bg-white px-3 text-sm font-semibold text-[#15161a]"
        onChange={(e) => {
          const next = e.target.value;
          if (!isLocale(next) || next === locale) return;
          const picked = next as Locale;
          try {
            localStorage.setItem("fx_lang", picked);
          } catch {
            /* ignore */
          }
          document.cookie = `fx_lang=${picked};path=/;max-age=31536000;samesite=lax`;
          setLocale(picked);
          router.refresh();
        }}
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
