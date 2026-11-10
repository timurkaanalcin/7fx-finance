"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LANE_KEY,
  LANE_REVIEW_KEY,
  SHEET_KEY,
  SHEET_VIEW_KEY,
  activeDay,
  activeGrade,
  activeInk,
  activeKeeper,
  activeLane,
  activeLaneDepth,
  activePress,
  activeShelf,
  activeWidth,
  addSheet,
  addSheetView,
  bulkReview,
  bulkSheetFile,
  bulkSheetPin,
  bulkSheetPress,
  clashDayCount,
  cycleInk,
  dayArg,
  dayBand,
  dayClashIds,
  dayGap,
  dayTimeline,
  dropSheetView,
  editSheet,
  editSheetNote,
  gradeArg,
  gradeClashCount,
  gradeClashIds,
  inkArg,
  inkOf,
  keeperArg,
  keeperLoad,
  laneArg,
  laneBand,
  laneCopy,
  laneDepth,
  laneDepthArg,
  laneDepths,
  laneParts,
  laneRowsCsv,
  laneShare,
  laneState,
  lanesCsv,
  lateSheet,
  leadingLane,
  leadingLaneDepth,
  nextSheet,
  oddLaneCount,
  partnerShelf,
  pressArg,
  pressCounts,
  pressOf,
  presentLanes,
  readHiddenLanes,
  readReviewed,
  readSheetViews,
  readSheets,
  resetSheets,
  setSheetFiled,
  setSheetPin,
  setSheetPress,
  sheetCopy,
  sheetCounts,
  sheetInks,
  sheetKeepers,
  sheetPresses,
  sheetShare,
  sheetShelves,
  sheetsCsv,
  shelfArg,
  suggestKeeper,
  suggestPress,
  suggestWidth,
  toggleLane,
  toggleReview,
  usedDays,
  visibleLaneBands,
  visibleLaneCustomers,
  visibleSheets,
  widthArg,
  type LaneRow,
  type LaneShape,
  type Sheet,
  type SheetInk,
  type SheetPress,
  type SheetTray,
  type SheetView,
} from "@/lib/crmv4/round176";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  address?: string | null;
};

type GlanceRow = LaneRow & { id: string };

const PRESSES = ["flat", "fold", "roll"] as const;
const BANDS = ["brief", "street", "estate", "atlas"] as const;

function pressName(v4: V4, press: SheetPress | string): string {
  if (press === "flat") return v4("hbrPressFlat");
  if (press === "fold") return v4("hbrPressFold");
  if (press === "roll") return v4("hbrPressRoll");
  return v4("hbrBlankPress");
}

function inkName(v4: V4, ink: SheetInk): string {
  if (ink === "ash") return v4("hbrInkAsh");
  if (ink === "straw") return v4("hbrInkStraw");
  if (ink === "soot") return v4("hbrInkSoot");
  return v4("hbrBlankInk");
}

function dayName(v4: V4, name: string): string {
  if (name === "dawn") return v4("hbrDawn");
  if (name === "noon") return v4("hbrNoon");
  if (name === "dusk") return v4("hbrDusk");
  if (name === "bloom") return v4("hbrBloom");
  if (name === "leaf") return v4("hbrLeaf");
  if (/^[1-7]$/.test(name)) return name;
  return v4("hbrBlankDay");
}

function gradeName(v4: V4, grade: number | null): string {
  if (grade === 1) return v4("hbrGrade1");
  if (grade === 2) return v4("hbrGrade2");
  if (grade === 3) return v4("hbrGrade3");
  return v4("hbrBlankGrade");
}

function widthName(v4: V4, width: number | null): string {
  if (width === 2) return v4("hbrWidth2");
  if (width === 4) return v4("hbrWidth4");
  if (width === 6) return v4("hbrWidth6");
  return v4("hbrBlankWidth");
}

function bandName(v4: V4, name: string): string {
  if (name === "brief") return v4("alnBrief");
  if (name === "street") return v4("alnStreet");
  if (name === "estate") return v4("alnEstate");
  if (name === "atlas") return v4("alnAtlas");
  if (name === "blank") return v4("alnClear");
  return v4("alnUnmarked");
}

