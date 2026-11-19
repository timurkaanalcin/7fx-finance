"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  SFR_DENSITY_KEY,
  SFR_KEY,
  SFR_PARTS,
  SFR_VIEW_KEY,
  NLB_KEY,
  NLB_REVIEW_KEY,
  addStackfreed,
  addStackfreedTag,
  addStackfreedView,
  briskStackfreed,
  bulkStackfreedGraphite,
  bulkStackfreedTag,
  bulkStackfreedCase,
  bulkStackfreedBank,
  bulkNocturlabeReview,
  busiestKeeper,
  dropStackfreedView,
  editStackfreed,
  editStackfreedNote,
  fairKeeper,
  idleStackfreed,
  washFocused,
  stackfreedBars,
  stackfreedCopy,
  stackfreedCounts,
  stackfreedCsv,
  stackfreedDensity,
  stackfreedInner,
  stackfreedKeepers,
  stackfreedOuter,
  stackfreedTimeline,
  laneNocturlabeCount,
  lateStackfreed,
  leadingNocturlabe,
  leadingNocturlabeHue,
  raiseToothFocused,
  lowerLockFocused,
  lowerToothFocused,
  moveStackfreedFocus,
  overdueStackfreed,
  latchStackfreedFocused,
  nocturlabeCopy,
  nocturlabeDigit,
  nocturlabeEven,
  nocturlabeFamily,
  nocturlabeFirst,
  nocturlabeGap,
  nocturlabeHeld,
  nocturlabeHue,
  nocturlabeLane,
  nocturlabeLanes,
  nocturlabeLanesCsv,
  nocturlabeLength,
  nocturlabeLetter,
  nocturlabeLower,
  nocturlabeMixed,
  nocturlabeOpen,
  nocturlabeRowsCsv,
  nocturlabeShare,
  nocturlabeJoin,
  nocturlabeSpace,
  nocturlabeStamp,
  nocturlabeTail,
  nocturlabeUpper,
  nocturlabeVowel,
  presentNocturlabeLanes,
  raiseLockFocused,
  readHiddenNocturlabe,
  readStackfreedRules,
  readStackfreedViews,
  readReviewedNocturlabe,
  reminderStackfreedRules,
  restingStackfreed,
  setStackfreedFocused,
  setStackfreedLatch,
  setStackfreedWash,
  setStackfreedStar,
  setStackfreedCase,
  setStackfreedBank,
  sortStackfreedRules,
  starStackfreedFocused,
  suggestWash,
  suggestPart,
  suggestTooth,
  toggleNocturlabe,
  toggleNocturlabeReview,
  visibleStackfreedRules,
  visibleNocturlabe,
  visibleNocturlabeLanes,
  type Stackfreed,
  type StackfreedDensity,
  type StackfreedSort,
  type StackfreedTray,
  type StackfreedView,
  type NocturlabeReview,
  type NocturlabeRow,
  type NocturlabeShape,
  type NocturlabeValue,
} from "@/lib/crmv4/round329";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const WASHES = ["GILT", "IVORY", "GRAPHITE"] as const;
const TEETH = ["4", "8", "12", "16"] as const;
const LOCKS = ["2", "4", "8"] as const;

const PART_KEY: Record<string, CrmV4CopyKey> = {
  lobe: "sfrLobe",
  snail: "sfrSnail",
  yoke: "sfrYoke",
  barrel: "sfrBarrel",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "sfrAuditSave",
  edit: "sfrAuditEdit",
  note: "sfrAuditNote",
  wash: "sfrAuditWash",
  bank: "sfrAuditBank",
  free: "sfrAuditFree",
  latch: "sfrAuditLatch",
  return: "sfrAuditReturn",
  case: "sfrAuditCase",
  open: "sfrAuditOpen",
  tag: "sfrAuditTag",
  lock: "sfrAuditLock",
  tooth: "sfrAuditTooth",
  lower: "sfrAuditLower",
  star: "sfrAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  code: "nlbCode",
  join: "nlbJoin",
  gap: "nlbGap",
  chip: "nlbChip",
  banner: "nlbBanner",
  mark: "nlbMark",
  vowel: "nlbVowel",
  plain: "nlbPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "nlbChampagne",
  ivory: "nlbIvory",
  graphite: "nlbGraphite",
};

