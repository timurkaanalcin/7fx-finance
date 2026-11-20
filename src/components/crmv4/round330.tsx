"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CTR_DENSITY_KEY,
  CTR_KEY,
  CTR_PARTS,
  CTR_VIEW_KEY,
  JCQ_KEY,
  JCQ_REVIEW_KEY,
  addContrate,
  addContrateTag,
  addContrateView,
  briskContrate,
  bulkContrateGraphite,
  bulkContrateTag,
  bulkContrateCase,
  bulkContrateBank,
  bulkJacquemartReview,
  busiestKeeper,
  dropContrateView,
  editContrate,
  editContrateNote,
  fairKeeper,
  idleContrate,
  washFocused,
  contrateBars,
  contrateCopy,
  contrateCounts,
  contrateCsv,
  contrateDensity,
  contrateInner,
  contrateKeepers,
  contrateOuter,
  contrateTimeline,
  laneJacquemartCount,
  lateContrate,
  leadingJacquemart,
  leadingJacquemartHue,
  raiseToothFocused,
  lowerLockFocused,
  lowerToothFocused,
  moveContrateFocus,
  overdueContrate,
  latchContrateFocused,
  jacquemartCopy,
  jacquemartDigit,
  jacquemartEven,
  jacquemartFamily,
  jacquemartFirst,
  jacquemartGap,
  jacquemartHeld,
  jacquemartHue,
  jacquemartLane,
  jacquemartLanes,
  jacquemartLanesCsv,
  jacquemartLength,
  jacquemartLetter,
  jacquemartLower,
  jacquemartMixed,
  jacquemartOpen,
  jacquemartRowsCsv,
  jacquemartShare,
  jacquemartJoin,
  jacquemartSpace,
  jacquemartStamp,
  jacquemartTail,
  jacquemartUpper,
  jacquemartVowel,
  presentJacquemartLanes,
  raiseLockFocused,
  readHiddenJacquemart,
  readContrateRules,
  readContrateViews,
  readReviewedJacquemart,
  reminderContrateRules,
  restingContrate,
  setContrateFocused,
  setContrateLatch,
  setContrateWash,
  setContrateStar,
  setContrateCase,
  setContrateBank,
  sortContrateRules,
  starContrateFocused,
  suggestWash,
  suggestPart,
  suggestTooth,
  toggleJacquemart,
  toggleJacquemartReview,
  visibleContrateRules,
  visibleJacquemart,
  visibleJacquemartLanes,
  type Contrate,
  type ContrateDensity,
  type ContrateSort,
  type ContrateTray,
  type ContrateView,
  type JacquemartReview,
  type JacquemartRow,
  type JacquemartShape,
  type JacquemartValue,
} from "@/lib/crmv4/round330";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const WASHES = ["GILT", "IVORY", "GRAPHITE"] as const;
const TEETH = ["3", "6", "9", "12"] as const;
const LOCKS = ["1", "3", "5"] as const;

const PART_KEY: Record<string, CrmV4CopyKey> = {
  pinion: "ctrPinion",
  wheel: "ctrWheel",
  arbor: "ctrArbor",
  staff: "ctrStaff",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "ctrAuditSave",
  edit: "ctrAuditEdit",
  note: "ctrAuditNote",
  wash: "ctrAuditWash",
  bank: "ctrAuditBank",
  free: "ctrAuditFree",
  latch: "ctrAuditLatch",
  return: "ctrAuditReturn",
  case: "ctrAuditCase",
  open: "ctrAuditOpen",
  tag: "ctrAuditTag",
  lock: "ctrAuditLock",
  tooth: "ctrAuditTooth",
  lower: "ctrAuditLower",
  star: "ctrAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  code: "jcqCode",
  join: "jcqJoin",
  gap: "jcqGap",
  chip: "jcqChip",
  banner: "jcqBanner",
  mark: "jcqMark",
  vowel: "jcqVowel",
  plain: "jcqPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "jcqChampagne",
  ivory: "jcqIvory",
  graphite: "jcqGraphite",
};

