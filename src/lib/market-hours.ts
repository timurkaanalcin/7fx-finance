import type { AssetClass } from "./symbols";
import { getSymbol } from "./symbols";

export type MarketStatus = {
  open: boolean;
  class: AssetClass | "UNKNOWN";
  label: string;
  /** When true, server may reject new equity orders */
  blockOrdersWhenClosed: boolean;
};

function inIstanbulWeekdayHours(now: Date, openH: number, openM: number, closeH: number, closeM: number): boolean {
  // Europe/Istanbul ≈ UTC+3 (no DST since 2016)
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
  const ist = new Date(utc + 3 * 3600_000);
  const day = ist.getUTCDay(); // 0 Sun .. 6 Sat
  if (day === 0 || day === 6) return false;
  const mins = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  const open = openH * 60 + openM;
  const close = closeH * 60 + closeM;
  return mins >= open && mins < close;
}

function usEquityOpen(now: Date): boolean {
  // US/Eastern approx: UTC-5 standard / -4 DST — use simple EST/EDT via Intl
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value || "";
  if (weekday === "Sat" || weekday === "Sun") return false;
  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
  const mins = hour * 60 + minute;
  // Regular session 09:30–16:00 ET
  return mins >= 9 * 60 + 30 && mins < 16 * 60;
}

function forexOpen(now: Date): boolean {
  // Forex roughly Sun 22:00 UTC – Fri 22:00 UTC
  const day = now.getUTCDay();
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  if (day === 6) return false; // Saturday
  if (day === 5 && mins >= 22 * 60) return false; // Friday after 22:00 UTC
  if (day === 0 && mins < 22 * 60) return false; // Sunday before 22:00 UTC
  return true;
}

function commodityOpen(now: Date): boolean {
  // Gold/oil: similar to futures — treat like forex weekdays + Sunday evening
  return forexOpen(now);
}

function indexOpen(now: Date): boolean {
  // Cash indices — roughly US RTH for US30/NAS100; GER40 European hours
  return usEquityOpen(now) || inIstanbulWeekdayHours(now, 10, 0, 18, 30);
}

export function getMarketStatus(symbol: string, now = new Date()): MarketStatus {
  const def = getSymbol(symbol);
  if (!def) {
    return { open: true, class: "UNKNOWN", label: "Unknown", blockOrdersWhenClosed: false };
  }
  switch (def.class) {
    case "CRYPTO":
      return { open: true, class: "CRYPTO", label: "Open 24/7", blockOrdersWhenClosed: false };
    case "FX":
      return {
        open: forexOpen(now),
        class: "FX",
        label: forexOpen(now) ? "Forex open" : "Forex closed",
        blockOrdersWhenClosed: false,
      };
    case "COMMODITY":
      return {
        open: commodityOpen(now),
        class: "COMMODITY",
        label: commodityOpen(now) ? "Commodities open" : "Commodities closed",
        blockOrdersWhenClosed: false,
      };
    case "INDEX":
      return {
        open: indexOpen(now),
        class: "INDEX",
        label: indexOpen(now) ? "Indices open" : "Indices closed",
        blockOrdersWhenClosed: false,
      };
    case "STOCK": {
      const isBist = Boolean(def.yahoo?.endsWith(".IS")) || def.flag === "🇹🇷";
      const open = isBist
        ? inIstanbulWeekdayHours(now, 10, 0, 18, 0)
        : usEquityOpen(now);
      return {
        open,
        class: "STOCK",
        label: open ? (isBist ? "BIST open" : "US stocks open") : (isBist ? "BIST closed" : "US stocks closed"),
        blockOrdersWhenClosed: true,
      };
    }
    default:
      return { open: true, class: def.class, label: "Open", blockOrdersWhenClosed: false };
  }
}