const SHAPE_KEY: Record<NocturlabeShape, CrmV4CopyKey> = {
  all: "nlbShapeAll",
  code: "nlbShapeCode",
  join: "nlbShapeJoin",
  gap: "nlbShapeGap",
  chip: "nlbShapeChip",
  banner: "nlbShapeBanner",
  mark: "nlbShapeMark",
  vowel: "nlbShapeVowel",
  plain: "nlbShapePlain",
  open: "nlbShapeOpen",
  soon: "nlbShapeOpen",
  letter: "nlbShapePlain",
  mixed: "nlbShapeMark",
  upper: "nlbShapeCode",
  lower: "nlbShapePlain",
  space: "nlbShapeGap",
  even: "nlbShapeEven",
  odd: "nlbShapeEven",
  tail: "nlbShapeMark",
  first: "nlbShapePlain",
  held: "nlbShapeBanner",
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
  return key ? v4(key) : v4("sfrBlankPart");
}

function washLabel(v4: V4, wash: string): string {
  if (wash === "GILT") return v4("sfrGilt");
  if (wash === "IVORY") return v4("sfrIvory");
  if (wash === "GRAPHITE") return v4("sfrGraphite");
  return v4("sfrAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("nlbBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("nlbBlank");
}

export function StackfreedRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Stackfreed[]>([]);
  const [views, setViews] = useState<StackfreedView[]>([]);
  const [density, setDensity] = useState<StackfreedDensity>("airy");
  const [tray, setTray] = useState<StackfreedTray>("bench");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("");
  const [washFilter, setWashFilter] = useState("all");
  const [partFilter, setPartFilter] = useState("all");
  const [toothFilter, setToothFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<StackfreedSort>("part");
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
  const [station, setStation] = useState("lobe");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readStackfreedRules(readJson(SFR_KEY, [])));
    setViews(readStackfreedViews(readJson(SFR_VIEW_KEY, [])));
    setDensity(stackfreedDensity(readJson(SFR_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Stackfreed[]) {
    setCards(next);
    writeJson(SFR_KEY, next);
  }
  function storeViews(next: StackfreedView[]) {
    setViews(next);
    writeJson(SFR_VIEW_KEY, next);
  }
  function storeDensity(next: StackfreedDensity) {
    setDensity(next);
    writeJson(SFR_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortStackfreedRules(visibleStackfreedRules(cards, tray, query, keeperFilter, washFilter, partFilter, toothFilter, lockFilter), sort),
    [cards, tray, query, keeperFilter, washFilter, partFilter, toothFilter, lockFilter, sort],
  );
  const counts = stackfreedCounts(cards, shown, station);
  const bars = stackfreedBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = stackfreedTimeline(cards);
  const reminders = reminderStackfreedRules(cards);
  const keepers = stackfreedKeepers(cards);
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
        download("stackfreed-rules.csv", stackfreedCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveStackfreedFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveStackfreedFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addStackfreed(cards, { title, note, keeper, part, tooth: toothNo, wash, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-stackfreed" aria-label={v4("sfrTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-stackfreed-mast">
        <p className="c4-stackfreed-seal" data-logo="mono">{v4("sfrLogo")}</p>
        <div>
          <p className="c4-stackfreed-kicker">{v4("sfrSub")}</p>
          <h2 className="c4-title">{v4("sfrTitle")}</h2>
        </div>
        <p className="c4-stackfreed-count">{shown.length}</p>
      </header>
      <p className="c4-stackfreed-links">
        <Link href={crmv4Href(base, "nlb")}>{v4("nlbTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("sfrCustomers")}</Link>
      </p>
      <p className="c4-stackfreed-hint">{v4("sfrHint")}</p>
      {viewer && <p className="c4-stackfreed-note">{v4("sfrViewer")}</p>}
      <p className="c4-stackfreed-meta">{v4("sfrFair")} {fair || "—"} · {v4("sfrBusy")} {busy || "—"} · {v4("sfrSuggest")} {partLabel(v4, suggestedPart)} · {washLabel(v4, suggestedWash)} · {suggestedTooth}</p>
      <ol className="c4-stackfreed-index" aria-label={v4("sfrRemind")}>
        <li data-tone="gold">{v4("sfrOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("sfrIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("sfrBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("sfrResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-stackfreed-remind c4-stackfreed-notices" role="status" aria-label={v4("sfrRemind")}>
          {reminders.map((name) => <li key={name}>{v4("sfrOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-stackfreed-chart" aria-label={v4("sfrChart")}>
        {bars.map((bar) => (
          <button key={bar.part} type="button" className="c4-stackfreed-column" data-on={partFilter === bar.part ? "1" : "0"} onClick={() => setPartFilter(partFilter === bar.part ? "all" : bar.part)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{partLabel(v4, bar.part)}</span>
          </button>
        ))}
      </div>
      <form className="c4-stackfreed-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("sfrEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("sfrEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("sfrNote")}<input className="c4-field" aria-label={v4("sfrNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("sfrKeeper")}<input className="c4-field" aria-label={v4("sfrKeeper")} aria-required={false} value={keeper} maxLength={24} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} /></label>
        <label className="c4-lab">{v4("sfrPart")}<select className="c4-field" aria-label={v4("sfrPart")} value={part} disabled={viewer} onChange={(event) => setPart(event.target.value)}><option value="">{v4("sfrBlankPart")}</option>{SFR_PARTS.map((item) => <option key={item} value={item}>{partLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("sfrWash")}<select className="c4-field" aria-label={v4("sfrWash")} value={wash} disabled={viewer} onChange={(event) => setWash(event.target.value)}><option value="">{v4("sfrAll")}</option>{WASHES.map((item) => <option key={item} value={item}>{washLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("sfrTooth")}<select className="c4-field" aria-label={v4("sfrTooth")} value={toothNo} disabled={viewer} onChange={(event) => setToothNo(event.target.value)}><option value="">{v4("sfrAll")}</option>{TEETH.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("sfrLock")}<select className="c4-field" aria-label={v4("sfrLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("sfrAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("sfrTag")}<input className="c4-field" aria-label={v4("sfrTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("sfrAdd")}</button>
      </form>
      <div className="c4-stackfreed-tools">
        <input ref={searchRef} className="c4-field c4-stackfreed-search" aria-label={v4("sfrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("sfrSearch")} />
        {(["bench", "latch", "case"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bench" ? "sfrBench" : item === "latch" ? "sfrLatch" : "sfrCase")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={partFilter === "inner" ? "1" : "0"} onClick={() => setPartFilter(partFilter === "inner" ? "all" : "inner")}>{v4("sfrInner")}</button>
        <button type="button" className="c4-chip" data-on={partFilter === "outer" ? "1" : "0"} onClick={() => setPartFilter(partFilter === "outer" ? "all" : "outer")}>{v4("sfrOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort(sort === "keeper" ? "part" : "keeper")}>{sort === "keeper" ? v4("sfrSortKeeper") : v4("sfrSortPart")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("sfrClose") : v4("sfrAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("sfrTimeline")}</button>
        <label className="c4-lab">{v4("sfrDesk")}<select className="c4-field" aria-label={v4("sfrDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{SFR_PARTS.map((item) => <option key={item} value={item}>{partLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-stackfreed-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addStackfreedView(views, { id, name: viewName, tray, query, keeper: keeperFilter, wash: washFilter, part: partFilter, tooth: toothFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("sfrViewName")}<input className="c4-field" aria-label={v4("sfrViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("sfrSaveView")}</button>
      </form>
      <ul className="c4-stackfreed-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setKeeperFilter(view.keeper); setWashFilter(view.wash); setPartFilter(view.part); setToothFilter(view.tooth); setLockFilter(view.lock); }}>{v4("sfrApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropStackfreedView(views, view.id))}>{v4("sfrDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-stackfreed-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkStackfreedBank(cards, picked))}>{v4("sfrBulkBank")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkStackfreedCase(cards, picked))}>{v4("sfrBulkCase")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkStackfreedGraphite(cards, picked))}>{v4("sfrBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkStackfreedTag(cards, picked))}>{v4("sfrBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("stackfreed-rules.csv", stackfreedCsv(shown, station))}>{v4("sfrCsv")}</button>
        <p className="c4-stackfreed-meta">{v4("sfrKeys")} / n x a j k · {v4("sfrQuiet")} {counts.quiet} · {v4("sfrInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-stackfreed-time" aria-label={v4("sfrTimeline")}>
          {timeline.map((lane) => <li key={lane.tooth}><span>{lane.tooth}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("sfrEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-stackfreed-list">
          {shown.map((card) => {
            const late = lateStackfreed(card, station);
            return (
              <li key={card.id} className="c4-stackfreed-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleStackfreed(card) ? "1" : "0"} data-brisk={briskStackfreed(card) ? "1" : "0"} data-overdue={overdueStackfreed(card) ? "1" : "0"} data-resting={restingStackfreed(card) ? "1" : "0"} data-inner={stackfreedInner(card.part) ? "1" : "0"} data-outer={stackfreedOuter(card.part) ? "1" : "0"}>
                <label className="c4-stackfreed-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editStackfreed(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("sfrEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("sfrApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editStackfreedNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("sfrNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-stackfreed-meta">{partLabel(v4, card.part)} · {washLabel(v4, card.wash)} · {card.tooth ?? "—"} · {card.lock} · {card.keeper || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "sfrAuditSave")}` : ""}{late ? ` · ${v4("sfrOverdue")}` : ""}</p>
                </div>
                <div className="c4-stackfreed-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("sfrEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStackfreedBank(cards, card.id, !card.banked))}>{card.banked ? v4("sfrFree") : v4("sfrBank")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStackfreedWash(cards, card.id, suggestedWash))}>{v4("sfrSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStackfreedLatch(cards, card.id, !card.latched))}>{card.latched ? v4("sfrUnlatch") : v4("sfrLatchIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStackfreedCase(cards, card.id, !card.cased))}>{card.cased ? v4("sfrUncase") : v4("sfrCaseIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStackfreedStar(cards, card.id, !card.starred))}>{card.starred ? v4("sfrUnstar") : v4("sfrStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addStackfreedTag(cards, card.id, "s"))}>{v4("sfrTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseToothFocused(cards, card.id))}>{v4("sfrRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerToothFocused(cards, card.id))}>{v4("sfrLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseLockFocused(cards, card.id))}>{v4("sfrLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerLockFocused(cards, card.id))}>{v4("sfrLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(washFocused(cards, card.id))}>{v4("sfrWash")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStackfreedFocused(cards, card.id))}>{v4("sfrBank")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(latchStackfreedFocused(cards, card.id))}>{v4("sfrLatch")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starStackfreedFocused(cards, card.id))}>{v4("sfrStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(stackfreedCopy(card))}>{v4("sfrCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type NocturlabeUser = { id?: string; name?: string | null; withdrawalsEnabled?: string | null };

export function NocturlabePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NocturlabeUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<NocturlabeShape>("all");
  const [review, setReview] = useState<NocturlabeReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): NocturlabeRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { withdrawalsEnabled: textField(row.withdrawalsEnabled) } satisfies NocturlabeValue,
    };
  }).filter((row): row is NocturlabeRow => Boolean(row));
  const present = presentNocturlabeLanes(rows);
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
    const next = readHiddenNocturlabe(readJson(NLB_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(NLB_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedNocturlabe(readJson(NLB_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(NLB_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleNocturlabeLanes(present, hidden, showHidden);
  const shown = visibleNocturlabe(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = nocturlabeLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = nocturlabeLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingNocturlabe(rows);
  const leadHue = leadingNocturlabeHue(rows);
  const whole = rows.filter((row) => nocturlabeLane(row.code)).length;
  const share = nocturlabeShare(laneNocturlabeCount(rows, "code"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("nocturlabe-lanes.csv", nocturlabeLanesCsv(rows));
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
    writeJson(NLB_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(NLB_REVIEW_KEY, next);
  }

  return (
    <section className="c4-nocturlabe" aria-label={v4("nlbTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-nocturlabe-mast">
        <p className="c4-nocturlabe-seal" data-logo="mono">{v4("nlbLogo")}</p>
        <div>
          <p className="c4-nocturlabe-kicker">{v4("nlbSub")}</p>
          <h2 className="c4-title">{v4("nlbTitle")}</h2>
        </div>
        <p className="c4-nocturlabe-count">{shown.length}</p>
      </header>
      <p className="c4-nocturlabe-links">
        <Link href={crmv4Href(base, "sfr")}>{v4("sfrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("nlbCustomer")}</Link>
      </p>
      <p className="c4-nocturlabe-hint">{v4("nlbHint")}</p>
      {viewer && <p className="c4-nocturlabe-note">{v4("nlbViewer")}</p>}
      <p className="c4-nocturlabe-meta">{v4("nlbLead")} {laneLabel(v4, lead)} · {v4("nlbToneLead")} {hueLabel(v4, leadHue)} · {v4("nlbShare")} {share}</p>
      <div className="c4-nocturlabe-chart" aria-label={v4("nlbChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-nocturlabe-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-nocturlabe-tools">
        <input ref={searchRef} className="c4-field c4-nocturlabe-search" aria-label={v4("nlbSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("nlbSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("nlbShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "nlbAll" : item === "reviewed" ? "nlbReviewed" : "nlbFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("nlbAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as NocturlabeShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleNocturlabe(hidden, item))}>{hidden.includes(item) ? v4("nlbShow") : v4("nlbHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-nocturlabe-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkNocturlabeReview(reviewed, picked, true))}>{v4("nlbBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkNocturlabeReview(reviewed, picked, false))}>{v4("nlbBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("nocturlabe-lanes.csv", nocturlabeLanesCsv(rows))}>{v4("nlbCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("nocturlabe-rows.csv", nocturlabeRowsCsv(shown, reviewed))}>{v4("nlbRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("nlbLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("nlbFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("nlbEmpty")}</p>}
      <ul className="c4-nocturlabe-list">
        {shown.map((row) => {
          const name = nocturlabeCopy(row.code);
          const tone = nocturlabeHue(row.code);
          return (
            <li key={row.id} className="c4-nocturlabe-card" data-lane={nocturlabeLane(row.code) || "open"} data-hue={tone || "none"} data-code={nocturlabeLane(row.code) === "code" ? "1" : "0"} data-open={nocturlabeOpen(row.code) ? "1" : "0"} data-even={nocturlabeEven(row.code) ? "1" : "0"} data-digit={nocturlabeDigit(row.code) ? "1" : "0"} data-letter={nocturlabeLetter(row.code) ? "1" : "0"} data-mixed={nocturlabeMixed(row.code) ? "1" : "0"} data-upper={nocturlabeUpper(row.code) ? "1" : "0"} data-lower={nocturlabeLower(row.code) ? "1" : "0"} data-space={nocturlabeSpace(row.code) ? "1" : "0"} data-vowel={nocturlabeVowel(row.code) ? "1" : "0"} data-tail={nocturlabeTail(row.code) ? "1" : "0"} data-first={nocturlabeFirst(row.code) ? "1" : "0"} data-held={nocturlabeHeld(row.code) ? "1" : "0"} data-join={nocturlabeJoin(row.code) ? "1" : "0"} data-gap={nocturlabeGap(row.code) ? "1" : "0"}>
              <label className="c4-nocturlabe-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-nocturlabe-meta">{name || v4("nlbOpen")} · {nocturlabeStamp(row.code) || "—"} · {nocturlabeFamily(row.code) || "—"} · {nocturlabeLength(row.code) ?? "—"} · {laneLabel(v4, nocturlabeLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-nocturlabe-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleNocturlabeReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("nlbReviewed") : v4("nlbReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = nocturlabeCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("nlbCopied") : v4("nlbCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("nlbCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
