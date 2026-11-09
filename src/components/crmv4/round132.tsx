"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  PORTER_KEY,
  VALIDATION_KEY,
  activeValidation,
  addSlip,
  leadingValidation,
  namedValidations,
  readHiddenValidations,
  readSlips,
  resetSlips,
  setSlipCalled,
  setSlipHidden,
  slipCopy,
  slipsCsv,
  toggleSlipPin,
  toggleValidation,
  validationLines,
  validationShare,
  validationText,
  visibleCustomers,
  visibleSlips,
  visibleValidations,
  type Slip,
  type SlipTray,
  type ValidationRow,
} from "@/lib/crmv4/round132";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  validationStatus?: string | null;
};

type GlanceRow = ValidationRow & { id: string };

export function PorterSlips({ v4 }: { v4: V4 }) {
  const [slips, setSlips] = useState<Slip[]>([]);
  const [text, setText] = useState("");
  const [wing, setWing] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<SlipTray>("open");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const next = readSlips(readJson(PORTER_KEY, []));
    setSlips(next);
    writeJson(PORTER_KEY, next);
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const shown = visibleSlips(slips, tray, query);

  function store(next: Slip[]) {
    setSlips(next);
    writeJson(PORTER_KEY, next);
  }

  function clearDraft() {
    setText("");
    setWing("");
  }

  function exportCsv() {
    const blob = new Blob([slipsCsv(slips)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "porter-slips.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function copySlip(slip: Slip) {
    const body = slipCopy(slip.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(slip.id);
  }

  return (
    <section className="c4-porter" aria-label={v4("prtTitle")} data-porter="1" data-folio="1">
      <header className="c4-prt-head">
        <p className="c4-prt-plate" data-logo="mono">{v4("prtLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("prtSub")}</p>
          <h2 className="c4-title">{v4("prtTitle")}</h2>
        </div>
        <p className="c4-prt-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("prtHint")}</p>
      <p className="c4-meta">{v4("prtLocal")}</p>
      <p className="c4-meta">{v4("prtBlank")}</p>
      <p className="c4-meta">{v4("prtWingBlank")}</p>
      <p className="c4-meta">{v4("prtEscape")}</p>
      <p className="c4-meta">{v4("prtSlash")}</p>
      <form className="c4-prt-form" onSubmit={(event) => {
        event.preventDefault();
        const next = addSlip(slips, { id: `prt-${slips.length}-${text.trim().slice(0, 8) || "slip"}`, text, wing });
        if (next.length === slips.length) return;
        store(next);
        clearDraft();
      }} onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("prtText")}</span>
          <input className="c4-field" aria-label={v4("prtText")} value={text} maxLength={100} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("prtWing")}</span>
          <input className="c4-field" aria-label={v4("prtWing")} value={wing} maxLength={12} onChange={(event) => setWing(event.target.value)} />
        </label>
        <div className="c4-row">
          <button type="submit" className="c4-btn">{v4("prtAdd")}</button>
          <button type="button" className="c4-btn" onClick={exportCsv}>{v4("prtCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => store(resetSlips())}>{v4("prtReset")}</button>
        </div>
      </form>
      <label className="c4-lab">
        <span>{v4("prtSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("prtSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("prtTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("prtOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "called" ? "1" : "0"} aria-pressed={tray === "called"} onClick={() => setTray("called")}>{v4("prtCalled")}</button>
        <button type="button" className="c4-chip" data-on={tray === "hidden" ? "1" : "0"} aria-pressed={tray === "hidden"} onClick={() => setTray("hidden")}>{v4("prtHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("prtEmpty")}</p>}
      <ul className="c4-prt-rows">
        {shown.map((slip) => (
          <li key={slip.id} data-pinned={slip.pinned ? "1" : "0"} data-called={slip.called ? "1" : "0"}>
            <span className="c4-prt-tab" aria-hidden="true" />
            <div>
              <p>{slip.text}</p>
              {slip.wing ? <p className="c4-prt-wing">{slip.wing}</p> : null}
            </div>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => copySlip(slip)}>{copied === slip.id ? v4("prtCopied") : v4("prtCopy")}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleSlipPin(slips, slip.id))}>{slip.pinned ? v4("prtUnpin") : v4("prtPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setSlipCalled(slips, slip.id, !slip.called))}>{slip.called ? v4("prtUncall") : v4("prtCall")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setSlipHidden(slips, slip.id, !slip.hidden))}>{slip.hidden ? v4("prtShow") : v4("prtHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ValidationStatuses({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenValidations, setHiddenValidations] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || row.email || "").trim(),
      validation: row.validationStatus,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = validationLines(rows);
  const present = namedValidations(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.validation)?.count || 0;
  const lead = leadingValidation(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenValidations(readJson(VALIDATION_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenValidations(next);
    writeJson(VALIDATION_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleValidations(present, hiddenValidations, showHidden);
  const validation = activeValidation(selected, chips);
  const shown = visibleCustomers(rows, validation, blank, query);

  function store(next: string[], clear: string) {
    setHiddenValidations(next);
    writeJson(VALIDATION_KEY, next);
    if (clear && activeValidation(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-validation" aria-label={v4("vldTitle")} data-validation="1" data-folio="1">
      <header className="c4-vld-head">
        <div>
          <p className="c4-pay-kicker">{v4("vldSub")}</p>
          <h2 className="c4-title">{v4("vldTitle")}</h2>
        </div>
        <p className="c4-prt-count">{v4("vldRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("vldHint")}</p>
      <p className="c4-meta">{v4("vldLocal")}</p>
      <p className="c4-meta">{v4("vldEscape")}</p>
      {lead ? <p className="c4-vld-lead"><span>{v4("vldLead")}</span> {lead}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("vldBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("vldLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("vldFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("vldNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-vld-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("vldBlank")}</span>
          <span className="c4-prt-count">{blankCount}</span>
          <span className="c4-vld-track" aria-hidden="true"><i style={{ width: `${validationShare(blankCount, rows.length)}%` }} /></span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("vldShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("vldShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("vldHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("vldTitle")}>
        <button type="button" className="c4-chip" data-on={!validation && !blank ? "1" : "0"} aria-pressed={!validation && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("vldAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.validation === item)?.count || 0;
          const share = validationShare(count, rows.length);
          return (
            <span key={item} className="c4-vld-pair" data-validation={item}>
              <button type="button" className="c4-chip" data-on={validation === item ? "1" : "0"} aria-pressed={validation === item} onClick={() => { setBlank(false); setSelected(validation === item ? "" : item); }}>{item}</button>
              <span className="c4-prt-count">{count}</span>
              <span className="c4-vld-share">{v4("vldShare")} {share}%</span>
              <span className="c4-vld-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleValidation(hiddenValidations, item, present), showHidden ? "" : item)}>{showHidden ? v4("vldShow") : v4("vldHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("vldSearch")}</span>
        <input className="c4-field" aria-label={v4("vldSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("vldEmpty")}</p>}
      <ul className="c4-vld-rows">
        {shown.map((row) => {
          const name = validationText(row.validation);
          return (
            <li key={row.id} data-validation={name || "blank"}>
              <span className="c4-vld-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("vldBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
