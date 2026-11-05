"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round94";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Document = {
  id: string;
  name?: string | null;
  status?: string | null;
  userId?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

type GlanceRow = StatusRow & { id: string; userId: string };

export function FilterPresets({ v4 }: { v4: V4 }) {
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
    <section className="c4-filter-presets" aria-label={v4("fpTitle")} data-filter-presets="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("fpSub")}</p>
          <h2 className="c4-title">{v4("fpTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("fpHint")}</p>
      <p className="c4-meta">{v4("fpLocal")}</p>
      <label className="c4-lab">
        <span>{v4("fpSearch")}</span>
        <input className="c4-field" aria-label={v4("fpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("fpMarked")}>
        <button type="button" className="c4-chip" data-on={marked ? "1" : "0"} aria-pressed={marked} onClick={() => setMarked((value) => !value)}>{v4("fpMarked")}</button>
      </div>
      <form className="c4-row" onSubmit={(event) => {
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
        <label className="c4-lab">
          <span>{v4("fpName")}</span>
          <input className="c4-field" aria-label={v4("fpName")} value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("fpSave")}</button>
      </form>
      <p className="c4-meta">{v4("fpBlank")}</p>
      <div className="c4-row" role="group" aria-label={v4("fpShown")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("fpShown")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("fpHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("fpEmpty")}</p>}
      <ul className="c4-preset-list">
        {shown.map((preset) => {
          const filters = boardFilters(preset.filters);
          return (
            <li key={preset.id} className="c4-preset-card" data-pinned={preset.pinned ? "1" : "0"}>
              <p>{preset.name}</p>
              <p className="c4-meta">{filters.q || filters.marked ? `${filters.q || ""} ${filters.marked ? v4("fpMarked") : ""}`.trim() : v4("fpNone")}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" onClick={() => apply(preset)}>{v4("fpApply")}</button>
                <button type="button" className="c4-btn" onClick={() => store(togglePresetPin(presets, preset.id))}>{preset.pinned ? v4("fpUnpin") : v4("fpPin")}</button>
                <button type="button" className="c4-btn" onClick={() => store(setPresetHidden(presets, preset.id, !preset.hidden))}>{preset.hidden ? v4("fpShow") : v4("fpHide")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function DocStatusGlance({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ documents?: Document[] }>("/api/admin/documents?take=40");
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
      label: String(row.user?.name || row.user?.email || row.name || ""),
      userId: String(row.user?.id || row.userId || "").trim(),
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
    <section className="c4-doc-status" aria-label={v4("dsTitle")} data-doc-status="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("dsSub")}</p>
          <h2 className="c4-title">{v4("dsTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("dsHint")}</p>
      <p className="c4-meta">{v4("dsLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "kyc")}>{v4("dsBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("dsLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("dsFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("dsNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-doc-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("dsBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("dsShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("dsShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("dsHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("dsTitle")}>
        <button type="button" className="c4-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("dsAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-doc-pair" data-status={item}>
            <button type="button" className="c4-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v4("dsShow") : v4("dsHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("dsSearch")}</span>
        <input className="c4-field" aria-label={v4("dsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("dsEmpty")}</p>}
      <ul className="c4-doc-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("dsBlank")}</p>
              {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("dsCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
