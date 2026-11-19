"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DBK_DENSITY_KEY,
  DBK_KEY,
  DBK_PARTS,
  DBK_VIEW_KEY,
  DYC_KEY,
  DYC_REVIEW_KEY,
  addDeadbeat,
  addDeadbeatTag,
  addDeadbeatView,
  briskDeadbeat,
  bulkDeadbeatGraphite,
  bulkDeadbeatTag,
  bulkDeadbeatCase,
  bulkDeadbeatBank,
  bulkDiptychReview,
  busiestKeeper,
  dropDeadbeatView,
  editDeadbeat,
  editDeadbeatNote,
  fairKeeper,
  idleDeadbeat,
  washFocused,
  deadbeatBars,
  deadbeatCopy,
  deadbeatCounts,
  deadbeatCsv,
  deadbeatDensity,
  deadbeatInner,
  deadbeatKeepers,
  deadbeatOuter,
  deadbeatTimeline,
  laneDiptychCount,
  lateDeadbeat,
  leadingDiptych,
  leadingDiptychHue,
  raiseToothFocused,
  lowerLockFocused,
  lowerToothFocused,
  moveDeadbeatFocus,
  overdueDeadbeat,
  latchDeadbeatFocused,
  diptychCopy,
  diptychDigit,
  diptychEven,
  diptychFamily,
  diptychFirst,
  diptychScore,
  diptychHeld,
  diptychHue,
  diptychLane,
  diptychLanes,
  diptychLanesCsv,
  diptychLength,
  diptychLetter,
  diptychLower,
  diptychMixed,
  diptychOpen,
  diptychRowsCsv,
  diptychShare,
  diptychSlash,
  diptychSpace,
  diptychStamp,
  diptychTail,
  diptychUpper,
  diptychVowel,
  presentDiptychLanes,
  raiseLockFocused,
  readHiddenDiptych,
  readDeadbeatRules,
  readDeadbeatViews,
  readReviewedDiptych,
  reminderDeadbeatRules,
  restingDeadbeat,
  setDeadbeatFocused,
  setDeadbeatLatch,
  setDeadbeatWash,
  setDeadbeatStar,
  setDeadbeatCase,
  setDeadbeatBank,
  sortDeadbeatRules,
  starDeadbeatFocused,
  suggestWash,
  suggestPart,
  suggestTooth,
  toggleDiptych,
  toggleDiptychReview,
  visibleDeadbeatRules,
  visibleDiptych,
  visibleDiptychLanes,
  type Deadbeat,
  type DeadbeatDensity,
  type DeadbeatSort,
  type DeadbeatTray,
  type DeadbeatView,
  type DiptychReview,
  type DiptychRow,
  type DiptychShape,
  type DiptychValue,
} from "@/lib/crmv4/round326";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const WASHES = ["GILT", "IVORY", "GRAPHITE"] as const;
const TEETH = ["5", "10", "15", "20"] as const;
const LOCKS = ["3", "6", "12"] as const;

const PART_KEY: Record<string, CrmV4CopyKey> = {
  anchor: "dbkAnchor",
  fork: "dbkFork",
  jewel: "dbkJewel",
  wheel: "dbkWheel",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "dbkAuditSave",
  edit: "dbkAuditEdit",
  note: "dbkAuditNote",
  wash: "dbkAuditWash",
  bank: "dbkAuditBank",
  free: "dbkAuditFree",
  latch: "dbkAuditLatch",
  return: "dbkAuditReturn",
  case: "dbkAuditCase",
  open: "dbkAuditOpen",
  tag: "dbkAuditTag",
  lock: "dbkAuditLock",
  tooth: "dbkAuditTooth",
  lower: "dbkAuditLower",
  star: "dbkAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  locale: "dycLocale",
  slash: "dycSlash",
  score: "dycScore",
  tile: "dycTile",
  scroll: "dycScroll",
  index: "dycIndex",
  vowel: "dycVowel",
  plain: "dycPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "dycChampagne",
  ivory: "dycIvory",
  graphite: "dycGraphite",
};

