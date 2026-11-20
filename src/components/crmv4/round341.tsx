"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LNM_KEY,
  LNM_REVIEW_KEY,
  MPH_DENSITY_KEY,
  MPH_KEY,
  MPH_LIMBS,
  MPH_VIEW_KEY,
  addMoon,
  addMoonTag,
  addMoonView,
  briskMoon,
  bulkSurnameReview,
  bulkMoonCoffer,
  bulkMoonGraphite,
  bulkMoonRaise,
  bulkMoonTag,
  busiestKeeper,
  dropMoonView,
  editMoon,
  editMoonNote,
  surnameBrief,
  surnameCopy,
  surnameDigit,
  surnameEven,
  surnameFamily,
  surnameFirst,
  surnameGap,
  surnameHeld,
  surnameNoble,
  surnameHue,
  surnameJoin,
  surnameGuild,
  surnameLane,
  surnameLanes,
  surnameLanesCsv,
  surnameLength,
  surnameLetter,
  surnameLower,
  surnameMixed,
  surnameOpen,
  surnameRowsCsv,
  surnameShare,
  surnameSpace,
  surnameStamp,
  surnameTail,
  surnameUpper,
  surnameCivic,
  surnameVowel,
  fairKeeper,
  glazeFocused,
  moonBars,
  moonCopy,
  moonCounts,
  moonCsv,
  moonDensity,
  moonInner,
  moonOuter,
  moonTimeline,
  moonKeepers,
  idleMoon,
  laneSurnameCount,
  lateMoon,
  leadingSurname,
  leadingSurnameHue,
  lowerAgeFocused,
  lowerPhaseFocused,
  moveMoonFocus,
  overdueMoon,
  pinMoonFocused,
  presentSurnameLanes,
  raiseAgeFocused,
  raisePhaseFocused,
  readHiddenSurname,
  readMoonPhases,
  readMoonViews,
  readReviewedSurname,
  reminderMoonPhases,
  restingMoon,
  setMoonCoffer,
  setMoonFilm,
  setMoonFocused,
  setMoonPin,
  setMoonRaised,
  setMoonStar,
  sortMoonPhases,
  starMoonFocused,
  suggestAge,
  suggestGlaze,
  suggestLimb,
  toggleSurname,
  toggleSurnameReview,
  visibleSurname,
  visibleSurnameLanes,
  visibleMoonPhases,
  type SurnameReview,
  type SurnameRow,
  type SurnameShape,
  type SurnameValue,
  type MoonPhase,
  type MoonDensity,
  type MoonSort,
  type MoonTray,
  type MoonView,
} from "@/lib/crmv4/round341";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["7", "14", "21", "28"] as const;
const LOCKS = ["4", "8", "12"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  dark: "mphDark",
  crescent: "mphCrescent",
  disk: "mphDisk",
  gibbous: "mphGibbous",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "mphAuditSave",
  edit: "mphAuditEdit",
  note: "mphAuditNote",
  film: "mphAuditFilm",
  poise: "mphAuditPoise",
  free: "mphAuditFree",
  peg: "mphAuditPeg",
  return: "mphAuditReturn",
  coffer: "mphAuditCoffer",
  open: "mphAuditOpen",
  tag: "mphAuditTag",
  lock: "mphAuditRate",
  drop: "mphAuditBeat",
  lower: "mphAuditLower",
  star: "mphAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  royal: "lnmRoyal",
  noble: "lnmNoble",
  civic: "lnmCivic",
  guild: "lnmGuild",
  join: "lnmJoin",
  gap: "lnmGap",
  brief: "lnmBrief",
  long: "lnmLong",
  mark: "lnmMark",
  vowel: "lnmVowel",
  plain: "lnmPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "lnmChampagne",
  ivory: "lnmIvory",
  graphite: "lnmGraphite",
};

