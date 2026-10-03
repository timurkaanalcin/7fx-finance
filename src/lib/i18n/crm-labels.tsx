"use client";

import { useI18n } from "./context";

const DESK_ALIAS: Record<string, string> = {
  Retention: "RETENTION",
  RETENTION: "RETENTION",
  Sale: "SALE",
  SALE: "SALE",
  Satış: "SALE",
  TR: "TR",
};

export function useCrmLabels() {
  const { t, locale } = useI18n();

  function i18n(key: string, fallback?: string) {
    const v = t(key);
    if (v === key) return fallback ?? key;
    return v;
  }

  function code(prefix: string, value: string | null | undefined) {
    if (value == null || value === "") return "—";
    return i18n(`${prefix}.${value}`, value);
  }

  function deskName(
    input: { name?: string | null; code?: string | null } | string | null | undefined
  ) {
    if (!input) return "—";
    const name = typeof input === "string" ? input : input.name || "";
    const rawCode = typeof input === "string" ? input : input.code || "";
    const alias = DESK_ALIAS[rawCode] || DESK_ALIAS[name];
    if (alias) {
      const labeled = i18n(`crm.deskName.${alias}`, "");
      if (labeled) return labeled;
    }
    return name || rawCode || "—";
  }

  return { i18n, code, deskName, t, locale };
}
