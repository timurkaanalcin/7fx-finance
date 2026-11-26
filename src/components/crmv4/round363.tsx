"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CGN_KEY,
  CGN_REVIEW_KEY,
  TVS_DENSITY_KEY,
  TVS_KEY,
  TVS_MODES,
  TVS_VIEW_KEY,
  addTriovis,
  addTriovisTag,
  addTriovisView,
  briskTriovis,
  bulkSelReview,
  bulkTriovisCoffer,
  bulkTriovisGraphite,
  bulkTriovisRaise,
  bulkTriovisTag,
  busiestKeeper,
  dropTriovisView,
  editTriovis,
  editTriovisNote,
  edrBrief,
  edrCopy,
  edrDigit,
  edrEven,
  edrFamily,
  edrFirst,
  edrRoute,
  edrHeld,
  edrAway,
  edrHue,
  edrJoin,
  edrCitizen,
  edrLane,
  edrLanes,
  edrLanesCsv,
  edrLength,
  edrLetter,
  edrLower,
  edrMixed,
  edrOpen,
  edrRowsCsv,
  edrShare,
  edrSpace,
  edrStamp,
  edrTail,
  edrUpper,
  edrGuest,
  edrVowel,
  fairKeeper,
  finishFocused,
  triovisBars,
  triovisCopy,
  triovisCounts,
  triovisCsv,
  triovisDensity,
  triovisInner,
  triovisOuter,
  triovisTimeline,
  triovisKeepers,
  idleTriovis,
  laneSelCount,
  lateTriovis,
  leadingSel,
  leadingSelHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveTriovisFocus,
  overdueTriovis,
  pinTriovisFocused,
  presentSelLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenSel,
  readTriovises,
  readTriovisViews,
  readReviewedSel,
  reminderTriovises,
  restingTriovis,
  setTriovisCoffer,
  setTriovisFilm,
  setTriovisFocused,
  setTriovisPin,
  setTriovisRaised,
  setTriovisStar,
  sortTriovises,
  starTriovisFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleSel,
  toggleSelReview,
  visibleSel,
  visibleSelLanes,
  visibleTriovises,
  type CgnReview,
  type CgnRow,
  type CgnShape,
  type CgnValue,
  type Triovis,
  type TriovisDensity,
  type TriovisSort,
  type TriovisTray,
  type TriovisView,
} from "@/lib/crmv4/round363";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["5", "10", "20", "40"] as const;
const LOCKS = ["3", "6", "9"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  index: "tvsIndex",
  boot: "tvsBoot",
  pins: "tvsPins",
  spring: "tvsSpring",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "tvsAuditSave",
  edit: "tvsAuditEdit",
  note: "tvsAuditNote",
  film: "tvsAuditFilm",
  poise: "tvsAuditPoise",
  free: "tvsAuditFree",
  peg: "tvsAuditPeg",
  return: "tvsAuditReturn",
  coffer: "tvsAuditCoffer",
  open: "tvsAuditOpen",
  tag: "tvsAuditTag",
  lock: "tvsAuditRate",
  drop: "tvsAuditStep",
  lower: "tvsAuditLower",
  star: "tvsAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "edrLaneHall",
  vacant: "edrLaneVacant",
  hold: "edrLaneHold",
  desk: "edrLaneDesk",
  guest: "edrLaneGuest",
  join: "edrJoin",
  route: "edrRoute",
  brief: "edrBrief",
  long: "edrLong",
  stamp: "edrStampLane",
  vowel: "edrVowel",
  plain: "edrPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "edrChampagne",
  ivory: "edrIvory",
  graphite: "edrGraphite",
};

