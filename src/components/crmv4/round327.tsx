"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CYL_DENSITY_KEY,
  CYL_KEY,
  CYL_PARTS,
  CYL_VIEW_KEY,
  RTE_KEY,
  RTE_REVIEW_KEY,
  addCylinder,
  addCylinderTag,
  addCylinderView,
  briskCylinder,
  bulkCylinderGraphite,
  bulkCylinderTag,
  bulkCylinderCase,
  bulkCylinderBank,
  bulkReteReview,
  busiestKeeper,
  dropCylinderView,
  editCylinder,
  editCylinderNote,
  fairKeeper,
  idleCylinder,
  washFocused,
  cylinderBars,
  cylinderCopy,
  cylinderCounts,
  cylinderCsv,
  cylinderDensity,
  cylinderInner,
  cylinderKeepers,
  cylinderOuter,
  cylinderTimeline,
  laneReteCount,
  lateCylinder,
  leadingRete,
  leadingReteHue,
  raiseToothFocused,
  lowerLockFocused,
  lowerToothFocused,
  moveCylinderFocus,
  overdueCylinder,
  latchCylinderFocused,
  reteCopy,
  reteDigit,
  reteEven,
  reteFamily,
  reteFirst,
  reteGap,
  reteHeld,
  reteHue,
  reteLane,
  reteLanes,
  reteLanesCsv,
  reteLength,
  reteLetter,
  reteLower,
  reteMixed,
  reteOpen,
  reteRowsCsv,
  reteShare,
  reteJoin,
  reteSpace,
  reteStamp,
  reteTail,
  reteUpper,
  reteVowel,
  presentReteLanes,
  raiseLockFocused,
  readHiddenRete,
  readCylinderRules,
  readCylinderViews,
  readReviewedRete,
  reminderCylinderRules,
  restingCylinder,
  setCylinderFocused,
  setCylinderLatch,
  setCylinderWash,
  setCylinderStar,
  setCylinderCase,
  setCylinderBank,
  sortCylinderRules,
  starCylinderFocused,
  suggestWash,
  suggestPart,
  suggestTooth,
  toggleRete,
  toggleReteReview,
  visibleCylinderRules,
  visibleRete,
  visibleReteLanes,
  type Cylinder,
  type CylinderDensity,
  type CylinderSort,
  type CylinderTray,
  type CylinderView,
  type ReteReview,
  type ReteRow,
  type ReteShape,
  type ReteValue,
} from "@/lib/crmv4/round327";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const WASHES = ["GILT", "IVORY", "GRAPHITE"] as const;
const TEETH = ["4", "8", "12", "16"] as const;
const LOCKS = ["2", "4", "8"] as const;

const PART_KEY: Record<string, CrmV4CopyKey> = {
  shell: "cylShell",
  arbor: "cylArbor",
  banking: "cylBanking",
  impulse: "cylImpulse",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "cylAuditSave",
  edit: "cylAuditEdit",
  note: "cylAuditNote",
  wash: "cylAuditWash",
  bank: "cylAuditBank",
  free: "cylAuditFree",
  latch: "cylAuditLatch",
  return: "cylAuditReturn",
  case: "cylAuditCase",
  open: "cylAuditOpen",
  tag: "cylAuditTag",
  lock: "cylAuditLock",
  tooth: "cylAuditTooth",
  lower: "cylAuditLower",
  star: "cylAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  code: "rteCode",
  join: "rteJoin",
  gap: "rteGap",
  chip: "rteChip",
  banner: "rteBanner",
  mark: "rteMark",
  vowel: "rteVowel",
  plain: "rtePlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "rteChampagne",
  ivory: "rteIvory",
  graphite: "rteGraphite",
};

const SHAPE_KEY: Record<ReteShape, CrmV4CopyKey> = {
  all: "rteShapeAll",
  code: "rteShapeCode",
  join: "rteShapeJoin",
  gap: "rteShapeGap",
  chip: "rteShapeChip",
  banner: "rteShapeBanner",
  mark: "rteShapeMark",
  vowel: "rteShapeVowel",
  plain: "rteShapePlain",
  open: "rteShapeOpen",
  soon: "rteShapeOpen",
  letter: "rteShapePlain",
  mixed: "rteShapeMark",
  upper: "rteShapeCode",
  lower: "rteShapePlain",
  space: "rteShapeGap",
  even: "rteShapeEven",
  odd: "rteShapeEven",
  tail: "rteShapeMark",
  first: "rteShapePlain",
  held: "rteShapeBanner",
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
  return key ? v4(key) : v4("cylBlankPart");
}

