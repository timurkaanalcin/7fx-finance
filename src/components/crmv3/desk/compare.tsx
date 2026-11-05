"use client";

import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { useEscape } from "@/lib/crmv3/focus";
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
} from "@/lib/crmv3/compare";
import { useJson, type Tx } from "../kit";
import { useV3 } from "./store";

const STEP_LABEL: Record<string, CrmV3CopyKey> = {
  "close-support": "eodClose",
  "clear-pins": "eodPins",
  "export-digest": "eodExport",
};

function stepText(step: EodStep, v3: (key: CrmV3CopyKey) => string): string {
  const key = STEP_LABEL[step.id];
  return key ? v3(key) : step.label || step.id;
}

export function DeskCompare({ locale, tx }: { locale: string; tx: Tx }) {
  const v3 = useV3();
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
    <section className="c3-compare-strip" aria-label={v3("mcTitle")} data-compare-strip="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("mcSub")}</p>
          <h2 className="c3-title">{v3("mcTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("mcCount")} {columns.length}</p>
      </header>
      <p className="c3-muted">{v3("mcHint")}</p>
      <label className="c3-lab">
        <span>{v3("mcSearch")}</span>
        <input className="c3-field" aria-label={v3("mcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("mcAll")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("mcAll")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("mcHidden")}</button>
      </div>
      {loading && !loaded.length && <p className="c3-muted">{v3("mcLoading")}</p>}
      {failed && <p className="c3-muted">{v3("mcFailed")} {tx("failed")}</p>}
      {!loading && !failed && !loaded.length && <p className="c3-empty">{v3("mcNone")}</p>}
      {!loading && !failed && loaded.length > 0 && !columns.length && <p className="c3-empty">{v3("mcEmpty")}</p>}
      <ul className="c3-compare-cols">
        {columns.map((column) => (
          <li key={column.desk || "none"} className="c3-compare-col" data-desk={column.desk || "none"}>
            <div className="c3-row c3-between">
              <strong>{column.desk || v3("mcNoDesk")}</strong>
              <span className="c3-compare-count">{column.count}</span>
            </div>
            <p className="c3-muted">{v3("mcCustomers")} {column.count}</p>
            <p className="c3-muted">{v3("mcDeposits")}</p>
            {!column.lines.length && <p className="c3-muted">{v3("mcNoCash")}</p>}
            <ul className="c3-compare-lines">
              {column.lines.map((line) => (
                <li key={line.currency || "none"} data-currency={line.currency || "none"}>
                  <span>{line.currency || v3("mcNoCurrency")}</span>
                  <strong>{line.amount.toLocaleString(locale || "en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  <span className="c3-muted">{line.count}</span>
                </li>
              ))}
            </ul>
            <button type="button" className="c3-btn" data-desk-hide="" onClick={() => store(toggleHidden(hidden, column.desk))}>{showHidden ? v3("mcShow") : v3("mcHide")}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EodList() {
  const v3 = useV3();
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

  function add() {
    const next = addStep(steps, `step-${Date.now()}`, label);
    if (next.length === steps.length) return;
    store(next);
    setLabel("");
  }

  return (
    <section className="c3-eod-pad" aria-label={v3("eodTitle")} data-eod-pad="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("eodSub")}</p>
          <h2 className="c3-title">{v3("eodTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("eodProgress")} {mark.done}/{mark.total}</p>
      </header>
      <p className="c3-muted">{v3("eodHint")}</p>
      <p className="c3-muted">{v3("eodLocal")}</p>
      <label className="c3-lab">
        <span>{v3("eodSearch")}</span>
        <input className="c3-field" aria-label={v3("eodSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("eodStep")}</span>
          <input className="c3-field" aria-label={v3("eodStep")} value={label} onChange={(event) => setLabel(event.target.value)} />
        </label>
        <button type="button" className="c3-btn" onClick={add}>{v3("eodAdd")}</button>
      </div>
      <p className="c3-muted">{v3("eodBlank")}</p>
      {!shown.length && <p className="c3-empty">{v3("eodEmpty")}</p>}
      <ul className="c3-eod-list">
        {shown.map((step) => (
          <li key={step.id} className="c3-eod-step" data-pinned={step.pinned ? "1" : "0"} data-done={step.done ? "1" : "0"}>
            <label className="c3-eod-check">
              <input type="checkbox" checked={step.done} aria-label={stepText(step, v3)} onChange={() => store(toggleStep(steps, step.id))} />
              <span>{stepText(step, v3)}</span>
            </label>
            <button type="button" className="c3-btn" onClick={() => store(togglePin(steps, step.id))}>{step.pinned ? v3("eodUnpin") : v3("eodPin")}</button>
          </li>
        ))}
      </ul>
      <button type="button" className="c3-btn" onClick={() => setClearing(true)}>{v3("eodClear")}</button>
      {clearing && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("eodClearLead")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" onClick={() => { store(clearTicks(steps)); setClearing(false); }}>{v3("eodClear")}</button>
            <button type="button" className="c3-btn" onClick={() => setClearing(false)}>{v3("eodCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