function depthName(v4: V4, name: string): string {
  if (name === "near") return v4("alnNear");
  if (name === "mid") return v4("alnMid");
  if (name === "far") return v4("alnFar");
  return v4("alnUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "hbrAuditSave",
    edit: "hbrAuditEdit",
    ink: "hbrAuditInk",
    pin: "hbrAuditPin",
    unpin: "hbrAuditUnpin",
    press: "hbrAuditPress",
    release: "hbrAuditRelease",
    file: "hbrAuditFile",
    restore: "hbrAuditRestore",
    shift: "hbrAuditShift",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function dayLabel(day: number | null): string {
  return day === null ? "—" : String(day);
}

function gapLabel(v4: V4, day: number | null, desk: string): string {
  const gap = dayGap(day, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("hbrPast")} ${gap}`;
  if (gap < 0) return `${v4("hbrAhead")} ${Math.abs(gap)}`;
  return v4("hbrDue");
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

function typingTarget(event: KeyboardEvent): boolean {
  const tagName = (event.target as HTMLElement | null)?.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

function sameCards(left: readonly Sheet[], right: readonly Sheet[]): boolean {
  return left.length === right.length && left.every((card, index) => card.id === right[index]?.id && card.title === right[index]?.title && card.note === right[index]?.note && card.audit === right[index]?.audit);
}

export function HerbariumSheets({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Sheet[]>([]);
  const [views, setViews] = useState<SheetView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [day, setDay] = useState("");
  const [press, setPress] = useState("");
  const [shelf, setShelf] = useState("");
  const [ink, setInk] = useState("");
  const [grade, setGrade] = useState("");
  const [width, setWidth] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<SheetTray>("open");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [pressFilter, setPressFilter] = useState("all");
  const [shelfFilter, setShelfFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [widthFilter, setWidthFilter] = useState("all");
  const [sootOnly, setSootOnly] = useState(false);
  const [bloomOnly, setBloomOnly] = useState(false);
  const [partnerOnly, setPartnerOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [movePress, setMovePress] = useState("flat");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readSheets(readJson(SHEET_KEY, []));
    const saved = readSheetViews(readJson(SHEET_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(SHEET_KEY, next);
    writeJson(SHEET_VIEW_KEY, saved);
    setRole(storedRole());
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const keepers = sheetKeepers(cards);
  const presses = sheetPresses(cards);
  const shelves = sheetShelves(cards);
  const inks = sheetInks(cards);
  const bars = pressCounts(cards);
  const keeperOn = activeKeeper(keeperFilter, keepers);
  const pressOn = activePress(pressFilter, PRESSES);
  const shelfOn = activeShelf(shelfFilter, shelves);
  const inkOn = activeInk(inkFilter, inks);
  const dayOn = activeDay(dayFilter);
  const gradeOn = activeGrade(gradeFilter);
  const widthOn = activeWidth(widthFilter);
  const pickedDay = dayArg(dayOn);
  const shown = visibleSheets(
    cards,
    tray,
    query,
    keeperArg(keeperOn),
    pressArg(pressOn),
    shelfArg(shelfOn),
    inkArg(inkOn),
    pickedDay.exact,
    pickedDay.pick,
    gradeArg(gradeOn),
    widthArg(widthOn),
    sootOnly,
    bloomOnly,
    partnerOnly,
  );
  const timeline = dayTimeline(cards, query);
  const counts = sheetCounts(cards, desk);
  const clashes = clashDayCount(cards);
  const grades = gradeClashCount(cards);
  const dayUse = usedDays(cards);
  const total = cards.length;
  const nextId = nextSheet(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);
  const load = keeperLoad(cards, keeper);
  const suggested = suggestPress(cards);
  const lightKeeper = suggestKeeper(cards);
  const quietWidth = suggestWidth(cards);
  const partnerShare = sheetShare(counts.partner, total);
  const targets = picked.length ? picked : shown.map((card) => card.id);

  function store(next: Sheet[]) {
    setCards(next);
    writeJson(SHEET_KEY, next);
  }

  function storeViews(next: SheetView[]) {
    setViews(next);
    writeJson(SHEET_VIEW_KEY, next);
  }

  function clearDraft() {
    setTitle("");
    setNote("");
    setKeeper("");
    setDay("");
    setPress("");
    setShelf("");
    setInk("");
    setGrade("");
    setWidth("");
  }

  function copyCard(card: Sheet) {
    const body = sheetCopy(card.title);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: SheetView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(activeKeeper(view.keeper, sheetKeepers(cards)));
    setPressFilter(activePress(view.press, PRESSES));
    setShelfFilter(activeShelf(view.shelf, sheetShelves(cards)));
    setInkFilter(activeInk(view.ink, sheetInks(cards)));
    setDayFilter(activeDay(view.day));
    setGradeFilter(activeGrade(view.grade));
    setWidthFilter(activeWidth(view.width));
    setBoard("cards");
    setSootOnly(false);
    setBloomOnly(false);
    setPartnerOnly(false);
  }

  function togglePick(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <section className="c4-hbr" aria-label={v4("hbrTitle")} data-sheets="1" data-role={role}>
      <header className="c4-hbr-head">
        <p className="c4-hbr-plate" data-logo="mono">{v4("hbrLogo")}</p>
        <div>
          <p className="c4-hbr-kicker">{v4("hbrSub")}</p>
          <h2 className="c4-title">{v4("hbrTitle")}</h2>
        </div>
        <p className="c4-hbr-count">{shown.length}</p>
      </header>
      <details className="c4-hbr-rules">
        <summary>{v4("hbrRules")}</summary>
        <p className="c4-meta">{v4("hbrHint")}</p>
        <p className="c4-meta">{v4("hbrLocal")}</p>
        <p className="c4-meta">{v4("hbrBlank")}</p>
        <p className="c4-meta">{v4("hbrKeeperBlank")}</p>
        <p className="c4-meta">{v4("hbrDayBlank")}</p>
        <p className="c4-meta">{v4("hbrPressBlank")}</p>
        <p className="c4-meta">{v4("hbrShelfBlank")}</p>
        <p className="c4-meta">{v4("hbrInkBlank")}</p>
        <p className="c4-meta">{v4("hbrGradeBlank")}</p>
        <p className="c4-meta">{v4("hbrWidthBlank")}</p>
        <p className="c4-meta">{v4("hbrNoteBlank")}</p>
        <p className="c4-meta">{v4("hbrEscape")}</p>
        <p className="c4-meta">{v4("hbrSlash")}</p>
        <p className="c4-meta">{v4("hbrNew")}</p>
      </details>
      {viewer ? <p className="c4-hbr-notice" role="status">{v4("hbrViewer")}</p> : null}
      <p className="c4-hbr-notice" role="status">
        <span>{v4("hbrNotice")}</span>
        <span className="c4-hbr-count">{counts.bloom}</span>
        <button type="button" className="c4-btn" aria-pressed={bloomOnly} onClick={() => { setBloomOnly((value) => !value); setTray("open"); }}>
          {bloomOnly ? v4("hbrNoticeAll") : v4("hbrNoticeBloom")}
        </button>
      </p>
      <p className="c4-hbr-notice" role="status">
        <span>{v4("hbrLate")}</span>
        <span className="c4-hbr-count">{counts.late}</span>
      </p>
      <p className="c4-hbr-notice" role="status">
        <span>{v4("hbrSoon")}</span>
        <span className="c4-hbr-count">{counts.soon}</span>
      </p>
      <p className="c4-hbr-notice" role="status">
        <span>{v4("hbrDayUse")}</span>
        <span className="c4-hbr-count">{dayUse}</span>
      </p>
      <p className="c4-hbr-notice" role="status">
        <span>{v4("hbrClash")}</span>
        <span className="c4-hbr-count">{clashes}</span>
      </p>
      <p className="c4-hbr-notice" role="status">
        <span>{v4("hbrGradeClash")}</span>
        <span className="c4-hbr-count">{grades}</span>
      </p>
      <p className="c4-hbr-notice" role="status">
        <span>{v4("hbrPartner")}</span>
        <span className="c4-hbr-count">{counts.partner}</span>
        <span>{v4("hbrPartnerShare")} {partnerShare}%</span>
        <button type="button" className="c4-btn" aria-pressed={partnerOnly} onClick={() => setPartnerOnly((value) => !value)}>
          {partnerOnly ? v4("hbrPartnerAll") : v4("hbrPartnerOnly")}
        </button>
      </p>
      <p className="c4-hbr-suggest" role="status">
        <span>{v4("hbrSuggest")}</span> {pressName(v4, suggested)}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setPress(suggested)}>{v4("hbrUsePress")}</button>
      </p>
      <p className="c4-hbr-suggest" role="status">
        <span>{v4("hbrSuggestKeeper")}</span> {lightKeeper || v4("hbrBlankKeeper")}
        <button type="button" className="c4-btn" disabled={viewer || !lightKeeper} onClick={() => setKeeper(lightKeeper)}>{v4("hbrUseKeeper")}</button>
      </p>
      <p className="c4-hbr-suggest" role="status">
        <span>{v4("hbrSuggestWidth")}</span> {widthName(v4, quietWidth)}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWidth(String(quietWidth))}>{v4("hbrUseWidth")}</button>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-hbr-pins" aria-label={v4("hbrPinned")}>
          {pinned.map((card) => (
            <li key={card.id}><span className="c4-hbr-mark" aria-hidden="true">{dayLabel(card.day)}</span> {card.title}</li>
          ))}
        </ul>
      )}
      <section className="c4-hbr-kpi" aria-label={v4("hbrKpi")}>
        {(["open", "pressed", "filed"] as const).map((key) => {
          const count = counts[key];
          const share = sheetShare(count, total);
          const label = key === "open" ? v4("hbrWaiting") : key === "pressed" ? v4("hbrPressed") : v4("hbrFiled");
          return (
            <p key={key} className="c4-hbr-meter" data-tray={key}>
              <span>{label}</span>
              <span className="c4-hbr-count">{count}</span>
              <span>{v4("hbrShare")} {share}%</span>
              <span className="c4-hbr-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-hbr-chart" aria-label={v4("hbrChart")}>
        <p className="c4-hbr-kicker">{v4("hbrChart")}</p>
        {PRESSES.map((name, index) => {
          const count = bars[index] || 0;
          const bar = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-hbr-col" data-on={pressOn === name ? "1" : "0"} aria-pressed={pressOn === name} onClick={() => setPressFilter(pressOn === name ? "all" : name)}>
              <span>{pressName(v4, name)}</span>
              <span className="c4-hbr-bar" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <div className="c4-hbr-split">
        <form className="c4-hbr-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addSheet(cards, { id: `hbr-${Date.now()}`, title, note, keeper, day, press, shelf, ink, grade, width });
          if (sameCards(next, cards)) return;
          store(next);
          clearDraft();
        }}>
          <label className="c4-lab">
            <span>{v4("hbrLine")}</span>
            <input ref={titleRef} className="c4-field" aria-label={v4("hbrLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              clearDraft();
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("hbrNote")}</span>
            <input className="c4-field" aria-label={v4("hbrNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("hbrKeeper")}</span>
            <input className="c4-field" aria-label={v4("hbrKeeper")} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">{v4("hbrLoad")} {load}</p>
          <label className="c4-lab">
            <span>{v4("hbrDay")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("hbrDay")} value={day} disabled={viewer} onChange={(event) => setDay(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("hbrPress")}</span>
            <select className="c4-select" aria-label={v4("hbrPress")} value={press} disabled={viewer} onChange={(event) => setPress(event.target.value)}>
              <option value="">{v4("hbrBlankPress")}</option>
              <option value="flat">{v4("hbrPressFlat")}</option>
              <option value="fold">{v4("hbrPressFold")}</option>
              <option value="roll">{v4("hbrPressRoll")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("hbrShelf")}</span>
            <input className="c4-field" aria-label={v4("hbrShelf")} value={shelf} disabled={viewer} onChange={(event) => setShelf(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("hbrInk")}</span>
            <select className="c4-select" aria-label={v4("hbrInk")} value={ink} disabled={viewer} onChange={(event) => setInk(event.target.value)}>
              <option value="">{v4("hbrBlankInk")}</option>
              <option value="ash">{v4("hbrInkAsh")}</option>
              <option value="straw">{v4("hbrInkStraw")}</option>
              <option value="soot">{v4("hbrInkSoot")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("hbrGrade")}</span>
            <select className="c4-select" aria-label={v4("hbrGrade")} value={grade} disabled={viewer} onChange={(event) => setGrade(event.target.value)}>
              <option value="">{v4("hbrBlankGrade")}</option>
              <option value="1">{v4("hbrGrade1")}</option>
              <option value="2">{v4("hbrGrade2")}</option>
              <option value="3">{v4("hbrGrade3")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("hbrWidth")}</span>
            <select className="c4-select" aria-label={v4("hbrWidth")} value={width} disabled={viewer} onChange={(event) => setWidth(event.target.value)}>
              <option value="">{v4("hbrBlankWidth")}</option>
              <option value="2">{v4("hbrWidth2")}</option>
              <option value="4">{v4("hbrWidth4")}</option>
              <option value="6">{v4("hbrWidth6")}</option>
            </select>
          </label>
          <button type="submit" className="c4-btn" disabled={viewer}>{v4("hbrAdd")}</button>
        </form>
        <div className="c4-hbr-board">
          <div className="c4-row" role="group" aria-label={v4("hbrTitle")}>
            <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("hbrWaiting")}</button>
            <button type="button" className="c4-chip" data-on={tray === "pressed" ? "1" : "0"} aria-pressed={tray === "pressed"} onClick={() => setTray("pressed")}>{v4("hbrPressed")}</button>
            <button type="button" className="c4-chip" data-on={tray === "filed" ? "1" : "0"} aria-pressed={tray === "filed"} onClick={() => setTray("filed")}>{v4("hbrFiled")}</button>
            <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} aria-pressed={board === "cards"} onClick={() => setBoard("cards")}>{v4("hbrCards")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard("timeline")}>{v4("hbrTimeline")}</button>
            <button type="button" className="c4-chip" data-on={sootOnly ? "1" : "0"} aria-pressed={sootOnly} onClick={() => setSootOnly((value) => !value)}>{v4("hbrSootOnly")}</button>
            <button type="button" className="c4-chip" data-on={bloomOnly ? "1" : "0"} aria-pressed={bloomOnly} onClick={() => { setBloomOnly((value) => !value); setTray("open"); }}>{v4("hbrBloomOnly")}</button>
            <button type="button" className="c4-btn" onClick={() => download("herbarium-sheets.csv", sheetsCsv(cards, desk))}>{v4("hbrCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setPicked(shown.map((card) => card.id))}>{v4("hbrPickAll")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("hbrPickNone")}</button>
            <span className="c4-hbr-count">{v4("hbrPicked")} {picked.length}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSheetPin(cards, targets, true))}>{v4("hbrBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSheetFile(cards, targets, true))}>{v4("hbrBulkFile")}</button>
            <label className="c4-lab">
              <span>{v4("hbrBulkPress")}</span>
              <select className="c4-select" aria-label={v4("hbrBulkPress")} value={movePress} disabled={viewer} onChange={(event) => setMovePress(event.target.value)}>
                <option value="flat">{v4("hbrPressFlat")}</option>
                <option value="fold">{v4("hbrPressFold")}</option>
                <option value="roll">{v4("hbrPressRoll")}</option>
              </select>
            </label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSheetPress(cards, targets, movePress))}>{v4("hbrBulkPress")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetSheets()); setPicked([]); }}>{v4("hbrReset")}</button>
          </div>
          <label className="c4-lab">
            <span>{v4("hbrSearch")}</span>
            <input ref={searchRef} className="c4-field" aria-label={v4("hbrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              setQuery("");
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("hbrDesk")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("hbrDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">
            {v4("hbrNext")} {nextCard ? nextCard.title : v4("hbrNextNone")}
          </p>
          <div className="c4-row" role="group" aria-label={v4("hbrKeepers")}>
            <button type="button" className="c4-chip" data-on={keeperOn === "all" ? "1" : "0"} aria-pressed={keeperOn === "all"} onClick={() => setKeeperFilter("all")}>{v4("hbrAllKeepers")}</button>
            <button type="button" className="c4-chip" data-on={keeperOn === "blank" ? "1" : "0"} aria-pressed={keeperOn === "blank"} onClick={() => setKeeperFilter("blank")}>{v4("hbrBlankKeeper")}</button>
            {keepers.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={keeperOn === name ? "1" : "0"} aria-pressed={keeperOn === name} onClick={() => setKeeperFilter(name)}>{name}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("hbrPresses")}>
            <button type="button" className="c4-chip" data-on={pressOn === "all" ? "1" : "0"} aria-pressed={pressOn === "all"} onClick={() => setPressFilter("all")}>{v4("hbrAllPresses")}</button>
            <button type="button" className="c4-chip" data-on={pressOn === "blank" ? "1" : "0"} aria-pressed={pressOn === "blank"} onClick={() => setPressFilter("blank")}>{v4("hbrBlankPress")}</button>
            {presses.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={pressOn === name ? "1" : "0"} aria-pressed={pressOn === name} onClick={() => setPressFilter(name)}>{pressName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("hbrShelves")}>
            <button type="button" className="c4-chip" data-on={shelfOn === "all" ? "1" : "0"} aria-pressed={shelfOn === "all"} onClick={() => setShelfFilter("all")}>{v4("hbrAllShelves")}</button>
            <button type="button" className="c4-chip" data-on={shelfOn === "blank" ? "1" : "0"} aria-pressed={shelfOn === "blank"} onClick={() => setShelfFilter("blank")}>{v4("hbrBlankShelf")}</button>
            {shelves.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={shelfOn === name ? "1" : "0"} aria-pressed={shelfOn === name} onClick={() => setShelfFilter(name)}>{name}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("hbrInks")}>
            <button type="button" className="c4-chip" data-on={inkOn === "all" ? "1" : "0"} aria-pressed={inkOn === "all"} onClick={() => setInkFilter("all")}>{v4("hbrAllInks")}</button>
            <button type="button" className="c4-chip" data-on={inkOn === "blank" ? "1" : "0"} aria-pressed={inkOn === "blank"} onClick={() => setInkFilter("blank")}>{v4("hbrBlankInk")}</button>
            {inks.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={inkOn === name ? "1" : "0"} aria-pressed={inkOn === name} onClick={() => setInkFilter(name)}>{inkName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("hbrDays")}>
            {(["all", "blank", "dawn", "noon", "dusk", "bloom", "leaf"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={dayOn === name ? "1" : "0"} aria-pressed={dayOn === name} onClick={() => setDayFilter(name)}>
                {name === "all" ? v4("hbrAllDays") : dayName(v4, name)}
              </button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("hbrGrades")}>
            {(["all", "blank", "1", "2", "3"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={gradeOn === name ? "1" : "0"} aria-pressed={gradeOn === name} onClick={() => setGradeFilter(name)}>
                {name === "all" ? v4("hbrAllGrades") : name === "blank" ? v4("hbrBlankGrade") : gradeName(v4, Number(name))}
              </button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("hbrWidths")}>
            {(["all", "blank", "2", "4", "6"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={widthOn === name ? "1" : "0"} aria-pressed={widthOn === name} onClick={() => setWidthFilter(name)}>
                {name === "all" ? v4("hbrAllWidths") : name === "blank" ? v4("hbrBlankWidth") : widthName(v4, Number(name))}
              </button>
            ))}
          </div>
          <form className="c4-row" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            const next = addSheetView(views, {
              id: `view-${Date.now()}`,
              name: viewName,
              tray,
              query,
              keeper: keeperOn,
              press: pressOn,
              shelf: shelfOn,
              ink: inkOn,
              day: dayOn,
              grade: gradeOn,
              width: widthOn,
            });
            if (next.length === views.length) return;
            storeViews(next);
            setViewName("");
          }}>
            <label className="c4-lab">
              <span>{v4("hbrViewName")}</span>
              <input className="c4-field" aria-label={v4("hbrViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
            </label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("hbrSaveView")}</button>
          </form>
          <section aria-label={v4("hbrViews")}>
            <p className="c4-hbr-kicker">{v4("hbrViews")}</p>
            {!views.length && <p className="c4-hbr-empty">{v4("hbrViewEmpty")}</p>}
            <ul className="c4-hbr-views">
              {views.map((view) => (
                <li key={view.id}>
                  <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSheetView(views, view.id))}>{v4("hbrDropView")}</button>
                </li>
              ))}
            </ul>
          </section>
          {board === "cards" && !shown.length && <p className="c4-hbr-empty">{v4("hbrEmpty")}</p>}
          {board === "cards" && (
            <ul className="c4-hbr-rows">
              {shown.map((card) => {
                const clashesOn = dayClashIds(cards, card.id);
                const gradesOn = gradeClashIds(cards, card.id);
                const gap = gapLabel(v4, card.day, desk);
                const band = dayBand(card.day);
                const editingCard = editing === card.id;
                const late = lateSheet(card, desk);
                return (
                  <li key={card.id} data-ink={card.ink || "blank"} data-press={card.press || "blank"} data-late={late ? "1" : "0"} data-partner={partnerShelf(card.shelf) ? "1" : "0"}>
                    <span className="c4-hbr-mark" aria-hidden="true">{dayLabel(card.day)}</span>
                    <div>
                      <label className="c4-hbr-pick">
                        <input type="checkbox" checked={picked.includes(card.id)} aria-label={v4("hbrPick")} onChange={() => togglePick(card.id)} />
                        <span>{v4("hbrPick")}</span>
                      </label>
                      {editingCard ? (
                        <form className="c4-row" onSubmit={(event) => {
                          event.preventDefault();
                          if (viewer) return;
                          const titled = editSheet(cards, card.id, draft);
                          store(editSheetNote(titled, card.id, noteDraft));
                          setEditing("");
                        }}>
                          <input className="c4-field" aria-label={v4("hbrEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                          <input className="c4-field" aria-label={v4("hbrNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                          <button type="submit" className="c4-btn" disabled={viewer}>{v4("hbrSaveEdit")}</button>
                        </form>
                      ) : (
                        <>
                          <p>{card.title}</p>
                          {card.note ? <p className="c4-meta">{card.note}</p> : null}
                        </>
                      )}
                      <p className="c4-meta">
                        {card.keeper || v4("hbrBlankKeeper")}
                        {" · "}
                        {dayLabel(card.day)}
                        {" · "}
                        {pressName(v4, pressOf(card.press))}
                        {" · "}
                        {card.shelf || v4("hbrBlankShelf")}
                        {" · "}
                        {inkName(v4, inkOf(card.ink))}
                        {" · "}
                        {gradeName(v4, card.grade)}
                        {" · "}
                        {widthName(v4, card.width)}
                        {band === "blank" ? "" : ` · ${dayName(v4, band)}`}
                        {gap ? ` · ${gap}` : ""}
                        {late ? ` · ${v4("hbrLate")}` : ""}
                        {card.width === 2 && !card.pressed && !card.filed ? ` · ${v4("hbrSoon")}` : ""}
                        {partnerShelf(card.shelf) ? ` · ${v4("hbrPartner")}` : ""}
                        {auditName(v4, card.audit) ? ` · ${v4("hbrAudit")} ${auditName(v4, card.audit)}` : ""}
                        {" · "}
                        {clashesOn.length ? `${v4("hbrClash")} ${clashesOn.length}` : v4("hbrClashNone")}
                        {" · "}
                        {gradesOn.length ? `${v4("hbrGradeClash")} ${gradesOn.length}` : v4("hbrGradeClashNone")}
                      </p>
                    </div>
                    <div className="c4-row">
                      <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("hbrCopied") : v4("hbrCopy")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); setNoteDraft(card.note); }}>{v4("hbrEdit")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleInk(cards, card.id))}>{v4("hbrInkUp")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setSheetPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("hbrUnpin") : v4("hbrPin")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pressed} onClick={() => store(setSheetPress(cards, card.id, !card.pressed))}>{card.pressed ? v4("hbrRelease") : v4("hbrPressOn")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.filed} onClick={() => store(setSheetFiled(cards, card.id, !card.filed))}>{card.filed ? v4("hbrRestore") : v4("hbrFile")}</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {board === "timeline" && (
            <ol className="c4-hbr-time">
              {timeline.map((card) => (
                <li key={card.id}>
                  <span className="c4-hbr-clock">{dayLabel(card.day)}</span>
                  <p>{card.title}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}

export function AddressLanes({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenBands, setHiddenBands] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [depth, setDepth] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [review, setReview] = useState<"all" | "reviewed" | "open">("all");
  const [shape, setShape] = useState<LaneShape>("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      note: row.address,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data]);
  const present = presentLanes(rows);
  const presentKey = present.join("\n");
  const presentIds = rows.map((row) => row.id);
  const idKey = presentIds.join("\n");
  const bandsOn = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const state = laneState(row.note);
      if (state === "") continue;
      const band = state === "set" ? laneBand(row.note) : "";
      counts.set(band, (counts.get(band) || 0) + 1);
    }
    return ["", ...BANDS].map((band) => ({ band, count: counts.get(band) || 0 })).filter((line) => line.count);
  }, [rows]);
  const depthNames = laneDepths(rows).map((line) => line.depth).filter(Boolean);
  const bandNames = present.filter((band) => band !== "blank");
  const leadBand = leadingLane(rows);
  const leadDepth = leadingLaneDepth(rows);
  const odd = oddLaneCount(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const known = presentKey ? presentKey.split("\n") : [];
    const next = readHiddenLanes(readJson(LANE_KEY, []), known);
    setHiddenBands(next);
    writeJson(LANE_KEY, next);
  }, [loading, failed, presentKey]);
  useEffect(() => {
    if (loading || failed) return;
    const known = idKey ? idKey.split("\n") : [];
    const next = readReviewed(readJson(LANE_REVIEW_KEY, []), known);
    setReviewed(next);
    writeJson(LANE_REVIEW_KEY, next);
  }, [loading, failed, idKey]);
  const chips = visibleLaneBands(present, hiddenBands, showHidden);
  const depthOn = activeLaneDepth(depth, depthNames);
  const bandOn = selected ? activeLane(selected, bandNames) : "all";
  const shown = visibleLaneCustomers(
    rows,
    selected ? laneArg(bandOn === "all" && selected === "blank" ? "blank" : bandOn) : null,
    laneDepthArg(depthOn),
    query,
    review,
    reviewed,
    shape,
  );
  const widest = Math.max(1, ...bandsOn.map((line) => line.count));
  const setCount = rows.filter((row) => laneState(row.note) === "set").length;
  const openCount = rows.filter((row) => !reviewed.includes(row.id)).length;

  function store(next: string[], clear: string) {
    setHiddenBands(next);
    writeJson(LANE_KEY, next);
    if (clear && selected === clear) setSelected("");
  }

  function storeReview(next: string[]) {
    setReviewed(next);
    writeJson(LANE_REVIEW_KEY, next);
  }

  function copyCode(row: GlanceRow) {
    const body = laneCopy(row.note);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(row.id);
  }

  return (
    <section className="c4-aln" aria-label={v4("alnTitle")} data-lanes="1">
      <header className="c4-aln-head">
        <div>
          <p className="c4-hbr-kicker">{v4("alnSub")}</p>
          <h2 className="c4-title">{v4("alnTitle")}</h2>
        </div>
        <p className="c4-hbr-count">{v4("alnRows")} {rows.length}</p>
      </header>
      <details className="c4-hbr-rules">
        <summary>{v4("alnRules")}</summary>
        <p className="c4-meta">{v4("alnHint")}</p>
        <p className="c4-meta">{v4("alnKept")}</p>
        <p className="c4-meta">{v4("alnEscape")}</p>
      </details>
      <p className="c4-hbr-notice" role="status">
        <span>{v4("alnSetNotice")}</span>
        <span className="c4-hbr-count">{setCount}</span>
      </p>
      <p className="c4-hbr-notice" role="status">
        <span>{v4("alnUnreviewed")}</span>
        <span className="c4-hbr-count">{openCount}</span>
      </p>
      <p className="c4-hbr-notice" role="status">
        <span>{v4("alnOdd")}</span>
        <span className="c4-hbr-count">{odd}</span>
        <button type="button" className="c4-btn" aria-pressed={shape === "odd"} onClick={() => setShape(shape === "odd" ? "all" : "odd")}>
          {shape === "odd" ? v4("alnAllShapes") : v4("alnOddOnly")}
        </button>
        <button type="button" className="c4-btn" aria-pressed={shape === "hash"} onClick={() => setShape(shape === "hash" ? "all" : "hash")}>{v4("alnHash")}</button>
      </p>
      {leadBand ? <p className="c4-aln-lead"><span>{v4("alnLeadBand")}</span> {bandName(v4, leadBand)}</p> : null}
      {leadDepth ? <p className="c4-aln-lead"><span>{v4("alnLeadDepth")}</span> {depthName(v4, leadDepth)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("alnBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("address-lanes.csv", lanesCsv(rows))}>{v4("alnCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("address-lane-rows.csv", laneRowsCsv(rows, reviewed))}>{v4("alnRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => storeReview(bulkReview(reviewed, shown.map((row) => row.id), presentIds, true))}>{v4("alnBulkReview")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("alnLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("alnFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-hbr-empty">{v4("alnNone")}</p>}
      {bandsOn.length > 0 && (
        <section className="c4-aln-chart" aria-label={v4("alnAllBands")}>
          {bandsOn.map((line) => {
            const share = laneShare(line.count, rows.length);
            const bar = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.band || "blank";
            return (
              <p key={name} className="c4-aln-col" data-band={name}>
                <span>{bandName(v4, line.band)}</span>
                <span className="c4-hbr-track" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("alnShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("alnShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("alnShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("alnHidden")}</button>
      </div>
      <div className="c4-aln-bands" role="group" aria-label={v4("alnAllBands")}>
        <button type="button" className="c4-aln-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("alnAllBands")}</span>
          <span className="c4-hbr-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const name = item || "blank";
          const count = bandsOn.find((line) => (line.band || "blank") === name)?.count || 0;
          return (
            <div key={name} className="c4-aln-band" data-on={selected === name ? "1" : "0"}>
              <button type="button" aria-pressed={selected === name} onClick={() => setSelected(selected === name ? "" : name)}>
                <span>{bandName(v4, item)}</span>
                <span className="c4-hbr-count">{count}</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleLane(hiddenBands, name, present), name)}>{showHidden ? v4("alnShow") : v4("alnHide")}</button>
            </div>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("alnDepths")}>
        <button type="button" className="c4-chip" data-on={depthOn === "all" ? "1" : "0"} aria-pressed={depthOn === "all"} onClick={() => setDepth("all")}>{v4("alnAllDepths")}</button>
        {depthNames.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={depthOn === name ? "1" : "0"} aria-pressed={depthOn === name} onClick={() => setDepth(depthOn === name ? "all" : name)}>{depthName(v4, name)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("alnShapes")}>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} aria-pressed={review === "all"} onClick={() => setReview("all")}>{v4("alnAllMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} aria-pressed={review === "open"} onClick={() => setReview("open")}>{v4("alnOpenMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} aria-pressed={review === "reviewed"} onClick={() => setReview("reviewed")}>{v4("alnReviewed")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("alnSearch")}</span>
        <input className="c4-field" aria-label={v4("alnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-hbr-empty">{v4("alnEmpty")}</p>}
      <ul className="c4-aln-rows">
        {shown.map((row) => {
          const band = laneBand(row.note);
          const deep = laneDepth(row.note);
          const parts = laneParts(row.note);
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} data-band={band || "blank"} data-reviewed={seen ? "1" : "0"}>
              <div>
                <p>{row.label || row.id}</p>
                <p className="c4-meta">{bandName(v4, band || (laneState(row.note) === "clear" ? "blank" : ""))} · {depthName(v4, deep)} · {v4("alnParts")} {parts}</p>
              </div>
              <div className="c4-row">
                <button type="button" className="c4-btn" onClick={() => copyCode(row)}>{copied === row.id ? v4("alnCopied") : v4("alnCopy")}</button>
                <button type="button" className="c4-btn" aria-pressed={seen} onClick={() => storeReview(toggleReview(reviewed, row.id, presentIds))}>{v4("alnReview")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
