"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  TLN_KEY,
  TLN_REVIEW_KEY,
  DTN_DENSITY_KEY,
  DTN_KEY,
  DTN_LIMBS,
  DTN_VIEW_KEY,
  addDetent,
  addDetentTag,
  addDetentView,
  briskDetent,
  bulkTellurionReview,
  bulkDetentCoffer,
  bulkDetentGraphite,
  bulkDetentPoise,
  bulkDetentTag,
  busiestSetter,
  dropDetentView,
  editDetent,
  editDetentNote,
  tellurionBead,
  tellurionCopy,
  tellurionDigit,
  tellurionEven,
  tellurionFamily,
  tellurionFirst,
  tellurionGap,
  tellurionHeld,
  tellurionDesk,
  tellurionHue,
  tellurionJoin,
  tellurionFax,
  tellurionLane,
  tellurionLanes,
  tellurionLanesCsv,
  tellurionLength,
  tellurionLetter,
  tellurionLower,
  tellurionMixed,
  tellurionOpen,
  tellurionRowsCsv,
  tellurionShare,
  tellurionSpace,
  tellurionStamp,
  tellurionTail,
  tellurionUpper,
  tellurionHome,
  tellurionVowel,
  fairSetter,
  filmFocused,
  detentBars,
  detentCopy,
  detentCounts,
  detentCsv,
  detentDensity,
  detentInner,
  detentOuter,
  detentTimeline,
  detentSetters,
  idleDetent,
  laneTellurionCount,
  lateDetent,
  leadingTellurion,
  leadingTellurionHue,
  lowerBeatFocused,
  lowerRateFocused,
  moveDetentFocus,
  overdueDetent,
  pegDetentFocused,
  presentTellurionLanes,
  raiseBeatFocused,
  raiseRateFocused,
  readHiddenTellurion,
  readDetentRules,
  readDetentViews,
  readReviewedTellurion,
  reminderDetentRules,
  restingDetent,
  setDetentCoffer,
  setDetentFilm,
  setDetentFocused,
  setDetentPeg,
  setDetentPoise,
  setDetentStar,
  sortDetentRules,
  starDetentFocused,
  suggestBeat,
  suggestFilm,
  suggestLimb,
  toggleTellurion,
  toggleTellurionReview,
  visibleTellurion,
  visibleTellurionLanes,
  visibleDetentRules,
  type TellurionReview,
  type TellurionRow,
  type TellurionShape,
  type TellurionValue,
  type Detent,
  type DetentDensity,
  type DetentSort,
  type DetentTray,
  type DetentView,
} from "@/lib/crmv4/round334";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const BEATS = ["5", "10", "15", "20"] as const;
const RATES = ["1", "4", "7"] as const;

const LIMB_KEY: Record<string, CrmV4CopyKey> = {
  horn: "dtnHorn",
  locking: "dtnLocking",
  passing: "dtnPassing",
  discharge: "dtnDischarge",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "dtnAuditSave",
  edit: "dtnAuditEdit",
  note: "dtnAuditNote",
  film: "dtnAuditFilm",
  poise: "dtnAuditPoise",
  free: "dtnAuditFree",
  peg: "dtnAuditPeg",
  return: "dtnAuditReturn",
  coffer: "dtnAuditCoffer",
  open: "dtnAuditOpen",
  tag: "dtnAuditTag",
  rate: "dtnAuditRate",
  beat: "dtnAuditBeat",
  lower: "dtnAuditLower",
  star: "dtnAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  cell: "tlnCell",
  desk: "tlnDesk",
  home: "tlnHome",
  fax: "tlnFax",
  join: "tlnJoin",
  gap: "tlnGap",
  bead: "tlnBead",
  ribbon: "tlnRibbon",
  mark: "tlnMark",
  vowel: "tlnVowel",
  plain: "tlnPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "tlnChampagne",
  ivory: "tlnIvory",
  graphite: "tlnGraphite",
};

