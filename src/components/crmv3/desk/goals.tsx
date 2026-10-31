"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/goals";
import { crmv3Href } from "@/lib/crmv3/sections";
import { money, useJson } from "../kit";
import { useV3 } from "./store";

const TARGET_KEY = "crmv3-month-targets";
const HISTORY_KEY = "crmv3-view-history";
const EMPTY: MonthTargets = { ftd: 0, traders: 0, deposits: {} };

const KIND_LABEL = {
  customer: "kindCustomer",
  ticket: "kindTicket",
  finance: "kindFinance",
} as const;

export function rememberView(item: Omit<ViewItem, "at">) {
  const next = pushItem(readJson<ViewItem[]>(HISTORY_KEY, []), item, new Date().toISOString());
  writeJson(HISTORY_KEY, next);
  window.dispatchEvent(new Event("crmv3:view-history"));
}

export function clearViews() {
  writeJson(HISTORY_KEY, []);
  window.dispatchEvent(new Event("crmv3:view-history"));
}

function useHistory() {
  const [items, setItems] = useState<ViewItem[]>([]);
  useEffect(() => {
    const read = () => setItems(readJson<ViewItem[]>(HISTORY_KEY, []));
    read();
    window.addEventListener("crmv3:view-history", read);
    return () => window.removeEventListener("crmv3:view-history", read);
  }, []);
  return items;
}

export function TopTrail({ base, view, id, heading, openId, trail }: {
  base: string;
  view: string;
  id: string;
  heading: string;
  openId: string;
  trail: string[];
}) {
  const v3 = useV3();
  const items = useHistory();
  const recordId = id || openId;
  const current = items.find((item) => item.id === recordId);
  const section = view === "overview" ? "" : view;
  const prev = trail.length > 1 ? trail[trail.length - 2] : "";
  return (
    <div className="c3-trail">
      <nav className="c3-crumbs" aria-label={v3("crumbs")}>
        <button type="button" className="c3-btn" disabled={!prev} onClick={() => { if (prev) window.location.assign(prev); }}>{v3("backStack")}</button>
        <Link href={crmv3Href(base, "")} aria-current={view === "overview" && !recordId ? "page" : undefined}>{v3("v3mark")}</Link>
        {view !== "overview" && (
          <>
            <span aria-hidden="true">/</span>
            {recordId ? <Link href={crmv3Href(base, section)}>{heading}</Link> : <span aria-current="page">{heading}</span>}
          </>
        )}
        {recordId && current && (
          <>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{current.title}</span>
          </>
        )}
      </nav>
      <div className="c3-recent" aria-label={v3("recentViews")}>
        <span className="c3-muted">{v3("recentViews")}</span>
        {items.map((item) => (
          <Link key={`${item.kind}-${item.id}`} href={item.href} className="c3-chip" data-kind={item.kind}>
            {v3(KIND_LABEL[item.kind as ViewKind] || "kindCustomer")} {item.title}
          </Link>
        ))}
        {!items.length && <span className="c3-muted">{v3("recentEmpty")}</span>}
        {items.length > 0 && <button type="button" className="c3-btn" onClick={clearViews}>{v3("recentClear")}</button>}
      </div>
      <p className="c3-muted">{v3("recentHint")}</p>
    </div>
  );
}

function paceText(pace: ReturnType<typeof paceOf>, v3: ReturnType<typeof useV3>) {
  if (pace === "ahead") return v3("goalAhead");
  if (pace === "behind") return v3("goalBehind");
  if (pace === "even") return v3("goalEven");
  return v3("goalNoTarget");
}

function gapText(gap: number | null, shown: string, v3: ReturnType<typeof useV3>) {
  if (gap == null) return v3("goalNoTarget");
  if (gap > 0) return `${v3("goalLeft")} ${shown}`;
  if (gap < 0) return v3("goalPast");
  return v3("goalMet");
}

function Metric({ title, hint, actual, shown, target, estimate, gap, gapShown, pace, onTarget }: {
  title: string;
  hint: string;
  actual: number;
  shown: string;
  target: number;
  estimate: string;
  gap: number | null;
  gapShown: string;
  pace: ReturnType<typeof paceOf>;
  onTarget: (value: number) => void;
}) {
  const v3 = useV3();
  const pct = progressPct(actual, target);
  const width = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  return (
    <article className="c3-compare-card">
      <h3 className="c3-title">{title}</h3>
      {hint ? <p className="c3-muted">{hint}</p> : null}
      <p><span className="c3-muted">{v3("goalMtd")}</span> <strong>{shown}</strong></p>
      <label className="c3-lab"><span>{v3("goalTarget")}</span>
        <input className="c3-field" type="number" min={0} aria-label={`${v3("goalTarget")} ${title}`} value={target || ""} onChange={(event) => onTarget(Math.max(0, Number(event.target.value) || 0))} />
      </label>
      <p><span className="c3-muted">{v3("goalEstimate")}</span> <strong>{estimate}</strong></p>
      <p>{gapText(gap, gapShown, v3)}</p>
      {pace !== "none" && <p className="c3-muted">{paceText(pace, v3)}</p>}
      <div className="c3-meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={width} aria-label={title}>
        <span style={{ width: `${width}%` }} />
      </div>
      {pct != null && <p className="c3-muted">{pct}%</p>}
    </article>
  );
}

export function GoalsPage({ locale }: { locale: string }) {
  const v3 = useV3();
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
    <section className="c3-card" aria-label={v3("goalsTitle")} data-goals="1">
      <h2 className="c3-title c3-pad">{v3("goalsTitle")}</h2>
      <p className="c3-muted c3-pad">{v3("goalsHint")}</p>
      <p className="c3-pad"><time dateTime={month}>{month}</time> · {v3("goalDay")} {span.day}/{span.days}</p>
      <div className="c3-goal-grid">
        <Metric
          title={v3("goalFtd")}
          hint={v3("goalFtdHint")}
          actual={ftd}
          shown={String(ftd)}
          target={targets.ftd}
          estimate={ftdRate == null ? "—" : String(ftdRate)}
          gap={stillToGo(ftd, targets.ftd)}
          gapShown={String(Math.abs(stillToGo(ftd, targets.ftd) || 0))}
          pace={paceOf(ftd, targets.ftd, span.day, span.days)}
          onTarget={(value) => save({ ...targets, ftd: value })}
        />
        <Metric
          title={v3("goalTraders")}
          hint={v3("goalTraderHint")}
          actual={traders}
          shown={String(traders)}
          target={targets.traders}
          estimate={traderRate == null ? "—" : String(traderRate)}
          gap={stillToGo(traders, targets.traders)}
          gapShown={String(Math.abs(stillToGo(traders, targets.traders) || 0))}
          pace={paceOf(traders, targets.traders, span.day, span.days)}
          onTarget={(value) => save({ ...targets, traders: value })}
        />
      </div>
      <h3 className="c3-title c3-pad">{v3("goalDeposits")}</h3>
      <p className="c3-muted c3-pad">{v3("goalDepositHint")}</p>
      <div className="c3-goal-grid" data-deposits="">
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
              onTarget={(value) => save({ ...targets, deposits: { ...targets.deposits, [currency]: value } })}
            />
          );
        })}
      </div>
      <div className="c3-pad">
        <button type="button" className="c3-btn" onClick={() => save(EMPTY)}>{v3("goalReset")}</button>
      </div>
    </section>
  );
}
