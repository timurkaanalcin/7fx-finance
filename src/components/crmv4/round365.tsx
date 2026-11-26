"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  SRV_KEY,
  SRV_REVIEW_KEY,
  MLX_DENSITY_KEY,
  MLX_KEY,
  MLX_MODES,
  MLX_VIEW_KEY,
  addMaltese,
  addMalteseTag,
  addMalteseView,
  briskMaltese,
  bulkSelReview,
  bulkMalteseCoffer,
  bulkMalteseGraphite,
  bulkMalteseRaise,
  bulkMalteseTag,
  busiestKeeper,
  dropMalteseView,
  editMaltese,
  editMalteseNote,
  srvBrief,
  srvCopy,
  srvDigit,
  srvEven,
  srvFamily,
  srvFirst,
  srvRoute,
  srvHeld,
  srvAway,
  srvHue,
  srvJoin,
  srvCitizen,
  srvLane,
  srvLanes,
  srvLanesCsv,
  srvLength,
  srvLetter,
  srvLower,
  srvMixed,
  srvOpen,
  srvRowsCsv,
  srvShare,
  srvSpace,
  srvStamp,
  srvTail,
  srvUpper,
  srvGuest,
  srvVowel,
  fairKeeper,
  finishFocused,
  malteseBars,
  malteseCopy,
  malteseCounts,
  malteseCsv,
  malteseDensity,
  malteseInner,
  malteseOuter,
  malteseTimeline,
  malteseKeepers,
  idleMaltese,
  laneSelCount,
  lateMaltese,
  leadingSel,
  leadingSelHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveMalteseFocus,
  overdueMaltese,
  pinMalteseFocused,
  presentSelLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenSel,
  readMalteseCards,
  readMalteseViews,
  readReviewedSel,
  reminderMalteseCards,
  restingMaltese,
  setMalteseCoffer,
  setMalteseFilm,
  setMalteseFocused,
  setMaltesePin,
  setMalteseRaised,
  setMalteseStar,
  sortMalteseCards,
  starMalteseFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleSel,
  toggleSelReview,
  visibleSel,
  visibleSelLanes,
  visibleMalteseCards,
  type SrvReview,
  type SrvRow,
  type SrvShape,
  type SrvValue,
  type Maltese,
  type MalteseDensity,
  type MalteseSort,
  type MalteseTray,
  type MalteseView,
} from "@/lib/crmv4/round365";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["4", "8", "16", "32"] as const;
const LOCKS = ["2", "5", "7"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  cross: "mlxCross",
  finger: "mlxFinger",
  beak: "mlxBeak",
  arbor: "mlxArbor",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "mlxAuditSave",
  edit: "mlxAuditEdit",
  note: "mlxAuditNote",
  film: "mlxAuditFilm",
  poise: "mlxAuditPoise",
  free: "mlxAuditFree",
  peg: "mlxAuditPeg",
  return: "mlxAuditReturn",
  coffer: "mlxAuditCoffer",
  open: "mlxAuditOpen",
  tag: "mlxAuditTag",
  lock: "mlxAuditRate",
  drop: "mlxAuditStep",
  lower: "mlxAuditLower",
  star: "mlxAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "srvLaneHall",
  vacant: "srvLaneVacant",
  hold: "srvLaneHold",
  desk: "srvLaneDesk",
  guest: "srvLaneGuest",
  join: "srvJoin",
  route: "srvRoute",
  brief: "srvBrief",
  long: "srvLong",
  stamp: "srvStampLane",
  vowel: "srvVowel",
  plain: "srvPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "srvChampagne",
  ivory: "srvIvory",
  graphite: "srvGraphite",
};

