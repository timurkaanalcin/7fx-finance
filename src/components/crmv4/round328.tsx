"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  VRG_DENSITY_KEY,
  VRG_KEY,
  VRG_PARTS,
  VRG_VIEW_KEY,
  GNT_KEY,
  GNT_REVIEW_KEY,
  addVirgule,
  addVirguleTag,
  addVirguleView,
  briskVirgule,
  bulkVirguleGraphite,
  bulkVirguleTag,
  bulkVirguleCase,
  bulkVirguleBank,
  bulkGunterReview,
  busiestKeeper,
  dropVirguleView,
  editVirgule,
  editVirguleNote,
  fairKeeper,
  idleVirgule,
  washFocused,
  virguleBars,
  virguleCopy,
  virguleCounts,
  virguleCsv,
  virguleDensity,
  virguleInner,
  virguleKeepers,
  virguleOuter,
  virguleTimeline,
  laneGunterCount,
  lateVirgule,
  leadingGunter,
  leadingGunterHue,
  raiseToothFocused,
  lowerLockFocused,
  lowerToothFocused,
  moveVirguleFocus,
  overdueVirgule,
  latchVirguleFocused,
  gunterCopy,
  gunterDigit,
  gunterEven,
  gunterFamily,
  gunterFirst,
  gunterGap,
  gunterHeld,
  gunterHue,
  gunterLane,
  gunterLanes,
  gunterLanesCsv,
  gunterLength,
  gunterLetter,
  gunterLower,
  gunterMixed,
  gunterOpen,
  gunterRowsCsv,
  gunterShare,
  gunterJoin,
  gunterSpace,
  gunterStamp,
  gunterTail,
  gunterUpper,
  gunterVowel,
  presentGunterLanes,
  raiseLockFocused,
  readHiddenGunter,
  readVirguleRules,
  readVirguleViews,
  readReviewedGunter,
  reminderVirguleRules,
  restingVirgule,
  setVirguleFocused,
  setVirguleLatch,
  setVirguleWash,
  setVirguleStar,
  setVirguleCase,
  setVirguleBank,
  sortVirguleRules,
  starVirguleFocused,
  suggestWash,
  suggestPart,
  suggestTooth,
  toggleGunter,
  toggleGunterReview,
  visibleVirguleRules,
  visibleGunter,
  visibleGunterLanes,
  type Virgule,
  type VirguleDensity,
  type VirguleSort,
  type VirguleTray,
  type VirguleView,
  type GunterReview,
  type GunterRow,
  type GunterShape,
  type GunterValue,
} from "@/lib/crmv4/round328";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const WASHES = ["GILT", "IVORY", "GRAPHITE"] as const;
const TEETH = ["3", "6", "9", "12"] as const;
const LOCKS = ["3", "6", "9"] as const;