const SHAPE_KEY: Record<JacquemartShape, CrmV4CopyKey> = {
  all: "jcqShapeAll",
  code: "jcqShapeCode",
  join: "jcqShapeJoin",
  gap: "jcqShapeGap",
  chip: "jcqShapeChip",
  banner: "jcqShapeBanner",
  mark: "jcqShapeMark",
  vowel: "jcqShapeVowel",
  plain: "jcqShapePlain",
  open: "jcqShapeOpen",
  soon: "jcqShapeOpen",
  letter: "jcqShapePlain",
  mixed: "jcqShapeMark",
  upper: "jcqShapeCode",
  lower: "jcqShapePlain",
  space: "jcqShapeGap",
  even: "jcqShapeEven",
  odd: "jcqShapeEven",
  tail: "jcqShapeMark",
  first: "jcqShapePlain",
  held: "jcqShapeBanner",
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
  return key ? v4(key) : v4("ctrBlankPart");
}

function washLabel(v4: V4, wash: string): string {
  if (wash === "GILT") return v4("ctrGilt");
  if (wash === "IVORY") return v4("ctrIvory");
  if (wash === "GRAPHITE") return v4("ctrGraphite");
  return v4("ctrAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("jcqBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("jcqBlank");
}

export function ContrateRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Contrate[]>([]);
  const [views, setViews] = useState<ContrateView[]>([]);
  const [density, setDensity] = useState<ContrateDensity>("airy");
  const [tray, setTray] = useState<ContrateTray>("bench");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("");
  const [washFilter, setWashFilter] = useState("all");
  const [partFilter, setPartFilter] = useState("all");
  const [toothFilter, setToothFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<ContrateSort>("part");
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
  const [station, setStation] = useState("pinion");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readContrateRules(readJson(CTR_KEY, [])));
    setViews(readContrateViews(readJson(CTR_VIEW_KEY, [])));
    setDensity(contrateDensity(readJson(CTR_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Contrate[]) {
    setCards(next);
    writeJson(CTR_KEY, next);
  }
  function storeViews(next: ContrateView[]) {
    setViews(next);
    writeJson(CTR_VIEW_KEY, next);
  }
  function storeDensity(next: ContrateDensity) {
    setDensity(next);
    writeJson(CTR_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortContrateRules(visibleContrateRules(cards, tray, query, keeperFilter, washFilter, partFilter, toothFilter, lockFilter), sort),
    [cards, tray, query, keeperFilter, washFilter, partFilter, toothFilter, lockFilter, sort],
  );
  const counts = contrateCounts(cards, shown, station);
  const bars = contrateBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = contrateTimeline(cards);
  const reminders = reminderContrateRules(cards);
  const keepers = contrateKeepers(cards);
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
        download("contrate-rules.csv", contrateCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveContrateFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveContrateFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addContrate(cards, { title, note, keeper, part, tooth: toothNo, wash, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-contrate" aria-label={v4("ctrTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-contrate-mast">
        <p className="c4-contrate-seal" data-logo="mono">{v4("ctrLogo")}</p>
        <div>
          <p className="c4-contrate-kicker">{v4("ctrSub")}</p>
          <h2 className="c4-title">{v4("ctrTitle")}</h2>
        </div>
        <p className="c4-contrate-count">{shown.length}</p>
      </header>
      <p className="c4-contrate-links">
        <Link href={crmv4Href(base, "jcq")}>{v4("jcqTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ctrCustomers")}</Link>
      </p>
      <p className="c4-contrate-hint">{v4("ctrHint")}</p>
      {viewer && <p className="c4-contrate-note">{v4("ctrViewer")}</p>}
      <p className="c4-contrate-meta">{v4("ctrFair")} {fair || "—"} · {v4("ctrBusy")} {busy || "—"} · {v4("ctrSuggest")} {partLabel(v4, suggestedPart)} · {washLabel(v4, suggestedWash)} · {suggestedTooth}</p>
      <ol className="c4-contrate-index" aria-label={v4("ctrRemind")}>
        <li data-tone="gold">{v4("ctrOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("ctrIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("ctrBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("ctrResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-contrate-remind c4-contrate-notices" role="status" aria-label={v4("ctrRemind")}>
          {reminders.map((name) => <li key={name}>{v4("ctrOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-contrate-chart" aria-label={v4("ctrChart")}>
        {bars.map((bar) => (
          <button key={bar.part} type="button" className="c4-contrate-column" data-on={partFilter === bar.part ? "1" : "0"} onClick={() => setPartFilter(partFilter === bar.part ? "all" : bar.part)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{partLabel(v4, bar.part)}</span>
          </button>
        ))}
      </div>
      <form className="c4-contrate-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("ctrEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("ctrEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("ctrNote")}<input className="c4-field" aria-label={v4("ctrNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("ctrKeeper")}<input className="c4-field" aria-label={v4("ctrKeeper")} aria-required={false} value={keeper} maxLength={24} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} /></label>
        <label className="c4-lab">{v4("ctrPart")}<select className="c4-field" aria-label={v4("ctrPart")} value={part} disabled={viewer} onChange={(event) => setPart(event.target.value)}><option value="">{v4("ctrBlankPart")}</option>{CTR_PARTS.map((item) => <option key={item} value={item}>{partLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("ctrWash")}<select className="c4-field" aria-label={v4("ctrWash")} value={wash} disabled={viewer} onChange={(event) => setWash(event.target.value)}><option value="">{v4("ctrAll")}</option>{WASHES.map((item) => <option key={item} value={item}>{washLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("ctrTooth")}<select className="c4-field" aria-label={v4("ctrTooth")} value={toothNo} disabled={viewer} onChange={(event) => setToothNo(event.target.value)}><option value="">{v4("ctrAll")}</option>{TEETH.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("ctrLock")}<select className="c4-field" aria-label={v4("ctrLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("ctrAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("ctrTag")}<input className="c4-field" aria-label={v4("ctrTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ctrAdd")}</button>
      </form>
      <div className="c4-contrate-tools">
        <input ref={searchRef} className="c4-field c4-contrate-search" aria-label={v4("ctrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ctrSearch")} />
        {(["bench", "latch", "case"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bench" ? "ctrBench" : item === "latch" ? "ctrLatch" : "ctrCase")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={partFilter === "inner" ? "1" : "0"} onClick={() => setPartFilter(partFilter === "inner" ? "all" : "inner")}>{v4("ctrInner")}</button>
        <button type="button" className="c4-chip" data-on={partFilter === "outer" ? "1" : "0"} onClick={() => setPartFilter(partFilter === "outer" ? "all" : "outer")}>{v4("ctrOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort(sort === "keeper" ? "part" : "keeper")}>{sort === "keeper" ? v4("ctrSortKeeper") : v4("ctrSortPart")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("ctrClose") : v4("ctrAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("ctrTimeline")}</button>
        <label className="c4-lab">{v4("ctrDesk")}<select className="c4-field" aria-label={v4("ctrDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{CTR_PARTS.map((item) => <option key={item} value={item}>{partLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-contrate-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addContrateView(views, { id, name: viewName, tray, query, keeper: keeperFilter, wash: washFilter, part: partFilter, tooth: toothFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("ctrViewName")}<input className="c4-field" aria-label={v4("ctrViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("ctrSaveView")}</button>
      </form>
      <ul className="c4-contrate-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setKeeperFilter(view.keeper); setWashFilter(view.wash); setPartFilter(view.part); setToothFilter(view.tooth); setLockFilter(view.lock); }}>{v4("ctrApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropContrateView(views, view.id))}>{v4("ctrDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-contrate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkContrateBank(cards, picked))}>{v4("ctrBulkBank")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkContrateCase(cards, picked))}>{v4("ctrBulkCase")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkContrateGraphite(cards, picked))}>{v4("ctrBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkContrateTag(cards, picked))}>{v4("ctrBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("contrate-rules.csv", contrateCsv(shown, station))}>{v4("ctrCsv")}</button>
        <p className="c4-contrate-meta">{v4("ctrKeys")} / n x a j k · {v4("ctrQuiet")} {counts.quiet} · {v4("ctrInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-contrate-time" aria-label={v4("ctrTimeline")}>
          {timeline.map((lane) => <li key={lane.tooth}><span>{lane.tooth}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("ctrEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-contrate-list">
          {shown.map((card) => {
            const late = lateContrate(card, station);
            return (
              <li key={card.id} className="c4-contrate-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleContrate(card) ? "1" : "0"} data-brisk={briskContrate(card) ? "1" : "0"} data-overdue={overdueContrate(card) ? "1" : "0"} data-resting={restingContrate(card) ? "1" : "0"} data-inner={contrateInner(card.part) ? "1" : "0"} data-outer={contrateOuter(card.part) ? "1" : "0"}>
                <label className="c4-contrate-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editContrate(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("ctrEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("ctrApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editContrateNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("ctrNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-contrate-meta">{partLabel(v4, card.part)} · {washLabel(v4, card.wash)} · {card.tooth ?? "—"} · {card.lock} · {card.keeper || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "ctrAuditSave")}` : ""}{late ? ` · ${v4("ctrOverdue")}` : ""}</p>
                </div>
                <div className="c4-contrate-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("ctrEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setContrateBank(cards, card.id, !card.banked))}>{card.banked ? v4("ctrFree") : v4("ctrBank")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setContrateWash(cards, card.id, suggestedWash))}>{v4("ctrSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setContrateLatch(cards, card.id, !card.latched))}>{card.latched ? v4("ctrUnlatch") : v4("ctrLatchIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setContrateCase(cards, card.id, !card.cased))}>{card.cased ? v4("ctrUncase") : v4("ctrCaseIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setContrateStar(cards, card.id, !card.starred))}>{card.starred ? v4("ctrUnstar") : v4("ctrStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addContrateTag(cards, card.id, "c"))}>{v4("ctrTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseToothFocused(cards, card.id))}>{v4("ctrRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerToothFocused(cards, card.id))}>{v4("ctrLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseLockFocused(cards, card.id))}>{v4("ctrLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerLockFocused(cards, card.id))}>{v4("ctrLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(washFocused(cards, card.id))}>{v4("ctrWash")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setContrateFocused(cards, card.id))}>{v4("ctrBank")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(latchContrateFocused(cards, card.id))}>{v4("ctrLatch")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starContrateFocused(cards, card.id))}>{v4("ctrStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(contrateCopy(card))}>{v4("ctrCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type JacquemartUser = { id?: string; name?: string | null; loginEnabled?: string | null };

export function JacquemartPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: JacquemartUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<JacquemartShape>("all");
  const [review, setReview] = useState<JacquemartReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): JacquemartRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { loginEnabled: textField(row.loginEnabled) } satisfies JacquemartValue,
    };
  }).filter((row): row is JacquemartRow => Boolean(row));
  const present = presentJacquemartLanes(rows);
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
    const next = readHiddenJacquemart(readJson(JCQ_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(JCQ_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedJacquemart(readJson(JCQ_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(JCQ_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleJacquemartLanes(present, hidden, showHidden);
  const shown = visibleJacquemart(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = jacquemartLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = jacquemartLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingJacquemart(rows);
  const leadHue = leadingJacquemartHue(rows);
  const whole = rows.filter((row) => jacquemartLane(row.code)).length;
  const share = jacquemartShare(laneJacquemartCount(rows, "code"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("jacquemart-lanes.csv", jacquemartLanesCsv(rows));
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
    writeJson(JCQ_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(JCQ_REVIEW_KEY, next);
  }

  return (
    <section className="c4-jacquemart" aria-label={v4("jcqTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-jacquemart-mast">
        <p className="c4-jacquemart-seal" data-logo="mono">{v4("jcqLogo")}</p>
        <div>
          <p className="c4-jacquemart-kicker">{v4("jcqSub")}</p>
          <h2 className="c4-title">{v4("jcqTitle")}</h2>
        </div>
        <p className="c4-jacquemart-count">{shown.length}</p>
      </header>
      <p className="c4-jacquemart-links">
        <Link href={crmv4Href(base, "ctr")}>{v4("ctrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("jcqCustomer")}</Link>
      </p>
      <p className="c4-jacquemart-hint">{v4("jcqHint")}</p>
      {viewer && <p className="c4-jacquemart-note">{v4("jcqViewer")}</p>}
      <p className="c4-jacquemart-meta">{v4("jcqLead")} {laneLabel(v4, lead)} · {v4("jcqToneLead")} {hueLabel(v4, leadHue)} · {v4("jcqShare")} {share}</p>
      <div className="c4-jacquemart-chart" aria-label={v4("jcqChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-jacquemart-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-jacquemart-tools">
        <input ref={searchRef} className="c4-field c4-jacquemart-search" aria-label={v4("jcqSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("jcqSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("jcqShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "jcqAll" : item === "reviewed" ? "jcqReviewed" : "jcqFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("jcqAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as JacquemartShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleJacquemart(hidden, item))}>{hidden.includes(item) ? v4("jcqShow") : v4("jcqHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-jacquemart-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkJacquemartReview(reviewed, picked, true))}>{v4("jcqBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkJacquemartReview(reviewed, picked, false))}>{v4("jcqBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("jacquemart-lanes.csv", jacquemartLanesCsv(rows))}>{v4("jcqCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("jacquemart-rows.csv", jacquemartRowsCsv(shown, reviewed))}>{v4("jcqRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("jcqLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("jcqFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("jcqEmpty")}</p>}
      <ul className="c4-jacquemart-list">
        {shown.map((row) => {
          const name = jacquemartCopy(row.code);
          const tone = jacquemartHue(row.code);
          return (
            <li key={row.id} className="c4-jacquemart-card" data-lane={jacquemartLane(row.code) || "open"} data-hue={tone || "none"} data-code={jacquemartLane(row.code) === "code" ? "1" : "0"} data-open={jacquemartOpen(row.code) ? "1" : "0"} data-even={jacquemartEven(row.code) ? "1" : "0"} data-digit={jacquemartDigit(row.code) ? "1" : "0"} data-letter={jacquemartLetter(row.code) ? "1" : "0"} data-mixed={jacquemartMixed(row.code) ? "1" : "0"} data-upper={jacquemartUpper(row.code) ? "1" : "0"} data-lower={jacquemartLower(row.code) ? "1" : "0"} data-space={jacquemartSpace(row.code) ? "1" : "0"} data-vowel={jacquemartVowel(row.code) ? "1" : "0"} data-tail={jacquemartTail(row.code) ? "1" : "0"} data-first={jacquemartFirst(row.code) ? "1" : "0"} data-held={jacquemartHeld(row.code) ? "1" : "0"} data-join={jacquemartJoin(row.code) ? "1" : "0"} data-gap={jacquemartGap(row.code) ? "1" : "0"}>
              <label className="c4-jacquemart-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-jacquemart-meta">{name || v4("jcqOpen")} · {jacquemartStamp(row.code) || "—"} · {jacquemartFamily(row.code) || "—"} · {jacquemartLength(row.code) ?? "—"} · {laneLabel(v4, jacquemartLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-jacquemart-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleJacquemartReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("jcqReviewed") : v4("jcqReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = jacquemartCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("jcqCopied") : v4("jcqCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("jcqCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
