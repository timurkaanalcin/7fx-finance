"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  PTS_KEY,
  PTS_REVIEW_KEY,
  GVS_DENSITY_KEY,
  GVS_KEY,
  GVS_MODES,
  GVS_VIEW_KEY,
  addGeneva,
  addGenevaTag,
  addGenevaView,
  briskGeneva,
  bulkSelReview,
  bulkGenevaCoffer,
  bulkGenevaGraphite,
  bulkGenevaRaise,
  bulkGenevaTag,
  busiestKeeper,
  dropGenevaView,
  editGeneva,
  editGenevaNote,
  ptsBrief,
  ptsCopy,
  ptsDigit,
  ptsEven,
  ptsFamily,
  ptsFirst,
  ptsRoute,
  ptsHeld,
  ptsAway,
  ptsHue,
  ptsJoin,
  ptsCitizen,
  ptsLane,
  ptsLanes,
  ptsLanesCsv,
  ptsLength,
  ptsLetter,
  ptsLower,
  ptsMixed,
  ptsOpen,
  ptsRowsCsv,
  ptsShare,
  ptsSpace,
  ptsStamp,
  ptsTail,
  ptsUpper,
  ptsGuest,
  ptsVowel,
  fairKeeper,
  finishFocused,
  genevaBars,
  genevaCopy,
  genevaCounts,
  genevaCsv,
  genevaDensity,
  genevaInner,
  genevaOuter,
  genevaTimeline,
  genevaKeepers,
  idleGeneva,
  laneSelCount,
  lateGeneva,
  leadingSel,
  leadingSelHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveGenevaFocus,
  overdueGeneva,
  pinGenevaFocused,
  presentSelLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenSel,
  readGenevas,
  readGenevaViews,
  readReviewedSel,
  reminderGenevas,
  restingGeneva,
  setGenevaCoffer,
  setGenevaFilm,
  setGenevaFocused,
  setGenevaPin,
  setGenevaRaised,
  setGenevaStar,
  sortGenevas,
  starGenevaFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleSel,
  toggleSelReview,
  visibleSel,
  visibleSelLanes,
  visibleGenevas,
  type PtsReview,
  type PtsRow,
  type PtsShape,
  type PtsValue,
  type Geneva,
  type GenevaDensity,
  type GenevaSort,
  type GenevaTray,
  type GenevaView,
} from "@/lib/crmv4/round357";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["6", "12", "24", "48"] as const;
const LOCKS = ["4", "8", "16"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  straight: "gvsCloud",
  circular: "gvsWave",
  wavy: "gvsSun",
  broken: "gvsRing",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "gvsAuditSave",
  edit: "gvsAuditEdit",
  note: "gvsAuditNote",
  film: "gvsAuditFilm",
  poise: "gvsAuditPoise",
  free: "gvsAuditFree",
  peg: "gvsAuditPeg",
  return: "gvsAuditReturn",
  coffer: "gvsAuditCoffer",
  open: "gvsAuditOpen",
  tag: "gvsAuditTag",
  lock: "gvsAuditRate",
  drop: "gvsAuditStep",
  lower: "gvsAuditLower",
  star: "gvsAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  home: "ptsLaneHome",
  vacant: "ptsLaneVacant",
  hold: "ptsLaneHold",
  desk: "ptsLaneDesk",
  guest: "ptsLaneGuest",
  join: "ptsJoin",
  route: "ptsRoute",
  brief: "ptsBrief",
  long: "ptsLong",
  stamp: "ptsStampLane",
  vowel: "ptsVowel",
  plain: "ptsPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "ptsChampagne",
  ivory: "ptsIvory",
  graphite: "ptsGraphite",
};