const SHAPE_KEY: Record<DiptychShape, CrmV4CopyKey> = {
  all: "dycShapeAll",
  locale: "dycShapeLocale",
  slash: "dycShapeSlash",
  score: "dycShapeScore",
  tile: "dycShapeTile",
  scroll: "dycShapeScroll",
  index: "dycShapeIndex",
  vowel: "dycShapeVowel",
  plain: "dycShapePlain",
  open: "dycShapeOpen",
  soon: "dycShapeOpen",
  letter: "dycShapePlain",
  mixed: "dycShapeIndex",
  upper: "dycShapeLocale",
  lower: "dycShapePlain",
  space: "dycShapeScore",
  even: "dycShapeEven",
  odd: "dycShapeEven",
  tail: "dycShapeIndex",
  first: "dycShapePlain",
  held: "dycShapeScroll",
};

function download(name: string, body: string) {
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function typingTarget(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function textField(raw: unknown): string {
  return String(raw ?? "").replace(/\s+/g, " ").trim();
}

function partLabel(v4: V4, part: string): string {
  const key = PART_KEY[part];
  return key ? v4(key) : v4("dbkBlankPart");
}

function washLabel(v4: V4, wash: string): string {
  if (wash === "GILT") return v4("dbkGilt");
  if (wash === "IVORY") return v4("dbkIvory");
  if (wash === "GRAPHITE") return v4("dbkGraphite");
  return v4("dbkAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("dycBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("dycBlank");
}

export function DeadbeatRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Deadbeat[]>([]);
  const [views, setViews] = useState<DeadbeatView[]>([]);
  const [density, setDensity] = useState<DeadbeatDensity>("airy");
  const [tray, setTray] = useState<DeadbeatTray>("bench");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("");
  const [washFilter, setWashFilter] = useState("all");
  const [partFilter, setPartFilter] = useState("all");
  const [toothFilter, setToothFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<DeadbeatSort>("part");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [part, setPart] = useState("");
  const [wash, setWash] = useState("");
  const [toothNo, setToothNo] = useState("");
  const [lockNo, setLockNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [station, setStation] = useState("anchor");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readDeadbeatRules(readJson(DBK_KEY, [])));
    setViews(readDeadbeatViews(readJson(DBK_VIEW_KEY, [])));
    setDensity(deadbeatDensity(readJson(DBK_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Deadbeat[]) {
    setCards(next);
    writeJson(DBK_KEY, next);
  }
  function storeViews(next: DeadbeatView[]) {
    setViews(next);
    writeJson(DBK_VIEW_KEY, next);
  }
  function storeDensity(next: DeadbeatDensity) {
    setDensity(next);
    writeJson(DBK_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortDeadbeatRules(visibleDeadbeatRules(cards, tray, query, keeperFilter, washFilter, partFilter, toothFilter, lockFilter), sort),
    [cards, tray, query, keeperFilter, washFilter, partFilter, toothFilter, lockFilter, sort],
  );
  const counts = deadbeatCounts(cards, shown, station);
  const bars = deadbeatBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = deadbeatTimeline(cards);
  const reminders = reminderDeadbeatRules(cards);
  const keepers = deadbeatKeepers(cards);
  const busy = busiestKeeper(cards);
  const fair = fairKeeper(cards, keepers.join(","));
  const suggestedWash = suggestWash(cards);
  const suggestedTooth = suggestTooth(cards, clock);
  const suggestedPart = suggestPart(clock);
  const focused = shown[Math.min(focusAt, Math.max(0, shown.length - 1))];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "/" && !typingTarget(event)) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (typingTarget(event) || viewer) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("deadbeat-rules.csv", deadbeatCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveDeadbeatFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveDeadbeatFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addDeadbeat(cards, { title, note, keeper, part, tooth: toothNo, wash, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-deadbeat" aria-label={v4("dbkTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-deadbeat-mast">
        <p className="c4-deadbeat-seal" data-logo="mono">{v4("dbkLogo")}</p>
        <div>
          <p className="c4-deadbeat-kicker">{v4("dbkSub")}</p>
          <h2 className="c4-title">{v4("dbkTitle")}</h2>
        </div>
        <p className="c4-deadbeat-count">{shown.length}</p>
      </header>
      <p className="c4-deadbeat-links">
        <Link href={crmv4Href(base, "dyc")}>{v4("dycTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("dbkCustomers")}</Link>
      </p>
      <p className="c4-deadbeat-hint">{v4("dbkHint")}</p>
      {viewer && <p className="c4-deadbeat-note">{v4("dbkViewer")}</p>}
      <p className="c4-deadbeat-meta">{v4("dbkFair")} {fair || "—"} · {v4("dbkBusy")} {busy || "—"} · {v4("dbkSuggest")} {partLabel(v4, suggestedPart)} · {washLabel(v4, suggestedWash)} · {suggestedTooth}</p>
      <ol className="c4-deadbeat-index" aria-label={v4("dbkRemind")}>
        <li data-tone="gold">{v4("dbkOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("dbkIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("dbkBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("dbkResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-deadbeat-remind c4-deadbeat-notices" role="status" aria-label={v4("dbkRemind")}>
          {reminders.map((name) => <li key={name}>{v4("dbkOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-deadbeat-chart" aria-label={v4("dbkChart")}>
        {bars.map((bar) => (
          <button key={bar.part} type="button" className="c4-deadbeat-column" data-on={partFilter === bar.part ? "1" : "0"} onClick={() => setPartFilter(partFilter === bar.part ? "all" : bar.part)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{partLabel(v4, bar.part)}</span>
          </button>
        ))}
      </div>
      <form className="c4-deadbeat-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("dbkEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("dbkEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("dbkNote")}<input className="c4-field" aria-label={v4("dbkNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("dbkKeeper")}<input className="c4-field" aria-label={v4("dbkKeeper")} aria-required={false} value={keeper} maxLength={24} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} /></label>
        <label className="c4-lab">{v4("dbkAnchor")}<select className="c4-field" aria-label={v4("dbkAnchor")} value={part} disabled={viewer} onChange={(event) => setPart(event.target.value)}><option value="">{v4("dbkBlankPart")}</option>{DBK_PARTS.map((item) => <option key={item} value={item}>{partLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("dbkWash")}<select className="c4-field" aria-label={v4("dbkWash")} value={wash} disabled={viewer} onChange={(event) => setWash(event.target.value)}><option value="">{v4("dbkAll")}</option>{WASHES.map((item) => <option key={item} value={item}>{washLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("dbkTooth")}<select className="c4-field" aria-label={v4("dbkTooth")} value={toothNo} disabled={viewer} onChange={(event) => setToothNo(event.target.value)}><option value="">{v4("dbkAll")}</option>{TEETH.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("dbkLock")}<select className="c4-field" aria-label={v4("dbkLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("dbkAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("dbkTag")}<input className="c4-field" aria-label={v4("dbkTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("dbkAdd")}</button>
      </form>
      <div className="c4-deadbeat-tools">
        <input ref={searchRef} className="c4-field c4-deadbeat-search" aria-label={v4("dbkSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("dbkSearch")} />
        {(["bench", "latch", "case"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bench" ? "dbkBench" : item === "latch" ? "dbkLatch" : "dbkCase")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={partFilter === "inner" ? "1" : "0"} onClick={() => setPartFilter(partFilter === "inner" ? "all" : "inner")}>{v4("dbkInner")}</button>
        <button type="button" className="c4-chip" data-on={partFilter === "outer" ? "1" : "0"} onClick={() => setPartFilter(partFilter === "outer" ? "all" : "outer")}>{v4("dbkOuter")}</button>
        {WASHES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={washFilter === item ? "1" : "0"} onClick={() => setWashFilter(washFilter === item ? "all" : item)}>{washLabel(v4, item)}</button>
        ))}
        {TEETH.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toothFilter === item ? "1" : "0"} onClick={() => setToothFilter(toothFilter === item ? "all" : item)}>{item}</button>
        ))}
        {LOCKS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={lockFilter === item ? "1" : "0"} onClick={() => setLockFilter(lockFilter === item ? "all" : item)}>{item}</button>
        ))}
        {keepers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={keeperFilter === name ? "1" : "0"} onClick={() => setKeeperFilter(keeperFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort(sort === "keeper" ? "part" : "keeper")}>{sort === "keeper" ? v4("dbkSortKeeper") : v4("dbkSortPart")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("dbkClose") : v4("dbkAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("dbkTimeline")}</button>
        <label className="c4-lab">{v4("dbkDesk")}<select className="c4-field" aria-label={v4("dbkDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{DBK_PARTS.map((item) => <option key={item} value={item}>{partLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-deadbeat-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addDeadbeatView(views, { id, name: viewName, tray, query, keeper: keeperFilter, wash: washFilter, part: partFilter, tooth: toothFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("dbkViewName")}<input className="c4-field" aria-label={v4("dbkViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("dbkSaveView")}</button>
      </form>
      <ul className="c4-deadbeat-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setKeeperFilter(view.keeper); setWashFilter(view.wash); setPartFilter(view.part); setToothFilter(view.tooth); setLockFilter(view.lock); }}>{v4("dbkApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropDeadbeatView(views, view.id))}>{v4("dbkDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-deadbeat-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDeadbeatBank(cards, picked))}>{v4("dbkBulkBank")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDeadbeatCase(cards, picked))}>{v4("dbkBulkCase")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDeadbeatGraphite(cards, picked))}>{v4("dbkBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDeadbeatTag(cards, picked))}>{v4("dbkBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("deadbeat-rules.csv", deadbeatCsv(shown, station))}>{v4("dbkCsv")}</button>
        <p className="c4-deadbeat-meta">{v4("dbkKeys")} / n x a j k · {v4("dbkQuiet")} {counts.quiet} · {v4("dbkInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-deadbeat-time" aria-label={v4("dbkTimeline")}>
          {timeline.map((lane) => <li key={lane.tooth}><span>{lane.tooth}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("dbkEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-deadbeat-list">
          {shown.map((card) => {
            const late = lateDeadbeat(card, station);
            return (
              <li key={card.id} className="c4-deadbeat-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleDeadbeat(card) ? "1" : "0"} data-brisk={briskDeadbeat(card) ? "1" : "0"} data-overdue={overdueDeadbeat(card) ? "1" : "0"} data-resting={restingDeadbeat(card) ? "1" : "0"} data-inner={deadbeatInner(card.part) ? "1" : "0"} data-outer={deadbeatOuter(card.part) ? "1" : "0"}>
                <label className="c4-deadbeat-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editDeadbeat(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("dbkEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("dbkApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editDeadbeatNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("dbkNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-deadbeat-meta">{partLabel(v4, card.part)} · {washLabel(v4, card.wash)} · {card.tooth ?? "—"} · {card.lock} · {card.keeper || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "dbkAuditSave")}` : ""}{late ? ` · ${v4("dbkOverdue")}` : ""}</p>
                </div>
                <div className="c4-deadbeat-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("dbkEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDeadbeatBank(cards, card.id, !card.banked))}>{card.banked ? v4("dbkFree") : v4("dbkBank")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDeadbeatWash(cards, card.id, suggestedWash))}>{v4("dbkSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDeadbeatLatch(cards, card.id, !card.latched))}>{card.latched ? v4("dbkUnlatch") : v4("dbkLatchIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDeadbeatCase(cards, card.id, !card.cased))}>{card.cased ? v4("dbkUncase") : v4("dbkCaseIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDeadbeatStar(cards, card.id, !card.starred))}>{card.starred ? v4("dbkUnstar") : v4("dbkStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addDeadbeatTag(cards, card.id, "d"))}>{v4("dbkTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseToothFocused(cards, card.id))}>{v4("dbkRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerToothFocused(cards, card.id))}>{v4("dbkLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseLockFocused(cards, card.id))}>{v4("dbkLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerLockFocused(cards, card.id))}>{v4("dbkLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(washFocused(cards, card.id))}>{v4("dbkWash")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDeadbeatFocused(cards, card.id))}>{v4("dbkBank")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(latchDeadbeatFocused(cards, card.id))}>{v4("dbkLatch")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starDeadbeatFocused(cards, card.id))}>{v4("dbkStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(deadbeatCopy(card))}>{v4("dbkCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type DiptychUser = { id?: string; name?: string | null; language?: string | null };

export function DiptychPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: DiptychUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<DiptychShape>("all");
  const [review, setReview] = useState<DiptychReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): DiptychRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { language: textField(row.language) } satisfies DiptychValue,
    };
  }).filter((row): row is DiptychRow => Boolean(row));
  const present = presentDiptychLanes(rows);
  const presentKey = present.join("\n");
  const idKey = rows.map((row) => row.id).join("\n");

  useEffect(() => {
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readHiddenDiptych(readJson(DYC_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(DYC_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedDiptych(readJson(DYC_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(DYC_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleDiptychLanes(present, hidden, showHidden);
  const shown = visibleDiptych(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = diptychLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = diptychLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingDiptych(rows);
  const leadHue = leadingDiptychHue(rows);
  const whole = rows.filter((row) => diptychLane(row.code)).length;
  const share = diptychShare(laneDiptychCount(rows, "locale"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("diptych-lanes.csv", diptychLanesCsv(rows));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((row) => row.id));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows, shown]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(DYC_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(DYC_REVIEW_KEY, next);
  }

  return (
    <section className="c4-diptych" aria-label={v4("dycTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-diptych-mast">
        <p className="c4-diptych-seal" data-logo="mono">{v4("dycLogo")}</p>
        <div>
          <p className="c4-diptych-kicker">{v4("dycSub")}</p>
          <h2 className="c4-title">{v4("dycTitle")}</h2>
        </div>
        <p className="c4-diptych-count">{shown.length}</p>
      </header>
      <p className="c4-diptych-links">
        <Link href={crmv4Href(base, "dbk")}>{v4("dbkTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("dycCustomer")}</Link>
      </p>
      <p className="c4-diptych-hint">{v4("dycHint")}</p>
      {viewer && <p className="c4-diptych-note">{v4("dycViewer")}</p>}
      <p className="c4-diptych-meta">{v4("dycLead")} {laneLabel(v4, lead)} · {v4("dycToneLead")} {hueLabel(v4, leadHue)} · {v4("dycShare")} {share}</p>
      <div className="c4-diptych-chart" aria-label={v4("dycChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-diptych-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-diptych-tools">
        <input ref={searchRef} className="c4-field c4-diptych-search" aria-label={v4("dycSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("dycSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("dycShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "dycAll" : item === "reviewed" ? "dycReviewed" : "dycFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("dycAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as DiptychShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleDiptych(hidden, item))}>{hidden.includes(item) ? v4("dycShow") : v4("dycHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-diptych-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkDiptychReview(reviewed, picked, true))}>{v4("dycBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkDiptychReview(reviewed, picked, false))}>{v4("dycBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("diptych-lanes.csv", diptychLanesCsv(rows))}>{v4("dycCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("diptych-rows.csv", diptychRowsCsv(shown, reviewed))}>{v4("dycRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("dycLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("dycFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("dycEmpty")}</p>}
      <ul className="c4-diptych-list">
        {shown.map((row) => {
          const name = diptychCopy(row.code);
          const tone = diptychHue(row.code);
          return (
            <li key={row.id} className="c4-diptych-card" data-lane={diptychLane(row.code) || "open"} data-hue={tone || "none"} data-locale={diptychLane(row.code) === "locale" ? "1" : "0"} data-open={diptychOpen(row.code) ? "1" : "0"} data-even={diptychEven(row.code) ? "1" : "0"} data-digit={diptychDigit(row.code) ? "1" : "0"} data-letter={diptychLetter(row.code) ? "1" : "0"} data-mixed={diptychMixed(row.code) ? "1" : "0"} data-upper={diptychUpper(row.code) ? "1" : "0"} data-lower={diptychLower(row.code) ? "1" : "0"} data-space={diptychSpace(row.code) ? "1" : "0"} data-vowel={diptychVowel(row.code) ? "1" : "0"} data-tail={diptychTail(row.code) ? "1" : "0"} data-first={diptychFirst(row.code) ? "1" : "0"} data-held={diptychHeld(row.code) ? "1" : "0"} data-slash={diptychSlash(row.code) ? "1" : "0"} data-score={diptychScore(row.code) ? "1" : "0"}>
              <label className="c4-diptych-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-diptych-meta">{name || v4("dycOpen")} · {diptychStamp(row.code) || "—"} · {diptychFamily(row.code) || "—"} · {diptychLength(row.code) ?? "—"} · {laneLabel(v4, diptychLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-diptych-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleDiptychReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("dycReviewed") : v4("dycReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = diptychCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("dycCopied") : v4("dycCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("dycCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
