"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import {
  DOC_STATUS_KEY,
  PRESET_KEY,
  activeStatus,
  addPreset,
  boardFilters,
  namedStatuses,
  readHiddenStatuses,
  readPresets,
  setPresetHidden,
  statusLines,
  statusText,
  togglePresetPin,
  toggleStatus,
  visibleDocs,
  visiblePresets,
  visibleStatuses,
  type Preset,
  type StatusRow,
} from "@/lib/crmv3/preset";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const DOCS = "/api/admin/documents?take=40";

type Document = {
  id: string;
  name?: string | null;
  status?: string | null;
  trader?: string | null;
  traderEmail?: string | null;
  traderId?: string | null;
};

type GlanceRow = StatusRow & { id: string; userId: string };

export function FilterPresets() {
  const v3 = useV3();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [marked, setMarked] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readPresets(readJson(PRESET_KEY, []));
    setPresets(next);
    writeJson(PRESET_KEY, next);
  }, []);
  const shown = visiblePresets(presets, query, hidden).filter((preset) => !marked || preset.pinned);

  function store(next: Preset[]) {
    setPresets(next);
    writeJson(PRESET_KEY, next);
  }

  function apply(preset: Preset) {
    const filters = boardFilters(preset.filters);
    setQuery(filters.q || "");
    setMarked(filters.marked === "1");
  }

  return (
    <section className="c3-filter-presets" aria-label={v3("fpTitle")} data-filter-presets="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("fpSub")}</p>
          <h2 className="c3-title">{v3("fpTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("fpHint")}</p>
      <p className="c3-muted">{v3("fpLocal")}</p>
      <label className="c3-lab">
        <span>{v3("fpSearch")}</span>
        <input className="c3-field" aria-label={v3("fpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("fpMarked")}>
        <button type="button" className="c3-chip" data-on={marked ? "1" : "0"} aria-pressed={marked} onClick={() => setMarked((value) => !value)}>{v3("fpMarked")}</button>
      </div>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addPreset(presets, {
          id: `fp-${Date.now()}`,
          name,
          filters: { q: query, marked: marked ? "1" : "", extra: "no" },
          at: new Date().toISOString(),
        });
        if (next.length === presets.length) return;
        store(next);
        setName("");
      }}>
        <label className="c3-lab">
          <span>{v3("fpName")}</span>
          <input className="c3-field" aria-label={v3("fpName")} value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("fpSave")}</button>
      </form>
      <p className="c3-muted">{v3("fpBlank")}</p>
      <div className="c3-row" role="group" aria-label={v3("fpShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("fpShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("fpHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("fpEmpty")}</p>}
      <ul className="c3-preset-list">
        {shown.map((preset) => {
          const filters = boardFilters(preset.filters);
          return (
            <li key={preset.id} className="c3-preset-card" data-pinned={preset.pinned ? "1" : "0"}>
              <p>{preset.name}</p>
              <p className="c3-muted">{filters.q || filters.marked ? `${filters.q || ""} ${filters.marked ? v3("fpMarked") : ""}`.trim() : v3("fpNone")}</p>
              <div className="c3-row">
                <button type="button" className="c3-btn" onClick={() => apply(preset)}>{v3("fpApply")}</button>
                <button type="button" className="c3-btn" onClick={() => store(togglePresetPin(presets, preset.id))}>{preset.pinned ? v3("fpUnpin") : v3("fpPin")}</button>
                <button type="button" className="c3-btn" onClick={() => store(setPresetHidden(presets, preset.id, !preset.hidden))}>{preset.hidden ? v3("fpShow") : v3("fpHide")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function DocStatusGlance({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ documents?: Document[] }>(DOCS);
  const [hiddenStatuses, setHiddenStatuses] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.documents || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      status: row.status,
      label: String(row.trader || row.traderEmail || row.name || ""),
      userId: String(row.traderId || "").trim(),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = statusLines(rows);
  const present = namedStatuses(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.status)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenStatuses(readJson(DOC_STATUS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenStatuses(next);
    writeJson(DOC_STATUS_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleStatuses(present, hiddenStatuses, showHidden);
  const status = activeStatus(selected, chips);
  const shown = visibleDocs(rows, status, blank, query);

  function store(next: string[], clear: string) {
    setHiddenStatuses(next);
    writeJson(DOC_STATUS_KEY, next);
    if (clear && activeStatus(selected, [clear])) setSelected("");
  }

  return (
    <section className="c3-doc-status" aria-label={v3("dsTitle")} data-doc-status="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("dsSub")}</p>
          <h2 className="c3-title">{v3("dsTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("dsHint")}</p>
      <p className="c3-muted">{v3("dsLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "kyc")}>{v3("dsBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("dsLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("dsFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("dsNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-doc-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("dsBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("dsShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("dsShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("dsHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("dsTitle")}>
        <button type="button" className="c3-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("dsAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-doc-pair" data-status={item}>
            <button type="button" className="c3-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v3("dsShow") : v3("dsHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("dsSearch")}</span>
        <input className="c3-field" aria-label={v3("dsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("dsEmpty")}</p>}
      <ul className="c3-doc-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("dsBlank")}</p>
              {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("dsCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
