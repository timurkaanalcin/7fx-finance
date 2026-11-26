"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DMK_HIDE_KEY,
  DMK_REVIEW_KEY,
  VGN_DENSITY_KEY,
  VGN_KEY,
  VGN_SHIFTS,
  VGN_VIEW_KEY,
  addFrame,
  addFrameTag,
  addFrameView,
  briskFrame,
  bulkDmkReview,
  bulkFrameDrawer,
  bulkFrameRaise,
  bulkFrameSoot,
  bulkFrameTag,
  busiestFramer,
  clipFrameFocused,
  dmkBare,
  dmkBench,
  dmkCopy,
  dmkCourt,
  dmkDigit,
  dmkEven,
  dmkFamily,
  dmkFirst,
  dmkHeld,
  dmkHue,
  dmkLane,
  dmkLanes,
  dmkLanesCsv,
  dmkLength,
  dmkLetter,
  dmkLower,
  dmkMixed,
  dmkOpen,
  dmkPair,
  dmkReturn,
  dmkRowsCsv,
  dmkScope,
  dmkShare,
  dmkShort,
  dmkShut,
  dmkSpace,
  dmkSpan,
  dmkStamp,
  dmkTail,
  dmkUpper,
  dmkVowel,
  dmkWait,
  dropFrameView,
  editFrame,
  editFrameNote,
  fairFramer,
  filmFocused,
  frameBars,
  frameCool,
  frameCopy,
  frameCounts,
  frameCsv,
  frameDensity,
  frameFramers,
  frameTimeline,
  frameWarm,
  idleFrame,
  laneDmkCount,
  lateFrame,
  leadingDmk,
  leadingDmkHue,
  lowerLayerFocused,
  lowerSpanFocused,
  moveFrameFocus,
  overdueFrame,
  presentDmkLanes,
  raiseLayerFocused,
  raiseSpanFocused,
  readFrameViews,
  readFrames,
  readHiddenDmk,
  readReviewedDmk,
  reminderFrames,
  restingFrame,
  setFrameClip,
  setFrameDrawer,
  setFrameFilm,
  setFrameFocused,
  setFrameRaised,
  setFrameStar,
  sortFrames,
  starFrameFocused,
  suggestFilm,
  suggestShift,
  suggestSpan,
  toggleDmk,
  toggleDmkReview,
  visibleDmk,
  visibleDmkLanes,
  visibleFrames,
  type DmkReview,
  type DmkRow,
  type DmkShape,
  type DmkValue,
  type Frame,
  type FrameDensity,
  type FrameSort,
  type FrameTray,
  type FrameView,
} from "@/lib/crmv4/round377";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["BRASS", "PAPER", "SOOT"] as const;
const SPANS = ["15", "30", "45", "60"] as const;
const LAYERS = ["2", "4", "8"] as const;

const SHIFT_KEY: Record<string, CrmV4CopyKey> = {
  morning: "vgnMorning",
  afternoon: "vgnAfternoon",
  evening: "vgnEvening",
  grave: "vgnGrave",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "vgnAuditSave",
  edit: "vgnAuditEdit",
  note: "vgnAuditNote",
  film: "vgnAuditFilm",
  raise: "vgnAuditRaise",
  free: "vgnAuditFree",
  pin: "vgnAuditPin",
  return: "vgnAuditReturn",
  vault: "vgnAuditVault",
  open: "vgnAuditOpen",
  tag: "vgnAuditTag",
  bead: "vgnAuditBead",
  sla: "vgnAuditSla",
  lower: "vgnAuditLower",
  star: "vgnAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  court: "dmkLaneCourt",
  shut: "dmkLaneShut",
  wait: "dmkLaneWait",
  bench: "dmkLaneBench",
  return: "dmkLaneReturn",
  pair: "dmkPair",
  scope: "dmkScope",
  short: "dmkShort",
  span: "dmkSpan",
  digit: "dmkStampLane",
  openv: "dmkVowel",
  bare: "dmkBare",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "dmkChampagne",
  ivory: "dmkIvory",
  graphite: "dmkGraphite",
};

