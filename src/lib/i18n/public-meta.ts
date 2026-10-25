import type { Metadata } from "next";
import { en } from "./dictionaries/en";
import { privateEnglishMetadata } from "@/lib/seo";

const PATH_FOR_TITLE: Record<string, string> = {
  "auth.meta.loginTitle": "/login",
  "auth.meta.registerTitle": "/register",
};

/**
 * Document title, description, and Open Graph for public auth pages.
 * The visible form still follows fx_lang. The document stays English.
 */
export function publicAuthMetadata(titleKey: string, descriptionKey: string): Metadata {
  const title = en[titleKey] ?? titleKey;
  const description = en[descriptionKey] ?? descriptionKey;
  return privateEnglishMetadata(title, description, PATH_FOR_TITLE[titleKey] || "/login");
}
