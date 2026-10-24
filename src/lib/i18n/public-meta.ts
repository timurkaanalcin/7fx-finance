import type { Metadata } from "next";
import { cookies } from "next/headers";
import { en } from "./dictionaries/en";
import { publicLocaleFromCookie, type Locale } from "./locales";
import type { Dict } from "./types";

async function dictFor(locale: Locale): Promise<Dict> {
  if (locale === "ru") return (await import("./dictionaries/ru")).ru;
  if (locale === "ar") return (await import("./dictionaries/ar")).ar;
  if (locale === "tr") return (await import("./dictionaries/tr")).tr;
  if (locale === "de") return (await import("./dictionaries/de")).de;
  return en;
}

/** Document title and description for public auth pages. Missing or unknown fx_lang stays English. */
export async function publicAuthMetadata(titleKey: string, descriptionKey: string): Promise<Metadata> {
  const locale = publicLocaleFromCookie(cookies().get("fx_lang")?.value);
  const dict = await dictFor(locale);
  return {
    title: dict[titleKey] ?? en[titleKey] ?? titleKey,
    description: dict[descriptionKey] ?? en[descriptionKey] ?? descriptionKey,
    robots: { index: false, follow: false },
  };
}