function washLabel(v4: V4, wash: string): string {
  if (wash === "GILT") return v4("cylGilt");
  if (wash === "IVORY") return v4("cylIvory");
  if (wash === "GRAPHITE") return v4("cylGraphite");
  return v4("cylAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("rteBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("rteBlank");
}

export function CylinderRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Cylinder[]>([]);
  const [views, setViews] = useState<CylinderView[]>([]);
  const [density, setDensity] = useState<CylinderDensity>("airy");
  const [tray, setTray] = useState<CylinderTray>("bench");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("");
  const [washFilter, setWashFilter] = useState("all");
  const [partFilter, setPartFilter] = useState("all");
  const [toothFilter, setToothFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<CylinderSort>("part");
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
  const [station, setStation] = useState("shell");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readCylinderRules(readJson(CYL_KEY, [])));
    setViews(readCylinderViews(readJson(CYL_VIEW_KEY, [])));
    setDensity(cylinderDensity(readJson(CYL_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Cylinder[]) {
    setCards(next);
    writeJson(CYL_KEY, next);
  }
  function storeViews(next: CylinderView[]) {
    setViews(next);
    writeJson(CYL_VIEW_KEY, next);
  }
  function storeDensity(next: CylinderDensity) {
    setDensity(next);
    writeJson(CYL_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortCylinderRules(visibleCylinderRules(cards, tray, query, keeperFilter, washFilter, partFilter, toothFilter, lockFilter), sort),
    [cards, tray, query, keeperFilter, washFilter, partFilter, toothFilter, lockFilter, sort],
  );
  const counts = cylinderCounts(cards, shown, station);
  const bars = cylinderBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = cylinderTimeline(cards);
  const reminders = reminderCylinderRules(cards);
  const keepers = cylinderKeepers(cards);
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
        download("cylinder-rules.csv", cylinderCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveCylinderFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveCylinderFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addCylinder(cards, { title, note, keeper, part, tooth: toothNo, wash, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-cylinder" aria-label={v4("cylTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-cylinder-mast">
        <p className="c4-cylinder-seal" data-logo="mono">{v4("cylLogo")}</p>
        <div>
          <p className="c4-cylinder-kicker">{v4("cylSub")}</p>
          <h2 className="c4-title">{v4("cylTitle")}</h2>
        </div>
        <p className="c4-cylinder-count">{shown.length}</p>
      </header>
      <p className="c4-cylinder-links">
        <Link href={crmv4Href(base, "rte")}>{v4("rteTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("cylCustomers")}</Link>
      </p>
      <p className="c4-cylinder-hint">{v4("cylHint")}</p>
      {viewer && <p className="c4-cylinder-note">{v4("cylViewer")}</p>}
      <p className="c4-cylinder-meta">{v4("cylFair")} {fair || "—"} · {v4("cylBusy")} {busy || "—"} · {v4("cylSuggest")} {partLabel(v4, suggestedPart)} · {washLabel(v4, suggestedWash)} · {suggestedTooth}</p>
      <ol className="c4-cylinder-index" aria-label={v4("cylRemind")}>
        <li data-tone="gold">{v4("cylOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("cylIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("cylBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("cylResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-cylinder-remind c4-cylinder-notices" role="status" aria-label={v4("cylRemind")}>
          {reminders.map((name) => <li key={name}>{v4("cylOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-cylinder-chart" aria-label={v4("cylChart")}>
        {bars.map((bar) => (
          <button key={bar.part} type="button" className="c4-cylinder-column" data-on={partFilter === bar.part ? "1" : "0"} onClick={() => setPartFilter(partFilter === bar.part ? "all" : bar.part)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{partLabel(v4, bar.part)}</span>
          </button>
        ))}
      </div>
      <form className="c4-cylinder-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("cylEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("cylEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("cylNote")}<input className="c4-field" aria-label={v4("cylNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("cylKeeper")}<input className="c4-field" aria-label={v4("cylKeeper")} aria-required={false} value={keeper} maxLength={24} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} /></label>
        <label className="c4-lab">{v4("cylShell")}<select className="c4-field" aria-label={v4("cylShell")} value={part} disabled={viewer} onChange={(event) => setPart(event.target.value)}><option value="">{v4("cylBlankPart")}</option>{CYL_PARTS.map((item) => <option key={item} value={item}>{partLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("cylWash")}<select className="c4-field" aria-label={v4("cylWash")} value={wash} disabled={viewer} onChange={(event) => setWash(event.target.value)}><option value="">{v4("cylAll")}</option>{WASHES.map((item) => <option key={item} value={item}>{washLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("cylTooth")}<select className="c4-field" aria-label={v4("cylTooth")} value={toothNo} disabled={viewer} onChange={(event) => setToothNo(event.target.value)}><option value="">{v4("cylAll")}</option>{TEETH.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("cylLock")}<select className="c4-field" aria-label={v4("cylLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("cylAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("cylTag")}<input className="c4-field" aria-label={v4("cylTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("cylAdd")}</button>
      </form>
      <div className="c4-cylinder-tools">
        <input ref={searchRef} className="c4-field c4-cylinder-search" aria-label={v4("cylSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("cylSearch")} />
        {(["bench", "latch", "case"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bench" ? "cylBench" : item === "latch" ? "cylLatch" : "cylCase")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={partFilter === "inner" ? "1" : "0"} onClick={() => setPartFilter(partFilter === "inner" ? "all" : "inner")}>{v4("cylInner")}</button>
        <button type="button" className="c4-chip" data-on={partFilter === "outer" ? "1" : "0"} onClick={() => setPartFilter(partFilter === "outer" ? "all" : "outer")}>{v4("cylOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort(sort === "keeper" ? "part" : "keeper")}>{sort === "keeper" ? v4("cylSortKeeper") : v4("cylSortPart")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("cylClose") : v4("cylAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("cylTimeline")}</button>
        <label className="c4-lab">{v4("cylDesk")}<select className="c4-field" aria-label={v4("cylDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{CYL_PARTS.map((item) => <option key={item} value={item}>{partLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-cylinder-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addCylinderView(views, { id, name: viewName, tray, query, keeper: keeperFilter, wash: washFilter, part: partFilter, tooth: toothFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("cylViewName")}<input className="c4-field" aria-label={v4("cylViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("cylSaveView")}</button>
      </form>
      <ul className="c4-cylinder-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setKeeperFilter(view.keeper); setWashFilter(view.wash); setPartFilter(view.part); setToothFilter(view.tooth); setLockFilter(view.lock); }}>{v4("cylApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropCylinderView(views, view.id))}>{v4("cylDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-cylinder-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCylinderBank(cards, picked))}>{v4("cylBulkBank")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCylinderCase(cards, picked))}>{v4("cylBulkCase")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCylinderGraphite(cards, picked))}>{v4("cylBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCylinderTag(cards, picked))}>{v4("cylBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("cylinder-rules.csv", cylinderCsv(shown, station))}>{v4("cylCsv")}</button>
        <p className="c4-cylinder-meta">{v4("cylKeys")} / n x a j k · {v4("cylQuiet")} {counts.quiet} · {v4("cylInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-cylinder-time" aria-label={v4("cylTimeline")}>
          {timeline.map((lane) => <li key={lane.tooth}><span>{lane.tooth}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("cylEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-cylinder-list">
          {shown.map((card) => {
            const late = lateCylinder(card, station);
            return (
              <li key={card.id} className="c4-cylinder-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleCylinder(card) ? "1" : "0"} data-brisk={briskCylinder(card) ? "1" : "0"} data-overdue={overdueCylinder(card) ? "1" : "0"} data-resting={restingCylinder(card) ? "1" : "0"} data-inner={cylinderInner(card.part) ? "1" : "0"} data-outer={cylinderOuter(card.part) ? "1" : "0"}>
                <label className="c4-cylinder-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCylinder(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("cylEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("cylApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCylinderNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("cylNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-cylinder-meta">{partLabel(v4, card.part)} · {washLabel(v4, card.wash)} · {card.tooth ?? "—"} · {card.lock} · {card.keeper || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "cylAuditSave")}` : ""}{late ? ` · ${v4("cylOverdue")}` : ""}</p>
                </div>
                <div className="c4-cylinder-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("cylEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCylinderBank(cards, card.id, !card.banked))}>{card.banked ? v4("cylFree") : v4("cylBank")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCylinderWash(cards, card.id, suggestedWash))}>{v4("cylSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCylinderLatch(cards, card.id, !card.latched))}>{card.latched ? v4("cylUnlatch") : v4("cylLatchIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCylinderCase(cards, card.id, !card.cased))}>{card.cased ? v4("cylUncase") : v4("cylCaseIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCylinderStar(cards, card.id, !card.starred))}>{card.starred ? v4("cylUnstar") : v4("cylStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCylinderTag(cards, card.id, "c"))}>{v4("cylTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseToothFocused(cards, card.id))}>{v4("cylRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerToothFocused(cards, card.id))}>{v4("cylLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseLockFocused(cards, card.id))}>{v4("cylLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerLockFocused(cards, card.id))}>{v4("cylLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(washFocused(cards, card.id))}>{v4("cylWash")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCylinderFocused(cards, card.id))}>{v4("cylBank")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(latchCylinderFocused(cards, card.id))}>{v4("cylLatch")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starCylinderFocused(cards, card.id))}>{v4("cylStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(cylinderCopy(card))}>{v4("cylCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type ReteUser = { id?: string; name?: string | null; lastRegion?: string | null };

export function RetePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: ReteUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<ReteShape>("all");
  const [review, setReview] = useState<ReteReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): ReteRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { lastRegion: textField(row.lastRegion) } satisfies ReteValue,
    };
  }).filter((row): row is ReteRow => Boolean(row));
  const present = presentReteLanes(rows);
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
    const next = readHiddenRete(readJson(RTE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(RTE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedRete(readJson(RTE_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(RTE_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleReteLanes(present, hidden, showHidden);
  const shown = visibleRete(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = reteLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = reteLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingRete(rows);
  const leadHue = leadingReteHue(rows);
  const whole = rows.filter((row) => reteLane(row.code)).length;
  const share = reteShare(laneReteCount(rows, "code"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("rete-lanes.csv", reteLanesCsv(rows));
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
    writeJson(RTE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(RTE_REVIEW_KEY, next);
  }

  return (
    <section className="c4-rete" aria-label={v4("rteTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-rete-mast">
        <p className="c4-rete-seal" data-logo="mono">{v4("rteLogo")}</p>
        <div>
          <p className="c4-rete-kicker">{v4("rteSub")}</p>
          <h2 className="c4-title">{v4("rteTitle")}</h2>
        </div>
        <p className="c4-rete-count">{shown.length}</p>
      </header>
      <p className="c4-rete-links">
        <Link href={crmv4Href(base, "cyl")}>{v4("cylTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rteCustomer")}</Link>
      </p>
      <p className="c4-rete-hint">{v4("rteHint")}</p>
      {viewer && <p className="c4-rete-note">{v4("rteViewer")}</p>}
      <p className="c4-rete-meta">{v4("rteLead")} {laneLabel(v4, lead)} · {v4("rteToneLead")} {hueLabel(v4, leadHue)} · {v4("rteShare")} {share}</p>
      <div className="c4-rete-chart" aria-label={v4("rteChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-rete-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-rete-tools">
        <input ref={searchRef} className="c4-field c4-rete-search" aria-label={v4("rteSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rteSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("rteShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "rteAll" : item === "reviewed" ? "rteReviewed" : "rteFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("rteAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as ReteShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleRete(hidden, item))}>{hidden.includes(item) ? v4("rteShow") : v4("rteHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-rete-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkReteReview(reviewed, picked, true))}>{v4("rteBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkReteReview(reviewed, picked, false))}>{v4("rteBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("rete-lanes.csv", reteLanesCsv(rows))}>{v4("rteCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("rete-rows.csv", reteRowsCsv(shown, reviewed))}>{v4("rteRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("rteLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("rteFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("rteEmpty")}</p>}
      <ul className="c4-rete-list">
        {shown.map((row) => {
          const name = reteCopy(row.code);
          const tone = reteHue(row.code);
          return (
            <li key={row.id} className="c4-rete-card" data-lane={reteLane(row.code) || "open"} data-hue={tone || "none"} data-code={reteLane(row.code) === "code" ? "1" : "0"} data-open={reteOpen(row.code) ? "1" : "0"} data-even={reteEven(row.code) ? "1" : "0"} data-digit={reteDigit(row.code) ? "1" : "0"} data-letter={reteLetter(row.code) ? "1" : "0"} data-mixed={reteMixed(row.code) ? "1" : "0"} data-upper={reteUpper(row.code) ? "1" : "0"} data-lower={reteLower(row.code) ? "1" : "0"} data-space={reteSpace(row.code) ? "1" : "0"} data-vowel={reteVowel(row.code) ? "1" : "0"} data-tail={reteTail(row.code) ? "1" : "0"} data-first={reteFirst(row.code) ? "1" : "0"} data-held={reteHeld(row.code) ? "1" : "0"} data-join={reteJoin(row.code) ? "1" : "0"} data-gap={reteGap(row.code) ? "1" : "0"}>
              <label className="c4-rete-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-rete-meta">{name || v4("rteOpen")} · {reteStamp(row.code) || "—"} · {reteFamily(row.code) || "—"} · {reteLength(row.code) ?? "—"} · {laneLabel(v4, reteLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-rete-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleReteReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("rteReviewed") : v4("rteReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = reteCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("rteCopied") : v4("rteCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("rteCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
