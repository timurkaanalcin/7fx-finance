"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
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
} from "@/lib/crmv3/remindpolish";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const VIEWS: { id: ChipView; label: CrmV3CopyKey }[] = [
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

function chipTextSafe(value: string): string {
  return value.trim().slice(0, 8).replace(/\s+/g, "-") || "chip";
}

export function ReminderPolish() {
  const v3 = useV3();
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
    <section className="c3-remind-polish" aria-label={v3("hcTitle")} data-remind-polish="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-hc-logo" data-logo="mono">{v3("hcLogo")}</p>
          <p className="c3-pay-kicker">{v3("hcSub")}</p>
          <h2 className="c3-title">{v3("hcTitle")}</h2>
        </div>
        <p className="c3-meta">{shown.length}</p>
      </header>
      <p className="c3-meta">{v3("hcHint")}</p>
      <p className="c3-meta">{v3("hcLocal")}</p>
      <p className="c3-meta">{v3("hcBlank")}</p>
      <p className="c3-meta">{v3("hcDueBlank")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addChip(chips, { id: `hc-${chips.length}-${chipTextSafe(text)}`, text, due });
        if (next.length === chips.length) return;
        store(next);
        setText("");
        setDue("");
      }}>
        <label className="c3-lab">
          <span>{v3("hcText")}</span>
          <input className="c3-field" aria-label={v3("hcText")} value={text} maxLength={80} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("hcDue")}</span>
          <input className="c3-field" aria-label={v3("hcDue")} value={due} maxLength={40} onChange={(event) => setDue(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("hcAdd")}</button>
        <button type="button" className="c3-btn" onClick={() => store(resetChips())}>{v3("hcReset")}</button>
      </form>
      <label className="c3-lab">
        <span>{v3("hcSearch")}</span>
        <input className="c3-field" aria-label={v3("hcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("hcTitle")}>
        {VIEWS.map((item) => (
          <button key={item.id} type="button" className="c3-chip" data-on={view === item.id ? "1" : "0"} aria-pressed={view === item.id} onClick={() => setView(item.id)}>{v3(item.label)}</button>
        ))}
      </div>
      {!shown.length && <p className="c3-pay-empty">{v3("hcEmpty")}</p>}
      <ul className="c3-hc-rows">
        {shown.map((chip) => (
          <li key={chip.id} data-pinned={chip.pinned ? "1" : "0"} data-done={chip.done ? "1" : "0"}>
            <p>{chip.text}</p>
            {chip.due ? <p className="c3-meta">{chip.due}</p> : null}
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleChipPin(chips, chip.id))}>{chip.pinned ? v3("hcUnpin") : v3("hcPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setChipHidden(chips, chip.id, !chip.hidden))}>{chip.hidden ? v3("hcShow") : v3("hcHide")}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleChipDone(chips, chip.id))}>{chip.done ? v3("hcUndo") : v3("hcDone")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RiskGlance({ base }: { base: string }) {
  const v3 = useV3();
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
    <section className="c3-risk-glance" aria-label={v3("vpTitle")} data-risk-glance="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("vpSub")}</p>
          <h2 className="c3-title">{v3("vpTitle")}</h2>
        </div>
        <p className="c3-meta">{chips.length}</p>
      </header>
      <p className="c3-meta">{v3("vpHint")}</p>
      <p className="c3-meta">{v3("vpLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "customers")}>{v3("vpBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c3-meta">{v3("vpLoading")}</p>}
      {failed && !rows.length && <p className="c3-meta">{v3("vpFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c3-pay-empty">{v3("vpNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-vp-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("vpBlank")}</span>
          <span className="c3-meta">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("vpShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("vpShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("vpHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("vpTitle")}>
        <button type="button" className="c3-chip" data-on={!risk && !blank ? "1" : "0"} aria-pressed={!risk && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("vpAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.risk === item)?.count || 0;
          return (
            <span key={item} className="c3-vp-pair" data-risk={item}>
              <button type="button" className="c3-chip" data-on={risk === item ? "1" : "0"} aria-pressed={risk === item} onClick={() => { setBlank(false); setSelected(risk === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleRisk(hiddenRisks, item, present), showHidden ? "" : item)}>{showHidden ? v3("vpShow") : v3("vpHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("vpSearch")}</span>
        <input className="c3-field" aria-label={v3("vpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-pay-empty">{v3("vpEmpty")}</p>}
      <ul className="c3-vp-rows">
        {shown.map((row) => {
          const name = riskText(row.risk);
          return (
            <li key={row.id} data-risk={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-meta">{name || v3("vpBlank")}</p>
              <Link className="c3-btn" href={crmv3Href(base, `customers/${row.id}`)}>{v3("vpCustomer")}</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
