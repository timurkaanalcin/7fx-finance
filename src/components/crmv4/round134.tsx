"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  BROKER_KEY,
  LAMP_KEY,
  LAMP_VIEW_KEY,
  activeBay,
  activeBroker,
  addLamp,
  addView,
  bayArg,
  brokerLines,
  brokerShare,
  brokerText,
  brokersCsv,
  bulkLampHeld,
  bulkLampLit,
  dropView,
  editLamp,
  lampBays,
  lampCopy,
  lampText,
  lampCounts,
  lampShare,
  lampTags,
  lampTimeline,
  lampsCsv,
  leadingBroker,
  namedBrokers,
  readHiddenBrokers,
  readLamps,
  readViews,
  resetLamps,
  setLampHeld,
  setLampKept,
  setLampLit,
  setLampReviewed,
  toggleBroker,
  toggleLampPin,
  visibleBrokerCustomers,
  visibleBrokers,
  visibleLamps,
  type BrokerRow,
  type LampCard,
  type LampTray,
  type LampView,
} from "@/lib/crmv4/round134";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  brokerName?: string | null;
};

type GlanceRow = BrokerRow & { id: string };

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("lmpAuditSave");
  if (audit === "edit") return v4("lmpAuditEdit");
  if (audit === "pin") return v4("lmpAuditPin");
  if (audit === "unpin") return v4("lmpAuditUnpin");
  if (audit === "lit") return v4("lmpAuditLit");
  if (audit === "dark") return v4("lmpAuditDark");
  if (audit === "hold") return v4("lmpAuditHold");
  if (audit === "release") return v4("lmpAuditRelease");
  if (audit === "review") return v4("lmpAuditReview");
  if (audit === "clear") return v4("lmpAuditClear");
  if (audit === "keep") return v4("lmpAuditKeep");
  if (audit === "drop") return v4("lmpAuditDrop");
  return "";
}

