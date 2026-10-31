"use client";

import { useEffect, useState } from "react";
import {
  byAge,
  currencyMix,
  inBand,
  largestPendingId,
  methodName,
  pendingCount,
  presetRange,
  queueAgeHours,
  sameCustomer,
  sumAmounts,
  withdrawalFlags,
  type MoneyLite,
} from "@/lib/crmv3/bridge";
import { useLocal, useV3, writeLocal, readLocal } from "./store";

const LOOK_KEY = "crmv3-fin-look";
const CHECK_KEY = "crmv3-fin-checks";
const REASON_KEY = "crmv3-fin-reason";

export type FinanceRow = MoneyLite & { method?: unknown; user?: { email?: string | null; name?: string | null; createdAt?: string | null } | null; kycAt?: string | null };

export function readLastReason(): string {
  return readLocal(REASON_KEY, "");
}

export function rememberReason(value: string) {
  writeLocal(REASON_KEY, value);
}

export function shapeQueue(rows: FinanceRow[], oldest: boolean, band: "" | "small" | "large") {
  return byAge(rows, oldest).filter((row) => inBand(Number(row.amount) || 0, band));
}

export function FinanceChrome({ rows, band, oldest, onBand, onOldest }: {
  rows: FinanceRow[];
  band: "" | "small" | "large";
  oldest: boolean;
  onBand: (band: "" | "small" | "large") => void;
  onOldest: () => void;
}) {
  const v3 = useV3();
  const open = rows.filter((row) => String(row.status || "").toUpperCase() === "PENDING");
  const mix = currencyMix(open);
  const [preset, setPreset] = useState<"" | "today" | "7" | "30" | "month">("");
  const range = preset ? presetRange(preset) : null;
  const compared = range ? sumAmounts(rows.map((row) => ({ amount: Number(row.amount) || 0, createdAt: row.createdAt })), range.from, range.to) : null;
  return (
    <section aria-label={v3("queuePending")}>
      <div className="c3-kpis">
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("queuePending")}</p><p className="c3-kpi-value">{pendingCount(rows)}</p></div>
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("pageTotals")}</p><p className="c3-kpi-value">{mix.map((row) => `${row.currency} ${row.total}`).join(" · ") || "—"}</p></div>
      </div>
      <p className="c3-muted c3-pad">{v3("displayOnly")} · {v3("pageOnly")}</p>
      <div className="c3-tools">
        <button type="button" className="c3-chip" data-on={oldest ? "1" : "0"} onClick={onOldest}>{v3("oldestFirst")}</button>
        <button type="button" className="c3-chip" data-on={band === "" ? "1" : "0"} onClick={() => onBand("")}>{v3("bandAll")}</button>
        <button type="button" className="c3-chip" data-on={band === "small" ? "1" : "0"} onClick={() => onBand("small")}>{v3("bandSmall")}</button>
        <button type="button" className="c3-chip" data-on={band === "large" ? "1" : "0"} onClick={() => onBand("large")}>{v3("bandLarge")}</button>
        {(["today", "7", "30", "month"] as const).map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={preset === item ? "1" : "0"} onClick={() => setPreset(preset === item ? "" : item)}>
            {v3(item === "today" ? "rangeToday" : item === "7" ? "range7" : item === "30" ? "range30" : "rangeMonth")}
          </button>
        ))}
        <button type="button" className="c3-btn" onClick={() => window.print()}>{v3("printQueue")}</button>
      </div>
      <div className="c3-tools" aria-label={v3("currencyWord")}>
        {mix.map((row) => <span key={row.currency} className="c3-chip" data-on="1">{row.currency} {row.count}</span>)}
      </div>
      {compared != null && <p className="c3-muted c3-pad">{v3("compareWord")} {range?.from} – {range?.to}: {compared}</p>}
    </section>
  );
}

export function useSecondLook() {
  const [ids, setIds] = useLocal<string[]>(LOOK_KEY, []);
  function toggle(id: string) {
    setIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }
  return { ids, toggle };
}

export function ReviewChecks({ id }: { id: string }) {
  const v3 = useV3();
  const [checks, setChecks] = useState({ amount: false, name: false, method: false });
  useEffect(() => {
    const all = readLocal<Record<string, { amount?: boolean; name?: boolean; method?: boolean }>>(CHECK_KEY, {});
    const row = all[id] || {};
    setChecks({ amount: Boolean(row.amount), name: Boolean(row.name), method: Boolean(row.method) });
  }, [id]);
  function set(key: "amount" | "name" | "method", on: boolean) {
    const next = { ...checks, [key]: on };
    setChecks(next);
    const all = readLocal<Record<string, typeof next>>(CHECK_KEY, {});
    all[id] = next;
    writeLocal(CHECK_KEY, all);
  }
  return (
    <div className="c3-row" aria-label={v3("reviewChecks")}>
      <label className="c3-chip" data-on={checks.amount ? "1" : "0"}><input type="checkbox" checked={checks.amount} onChange={(event) => set("amount", event.target.checked)} /> {v3("checkAmount")}</label>
      <label className="c3-chip" data-on={checks.name ? "1" : "0"}><input type="checkbox" checked={checks.name} onChange={(event) => set("name", event.target.checked)} /> {v3("checkName")}</label>
      <label className="c3-chip" data-on={checks.method ? "1" : "0"}><input type="checkbox" checked={checks.method} onChange={(event) => set("method", event.target.checked)} /> {v3("checkMethod")}</label>
    </div>
  );
}

export function queueMarks(rows: FinanceRow[]) {
  return { dupes: sameCustomer(rows), largest: largestPendingId(rows) };
}

export function rowAge(row: FinanceRow): number | null {
  return queueAgeHours(row.createdAt);
}

export function rowFlags(row: FinanceRow): ("new" | "kyc")[] {
  return withdrawalFlags({ createdAt: row.user?.createdAt || row.createdAt, kycAt: row.kycAt });
}

export { methodName };
