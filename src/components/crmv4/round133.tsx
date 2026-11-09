"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  BELL_KEY,
  GROUP_KEY,
  activeTradingGroup,
  addBell,
  bellCopy,
  bellsCsv,
  groupLines,
  groupShare,
  groupText,
  leadingGroup,
  namedGroups,
  readBells,
  readHiddenGroups,
  resetBells,
  setBellHeld,
  setBellRung,
  toggleBellPin,
  toggleGroup,
  visibleBells,
  visibleGroupCustomers,
  visibleGroups,
  type BellSlip,
  type BellTray,
  type GroupRow,
} from "@/lib/crmv4/round133";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  tradingGroup?: string | null;
};

type GlanceRow = GroupRow & { id: string };

export function BellSlips({ v4 }: { v4: V4 }) {
  const [slips, setSlips] = useState<BellSlip[]>([]);
  const [text, setText] = useState("");
  const [floor, setFloor] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<BellTray>("waiting");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const next = readBells(readJson(BELL_KEY, []));
    setSlips(next);
    writeJson(BELL_KEY, next);
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
  const shown = visibleBells(slips, tray, query);

  function store(next: BellSlip[]) {
    setSlips(next);
    writeJson(BELL_KEY, next);
  }

  function clearDraft() {
    setText("");
    setFloor("");
  }

  function exportCsv() {
    const blob = new Blob([bellsCsv(slips)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bell-slips.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function copySlip(slip: BellSlip) {
    const body = bellCopy(slip.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(slip.id);
  }

  return (
    <section className="c4-bell" aria-label={v4("bllTitle")} data-bell="1" data-folio="1">
      <header className="c4-bll-head">
        <p className="c4-bll-plate" data-logo="mono">{v4("bllLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("bllSub")}</p>
          <h2 className="c4-title">{v4("bllTitle")}</h2>
        </div>
        <p className="c4-bll-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("bllHint")}</p>
      <p className="c4-meta">{v4("bllLocal")}</p>
      <p className="c4-meta">{v4("bllBlank")}</p>
      <p className="c4-meta">{v4("bllFloorBlank")}</p>
      <p className="c4-meta">{v4("bllEscape")}</p>
      <p className="c4-meta">{v4("bllSlash")}</p>
      <form className="c4-bll-form" onSubmit={(event) => {
        event.preventDefault();
        const next = addBell(slips, { id: `bll-${slips.length}-${text.trim().slice(0, 8) || "slip"}`, text, floor });
        if (next.length === slips.length) return;
        store(next);
        clearDraft();
      }} onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("bllText")}</span>
          <input className="c4-field" aria-label={v4("bllText")} value={text} maxLength={100} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("bllFloor")}</span>
          <input className="c4-field" aria-label={v4("bllFloor")} value={floor} maxLength={12} onChange={(event) => setFloor(event.target.value)} />
        </label>
        <div className="c4-row">
          <button type="submit" className="c4-btn">{v4("bllAdd")}</button>
          <button type="button" className="c4-btn" onClick={exportCsv}>{v4("bllCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => store(resetBells())}>{v4("bllReset")}</button>
        </div>
      </form>
      <label className="c4-lab">
        <span>{v4("bllSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("bllSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("bllTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "waiting" ? "1" : "0"} aria-pressed={tray === "waiting"} onClick={() => setTray("waiting")}>{v4("bllWaiting")}</button>
        <button type="button" className="c4-chip" data-on={tray === "rung" ? "1" : "0"} aria-pressed={tray === "rung"} onClick={() => setTray("rung")}>{v4("bllRung")}</button>
        <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} aria-pressed={tray === "held"} onClick={() => setTray("held")}>{v4("bllHeld")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("bllEmpty")}</p>}
      <ul className="c4-bll-rows">
        {shown.map((slip) => (
          <li key={slip.id} data-pinned={slip.pinned ? "1" : "0"} data-rung={slip.rung ? "1" : "0"} data-held={slip.held ? "1" : "0"}>
            <span className="c4-bll-tab" aria-hidden="true" />
            <div>
              <p>{slip.text}</p>
              {slip.floor ? <p className="c4-bll-floor">{slip.floor}</p> : null}
            </div>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => copySlip(slip)}>{copied === slip.id ? v4("bllCopied") : v4("bllCopy")}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleBellPin(slips, slip.id))}>{slip.pinned ? v4("bllUnpin") : v4("bllPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setBellRung(slips, slip.id, !slip.rung))}>{slip.rung ? v4("bllUnring") : v4("bllRing")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setBellHeld(slips, slip.id, !slip.held))}>{slip.held ? v4("bllRelease") : v4("bllHold")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TradingGroups({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenGroups, setHiddenGroups] = useState<string[]>([]);
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
      tradingGroup: row.tradingGroup,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = groupLines(rows);
  const present = namedGroups(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.tradingGroup)?.count || 0;
  const lead = leadingGroup(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenGroups(readJson(GROUP_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenGroups(next);
    writeJson(GROUP_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleGroups(present, hiddenGroups, showHidden);
  const tradingGroup = activeTradingGroup(selected, chips);
  const shown = visibleGroupCustomers(rows, tradingGroup, blank, query);

  function store(next: string[], clear: string) {
    setHiddenGroups(next);
    writeJson(GROUP_KEY, next);
    if (clear && activeTradingGroup(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-trgroup" aria-label={v4("tgrTitle")} data-trgroup="1" data-folio="1">
      <header className="c4-tgr-head">
        <div>
          <p className="c4-pay-kicker">{v4("tgrSub")}</p>
          <h2 className="c4-title">{v4("tgrTitle")}</h2>
        </div>
        <p className="c4-bll-count">{v4("tgrRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("tgrHint")}</p>
      <p className="c4-meta">{v4("tgrLocal")}</p>
      <p className="c4-meta">{v4("tgrEscape")}</p>
      {lead ? <p className="c4-tgr-lead"><span>{v4("tgrLead")}</span> {lead}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("tgrBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("tgrLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("tgrFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("tgrNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-tgr-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("tgrBlank")}</span>
          <span className="c4-bll-count">{blankCount}</span>
          <span className="c4-tgr-track" aria-hidden="true"><i style={{ width: `${groupShare(blankCount, rows.length)}%` }} /></span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("tgrShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("tgrShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("tgrHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("tgrTitle")}>
        <button type="button" className="c4-chip" data-on={!tradingGroup && !blank ? "1" : "0"} aria-pressed={!tradingGroup && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("tgrAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.tradingGroup === item)?.count || 0;
          const share = groupShare(count, rows.length);
          return (
            <span key={item} className="c4-tgr-pair" data-trgroup={item}>
              <button type="button" className="c4-chip" data-on={tradingGroup === item ? "1" : "0"} aria-pressed={tradingGroup === item} onClick={() => { setBlank(false); setSelected(tradingGroup === item ? "" : item); }}>{item}</button>
              <span className="c4-bll-count">{count}</span>
              <span className="c4-tgr-share">{v4("tgrShare")} {share}%</span>
              <span className="c4-tgr-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleGroup(hiddenGroups, item, present), showHidden ? "" : item)}>{showHidden ? v4("tgrShow") : v4("tgrHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("tgrSearch")}</span>
        <input className="c4-field" aria-label={v4("tgrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("tgrEmpty")}</p>}
      <ul className="c4-tgr-rows">
        {shown.map((row) => {
          const name = groupText(row.tradingGroup);
          return (
            <li key={row.id} data-trgroup={name || "blank"}>
              <span className="c4-tgr-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("tgrBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
