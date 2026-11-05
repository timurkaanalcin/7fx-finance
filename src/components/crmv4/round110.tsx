"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { COL_KEY, type ListCol } from "@/lib/crmv4/round34";
import {
  AUDIT_DAY_KEY,
  CSV_ACTIVE_KEY,
  CSV_PRESET_KEY,
  activeDay,
  activePresetColumns,
  columnText,
  csvLines,
  dayLines,
  keepColumns,
  namedDays,
  readHiddenDays,
  readPresets,
  resetColumns,
  tableColumns,
  toggleDay,
  upsertPreset,
  utcDay,
  visibleAudits,
  visibleDays,
  type CsvPerson,
  type CsvPreset,
  type DayRow,
} from "@/lib/crmv4/round110";
import { crmv4Href } from "@/lib/crmv4/sections";
import { downloadCsv, useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const LABEL: Record<ListCol, CrmV4CopyKey> = {
  customer: "luxCustomer",
  country: "luxCountry",
  desk: "luxDesk",
  sale: "luxSale",
  retention: "luxRetention",
  balance: "luxBalance",
  status: "luxStatus",
};

export function CsvColumnDesk({ base, v4 }: { base: string; v4: V4 }) {
  const people = useJson<{ users?: CsvPerson[] }>("/api/admin/users?view=table&take=40&meta=0&role=TRADER");
  const [visible, setVisible] = useState<ListCol[]>(() => tableColumns(null));
  const [picked, setPicked] = useState<ListCol[]>(() => tableColumns(null));
  const [presets, setPresets] = useState<CsvPreset[]>([]);
  const [name, setName] = useState("");
  const rows = people.data?.users || [];
  const loading = people.loading && !people.data;
  const failed = Boolean(people.error);
  useEffect(() => {
    const columns = tableColumns(readJson(COL_KEY, null));
    const nextPresets = readPresets(readJson(CSV_PRESET_KEY, []), columns);
    const nextPicked = activePresetColumns(readJson(CSV_ACTIVE_KEY, columns), columns);
    setVisible(columns);
    setPresets(nextPresets);
    setPicked(nextPicked);
    writeJson(CSV_PRESET_KEY, nextPresets);
    writeJson(CSV_ACTIVE_KEY, nextPicked);
  }, []);

  function choose(next: ListCol[]) {
    const safe = keepColumns(next, visible);
    const stored = safe.length ? safe : resetColumns(visible);
    setPicked(stored);
    writeJson(CSV_ACTIVE_KEY, stored);
  }

  function save() {
    const next = upsertPreset(presets, name, picked, visible);
    setPresets(next);
    writeJson(CSV_PRESET_KEY, next);
    if (name.trim()) setName("");
  }

  return (
    <section className="c4-csv-presets" aria-label={v4("xvTitle")} data-csv-presets="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-csv-logo" data-logo="mono">{v4("xvLogo")}</p>
          <p className="c4-pay-kicker">{v4("xvSub")}</p>
          <h2 className="c4-title">{v4("xvTitle")}</h2>
        </div>
        <p className="c4-meta">{picked.length}</p>
      </header>
      <p className="c4-meta">{v4("xvHint")}</p>
      <p className="c4-meta">{v4("xvLocal")}</p>
      <p className="c4-meta">{v4("xvUnknown")}</p>
      <p className="c4-meta">{v4("xvBlankName")}</p>
      <p className="c4-meta">{v4("xvCurrent")} {picked.join(", ")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("xvOpen")}</Link>
        <button type="button" className="c4-btn" onClick={() => choose(resetColumns(visible))}>{v4("xvReset")}</button>
        <button type="button" className="c4-btn" onClick={() => downloadCsv("customers.csv", picked, csvLines(rows, picked))}>{v4("xvFile")}</button>
      </p>
      <div className="c4-row" role="group" aria-label={v4("xvVisible")}>
        {visible.map((col) => (
          <button key={col} type="button" className="c4-chip" data-on={picked.includes(col) ? "1" : "0"} aria-pressed={picked.includes(col)} onClick={() => {
            const next = picked.includes(col) ? picked.filter((item) => item !== col) : [...picked, col];
            choose(next.length ? next : picked);
          }}>{v4(LABEL[col])}</button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("xvName")}</span>
        <input className="c4-field" aria-label={v4("xvName")} value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <button type="button" className="c4-btn" onClick={save}>{v4("xvSave")}</button>
      <div className="c4-row" role="group" aria-label={v4("xvSave")}>
        {presets.map((preset) => (
          <button key={preset.id} type="button" className="c4-chip" data-on={picked.join("\n") === preset.columns.join("\n") ? "1" : "0"} aria-pressed={picked.join("\n") === preset.columns.join("\n")} onClick={() => choose(preset.columns)}>{preset.name}</button>
        ))}
      </div>
      {loading && !rows.length && <p className="c4-meta">{v4("xvLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("xvFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("xvNone")}</p>}
      <h3 className="c4-title">{v4("xvPreview")}</h3>
      {!rows.length && <p className="c4-pay-empty">{v4("xvEmpty")}</p>}
      <div className="c4-csv-sheet">
        <table className="c4-csv-table">
          <thead>
            <tr>{picked.map((col) => <th key={col} scope="col">{v4(LABEL[col])}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {picked.map((col) => <td key={col}>{columnText(col, row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AuditDayStrip({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ rows?: DayRow[] }>("/api/admin/control?part=logs&source=audit&level=all&take=40");
  const [hiddenDays, setHiddenDays] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = data.data?.rows || [];
  const lines = dayLines(rows);
  const present = namedDays(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.day)?.count || 0;
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenDays(readJson(AUDIT_DAY_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenDays(next);
    writeJson(AUDIT_DAY_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleDays(present, hiddenDays, showHidden);
  const day = activeDay(selected, chips);
  const shown = visibleAudits(rows, day, blank, query);

  function store(next: string[], clear: string) {
    setHiddenDays(next);
    writeJson(AUDIT_DAY_KEY, next);
    if (clear && activeDay(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-audit-days" aria-label={v4("uyTitle")} data-audit-days="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("uySub")}</p>
          <h2 className="c4-title">{v4("uyTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("uyHint")}</p>
      <p className="c4-meta">{v4("uyLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "history")}>{v4("uyBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("uyLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("uyFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("uyNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-uy-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("uyBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("uyShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("uyShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("uyHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("uyTitle")}>
        <button type="button" className="c4-chip" data-on={!day && !blank ? "1" : "0"} aria-pressed={!day && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("uyAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.day === item)?.count || 0;
          return (
            <span key={item} className="c4-uy-pair" data-day={item}>
              <button type="button" className="c4-chip" data-on={day === item ? "1" : "0"} aria-pressed={day === item} onClick={() => { setBlank(false); setSelected(day === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleDay(hiddenDays, item, present), showHidden ? "" : item)}>{showHidden ? v4("uyShow") : v4("uyHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("uySearch")}</span>
        <input className="c4-field" aria-label={v4("uySearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("uyEmpty")}</p>}
      <ul className="c4-uy-rows">
        {shown.map((row) => {
          const stamp = utcDay(row.at);
          return (
            <li key={row.id} data-day={stamp || "blank"}>
              <p>{row.action || row.id}</p>
              <p className="c4-meta">{[row.actor, row.target].filter(Boolean).join(" · ")}</p>
              <p className="c4-meta">{stamp || v4("uyBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