const SHAPE_KEY: Record<DmkShape, CrmV4CopyKey> = {
  all: "dmkShapeAll",
  court: "dmkShapeCourt",
  shut: "dmkShapeShut",
  wait: "dmkShapeWait",
  return: "dmkShapeReturn",
  pair: "dmkShapePair",
  scope: "dmkShapeScope",
  short: "dmkShapeShort",
  span: "dmkShapeSpan",
  digit: "dmkShapeDigit",
  openv: "dmkShapeVowel",
  bare: "dmkShapeBare",
  open: "dmkShapeOpen",
  soon: "dmkShapeOpen",
  letter: "dmkShapeBare",
  mixed: "dmkShapeDigit",
  upper: "dmkShapeUpper",
  lower: "dmkShapeBare",
  space: "dmkShapeSpace",
  even: "dmkShapeEven",
  odd: "dmkShapeEven",
  tail: "dmkShapeDigit",
  first: "dmkShapeBare",
  held: "dmkShapeSpan",
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

function shiftLabel(v4: V4, shift: string): string {
  const key = SHIFT_KEY[shift];
  return key ? v4(key) : v4("vgnBlankShift");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "BRASS") return v4("vgnBrass");
  if (film === "SOOT") return v4("vgnSoot");
  if (film === "PAPER") return v4("vgnPaper");
  return v4("vgnAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("dmkBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("dmkBlank");
}

export function VignetteFrames({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Frame[]>([]);
  const [views, setViews] = useState<FrameView[]>([]);
  const [density, setDensity] = useState<FrameDensity>("open");
  const [tray, setTray] = useState<FrameTray>("deck");
  const [query, setQuery] = useState("");
  const [framerFilter, setFramerFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [slaFilter, setSlaFilter] = useState("all");
  const [layerFilter, setLayerFilter] = useState("all");
  const [sort, setSort] = useState<FrameSort>("shift");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [framer, setFramer] = useState("");
  const [shift, setShift] = useState("");
  const [film, setFilm] = useState("");
  const [slaNo, setSlaNo] = useState("");
  const [layerNo, setLayerNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [station, setStation] = useState("morning");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readFrames(readJson(VGN_KEY, [])));
    setViews(readFrameViews(readJson(VGN_VIEW_KEY, [])));
    setDensity(frameDensity(readJson(VGN_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Frame[]) {
    setCards(next);
    writeJson(VGN_KEY, next);
  }
  function storeViews(next: FrameView[]) {
    setViews(next);
    writeJson(VGN_VIEW_KEY, next);
  }
  function storeDensity(next: FrameDensity) {
    setDensity(next);
    writeJson(VGN_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortFrames(visibleFrames(cards, tray, query, framerFilter, filmFilter, shiftFilter, slaFilter, layerFilter), sort),
    [cards, tray, query, framerFilter, filmFilter, shiftFilter, slaFilter, layerFilter, sort],
  );
  const counts = frameCounts(cards, shown, station);
  const bars = frameBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = frameTimeline(cards);
  const reminders = reminderFrames(cards);
  const framers = frameFramers(cards);
  const busy = busiestFramer(cards);
  const fair = fairFramer(cards, framers.join(","));
  const suggestedFilm = suggestFilm(cards);
  const suggestedSla = suggestSpan(cards, clock);
  const suggestedShift = suggestShift(clock);
  const focused = shown[Math.min(focusAt, Math.max(0, shown.length - 1))];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "/" && !typingTarget(event)) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (typingTarget(event) || viewer) return;
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("vignette-frames.csv", frameCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveFrameFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveFrameFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addFrame(cards, { title, note, framer, shift, sla: slaNo, film, layer: layerNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-vignette" aria-label={v4("vgnTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-vignette-mast">
        <p className="c4-vignette-seal" data-logo="mono">{v4("vgnLogo")}</p>
        <div>
          <p className="c4-vignette-kicker">{v4("vgnSub")}</p>
          <h2 className="c4-title">{v4("vgnTitle")}</h2>
        </div>
        <p className="c4-vignette-count">{shown.length}</p>
      </header>
      <p className="c4-vignette-links">
        <Link href={crmv4Href(base, "dmk")}>{v4("dmkTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("vgnCustomers")}</Link>
      </p>
      <p className="c4-vignette-hint">{v4("vgnHint")}</p>
      {viewer && <p className="c4-vignette-note">{v4("vgnViewer")}</p>}
      <p className="c4-vignette-meta">{v4("vgnFair")} {fair || "—"} · {v4("vgnBusy")} {busy || "—"} · {v4("vgnSuggest")} {shiftLabel(v4, suggestedShift)} · {filmLabel(v4, suggestedFilm)} · {suggestedSla}</p>
      <ol className="c4-vignette-index" aria-label={v4("vgnRemind")}>
        <li data-tone="gold">{v4("vgnOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("vgnIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("vgnBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("vgnResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-vignette-remind c4-vignette-notices" role="status" aria-label={v4("vgnRemind")}>
          {reminders.map((name) => <li key={name}>{v4("vgnOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-vignette-chart" aria-label={v4("vgnChart")}>
        {bars.map((bar) => (
          <button key={bar.shift} type="button" className="c4-vignette-column" data-on={shiftFilter === bar.shift ? "1" : "0"} onClick={() => setShiftFilter(shiftFilter === bar.shift ? "all" : bar.shift)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{shiftLabel(v4, bar.shift)}</span>
          </button>
        ))}
      </div>
      <form className="c4-vignette-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("vgnEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("vgnEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("vgnNote")}<input className="c4-field" aria-label={v4("vgnNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("vgnFramer")}<input className="c4-field" aria-label={v4("vgnFramer")} aria-required={false} value={framer} maxLength={24} disabled={viewer} onChange={(event) => setFramer(event.target.value)} /></label>
        <label className="c4-lab">{v4("vgnShift")}<select className="c4-field" aria-label={v4("vgnShift")} value={shift} disabled={viewer} onChange={(event) => setShift(event.target.value)}><option value="">{v4("vgnBlankShift")}</option>{VGN_SHIFTS.map((item) => <option key={item} value={item}>{shiftLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("vgnFilm")}<select className="c4-field" aria-label={v4("vgnFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("vgnAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("vgnSpan")}<select className="c4-field" aria-label={v4("vgnSpan")} value={slaNo} disabled={viewer} onChange={(event) => setSlaNo(event.target.value)}><option value="">{v4("vgnAll")}</option>{SPANS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("vgnLayer")}<select className="c4-field" aria-label={v4("vgnLayer")} value={layerNo} disabled={viewer} onChange={(event) => setLayerNo(event.target.value)}><option value="">{v4("vgnAll")}</option>{LAYERS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("vgnTag")}<input className="c4-field" aria-label={v4("vgnTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("vgnAdd")}</button>
      </form>
      <div className="c4-vignette-tools">
        <input ref={searchRef} className="c4-field c4-vignette-search" aria-label={v4("vgnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("vgnSearch")} />
        {(["deck", "clip", "drawer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "deck" ? "vgnDeck" : item === "clip" ? "vgnClip" : "vgnDrawer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={shiftFilter === "warm" ? "1" : "0"} onClick={() => setShiftFilter(shiftFilter === "warm" ? "all" : "warm")}>{v4("vgnWarm")}</button>
        <button type="button" className="c4-chip" data-on={shiftFilter === "cool" ? "1" : "0"} onClick={() => setShiftFilter(shiftFilter === "cool" ? "all" : "cool")}>{v4("vgnCool")}</button>
        {FILMS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={filmFilter === item ? "1" : "0"} onClick={() => setFilmFilter(filmFilter === item ? "all" : item)}>{filmLabel(v4, item)}</button>
        ))}
        {SPANS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={slaFilter === item ? "1" : "0"} onClick={() => setSlaFilter(slaFilter === item ? "all" : item)}>{item}</button>
        ))}
        {LAYERS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={layerFilter === item ? "1" : "0"} onClick={() => setLayerFilter(layerFilter === item ? "all" : item)}>{item}</button>
        ))}
        {framers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={framerFilter === name ? "1" : "0"} onClick={() => setFramerFilter(framerFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "framer" ? "1" : "0"} onClick={() => setSort(sort === "framer" ? "shift" : "framer")}>{sort === "framer" ? v4("vgnSortFramer") : v4("vgnSortShift")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("vgnTight") : v4("vgnOpen")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("vgnTimeline")}</button>
        <label className="c4-lab">{v4("vgnDesk")}<select className="c4-field" aria-label={v4("vgnDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{VGN_SHIFTS.map((item) => <option key={item} value={item}>{shiftLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-vignette-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addFrameView(views, { id, name: viewName, tray, query, framer: framerFilter, film: filmFilter, shift: shiftFilter, sla: slaFilter, layer: layerFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("vgnViewName")}<input className="c4-field" aria-label={v4("vgnViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("vgnSaveView")}</button>
      </form>
      <ul className="c4-vignette-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setFramerFilter(view.framer); setFilmFilter(view.film); setShiftFilter(view.shift); setSlaFilter(view.sla); setLayerFilter(view.layer); }}>{v4("vgnApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropFrameView(views, view.id))}>{v4("vgnDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-vignette-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFrameRaise(cards, picked))}>{v4("vgnBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFrameDrawer(cards, picked))}>{v4("vgnBulkDrawer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFrameSoot(cards, picked))}>{v4("vgnBulkSoot")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFrameTag(cards, picked))}>{v4("vgnBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("vignette-frames.csv", frameCsv(shown, station))}>{v4("vgnCsv")}</button>
        <p className="c4-vignette-meta">{v4("vgnKeys")} / c x a j k · {v4("vgnQuiet")} {counts.quiet} · {v4("vgnWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-vignette-time" aria-label={v4("vgnTimeline")}>
          {timeline.map((row) => <li key={row.sla}><span>{row.sla}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("vgnEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-vignette-list">
          {shown.map((card) => {
            const late = lateFrame(card, station);
            return (
              <li key={card.id} className="c4-vignette-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleFrame(card) ? "1" : "0"} data-brisk={briskFrame(card) ? "1" : "0"} data-overdue={overdueFrame(card) ? "1" : "0"} data-resting={restingFrame(card) ? "1" : "0"} data-warm={frameWarm(card.shift) ? "1" : "0"} data-cool={frameCool(card.shift) ? "1" : "0"}>
                <label className="c4-vignette-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editFrame(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("vgnEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("vgnApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editFrameNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("vgnNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-vignette-meta">{shiftLabel(v4, card.shift)} · {filmLabel(v4, card.film)} · {card.sla ?? "—"} · {card.layer} · {card.framer || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "vgnAuditSave")}` : ""}{late ? ` · ${v4("vgnOverdue")}` : ""}</p>
                </div>
                <div className="c4-vignette-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("vgnEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFrameRaised(cards, card.id, !card.raised))}>{card.raised ? v4("vgnFree") : v4("vgnRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFrameFilm(cards, card.id, suggestedFilm))}>{v4("vgnSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFrameClip(cards, card.id, !card.clipped))}>{card.clipped ? v4("vgnUnclip") : v4("vgnClipIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFrameDrawer(cards, card.id, !card.drawn))}>{card.drawn ? v4("vgnUndrawer") : v4("vgnDrawerIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFrameStar(cards, card.id, !card.starred))}>{card.starred ? v4("vgnUnstar") : v4("vgnStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addFrameTag(cards, card.id, "a"))}>{v4("vgnTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseSpanFocused(cards, card.id))}>{v4("vgnRaiseSpan")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerSpanFocused(cards, card.id))}>{v4("vgnLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseLayerFocused(cards, card.id))}>{v4("vgnLayer")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerLayerFocused(cards, card.id))}>{v4("vgnLayer")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(filmFocused(cards, card.id))}>{v4("vgnFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFrameFocused(cards, card.id))}>{v4("vgnRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(clipFrameFocused(cards, card.id))}>{v4("vgnClip")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starFrameFocused(cards, card.id))}>{v4("vgnStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(frameCopy(card))}>{v4("vgnCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type CapUser = { id?: string; name?: string | null; documentsStatus?: string | null };

export function DocumentMarks({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CapUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<DmkShape>("all");
  const [review, setReview] = useState<DmkReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): DmkRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { documentsStatus: textField(row.documentsStatus) } satisfies DmkValue,
    };
  }).filter((row): row is DmkRow => Boolean(row));
  const present = presentDmkLanes(rows);
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
    const next = readHiddenDmk(readJson(DMK_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(DMK_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedDmk(readJson(DMK_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(DMK_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleDmkLanes(present, hidden, showHidden);
  const shown = visibleDmk(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = dmkLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = dmkLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingDmk(rows);
  const leadHue = leadingDmkHue(rows);
  const whole = rows.filter((row) => dmkLane(row.code)).length;
  const share = dmkShare(laneDmkCount(rows, "court"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("document-lanes.csv", dmkLanesCsv(rows));
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
    writeJson(DMK_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(DMK_REVIEW_KEY, next);
  }

  return (
    <section className="c4-docmark" aria-label={v4("dmkTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-docmark-mast">
        <p className="c4-docmark-seal" data-logo="mono">{v4("dmkLogo")}</p>
        <div>
          <p className="c4-docmark-kicker">{v4("dmkSub")}</p>
          <h2 className="c4-title">{v4("dmkTitle")}</h2>
        </div>
        <p className="c4-docmark-count">{shown.length}</p>
      </header>
      <p className="c4-docmark-links">
        <Link href={crmv4Href(base, "vgn")}>{v4("vgnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("dmkCustomer")}</Link>
      </p>
      <p className="c4-docmark-hint">{v4("dmkHint")}</p>
      {viewer && <p className="c4-docmark-note">{v4("dmkViewer")}</p>}
      {queue.loading && <p className="c4-docmark-meta">{v4("dmkLoading")}</p>}
      {queue.error && <p className="c4-docmark-meta">{v4("dmkFailed")}</p>}
      <p className="c4-docmark-meta">{v4("dmkLead")} {laneLabel(v4, lead)} · {v4("dmkToneLead")} {hueLabel(v4, leadHue)} · {v4("dmkShare")} {share}</p>
      <div className="c4-docmark-chart" aria-label={v4("dmkChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-docmark-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-docmark-tools">
        <input ref={searchRef} className="c4-field c4-docmark-search" aria-label={v4("dmkSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("dmkSearch")} />
        <label className="c4-lab">{v4("dmkChart")}<select className="c4-field" aria-label={v4("dmkChart")} value={shape} onChange={(event) => setShape(event.target.value as DmkShape)}>{(Object.keys(SHAPE_KEY) as DmkShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "champagne" ? "1" : "0"} onClick={() => setHue(hue === "champagne" ? "all" : "champagne")}>{v4("dmkChampagne")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ivory" ? "1" : "0"} onClick={() => setHue(hue === "ivory" ? "all" : "ivory")}>{v4("dmkIvory")}</button>
        <button type="button" className="c4-chip" data-on={hue === "graphite" ? "1" : "0"} onClick={() => setHue(hue === "graphite" ? "all" : "graphite")}>{v4("dmkGraphite")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("dmkFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("dmkReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("dmkShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleDmk(hidden, lane))}>{v4("dmkHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-docmark-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkDmkReview(reviewed, picked, true))}>{v4("dmkBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkDmkReview(reviewed, picked, false))}>{v4("dmkBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("document-marks.csv", dmkRowsCsv(shown, reviewed))}>{v4("dmkRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("document-lanes.csv", dmkLanesCsv(rows))}>{v4("dmkCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("dmkEmpty")}</p>}
      <ul className="c4-docmark-list">
        {shown.map((row) => {
          const tone = dmkHue(row.code);
          const name = dmkCopy(row.code);
          return (
            <li key={row.id} className="c4-docmark-card" data-mail={dmkLane(row.code) || "open"} data-hue={tone || "none"} data-home={dmkLane(row.code) === "court" ? "1" : "0"} data-away={dmkShut(row.code) ? "1" : "0"} data-hold={dmkWait(row.code) ? "1" : "0"} data-guest={dmkReturn(row.code) ? "1" : "0"} data-open={dmkOpen(row.code) ? "1" : "0"} data-even={dmkEven(row.code) ? "1" : "0"} data-digit={dmkDigit(row.code) ? "1" : "0"} data-letter={dmkLetter(row.code) ? "1" : "0"} data-mixed={dmkMixed(row.code) ? "1" : "0"} data-upper={dmkUpper(row.code) ? "1" : "0"} data-lower={dmkLower(row.code) ? "1" : "0"} data-space={dmkSpace(row.code) ? "1" : "0"} data-vowel={dmkVowel(row.code) ? "1" : "0"} data-tail={dmkTail(row.code) ? "1" : "0"} data-first={dmkFirst(row.code) ? "1" : "0"} data-held={dmkHeld(row.code) ? "1" : "0"} data-join={dmkPair(row.code) ? "1" : "0"} data-route={dmkScope(row.code) ? "1" : "0"} data-brief={dmkShort(row.code) ? "1" : "0"} data-span={dmkSpan(row.code) ? "1" : "0"} data-bare={dmkBare(row.code) ? "1" : "0"} data-court={dmkCourt(row.code) ? "1" : "0"} data-bench={dmkBench(row.code) ? "1" : "0"}>
              <label className="c4-docmark-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-docmark-meta">{name || v4("dmkOpen")} · {dmkStamp(row.code) || "—"} · {dmkFamily(row.code) || "—"} · {dmkLength(row.code) ?? "—"} · {laneLabel(v4, dmkLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-docmark-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleDmkReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("dmkReviewed") : v4("dmkReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(dmkCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("dmkCopied") : v4("dmkCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("dmkCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
