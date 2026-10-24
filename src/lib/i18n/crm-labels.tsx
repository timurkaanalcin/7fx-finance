"use client";

import { useCallback } from "react";
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

  const i18n = useCallback((key: string, fallback?: string) => {
    const v = t(key);
    if (v === key) return fallback ?? key;
    return v;
  }, [t]);

  const code = useCallback((prefix: string, value: string | null | undefined) => {
    if (value == null || value === "") return "—";
    return i18n(`${prefix}.${value}`, value);
  }, [i18n]);

  const deskName = useCallback((
    input: { name?: string | null; code?: string | null } | string | null | undefined
  ) => {
    if (!input) return "—";
    const name = typeof input === "string" ? input : input.name || "";
    const rawCode = typeof input === "string" ? input : input.code || "";
    const alias = DESK_ALIAS[rawCode] || DESK_ALIAS[name];
    if (alias) {
      const labeled = i18n(`crm.deskName.${alias}`, "");
      if (labeled) return labeled;
    }
    return name || rawCode || "—";
  }, [i18n]);

  return { i18n, code, deskName, t, locale };
}