const SHAPE_KEY: Record<TellurionShape, CrmV4CopyKey> = {
  all: "tlnShapeAll",
  cell: "tlnShapeCell",
  desk: "tlnShapeDesk",
  home: "tlnShapeHome",
  fax: "tlnShapeFax",
  join: "tlnShapeJoin",
  gap: "tlnShapeGap",
  bead: "tlnShapeBead",
  ribbon: "tlnShapeRibbon",
  mark: "tlnShapeMark",
  vowel: "tlnShapeVowel",
  plain: "tlnShapePlain",
  open: "tlnShapeOpen",
  soon: "tlnShapeOpen",
  letter: "tlnShapePlain",
  mixed: "tlnShapeMark",
  upper: "tlnShapeCell",
  lower: "tlnShapePlain",
  space: "tlnShapeGap",
  even: "tlnShapeEven",
  odd: "tlnShapeEven",
  tail: "tlnShapeMark",
  first: "tlnShapePlain",
  held: "tlnShapeRibbon",
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

function limbLabel(v4: V4, limb: string): string {
  const key = LIMB_KEY[limb];
  return key ? v4(key) : v4("dtnBlankLimb");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("dtnGilt");
  if (film === "IVORY") return v4("dtnIvory");
  if (film === "GRAPHITE") return v4("dtnGraphite");
  return v4("dtnAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("tlnBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("tlnBlank");
}

export function DetentRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Detent[]>([]);
  const [views, setViews] = useState<DetentView[]>([]);
  const [density, setDensity] = useState<DetentDensity>("airy");
  const [tray, setTray] = useState<DetentTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [limbFilter, setLimbFilter] = useState("all");
  const [beatFilter, setBeatFilter] = useState("all");
  const [rateFilter, setRateFilter] = useState("all");
  const [sort, setSort] = useState<DetentSort>("limb");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [setter, setSetter] = useState("");
  const [limb, setLimb] = useState("");
  const [film, setFilm] = useState("");
  const [beatNo, setBeatNo] = useState("");
  const [rateNo, setRateNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [station, setStation] = useState("horn");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readDetentRules(readJson(DTN_KEY, [])));
    setViews(readDetentViews(readJson(DTN_VIEW_KEY, [])));
    setDensity(detentDensity(readJson(DTN_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Detent[]) {
    setCards(next);
    writeJson(DTN_KEY, next);
  }
  function storeViews(next: DetentView[]) {
    setViews(next);
    writeJson(DTN_VIEW_KEY, next);
  }
  function storeDensity(next: DetentDensity) {
    setDensity(next);
    writeJson(DTN_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortDetentRules(visibleDetentRules(cards, tray, query, setterFilter, filmFilter, limbFilter, beatFilter, rateFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, limbFilter, beatFilter, rateFilter, sort],
  );
  const counts = detentCounts(cards, shown, station);
  const bars = detentBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = detentTimeline(cards);
  const reminders = reminderDetentRules(cards);
  const setters = detentSetters(cards);
  const busy = busiestSetter(cards);
  const fair = fairSetter(cards, setters.join(","));
  const suggestedFilm = suggestFilm(cards);
  const suggestedBeat = suggestBeat(cards, clock);
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
        download("detent-rules.csv", detentCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveDetentFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveDetentFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addDetent(cards, { title, note, setter, limb, beat: beatNo, film, rate: rateNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-detent" aria-label={v4("dtnTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-detent-mast">
        <p className="c4-detent-seal" data-logo="mono">{v4("dtnLogo")}</p>
        <div>
          <p className="c4-detent-kicker">{v4("dtnSub")}</p>
          <h2 className="c4-title">{v4("dtnTitle")}</h2>
        </div>
        <p className="c4-detent-count">{shown.length}</p>
      </header>
      <p className="c4-detent-links">
        <Link href={crmv4Href(base, "tln")}>{v4("tlnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("dtnCustomers")}</Link>
      </p>
      <p className="c4-detent-hint">{v4("dtnHint")}</p>
      {viewer && <p className="c4-detent-note">{v4("dtnViewer")}</p>}
      <p className="c4-detent-meta">{v4("dtnFair")} {fair || "—"} · {v4("dtnBusy")} {busy || "—"} · {v4("dtnSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-detent-index" aria-label={v4("dtnRemind")}>
        <li data-tone="gold">{v4("dtnOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("dtnIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("dtnBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("dtnResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-detent-remind c4-detent-notices" role="status" aria-label={v4("dtnRemind")}>
          {reminders.map((name) => <li key={name}>{v4("dtnOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-detent-chart" aria-label={v4("dtnChart")}>
        {bars.map((bar) => (
          <button key={bar.limb} type="button" className="c4-detent-column" data-on={limbFilter === bar.limb ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === bar.limb ? "all" : bar.limb)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.limb)}</span>
          </button>
        ))}
      </div>
      <form className="c4-detent-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("dtnEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("dtnEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("dtnNote")}<input className="c4-field" aria-label={v4("dtnNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("dtnSetter")}<input className="c4-field" aria-label={v4("dtnSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("dtnLimb")}<select className="c4-field" aria-label={v4("dtnLimb")} value={limb} disabled={viewer} onChange={(event) => setLimb(event.target.value)}><option value="">{v4("dtnBlankLimb")}</option>{DTN_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("dtnFilm")}<select className="c4-field" aria-label={v4("dtnFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("dtnAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("dtnBeat")}<select className="c4-field" aria-label={v4("dtnBeat")} value={beatNo} disabled={viewer} onChange={(event) => setBeatNo(event.target.value)}><option value="">{v4("dtnAll")}</option>{BEATS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("dtnRate")}<select className="c4-field" aria-label={v4("dtnRate")} value={rateNo} disabled={viewer} onChange={(event) => setRateNo(event.target.value)}><option value="">{v4("dtnAll")}</option>{RATES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("dtnTag")}<input className="c4-field" aria-label={v4("dtnTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("dtnAdd")}</button>
      </form>
      <div className="c4-detent-tools">
        <input ref={searchRef} className="c4-field c4-detent-search" aria-label={v4("dtnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("dtnSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "dtnBoard" : item === "peg" ? "dtnPeg" : "dtnCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={limbFilter === "inner" ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === "inner" ? "all" : "inner")}>{v4("dtnInner")}</button>
        <button type="button" className="c4-chip" data-on={limbFilter === "outer" ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === "outer" ? "all" : "outer")}>{v4("dtnOuter")}</button>
        {FILMS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={filmFilter === item ? "1" : "0"} onClick={() => setFilmFilter(filmFilter === item ? "all" : item)}>{filmLabel(v4, item)}</button>
        ))}
        {BEATS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={beatFilter === item ? "1" : "0"} onClick={() => setBeatFilter(beatFilter === item ? "all" : item)}>{item}</button>
        ))}
        {RATES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rateFilter === item ? "1" : "0"} onClick={() => setRateFilter(rateFilter === item ? "all" : item)}>{item}</button>
        ))}
        {setters.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={setterFilter === name ? "1" : "0"} onClick={() => setSetterFilter(setterFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "limb" : "setter")}>{sort === "setter" ? v4("dtnSortSetter") : v4("dtnSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("dtnClose") : v4("dtnAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("dtnTimeline")}</button>
        <label className="c4-lab">{v4("dtnDesk")}<select className="c4-field" aria-label={v4("dtnDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{DTN_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-detent-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addDetentView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, limb: limbFilter, beat: beatFilter, rate: rateFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("dtnViewName")}<input className="c4-field" aria-label={v4("dtnViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("dtnSaveView")}</button>
      </form>
      <ul className="c4-detent-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setLimbFilter(view.limb); setBeatFilter(view.beat); setRateFilter(view.rate); }}>{v4("dtnApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropDetentView(views, view.id))}>{v4("dtnDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-detent-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDetentPoise(cards, picked))}>{v4("dtnBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDetentCoffer(cards, picked))}>{v4("dtnBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDetentGraphite(cards, picked))}>{v4("dtnBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDetentTag(cards, picked))}>{v4("dtnBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("detent-rules.csv", detentCsv(shown, station))}>{v4("dtnCsv")}</button>
        <p className="c4-detent-meta">{v4("dtnKeys")} / n x a j k · {v4("dtnQuiet")} {counts.quiet} · {v4("dtnInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-detent-time" aria-label={v4("dtnTimeline")}>
          {timeline.map((lane) => <li key={lane.beat}><span>{lane.beat}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("dtnEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-detent-list">
          {shown.map((card) => {
            const late = lateDetent(card, station);
            return (
              <li key={card.id} className="c4-detent-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleDetent(card) ? "1" : "0"} data-brisk={briskDetent(card) ? "1" : "0"} data-overdue={overdueDetent(card) ? "1" : "0"} data-resting={restingDetent(card) ? "1" : "0"} data-inner={detentInner(card.limb) ? "1" : "0"} data-outer={detentOuter(card.limb) ? "1" : "0"}>
                <label className="c4-detent-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editDetent(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("dtnEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("dtnApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editDetentNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("dtnNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-detent-meta">{limbLabel(v4, card.limb)} · {filmLabel(v4, card.film)} · {card.beat ?? "—"} · {card.rate} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "dtnAuditSave")}` : ""}{late ? ` · ${v4("dtnOverdue")}` : ""}</p>
                </div>
                <div className="c4-detent-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("dtnEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDetentPoise(cards, card.id, !card.poised))}>{card.poised ? v4("dtnFree") : v4("dtnPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDetentFilm(cards, card.id, suggestedFilm))}>{v4("dtnSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDetentPeg(cards, card.id, !card.pegged))}>{card.pegged ? v4("dtnUnpeg") : v4("dtnPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDetentCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("dtnUncoffer") : v4("dtnCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDetentStar(cards, card.id, !card.starred))}>{card.starred ? v4("dtnUnstar") : v4("dtnStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addDetentTag(cards, card.id, "h"))}>{v4("dtnTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBeatFocused(cards, card.id))}>{v4("dtnRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBeatFocused(cards, card.id))}>{v4("dtnLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseRateFocused(cards, card.id))}>{v4("dtnRate")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRateFocused(cards, card.id))}>{v4("dtnRate")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(filmFocused(cards, card.id))}>{v4("dtnFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDetentFocused(cards, card.id))}>{v4("dtnPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pegDetentFocused(cards, card.id))}>{v4("dtnPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starDetentFocused(cards, card.id))}>{v4("dtnStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(detentCopy(card))}>{v4("dtnCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type TellurionUser = { id?: string; name?: string | null; phone?: string | null };

export function TellurionPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TellurionUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<TellurionShape>("all");
  const [review, setReview] = useState<TellurionReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): TellurionRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { phone: textField(row.phone) } satisfies TellurionValue,
    };
  }).filter((row): row is TellurionRow => Boolean(row));
  const present = presentTellurionLanes(rows);
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
    const next = readHiddenTellurion(readJson(TLN_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(TLN_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedTellurion(readJson(TLN_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(TLN_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleTellurionLanes(present, hidden, showHidden);
  const shown = visibleTellurion(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = tellurionLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = tellurionLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingTellurion(rows);
  const leadHue = leadingTellurionHue(rows);
  const whole = rows.filter((row) => tellurionLane(row.code)).length;
  const share = tellurionShare(laneTellurionCount(rows, "cell"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("tellurion-lanes.csv", tellurionLanesCsv(rows));
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
    writeJson(TLN_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(TLN_REVIEW_KEY, next);
  }

  return (
    <section className="c4-tellurion" aria-label={v4("tlnTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-tellurion-mast">
        <p className="c4-tellurion-seal" data-logo="mono">{v4("tlnLogo")}</p>
        <div>
          <p className="c4-tellurion-kicker">{v4("tlnSub")}</p>
          <h2 className="c4-title">{v4("tlnTitle")}</h2>
        </div>
        <p className="c4-tellurion-count">{shown.length}</p>
      </header>
      <p className="c4-tellurion-links">
        <Link href={crmv4Href(base, "dtn")}>{v4("dtnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("tlnCustomer")}</Link>
      </p>
      <p className="c4-tellurion-hint">{v4("tlnHint")}</p>
      {viewer && <p className="c4-tellurion-note">{v4("tlnViewer")}</p>}
      <p className="c4-tellurion-meta">{v4("tlnLead")} {laneLabel(v4, lead)} · {v4("tlnToneLead")} {hueLabel(v4, leadHue)} · {v4("tlnShare")} {share}</p>
      <div className="c4-tellurion-chart" aria-label={v4("tlnChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-tellurion-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-tellurion-tools">
        <input ref={searchRef} className="c4-field c4-tellurion-search" aria-label={v4("tlnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("tlnSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("tlnShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "tlnAll" : item === "reviewed" ? "tlnReviewed" : "tlnFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("tlnAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as TellurionShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleTellurion(hidden, item))}>{hidden.includes(item) ? v4("tlnShow") : v4("tlnHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-tellurion-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkTellurionReview(reviewed, picked, true))}>{v4("tlnBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkTellurionReview(reviewed, picked, false))}>{v4("tlnBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("tellurion-lanes.csv", tellurionLanesCsv(rows))}>{v4("tlnCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("tellurion-rows.csv", tellurionRowsCsv(shown, reviewed))}>{v4("tlnRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("tlnLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("tlnFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("tlnEmpty")}</p>}
      <ul className="c4-tellurion-list">
        {shown.map((row) => {
          const name = tellurionCopy(row.code);
          const tone = tellurionHue(row.code);
          return (
            <li key={row.id} className="c4-tellurion-card" data-lane={tellurionLane(row.code) || "open"} data-hue={tone || "none"} data-cell={tellurionLane(row.code) === "cell" ? "1" : "0"} data-desk={tellurionDesk(row.code) ? "1" : "0"} data-home={tellurionHome(row.code) ? "1" : "0"} data-fax={tellurionFax(row.code) ? "1" : "0"} data-open={tellurionOpen(row.code) ? "1" : "0"} data-even={tellurionEven(row.code) ? "1" : "0"} data-digit={tellurionDigit(row.code) ? "1" : "0"} data-letter={tellurionLetter(row.code) ? "1" : "0"} data-mixed={tellurionMixed(row.code) ? "1" : "0"} data-upper={tellurionUpper(row.code) ? "1" : "0"} data-lower={tellurionLower(row.code) ? "1" : "0"} data-space={tellurionSpace(row.code) ? "1" : "0"} data-vowel={tellurionVowel(row.code) ? "1" : "0"} data-tail={tellurionTail(row.code) ? "1" : "0"} data-first={tellurionFirst(row.code) ? "1" : "0"} data-held={tellurionHeld(row.code) ? "1" : "0"} data-join={tellurionJoin(row.code) ? "1" : "0"} data-gap={tellurionGap(row.code) ? "1" : "0"} data-bead={tellurionBead(row.code) ? "1" : "0"}>
              <label className="c4-tellurion-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-tellurion-meta">{name || v4("tlnOpen")} · {tellurionStamp(row.code) || "—"} · {tellurionFamily(row.code) || "—"} · {tellurionLength(row.code) ?? "—"} · {laneLabel(v4, tellurionLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-tellurion-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleTellurionReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("tlnReviewed") : v4("tlnReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = tellurionCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("tlnCopied") : v4("tlnCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("tlnCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