function download(name: string, body: string) {
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function LampCards({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<LampCard[]>([]);
  const [views, setViews] = useState<LampView[]>([]);
  const [text, setText] = useState("");
  const [bay, setBay] = useState("");
  const [tag, setTag] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<LampTray>("dark");
  const [bayFilter, setBayFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const next = readLamps(readJson(LAMP_KEY, []));
    const saved = readViews(readJson(LAMP_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(LAMP_KEY, next);
    writeJson(LAMP_VIEW_KEY, saved);
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const tagName = (event.target as HTMLElement | null)?.tagName;
      if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const bays = lampBays(cards);
  const tags = lampTags(cards);
  const bayOn = activeBay(bayFilter, bays);
  const shown = visibleLamps(cards, tray, query, bayArg(bayOn), tagFilter, pinnedOnly);
  const timeline = lampTimeline(cards, query);
  const counts = lampCounts(cards);
  const total = cards.length;

  function store(next: LampCard[]) {
    setCards(next);
    writeJson(LAMP_KEY, next);
  }

  function storeViews(next: LampView[]) {
    setViews(next);
    writeJson(LAMP_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setBay("");
    setTag("");
  }

  function copyCard(card: LampCard) {
    const body = lampCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: LampView) {
    setTray(view.tray);
    setQuery(view.query);
    setBayFilter(activeBay(view.bay, lampBays(cards)));
    setTagFilter(view.tag);
    setBoard("cards");
    setPinnedOnly(false);
  }

  return (
    <section className="c4-lamp" aria-label={v4("lmpTitle")} data-lamp="1" data-folio="1">
      <header className="c4-lmp-head">
        <p className="c4-lmp-plate" data-logo="mono">{v4("lmpLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("lmpSub")}</p>
          <h2 className="c4-title">{v4("lmpTitle")}</h2>
        </div>
        <p className="c4-lmp-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("lmpHint")}</p>
      <p className="c4-meta">{v4("lmpLocal")}</p>
      <p className="c4-meta">{v4("lmpBlank")}</p>
      <p className="c4-meta">{v4("lmpBayBlank")}</p>
      <p className="c4-meta">{v4("lmpTagBlank")}</p>
      <p className="c4-meta">{v4("lmpEscape")}</p>
      <p className="c4-meta">{v4("lmpSlash")}</p>
      <p className="c4-lmp-notice" role="status">
        <span>{v4("lmpNotice")}</span>
        <span className="c4-lmp-count">{counts.pinnedDark}</span>
        <button type="button" className="c4-btn" aria-pressed={pinnedOnly} onClick={() => { setPinnedOnly((value) => !value); setTray("dark"); setBoard("cards"); }}>
          {pinnedOnly ? v4("lmpNoticeAll") : v4("lmpNoticeOpen")}
        </button>
      </p>
      <section className="c4-lmp-kpi" aria-label={v4("lmpKpi")}>
        <p className="c4-pay-kicker">{v4("lmpKpi")}</p>
        {(["dark", "lit", "held"] as const).map((key) => {
          const count = counts[key];
          const share = lampShare(count, total);
          const label = key === "dark" ? v4("lmpDark") : key === "lit" ? v4("lmpLit") : v4("lmpHeld");
          return (
            <p key={key} className="c4-lmp-meter">
              <span>{label}</span>
              <span>{count}</span>
              <span>{v4("lmpShare")} {share}%</span>
              <span className="c4-lmp-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <form className="c4-lmp-form" onSubmit={(event) => {
        event.preventDefault();
        const next = addLamp(cards, {
          id: `lmp-${Date.now().toString(36)}`,
          text,
          bay,
          tag,
          stamp: new Date().toISOString().slice(11, 16),
        });
        if (next.length === cards.length) return;
        store(next);
        clearDraft();
      }} onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("lmpText")}</span>
          <input className="c4-field" aria-label={v4("lmpText")} value={text} maxLength={100} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("lmpBay")}</span>
          <input className="c4-field" aria-label={v4("lmpBay")} value={bay} maxLength={12} onChange={(event) => setBay(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("lmpTag")}</span>
          <input className="c4-field" aria-label={v4("lmpTag")} value={tag} maxLength={16} onChange={(event) => setTag(event.target.value)} />
        </label>
        <div className="c4-row">
          <button type="submit" className="c4-btn">{v4("lmpAdd")}</button>
          <button type="button" className="c4-btn" onClick={() => download("lamp-cards.csv", lampsCsv(cards))}>{v4("lmpCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => store(bulkLampLit(cards, shown.map((card) => card.id), true))}>{v4("lmpBulkLight")}</button>
          <button type="button" className="c4-btn" onClick={() => store(bulkLampHeld(cards, shown.map((card) => card.id), true))}>{v4("lmpBulkHold")}</button>
          <button type="button" className="c4-btn" onClick={() => store(resetLamps())}>{v4("lmpReset")}</button>
        </div>
      </form>
      <form className="c4-lmp-form" onSubmit={(event) => {
        event.preventDefault();
        const next = addView(views, { id: `lmpv-${Date.now().toString(36)}`, name: viewName, tray, query, bay: bayOn, tag: tagFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("lmpViewName")}</span>
          <input className="c4-field" aria-label={v4("lmpViewName")} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("lmpSaveView")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("lmpViews")}>
        {!views.length && <p className="c4-meta">{v4("lmpViewEmpty")}</p>}
        {views.map((view) => (
          <span key={view.id} className="c4-lmp-view">
            <button type="button" className="c4-chip" onClick={() => applyView(view)}>{view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropView(views, view.id))}>{v4("lmpDropView")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("lmpSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("lmpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("lmpTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "dark" ? "1" : "0"} aria-pressed={tray === "dark"} onClick={() => { setTray("dark"); setBoard("cards"); }}>{v4("lmpDark")}</button>
        <button type="button" className="c4-chip" data-on={tray === "lit" ? "1" : "0"} aria-pressed={tray === "lit"} onClick={() => { setTray("lit"); setBoard("cards"); }}>{v4("lmpLit")}</button>
        <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} aria-pressed={tray === "held"} onClick={() => { setTray("held"); setBoard("cards"); }}>{v4("lmpHeld")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("lmpTimeline")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("lmpBays")}>
        <button type="button" className="c4-chip" data-on={bayOn === "all" ? "1" : "0"} aria-pressed={bayOn === "all"} onClick={() => setBayFilter("all")}>{v4("lmpAllBays")}</button>
        <button type="button" className="c4-chip" data-on={bayOn === "blank" ? "1" : "0"} aria-pressed={bayOn === "blank"} onClick={() => setBayFilter("blank")}>{v4("lmpBlankBay")}</button>
        {bays.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={bayOn === item ? "1" : "0"} aria-pressed={bayOn === item} onClick={() => setBayFilter(bayOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("lmpTags")}>
        <button type="button" className="c4-chip" data-on={!tagFilter ? "1" : "0"} aria-pressed={!tagFilter} onClick={() => setTagFilter("")}>{v4("lmpAllTags")}</button>
        {tags.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tagFilter === item ? "1" : "0"} aria-pressed={tagFilter === item} onClick={() => setTagFilter(tagFilter === item ? "" : item)}>{item}</button>
        ))}
      </div>
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("lmpEmpty")}</p>}
      {board === "timeline" && !timeline.length && <p className="c4-pay-empty">{v4("lmpEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-lmp-rows">
          {shown.map((card) => (
            <li key={card.id} data-pinned={card.pinned ? "1" : "0"} data-lit={card.lit ? "1" : "0"} data-held={card.held ? "1" : "0"} data-reviewed={card.reviewed ? "1" : "0"} data-kept={card.kept ? "1" : "0"}>
              <span className="c4-lmp-wick" aria-hidden="true" />
              <div>
                {editing === card.id ? (
                  <form className="c4-lmp-edit" onSubmit={(event) => {
                    event.preventDefault();
                    const next = editLamp(cards, card.id, draft);
                    store(next);
                    if (next.find((item) => item.id === card.id)?.text === lampText(draft)) {
                      setEditing("");
                      setDraft("");
                    }
                  }}>
                    <label className="c4-lab">
                      <span>{v4("lmpEdit")}</span>
                      <input className="c4-field" aria-label={v4("lmpEdit")} value={draft} maxLength={100} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
                        if (event.key !== "Escape") return;
                        event.preventDefault();
                        setEditing("");
                        setDraft("");
                      }} />
                    </label>
                    <button type="submit" className="c4-btn">{v4("lmpSaveEdit")}</button>
                  </form>
                ) : <p>{card.text}</p>}
                {card.bay ? <p className="c4-lmp-bay">{card.bay}</p> : null}
                {card.tag ? <p className="c4-lmp-tag">{card.tag}</p> : null}
                {card.stamp ? <p className="c4-meta">{v4("lmpStamp")} {card.stamp}</p> : null}
                {card.audit ? <p className="c4-meta">{v4("lmpAudit")} {auditName(v4, card.audit)}</p> : null}
              </div>
              <div className="c4-row">
                <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("lmpCopied") : v4("lmpCopy")}</button>
                <button type="button" className="c4-btn" onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("lmpEdit")}</button>
                <button type="button" className="c4-btn" aria-pressed={card.pinned} onClick={() => store(toggleLampPin(cards, card.id))}>{card.pinned ? v4("lmpUnpin") : v4("lmpPin")}</button>
                <button type="button" className="c4-btn" aria-pressed={card.lit} onClick={() => store(setLampLit(cards, card.id, !card.lit))}>{card.lit ? v4("lmpReturn") : v4("lmpLight")}</button>
                <button type="button" className="c4-btn" aria-pressed={card.held} onClick={() => store(setLampHeld(cards, card.id, !card.held))}>{card.held ? v4("lmpRelease") : v4("lmpHold")}</button>
                <button type="button" className="c4-btn" aria-pressed={card.reviewed} onClick={() => store(setLampReviewed(cards, card.id, !card.reviewed))}>{card.reviewed ? v4("lmpUnreview") : v4("lmpReview")}</button>
                <button type="button" className="c4-btn" aria-pressed={card.kept} onClick={() => store(setLampKept(cards, card.id, !card.kept))}>{card.kept ? v4("lmpDrop") : v4("lmpKeep")}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-lmp-time">
          {timeline.map((card) => (
            <li key={card.id}>
              <span className="c4-lmp-stamp">{card.stamp || "—"}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function BrokerNames({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenBrokers, setHiddenBrokers] = useState<string[]>([]);
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
      brokerName: row.brokerName,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = brokerLines(rows);
  const present = namedBrokers(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.brokerName)?.count || 0;
  const lead = leadingBroker(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenBrokers(readJson(BROKER_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenBrokers(next);
    writeJson(BROKER_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleBrokers(present, hiddenBrokers, showHidden);
  const brokerName = activeBroker(selected, chips);
  const shown = visibleBrokerCustomers(rows, brokerName, blank, query);

  function store(next: string[], clear: string) {
    setHiddenBrokers(next);
    writeJson(BROKER_KEY, next);
    if (clear && activeBroker(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-broker" aria-label={v4("bknTitle")} data-broker="1" data-folio="1">
      <header className="c4-bkn-head">
        <div>
          <p className="c4-pay-kicker">{v4("bknSub")}</p>
          <h2 className="c4-title">{v4("bknTitle")}</h2>
        </div>
        <p className="c4-lmp-count">{v4("bknRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("bknHint")}</p>
      <p className="c4-meta">{v4("bknLocal")}</p>
      <p className="c4-meta">{v4("bknEscape")}</p>
      {lead ? <p className="c4-bkn-lead"><span>{v4("bknLead")}</span> {lead}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("bknBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("broker-names.csv", brokersCsv(rows))}>{v4("bknCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("bknLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("bknFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("bknNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-bkn-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("bknBlank")}</span>
          <span className="c4-lmp-count">{blankCount}</span>
          <span className="c4-bkn-track" aria-hidden="true"><i style={{ width: `${brokerShare(blankCount, rows.length)}%` }} /></span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("bknShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("bknShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("bknHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("bknTitle")}>
        <button type="button" className="c4-chip" data-on={!brokerName && !blank ? "1" : "0"} aria-pressed={!brokerName && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("bknAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.brokerName === item)?.count || 0;
          const share = brokerShare(count, rows.length);
          return (
            <span key={item} className="c4-bkn-pair" data-broker={item}>
              <button type="button" className="c4-chip" data-on={brokerName === item ? "1" : "0"} aria-pressed={brokerName === item} onClick={() => { setBlank(false); setSelected(brokerName === item ? "" : item); }}>{item}</button>
              <span className="c4-lmp-count">{count}</span>
              <span className="c4-bkn-share">{v4("bknShare")} {share}%</span>
              <span className="c4-bkn-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleBroker(hiddenBrokers, item, present), showHidden ? "" : item)}>{showHidden ? v4("bknShow") : v4("bknHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("bknSearch")}</span>
        <input className="c4-field" aria-label={v4("bknSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("bknEmpty")}</p>}
      <ul className="c4-bkn-rows">
        {shown.map((row) => {
          const name = brokerText(row.brokerName);
          return (
            <li key={row.id} data-broker={name || "blank"}>
              <span className="c4-bkn-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("bknBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
