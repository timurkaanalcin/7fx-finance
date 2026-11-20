"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  MPX_KEY,
  MPX_REVIEW_KEY,
  RTP_DENSITY_KEY,
  RTP_KEY,
  RTP_MODES,
  RTP_VIEW_KEY,
  addRattrapante,
  addRattrapanteTag,
  addRattrapanteView,
  briskRattrapante,
  bulkEmailReview,
  bulkRattrapanteCoffer,
  bulkRattrapanteGraphite,
  bulkRattrapanteRaise,
  bulkRattrapanteTag,
  busiestKeeper,
  dropRattrapanteView,
  editRattrapante,
  editRattrapanteNote,
  emailBrief,
  emailCopy,
  emailDigit,
  emailEven,
  emailFamily,
  emailFirst,
  emailGap,
  emailHeld,
  emailAway,
  emailHue,
  emailJoin,
  emailCitizen,
  emailLane,
  emailLanes,
  emailLanesCsv,
  emailLength,
  emailLetter,
  emailLower,
  emailMixed,
  emailOpen,
  emailRowsCsv,
  emailShare,
  emailSpace,
  emailStamp,
  emailTail,
  emailUpper,
  emailGuest,
  emailVowel,
  fairKeeper,
  finishFocused,
  rattrapanteBars,
  rattrapanteCopy,
  rattrapanteCounts,
  rattrapanteCsv,
  rattrapanteDensity,
  rattrapanteInner,
  rattrapanteOuter,
  rattrapanteTimeline,
  rattrapanteKeepers,
  idleRattrapante,
  laneEmailCount,
  lateRattrapante,
  leadingEmail,
  leadingEmailHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveRattrapanteFocus,
  overdueRattrapante,
  pinRattrapanteFocused,
  presentEmailLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenEmail,
  readRattrapantes,
  readRattrapanteViews,
  readReviewedEmail,
  reminderRattrapantes,
  restingRattrapante,
  setRattrapanteCoffer,
  setRattrapanteFilm,
  setRattrapanteFocused,
  setRattrapantePin,
  setRattrapanteRaised,
  setRattrapanteStar,
  sortRattrapantes,
  starRattrapanteFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleEmail,
  toggleEmailReview,
  visibleEmail,
  visibleEmailLanes,
  visibleRattrapantes,
  type EmailReview,
  type EmailRow,
  type EmailShape,
  type EmailValue,
  type Rattrapante,
  type RattrapanteDensity,
  type RattrapanteSort,
  type RattrapanteTray,
  type RattrapanteView,
} from "@/lib/crmv4/round344";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["4", "8", "12", "16"] as const;
const LOCKS = ["4", "6", "8"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  split: "rtpSplit",
  flyback: "rtpFlyback",
  column: "rtpColumn",
  clutch: "rtpClutch",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "rtpAuditSave",
  edit: "rtpAuditEdit",
  note: "rtpAuditNote",
  film: "rtpAuditFilm",
  poise: "rtpAuditPoise",
  free: "rtpAuditFree",
  peg: "rtpAuditPeg",
  return: "rtpAuditReturn",
  coffer: "rtpAuditCoffer",
  open: "rtpAuditOpen",
  tag: "rtpAuditTag",
  lock: "rtpAuditRate",
  drop: "rtpAuditBeat",
  lower: "rtpAuditLower",
  star: "rtpAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  mail: "mpxMail",
  inbox: "mpxInbox",
  desk: "mpxDesk",
  post: "mpxPost",
  join: "mpxJoin",
  gap: "mpxGap",
  brief: "mpxBrief",
  long: "mpxLong",
  mark: "mpxMark",
  vowel: "mpxVowel",
  plain: "mpxPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "mpxChampagne",
  ivory: "mpxIvory",
  graphite: "mpxGraphite",
};