const SHAPE_KEY: Record<PtsShape, CrmV4CopyKey> = {
  all: "ptsShapeAll",
  home: "ptsShapeHome",
  vacant: "ptsShapeVacant",
  hold: "ptsShapeHold",
  guest: "ptsShapeGuest",
  join: "ptsShapeJoin",
  route: "ptsShapeRoute",
  brief: "ptsShapeBrief",
  long: "ptsShapeLong",
  stamp: "ptsShapeStamp",
  vowel: "ptsShapeVowel",
  plain: "ptsShapePlain",
  open: "ptsShapeOpen",
  soon: "ptsShapeOpen",
  letter: "ptsShapePlain",
  mixed: "ptsShapeStamp",
  upper: "ptsShapeUpper",
  lower: "ptsShapePlain",
  space: "ptsShapeSpace",
  even: "ptsShapeEven",
  odd: "ptsShapeEven",
  tail: "ptsShapeStamp",
  first: "ptsShapePlain",
  held: "ptsShapeLong",
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
  return key ? v4(key) : v4("gvsBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("gvsGilt");
  if (film === "IVORY") return v4("gvsIvory");
  if (film === "GRAPHITE") return v4("gvsGraphite");
  return v4("gvsAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("ptsBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("ptsBlank");
}

export function GenevaRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Geneva[]>([]);
  const [views, setViews] = useState<GenevaView[]>([]);
  const [density, setDensity] = useState<GenevaDensity>("airy");
  const [tray, setTray] = useState<GenevaTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<GenevaSort>("piece");
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
  const [station, setStation] = useState("straight");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readGenevas(readJson(GVS_KEY, [])));
    setViews(readGenevaViews(readJson(GVS_VIEW_KEY, [])));
    setDensity(genevaDensity(readJson(GVS_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Geneva[]) {
    setCards(next);
    writeJson(GVS_KEY, next);
  }
  function storeViews(next: GenevaView[]) {
    setViews(next);
    writeJson(GVS_VIEW_KEY, next);
  }
  function storeDensity(next: GenevaDensity) {
    setDensity(next);
    writeJson(GVS_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortGenevas(visibleGenevas(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = genevaCounts(cards, shown, station);
  const bars = genevaBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = genevaTimeline(cards);
  const reminders = reminderGenevas(cards);
  const poisers = genevaKeepers(cards);
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
        download("geneva-stripes.csv", genevaCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveGenevaFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveGenevaFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addGeneva(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-geneva" aria-label={v4("gvsTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-geneva-mast">
        <p className="c4-geneva-seal" data-logo="mono">{v4("gvsLogo")}</p>
        <div>
          <p className="c4-geneva-kicker">{v4("gvsSub")}</p>
          <h2 className="c4-title">{v4("gvsTitle")}</h2>
        </div>
        <p className="c4-geneva-count">{shown.length}</p>
      </header>
      <p className="c4-geneva-links">
        <Link href={crmv4Href(base, "pts")}>{v4("ptsTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("gvsCustomers")}</Link>
      </p>
      <p className="c4-geneva-hint">{v4("gvsHint")}</p>
      {viewer && <p className="c4-geneva-note">{v4("gvsViewer")}</p>}
      <p className="c4-geneva-meta">{v4("gvsFair")} {fair || "—"} · {v4("gvsBusy")} {busy || "—"} · {v4("gvsSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-geneva-index" aria-label={v4("gvsRemind")}>
        <li data-tone="gold">{v4("gvsOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("gvsIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("gvsBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("gvsResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-geneva-remind c4-geneva-notices" role="status" aria-label={v4("gvsRemind")}>
          {reminders.map((name) => <li key={name}>{v4("gvsOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-geneva-chart" aria-label={v4("gvsChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-geneva-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-geneva-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("gvsEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("gvsEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("gvsNote")}<input className="c4-field" aria-label={v4("gvsNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("gvsSetter")}<input className="c4-field" aria-label={v4("gvsSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("gvsPiece")}<select className="c4-field" aria-label={v4("gvsPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("gvsBlankPiece")}</option>{GVS_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("gvsFilm")}<select className="c4-field" aria-label={v4("gvsFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("gvsAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("gvsDrop")}<select className="c4-field" aria-label={v4("gvsDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("gvsAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("gvsLock")}<select className="c4-field" aria-label={v4("gvsLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("gvsAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("gvsTag")}<input className="c4-field" aria-label={v4("gvsTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("gvsAdd")}</button>
      </form>
      <div className="c4-geneva-tools">
        <input ref={searchRef} className="c4-field c4-geneva-search" aria-label={v4("gvsSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("gvsSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "gvsBoard" : item === "peg" ? "gvsPeg" : "gvsCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("gvsInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("gvsOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("gvsSortSetter") : v4("gvsSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("gvsClose") : v4("gvsAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("gvsTimeline")}</button>
        <label className="c4-lab">{v4("gvsDesk")}<select className="c4-field" aria-label={v4("gvsDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{GVS_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-geneva-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addGenevaView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("gvsViewName")}<input className="c4-field" aria-label={v4("gvsViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("gvsSaveView")}</button>
      </form>
      <ul className="c4-geneva-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("gvsApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropGenevaView(views, view.id))}>{v4("gvsDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-geneva-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGenevaRaise(cards, picked))}>{v4("gvsBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGenevaCoffer(cards, picked))}>{v4("gvsBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGenevaGraphite(cards, picked))}>{v4("gvsBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGenevaTag(cards, picked))}>{v4("gvsBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("geneva-stripes.csv", genevaCsv(shown, station))}>{v4("gvsCsv")}</button>
        <p className="c4-geneva-meta">{v4("gvsKeys")} / n x a j k · {v4("gvsQuiet")} {counts.quiet} · {v4("gvsInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-geneva-time" aria-label={v4("gvsTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("gvsEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-geneva-list">
          {shown.map((card) => {
            const late = lateGeneva(card, station);
            return (
              <li key={card.id} className="c4-geneva-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleGeneva(card) ? "1" : "0"} data-brisk={briskGeneva(card) ? "1" : "0"} data-overdue={overdueGeneva(card) ? "1" : "0"} data-resting={restingGeneva(card) ? "1" : "0"} data-inner={genevaInner(card.piece) ? "1" : "0"} data-outer={genevaOuter(card.piece) ? "1" : "0"}>
                <label className="c4-geneva-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editGeneva(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("gvsEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("gvsApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editGenevaNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("gvsNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-geneva-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "gvsAuditSave")}` : ""}{late ? ` · ${v4("gvsOverdue")}` : ""}</p>
                </div>
                <div className="c4-geneva-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("gvsEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGenevaRaised(cards, card.id, !card.raised))}>{card.raised ? v4("gvsFree") : v4("gvsPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGenevaFilm(cards, card.id, suggestedFilm))}>{v4("gvsSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGenevaPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("gvsUnpeg") : v4("gvsPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGenevaCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("gvsUncoffer") : v4("gvsCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGenevaStar(cards, card.id, !card.starred))}>{card.starred ? v4("gvsUnstar") : v4("gvsStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addGenevaTag(cards, card.id, "s"))}>{v4("gvsTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("gvsRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("gvsLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("gvsLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("gvsLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("gvsFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGenevaFocused(cards, card.id))}>{v4("gvsPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinGenevaFocused(cards, card.id))}>{v4("gvsPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starGenevaFocused(cards, card.id))}>{v4("gvsStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(genevaCopy(card))}>{v4("gvsCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type PtsUser = { id?: string; name?: string | null; potentialStatus?: string | boolean | null };

export function GradePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: PtsUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<PtsShape>("all");
  const [review, setReview] = useState<PtsReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): PtsRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { potentialStatus: row.potentialStatus === true || row.potentialStatus === false ? row.potentialStatus : textField(row.potentialStatus) } satisfies PtsValue,
    };
  }).filter((row): row is PtsRow => Boolean(row));
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
    const next = readHiddenSel(readJson(PTS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(PTS_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSel(readJson(PTS_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(PTS_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSelLanes(present, hidden, showHidden);
  const shown = visibleSel(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = ptsLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = ptsLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSel(rows);
  const leadHue = leadingSelHue(rows);
  const whole = rows.filter((row) => ptsLane(row.code)).length;
  const share = ptsShare(laneSelCount(rows, "home"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("potential-grades.csv", ptsLanesCsv(rows));
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
    writeJson(PTS_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(PTS_REVIEW_KEY, next);
  }

  return (
    <section className="c4-ptsplate" aria-label={v4("ptsTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-ptsplate-mast">
        <p className="c4-ptsplate-seal" data-logo="mono">{v4("ptsLogo")}</p>
        <div>
          <p className="c4-ptsplate-kicker">{v4("ptsSub")}</p>
          <h2 className="c4-title">{v4("ptsTitle")}</h2>
        </div>
        <p className="c4-ptsplate-count">{shown.length}</p>
      </header>
      <p className="c4-ptsplate-links">
        <Link href={crmv4Href(base, "gvs")}>{v4("gvsTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ptsCustomer")}</Link>
      </p>
      <p className="c4-ptsplate-hint">{v4("ptsHint")}</p>
      {viewer && <p className="c4-ptsplate-note">{v4("ptsViewer")}</p>}
      <p className="c4-ptsplate-meta">{v4("ptsLead")} {laneLabel(v4, lead)} · {v4("ptsToneLead")} {hueLabel(v4, leadHue)} · {v4("ptsShare")} {share}</p>
      <div className="c4-ptsplate-chart" aria-label={v4("ptsChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-ptsplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-ptsplate-tools">
        <input ref={searchRef} className="c4-field c4-ptsplate-search" aria-label={v4("ptsSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ptsSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("ptsShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "ptsAll" : item === "reviewed" ? "ptsReviewed" : "ptsFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("ptsAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as PtsShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSel(hidden, item))}>{hidden.includes(item) ? v4("ptsShow") : v4("ptsHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-ptsplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, true))}>{v4("ptsBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, false))}>{v4("ptsBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("potential-lanes.csv", ptsLanesCsv(rows))}>{v4("ptsCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("potential-rows.csv", ptsRowsCsv(shown, reviewed))}>{v4("ptsRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("ptsLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("ptsFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("ptsEmpty")}</p>}
      <ul className="c4-ptsplate-list">
        {shown.map((row) => {
          const name = ptsCopy(row.code);
          const tone = ptsHue(row.code);
          return (
            <li key={row.id} className="c4-ptsplate-card" data-mail={ptsLane(row.code) || "open"} data-hue={tone || "none"} data-home={ptsLane(row.code) === "home" ? "1" : "0"} data-away={ptsAway(row.code) ? "1" : "0"} data-guest={ptsGuest(row.code) ? "1" : "0"} data-citizen={ptsCitizen(row.code) ? "1" : "0"} data-open={ptsOpen(row.code) ? "1" : "0"} data-even={ptsEven(row.code) ? "1" : "0"} data-digit={ptsDigit(row.code) ? "1" : "0"} data-letter={ptsLetter(row.code) ? "1" : "0"} data-mixed={ptsMixed(row.code) ? "1" : "0"} data-upper={ptsUpper(row.code) ? "1" : "0"} data-lower={ptsLower(row.code) ? "1" : "0"} data-space={ptsSpace(row.code) ? "1" : "0"} data-vowel={ptsVowel(row.code) ? "1" : "0"} data-tail={ptsTail(row.code) ? "1" : "0"} data-first={ptsFirst(row.code) ? "1" : "0"} data-held={ptsHeld(row.code) ? "1" : "0"} data-join={ptsJoin(row.code) ? "1" : "0"} data-route={ptsRoute(row.code) ? "1" : "0"} data-brief={ptsBrief(row.code) ? "1" : "0"}>
              <label className="c4-ptsplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-ptsplate-meta">{name || v4("ptsOpen")} · {ptsStamp(row.code) || "—"} · {ptsFamily(row.code) || "—"} · {ptsLength(row.code) ?? "—"} · {laneLabel(v4, ptsLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-ptsplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSelReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("ptsReviewed") : v4("ptsReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = ptsCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("ptsCopied") : v4("ptsCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("ptsCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
