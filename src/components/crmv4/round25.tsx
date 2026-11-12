"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  monthSpan,
  monthStamp,
  mtdByCurrency,
  mtdFtd,
  mtdTraders,
  paceOf,
  progressPct,
  pushItem,
  readTargets,
  runRate,
  stillToGo,
  type CashRow,
  type MonthTargets,
  type ViewItem,
  type ViewKind,
} from "@/lib/crmv4/round25";
import { crmv4Href } from "@/lib/crmv4/sections";
import { money, useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const TARGET_KEY = "crmv4-month-targets";
const HISTORY_KEY = "crmv4-view-history";
const EMPTY: MonthTargets = { ftd: 0, traders: 0, deposits: {} };

const KIND_LABEL: Record<ViewKind, CrmV4CopyKey> = {
  customer: "kindCustomer",
  ticket: "kindTicket",
  finance: "kindFinance",
};

export function rememberView(item: Omit<ViewItem, "at">) {
  const next = pushItem(readJson<ViewItem[]>(HISTORY_KEY, []), item, new Date().toISOString());
  writeJson(HISTORY_KEY, next);
  window.dispatchEvent(new Event("crmv4:view-history"));
}

export function clearViews() {
  writeJson(HISTORY_KEY, []);
  window.dispatchEvent(new Event("crmv4:view-history"));
}

function useHistory() {
  const [items, setItems] = useState<ViewItem[]>([]);
  useEffect(() => {
    const read = () => setItems(readJson<ViewItem[]>(HISTORY_KEY, []));
    read();
    window.addEventListener("crmv4:view-history", read);
    return () => window.removeEventListener("crmv4:view-history", read);
  }, []);
  return items;
}

export function TopTrail({ base, view, id, heading, openId, trail, v4 }: {
  base: string;
  view: string;
  id: string;
  heading: string;
  openId: string;
  trail: string[];
  v4: V4;
}) {
  const items = useHistory();
  const recordId = id || openId;
  const current = items.find((item) => item.id === recordId);
  const section = view === "overview" ? "" : view;
  const prev = trail.length > 1 ? trail[trail.length - 2] : "";
  return (
    <div className="c4-trail-luxe">
      <nav className="c4-crumbs" aria-label={v4("crumbs")}>
        <button type="button" className="c4-btn" disabled={!prev} onClick={() => { if (prev) window.location.assign(prev); }}>{v4("backStack")}</button>
        <Link href={crmv4Href(base, "")} aria-current={view === "overview" && !recordId ? "page" : undefined}>{v4("v4mark")}</Link>
        {view !== "overview" && (
          <>
            <span aria-hidden="true">/</span>
            {recordId ? <Link href={crmv4Href(base, section)}>{heading}</Link> : <span aria-current="page">{heading}</span>}
          </>
        )}
        {recordId && current && (
          <>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{current.title}</span>
          </>
        )}
      </nav>
      <div className="c4-recent-row" aria-label={v4("recentViews")}>
        <span className="c4-muted">{v4("recentViews")}</span>
        {items.map((item) => (
          <Link key={`${item.kind}-${item.id}`} href={item.href} className="c4-chip" data-kind={item.kind}>
            {v4(KIND_LABEL[item.kind] || "kindCustomer")} {item.title}
          </Link>
        ))}
        {!items.length && <span className="c4-muted">{v4("recentEmpty")}</span>}
        {items.length > 0 && <button type="button" className="c4-btn" onClick={clearViews}>{v4("recentClear")}</button>}
      </div>
      <p className="c4-muted c4-trail-note">{v4("recentHint")}</p>
    </div>
  );
}

function paceText(pace: ReturnType<typeof paceOf>, v4: V4) {
  if (pace === "ahead") return v4("goalAhead");
  if (pace === "behind") return v4("goalBehind");
  if (pace === "even") return v4("goalEven");
  return v4("goalNoTarget");
}

function gapText(gap: number | null, shown: string, v4: V4) {
  if (gap == null) return v4("goalNoTarget");
  if (gap > 0) return `${v4("goalLeft")} ${shown}`;
  if (gap < 0) return v4("goalPast");
  return v4("goalMet");
}

function Metric({ title, hint, actual, shown, target, estimate, gap, gapShown, pace, v4, onTarget }: {
  title: string;
  hint: string;
  actual: number;
  shown: string;
  target: number;
  estimate: string;
  gap: number | null;
  gapShown: string;
  pace: ReturnType<typeof paceOf>;
  v4: V4;
  onTarget: (value: number) => void;
}) {
  const pct = progressPct(actual, target);
  const width = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  return (
    <article className="c4-goal-card" data-pace={pace}>
      <h3 className="c4-title">{title}</h3>
      {hint ? <p className="c4-muted">{hint}</p> : null}
      <p><span className="c4-muted">{v4("goalMtd")}</span> <strong>{shown}</strong></p>
      <label className="c4-lab"><span>{v4("goalTarget")}</span>
        <input className="c4-field" type="number" min={0} aria-label={`${v4("goalTarget")} ${title}`} value={target || ""} onChange={(event) => onTarget(Math.max(0, Number(event.target.value) || 0))} />
      </label>
      <p><span className="c4-muted">{v4("goalEstimate")}</span> <strong>{estimate}</strong></p>
      <p>{gapText(gap, gapShown, v4)}</p>
      {pace !== "none" && <p className="c4-muted">{paceText(pace, v4)}</p>}
      <div className="c4-onboard-meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={width} aria-label={title}>
        <span style={{ width: `${width}%` }} />
      </div>
      {pct != null && <p className="c4-muted">{pct}%</p>}
    </article>
  );
}

export function GoalsPage({ v4, locale }: { v4: V4; locale: string }) {
  const deposits = useJson<{ requests?: CashRow[] }>("/api/admin/deposits?take=80");
  const book = useJson<{ positions?: { userId?: string | null; openedAt?: string | null }[] }>("/api/admin/positions?take=80");
  const [targets, setTargets] = useState<MonthTargets>(EMPTY);
  useEffect(() => { setTargets(readTargets(readJson(TARGET_KEY, EMPTY))); }, []);
  const now = new Date();
  const month = monthStamp(now);
  const span = monthSpan(now);
  const rows = deposits.data?.requests || [];
  const byCurrency = mtdByCurrency(rows, month);
  const ftd = mtdFtd(rows, month);
  const traders = mtdTraders(book.data?.positions || [], month);
  const currencies = Array.from(new Set(["USD", "TRY", ...byCurrency.map((row) => row.currency)]));
  function save(next: MonthTargets) {
    setTargets(next);
    writeJson(TARGET_KEY, next);
  }
  const ftdRate = runRate(ftd, span.day, span.days);
  const traderRate = runRate(traders, span.day, span.days);
  return (
    <section className="c4-goals-luxe c4-goals-night c4-goals-gallery c4-goals-refectory" aria-label={v4("goalsTitle")} data-goals="1" data-desk="refectory">
      <header className="c4-goals-mast">
        <p className="c4-goals-plate" data-logo="mono">7FX</p>
        <div>
          <p className="c4-goals-kicker">{v4("goalDay")}</p>
          <h2 className="c4-title">{v4("goalsTitle")}</h2>
        </div>
        <ol className="c4-goals-gallery-index" aria-label={v4("goalsTitle")}>
          <li data-pace="ahead">{v4("goalAhead")}</li>
          <li data-pace="even">{v4("goalEven")}</li>
          <li data-pace="behind">{v4("goalBehind")}</li>
        </ol>
        <p className="c4-goal-month"><time dateTime={month}>{month}</time> · {span.day}/{span.days}</p>
      </header>
      <p className="c4-muted c4-goals-hint">{v4("goalsHint")}</p>
      <div className="c4-goal-grid">
        <Metric
          title={v4("goalFtd")}
          hint={v4("goalFtdHint")}
          actual={ftd}
          shown={String(ftd)}
          target={targets.ftd}
          estimate={ftdRate == null ? "—" : String(ftdRate)}
          gap={stillToGo(ftd, targets.ftd)}
          gapShown={String(Math.abs(stillToGo(ftd, targets.ftd) || 0))}
          pace={paceOf(ftd, targets.ftd, span.day, span.days)}
          v4={v4}
          onTarget={(value) => save({ ...targets, ftd: value })}
        />
        <Metric
          title={v4("goalTraders")}
          hint={v4("goalTraderHint")}
          actual={traders}
          shown={String(traders)}
          target={targets.traders}
          estimate={traderRate == null ? "—" : String(traderRate)}
          gap={stillToGo(traders, targets.traders)}
          gapShown={String(Math.abs(stillToGo(traders, targets.traders) || 0))}
          pace={paceOf(traders, targets.traders, span.day, span.days)}
          v4={v4}
          onTarget={(value) => save({ ...targets, traders: value })}
        />
      </div>
      <h3 className="c4-title">{v4("goalDeposits")}</h3>
      <p className="c4-muted c4-goals-hint">{v4("goalDepositHint")}</p>
      <div className="c4-goal-grid" data-deposits="">
        {currencies.map((currency) => {
          const actual = byCurrency.find((row) => row.currency === currency)?.amount || 0;
          const target = targets.deposits[currency] || 0;
          const rate = runRate(actual, span.day, span.days);
          const gap = stillToGo(actual, target);
          return (
            <Metric
              key={currency}
              title={currency}
              hint=""
              actual={actual}
              shown={money(actual, currency, locale)}
              target={target}
              estimate={rate == null ? "—" : money(rate, currency, locale)}
              gap={gap}
              gapShown={money(Math.abs(gap || 0), currency, locale)}
              pace={paceOf(actual, target, span.day, span.days)}
              v4={v4}
              onTarget={(value) => save({ ...targets, deposits: { ...targets.deposits, [currency]: value } })}
            />
          );
        })}
      </div>
      <button type="button" className="c4-btn" onClick={() => save(EMPTY)}>{v4("goalReset")}</button>
    </section>
  );
}