const SHAPE_KEY: Record<SrvShape, CrmV4CopyKey> = {
  all: "srvShapeAll",
  hall: "srvShapeHall",
  vacant: "srvShapeVacant",
  hold: "srvShapeHold",
  guest: "srvShapeGuest",
  join: "srvShapeJoin",
  route: "srvShapeRoute",
  brief: "srvShapeBrief",
  long: "srvShapeLong",
  stamp: "srvShapeStamp",
  vowel: "srvShapeVowel",
  plain: "srvShapePlain",
  open: "srvShapeOpen",
  soon: "srvShapeOpen",
  letter: "srvShapePlain",
  mixed: "srvShapeStamp",
  upper: "srvShapeUpper",
  lower: "srvShapePlain",
  space: "srvShapeSpace",
  even: "srvShapeEven",
  odd: "srvShapeEven",
  tail: "srvShapeStamp",
  first: "srvShapePlain",
  held: "srvShapeLong",
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
  return key ? v4(key) : v4("mlxBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("mlxGilt");
  if (film === "IVORY") return v4("mlxIvory");
  if (film === "GRAPHITE") return v4("mlxGraphite");
  return v4("mlxAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("srvBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("srvBlank");
}

export function MalteseRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Maltese[]>([]);
  const [views, setViews] = useState<MalteseView[]>([]);
  const [density, setDensity] = useState<MalteseDensity>("airy");
  const [tray, setTray] = useState<MalteseTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<MalteseSort>("piece");
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
  const [station, setStation] = useState("cross");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readMalteseCards(readJson(MLX_KEY, [])));
    setViews(readMalteseViews(readJson(MLX_VIEW_KEY, [])));
    setDensity(malteseDensity(readJson(MLX_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Maltese[]) {
    setCards(next);
    writeJson(MLX_KEY, next);
  }
  function storeViews(next: MalteseView[]) {
    setViews(next);
    writeJson(MLX_VIEW_KEY, next);
  }
  function storeDensity(next: MalteseDensity) {
    setDensity(next);
    writeJson(MLX_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortMalteseCards(visibleMalteseCards(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = malteseCounts(cards, shown, station);
  const bars = malteseBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = malteseTimeline(cards);
  const reminders = reminderMalteseCards(cards);
  const poisers = malteseKeepers(cards);
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
        download("maltese-rules.csv", malteseCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveMalteseFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveMalteseFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addMaltese(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-maltese" aria-label={v4("mlxTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-maltese-mast">
        <p className="c4-maltese-seal" data-logo="mono">{v4("mlxLogo")}</p>
        <div>
          <p className="c4-maltese-kicker">{v4("mlxSub")}</p>
          <h2 className="c4-title">{v4("mlxTitle")}</h2>
        </div>
        <p className="c4-maltese-count">{shown.length}</p>
      </header>
      <p className="c4-maltese-links">
        <Link href={crmv4Href(base, "srv")}>{v4("srvTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("mlxCustomers")}</Link>
      </p>
      <p className="c4-maltese-hint">{v4("mlxHint")}</p>
      {viewer && <p className="c4-maltese-note">{v4("mlxViewer")}</p>}
      <p className="c4-maltese-meta">{v4("mlxFair")} {fair || "—"} · {v4("mlxBusy")} {busy || "—"} · {v4("mlxSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-maltese-index" aria-label={v4("mlxRemind")}>
        <li data-tone="gold">{v4("mlxOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("mlxIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("mlxBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("mlxResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-maltese-remind c4-maltese-notices" role="status" aria-label={v4("mlxRemind")}>
          {reminders.map((name) => <li key={name}>{v4("mlxOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-maltese-chart" aria-label={v4("mlxChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-maltese-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-maltese-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("mlxEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("mlxEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("mlxNote")}<input className="c4-field" aria-label={v4("mlxNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("mlxSetter")}<input className="c4-field" aria-label={v4("mlxSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("mlxPiece")}<select className="c4-field" aria-label={v4("mlxPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("mlxBlankPiece")}</option>{MLX_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("mlxFilm")}<select className="c4-field" aria-label={v4("mlxFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("mlxAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("mlxDrop")}<select className="c4-field" aria-label={v4("mlxDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("mlxAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("mlxLock")}<select className="c4-field" aria-label={v4("mlxLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("mlxAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("mlxTag")}<input className="c4-field" aria-label={v4("mlxTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("mlxAdd")}</button>
      </form>
      <div className="c4-maltese-tools">
        <input ref={searchRef} className="c4-field c4-maltese-search" aria-label={v4("mlxSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("mlxSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "mlxBoard" : item === "peg" ? "mlxPeg" : "mlxCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("mlxInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("mlxOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("mlxSortSetter") : v4("mlxSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("mlxClose") : v4("mlxAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("mlxTimeline")}</button>
        <label className="c4-lab">{v4("mlxDesk")}<select className="c4-field" aria-label={v4("mlxDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{MLX_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-maltese-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addMalteseView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("mlxViewName")}<input className="c4-field" aria-label={v4("mlxViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("mlxSaveView")}</button>
      </form>
      <ul className="c4-maltese-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("mlxApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropMalteseView(views, view.id))}>{v4("mlxDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-maltese-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMalteseRaise(cards, picked))}>{v4("mlxBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMalteseCoffer(cards, picked))}>{v4("mlxBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMalteseGraphite(cards, picked))}>{v4("mlxBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMalteseTag(cards, picked))}>{v4("mlxBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("maltese-rules.csv", malteseCsv(shown, station))}>{v4("mlxCsv")}</button>
        <p className="c4-maltese-meta">{v4("mlxKeys")} / n x a j k · {v4("mlxQuiet")} {counts.quiet} · {v4("mlxInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-maltese-time" aria-label={v4("mlxTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("mlxEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-maltese-list">
          {shown.map((card) => {
            const late = lateMaltese(card, station);
            return (
              <li key={card.id} className="c4-maltese-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleMaltese(card) ? "1" : "0"} data-brisk={briskMaltese(card) ? "1" : "0"} data-overdue={overdueMaltese(card) ? "1" : "0"} data-resting={restingMaltese(card) ? "1" : "0"} data-inner={malteseInner(card.piece) ? "1" : "0"} data-outer={malteseOuter(card.piece) ? "1" : "0"}>
                <label className="c4-maltese-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editMaltese(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("mlxEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("mlxApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editMalteseNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("mlxNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-maltese-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "mlxAuditSave")}` : ""}{late ? ` · ${v4("mlxOverdue")}` : ""}</p>
                </div>
                <div className="c4-maltese-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("mlxEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMalteseRaised(cards, card.id, !card.raised))}>{card.raised ? v4("mlxFree") : v4("mlxPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMalteseFilm(cards, card.id, suggestedFilm))}>{v4("mlxSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMaltesePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("mlxUnpeg") : v4("mlxPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMalteseCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("mlxUncoffer") : v4("mlxCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMalteseStar(cards, card.id, !card.starred))}>{card.starred ? v4("mlxUnstar") : v4("mlxStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addMalteseTag(cards, card.id, "k"))}>{v4("mlxTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("mlxRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("mlxLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("mlxLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("mlxLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("mlxFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMalteseFocused(cards, card.id))}>{v4("mlxPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinMalteseFocused(cards, card.id))}>{v4("mlxPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starMalteseFocused(cards, card.id))}>{v4("mlxStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(malteseCopy(card))}>{v4("mlxCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type SrvUser = { id?: string; name?: string | null; tradingServer?: string | boolean | null };

export function TradingServerPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: SrvUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<SrvShape>("all");
  const [review, setReview] = useState<SrvReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): SrvRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { tradingServer: row.tradingServer === true || row.tradingServer === false ? row.tradingServer : textField(row.tradingServer) } satisfies SrvValue,
    };
  }).filter((row): row is SrvRow => Boolean(row));
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
    const next = readHiddenSel(readJson(SRV_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(SRV_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSel(readJson(SRV_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(SRV_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSelLanes(present, hidden, showHidden);
  const shown = visibleSel(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = srvLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = srvLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSel(rows);
  const leadHue = leadingSelHue(rows);
  const whole = rows.filter((row) => srvLane(row.code)).length;
  const share = srvShare(laneSelCount(rows, "hall"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("servers.csv", srvLanesCsv(rows));
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
    writeJson(SRV_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(SRV_REVIEW_KEY, next);
  }

  return (
    <section className="c4-srvplate" aria-label={v4("srvTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-srvplate-mast">
        <p className="c4-srvplate-seal" data-logo="mono">{v4("srvLogo")}</p>
        <div>
          <p className="c4-srvplate-kicker">{v4("srvSub")}</p>
          <h2 className="c4-title">{v4("srvTitle")}</h2>
        </div>
        <p className="c4-srvplate-count">{shown.length}</p>
      </header>
      <p className="c4-srvplate-links">
        <Link href={crmv4Href(base, "mlx")}>{v4("mlxTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("srvCustomer")}</Link>
      </p>
      <p className="c4-srvplate-hint">{v4("srvHint")}</p>
      {viewer && <p className="c4-srvplate-note">{v4("srvViewer")}</p>}
      <p className="c4-srvplate-meta">{v4("srvLead")} {laneLabel(v4, lead)} · {v4("srvToneLead")} {hueLabel(v4, leadHue)} · {v4("srvShare")} {share}</p>
      <div className="c4-srvplate-chart" aria-label={v4("srvChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-srvplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-srvplate-tools">
        <input ref={searchRef} className="c4-field c4-srvplate-search" aria-label={v4("srvSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("srvSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("srvShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "srvAll" : item === "reviewed" ? "srvReviewed" : "srvFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("srvAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as SrvShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSel(hidden, item))}>{hidden.includes(item) ? v4("srvShow") : v4("srvHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-srvplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, true))}>{v4("srvBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, false))}>{v4("srvBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("document-lanes.csv", srvLanesCsv(rows))}>{v4("srvCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("document-rows.csv", srvRowsCsv(shown, reviewed))}>{v4("srvRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("srvLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("srvFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("srvEmpty")}</p>}
      <ul className="c4-srvplate-list">
        {shown.map((row) => {
          const name = srvCopy(row.code);
          const tone = srvHue(row.code);
          return (
            <li key={row.id} className="c4-srvplate-card" data-mail={srvLane(row.code) || "open"} data-hue={tone || "none"} data-home={srvLane(row.code) === "hall" ? "1" : "0"} data-away={srvAway(row.code) ? "1" : "0"} data-guest={srvGuest(row.code) ? "1" : "0"} data-citizen={srvCitizen(row.code) ? "1" : "0"} data-open={srvOpen(row.code) ? "1" : "0"} data-even={srvEven(row.code) ? "1" : "0"} data-digit={srvDigit(row.code) ? "1" : "0"} data-letter={srvLetter(row.code) ? "1" : "0"} data-mixed={srvMixed(row.code) ? "1" : "0"} data-upper={srvUpper(row.code) ? "1" : "0"} data-lower={srvLower(row.code) ? "1" : "0"} data-space={srvSpace(row.code) ? "1" : "0"} data-vowel={srvVowel(row.code) ? "1" : "0"} data-tail={srvTail(row.code) ? "1" : "0"} data-first={srvFirst(row.code) ? "1" : "0"} data-held={srvHeld(row.code) ? "1" : "0"} data-join={srvJoin(row.code) ? "1" : "0"} data-route={srvRoute(row.code) ? "1" : "0"} data-brief={srvBrief(row.code) ? "1" : "0"}>
              <label className="c4-srvplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-srvplate-meta">{name || v4("srvOpen")} · {srvStamp(row.code) || "—"} · {srvFamily(row.code) || "—"} · {srvLength(row.code) ?? "—"} · {laneLabel(v4, srvLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-srvplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSelReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("srvReviewed") : v4("srvReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = srvCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("srvCopied") : v4("srvCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("srvCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
