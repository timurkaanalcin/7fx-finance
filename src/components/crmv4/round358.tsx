"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  VST_KEY,
  VST_REVIEW_KEY,
  SBR_DENSITY_KEY,
  SBR_KEY,
  SBR_MODES,
  SBR_VIEW_KEY,
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
  vstBrief,
  vstCopy,
  vstDigit,
  vstEven,
  vstFamily,
  vstFirst,
  vstRoute,
  vstHeld,
  vstAway,
  vstHue,
  vstJoin,
  vstCitizen,
  vstLane,
  vstLanes,
  vstLanesCsv,
  vstLength,
  vstLetter,
  vstLower,
  vstMixed,
  vstOpen,
  vstRowsCsv,
  vstShare,
  vstSpace,
  vstStamp,
  vstTail,
  vstUpper,
  vstGuest,
  vstVowel,
  fairKeeper,
  finishFocused,
  soleilBars,
  soleilCopy,
  soleilCounts,
  soleilCsv,
  soleilDensity,
  soleilInner,
  soleilOuter,
  soleilTimeline,
  soleilKeepers,
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
  type VstReview,
  type VstRow,
  type VstShape,
  type VstValue,
  type Soleil,
  type SoleilDensity,
  type SoleilSort,
  type SoleilTray,
  type SoleilView,
} from "@/lib/crmv4/round358";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["6", "12", "24", "48"] as const;
const LOCKS = ["4", "8", "16"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  radial: "sbrCloud",
  basket: "sbrWave",
  flame: "sbrSun",
  sector: "sbrRing",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "sbrAuditSave",
  edit: "sbrAuditEdit",
  note: "sbrAuditNote",
  film: "sbrAuditFilm",
  poise: "sbrAuditPoise",
  free: "sbrAuditFree",
  peg: "sbrAuditPeg",
  return: "sbrAuditReturn",
  coffer: "sbrAuditCoffer",
  open: "sbrAuditOpen",
  tag: "sbrAuditTag",
  lock: "sbrAuditRate",
  drop: "sbrAuditStep",
  lower: "sbrAuditLower",
  star: "sbrAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "vstLaneHall",
  vacant: "vstLaneVacant",
  hold: "vstLaneHold",
  desk: "vstLaneDesk",
  guest: "vstLaneGuest",
  join: "vstJoin",
  route: "vstRoute",
  brief: "vstBrief",
  long: "vstLong",
  stamp: "vstStampLane",
  vowel: "vstVowel",
  plain: "vstPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "vstChampagne",
  ivory: "vstIvory",
  graphite: "vstGraphite",
};

