"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DOX_KEY,
  DOX_REVIEW_KEY,
  WFT_DENSITY_KEY,
  WFT_KEY,
  WFT_MODES,
  WFT_VIEW_KEY,
  addWolf,
  addWolfTag,
  addWolfView,
  briskWolf,
  bulkSelReview,
  bulkWolfCoffer,
  bulkWolfGraphite,
  bulkWolfRaise,
  bulkWolfTag,
  busiestKeeper,
  dropWolfView,
  editWolf,
  editWolfNote,
  doxBrief,
  doxCopy,
  doxDigit,
  doxEven,
  doxFamily,
  doxFirst,
  doxRoute,
  doxHeld,
  doxAway,
  doxHue,
  doxJoin,
  doxCitizen,
  doxLane,
  doxLanes,
  doxLanesCsv,
  doxLength,
  doxLetter,
  doxLower,
  doxMixed,
  doxOpen,
  doxRowsCsv,
  doxShare,
  doxSpace,
  doxStamp,
  doxTail,
  doxUpper,
  doxGuest,
  doxVowel,
  fairKeeper,
  finishFocused,
  wolfBars,
  wolfCopy,
  wolfCounts,
  wolfCsv,
  wolfDensity,
  wolfInner,
  wolfOuter,
  wolfTimeline,
  wolfKeepers,
  idleWolf,
  laneSelCount,
  lateWolf,
  leadingSel,
  leadingSelHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveWolfFocus,
  overdueWolf,
  pinWolfFocused,
  presentSelLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenSel,
  readWolfes,
  readWolfViews,
  readReviewedSel,
  reminderWolfes,
  restingWolf,
  setWolfCoffer,
  setWolfFilm,
  setWolfFocused,
  setWolfPin,
  setWolfRaised,
  setWolfStar,
  sortWolfes,
  starWolfFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleSel,
  toggleSelReview,
  visibleSel,
  visibleSelLanes,
  visibleWolfes,
  type DoxReview,
  type DoxRow,
  type DoxShape,
  type DoxValue,
  type Wolf,
  type WolfDensity,
  type WolfSort,
  type WolfTray,
  type WolfView,
} from "@/lib/crmv4/round364";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["4", "8", "16", "32"] as const;
const LOCKS = ["2", "5", "7"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  click: "wftClick",
  tooth: "wftTooth",
  pawl: "wftPawl",
  ratch: "wftRatch",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "wftAuditSave",
  edit: "wftAuditEdit",
  note: "wftAuditNote",
  film: "wftAuditFilm",
  poise: "wftAuditPoise",
  free: "wftAuditFree",
  peg: "wftAuditPeg",
  return: "wftAuditReturn",
  coffer: "wftAuditCoffer",
  open: "wftAuditOpen",
  tag: "wftAuditTag",
  lock: "wftAuditRate",
  drop: "wftAuditStep",
  lower: "wftAuditLower",
  star: "wftAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "doxLaneHall",
  vacant: "doxLaneVacant",
  hold: "doxLaneHold",
  desk: "doxLaneDesk",
  guest: "doxLaneGuest",
  join: "doxJoin",
  route: "doxRoute",
  brief: "doxBrief",
  long: "doxLong",
  stamp: "doxStampLane",
  vowel: "doxVowel",
  plain: "doxPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "doxChampagne",
  ivory: "doxIvory",
  graphite: "doxGraphite",
};

