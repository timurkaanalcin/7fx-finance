"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { useEscape } from "@/lib/crmv3/focus";
import { crmv3Href } from "@/lib/crmv3/sections";
import {
  SCRIPT_KEY,
  WATCH_KEY,
  WINDOWS,
  WINDOW_KEY,
  activityState,
  addScript,
  balanceTotals,
  hideScript,
  latestActivity,
  readIds,
  readScripts,
  readWindow,
  removeScript,
  toggleId,
  toggleScriptPin,
  visiblePeople,
  visibleScripts,
  type ActivityState,
  type CallScript,
  type Person,
  type StaleWindow,
} from "@/lib/crmv3/stale";
import { useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

const STATE_LABEL: Record<ActivityState, CrmV3CopyKey> = {
  stale: "slStale",
  fresh: "slFresh",
  none: "slNoTime",
};

function amountText(amount: number, locale: string): string {
  return amount.toLocaleString(locale || "en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function balanceText(row: Person, locale: string, none: string): string {
  const currency = String(row.currency || "").trim().toUpperCase();
  const amount = Number(row.balance);
  if (!Number.isFinite(amount)) return "—";
  if (currency.length === 3) return `${currency} ${amountText(amount, locale)}`;
  return `${amountText(amount, locale)} ${none}`;
}

export function StaleWatch({ base, locale, tx }: { base: string; locale: string; tx: Tx }) {
  const v3 = useV3();
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"" | ActivityState>("stale");
  const [days, setDays] = useState<StaleWindow>(30);
  const [pins, setPins] = useState<string[]>([]);
  const [now] = useState(() => Date.now());
  useEffect(() => {
    setDays(readWindow(readJson(WINDOW_KEY, 30)));
    setPins(readIds(readJson(WATCH_KEY, [])));
  }, []);
  const loaded = data.data?.users || [];
  const shown = visiblePeople(loaded, query, state, pins, now, days);
  const totals = balanceTotals(shown);

  function storeDays(next: StaleWindow) {
    setDays(next);
    writeJson(WINDOW_KEY, next);
  }

  function storePins(next: string[]) {
    setPins(next);
    writeJson(WATCH_KEY, next);
  }

  return (
    <section className="c3-stale-desk" aria-label={v3("slTitle")} data-stale-desk="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("slSub")}</p>
          <h2 className="c3-title">{v3("slTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("slCount")} {shown.length}</p>
      </header>
      <p className="c3-muted">{v3("slHint")}</p>
      <label className="c3-lab">
        <span>{v3("slSearch")}</span>
        <input className="c3-field" aria-label={v3("slSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("slStale")}>
        {(["stale", "none", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={state === item ? "1" : "0"} aria-pressed={state === item} onClick={() => setState(item)}>{v3(STATE_LABEL[item])}</button>
        ))}
        {WINDOWS.map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={days === item ? "1" : "0"} aria-pressed={days === item} onClick={() => storeDays(item)}>{v3("slWindow")} {item} {v3("slDays")}</button>
        ))}
      </div>
      <div className="c3-stale-totals" aria-label={v3("slTotals")}>
        <p className="c3-muted">{v3("slTotals")}</p>
        <ul>
          {totals.map((line) => (
            <li key={line.currency || "none"} data-currency={line.currency || "none"}>
              <span>{line.currency || v3("slNoCurrency")}</span>
              <strong>{amountText(line.amount, locale)}</strong>
              <span className="c3-muted">{line.count}</span>
            </li>
          ))}
        </ul>
      </div>
      {data.loading && !loaded.length && <p className="c3-muted">{v3("slLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("slFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("slNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c3-empty">{v3("slEmpty")}</p>}
      <ul className="c3-stale-cards">
        {shown.map((row) => {
          const mark = activityState(row, now, days);
          const at = latestActivity(row);
          const pinned = pins.includes(row.id);
          return (
            <li key={row.id} className="c3-stale-card" data-activity={mark} data-pinned={pinned ? "1" : "0"}>
              <div className="c3-row c3-between">
                <strong>{row.name || row.email || "—"}</strong>
                <span className="c3-stale-chip">{v3(STATE_LABEL[mark])}</span>
              </div>
              <p>{balanceText(row, locale, v3("slNoCurrency"))}</p>
              <p className="c3-muted">{row.desk || "—"} · {at ? when(new Date(at).toISOString(), locale) : v3("slNoTime")}</p>
              <div className="c3-row">
                <button type="button" className="c3-btn" data-stale-watch="" onClick={() => storePins(toggleId(pins, row.id))}>{pinned ? v3("slUnpin") : v3("slWatch")}</button>
                <Link className="c3-btn" href={crmv3Href(base, `customers/${row.id}`)}>{v3("slOpen")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function CallScripts() {
  const v3 = useV3();
  const [scripts, setScripts] = useState<CallScript[]>([]);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [hidden, setHidden] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  useEscape(Boolean(removing), () => setRemoving(null));
  useEffect(() => { setScripts(readScripts(readJson(SCRIPT_KEY, []))); }, []);
  const shown = visibleScripts(scripts, query, hidden);

  function store(next: CallScript[]) {
    setScripts(next);
    writeJson(SCRIPT_KEY, next);
  }

  function add() {
    const next = addScript(scripts, { id: `line-${Date.now()}`, title, body, at: new Date().toISOString() });
    if (next.length === scripts.length && next.every((script, index) => script.id === scripts[index]?.id)) return;
    store(next);
    setTitle("");
    setBody("");
    setHidden(false);
  }

  return (
    <section className="c3-script-pad" aria-label={v3("tkTitle")} data-script-pad="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("tkSub")}</p>
          <h2 className="c3-title">{v3("tkTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("tkHint")}</p>
      <p className="c3-muted">{v3("tkLocal")}</p>
      <label className="c3-lab">
        <span>{v3("tkSearch")}</span>
        <input className="c3-field" aria-label={v3("tkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("tkOpen")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("tkOpen")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("tkHidden")}</button>
      </div>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("tkTitleField")}</span>
          <input className="c3-field" aria-label={v3("tkTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("tkBody")}</span>
          <input className="c3-field" aria-label={v3("tkBody")} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="button" className="c3-btn" onClick={add}>{v3("tkAdd")}</button>
      </div>
      <p className="c3-muted">{v3("tkBlank")}</p>
      {!shown.length && <p className="c3-empty">{v3("tkEmpty")}</p>}
      <ul className="c3-script-list">
        {shown.map((script) => (
          <li key={script.id} className="c3-script-card" data-pinned={script.pinned ? "1" : "0"} data-hidden={script.hidden ? "1" : "0"}>
            {script.title && <strong>{script.title}</strong>}
            <p>{script.body}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleScriptPin(scripts, script.id))}>{script.pinned ? v3("tkUnpin") : v3("tkPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(hideScript(scripts, script.id, !script.hidden))}>{script.hidden ? v3("tkShow") : v3("tkHide")}</button>
              <button type="button" className="c3-btn" onClick={() => setRemoving(script.id)}>{v3("tkRemove")}</button>
            </div>
          </li>
        ))}
      </ul>
      {removing && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("tkRemoveLead")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" onClick={() => { store(removeScript(scripts, removing)); setRemoving(null); }}>{v3("tkRemove")}</button>
            <button type="button" className="c3-btn" onClick={() => setRemoving(null)}>{v3("tkCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