const SHAPE_KEY: Record<VstShape, CrmV4CopyKey> = {
  all: "vstShapeAll",
  hall: "vstShapeHall",
  vacant: "vstShapeVacant",
  hold: "vstShapeHold",
  guest: "vstShapeGuest",
  join: "vstShapeJoin",
  route: "vstShapeRoute",
  brief: "vstShapeBrief",
  long: "vstShapeLong",
  stamp: "vstShapeStamp",
  vowel: "vstShapeVowel",
  plain: "vstShapePlain",
  open: "vstShapeOpen",
  soon: "vstShapeOpen",
  letter: "vstShapePlain",
  mixed: "vstShapeStamp",
  upper: "vstShapeUpper",
  lower: "vstShapePlain",
  space: "vstShapeSpace",
  even: "vstShapeEven",
  odd: "vstShapeEven",
  tail: "vstShapeStamp",
  first: "vstShapePlain",
  held: "vstShapeLong",
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
  return key ? v4(key) : v4("sbrBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("sbrGilt");
  if (film === "IVORY") return v4("sbrIvory");
  if (film === "GRAPHITE") return v4("sbrGraphite");
  return v4("sbrAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("vstBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("vstBlank");
}

export function SoleilRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Soleil[]>([]);
  const [views, setViews] = useState<SoleilView[]>([]);
  const [density, setDensity] = useState<SoleilDensity>("airy");
  const [tray, setTray] = useState<SoleilTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<SoleilSort>("piece");
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
  const [station, setStation] = useState("radial");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readGenevas(readJson(SBR_KEY, [])));
    setViews(readGenevaViews(readJson(SBR_VIEW_KEY, [])));
    setDensity(soleilDensity(readJson(SBR_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Soleil[]) {
    setCards(next);
    writeJson(SBR_KEY, next);
  }
  function storeViews(next: SoleilView[]) {
    setViews(next);
    writeJson(SBR_VIEW_KEY, next);
  }
  function storeDensity(next: SoleilDensity) {
    setDensity(next);
    writeJson(SBR_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortGenevas(visibleGenevas(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = soleilCounts(cards, shown, station);
  const bars = soleilBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = soleilTimeline(cards);
  const reminders = reminderGenevas(cards);
  const poisers = soleilKeepers(cards);
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
        download("soleil-rays.csv", soleilCsv(shown, station));
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
    <section className="c4-soleil" aria-label={v4("sbrTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-soleil-mast">
        <p className="c4-soleil-seal" data-logo="mono">{v4("sbrLogo")}</p>
        <div>
          <p className="c4-soleil-kicker">{v4("sbrSub")}</p>
          <h2 className="c4-title">{v4("sbrTitle")}</h2>
        </div>
        <p className="c4-soleil-count">{shown.length}</p>
      </header>
      <p className="c4-soleil-links">
        <Link href={crmv4Href(base, "vst")}>{v4("vstTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("sbrCustomers")}</Link>
      </p>
      <p className="c4-soleil-hint">{v4("sbrHint")}</p>
      {viewer && <p className="c4-soleil-note">{v4("sbrViewer")}</p>}
      <p className="c4-soleil-meta">{v4("sbrFair")} {fair || "—"} · {v4("sbrBusy")} {busy || "—"} · {v4("sbrSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-soleil-index" aria-label={v4("sbrRemind")}>
        <li data-tone="gold">{v4("sbrOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("sbrIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("sbrBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("sbrResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-soleil-remind c4-soleil-notices" role="status" aria-label={v4("sbrRemind")}>
          {reminders.map((name) => <li key={name}>{v4("sbrOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-soleil-chart" aria-label={v4("sbrChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-soleil-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-soleil-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("sbrEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("sbrEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("sbrNote")}<input className="c4-field" aria-label={v4("sbrNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("sbrSetter")}<input className="c4-field" aria-label={v4("sbrSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("sbrPiece")}<select className="c4-field" aria-label={v4("sbrPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("sbrBlankPiece")}</option>{SBR_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("sbrFilm")}<select className="c4-field" aria-label={v4("sbrFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("sbrAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("sbrDrop")}<select className="c4-field" aria-label={v4("sbrDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("sbrAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("sbrLock")}<select className="c4-field" aria-label={v4("sbrLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("sbrAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("sbrTag")}<input className="c4-field" aria-label={v4("sbrTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("sbrAdd")}</button>
      </form>
      <div className="c4-soleil-tools">
        <input ref={searchRef} className="c4-field c4-soleil-search" aria-label={v4("sbrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("sbrSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "sbrBoard" : item === "peg" ? "sbrPeg" : "sbrCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("sbrInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("sbrOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("sbrSortSetter") : v4("sbrSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("sbrClose") : v4("sbrAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("sbrTimeline")}</button>
        <label className="c4-lab">{v4("sbrDesk")}<select className="c4-field" aria-label={v4("sbrDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{SBR_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-soleil-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addGenevaView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("sbrViewName")}<input className="c4-field" aria-label={v4("sbrViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("sbrSaveView")}</button>
      </form>
      <ul className="c4-soleil-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("sbrApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropGenevaView(views, view.id))}>{v4("sbrDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-soleil-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGenevaRaise(cards, picked))}>{v4("sbrBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGenevaCoffer(cards, picked))}>{v4("sbrBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGenevaGraphite(cards, picked))}>{v4("sbrBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGenevaTag(cards, picked))}>{v4("sbrBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("soleil-rays.csv", soleilCsv(shown, station))}>{v4("sbrCsv")}</button>
        <p className="c4-soleil-meta">{v4("sbrKeys")} / n x a j k · {v4("sbrQuiet")} {counts.quiet} · {v4("sbrInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-soleil-time" aria-label={v4("sbrTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("sbrEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-soleil-list">
          {shown.map((card) => {
            const late = lateGeneva(card, station);
            return (
              <li key={card.id} className="c4-soleil-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleGeneva(card) ? "1" : "0"} data-brisk={briskGeneva(card) ? "1" : "0"} data-overdue={overdueGeneva(card) ? "1" : "0"} data-resting={restingGeneva(card) ? "1" : "0"} data-inner={soleilInner(card.piece) ? "1" : "0"} data-outer={soleilOuter(card.piece) ? "1" : "0"}>
                <label className="c4-soleil-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editGeneva(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("sbrEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("sbrApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editGenevaNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("sbrNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-soleil-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "sbrAuditSave")}` : ""}{late ? ` · ${v4("sbrOverdue")}` : ""}</p>
                </div>
                <div className="c4-soleil-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("sbrEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGenevaRaised(cards, card.id, !card.raised))}>{card.raised ? v4("sbrFree") : v4("sbrPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGenevaFilm(cards, card.id, suggestedFilm))}>{v4("sbrSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGenevaPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("sbrUnpeg") : v4("sbrPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGenevaCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("sbrUncoffer") : v4("sbrCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGenevaStar(cards, card.id, !card.starred))}>{card.starred ? v4("sbrUnstar") : v4("sbrStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addGenevaTag(cards, card.id, "r"))}>{v4("sbrTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("sbrRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("sbrLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("sbrLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("sbrLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("sbrFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGenevaFocused(cards, card.id))}>{v4("sbrPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinGenevaFocused(cards, card.id))}>{v4("sbrPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starGenevaFocused(cards, card.id))}>{v4("sbrStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(soleilCopy(card))}>{v4("sbrCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type VstUser = { id?: string; name?: string | null; lastLoginAt?: string | boolean | null };

export function VisitPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: VstUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<VstShape>("all");
  const [review, setReview] = useState<VstReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): VstRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { lastLoginAt: row.lastLoginAt === true || row.lastLoginAt === false ? row.lastLoginAt : textField(row.lastLoginAt) } satisfies VstValue,
    };
  }).filter((row): row is VstRow => Boolean(row));
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
    const next = readHiddenSel(readJson(VST_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(VST_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSel(readJson(VST_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(VST_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSelLanes(present, hidden, showHidden);
  const shown = visibleSel(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = vstLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = vstLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSel(rows);
  const leadHue = leadingSelHue(rows);
  const whole = rows.filter((row) => vstLane(row.code)).length;
  const share = vstShare(laneSelCount(rows, "hall"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("visit-marks.csv", vstLanesCsv(rows));
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
    writeJson(VST_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(VST_REVIEW_KEY, next);
  }

  return (
    <section className="c4-vstplate" aria-label={v4("vstTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-vstplate-mast">
        <p className="c4-vstplate-seal" data-logo="mono">{v4("vstLogo")}</p>
        <div>
          <p className="c4-vstplate-kicker">{v4("vstSub")}</p>
          <h2 className="c4-title">{v4("vstTitle")}</h2>
        </div>
        <p className="c4-vstplate-count">{shown.length}</p>
      </header>
      <p className="c4-vstplate-links">
        <Link href={crmv4Href(base, "sbr")}>{v4("sbrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("vstCustomer")}</Link>
      </p>
      <p className="c4-vstplate-hint">{v4("vstHint")}</p>
      {viewer && <p className="c4-vstplate-note">{v4("vstViewer")}</p>}
      <p className="c4-vstplate-meta">{v4("vstLead")} {laneLabel(v4, lead)} · {v4("vstToneLead")} {hueLabel(v4, leadHue)} · {v4("vstShare")} {share}</p>
      <div className="c4-vstplate-chart" aria-label={v4("vstChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-vstplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-vstplate-tools">
        <input ref={searchRef} className="c4-field c4-vstplate-search" aria-label={v4("vstSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("vstSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("vstShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "vstAll" : item === "reviewed" ? "vstReviewed" : "vstFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("vstAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as VstShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSel(hidden, item))}>{hidden.includes(item) ? v4("vstShow") : v4("vstHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-vstplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, true))}>{v4("vstBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, false))}>{v4("vstBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("visit-lanes.csv", vstLanesCsv(rows))}>{v4("vstCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("visit-rows.csv", vstRowsCsv(shown, reviewed))}>{v4("vstRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("vstLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("vstFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("vstEmpty")}</p>}
      <ul className="c4-vstplate-list">
        {shown.map((row) => {
          const name = vstCopy(row.code);
          const tone = vstHue(row.code);
          return (
            <li key={row.id} className="c4-vstplate-card" data-mail={vstLane(row.code) || "open"} data-hue={tone || "none"} data-home={vstLane(row.code) === "hall" ? "1" : "0"} data-away={vstAway(row.code) ? "1" : "0"} data-guest={vstGuest(row.code) ? "1" : "0"} data-citizen={vstCitizen(row.code) ? "1" : "0"} data-open={vstOpen(row.code) ? "1" : "0"} data-even={vstEven(row.code) ? "1" : "0"} data-digit={vstDigit(row.code) ? "1" : "0"} data-letter={vstLetter(row.code) ? "1" : "0"} data-mixed={vstMixed(row.code) ? "1" : "0"} data-upper={vstUpper(row.code) ? "1" : "0"} data-lower={vstLower(row.code) ? "1" : "0"} data-space={vstSpace(row.code) ? "1" : "0"} data-vowel={vstVowel(row.code) ? "1" : "0"} data-tail={vstTail(row.code) ? "1" : "0"} data-first={vstFirst(row.code) ? "1" : "0"} data-held={vstHeld(row.code) ? "1" : "0"} data-join={vstJoin(row.code) ? "1" : "0"} data-route={vstRoute(row.code) ? "1" : "0"} data-brief={vstBrief(row.code) ? "1" : "0"}>
              <label className="c4-vstplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-vstplate-meta">{name || v4("vstOpen")} · {vstStamp(row.code) || "—"} · {vstFamily(row.code) || "—"} · {vstLength(row.code) ?? "—"} · {laneLabel(v4, vstLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-vstplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSelReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("vstReviewed") : v4("vstReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = vstCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("vstCopied") : v4("vstCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("vstCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
