"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  AGT_KEY,
  AGT_REVIEW_KEY,
  AZR_DENSITY_KEY,
  AZR_KEY,
  AZR_MODES,
  AZR_VIEW_KEY,
  addAzurage,
  addAzurageTag,
  addAzurageView,
  briskAzurage,
  bulkSelReview,
  bulkAzurageCoffer,
  bulkAzurageGraphite,
  bulkAzurageRaise,
  bulkAzurageTag,
  busiestKeeper,
  dropAzurageView,
  editAzurage,
  editAzurageNote,
  agtBrief,
  agtCopy,
  agtDigit,
  agtEven,
  agtFamily,
  agtFirst,
  agtRoute,
  agtHeld,
  agtAway,
  agtHue,
  agtJoin,
  agtCitizen,
  agtLane,
  agtLanes,
  agtLanesCsv,
  agtLength,
  agtLetter,
  agtLower,
  agtMixed,
  agtOpen,
  agtRowsCsv,
  agtShare,
  agtSpace,
  agtStamp,
  agtTail,
  agtUpper,
  agtGuest,
  agtVowel,
  fairKeeper,
  finishFocused,
  azurageBars,
  azurageCopy,
  azurageCounts,
  azurageCsv,
  azurageDensity,
  azurageInner,
  azurageOuter,
  azurageTimeline,
  azurageKeepers,
  idleAzurage,
  laneSelCount,
  lateAzurage,
  leadingSel,
  leadingSelHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveAzurageFocus,
  overdueAzurage,
  pinAzurageFocused,
  presentSelLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenSel,
  readAzurages,
  readAzurageViews,
  readReviewedSel,
  reminderAzurages,
  restingAzurage,
  setAzurageCoffer,
  setAzurageFilm,
  setAzurageFocused,
  setAzuragePin,
  setAzurageRaised,
  setAzurageStar,
  sortAzurages,
  starAzurageFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleSel,
  toggleSelReview,
  visibleSel,
  visibleSelLanes,
  visibleAzurages,
  type AgtReview,
  type AgtRow,
  type AgtShape,
  type AgtValue,
  type Azurage,
  type AzurageDensity,
  type AzurageSort,
  type AzurageTray,
  type AzurageView,
} from "@/lib/crmv4/round359";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["8", "16", "32", "64"] as const;
const LOCKS = ["3", "6", "12"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  grain: "azrCloud",
  cloud: "azrWave",
  sun: "azrSun",
  frost: "azrRing",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "azrAuditSave",
  edit: "azrAuditEdit",
  note: "azrAuditNote",
  film: "azrAuditFilm",
  poise: "azrAuditPoise",
  free: "azrAuditFree",
  peg: "azrAuditPeg",
  return: "azrAuditReturn",
  coffer: "azrAuditCoffer",
  open: "azrAuditOpen",
  tag: "azrAuditTag",
  lock: "azrAuditRate",
  drop: "azrAuditStep",
  lower: "azrAuditLower",
  star: "azrAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "agtLaneHall",
  vacant: "agtLaneVacant",
  hold: "agtLaneHold",
  desk: "agtLaneDesk",
  guest: "agtLaneGuest",
  join: "agtJoin",
  route: "agtRoute",
  brief: "agtBrief",
  long: "agtLong",
  stamp: "agtStampLane",
  vowel: "agtVowel",
  plain: "agtPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "agtChampagne",
  ivory: "agtIvory",
  graphite: "agtGraphite",
};