const PART_KEY: Record<string, CrmV4CopyKey> = {
  body: "vrgBody",
  beak: "vrgBeak",
  staff: "vrgStaff",
  dart: "vrgDart",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "vrgAuditSave",
  edit: "vrgAuditEdit",
  note: "vrgAuditNote",
  wash: "vrgAuditWash",
  bank: "vrgAuditBank",
  free: "vrgAuditFree",
  latch: "vrgAuditLatch",
  return: "vrgAuditReturn",
  case: "vrgAuditCase",
  open: "vrgAuditOpen",
  tag: "vrgAuditTag",
  lock: "vrgAuditLock",
  tooth: "vrgAuditTooth",
  lower: "vrgAuditLower",
  star: "vrgAuditStar",
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

const SHAPE_KEY: Record<GunterShape, CrmV4CopyKey> = {
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
  return key ? v4(key) : v4("vrgBlankPart");
}

function washLabel(v4: V4, wash: string): string {
  if (wash === "GILT") return v4("vrgGilt");
  if (wash === "IVORY") return v4("vrgIvory");
  if (wash === "GRAPHITE") return v4("vrgGraphite");
  return v4("vrgAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("rteBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("rteBlank");
}

export function VirguleRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Virgule[]>([]);
  const [views, setViews] = useState<VirguleView[]>([]);
  const [density, setDensity] = useState<VirguleDensity>("airy");
  const [tray, setTray] = useState<VirguleTray>("bench");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("");
  const [washFilter, setWashFilter] = useState("all");
  const [partFilter, setPartFilter] = useState("all");
  const [toothFilter, setToothFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<VirguleSort>("part");
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
    setCards(readVirguleRules(readJson(VRG_KEY, [])));
    setViews(readVirguleViews(readJson(VRG_VIEW_KEY, [])));
    setDensity(virguleDensity(readJson(VRG_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Virgule[]) {
    setCards(next);
    writeJson(VRG_KEY, next);
  }
  function storeViews(next: VirguleView[]) {
    setViews(next);
    writeJson(VRG_VIEW_KEY, next);
  }
  function storeDensity(next: VirguleDensity) {
    setDensity(next);
    writeJson(VRG_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortVirguleRules(visibleVirguleRules(cards, tray, query, keeperFilter, washFilter, partFilter, toothFilter, lockFilter), sort),
    [cards, tray, query, keeperFilter, washFilter, partFilter, toothFilter, lockFilter, sort],
  );
  const counts = virguleCounts(cards, shown, station);
  const bars = virguleBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = virguleTimeline(cards);
  const reminders = reminderVirguleRules(cards);
  const keepers = virguleKeepers(cards);
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
        download("virgule-rules.csv", virguleCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveVirguleFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveVirguleFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addVirgule(cards, { title, note, keeper, part, tooth: toothNo, wash, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-virgule" aria-label={v4("vrgTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-virgule-mast">
        <p className="c4-virgule-seal" data-logo="mono">{v4("vrgLogo")}</p>
        <div>
          <p className="c4-virgule-kicker">{v4("vrgSub")}</p>
          <h2 className="c4-title">{v4("vrgTitle")}</h2>
        </div>
        <p className="c4-virgule-count">{shown.length}</p>
      </header>
      <p className="c4-virgule-links">
        <Link href={crmv4Href(base, "rte")}>{v4("rteTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("vrgCustomers")}</Link>
      </p>
      <p className="c4-virgule-hint">{v4("vrgHint")}</p>
      {viewer && <p className="c4-virgule-note">{v4("vrgViewer")}</p>}
      <p className="c4-virgule-meta">{v4("vrgFair")} {fair || "—"} · {v4("vrgBusy")} {busy || "—"} · {v4("vrgSuggest")} {partLabel(v4, suggestedPart)} · {washLabel(v4, suggestedWash)} · {suggestedTooth}</p>
      <ol className="c4-virgule-index" aria-label={v4("vrgRemind")}>
        <li data-tone="gold">{v4("vrgOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("vrgIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("vrgBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("vrgResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-virgule-remind c4-virgule-notices" role="status" aria-label={v4("vrgRemind")}>
          {reminders.map((name) => <li key={name}>{v4("vrgOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-virgule-chart" aria-label={v4("vrgChart")}>
        {bars.map((bar) => (
          <button key={bar.part} type="button" className="c4-virgule-column" data-on={partFilter === bar.part ? "1" : "0"} onClick={() => setPartFilter(partFilter === bar.part ? "all" : bar.part)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{partLabel(v4, bar.part)}</span>
          </button>
        ))}
      </div>
      <form className="c4-virgule-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("vrgEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("vrgEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("vrgNote")}<input className="c4-field" aria-label={v4("vrgNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("vrgKeeper")}<input className="c4-field" aria-label={v4("vrgKeeper")} aria-required={false} value={keeper} maxLength={24} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} /></label>
        <label className="c4-lab">{v4("vrgBody")}<select className="c4-field" aria-label={v4("vrgBody")} value={part} disabled={viewer} onChange={(event) => setPart(event.target.value)}><option value="">{v4("vrgBlankPart")}</option>{VRG_PARTS.map((item) => <option key={item} value={item}>{partLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("vrgWash")}<select className="c4-field" aria-label={v4("vrgWash")} value={wash} disabled={viewer} onChange={(event) => setWash(event.target.value)}><option value="">{v4("vrgAll")}</option>{WASHES.map((item) => <option key={item} value={item}>{washLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("vrgTooth")}<select className="c4-field" aria-label={v4("vrgTooth")} value={toothNo} disabled={viewer} onChange={(event) => setToothNo(event.target.value)}><option value="">{v4("vrgAll")}</option>{TEETH.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("vrgLock")}<select className="c4-field" aria-label={v4("vrgLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("vrgAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("vrgTag")}<input className="c4-field" aria-label={v4("vrgTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("vrgAdd")}</button>
      </form>
      <div className="c4-virgule-tools">
        <input ref={searchRef} className="c4-field c4-virgule-search" aria-label={v4("vrgSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("vrgSearch")} />
        {(["bench", "latch", "case"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bench" ? "vrgBench" : item === "latch" ? "vrgLatch" : "vrgCase")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={partFilter === "inner" ? "1" : "0"} onClick={() => setPartFilter(partFilter === "inner" ? "all" : "inner")}>{v4("vrgInner")}</button>
        <button type="button" className="c4-chip" data-on={partFilter === "outer" ? "1" : "0"} onClick={() => setPartFilter(partFilter === "outer" ? "all" : "outer")}>{v4("vrgOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort(sort === "keeper" ? "part" : "keeper")}>{sort === "keeper" ? v4("vrgSortKeeper") : v4("vrgSortPart")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("vrgClose") : v4("vrgAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("vrgTimeline")}</button>
        <label className="c4-lab">{v4("vrgDesk")}<select className="c4-field" aria-label={v4("vrgDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{VRG_PARTS.map((item) => <option key={item} value={item}>{partLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-virgule-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addVirguleView(views, { id, name: viewName, tray, query, keeper: keeperFilter, wash: washFilter, part: partFilter, tooth: toothFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("vrgViewName")}<input className="c4-field" aria-label={v4("vrgViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("vrgSaveView")}</button>
      </form>
      <ul className="c4-virgule-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setKeeperFilter(view.keeper); setWashFilter(view.wash); setPartFilter(view.part); setToothFilter(view.tooth); setLockFilter(view.lock); }}>{v4("vrgApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropVirguleView(views, view.id))}>{v4("vrgDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-virgule-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkVirguleBank(cards, picked))}>{v4("vrgBulkBank")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkVirguleCase(cards, picked))}>{v4("vrgBulkCase")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkVirguleGraphite(cards, picked))}>{v4("vrgBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkVirguleTag(cards, picked))}>{v4("vrgBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("virgule-rules.csv", virguleCsv(shown, station))}>{v4("vrgCsv")}</button>
        <p className="c4-virgule-meta">{v4("vrgKeys")} / n x a j k · {v4("vrgQuiet")} {counts.quiet} · {v4("vrgInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-virgule-time" aria-label={v4("vrgTimeline")}>
          {timeline.map((lane) => <li key={lane.tooth}><span>{lane.tooth}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("vrgEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-virgule-list">
          {shown.map((card) => {
            const late = lateVirgule(card, station);
            return (
              <li key={card.id} className="c4-virgule-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleVirgule(card) ? "1" : "0"} data-brisk={briskVirgule(card) ? "1" : "0"} data-overdue={overdueVirgule(card) ? "1" : "0"} data-resting={restingVirgule(card) ? "1" : "0"} data-inner={virguleInner(card.part) ? "1" : "0"} data-outer={virguleOuter(card.part) ? "1" : "0"}>
                <label className="c4-virgule-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editVirgule(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("vrgEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("vrgApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editVirguleNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("vrgNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-virgule-meta">{partLabel(v4, card.part)} · {washLabel(v4, card.wash)} · {card.tooth ?? "—"} · {card.lock} · {card.keeper || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "vrgAuditSave")}` : ""}{late ? ` · ${v4("vrgOverdue")}` : ""}</p>
                </div>
                <div className="c4-virgule-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("vrgEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVirguleBank(cards, card.id, !card.banked))}>{card.banked ? v4("vrgFree") : v4("vrgBank")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVirguleWash(cards, card.id, suggestedWash))}>{v4("vrgSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVirguleLatch(cards, card.id, !card.latched))}>{card.latched ? v4("vrgUnlatch") : v4("vrgLatchIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVirguleCase(cards, card.id, !card.cased))}>{card.cased ? v4("vrgUncase") : v4("vrgCaseIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVirguleStar(cards, card.id, !card.starred))}>{card.starred ? v4("vrgUnstar") : v4("vrgStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addVirguleTag(cards, card.id, "c"))}>{v4("vrgTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseToothFocused(cards, card.id))}>{v4("vrgRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerToothFocused(cards, card.id))}>{v4("vrgLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseLockFocused(cards, card.id))}>{v4("vrgLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerLockFocused(cards, card.id))}>{v4("vrgLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(washFocused(cards, card.id))}>{v4("vrgWash")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVirguleFocused(cards, card.id))}>{v4("vrgBank")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(latchVirguleFocused(cards, card.id))}>{v4("vrgLatch")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starVirguleFocused(cards, card.id))}>{v4("vrgStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(virguleCopy(card))}>{v4("vrgCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GunterUser = { id?: string; name?: string | null; withdrawalsEnabled?: string | null };

export function GunterPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GunterUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<GunterShape>("all");
  const [review, setReview] = useState<GunterReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): GunterRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { withdrawalsEnabled: textField(row.withdrawalsEnabled) } satisfies GunterValue,
    };
  }).filter((row): row is GunterRow => Boolean(row));
  const present = presentGunterLanes(rows);
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
    const next = readHiddenGunter(readJson(GNT_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(GNT_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedGunter(readJson(GNT_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(GNT_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleGunterLanes(present, hidden, showHidden);
  const shown = visibleGunter(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = gunterLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = gunterLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingGunter(rows);
  const leadHue = leadingGunterHue(rows);
  const whole = rows.filter((row) => gunterLane(row.code)).length;
  const share = gunterShare(laneGunterCount(rows, "code"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("gunter-lanes.csv", gunterLanesCsv(rows));
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
    writeJson(GNT_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(GNT_REVIEW_KEY, next);
  }

  return (
    <section className="c4-gunter" aria-label={v4("rteTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-gunter-mast">
        <p className="c4-gunter-seal" data-logo="mono">{v4("rteLogo")}</p>
        <div>
          <p className="c4-gunter-kicker">{v4("rteSub")}</p>
          <h2 className="c4-title">{v4("rteTitle")}</h2>
        </div>
        <p className="c4-gunter-count">{shown.length}</p>
      </header>
      <p className="c4-gunter-links">
        <Link href={crmv4Href(base, "vrg")}>{v4("vrgTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rteCustomer")}</Link>
      </p>
      <p className="c4-gunter-hint">{v4("rteHint")}</p>
      {viewer && <p className="c4-gunter-note">{v4("rteViewer")}</p>}
      <p className="c4-gunter-meta">{v4("rteLead")} {laneLabel(v4, lead)} · {v4("rteToneLead")} {hueLabel(v4, leadHue)} · {v4("rteShare")} {share}</p>
      <div className="c4-gunter-chart" aria-label={v4("rteChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-gunter-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-gunter-tools">
        <input ref={searchRef} className="c4-field c4-gunter-search" aria-label={v4("rteSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rteSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("rteShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "rteAll" : item === "reviewed" ? "rteReviewed" : "rteFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("rteAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as GunterShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleGunter(hidden, item))}>{hidden.includes(item) ? v4("rteShow") : v4("rteHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-gunter-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkGunterReview(reviewed, picked, true))}>{v4("rteBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkGunterReview(reviewed, picked, false))}>{v4("rteBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("gunter-lanes.csv", gunterLanesCsv(rows))}>{v4("rteCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("gunter-rows.csv", gunterRowsCsv(shown, reviewed))}>{v4("rteRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("rteLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("rteFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("rteEmpty")}</p>}
      <ul className="c4-gunter-list">
        {shown.map((row) => {
          const name = gunterCopy(row.code);
          const tone = gunterHue(row.code);
          return (
            <li key={row.id} className="c4-gunter-card" data-lane={gunterLane(row.code) || "open"} data-hue={tone || "none"} data-code={gunterLane(row.code) === "code" ? "1" : "0"} data-open={gunterOpen(row.code) ? "1" : "0"} data-even={gunterEven(row.code) ? "1" : "0"} data-digit={gunterDigit(row.code) ? "1" : "0"} data-letter={gunterLetter(row.code) ? "1" : "0"} data-mixed={gunterMixed(row.code) ? "1" : "0"} data-upper={gunterUpper(row.code) ? "1" : "0"} data-lower={gunterLower(row.code) ? "1" : "0"} data-space={gunterSpace(row.code) ? "1" : "0"} data-vowel={gunterVowel(row.code) ? "1" : "0"} data-tail={gunterTail(row.code) ? "1" : "0"} data-first={gunterFirst(row.code) ? "1" : "0"} data-held={gunterHeld(row.code) ? "1" : "0"} data-join={gunterJoin(row.code) ? "1" : "0"} data-gap={gunterGap(row.code) ? "1" : "0"}>
              <label className="c4-gunter-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-gunter-meta">{name || v4("rteOpen")} · {gunterStamp(row.code) || "—"} · {gunterFamily(row.code) || "—"} · {gunterLength(row.code) ?? "—"} · {laneLabel(v4, gunterLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-gunter-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleGunterReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("rteReviewed") : v4("rteReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = gunterCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("rteCopied") : v4("rteCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("rteCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
