import { cookies, headers } from "next/headers";
import { LOCALES, LOCALE_COOKIE, PUBLIC_DEFAULT_LOCALE, isLocale, type Locale } from "./locales";
import { translate } from "./dictionaries";

/**
 * Locale for public pages, resolved on the server so the first paint is already in the
 * visitor's language (no English→Turkish flash): fx_lang cookie → Accept-Language → default.
 */
export function getPublicLocale(): Locale {
  try {
    const fromCookie = cookies().get(LOCALE_COOKIE.public)?.value;
    if (isLocale(fromCookie)) return fromCookie;
    const accept = headers().get("accept-language") || "";
    const ranked = accept
      .split(",")
      .map((part) => {
        const [tag, ...params] = part.trim().split(";");
        const q = params.find((p) => p.trim().startsWith("q="));
        return { base: tag.toLowerCase().split("-")[0], q: q ? Number(q.split("=")[1]) || 0 : 1 };
      })
      .filter((x) => x.base)
      .sort((a, b) => b.q - a.q);
    for (const { base } of ranked) {
      if ((LOCALES as readonly string[]).includes(base)) return base as Locale;
    }
  } catch {
    /* outside a request scope (build) */
  }
  return PUBLIC_DEFAULT_LOCALE;
}

export function serverT(locale: Locale) {
  return (key: string) => translate(locale, key);
}
