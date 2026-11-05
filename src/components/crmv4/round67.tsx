"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round67";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useEscape } from "./round40";
import { money, useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const STATE_LABEL: Record<ActivityState, CrmV4CopyKey> = {
  stale: "slStale",
  fresh: "slFresh",
  none: "slNoTime",
};

function balanceText(row: Person, locale: string, none: string): string {
  const currency = String(row.currency || "").trim().toUpperCase();
  const amount = Number(row.balance);
  if (!Number.isFinite(amount)) return "—";
  if (currency.length === 3) return money(amount, currency, locale);
  return `${amount.toFixed(2)} ${none}`;
}

export function StaleWatch({ base, v4, locale, tx }: { base: string; v4: V4; locale: string; tx: Tx }) {
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
    <section className="c4-stale-desk" aria-label={v4("slTitle")} data-stale-desk="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("slSub")}</p>
          <h2 className="c4-title">{v4("slTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("slCount")} {shown.length}</p>
      </header>
      <p className="c4-meta">{v4("slHint")}</p>
      <label className="c4-lab">
        <span>{v4("slSearch")}</span>
        <input className="c4-field" aria-label={v4("slSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("slStale")}>
        {(["stale", "none", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={state === item ? "1" : "0"} aria-pressed={state === item} onClick={() => setState(item)}>{v4(STATE_LABEL[item])}</button>
        ))}
        {WINDOWS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={days === item ? "1" : "0"} aria-pressed={days === item} onClick={() => storeDays(item)}>{v4("slWindow")} {item} {v4("slDays")}</button>
        ))}
      </div>
      <div className="c4-stale-totals" aria-label={v4("slTotals")}>
        <p className="c4-meta">{v4("slTotals")}</p>
        <ul>
          {totals.map((line) => (
            <li key={line.currency || "none"} data-currency={line.currency || "none"}>
              <strong>{line.currency.length === 3 ? money(line.amount, line.currency, locale) : line.amount.toFixed(2)}</strong>
              {line.currency.length !== 3 && <span>{v4("slNoCurrency")}</span>}
              <span className="c4-meta">{line.count}</span>
            </li>
          ))}
        </ul>
      </div>
      {data.loading && !loaded.length && <p className="c4-meta">{v4("slLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("slFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty">{v4("slNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c4-pay-empty">{v4("slEmpty")}</p>}
      <ul className="c4-stale-cards">
        {shown.map((row) => {
          const mark = activityState(row, now, days);
          const at = latestActivity(row);
          const pinned = pins.includes(row.id);
          return (
            <li key={row.id} className="c4-stale-card" data-activity={mark} data-pinned={pinned ? "1" : "0"}>
              <div className="c4-row c4-between">
                <strong>{row.name || row.email || "—"}</strong>
                <span className="c4-stale-chip">{v4(STATE_LABEL[mark])}</span>
              </div>
              <p>{balanceText(row, locale, v4("slNoCurrency"))}</p>
              <p className="c4-meta">{row.desk || "—"} · {at ? when(new Date(at).toISOString(), locale) : v4("slNoTime")}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" data-stale-watch="" onClick={() => storePins(toggleId(pins, row.id))}>{pinned ? v4("slUnpin") : v4("slWatch")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("slOpen")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function CallScripts({ v4 }: { v4: V4 }) {
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

  return (
    <section className="c4-script-pad" aria-label={v4("tkTitle")} data-script-pad="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("tkSub")}</p>
          <h2 className="c4-title">{v4("tkTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("tkHint")}</p>
      <p className="c4-meta">{v4("tkLocal")}</p>
      <label className="c4-lab">
        <span>{v4("tkSearch")}</span>
        <input className="c4-field" aria-label={v4("tkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("tkOpen")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("tkOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("tkHidden")}</button>
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addScript(scripts, { id: `line-${Date.now()}`, title, body, at: new Date().toISOString() });
        if (next.length === scripts.length && next.every((script, index) => script.id === scripts[index]?.id)) return;
        store(next);
        setTitle("");
        setBody("");
        setHidden(false);
      }}>
        <label className="c4-lab">
          <span>{v4("tkTitleField")}</span>
          <input className="c4-field" aria-label={v4("tkTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("tkBody")}</span>
          <input className="c4-field" aria-label={v4("tkBody")} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("tkAdd")}</button>
      </form>
      <p className="c4-meta">{v4("tkBlank")}</p>
      {!shown.length && <p className="c4-pay-empty">{v4("tkEmpty")}</p>}
      <ul className="c4-script-list">
        {shown.map((script) => (
          <li key={script.id} className="c4-script-card" data-pinned={script.pinned ? "1" : "0"} data-hidden={script.hidden ? "1" : "0"}>
            {script.title && <strong>{script.title}</strong>}
            <p>{script.body}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleScriptPin(scripts, script.id))}>{script.pinned ? v4("tkUnpin") : v4("tkPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(hideScript(scripts, script.id, !script.hidden))}>{script.hidden ? v4("tkShow") : v4("tkHide")}</button>
              <button type="button" className="c4-btn" onClick={() => setRemoving(script.id)}>{v4("tkRemove")}</button>
            </div>
          </li>
        ))}
      </ul>
      {removing && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("tkRemoveLead")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" onClick={() => { store(removeScript(scripts, removing)); setRemoving(null); }}>{v4("tkRemove")}</button>
            <button type="button" className="c4-btn" onClick={() => setRemoving(null)}>{v4("tkCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
