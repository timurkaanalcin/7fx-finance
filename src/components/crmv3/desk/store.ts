"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { crmv3Text, type CrmV3CopyKey } from "@/lib/crmv3/copy";
import { readJson, writeJson } from "@/lib/crmv3/bridge";

export type V3 = (key: CrmV3CopyKey) => string;

export function useV3(): V3 {
  const { locale } = useI18n();
  return useCallback((key: CrmV3CopyKey) => crmv3Text(locale, key), [locale]);
}

/** Browser-only state. Keys stay on the crmv3- prefix. */
export function useLocal<T>(key: string, fallback: T): [T, (value: T | ((prev: T) => T)) => void] {
  const fallbackRef = useRef(fallback);
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    setValue(readJson(key, fallbackRef.current));
  }, [key]);
  const write = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
      writeJson(key, resolved);
      return resolved;
    });
  }, [key]);
  return [value, write];
}

export function readLocal<T>(key: string, fallback: T): T {
  return readJson(key, fallback);
}

export function writeLocal(key: string, value: unknown) {
  writeJson(key, value);
}