const SHAPE_KEY: Record<CgnShape, CrmV4CopyKey> = {
  all: "edrShapeAll",
  hall: "edrShapeHall",
  vacant: "edrShapeVacant",
  hold: "edrShapeHold",
  guest: "edrShapeGuest",
  join: "edrShapeJoin",
  route: "edrShapeRoute",
  brief: "edrShapeBrief",
  long: "edrShapeLong",
  stamp: "edrShapeStamp",
  vowel: "edrShapeVowel",
  plain: "edrShapePlain",
  open: "edrShapeOpen",
  soon: "edrShapeOpen",
  letter: "edrShapePlain",
  mixed: "edrShapeStamp",
  upper: "edrShapeUpper",
  lower: "edrShapePlain",
  space: "edrShapeSpace",
  even: "edrShapeEven",
  odd: "edrShapeEven",
  tail: "edrShapeStamp",
  first: "edrShapePlain",
  held: "edrShapeLong",
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
  return key ? v4(key) : v4("tvsBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("tvsGilt");
  if (film === "IVORY") return v4("tvsIvory");
  if (film === "GRAPHITE") return v4("tvsGraphite");
  return v4("tvsAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("edrBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("edrBlank");
}

export function TriovisRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Triovis[]>([]);
  const [views, setViews] = useState<TriovisView[]>([]);
  const [density, setDensity] = useState<TriovisDensity>("airy");
  const [tray, setTray] = useState<TriovisTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<TriovisSort>("piece");
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
  const [station, setStation] = useState("index");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readTriovises(readJson(TVS_KEY, [])));
    setViews(readTriovisViews(readJson(TVS_VIEW_KEY, [])));
    setDensity(triovisDensity(readJson(TVS_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Triovis[]) {
    setCards(next);
    writeJson(TVS_KEY, next);
  }
  function storeViews(next: TriovisView[]) {
    setViews(next);
    writeJson(TVS_VIEW_KEY, next);
  }
  function storeDensity(next: TriovisDensity) {
    setDensity(next);
    writeJson(TVS_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortTriovises(visibleTriovises(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = triovisCounts(cards, shown, station);
  const bars = triovisBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = triovisTimeline(cards);
  const reminders = reminderTriovises(cards);
  const poisers = triovisKeepers(cards);
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
        download("triovis-rules.csv", triovisCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveTriovisFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveTriovisFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addTriovis(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-triovis" aria-label={v4("tvsTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-triovis-mast">
        <p className="c4-triovis-seal" data-logo="mono">{v4("tvsLogo")}</p>
        <div>
          <p className="c4-triovis-kicker">{v4("tvsSub")}</p>
          <h2 className="c4-title">{v4("tvsTitle")}</h2>
        </div>
        <p className="c4-triovis-count">{shown.length}</p>
      </header>
      <p className="c4-triovis-links">
        <Link href={crmv4Href(base, "edr")}>{v4("edrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("tvsCustomers")}</Link>
      </p>
      <p className="c4-triovis-hint">{v4("tvsHint")}</p>
      {viewer && <p className="c4-triovis-note">{v4("tvsViewer")}</p>}
      <p className="c4-triovis-meta">{v4("tvsFair")} {fair || "—"} · {v4("tvsBusy")} {busy || "—"} · {v4("tvsSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-triovis-index" aria-label={v4("tvsRemind")}>
        <li data-tone="gold">{v4("tvsOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("tvsIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("tvsBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("tvsResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-triovis-remind c4-triovis-notices" role="status" aria-label={v4("tvsRemind")}>
          {reminders.map((name) => <li key={name}>{v4("tvsOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-triovis-chart" aria-label={v4("tvsChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-triovis-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-triovis-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("tvsEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("tvsEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("tvsNote")}<input className="c4-field" aria-label={v4("tvsNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("tvsSetter")}<input className="c4-field" aria-label={v4("tvsSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("tvsPiece")}<select className="c4-field" aria-label={v4("tvsPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("tvsBlankPiece")}</option>{TVS_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("tvsFilm")}<select className="c4-field" aria-label={v4("tvsFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("tvsAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("tvsDrop")}<select className="c4-field" aria-label={v4("tvsDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("tvsAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("tvsLock")}<select className="c4-field" aria-label={v4("tvsLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("tvsAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("tvsTag")}<input className="c4-field" aria-label={v4("tvsTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("tvsAdd")}</button>
      </form>
      <div className="c4-triovis-tools">
        <input ref={searchRef} className="c4-field c4-triovis-search" aria-label={v4("tvsSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("tvsSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "tvsBoard" : item === "peg" ? "tvsPeg" : "tvsCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("tvsInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("tvsOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("tvsSortSetter") : v4("tvsSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("tvsClose") : v4("tvsAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("tvsTimeline")}</button>
        <label className="c4-lab">{v4("tvsDesk")}<select className="c4-field" aria-label={v4("tvsDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{TVS_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-triovis-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addTriovisView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("tvsViewName")}<input className="c4-field" aria-label={v4("tvsViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("tvsSaveView")}</button>
      </form>
      <ul className="c4-triovis-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("tvsApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropTriovisView(views, view.id))}>{v4("tvsDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-triovis-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTriovisRaise(cards, picked))}>{v4("tvsBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTriovisCoffer(cards, picked))}>{v4("tvsBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTriovisGraphite(cards, picked))}>{v4("tvsBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTriovisTag(cards, picked))}>{v4("tvsBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("triovis-rules.csv", triovisCsv(shown, station))}>{v4("tvsCsv")}</button>
        <p className="c4-triovis-meta">{v4("tvsKeys")} / n x a j k · {v4("tvsQuiet")} {counts.quiet} · {v4("tvsInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-triovis-time" aria-label={v4("tvsTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("tvsEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-triovis-list">
          {shown.map((card) => {
            const late = lateTriovis(card, station);
            return (
              <li key={card.id} className="c4-triovis-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleTriovis(card) ? "1" : "0"} data-brisk={briskTriovis(card) ? "1" : "0"} data-overdue={overdueTriovis(card) ? "1" : "0"} data-resting={restingTriovis(card) ? "1" : "0"} data-inner={triovisInner(card.piece) ? "1" : "0"} data-outer={triovisOuter(card.piece) ? "1" : "0"}>
                <label className="c4-triovis-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editTriovis(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("tvsEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("tvsApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editTriovisNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("tvsNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-triovis-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "tvsAuditSave")}` : ""}{late ? ` · ${v4("tvsOverdue")}` : ""}</p>
                </div>
                <div className="c4-triovis-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("tvsEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTriovisRaised(cards, card.id, !card.raised))}>{card.raised ? v4("tvsFree") : v4("tvsPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTriovisFilm(cards, card.id, suggestedFilm))}>{v4("tvsSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTriovisPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("tvsUnpeg") : v4("tvsPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTriovisCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("tvsUncoffer") : v4("tvsCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTriovisStar(cards, card.id, !card.starred))}>{card.starred ? v4("tvsUnstar") : v4("tvsStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addTriovisTag(cards, card.id, "a"))}>{v4("tvsTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("tvsRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("tvsLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("tvsLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("tvsLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("tvsFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTriovisFocused(cards, card.id))}>{v4("tvsPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinTriovisFocused(cards, card.id))}>{v4("tvsPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starTriovisFocused(cards, card.id))}>{v4("tvsStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(triovisCopy(card))}>{v4("tvsCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type CgnUser = { id?: string; name?: string | null; canEditRates?: string | boolean | null };

export function GrantPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CgnUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<CgnShape>("all");
  const [review, setReview] = useState<CgnReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): CgnRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { canEditRates: row.canEditRates === true || row.canEditRates === false ? row.canEditRates : textField(row.canEditRates) } satisfies CgnValue,
    };
  }).filter((row): row is CgnRow => Boolean(row));
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
    const next = readHiddenSel(readJson(CGN_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(CGN_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSel(readJson(CGN_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(CGN_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSelLanes(present, hidden, showHidden);
  const shown = visibleSel(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = edrLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = edrLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSel(rows);
  const leadHue = leadingSelHue(rows);
  const whole = rows.filter((row) => edrLane(row.code)).length;
  const share = edrShare(laneSelCount(rows, "hall"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("grants.csv", edrLanesCsv(rows));
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
    writeJson(CGN_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(CGN_REVIEW_KEY, next);
  }

  return (
    <section className="c4-edrplate" aria-label={v4("edrTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-edrplate-mast">
        <p className="c4-edrplate-seal" data-logo="mono">{v4("edrLogo")}</p>
        <div>
          <p className="c4-edrplate-kicker">{v4("edrSub")}</p>
          <h2 className="c4-title">{v4("edrTitle")}</h2>
        </div>
        <p className="c4-edrplate-count">{shown.length}</p>
      </header>
      <p className="c4-edrplate-links">
        <Link href={crmv4Href(base, "tvs")}>{v4("tvsTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("edrCustomer")}</Link>
      </p>
      <p className="c4-edrplate-hint">{v4("edrHint")}</p>
      {viewer && <p className="c4-edrplate-note">{v4("edrViewer")}</p>}
      <p className="c4-edrplate-meta">{v4("edrLead")} {laneLabel(v4, lead)} · {v4("edrToneLead")} {hueLabel(v4, leadHue)} · {v4("edrShare")} {share}</p>
      <div className="c4-edrplate-chart" aria-label={v4("edrChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-edrplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-edrplate-tools">
        <input ref={searchRef} className="c4-field c4-edrplate-search" aria-label={v4("edrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("edrSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("edrShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "edrAll" : item === "reviewed" ? "edrReviewed" : "edrFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("edrAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as CgnShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSel(hidden, item))}>{hidden.includes(item) ? v4("edrShow") : v4("edrHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-edrplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, true))}>{v4("edrBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, false))}>{v4("edrBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("grant-lanes.csv", edrLanesCsv(rows))}>{v4("edrCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("grant-rows.csv", edrRowsCsv(shown, reviewed))}>{v4("edrRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("edrLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("edrFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("edrEmpty")}</p>}
      <ul className="c4-edrplate-list">
        {shown.map((row) => {
          const name = edrCopy(row.code);
          const tone = edrHue(row.code);
          return (
            <li key={row.id} className="c4-edrplate-card" data-mail={edrLane(row.code) || "open"} data-hue={tone || "none"} data-home={edrLane(row.code) === "hall" ? "1" : "0"} data-away={edrAway(row.code) ? "1" : "0"} data-guest={edrGuest(row.code) ? "1" : "0"} data-citizen={edrCitizen(row.code) ? "1" : "0"} data-open={edrOpen(row.code) ? "1" : "0"} data-even={edrEven(row.code) ? "1" : "0"} data-digit={edrDigit(row.code) ? "1" : "0"} data-letter={edrLetter(row.code) ? "1" : "0"} data-mixed={edrMixed(row.code) ? "1" : "0"} data-upper={edrUpper(row.code) ? "1" : "0"} data-lower={edrLower(row.code) ? "1" : "0"} data-space={edrSpace(row.code) ? "1" : "0"} data-vowel={edrVowel(row.code) ? "1" : "0"} data-tail={edrTail(row.code) ? "1" : "0"} data-first={edrFirst(row.code) ? "1" : "0"} data-held={edrHeld(row.code) ? "1" : "0"} data-join={edrJoin(row.code) ? "1" : "0"} data-route={edrRoute(row.code) ? "1" : "0"} data-brief={edrBrief(row.code) ? "1" : "0"}>
              <label className="c4-edrplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-edrplate-meta">{name || v4("edrOpen")} · {edrStamp(row.code) || "—"} · {edrFamily(row.code) || "—"} · {edrLength(row.code) ?? "—"} · {laneLabel(v4, edrLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-edrplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSelReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("edrReviewed") : v4("edrReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = edrCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("edrCopied") : v4("edrCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("edrCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