const SHAPE_KEY: Record<EmailShape, CrmV4CopyKey> = {
  all: "mpxShapeAll",
  mail: "mpxShapeMail",
  inbox: "mpxShapeInbox",
  desk: "mpxShapeDesk",
  post: "mpxShapePost",
  join: "mpxShapeJoin",
  gap: "mpxShapeGap",
  brief: "mpxShapeBrief",
  long: "mpxShapeLong",
  mark: "mpxShapeMark",
  vowel: "mpxShapeVowel",
  plain: "mpxShapePlain",
  open: "mpxShapeOpen",
  soon: "mpxShapeOpen",
  letter: "mpxShapePlain",
  mixed: "mpxShapeMark",
  upper: "mpxShapeMail",
  lower: "mpxShapePlain",
  space: "mpxShapeGap",
  even: "mpxShapeEven",
  odd: "mpxShapeEven",
  tail: "mpxShapeMark",
  first: "mpxShapePlain",
  held: "mpxShapeLong",
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
  return key ? v4(key) : v4("rtpBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("rtpGilt");
  if (film === "IVORY") return v4("rtpIvory");
  if (film === "GRAPHITE") return v4("rtpGraphite");
  return v4("rtpAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("mpxBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("mpxBlank");
}

export function RattrapanteRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Rattrapante[]>([]);
  const [views, setViews] = useState<RattrapanteView[]>([]);
  const [density, setDensity] = useState<RattrapanteDensity>("airy");
  const [tray, setTray] = useState<RattrapanteTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<RattrapanteSort>("piece");
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
  const [station, setStation] = useState("split");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readRattrapantes(readJson(RTP_KEY, [])));
    setViews(readRattrapanteViews(readJson(RTP_VIEW_KEY, [])));
    setDensity(rattrapanteDensity(readJson(RTP_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Rattrapante[]) {
    setCards(next);
    writeJson(RTP_KEY, next);
  }
  function storeViews(next: RattrapanteView[]) {
    setViews(next);
    writeJson(RTP_VIEW_KEY, next);
  }
  function storeDensity(next: RattrapanteDensity) {
    setDensity(next);
    writeJson(RTP_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortRattrapantes(visibleRattrapantes(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = rattrapanteCounts(cards, shown, station);
  const bars = rattrapanteBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = rattrapanteTimeline(cards);
  const reminders = reminderRattrapantes(cards);
  const poisers = rattrapanteKeepers(cards);
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
        download("rattrapante-rules.csv", rattrapanteCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveRattrapanteFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveRattrapanteFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addRattrapante(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-rattrapante" aria-label={v4("rtpTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-rattrapante-mast">
        <p className="c4-rattrapante-seal" data-logo="mono">{v4("rtpLogo")}</p>
        <div>
          <p className="c4-rattrapante-kicker">{v4("rtpSub")}</p>
          <h2 className="c4-title">{v4("rtpTitle")}</h2>
        </div>
        <p className="c4-rattrapante-count">{shown.length}</p>
      </header>
      <p className="c4-rattrapante-links">
        <Link href={crmv4Href(base, "mpx")}>{v4("mpxTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rtpCustomers")}</Link>
      </p>
      <p className="c4-rattrapante-hint">{v4("rtpHint")}</p>
      {viewer && <p className="c4-rattrapante-note">{v4("rtpViewer")}</p>}
      <p className="c4-rattrapante-meta">{v4("rtpFair")} {fair || "—"} · {v4("rtpBusy")} {busy || "—"} · {v4("rtpSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-rattrapante-index" aria-label={v4("rtpRemind")}>
        <li data-tone="gold">{v4("rtpOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("rtpIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("rtpBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("rtpResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-rattrapante-remind c4-rattrapante-notices" role="status" aria-label={v4("rtpRemind")}>
          {reminders.map((name) => <li key={name}>{v4("rtpOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-rattrapante-chart" aria-label={v4("rtpChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-rattrapante-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-rattrapante-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("rtpEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("rtpEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("rtpNote")}<input className="c4-field" aria-label={v4("rtpNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("rtpSetter")}<input className="c4-field" aria-label={v4("rtpSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("rtpPiece")}<select className="c4-field" aria-label={v4("rtpPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("rtpBlankPiece")}</option>{RTP_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("rtpFilm")}<select className="c4-field" aria-label={v4("rtpFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("rtpAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("rtpDrop")}<select className="c4-field" aria-label={v4("rtpDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("rtpAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("rtpLock")}<select className="c4-field" aria-label={v4("rtpLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("rtpAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("rtpTag")}<input className="c4-field" aria-label={v4("rtpTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("rtpAdd")}</button>
      </form>
      <div className="c4-rattrapante-tools">
        <input ref={searchRef} className="c4-field c4-rattrapante-search" aria-label={v4("rtpSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rtpSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "rtpBoard" : item === "peg" ? "rtpPeg" : "rtpCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("rtpInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("rtpOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("rtpSortSetter") : v4("rtpSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("rtpClose") : v4("rtpAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("rtpTimeline")}</button>
        <label className="c4-lab">{v4("rtpDesk")}<select className="c4-field" aria-label={v4("rtpDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{RTP_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-rattrapante-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addRattrapanteView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("rtpViewName")}<input className="c4-field" aria-label={v4("rtpViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("rtpSaveView")}</button>
      </form>
      <ul className="c4-rattrapante-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("rtpApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropRattrapanteView(views, view.id))}>{v4("rtpDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-rattrapante-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRattrapanteRaise(cards, picked))}>{v4("rtpBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRattrapanteCoffer(cards, picked))}>{v4("rtpBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRattrapanteGraphite(cards, picked))}>{v4("rtpBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRattrapanteTag(cards, picked))}>{v4("rtpBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("rattrapante-rules.csv", rattrapanteCsv(shown, station))}>{v4("rtpCsv")}</button>
        <p className="c4-rattrapante-meta">{v4("rtpKeys")} / n x a j k · {v4("rtpQuiet")} {counts.quiet} · {v4("rtpInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-rattrapante-time" aria-label={v4("rtpTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("rtpEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-rattrapante-list">
          {shown.map((card) => {
            const late = lateRattrapante(card, station);
            return (
              <li key={card.id} className="c4-rattrapante-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleRattrapante(card) ? "1" : "0"} data-brisk={briskRattrapante(card) ? "1" : "0"} data-overdue={overdueRattrapante(card) ? "1" : "0"} data-resting={restingRattrapante(card) ? "1" : "0"} data-inner={rattrapanteInner(card.piece) ? "1" : "0"} data-outer={rattrapanteOuter(card.piece) ? "1" : "0"}>
                <label className="c4-rattrapante-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editRattrapante(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("rtpEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("rtpApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editRattrapanteNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("rtpNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-rattrapante-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "rtpAuditSave")}` : ""}{late ? ` · ${v4("rtpOverdue")}` : ""}</p>
                </div>
                <div className="c4-rattrapante-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("rtpEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRattrapanteRaised(cards, card.id, !card.raised))}>{card.raised ? v4("rtpFree") : v4("rtpPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRattrapanteFilm(cards, card.id, suggestedFilm))}>{v4("rtpSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRattrapantePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("rtpUnpeg") : v4("rtpPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRattrapanteCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("rtpUncoffer") : v4("rtpCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRattrapanteStar(cards, card.id, !card.starred))}>{card.starred ? v4("rtpUnstar") : v4("rtpStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addRattrapanteTag(cards, card.id, "s"))}>{v4("rtpTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("rtpRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("rtpLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("rtpLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("rtpLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("rtpFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRattrapanteFocused(cards, card.id))}>{v4("rtpPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinRattrapanteFocused(cards, card.id))}>{v4("rtpPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starRattrapanteFocused(cards, card.id))}>{v4("rtpStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(rattrapanteCopy(card))}>{v4("rtpCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type EmailUser = { id?: string; name?: string | null; email?: boolean | string | null };

export function EmailLanePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: EmailUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<EmailShape>("all");
  const [review, setReview] = useState<EmailReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): EmailRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { email: textField(row.email) } satisfies EmailValue,
    };
  }).filter((row): row is EmailRow => Boolean(row));
  const present = presentEmailLanes(rows);
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
    const next = readHiddenEmail(readJson(MPX_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(MPX_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedEmail(readJson(MPX_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(MPX_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleEmailLanes(present, hidden, showHidden);
  const shown = visibleEmail(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = emailLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = emailLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingEmail(rows);
  const leadHue = leadingEmailHue(rows);
  const whole = rows.filter((row) => emailLane(row.code)).length;
  const share = emailShare(laneEmailCount(rows, "mail"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("email-lanes.csv", emailLanesCsv(rows));
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
    writeJson(MPX_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(MPX_REVIEW_KEY, next);
  }

  return (
    <section className="c4-email" aria-label={v4("mpxTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-email-mast">
        <p className="c4-email-seal" data-logo="mono">{v4("mpxLogo")}</p>
        <div>
          <p className="c4-email-kicker">{v4("mpxSub")}</p>
          <h2 className="c4-title">{v4("mpxTitle")}</h2>
        </div>
        <p className="c4-email-count">{shown.length}</p>
      </header>
      <p className="c4-email-links">
        <Link href={crmv4Href(base, "rtp")}>{v4("rtpTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("mpxCustomer")}</Link>
      </p>
      <p className="c4-email-hint">{v4("mpxHint")}</p>
      {viewer && <p className="c4-email-note">{v4("mpxViewer")}</p>}
      <p className="c4-email-meta">{v4("mpxLead")} {laneLabel(v4, lead)} · {v4("mpxToneLead")} {hueLabel(v4, leadHue)} · {v4("mpxShare")} {share}</p>
      <div className="c4-email-chart" aria-label={v4("mpxChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-email-column" data-on={mail === line.mail ? "1" : "0"} data-mail={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-email-tools">
        <input ref={searchRef} className="c4-field c4-email-search" aria-label={v4("mpxSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("mpxSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("mpxShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "mpxAll" : item === "reviewed" ? "mpxReviewed" : "mpxFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("mpxAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as EmailShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleEmail(hidden, item))}>{hidden.includes(item) ? v4("mpxShow") : v4("mpxHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-email-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkEmailReview(reviewed, picked, true))}>{v4("mpxBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkEmailReview(reviewed, picked, false))}>{v4("mpxBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("email-lanes.csv", emailLanesCsv(rows))}>{v4("mpxCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("email-rows.csv", emailRowsCsv(shown, reviewed))}>{v4("mpxRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("mpxLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("mpxFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("mpxEmpty")}</p>}
      <ul className="c4-email-list">
        {shown.map((row) => {
          const name = emailCopy(row.code);
          const tone = emailHue(row.code);
          return (
            <li key={row.id} className="c4-email-card" data-mail={emailLane(row.code) || "open"} data-hue={tone || "none"} data-mail-mark={emailLane(row.code) === "mail" ? "1" : "0"} data-away={emailAway(row.code) ? "1" : "0"} data-guest={emailGuest(row.code) ? "1" : "0"} data-citizen={emailCitizen(row.code) ? "1" : "0"} data-open={emailOpen(row.code) ? "1" : "0"} data-even={emailEven(row.code) ? "1" : "0"} data-digit={emailDigit(row.code) ? "1" : "0"} data-letter={emailLetter(row.code) ? "1" : "0"} data-mixed={emailMixed(row.code) ? "1" : "0"} data-upper={emailUpper(row.code) ? "1" : "0"} data-lower={emailLower(row.code) ? "1" : "0"} data-space={emailSpace(row.code) ? "1" : "0"} data-vowel={emailVowel(row.code) ? "1" : "0"} data-tail={emailTail(row.code) ? "1" : "0"} data-first={emailFirst(row.code) ? "1" : "0"} data-held={emailHeld(row.code) ? "1" : "0"} data-join={emailJoin(row.code) ? "1" : "0"} data-gap={emailGap(row.code) ? "1" : "0"} data-brief={emailBrief(row.code) ? "1" : "0"}>
              <label className="c4-email-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-email-meta">{name || v4("mpxOpen")} · {emailStamp(row.code) || "—"} · {emailFamily(row.code) || "—"} · {emailLength(row.code) ?? "—"} · {laneLabel(v4, emailLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-email-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleEmailReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("mpxReviewed") : v4("mpxReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = emailCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("mpxCopied") : v4("mpxCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("mpxCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
