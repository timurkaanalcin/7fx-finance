"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DRV_KEY,
  DRV_REVIEW_KEY,
  NIL_DENSITY_KEY,
  NIL_KEY,
  NIL_MODES,
  NIL_VIEW_KEY,
  addNiello,
  addNielloTag,
  addNielloView,
  briskNiello,
  bulkSelReview,
  bulkNielloCoffer,
  bulkNielloGraphite,
  bulkNielloRaise,
  bulkNielloTag,
  busiestKeeper,
  dropNielloView,
  editNiello,
  editNielloNote,
  drvBrief,
  drvCopy,
  drvDigit,
  drvEven,
  drvFamily,
  drvFirst,
  drvRoute,
  drvHeld,
  drvAway,
  drvHue,
  drvJoin,
  drvCitizen,
  drvLane,
  drvLanes,
  drvLanesCsv,
  drvLength,
  drvLetter,
  drvLower,
  drvMixed,
  drvOpen,
  drvRowsCsv,
  drvShare,
  drvSpace,
  drvStamp,
  drvTail,
  drvUpper,
  drvGuest,
  drvVowel,
  fairKeeper,
  finishFocused,
  nielloBars,
  nielloCopy,
  nielloCounts,
  nielloCsv,
  nielloDensity,
  nielloInner,
  nielloOuter,
  nielloTimeline,
  nielloKeepers,
  idleNiello,
  laneSelCount,
  lateNiello,
  leadingSel,
  leadingSelHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveNielloFocus,
  overdueNiello,
  pinNielloFocused,
  presentSelLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenSel,
  readNielloCards,
  readNielloViews,
  readReviewedSel,
  reminderNielloCards,
  restingNiello,
  setNielloCoffer,
  setNielloFilm,
  setNielloFocused,
  setNielloPin,
  setNielloRaised,
  setNielloStar,
  sortNielloCards,
  starNielloFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleSel,
  toggleSelReview,
  visibleSel,
  visibleSelLanes,
  visibleNielloCards,
  type DrvReview,
  type DrvRow,
  type DrvShape,
  type DrvValue,
  type Niello,
  type NielloDensity,
  type NielloSort,
  type NielloTray,
  type NielloView,
} from "@/lib/crmv4/round369";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["SOOT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["4", "8", "16", "32"] as const;
const LOCKS = ["2", "4", "8"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  well: "nilWell",
  wall: "nilWall",
  wire: "nilWire",
  lip: "nilLip",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "nilAuditSave",
  edit: "nilAuditEdit",
  note: "nilAuditNote",
  film: "nilAuditFilm",
  poise: "nilAuditPoise",
  free: "nilAuditFree",
  peg: "nilAuditPeg",
  return: "nilAuditReturn",
  coffer: "nilAuditCoffer",
  open: "nilAuditOpen",
  tag: "nilAuditTag",
  lock: "nilAuditRate",
  drop: "nilAuditStep",
  lower: "nilAuditLower",
  star: "nilAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "drvLaneHall",
  vacant: "drvLaneVacant",
  hold: "drvLaneHold",
  desk: "drvLaneDesk",
  guest: "drvLaneGuest",
  join: "drvJoin",
  route: "drvRoute",
  brief: "drvBrief",
  long: "drvLong",
  stamp: "drvStampLane",
  vowel: "drvVowel",
  plain: "drvPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "drvChampagne",
  ivory: "drvIvory",
  graphite: "drvGraphite",
};

const SHAPE_KEY: Record<DrvShape, CrmV4CopyKey> = {
  all: "drvShapeAll",
  hall: "drvShapeHall",
  vacant: "drvShapeVacant",
  hold: "drvShapeHold",
  guest: "drvShapeGuest",
  join: "drvShapeJoin",
  route: "drvShapeRoute",
  brief: "drvShapeBrief",
  long: "drvShapeLong",
  stamp: "drvShapeStamp",
  vowel: "drvShapeVowel",
  plain: "drvShapePlain",
  open: "drvShapeOpen",
  soon: "drvShapeOpen",
  letter: "drvShapePlain",
  mixed: "drvShapeStamp",
  upper: "drvShapeUpper",
  lower: "drvShapePlain",
  space: "drvShapeSpace",
  even: "drvShapeEven",
  odd: "drvShapeEven",
  tail: "drvShapeStamp",
  first: "drvShapePlain",
  held: "drvShapeLong",
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
  return key ? v4(key) : v4("nilBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "SOOT") return v4("nilSoot");
  if (film === "IVORY") return v4("nilIvory");
  if (film === "GRAPHITE") return v4("nilGraphite");
  return v4("nilAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("drvBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("drvBlank");
}

export function NielloRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Niello[]>([]);
  const [views, setViews] = useState<NielloView[]>([]);
  const [density, setDensity] = useState<NielloDensity>("airy");
  const [tray, setTray] = useState<NielloTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<NielloSort>("piece");
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
  const [station, setStation] = useState("well");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readNielloCards(readJson(NIL_KEY, [])));
    setViews(readNielloViews(readJson(NIL_VIEW_KEY, [])));
    setDensity(nielloDensity(readJson(NIL_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Niello[]) {
    setCards(next);
    writeJson(NIL_KEY, next);
  }
  function storeViews(next: NielloView[]) {
    setViews(next);
    writeJson(NIL_VIEW_KEY, next);
  }
  function storeDensity(next: NielloDensity) {
    setDensity(next);
    writeJson(NIL_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortNielloCards(visibleNielloCards(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = nielloCounts(cards, shown, station);
  const bars = nielloBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = nielloTimeline(cards);
  const reminders = reminderNielloCards(cards);
  const poisers = nielloKeepers(cards);
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
        download("niello-rules.csv", nielloCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveNielloFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveNielloFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addNiello(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-niello" aria-label={v4("nilTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-niello-mast">
        <p className="c4-niello-seal" data-logo="mono">{v4("nilLogo")}</p>
        <div>
          <p className="c4-niello-kicker">{v4("nilSub")}</p>
          <h2 className="c4-title">{v4("nilTitle")}</h2>
        </div>
        <p className="c4-niello-count">{shown.length}</p>
      </header>
      <p className="c4-niello-links">
        <Link href={crmv4Href(base, "drv")}>{v4("drvTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("nilCustomers")}</Link>
      </p>
      <p className="c4-niello-hint">{v4("nilHint")}</p>
      {viewer && <p className="c4-niello-note">{v4("nilViewer")}</p>}
      <p className="c4-niello-meta">{v4("nilFair")} {fair || "—"} · {v4("nilBusy")} {busy || "—"} · {v4("nilSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-niello-index" aria-label={v4("nilRemind")}>
        <li data-tone="gold">{v4("nilOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("nilIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("nilBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("nilResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-niello-remind c4-niello-notices" role="status" aria-label={v4("nilRemind")}>
          {reminders.map((name) => <li key={name}>{v4("nilOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-niello-chart" aria-label={v4("nilChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-niello-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-niello-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("nilEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("nilEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("nilNote")}<input className="c4-field" aria-label={v4("nilNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("nilSetter")}<input className="c4-field" aria-label={v4("nilSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("nilPiece")}<select className="c4-field" aria-label={v4("nilPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("nilBlankPiece")}</option>{NIL_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("nilFilm")}<select className="c4-field" aria-label={v4("nilFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("nilAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("nilDrop")}<select className="c4-field" aria-label={v4("nilDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("nilAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("nilLock")}<select className="c4-field" aria-label={v4("nilLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("nilAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("nilTag")}<input className="c4-field" aria-label={v4("nilTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("nilAdd")}</button>
      </form>
      <div className="c4-niello-tools">
        <input ref={searchRef} className="c4-field c4-niello-search" aria-label={v4("nilSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("nilSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "nilBoard" : item === "peg" ? "nilPeg" : "nilCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("nilInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("nilOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("nilSortSetter") : v4("nilSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("nilClose") : v4("nilAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("nilTimeline")}</button>
        <label className="c4-lab">{v4("nilDesk")}<select className="c4-field" aria-label={v4("nilDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{NIL_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-niello-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addNielloView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("nilViewName")}<input className="c4-field" aria-label={v4("nilViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("nilSaveView")}</button>
      </form>
      <ul className="c4-niello-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("nilApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropNielloView(views, view.id))}>{v4("nilDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-niello-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkNielloRaise(cards, picked))}>{v4("nilBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkNielloCoffer(cards, picked))}>{v4("nilBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkNielloGraphite(cards, picked))}>{v4("nilBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkNielloTag(cards, picked))}>{v4("nilBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("niello-rules.csv", nielloCsv(shown, station))}>{v4("nilCsv")}</button>
        <p className="c4-niello-meta">{v4("nilKeys")} / n x a j k · {v4("nilQuiet")} {counts.quiet} · {v4("nilInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-niello-time" aria-label={v4("nilTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("nilEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-niello-list">
          {shown.map((card) => {
            const late = lateNiello(card, station);
            return (
              <li key={card.id} className="c4-niello-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleNiello(card) ? "1" : "0"} data-brisk={briskNiello(card) ? "1" : "0"} data-overdue={overdueNiello(card) ? "1" : "0"} data-resting={restingNiello(card) ? "1" : "0"} data-inner={nielloInner(card.piece) ? "1" : "0"} data-outer={nielloOuter(card.piece) ? "1" : "0"}>
                <label className="c4-niello-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editNiello(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("nilEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("nilApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editNielloNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("nilNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-niello-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "nilAuditSave")}` : ""}{late ? ` · ${v4("nilOverdue")}` : ""}</p>
                </div>
                <div className="c4-niello-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("nilEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNielloRaised(cards, card.id, !card.raised))}>{card.raised ? v4("nilFree") : v4("nilPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNielloFilm(cards, card.id, suggestedFilm))}>{v4("nilSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNielloPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("nilUnpeg") : v4("nilPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNielloCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("nilUncoffer") : v4("nilCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNielloStar(cards, card.id, !card.starred))}>{card.starred ? v4("nilUnstar") : v4("nilStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addNielloTag(cards, card.id, "n"))}>{v4("nilTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("nilRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("nilLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("nilLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("nilLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("nilFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNielloFocused(cards, card.id))}>{v4("nilPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinNielloFocused(cards, card.id))}>{v4("nilPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starNielloFocused(cards, card.id))}>{v4("nilStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(nielloCopy(card))}>{v4("nilCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type DrvDoc = { id?: string; name?: string | null; note?: string | null; status?: string | null; trader?: string | null; traderId?: string | null };

export function DocumentReviewPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ documents?: DrvDoc[] }>("/api/admin/documents?take=24");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<DrvShape>("all");
  const [review, setReview] = useState<DrvReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.documents || []).map((row): DrvRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    const note = textField(row.note);
    const status = textField(row.status);
    return {
      id,
      label: textField(row.name) || textField(row.trader) || id,
      userId: textField(row.traderId),
      code: { reviewNote: note || status } satisfies DrvValue,
    };
  }).filter((row): row is DrvRow => Boolean(row));
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
    const next = readHiddenSel(readJson(DRV_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(DRV_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSel(readJson(DRV_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(DRV_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSelLanes(present, hidden, showHidden);
  const shown = visibleSel(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = drvLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = drvLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSel(rows);
  const leadHue = leadingSelHue(rows);
  const whole = rows.filter((row) => drvLane(row.code)).length;
  const share = drvShare(laneSelCount(rows, "hall"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("document-reviews.csv", drvLanesCsv(rows));
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
    writeJson(DRV_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(DRV_REVIEW_KEY, next);
  }

  return (
    <section className="c4-drvplate" aria-label={v4("drvTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-drvplate-mast">
        <p className="c4-drvplate-seal" data-logo="mono">{v4("drvLogo")}</p>
        <div>
          <p className="c4-drvplate-kicker">{v4("drvSub")}</p>
          <h2 className="c4-title">{v4("drvTitle")}</h2>
        </div>
        <p className="c4-drvplate-count">{shown.length}</p>
      </header>
      <p className="c4-drvplate-links">
        <Link href={crmv4Href(base, "nil")}>{v4("nilTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("drvCustomer")}</Link>
      </p>
      <p className="c4-drvplate-hint">{v4("drvHint")}</p>
      {viewer && <p className="c4-drvplate-note">{v4("drvViewer")}</p>}
      <p className="c4-drvplate-meta">{v4("drvLead")} {laneLabel(v4, lead)} · {v4("drvToneLead")} {hueLabel(v4, leadHue)} · {v4("drvShare")} {share}</p>
      <div className="c4-drvplate-chart" aria-label={v4("drvChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-drvplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-drvplate-tools">
        <input ref={searchRef} className="c4-field c4-drvplate-search" aria-label={v4("drvSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("drvSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("drvShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "drvAll" : item === "reviewed" ? "drvReviewed" : "drvFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("drvAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as DrvShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSel(hidden, item))}>{hidden.includes(item) ? v4("drvShow") : v4("drvHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-drvplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, true))}>{v4("drvBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, false))}>{v4("drvBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("document-lanes.csv", drvLanesCsv(rows))}>{v4("drvCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("document-rows.csv", drvRowsCsv(shown, reviewed))}>{v4("drvRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("drvLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("drvFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("drvEmpty")}</p>}
      <ul className="c4-drvplate-list">
        {shown.map((row) => {
          const name = drvCopy(row.code);
          const tone = drvHue(row.code);
          return (
            <li key={row.id} className="c4-drvplate-card" data-mail={drvLane(row.code) || "open"} data-hue={tone || "none"} data-home={drvLane(row.code) === "hall" ? "1" : "0"} data-away={drvAway(row.code) ? "1" : "0"} data-guest={drvGuest(row.code) ? "1" : "0"} data-citizen={drvCitizen(row.code) ? "1" : "0"} data-open={drvOpen(row.code) ? "1" : "0"} data-even={drvEven(row.code) ? "1" : "0"} data-digit={drvDigit(row.code) ? "1" : "0"} data-letter={drvLetter(row.code) ? "1" : "0"} data-mixed={drvMixed(row.code) ? "1" : "0"} data-upper={drvUpper(row.code) ? "1" : "0"} data-lower={drvLower(row.code) ? "1" : "0"} data-space={drvSpace(row.code) ? "1" : "0"} data-vowel={drvVowel(row.code) ? "1" : "0"} data-tail={drvTail(row.code) ? "1" : "0"} data-first={drvFirst(row.code) ? "1" : "0"} data-held={drvHeld(row.code) ? "1" : "0"} data-join={drvJoin(row.code) ? "1" : "0"} data-route={drvRoute(row.code) ? "1" : "0"} data-brief={drvBrief(row.code) ? "1" : "0"}>
              <label className="c4-drvplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-drvplate-meta">{name || v4("drvOpen")} · {drvStamp(row.code) || "—"} · {drvFamily(row.code) || "—"} · {drvLength(row.code) ?? "—"} · {laneLabel(v4, drvLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-drvplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSelReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("drvReviewed") : v4("drvReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = drvCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("drvCopied") : v4("drvCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, row.userId ? `customers/${row.userId}` : "customers")}>{v4("drvCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