const SHAPE_KEY: Record<SurnameShape, CrmV4CopyKey> = {
  all: "lnmShapeAll",
  royal: "lnmShapeRoyal",
  noble: "lnmShapeNoble",
  civic: "lnmShapeCivic",
  guild: "lnmShapeGuild",
  join: "lnmShapeJoin",
  gap: "lnmShapeGap",
  brief: "lnmShapeBrief",
  long: "lnmShapeLong",
  mark: "lnmShapeMark",
  vowel: "lnmShapeVowel",
  plain: "lnmShapePlain",
  open: "lnmShapeOpen",
  soon: "lnmShapeOpen",
  letter: "lnmShapePlain",
  mixed: "lnmShapeMark",
  upper: "lnmShapeRoyal",
  lower: "lnmShapePlain",
  space: "lnmShapeGap",
  even: "lnmShapeEven",
  odd: "lnmShapeEven",
  tail: "lnmShapeMark",
  first: "lnmShapePlain",
  held: "lnmShapeLong",
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

function limbLabel(v4: V4, piece: string): string {
  const key = PIECE_KEY[piece];
  return key ? v4(key) : v4("mphBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("mphGilt");
  if (film === "IVORY") return v4("mphIvory");
  if (film === "GRAPHITE") return v4("mphGraphite");
  return v4("mphAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("lnmBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("lnmBlank");
}

export function MoonPhaseRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<MoonPhase[]>([]);
  const [views, setViews] = useState<MoonView[]>([]);
  const [density, setDensity] = useState<MoonDensity>("airy");
  const [tray, setTray] = useState<MoonTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<MoonSort>("piece");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [setter, setSetter] = useState("");
  const [piece, setPiece] = useState("");
  const [film, setFilm] = useState("");
  const [dropNo, setDropNo] = useState("");
  const [lockNo, setLockNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [station, setStation] = useState("dark");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readMoonPhases(readJson(MPH_KEY, [])));
    setViews(readMoonViews(readJson(MPH_VIEW_KEY, [])));
    setDensity(moonDensity(readJson(MPH_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: MoonPhase[]) {
    setCards(next);
    writeJson(MPH_KEY, next);
  }
  function storeViews(next: MoonView[]) {
    setViews(next);
    writeJson(MPH_VIEW_KEY, next);
  }
  function storeDensity(next: MoonDensity) {
    setDensity(next);
    writeJson(MPH_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortMoonPhases(visibleMoonPhases(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = moonCounts(cards, shown, station);
  const bars = moonBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = moonTimeline(cards);
  const reminders = reminderMoonPhases(cards);
  const poisers = moonKeepers(cards);
  const busy = busiestKeeper(cards);
  const fair = fairKeeper(cards, poisers.join(","));
  const suggestedFilm = suggestGlaze(cards);
  const suggestedBeat = suggestAge(cards, clock);
  const suggestedLimb = suggestLimb(clock);
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
        download("moonphase-rules.csv", moonCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveMoonFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveMoonFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addMoon(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-moonphase" aria-label={v4("mphTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-moonphase-mast">
        <p className="c4-moonphase-seal" data-logo="mono">{v4("mphLogo")}</p>
        <div>
          <p className="c4-moonphase-kicker">{v4("mphSub")}</p>
          <h2 className="c4-title">{v4("mphTitle")}</h2>
        </div>
        <p className="c4-moonphase-count">{shown.length}</p>
      </header>
      <p className="c4-moonphase-links">
        <Link href={crmv4Href(base, "lnm")}>{v4("lnmTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("mphCustomers")}</Link>
      </p>
      <p className="c4-moonphase-hint">{v4("mphHint")}</p>
      {viewer && <p className="c4-moonphase-note">{v4("mphViewer")}</p>}
      <p className="c4-moonphase-meta">{v4("mphFair")} {fair || "—"} · {v4("mphBusy")} {busy || "—"} · {v4("mphSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-moonphase-index" aria-label={v4("mphRemind")}>
        <li data-tone="gold">{v4("mphOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("mphIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("mphBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("mphResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-moonphase-remind c4-moonphase-notices" role="status" aria-label={v4("mphRemind")}>
          {reminders.map((name) => <li key={name}>{v4("mphOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-moonphase-chart" aria-label={v4("mphChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-moonphase-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-moonphase-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("mphEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("mphEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("mphNote")}<input className="c4-field" aria-label={v4("mphNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("mphSetter")}<input className="c4-field" aria-label={v4("mphSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("mphPiece")}<select className="c4-field" aria-label={v4("mphPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("mphBlankPiece")}</option>{MPH_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("mphFilm")}<select className="c4-field" aria-label={v4("mphFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("mphAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("mphDrop")}<select className="c4-field" aria-label={v4("mphDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("mphAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("mphLock")}<select className="c4-field" aria-label={v4("mphLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("mphAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("mphTag")}<input className="c4-field" aria-label={v4("mphTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("mphAdd")}</button>
      </form>
      <div className="c4-moonphase-tools">
        <input ref={searchRef} className="c4-field c4-moonphase-search" aria-label={v4("mphSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("mphSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "mphBoard" : item === "peg" ? "mphPeg" : "mphCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("mphInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("mphOuter")}</button>
        {FILMS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={filmFilter === item ? "1" : "0"} onClick={() => setFilmFilter(filmFilter === item ? "all" : item)}>{filmLabel(v4, item)}</button>
        ))}
        {DROPS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={dropFilter === item ? "1" : "0"} onClick={() => setDropFilter(dropFilter === item ? "all" : item)}>{item}</button>
        ))}
        {LOCKS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={lockFilter === item ? "1" : "0"} onClick={() => setLockFilter(lockFilter === item ? "all" : item)}>{item}</button>
        ))}
        {poisers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={setterFilter === name ? "1" : "0"} onClick={() => setSetterFilter(setterFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("mphSortSetter") : v4("mphSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("mphClose") : v4("mphAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("mphTimeline")}</button>
        <label className="c4-lab">{v4("mphDesk")}<select className="c4-field" aria-label={v4("mphDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{MPH_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-moonphase-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addMoonView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("mphViewName")}<input className="c4-field" aria-label={v4("mphViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("mphSaveView")}</button>
      </form>
      <ul className="c4-moonphase-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("mphApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropMoonView(views, view.id))}>{v4("mphDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-moonphase-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMoonRaise(cards, picked))}>{v4("mphBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMoonCoffer(cards, picked))}>{v4("mphBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMoonGraphite(cards, picked))}>{v4("mphBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMoonTag(cards, picked))}>{v4("mphBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("moonphase-rules.csv", moonCsv(shown, station))}>{v4("mphCsv")}</button>
        <p className="c4-moonphase-meta">{v4("mphKeys")} / n x a j k · {v4("mphQuiet")} {counts.quiet} · {v4("mphInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-moonphase-time" aria-label={v4("mphTimeline")}>
          {timeline.map((lane) => <li key={lane.drop}><span>{lane.drop}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("mphEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-moonphase-list">
          {shown.map((card) => {
            const late = lateMoon(card, station);
            return (
              <li key={card.id} className="c4-moonphase-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleMoon(card) ? "1" : "0"} data-brisk={briskMoon(card) ? "1" : "0"} data-overdue={overdueMoon(card) ? "1" : "0"} data-resting={restingMoon(card) ? "1" : "0"} data-inner={moonInner(card.piece) ? "1" : "0"} data-outer={moonOuter(card.piece) ? "1" : "0"}>
                <label className="c4-moonphase-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editMoon(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("mphEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("mphApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editMoonNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("mphNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-moonphase-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "mphAuditSave")}` : ""}{late ? ` · ${v4("mphOverdue")}` : ""}</p>
                </div>
                <div className="c4-moonphase-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("mphEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMoonRaised(cards, card.id, !card.raised))}>{card.raised ? v4("mphFree") : v4("mphPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMoonFilm(cards, card.id, suggestedFilm))}>{v4("mphSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMoonPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("mphUnpeg") : v4("mphPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMoonCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("mphUncoffer") : v4("mphCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMoonStar(cards, card.id, !card.starred))}>{card.starred ? v4("mphUnstar") : v4("mphStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addMoonTag(cards, card.id, "n"))}>{v4("mphTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseAgeFocused(cards, card.id))}>{v4("mphRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerAgeFocused(cards, card.id))}>{v4("mphLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raisePhaseFocused(cards, card.id))}>{v4("mphLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerPhaseFocused(cards, card.id))}>{v4("mphLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(glazeFocused(cards, card.id))}>{v4("mphFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMoonFocused(cards, card.id))}>{v4("mphPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinMoonFocused(cards, card.id))}>{v4("mphPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starMoonFocused(cards, card.id))}>{v4("mphStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(moonCopy(card))}>{v4("mphCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type SurnameUser = { id?: string; name?: string | null; lastName?: string | null };

export function SurnamePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: SurnameUser[] }>("/api/admin/users?take=24&meta=0");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<SurnameShape>("all");
  const [review, setReview] = useState<SurnameReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): SurnameRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { lastName: textField(row.lastName) } satisfies SurnameValue,
    };
  }).filter((row): row is SurnameRow => Boolean(row));
  const present = presentSurnameLanes(rows);
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
    const next = readHiddenSurname(readJson(LNM_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(LNM_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSurname(readJson(LNM_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(LNM_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSurnameLanes(present, hidden, showHidden);
  const shown = visibleSurname(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = surnameLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = surnameLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSurname(rows);
  const leadHue = leadingSurnameHue(rows);
  const whole = rows.filter((row) => surnameLane(row.code)).length;
  const share = surnameShare(laneSurnameCount(rows, "royal"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("surname-lanes.csv", surnameLanesCsv(rows));
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
    writeJson(LNM_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(LNM_REVIEW_KEY, next);
  }

  return (
    <section className="c4-surname" aria-label={v4("lnmTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-surname-mast">
        <p className="c4-surname-seal" data-logo="mono">{v4("lnmLogo")}</p>
        <div>
          <p className="c4-surname-kicker">{v4("lnmSub")}</p>
          <h2 className="c4-title">{v4("lnmTitle")}</h2>
        </div>
        <p className="c4-surname-count">{shown.length}</p>
      </header>
      <p className="c4-surname-links">
        <Link href={crmv4Href(base, "mph")}>{v4("mphTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("lnmCustomer")}</Link>
      </p>
      <p className="c4-surname-hint">{v4("lnmHint")}</p>
      {viewer && <p className="c4-surname-note">{v4("lnmViewer")}</p>}
      <p className="c4-surname-meta">{v4("lnmLead")} {laneLabel(v4, lead)} · {v4("lnmToneLead")} {hueLabel(v4, leadHue)} · {v4("lnmShare")} {share}</p>
      <div className="c4-surname-chart" aria-label={v4("lnmChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-surname-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-surname-tools">
        <input ref={searchRef} className="c4-field c4-surname-search" aria-label={v4("lnmSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("lnmSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("lnmShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "lnmAll" : item === "reviewed" ? "lnmReviewed" : "lnmFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("lnmAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as SurnameShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSurname(hidden, item))}>{hidden.includes(item) ? v4("lnmShow") : v4("lnmHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-surname-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSurnameReview(reviewed, picked, true))}>{v4("lnmBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSurnameReview(reviewed, picked, false))}>{v4("lnmBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("surname-lanes.csv", surnameLanesCsv(rows))}>{v4("lnmCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("surname-rows.csv", surnameRowsCsv(shown, reviewed))}>{v4("lnmRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("lnmLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("lnmFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("lnmEmpty")}</p>}
      <ul className="c4-surname-list">
        {shown.map((row) => {
          const name = surnameCopy(row.code);
          const tone = surnameHue(row.code);
          return (
            <li key={row.id} className="c4-surname-card" data-lane={surnameLane(row.code) || "open"} data-hue={tone || "none"} data-royal={surnameLane(row.code) === "royal" ? "1" : "0"} data-noble={surnameNoble(row.code) ? "1" : "0"} data-civic={surnameCivic(row.code) ? "1" : "0"} data-guild={surnameGuild(row.code) ? "1" : "0"} data-open={surnameOpen(row.code) ? "1" : "0"} data-even={surnameEven(row.code) ? "1" : "0"} data-digit={surnameDigit(row.code) ? "1" : "0"} data-letter={surnameLetter(row.code) ? "1" : "0"} data-mixed={surnameMixed(row.code) ? "1" : "0"} data-upper={surnameUpper(row.code) ? "1" : "0"} data-lower={surnameLower(row.code) ? "1" : "0"} data-space={surnameSpace(row.code) ? "1" : "0"} data-vowel={surnameVowel(row.code) ? "1" : "0"} data-tail={surnameTail(row.code) ? "1" : "0"} data-first={surnameFirst(row.code) ? "1" : "0"} data-held={surnameHeld(row.code) ? "1" : "0"} data-join={surnameJoin(row.code) ? "1" : "0"} data-gap={surnameGap(row.code) ? "1" : "0"} data-brief={surnameBrief(row.code) ? "1" : "0"}>
              <label className="c4-surname-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-surname-meta">{name || v4("lnmOpen")} · {surnameStamp(row.code) || "—"} · {surnameFamily(row.code) || "—"} · {surnameLength(row.code) ?? "—"} · {laneLabel(v4, surnameLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-surname-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSurnameReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("lnmReviewed") : v4("lnmReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = surnameCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("lnmCopied") : v4("lnmCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("lnmCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