const SHAPE_KEY: Record<DoxShape, CrmV4CopyKey> = {
  all: "doxShapeAll",
  hall: "doxShapeHall",
  vacant: "doxShapeVacant",
  hold: "doxShapeHold",
  guest: "doxShapeGuest",
  join: "doxShapeJoin",
  route: "doxShapeRoute",
  brief: "doxShapeBrief",
  long: "doxShapeLong",
  stamp: "doxShapeStamp",
  vowel: "doxShapeVowel",
  plain: "doxShapePlain",
  open: "doxShapeOpen",
  soon: "doxShapeOpen",
  letter: "doxShapePlain",
  mixed: "doxShapeStamp",
  upper: "doxShapeUpper",
  lower: "doxShapePlain",
  space: "doxShapeSpace",
  even: "doxShapeEven",
  odd: "doxShapeEven",
  tail: "doxShapeStamp",
  first: "doxShapePlain",
  held: "doxShapeLong",
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
  return key ? v4(key) : v4("wftBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("wftGilt");
  if (film === "IVORY") return v4("wftIvory");
  if (film === "GRAPHITE") return v4("wftGraphite");
  return v4("wftAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("doxBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("doxBlank");
}

export function WolfRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Wolf[]>([]);
  const [views, setViews] = useState<WolfView[]>([]);
  const [density, setDensity] = useState<WolfDensity>("airy");
  const [tray, setTray] = useState<WolfTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<WolfSort>("piece");
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
  const [station, setStation] = useState("click");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readWolfes(readJson(WFT_KEY, [])));
    setViews(readWolfViews(readJson(WFT_VIEW_KEY, [])));
    setDensity(wolfDensity(readJson(WFT_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Wolf[]) {
    setCards(next);
    writeJson(WFT_KEY, next);
  }
  function storeViews(next: WolfView[]) {
    setViews(next);
    writeJson(WFT_VIEW_KEY, next);
  }
  function storeDensity(next: WolfDensity) {
    setDensity(next);
    writeJson(WFT_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortWolfes(visibleWolfes(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = wolfCounts(cards, shown, station);
  const bars = wolfBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = wolfTimeline(cards);
  const reminders = reminderWolfes(cards);
  const poisers = wolfKeepers(cards);
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
        download("wolf-rules.csv", wolfCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveWolfFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveWolfFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addWolf(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-wolf" aria-label={v4("wftTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-wolf-mast">
        <p className="c4-wolf-seal" data-logo="mono">{v4("wftLogo")}</p>
        <div>
          <p className="c4-wolf-kicker">{v4("wftSub")}</p>
          <h2 className="c4-title">{v4("wftTitle")}</h2>
        </div>
        <p className="c4-wolf-count">{shown.length}</p>
      </header>
      <p className="c4-wolf-links">
        <Link href={crmv4Href(base, "dox")}>{v4("doxTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("wftCustomers")}</Link>
      </p>
      <p className="c4-wolf-hint">{v4("wftHint")}</p>
      {viewer && <p className="c4-wolf-note">{v4("wftViewer")}</p>}
      <p className="c4-wolf-meta">{v4("wftFair")} {fair || "—"} · {v4("wftBusy")} {busy || "—"} · {v4("wftSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-wolf-index" aria-label={v4("wftRemind")}>
        <li data-tone="gold">{v4("wftOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("wftIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("wftBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("wftResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-wolf-remind c4-wolf-notices" role="status" aria-label={v4("wftRemind")}>
          {reminders.map((name) => <li key={name}>{v4("wftOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-wolf-chart" aria-label={v4("wftChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-wolf-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-wolf-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("wftEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("wftEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("wftNote")}<input className="c4-field" aria-label={v4("wftNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("wftSetter")}<input className="c4-field" aria-label={v4("wftSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("wftPiece")}<select className="c4-field" aria-label={v4("wftPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("wftBlankPiece")}</option>{WFT_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("wftFilm")}<select className="c4-field" aria-label={v4("wftFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("wftAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("wftDrop")}<select className="c4-field" aria-label={v4("wftDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("wftAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("wftLock")}<select className="c4-field" aria-label={v4("wftLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("wftAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("wftTag")}<input className="c4-field" aria-label={v4("wftTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("wftAdd")}</button>
      </form>
      <div className="c4-wolf-tools">
        <input ref={searchRef} className="c4-field c4-wolf-search" aria-label={v4("wftSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("wftSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "wftBoard" : item === "peg" ? "wftPeg" : "wftCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("wftInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("wftOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("wftSortSetter") : v4("wftSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("wftClose") : v4("wftAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("wftTimeline")}</button>
        <label className="c4-lab">{v4("wftDesk")}<select className="c4-field" aria-label={v4("wftDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{WFT_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-wolf-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addWolfView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("wftViewName")}<input className="c4-field" aria-label={v4("wftViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("wftSaveView")}</button>
      </form>
      <ul className="c4-wolf-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("wftApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropWolfView(views, view.id))}>{v4("wftDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-wolf-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkWolfRaise(cards, picked))}>{v4("wftBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkWolfCoffer(cards, picked))}>{v4("wftBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkWolfGraphite(cards, picked))}>{v4("wftBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkWolfTag(cards, picked))}>{v4("wftBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("wolf-rules.csv", wolfCsv(shown, station))}>{v4("wftCsv")}</button>
        <p className="c4-wolf-meta">{v4("wftKeys")} / n x a j k · {v4("wftQuiet")} {counts.quiet} · {v4("wftInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-wolf-time" aria-label={v4("wftTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("wftEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-wolf-list">
          {shown.map((card) => {
            const late = lateWolf(card, station);
            return (
              <li key={card.id} className="c4-wolf-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleWolf(card) ? "1" : "0"} data-brisk={briskWolf(card) ? "1" : "0"} data-overdue={overdueWolf(card) ? "1" : "0"} data-resting={restingWolf(card) ? "1" : "0"} data-inner={wolfInner(card.piece) ? "1" : "0"} data-outer={wolfOuter(card.piece) ? "1" : "0"}>
                <label className="c4-wolf-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editWolf(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("wftEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("wftApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editWolfNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("wftNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-wolf-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "wftAuditSave")}` : ""}{late ? ` · ${v4("wftOverdue")}` : ""}</p>
                </div>
                <div className="c4-wolf-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("wftEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWolfRaised(cards, card.id, !card.raised))}>{card.raised ? v4("wftFree") : v4("wftPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWolfFilm(cards, card.id, suggestedFilm))}>{v4("wftSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWolfPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("wftUnpeg") : v4("wftPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWolfCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("wftUncoffer") : v4("wftCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWolfStar(cards, card.id, !card.starred))}>{card.starred ? v4("wftUnstar") : v4("wftStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addWolfTag(cards, card.id, "k"))}>{v4("wftTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("wftRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("wftLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("wftLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("wftLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("wftFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWolfFocused(cards, card.id))}>{v4("wftPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinWolfFocused(cards, card.id))}>{v4("wftPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starWolfFocused(cards, card.id))}>{v4("wftStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(wolfCopy(card))}>{v4("wftCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type DoxUser = { id?: string; name?: string | null; documentsStatus?: string | boolean | null };

export function DocumentPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: DoxUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<DoxShape>("all");
  const [review, setReview] = useState<DoxReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): DoxRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { documentsStatus: row.documentsStatus === true || row.documentsStatus === false ? row.documentsStatus : textField(row.documentsStatus) } satisfies DoxValue,
    };
  }).filter((row): row is DoxRow => Boolean(row));
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
    const next = readHiddenSel(readJson(DOX_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(DOX_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSel(readJson(DOX_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(DOX_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSelLanes(present, hidden, showHidden);
  const shown = visibleSel(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = doxLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = doxLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSel(rows);
  const leadHue = leadingSelHue(rows);
  const whole = rows.filter((row) => doxLane(row.code)).length;
  const share = doxShare(laneSelCount(rows, "hall"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("documents.csv", doxLanesCsv(rows));
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
    writeJson(DOX_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(DOX_REVIEW_KEY, next);
  }

  return (
    <section className="c4-doxplate" aria-label={v4("doxTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-doxplate-mast">
        <p className="c4-doxplate-seal" data-logo="mono">{v4("doxLogo")}</p>
        <div>
          <p className="c4-doxplate-kicker">{v4("doxSub")}</p>
          <h2 className="c4-title">{v4("doxTitle")}</h2>
        </div>
        <p className="c4-doxplate-count">{shown.length}</p>
      </header>
      <p className="c4-doxplate-links">
        <Link href={crmv4Href(base, "wft")}>{v4("wftTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("doxCustomer")}</Link>
      </p>
      <p className="c4-doxplate-hint">{v4("doxHint")}</p>
      {viewer && <p className="c4-doxplate-note">{v4("doxViewer")}</p>}
      <p className="c4-doxplate-meta">{v4("doxLead")} {laneLabel(v4, lead)} · {v4("doxToneLead")} {hueLabel(v4, leadHue)} · {v4("doxShare")} {share}</p>
      <div className="c4-doxplate-chart" aria-label={v4("doxChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-doxplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-doxplate-tools">
        <input ref={searchRef} className="c4-field c4-doxplate-search" aria-label={v4("doxSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("doxSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("doxShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "doxAll" : item === "reviewed" ? "doxReviewed" : "doxFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("doxAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as DoxShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSel(hidden, item))}>{hidden.includes(item) ? v4("doxShow") : v4("doxHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-doxplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, true))}>{v4("doxBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, false))}>{v4("doxBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("document-lanes.csv", doxLanesCsv(rows))}>{v4("doxCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("document-rows.csv", doxRowsCsv(shown, reviewed))}>{v4("doxRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("doxLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("doxFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("doxEmpty")}</p>}
      <ul className="c4-doxplate-list">
        {shown.map((row) => {
          const name = doxCopy(row.code);
          const tone = doxHue(row.code);
          return (
            <li key={row.id} className="c4-doxplate-card" data-mail={doxLane(row.code) || "open"} data-hue={tone || "none"} data-home={doxLane(row.code) === "hall" ? "1" : "0"} data-away={doxAway(row.code) ? "1" : "0"} data-guest={doxGuest(row.code) ? "1" : "0"} data-citizen={doxCitizen(row.code) ? "1" : "0"} data-open={doxOpen(row.code) ? "1" : "0"} data-even={doxEven(row.code) ? "1" : "0"} data-digit={doxDigit(row.code) ? "1" : "0"} data-letter={doxLetter(row.code) ? "1" : "0"} data-mixed={doxMixed(row.code) ? "1" : "0"} data-upper={doxUpper(row.code) ? "1" : "0"} data-lower={doxLower(row.code) ? "1" : "0"} data-space={doxSpace(row.code) ? "1" : "0"} data-vowel={doxVowel(row.code) ? "1" : "0"} data-tail={doxTail(row.code) ? "1" : "0"} data-first={doxFirst(row.code) ? "1" : "0"} data-held={doxHeld(row.code) ? "1" : "0"} data-join={doxJoin(row.code) ? "1" : "0"} data-route={doxRoute(row.code) ? "1" : "0"} data-brief={doxBrief(row.code) ? "1" : "0"}>
              <label className="c4-doxplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-doxplate-meta">{name || v4("doxOpen")} · {doxStamp(row.code) || "—"} · {doxFamily(row.code) || "—"} · {doxLength(row.code) ?? "—"} · {laneLabel(v4, doxLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-doxplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSelReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("doxReviewed") : v4("doxReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = doxCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("doxCopied") : v4("doxCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("doxCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
