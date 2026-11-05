"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { COL_KEY, type ListCol } from "@/lib/crmv3/table";
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
} from "@/lib/crmv3/csvpresets";
import { crmv3Href } from "@/lib/crmv3/sections";
import { downloadCsv, useJson } from "../kit";
import { useV3 } from "./store";

const LABEL: Record<ListCol, CrmV3CopyKey> = {
  customer: "luxCustomer",
  country: "luxCountry",
  desk: "luxDesk",
  sale: "luxSale",
  retention: "luxRetention",
  balance: "luxBalance",
  status: "luxStatus",
};

export function CsvColumnDesk({ base }: { base: string }) {
  const v3 = useV3();
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
    <section className="c3-csv-presets" aria-label={v3("xvTitle")} data-csv-presets="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-csv-logo" data-logo="mono">{v3("xvLogo")}</p>
          <p className="c3-pay-kicker">{v3("xvSub")}</p>
          <h2 className="c3-title">{v3("xvTitle")}</h2>
        </div>
        <p className="c3-meta">{picked.length}</p>
      </header>
      <p className="c3-meta">{v3("xvHint")}</p>
      <p className="c3-meta">{v3("xvLocal")}</p>
      <p className="c3-meta">{v3("xvUnknown")}</p>
      <p className="c3-meta">{v3("xvBlankName")}</p>
      <p className="c3-meta">{v3("xvCurrent")} {picked.join(", ")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "customers")}>{v3("xvOpen")}</Link>
        <button type="button" className="c3-btn" onClick={() => choose(resetColumns(visible))}>{v3("xvReset")}</button>
        <button type="button" className="c3-btn" onClick={() => downloadCsv("customers.csv", picked, csvLines(rows, picked))}>{v3("xvFile")}</button>
      </p>
      <div className="c3-row" role="group" aria-label={v3("xvVisible")}>
        {visible.map((col) => (
          <button key={col} type="button" className="c3-chip" data-on={picked.includes(col) ? "1" : "0"} aria-pressed={picked.includes(col)} onClick={() => {
            const next = picked.includes(col) ? picked.filter((item) => item !== col) : [...picked, col];
            choose(next.length ? next : picked);
          }}>{v3(LABEL[col])}</button>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("xvName")}</span>
        <input className="c3-field" aria-label={v3("xvName")} value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <button type="button" className="c3-btn" onClick={save}>{v3("xvSave")}</button>
      <div className="c3-row" role="group" aria-label={v3("xvSave")}>
        {presets.map((preset) => (
          <button key={preset.id} type="button" className="c3-chip" data-on={picked.join("\n") === preset.columns.join("\n") ? "1" : "0"} aria-pressed={picked.join("\n") === preset.columns.join("\n")} onClick={() => choose(preset.columns)}>{preset.name}</button>
        ))}
      </div>
      {loading && !rows.length && <p className="c3-meta">{v3("xvLoading")}</p>}
      {failed && !rows.length && <p className="c3-meta">{v3("xvFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c3-pay-empty">{v3("xvNone")}</p>}
      <h3 className="c3-title">{v3("xvPreview")}</h3>
      {!rows.length && <p className="c3-pay-empty">{v3("xvEmpty")}</p>}
      <div className="c3-csv-sheet">
        <table className="c3-csv-table">
          <thead>
            <tr>{picked.map((col) => <th key={col} scope="col">{v3(LABEL[col])}</th>)}</tr>
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

export function AuditDayStrip({ base }: { base: string }) {
  const v3 = useV3();
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
    <section className="c3-audit-days" aria-label={v3("uyTitle")} data-audit-days="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("uySub")}</p>
          <h2 className="c3-title">{v3("uyTitle")}</h2>
        </div>
        <p className="c3-meta">{chips.length}</p>
      </header>
      <p className="c3-meta">{v3("uyHint")}</p>
      <p className="c3-meta">{v3("uyLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "history")}>{v3("uyBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c3-meta">{v3("uyLoading")}</p>}
      {failed && !rows.length && <p className="c3-meta">{v3("uyFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c3-pay-empty">{v3("uyNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-uy-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("uyBlank")}</span>
          <span className="c3-meta">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("uyShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("uyShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("uyHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("uyTitle")}>
        <button type="button" className="c3-chip" data-on={!day && !blank ? "1" : "0"} aria-pressed={!day && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("uyAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.day === item)?.count || 0;
          return (
            <span key={item} className="c3-uy-pair" data-day={item}>
              <button type="button" className="c3-chip" data-on={day === item ? "1" : "0"} aria-pressed={day === item} onClick={() => { setBlank(false); setSelected(day === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleDay(hiddenDays, item, present), showHidden ? "" : item)}>{showHidden ? v3("uyShow") : v3("uyHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("uySearch")}</span>
        <input className="c3-field" aria-label={v3("uySearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-pay-empty">{v3("uyEmpty")}</p>}
      <ul className="c3-uy-rows">
        {shown.map((row) => {
          const stamp = utcDay(row.at);
          return (
            <li key={row.id} data-day={stamp || "blank"}>
              <p>{row.action || row.id}</p>
              <p className="c3-meta">{[row.actor, row.target].filter(Boolean).join(" · ")}</p>
              <p className="c3-meta">{stamp || v3("uyBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
