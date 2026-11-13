"use client";

import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  EOD_KEY,
  HIDE_KEY,
  addStep,
  clearTicks,
  compareDesks,
  progress,
  readHidden,
  stepsFromStorage,
  toggleHidden,
  togglePin,
  toggleStep,
  visibleSteps,
  type Cash,
  type EodStep,
  type Person,
} from "@/lib/crmv4/round66";
import { useEscape } from "./round40";
import { money, useJson, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const STEP_LABEL: Record<string, CrmV4CopyKey> = {
  "close-support": "eodClose",
  "clear-pins": "eodPins",
  "export-digest": "eodExport",
};

function stepText(step: EodStep, v4: V4): string {
  const key = STEP_LABEL[step.id];
  return key ? v4(key) : step.label || step.id;
}

function moneyText(currency: string, amount: number, locale: string, none: string): string {
  if (currency.length === 3) return money(amount, currency, locale);
  return `${amount.toFixed(2)} ${none}`;
}

export function DeskCompare({ v4, locale, tx }: { v4: V4; locale: string; tx: Tx }) {
  const people = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const deposits = useJson<{ requests?: Cash[] }>("/api/admin/deposits?take=40");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  useEffect(() => { setHidden(readHidden(readJson(HIDE_KEY, []))); }, []);
  const loaded = people.data?.users || [];
  const columns = compareDesks(loaded, deposits.data?.requests || [], query, hidden, showHidden);
  const loading = (people.loading && !people.data) || (deposits.loading && !deposits.data);
  const failed = Boolean(people.error || deposits.error);

  function store(next: string[]) {
    setHidden(next);
    writeJson(HIDE_KEY, next);
  }

  return (
    <section className="c4-compare-strip c4-compare-vitrine" aria-label={v4("mcTitle")} data-compare-strip="1" data-desk="vitrine">
      <header className="c4-pay-head c4-compare-vitrine-mast">
        <p className="c4-compare-vitrine-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-pay-kicker c4-compare-vitrine-kicker">{v4("mcSub")}</p>
          <h2 className="c4-title c4-compare-vitrine-title">{v4("mcTitle")}</h2>
        </div>
        <p className="c4-meta c4-compare-vitrine-count">{v4("mcCount")} {columns.length}</p>
        <ol className="c4-compare-vitrine-index" aria-label={v4("mcTitle")}>
          <li data-tone="gold">{v4("mcSalonChampagne")}</li>
          <li data-tone="ink">{v4("mcSalonGraphite")}</li>
          <li data-tone="ivory">{v4("mcSalonIvory")}</li>
        </ol>
      </header>
      <p className="c4-meta c4-compare-vitrine-lead">{v4("mcSalonLead")}</p>
      <p className="c4-meta">{v4("mcHint")}</p>
      <label className="c4-lab">
        <span>{v4("mcSearch")}</span>
        <input className="c4-field" aria-label={v4("mcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("mcAll")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("mcAll")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("mcHidden")}</button>
      </div>
      {loading && !loaded.length && <p className="c4-meta">{v4("mcLoading")}</p>}
      {failed && <p className="c4-meta">{v4("mcFailed")} {tx("failed")}</p>}
      {!loading && !failed && !loaded.length && <p className="c4-pay-empty">{v4("mcNone")}</p>}
      {!loading && !failed && loaded.length > 0 && !columns.length && <p className="c4-pay-empty">{v4("mcEmpty")}</p>}
      <ul className="c4-compare-cols c4-compare-vitrine-cols">
        {columns.map((column) => (
          <li key={column.desk || "none"} className="c4-compare-col c4-compare-vitrine-card" data-desk={column.desk || "none"}>
            <div className="c4-row c4-between">
              <strong>{column.desk || v4("mcNoDesk")}</strong>
              <span className="c4-compare-count">{column.count}</span>
            </div>
            <p className="c4-meta">{v4("mcCustomers")} {column.count}</p>
            <p className="c4-meta">{v4("mcDeposits")}</p>
            {!column.lines.length && <p className="c4-meta">{v4("mcNoCash")}</p>}
            <ul className="c4-compare-lines">
              {column.lines.map((line) => (
                <li key={line.currency || "none"} data-currency={line.currency || "none"}>
                  <span>{moneyText(line.currency, line.amount, locale, v4("mcNoCurrency"))}</span>
                  <span className="c4-meta">{line.count}</span>
                </li>
              ))}
            </ul>
            <button type="button" className="c4-btn" data-desk-hide="" onClick={() => store(toggleHidden(hidden, column.desk))}>{showHidden ? v4("mcShow") : v4("mcHide")}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EodList({ v4 }: { v4: V4 }) {
  const [steps, setSteps] = useState<EodStep[]>([]);
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");
  const [clearing, setClearing] = useState(false);
  useEscape(clearing, () => setClearing(false));
  useEffect(() => {
    const raw = window.localStorage.getItem(EOD_KEY);
    const next = stepsFromStorage(raw);
    setSteps(next.steps);
    if (next.seeded) writeJson(EOD_KEY, next.steps);
  }, []);
  const shown = visibleSteps(steps, query);
  const mark = progress(steps);

  function store(next: EodStep[]) {
    setSteps(next);
    writeJson(EOD_KEY, next);
  }

  return (
    <section className="c4-eod-pad c4-eod-salon" aria-label={v4("eodTitle")} data-eod-pad="1" data-desk="scriptorium">
      <header className="c4-eod-mast">
        <p className="c4-eod-seal" data-logo="mono">7FX</p>
        <div className="c4-eod-rule" aria-hidden="true"><i /><i /><i /></div>
        <div>
          <p className="c4-pay-kicker">{v4("eodSub")}</p>
          <h2 className="c4-title">{v4("eodTitle")}</h2>
        </div>
        <ol className="c4-eod-index" aria-label={v4("eodTitle")}>
          <li data-tone="gold">{v4("eodSalonChampagne")}</li>
          <li data-tone="ink">{v4("eodSalonGraphite")}</li>
          <li data-tone="ivory">{v4("eodSalonIvory")}</li>
          <li>{v4("eodProgress")} {mark.done}/{mark.total}</li>
        </ol>
      </header>
      <p className="c4-meta">{v4("eodHint")}</p>
      <p className="c4-meta">{v4("eodLocal")}</p>
      <label className="c4-lab">
        <span>{v4("eodSearch")}</span>
        <input className="c4-field" aria-label={v4("eodSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addStep(steps, `step-${Date.now()}`, label);
        if (next.length === steps.length) return;
        store(next);
        setLabel("");
      }}>
        <label className="c4-lab">
          <span>{v4("eodStep")}</span>
          <input className="c4-field" aria-label={v4("eodStep")} value={label} onChange={(event) => setLabel(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("eodAdd")}</button>
      </form>
      <p className="c4-meta">{v4("eodBlank")}</p>
      {!shown.length && <p className="c4-eod-empty">{v4("eodEmpty")}</p>}
      <ul className="c4-eod-list">
        {shown.map((step) => (
          <li key={step.id} className="c4-eod-step" data-pinned={step.pinned ? "1" : "0"} data-done={step.done ? "1" : "0"}>
            <label className="c4-eod-check">
              <input type="checkbox" checked={step.done} aria-label={stepText(step, v4)} onChange={() => store(toggleStep(steps, step.id))} />
              <span>{stepText(step, v4)}</span>
            </label>
            <button type="button" className="c4-btn" onClick={() => store(togglePin(steps, step.id))}>{step.pinned ? v4("eodUnpin") : v4("eodPin")}</button>
          </li>
        ))}
      </ul>
      <button type="button" className="c4-btn" onClick={() => setClearing(true)}>{v4("eodClear")}</button>
      {clearing && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("eodClearLead")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" onClick={() => { store(clearTicks(steps)); setClearing(false); }}>{v4("eodClear")}</button>
            <button type="button" className="c4-btn" onClick={() => setClearing(false)}>{v4("eodCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
