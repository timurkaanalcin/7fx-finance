"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  SSP_KEY,
  SSP_REVIEW_KEY,
  BTL_DENSITY_KEY,
  BTL_KEY,
  BTL_MODES,
  BTL_VIEW_KEY,
  addBasse,
  addBasseTag,
  addBasseView,
  briskBasse,
  bulkSelReview,
  bulkBasseCoffer,
  bulkBasseGraphite,
  bulkBasseRaise,
  bulkBasseTag,
  busiestKeeper,
  dropBasseView,
  editBasse,
  editBasseNote,
  sspBrief,
  sspCopy,
  sspDigit,
  sspEven,
  sspFamily,
  sspFirst,
  sspRoute,
  sspHeld,
  sspAway,
  sspHue,
  sspJoin,
  sspCitizen,
  sspLane,
  sspLanes,
  sspLanesCsv,
  sspLength,
  sspLetter,
  sspLower,
  sspMixed,
  sspOpen,
  sspRowsCsv,
  sspShare,
  sspSpace,
  sspStamp,
  sspTail,
  sspUpper,
  sspGuest,
  sspVowel,
  fairKeeper,
  finishFocused,
  basseBars,
  basseCopy,
  basseCounts,
  basseCsv,
  basseDensity,
  basseInner,
  basseOuter,
  basseTimeline,
  basseKeepers,
  idleBasse,
  laneSelCount,
  lateBasse,
  leadingSel,
  leadingSelHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveBasseFocus,
  overdueBasse,
  pinBasseFocused,
  presentSelLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenSel,
  readBasseCards,
  readBasseViews,
  readReviewedSel,
  reminderBasseCards,
  restingBasse,
  setBasseCoffer,
  setBasseFilm,
  setBasseFocused,
  setBassePin,
  setBasseRaised,
  setBasseStar,
  sortBasseCards,
  starBasseFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleSel,
  toggleSelReview,
  visibleSel,
  visibleSelLanes,
  visibleBasseCards,
  type SspReview,
  type SspRow,
  type SspShape,
  type SspValue,
  type Basse,
  type BasseDensity,
  type BasseSort,
  type BasseTray,
  type BasseView,
} from "@/lib/crmv4/round371";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GLAZE", "IVORY", "GRAPHITE"] as const;
const DROPS = ["2", "5", "10", "20"] as const;
const LOCKS = ["2", "4", "8"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  bed: "btlBed",
  ground: "btlGround",
  lip: "btlLip",
  crest: "btlCrest",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "btlAuditSave",
  edit: "btlAuditEdit",
  note: "btlAuditNote",
  film: "btlAuditFilm",
  poise: "btlAuditPoise",
  free: "btlAuditFree",
  peg: "btlAuditPeg",
  return: "btlAuditReturn",
  coffer: "btlAuditCoffer",
  open: "btlAuditOpen",
  tag: "btlAuditTag",
  lock: "btlAuditRate",
  drop: "btlAuditStep",
  lower: "btlAuditLower",
  star: "btlAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "sspLaneHall",
  vacant: "sspLaneVacant",
  hold: "sspLaneHold",
  desk: "sspLaneDesk",
  guest: "sspLaneGuest",
  join: "sspJoin",
  route: "sspRoute",
  brief: "sspBrief",
  long: "sspLong",
  stamp: "sspStampLane",
  vowel: "sspVowel",
  plain: "sspPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "sspChampagne",
  ivory: "sspIvory",
  graphite: "sspGraphite",
};

