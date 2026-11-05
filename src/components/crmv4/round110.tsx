"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  REMIND_POLISH_KEY,
  RISK_KEY,
  activeRisk,
  addReminder,
  namedRisks,
  readHiddenRisks,
  readReminders,
  riskLines,
  riskText,
  setReminderDone,
  setReminderHidden,
  toggleReminderPin,
  toggleRisk,
  visibleCustomers,
  visibleReminders,
  visibleRisks,
  type DeskReminder,
  type RiskRow,
} from "@/lib/crmv4/round110";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Member = {
  id: string;
  name?: string | null;
  email?: string | null;
  risk?: string | null;
  tier?: string | null;
  accountType?: string | null;
};

type GlanceRow = RiskRow & { id: string };

export function ReminderPolish({ v4 }: { v4: V4 }) {
  const [items, setItems] = useState<DeskReminder[]>([]);
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"open" | "done" | "hidden">("open");
  useEffect(() => {
    const next = readReminders(readJson(REMIND_POLISH_KEY, []));
    setItems(next);
    writeJson(REMIND_POLISH_KEY, next);
  }, []);
  const shown = visibleReminders(items, query, mode);

  function store(next: DeskReminder[]) {
    setItems(next);
    writeJson(REMIND_POLISH_KEY, next);
  }

  return (
    <section className="c4-remind-polish" aria-label={v4("qnTitle")} data-remind-polish="1" data-mode={mode}>
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("qnSub")}</p>
          <h2 className="c4-title">{v4("qnTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("qnHint")}</p>
      <p className="c4-meta">{v4("qnLocal")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addReminder(items, { id: `qn-${Date.now()}`, text, due, at: new Date().toISOString() });
        if (next.length === items.length) return;
        store(next);
        setText("");
        setDue("");
      }}>
        <label className="c4-lab">
          <span>{v4("qnText")}</span>
          <input className="c4-field" aria-label={v4("qnText")} value={text} maxLength={80} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("qnDue")}</span>
          <input className="c4-field" aria-label={v4("qnDue")} value={due} maxLength={40} onChange={(event) => setDue(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("qnAdd")}</button>
      </form>
      <p className="c4-meta">{v4("qnBlank")}</p>
      <p className="c4-meta">{v4("qnDueBlank")}</p>
      <label className="c4-lab">
        <span>{v4("qnSearch")}</span>
        <input className="c4-field" aria-label={v4("qnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("qnShown")}>
        <button type="button" className="c4-chip" data-on={mode === "open" ? "1" : "0"} aria-pressed={mode === "open"} onClick={() => setMode("open")}>{v4("qnShown")}</button>
        <button type="button" className="c4-chip" data-on={mode === "done" ? "1" : "0"} aria-pressed={mode === "done"} onClick={() => setMode("done")}>{v4("qnDoneView")}</button>
        <button type="button" className="c4-chip" data-on={mode === "hidden" ? "1" : "0"} aria-pressed={mode === "hidden"} onClick={() => setMode("hidden")}>{v4("qnHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("qnEmpty")}</p>}
      <ul className="c4-qn-list">
        {shown.map((item) => (
          <li key={item.id} className="c4-qn-card" data-done={item.done ? "1" : "0"} data-pinned={item.pinned ? "1" : "0"} data-text={item.text}>
            <p>{item.text}</p>
            <p className="c4-meta">{item.due || v4("qnDueBlank")}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(setReminderDone(items, item.id, !item.done))}>{item.done ? v4("qnUndo") : v4("qnDone")}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleReminderPin(items, item.id))}>{item.pinned ? v4("qnUnpin") : v4("qnPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setReminderHidden(items, item.id, !item.hidden))}>{item.hidden ? v4("qnShow") : v4("qnHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CustomerRisk({ base, v4 }: { base: string; v4: V4 }) {
  const people = useJson<{ users?: Member[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenRisks, setHiddenRisks] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (people.data?.users || []).map((row): GlanceRow => ({
    id: String(row.id || "").trim(),
    label: `${row.name || ""} ${row.email || ""}`.trim(),
    risk: { risk: row.risk, tier: row.tier, accountType: row.accountType },
  })).filter((row) => row.id);
  const lines = riskLines(rows);
  const present = namedRisks(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.risk)?.count || 0;
  const loading = people.loading && !people.data;
  const failed = Boolean(people.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenRisks(readJson(RISK_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenRisks(next);
    writeJson(RISK_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleRisks(present, hiddenRisks, showHidden);
  const risk = activeRisk(selected, chips);
  const shown = visibleCustomers(rows, risk, blank, query);

  function store(next: string[], clear: string) {
    setHiddenRisks(next);
    writeJson(RISK_KEY, next);
    if (clear && activeRisk(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-risk-glance" aria-label={v4("krTitle")} data-risk-glance="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("krSub")}</p>
          <h2 className="c4-title">{v4("krTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("krHint")}</p>
      <p className="c4-meta">{v4("krLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("krBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("krLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("krFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("krNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-kr-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("krBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("krShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("krShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("krHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("krTitle")}>
        <button type="button" className="c4-chip" data-on={!risk && !blank ? "1" : "0"} aria-pressed={!risk && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("krAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.risk === item)?.count || 0;
          return (
            <span key={item} className="c4-kr-pair" data-risk={item}>
              <button type="button" className="c4-chip" data-on={risk === item ? "1" : "0"} aria-pressed={risk === item} onClick={() => { setBlank(false); setSelected(risk === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleRisk(hiddenRisks, item, present), showHidden ? "" : item)}>{showHidden ? v4("krShow") : v4("krHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("krSearch")}</span>
        <input className="c4-field" aria-label={v4("krSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("krEmpty")}</p>}
      <ul className="c4-kr-rows">
        {shown.map((row) => {
          const name = riskText(row.risk);
          return (
            <li key={row.id} data-risk={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("krBlank")}</p>
              <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("krCustomer")}</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
