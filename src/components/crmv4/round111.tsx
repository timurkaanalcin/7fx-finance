"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  CHIP_KEY,
  RISK_HIDE_KEY,
  activeRisk,
  addChip,
  namedRisks,
  readChips,
  readHiddenRisks,
  resetChips,
  riskLines,
  riskText,
  setChipHidden,
  toggleChipDone,
  toggleChipPin,
  toggleRisk,
  visibleChips,
  visibleCustomers,
  visibleRisks,
  type Chip,
  type ChipView,
  type RiskRow,
} from "@/lib/crmv4/round111";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const VIEWS: { id: ChipView; label: CrmV4CopyKey }[] = [
  { id: "open", label: "hcOpen" },
  { id: "hidden", label: "hcHidden" },
  { id: "done", label: "hcFinished" },
];

type Member = {
  id: string;
  name?: string | null;
  email?: string | null;
  risk?: string | null;
  riskTier?: string | null;
  tier?: string | null;
  accountType?: string | null;
};

type GlanceRow = RiskRow & { id: string };

export function ReminderPolish({ v4 }: { v4: V4 }) {
  const [chips, setChips] = useState<Chip[]>([]);
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ChipView>("open");
  useEffect(() => {
    const next = readChips(readJson(CHIP_KEY, []));
    setChips(next);
    writeJson(CHIP_KEY, next);
  }, []);
  const shown = visibleChips(chips, view, query);

  function store(next: Chip[]) {
    setChips(next);
    writeJson(CHIP_KEY, next);
  }

  return (
    <section className="c4-remind-polish" aria-label={v4("hcTitle")} data-remind-polish="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-hc-logo" data-logo="mono">{v4("hcLogo")}</p>
          <p className="c4-pay-kicker">{v4("hcSub")}</p>
          <h2 className="c4-title">{v4("hcTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("hcHint")}</p>
      <p className="c4-meta">{v4("hcLocal")}</p>
      <p className="c4-meta">{v4("hcBlank")}</p>
      <p className="c4-meta">{v4("hcDueBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addChip(chips, { id: `hc-${chips.length}-${chipTextSafe(text)}`, text, due });
        if (next.length === chips.length) return;
        store(next);
        setText("");
        setDue("");
      }}>
        <label className="c4-lab">
          <span>{v4("hcText")}</span>
          <input className="c4-field" aria-label={v4("hcText")} value={text} maxLength={80} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("hcDue")}</span>
          <input className="c4-field" aria-label={v4("hcDue")} value={due} maxLength={40} onChange={(event) => setDue(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("hcAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetChips())}>{v4("hcReset")}</button>
      </form>
      <label className="c4-lab">
        <span>{v4("hcSearch")}</span>
        <input className="c4-field" aria-label={v4("hcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("hcTitle")}>
        {VIEWS.map((item) => (
          <button key={item.id} type="button" className="c4-chip" data-on={view === item.id ? "1" : "0"} aria-pressed={view === item.id} onClick={() => setView(item.id)}>{v4(item.label)}</button>
        ))}
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("hcEmpty")}</p>}
      <ul className="c4-hc-rows">
        {shown.map((chip) => (
          <li key={chip.id} data-pinned={chip.pinned ? "1" : "0"} data-done={chip.done ? "1" : "0"}>
            <p>{chip.text}</p>
            {chip.due ? <p className="c4-meta">{chip.due}</p> : null}
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleChipPin(chips, chip.id))}>{chip.pinned ? v4("hcUnpin") : v4("hcPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setChipHidden(chips, chip.id, !chip.hidden))}>{chip.hidden ? v4("hcShow") : v4("hcHide")}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleChipDone(chips, chip.id))}>{chip.done ? v4("hcUndo") : v4("hcDone")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function chipTextSafe(value: string): string {
  return value.trim().slice(0, 8).replace(/\s+/g, "-") || "chip";
}

export function RiskGlance({ base, v4 }: { base: string; v4: V4 }) {
  const people = useJson<{ users?: Member[] }>("/api/admin/users?view=table&take=40&meta=0&role=TRADER");
  const [hiddenRisks, setHiddenRisks] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (people.data?.users || []).map((row): GlanceRow => ({
    id: String(row.id || ""),
    label: `${row.name || ""} ${row.email || ""}`.trim(),
    risk: { risk: row.risk, riskTier: row.riskTier, tier: row.tier, accountType: row.accountType },
  }));
  const lines = riskLines(rows);
  const present = namedRisks(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.risk)?.count || 0;
  const loading = people.loading && !people.data;
  const failed = Boolean(people.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenRisks(readJson(RISK_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenRisks(next);
    writeJson(RISK_HIDE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleRisks(present, hiddenRisks, showHidden);
  const risk = activeRisk(selected, chips);
  const shown = visibleCustomers(rows, risk, blank, query);

  function store(next: string[], clear: string) {
    setHiddenRisks(next);
    writeJson(RISK_HIDE_KEY, next);
    if (clear && activeRisk(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-risk-glance" aria-label={v4("vpTitle")} data-risk-glance="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("vpSub")}</p>
          <h2 className="c4-title">{v4("vpTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("vpHint")}</p>
      <p className="c4-meta">{v4("vpLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("vpBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("vpLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("vpFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("vpNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-vp-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("vpBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("vpShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("vpShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("vpHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("vpTitle")}>
        <button type="button" className="c4-chip" data-on={!risk && !blank ? "1" : "0"} aria-pressed={!risk && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("vpAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.risk === item)?.count || 0;
          return (
            <span key={item} className="c4-vp-pair" data-risk={item}>
              <button type="button" className="c4-chip" data-on={risk === item ? "1" : "0"} aria-pressed={risk === item} onClick={() => { setBlank(false); setSelected(risk === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleRisk(hiddenRisks, item, present), showHidden ? "" : item)}>{showHidden ? v4("vpShow") : v4("vpHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("vpSearch")}</span>
        <input className="c4-field" aria-label={v4("vpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("vpEmpty")}</p>}
      <ul className="c4-vp-rows">
        {shown.map((row) => {
          const name = riskText(row.risk);
          return (
            <li key={row.id} data-risk={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("vpBlank")}</p>
              <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("vpCustomer")}</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