const SHAPE_KEY: Record<AgtShape, CrmV4CopyKey> = {
  all: "agtShapeAll",
  hall: "agtShapeHall",
  vacant: "agtShapeVacant",
  hold: "agtShapeHold",
  guest: "agtShapeGuest",
  join: "agtShapeJoin",
  route: "agtShapeRoute",
  brief: "agtShapeBrief",
  long: "agtShapeLong",
  stamp: "agtShapeStamp",
  vowel: "agtShapeVowel",
  plain: "agtShapePlain",
  open: "agtShapeOpen",
  soon: "agtShapeOpen",
  letter: "agtShapePlain",
  mixed: "agtShapeStamp",
  upper: "agtShapeUpper",
  lower: "agtShapePlain",
  space: "agtShapeSpace",
  even: "agtShapeEven",
  odd: "agtShapeEven",
  tail: "agtShapeStamp",
  first: "agtShapePlain",
  held: "agtShapeLong",
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
  return key ? v4(key) : v4("azrBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("azrGilt");
  if (film === "IVORY") return v4("azrIvory");
  if (film === "GRAPHITE") return v4("azrGraphite");
  return v4("azrAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("agtBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("agtBlank");
}

export function AzurageRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Azurage[]>([]);
  const [views, setViews] = useState<AzurageView[]>([]);
  const [density, setDensity] = useState<AzurageDensity>("airy");
  const [tray, setTray] = useState<AzurageTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<AzurageSort>("piece");
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
  const [station, setStation] = useState("grain");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readAzurages(readJson(AZR_KEY, [])));
    setViews(readAzurageViews(readJson(AZR_VIEW_KEY, [])));
    setDensity(azurageDensity(readJson(AZR_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Azurage[]) {
    setCards(next);
    writeJson(AZR_KEY, next);
  }
  function storeViews(next: AzurageView[]) {
    setViews(next);
    writeJson(AZR_VIEW_KEY, next);
  }
  function storeDensity(next: AzurageDensity) {
    setDensity(next);
    writeJson(AZR_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortAzurages(visibleAzurages(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = azurageCounts(cards, shown, station);
  const bars = azurageBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = azurageTimeline(cards);
  const reminders = reminderAzurages(cards);
  const poisers = azurageKeepers(cards);
  const busy = busiestKeeper(cards);
  const fair = fairKeeper(cards, poisers.join(","));
  const suggestedFilm = suggestFinish(cards);
  const suggestedBeat = suggestHour(cards, clock);
  const suggestedLimb = suggestMode(clock);
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
        download("azurage-grains.csv", azurageCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveAzurageFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveAzurageFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addAzurage(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-azurage" aria-label={v4("azrTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-azurage-mast">
        <p className="c4-azurage-seal" data-logo="mono">{v4("azrLogo")}</p>
        <div>
          <p className="c4-azurage-kicker">{v4("azrSub")}</p>
          <h2 className="c4-title">{v4("azrTitle")}</h2>
        </div>
        <p className="c4-azurage-count">{shown.length}</p>
      </header>
      <p className="c4-azurage-links">
        <Link href={crmv4Href(base, "agt")}>{v4("agtTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("azrCustomers")}</Link>
      </p>
      <p className="c4-azurage-hint">{v4("azrHint")}</p>
      {viewer && <p className="c4-azurage-note">{v4("azrViewer")}</p>}
      <p className="c4-azurage-meta">{v4("azrFair")} {fair || "—"} · {v4("azrBusy")} {busy || "—"} · {v4("azrSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-azurage-index" aria-label={v4("azrRemind")}>
        <li data-tone="gold">{v4("azrOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("azrIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("azrBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("azrResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-azurage-remind c4-azurage-notices" role="status" aria-label={v4("azrRemind")}>
          {reminders.map((name) => <li key={name}>{v4("azrOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-azurage-chart" aria-label={v4("azrChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-azurage-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-azurage-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("azrEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("azrEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("azrNote")}<input className="c4-field" aria-label={v4("azrNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("azrSetter")}<input className="c4-field" aria-label={v4("azrSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("azrPiece")}<select className="c4-field" aria-label={v4("azrPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("azrBlankPiece")}</option>{AZR_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("azrFilm")}<select className="c4-field" aria-label={v4("azrFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("azrAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("azrDrop")}<select className="c4-field" aria-label={v4("azrDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("azrAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("azrLock")}<select className="c4-field" aria-label={v4("azrLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("azrAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("azrTag")}<input className="c4-field" aria-label={v4("azrTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("azrAdd")}</button>
      </form>
      <div className="c4-azurage-tools">
        <input ref={searchRef} className="c4-field c4-azurage-search" aria-label={v4("azrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("azrSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "azrBoard" : item === "peg" ? "azrPeg" : "azrCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("azrInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("azrOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("azrSortSetter") : v4("azrSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("azrClose") : v4("azrAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("azrTimeline")}</button>
        <label className="c4-lab">{v4("azrDesk")}<select className="c4-field" aria-label={v4("azrDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{AZR_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-azurage-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addAzurageView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("azrViewName")}<input className="c4-field" aria-label={v4("azrViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("azrSaveView")}</button>
      </form>
      <ul className="c4-azurage-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("azrApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropAzurageView(views, view.id))}>{v4("azrDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-azurage-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAzurageRaise(cards, picked))}>{v4("azrBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAzurageCoffer(cards, picked))}>{v4("azrBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAzurageGraphite(cards, picked))}>{v4("azrBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAzurageTag(cards, picked))}>{v4("azrBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("azurage-grains.csv", azurageCsv(shown, station))}>{v4("azrCsv")}</button>
        <p className="c4-azurage-meta">{v4("azrKeys")} / n x a j k · {v4("azrQuiet")} {counts.quiet} · {v4("azrInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-azurage-time" aria-label={v4("azrTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("azrEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-azurage-list">
          {shown.map((card) => {
            const late = lateAzurage(card, station);
            return (
              <li key={card.id} className="c4-azurage-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleAzurage(card) ? "1" : "0"} data-brisk={briskAzurage(card) ? "1" : "0"} data-overdue={overdueAzurage(card) ? "1" : "0"} data-resting={restingAzurage(card) ? "1" : "0"} data-inner={azurageInner(card.piece) ? "1" : "0"} data-outer={azurageOuter(card.piece) ? "1" : "0"}>
                <label className="c4-azurage-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editAzurage(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("azrEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("azrApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editAzurageNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("azrNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-azurage-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "azrAuditSave")}` : ""}{late ? ` · ${v4("azrOverdue")}` : ""}</p>
                </div>
                <div className="c4-azurage-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("azrEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAzurageRaised(cards, card.id, !card.raised))}>{card.raised ? v4("azrFree") : v4("azrPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAzurageFilm(cards, card.id, suggestedFilm))}>{v4("azrSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAzuragePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("azrUnpeg") : v4("azrPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAzurageCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("azrUncoffer") : v4("azrCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAzurageStar(cards, card.id, !card.starred))}>{card.starred ? v4("azrUnstar") : v4("azrStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addAzurageTag(cards, card.id, "g"))}>{v4("azrTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("azrRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("azrLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("azrLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("azrLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("azrFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAzurageFocused(cards, card.id))}>{v4("azrPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinAzurageFocused(cards, card.id))}>{v4("azrPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starAzurageFocused(cards, card.id))}>{v4("azrStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(azurageCopy(card))}>{v4("azrCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type AgtUser = { id?: string; name?: string | null; lastUserAgent?: string | boolean | null };

export function AgentPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: AgtUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<AgtShape>("all");
  const [review, setReview] = useState<AgtReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): AgtRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { lastUserAgent: row.lastUserAgent === true || row.lastUserAgent === false ? row.lastUserAgent : textField(row.lastUserAgent) } satisfies AgtValue,
    };
  }).filter((row): row is AgtRow => Boolean(row));
  const present = presentSelLanes(rows);
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
    const next = readHiddenSel(readJson(AGT_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(AGT_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSel(readJson(AGT_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(AGT_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSelLanes(present, hidden, showHidden);
  const shown = visibleSel(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = agtLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = agtLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSel(rows);
  const leadHue = leadingSelHue(rows);
  const whole = rows.filter((row) => agtLane(row.code)).length;
  const share = agtShare(laneSelCount(rows, "hall"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("agent-marks.csv", agtLanesCsv(rows));
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
    writeJson(AGT_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(AGT_REVIEW_KEY, next);
  }

  return (
    <section className="c4-agtplate" aria-label={v4("agtTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-agtplate-mast">
        <p className="c4-agtplate-seal" data-logo="mono">{v4("agtLogo")}</p>
        <div>
          <p className="c4-agtplate-kicker">{v4("agtSub")}</p>
          <h2 className="c4-title">{v4("agtTitle")}</h2>
        </div>
        <p className="c4-agtplate-count">{shown.length}</p>
      </header>
      <p className="c4-agtplate-links">
        <Link href={crmv4Href(base, "azr")}>{v4("azrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("agtCustomer")}</Link>
      </p>
      <p className="c4-agtplate-hint">{v4("agtHint")}</p>
      {viewer && <p className="c4-agtplate-note">{v4("agtViewer")}</p>}
      <p className="c4-agtplate-meta">{v4("agtLead")} {laneLabel(v4, lead)} · {v4("agtToneLead")} {hueLabel(v4, leadHue)} · {v4("agtShare")} {share}</p>
      <div className="c4-agtplate-chart" aria-label={v4("agtChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-agtplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-agtplate-tools">
        <input ref={searchRef} className="c4-field c4-agtplate-search" aria-label={v4("agtSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("agtSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("agtShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "agtAll" : item === "reviewed" ? "agtReviewed" : "agtFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("agtAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as AgtShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSel(hidden, item))}>{hidden.includes(item) ? v4("agtShow") : v4("agtHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-agtplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, true))}>{v4("agtBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, false))}>{v4("agtBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("agent-lanes.csv", agtLanesCsv(rows))}>{v4("agtCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("agent-rows.csv", agtRowsCsv(shown, reviewed))}>{v4("agtRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("agtLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("agtFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("agtEmpty")}</p>}
      <ul className="c4-agtplate-list">
        {shown.map((row) => {
          const name = agtCopy(row.code);
          const tone = agtHue(row.code);
          return (
            <li key={row.id} className="c4-agtplate-card" data-mail={agtLane(row.code) || "open"} data-hue={tone || "none"} data-home={agtLane(row.code) === "hall" ? "1" : "0"} data-away={agtAway(row.code) ? "1" : "0"} data-guest={agtGuest(row.code) ? "1" : "0"} data-citizen={agtCitizen(row.code) ? "1" : "0"} data-open={agtOpen(row.code) ? "1" : "0"} data-even={agtEven(row.code) ? "1" : "0"} data-digit={agtDigit(row.code) ? "1" : "0"} data-letter={agtLetter(row.code) ? "1" : "0"} data-mixed={agtMixed(row.code) ? "1" : "0"} data-upper={agtUpper(row.code) ? "1" : "0"} data-lower={agtLower(row.code) ? "1" : "0"} data-space={agtSpace(row.code) ? "1" : "0"} data-vowel={agtVowel(row.code) ? "1" : "0"} data-tail={agtTail(row.code) ? "1" : "0"} data-first={agtFirst(row.code) ? "1" : "0"} data-held={agtHeld(row.code) ? "1" : "0"} data-join={agtJoin(row.code) ? "1" : "0"} data-route={agtRoute(row.code) ? "1" : "0"} data-brief={agtBrief(row.code) ? "1" : "0"}>
              <label className="c4-agtplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-agtplate-meta">{name || v4("agtOpen")} · {agtStamp(row.code) || "—"} · {agtFamily(row.code) || "—"} · {agtLength(row.code) ?? "—"} · {laneLabel(v4, agtLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-agtplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSelReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("agtReviewed") : v4("agtReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = agtCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("agtCopied") : v4("agtCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("agtCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