const SHAPE_KEY: Record<SspShape, CrmV4CopyKey> = {
  all: "sspShapeAll",
  hall: "sspShapeHall",
  vacant: "sspShapeVacant",
  hold: "sspShapeHold",
  guest: "sspShapeGuest",
  join: "sspShapeJoin",
  route: "sspShapeRoute",
  brief: "sspShapeBrief",
  long: "sspShapeLong",
  stamp: "sspShapeStamp",
  vowel: "sspShapeVowel",
  plain: "sspShapePlain",
  open: "sspShapeOpen",
  soon: "sspShapeOpen",
  letter: "sspShapePlain",
  mixed: "sspShapeStamp",
  upper: "sspShapeUpper",
  lower: "sspShapePlain",
  space: "sspShapeSpace",
  even: "sspShapeEven",
  odd: "sspShapeEven",
  tail: "sspShapeStamp",
  first: "sspShapePlain",
  held: "sspShapeLong",
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
  return key ? v4(key) : v4("btlBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GLAZE") return v4("btlGlaze");
  if (film === "IVORY") return v4("btlIvory");
  if (film === "GRAPHITE") return v4("btlGraphite");
  return v4("btlAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("sspBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("sspBlank");
}

export function BasseTailleRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Basse[]>([]);
  const [views, setViews] = useState<BasseView[]>([]);
  const [density, setDensity] = useState<BasseDensity>("airy");
  const [tray, setTray] = useState<BasseTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<BasseSort>("piece");
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
  const [station, setStation] = useState("bed");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readBasseCards(readJson(BTL_KEY, [])));
    setViews(readBasseViews(readJson(BTL_VIEW_KEY, [])));
    setDensity(basseDensity(readJson(BTL_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Basse[]) {
    setCards(next);
    writeJson(BTL_KEY, next);
  }
  function storeViews(next: BasseView[]) {
    setViews(next);
    writeJson(BTL_VIEW_KEY, next);
  }
  function storeDensity(next: BasseDensity) {
    setDensity(next);
    writeJson(BTL_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortBasseCards(visibleBasseCards(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = basseCounts(cards, shown, station);
  const bars = basseBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = basseTimeline(cards);
  const reminders = reminderBasseCards(cards);
  const poisers = basseKeepers(cards);
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
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("basse-taille.csv", basseCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveBasseFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveBasseFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addBasse(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-basse" aria-label={v4("btlTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-basse-mast">
        <p className="c4-basse-seal" data-logo="mono">{v4("btlLogo")}</p>
        <div>
          <p className="c4-basse-kicker">{v4("btlSub")}</p>
          <h2 className="c4-title">{v4("btlTitle")}</h2>
        </div>
        <p className="c4-basse-count">{shown.length}</p>
      </header>
      <p className="c4-basse-links">
        <Link href={crmv4Href(base, "ssp")}>{v4("sspTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("btlCustomers")}</Link>
      </p>
      <p className="c4-basse-hint">{v4("btlHint")}</p>
      {viewer && <p className="c4-basse-note">{v4("btlViewer")}</p>}
      <p className="c4-basse-meta">{v4("btlFair")} {fair || "—"} · {v4("btlBusy")} {busy || "—"} · {v4("btlSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-basse-index" aria-label={v4("btlRemind")}>
        <li data-tone="gold">{v4("btlOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("btlIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("btlBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("btlResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-basse-remind c4-basse-notices" role="status" aria-label={v4("btlRemind")}>
          {reminders.map((name) => <li key={name}>{v4("btlOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-basse-chart" aria-label={v4("btlChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-basse-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-basse-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("btlEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("btlEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("btlNote")}<input className="c4-field" aria-label={v4("btlNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("btlSetter")}<input className="c4-field" aria-label={v4("btlSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("btlPiece")}<select className="c4-field" aria-label={v4("btlPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("btlBlankPiece")}</option>{BTL_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("btlFilm")}<select className="c4-field" aria-label={v4("btlFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("btlAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("btlDrop")}<select className="c4-field" aria-label={v4("btlDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("btlAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("btlLock")}<select className="c4-field" aria-label={v4("btlLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("btlAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("btlTag")}<input className="c4-field" aria-label={v4("btlTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("btlAdd")}</button>
      </form>
      <div className="c4-basse-tools">
        <input ref={searchRef} className="c4-field c4-basse-search" aria-label={v4("btlSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("btlSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "btlBoard" : item === "peg" ? "btlPeg" : "btlCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("btlInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("btlOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("btlSortSetter") : v4("btlSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("btlClose") : v4("btlAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("btlTimeline")}</button>
        <label className="c4-lab">{v4("btlDesk")}<select className="c4-field" aria-label={v4("btlDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{BTL_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-basse-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addBasseView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("btlViewName")}<input className="c4-field" aria-label={v4("btlViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("btlSaveView")}</button>
      </form>
      <ul className="c4-basse-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("btlApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropBasseView(views, view.id))}>{v4("btlDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-basse-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBasseRaise(cards, picked))}>{v4("btlBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBasseCoffer(cards, picked))}>{v4("btlBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBasseGraphite(cards, picked))}>{v4("btlBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBasseTag(cards, picked))}>{v4("btlBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("basse-taille.csv", basseCsv(shown, station))}>{v4("btlCsv")}</button>
        <p className="c4-basse-meta">{v4("btlKeys")} / c x a j k · {v4("btlQuiet")} {counts.quiet} · {v4("btlInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-basse-time" aria-label={v4("btlTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("btlEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-basse-list">
          {shown.map((card) => {
            const late = lateBasse(card, station);
            return (
              <li key={card.id} className="c4-basse-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleBasse(card) ? "1" : "0"} data-brisk={briskBasse(card) ? "1" : "0"} data-overdue={overdueBasse(card) ? "1" : "0"} data-resting={restingBasse(card) ? "1" : "0"} data-inner={basseInner(card.piece) ? "1" : "0"} data-outer={basseOuter(card.piece) ? "1" : "0"}>
                <label className="c4-basse-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editBasse(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("btlEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("btlApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editBasseNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("btlNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-basse-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "btlAuditSave")}` : ""}{late ? ` · ${v4("btlOverdue")}` : ""}</p>
                </div>
                <div className="c4-basse-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("btlEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBasseRaised(cards, card.id, !card.raised))}>{card.raised ? v4("btlFree") : v4("btlPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBasseFilm(cards, card.id, suggestedFilm))}>{v4("btlSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBassePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("btlUnpeg") : v4("btlPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBasseCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("btlUncoffer") : v4("btlCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBasseStar(cards, card.id, !card.starred))}>{card.starred ? v4("btlUnstar") : v4("btlStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addBasseTag(cards, card.id, "b"))}>{v4("btlTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("btlRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("btlLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("btlLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("btlLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("btlFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBasseFocused(cards, card.id))}>{v4("btlPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinBasseFocused(cards, card.id))}>{v4("btlPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starBasseFocused(cards, card.id))}>{v4("btlStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(basseCopy(card))}>{v4("btlCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type SspUser = { id?: string; name?: string | null; saleStatus?: string | null };

export function SaleStagePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: SspUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<SspShape>("all");
  const [review, setReview] = useState<SspReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): SspRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { saleStatus: textField(row.saleStatus) } satisfies SspValue,
    };
  }).filter((row): row is SspRow => Boolean(row));
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
    const next = readHiddenSel(readJson(SSP_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(SSP_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSel(readJson(SSP_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(SSP_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSelLanes(present, hidden, showHidden);
  const shown = visibleSel(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = sspLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = sspLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSel(rows);
  const leadHue = leadingSelHue(rows);
  const whole = rows.filter((row) => sspLane(row.code)).length;
  const share = sspShare(laneSelCount(rows, "hall"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("sale-stages.csv", sspLanesCsv(rows));
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
    writeJson(SSP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(SSP_REVIEW_KEY, next);
  }

  return (
    <section className="c4-sspplate" aria-label={v4("sspTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-sspplate-mast">
        <p className="c4-sspplate-seal" data-logo="mono">{v4("sspLogo")}</p>
        <div>
          <p className="c4-sspplate-kicker">{v4("sspSub")}</p>
          <h2 className="c4-title">{v4("sspTitle")}</h2>
        </div>
        <p className="c4-sspplate-count">{shown.length}</p>
      </header>
      <p className="c4-sspplate-links">
        <Link href={crmv4Href(base, "btl")}>{v4("btlTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("sspCustomer")}</Link>
      </p>
      <p className="c4-sspplate-hint">{v4("sspHint")}</p>
      {viewer && <p className="c4-sspplate-note">{v4("sspViewer")}</p>}
      <p className="c4-sspplate-meta">{v4("sspLead")} {laneLabel(v4, lead)} · {v4("sspToneLead")} {hueLabel(v4, leadHue)} · {v4("sspShare")} {share}</p>
      <div className="c4-sspplate-chart" aria-label={v4("sspChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-sspplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-sspplate-tools">
        <input ref={searchRef} className="c4-field c4-sspplate-search" aria-label={v4("sspSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("sspSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("sspShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "sspAll" : item === "reviewed" ? "sspReviewed" : "sspFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("sspAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as SspShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSel(hidden, item))}>{hidden.includes(item) ? v4("sspShow") : v4("sspHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-sspplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, true))}>{v4("sspBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, false))}>{v4("sspBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("sale-stage-lanes.csv", sspLanesCsv(rows))}>{v4("sspCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("sale-stage-rows.csv", sspRowsCsv(shown, reviewed))}>{v4("sspRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("sspLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("sspFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("sspEmpty")}</p>}
      <ul className="c4-sspplate-list">
        {shown.map((row) => {
          const name = sspCopy(row.code);
          const tone = sspHue(row.code);
          return (
            <li key={row.id} className="c4-sspplate-card" data-mail={sspLane(row.code) || "open"} data-hue={tone || "none"} data-home={sspLane(row.code) === "hall" ? "1" : "0"} data-away={sspAway(row.code) ? "1" : "0"} data-guest={sspGuest(row.code) ? "1" : "0"} data-citizen={sspCitizen(row.code) ? "1" : "0"} data-open={sspOpen(row.code) ? "1" : "0"} data-even={sspEven(row.code) ? "1" : "0"} data-digit={sspDigit(row.code) ? "1" : "0"} data-letter={sspLetter(row.code) ? "1" : "0"} data-mixed={sspMixed(row.code) ? "1" : "0"} data-upper={sspUpper(row.code) ? "1" : "0"} data-lower={sspLower(row.code) ? "1" : "0"} data-space={sspSpace(row.code) ? "1" : "0"} data-vowel={sspVowel(row.code) ? "1" : "0"} data-tail={sspTail(row.code) ? "1" : "0"} data-first={sspFirst(row.code) ? "1" : "0"} data-held={sspHeld(row.code) ? "1" : "0"} data-join={sspJoin(row.code) ? "1" : "0"} data-route={sspRoute(row.code) ? "1" : "0"} data-brief={sspBrief(row.code) ? "1" : "0"}>
              <label className="c4-sspplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-sspplate-meta">{name || v4("sspOpen")} · {sspStamp(row.code) || "—"} · {sspFamily(row.code) || "—"} · {sspLength(row.code) ?? "—"} · {laneLabel(v4, sspLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-sspplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSelReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("sspReviewed") : v4("sspReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = sspCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("sspCopied") : v4("sspCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, row.userId ? `customers/${row.userId}` : "customers")}>{v4("sspCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
