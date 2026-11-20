"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  FNM_KEY,
  FNM_REVIEW_KEY,
  OSC_DENSITY_KEY,
  OSC_KEY,
  OSC_LIMBS,
  OSC_VIEW_KEY,
  addOscillator,
  addOscillatorTag,
  addOscillatorView,
  briskOscillator,
  bulkForenameReview,
  bulkOscillatorCoffer,
  bulkOscillatorGraphite,
  bulkOscillatorPoise,
  bulkOscillatorTag,
  busiestPoiser,
  dropOscillatorView,
  editOscillator,
  editOscillatorNote,
  forenameBead,
  forenameCopy,
  forenameDigit,
  forenameEven,
  forenameFamily,
  forenameFirst,
  forenameGap,
  forenameHeld,
  forenameNoah,
  forenameHue,
  forenameJoin,
  forenameMax,
  forenameLane,
  forenameLanes,
  forenameLanesCsv,
  forenameLength,
  forenameLetter,
  forenameLower,
  forenameMixed,
  forenameOpen,
  forenameRowsCsv,
  forenameShare,
  forenameSpace,
  forenameStamp,
  forenameTail,
  forenameUpper,
  forenameLeo,
  forenameVowel,
  fairPoiser,
  filmFocused,
  oscillatorBars,
  oscillatorCopy,
  oscillatorCounts,
  oscillatorCsv,
  oscillatorDensity,
  oscillatorInner,
  oscillatorOuter,
  oscillatorTimeline,
  oscillatorPoisers,
  idleOscillator,
  laneForenameCount,
  lateOscillator,
  leadingForename,
  leadingForenameHue,
  lowerBeatFocused,
  lowerRateFocused,
  moveOscillatorFocus,
  overdueOscillator,
  pegOscillatorFocused,
  presentForenameLanes,
  raiseBeatFocused,
  raiseRateFocused,
  readHiddenForename,
  readOscillatorRules,
  readOscillatorViews,
  readReviewedForename,
  reminderOscillatorRules,
  restingOscillator,
  setOscillatorCoffer,
  setOscillatorFilm,
  setOscillatorFocused,
  setOscillatorPeg,
  setOscillatorPoise,
  setOscillatorStar,
  sortOscillatorRules,
  starOscillatorFocused,
  suggestTurn,
  suggestFinish,
  suggestPart,
  toggleForename,
  toggleForenameReview,
  visibleForename,
  visibleForenameLanes,
  visibleOscillatorRules,
  type ForenameReview,
  type ForenameRow,
  type ForenameShape,
  type ForenameValue,
  type Oscillator,
  type OscillatorDensity,
  type OscillatorSort,
  type OscillatorTray,
  type OscillatorView,
} from "@/lib/crmv4/round339";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const BEATS = ["5", "15", "25", "35"] as const;
const RATES = ["4", "8", "12"] as const;

const LIMB_KEY: Record<string, CrmV4CopyKey> = {
  rim: "oscRim",
  arm: "oscArm",
  staff: "oscStaff",
  roller: "oscRoller",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "oscAuditSave",
  edit: "oscAuditEdit",
  note: "oscAuditNote",
  film: "oscAuditFilm",
  poise: "oscAuditPoise",
  free: "oscAuditFree",
  peg: "oscAuditPeg",
  return: "oscAuditReturn",
  coffer: "oscAuditCoffer",
  open: "oscAuditOpen",
  tag: "oscAuditTag",
  rate: "oscAuditRate",
  beat: "oscAuditBeat",
  lower: "oscAuditLower",
  star: "oscAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  anna: "fnmAnna",
  noah: "fnmNoah",
  leo: "fnmLeo",
  max: "fnmMax",
  join: "fnmJoin",
  gap: "fnmGap",
  bead: "fnmBead",
  ribbon: "fnmRibbon",
  mark: "fnmMark",
  vowel: "fnmVowel",
  plain: "fnmPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "fnmChampagne",
  ivory: "fnmIvory",
  graphite: "fnmGraphite",
};

const SHAPE_KEY: Record<ForenameShape, CrmV4CopyKey> = {
  all: "fnmShapeAll",
  anna: "fnmShapeAnna",
  noah: "fnmShapeNoah",
  leo: "fnmShapeLeo",
  max: "fnmShapeMax",
  join: "fnmShapeJoin",
  gap: "fnmShapeGap",
  bead: "fnmShapeBead",
  ribbon: "fnmShapeRibbon",
  mark: "fnmShapeMark",
  vowel: "fnmShapeVowel",
  plain: "fnmShapePlain",
  open: "fnmShapeOpen",
  soon: "fnmShapeOpen",
  letter: "fnmShapePlain",
  mixed: "fnmShapeMark",
  upper: "fnmShapeAnna",
  lower: "fnmShapePlain",
  space: "fnmShapeGap",
  even: "fnmShapeEven",
  odd: "fnmShapeEven",
  tail: "fnmShapeMark",
  first: "fnmShapePlain",
  held: "fnmShapeRibbon",
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
  return key ? v4(key) : v4("oscBlankLimb");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("oscGilt");
  if (film === "IVORY") return v4("oscIvory");
  if (film === "GRAPHITE") return v4("oscGraphite");
  return v4("oscAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("fnmBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("fnmBlank");
}

export function OscillatorRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Oscillator[]>([]);
  const [views, setViews] = useState<OscillatorView[]>([]);
  const [density, setDensity] = useState<OscillatorDensity>("airy");
  const [tray, setTray] = useState<OscillatorTray>("board");
  const [query, setQuery] = useState("");
  const [poiserFilter, setPoiserFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [limbFilter, setLimbFilter] = useState("all");
  const [beatFilter, setBeatFilter] = useState("all");
  const [rateFilter, setRateFilter] = useState("all");
  const [sort, setSort] = useState<OscillatorSort>("limb");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [poiser, setPoiser] = useState("");
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
  const [station, setStation] = useState("rim");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readOscillatorRules(readJson(OSC_KEY, [])));
    setViews(readOscillatorViews(readJson(OSC_VIEW_KEY, [])));
    setDensity(oscillatorDensity(readJson(OSC_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Oscillator[]) {
    setCards(next);
    writeJson(OSC_KEY, next);
  }
  function storeViews(next: OscillatorView[]) {
    setViews(next);
    writeJson(OSC_VIEW_KEY, next);
  }
  function storeDensity(next: OscillatorDensity) {
    setDensity(next);
    writeJson(OSC_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortOscillatorRules(visibleOscillatorRules(cards, tray, query, poiserFilter, filmFilter, limbFilter, beatFilter, rateFilter), sort),
    [cards, tray, query, poiserFilter, filmFilter, limbFilter, beatFilter, rateFilter, sort],
  );
  const counts = oscillatorCounts(cards, shown, station);
  const bars = oscillatorBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = oscillatorTimeline(cards);
  const reminders = reminderOscillatorRules(cards);
  const poisers = oscillatorPoisers(cards);
  const busy = busiestPoiser(cards);
  const fair = fairPoiser(cards, poisers.join(","));
  const suggestedFilm = suggestFinish(cards);
  const suggestedBeat = suggestTurn(cards, clock);
  const suggestedLimb = suggestPart(clock);
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
        download("oscillator-rules.csv", oscillatorCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveOscillatorFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveOscillatorFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addOscillator(cards, { title, note, poiser: poiser, limb, beat: beatNo, film, rate: rateNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-oscillator" aria-label={v4("oscTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-oscillator-mast">
        <p className="c4-oscillator-seal" data-logo="mono">{v4("oscLogo")}</p>
        <div>
          <p className="c4-oscillator-kicker">{v4("oscSub")}</p>
          <h2 className="c4-title">{v4("oscTitle")}</h2>
        </div>
        <p className="c4-oscillator-count">{shown.length}</p>
      </header>
      <p className="c4-oscillator-links">
        <Link href={crmv4Href(base, "fnm")}>{v4("fnmTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("oscCustomers")}</Link>
      </p>
      <p className="c4-oscillator-hint">{v4("oscHint")}</p>
      {viewer && <p className="c4-oscillator-note">{v4("oscViewer")}</p>}
      <p className="c4-oscillator-meta">{v4("oscFair")} {fair || "—"} · {v4("oscBusy")} {busy || "—"} · {v4("oscSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-oscillator-index" aria-label={v4("oscRemind")}>
        <li data-tone="gold">{v4("oscOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("oscIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("oscBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("oscResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-oscillator-remind c4-oscillator-notices" role="status" aria-label={v4("oscRemind")}>
          {reminders.map((name) => <li key={name}>{v4("oscOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-oscillator-chart" aria-label={v4("oscChart")}>
        {bars.map((bar) => (
          <button key={bar.limb} type="button" className="c4-oscillator-column" data-on={limbFilter === bar.limb ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === bar.limb ? "all" : bar.limb)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.limb)}</span>
          </button>
        ))}
      </div>
      <form className="c4-oscillator-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("oscEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("oscEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("oscNote")}<input className="c4-field" aria-label={v4("oscNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("oscPoiser")}<input className="c4-field" aria-label={v4("oscPoiser")} aria-required={false} value={poiser} maxLength={24} disabled={viewer} onChange={(event) => setPoiser(event.target.value)} /></label>
        <label className="c4-lab">{v4("oscLimb")}<select className="c4-field" aria-label={v4("oscLimb")} value={limb} disabled={viewer} onChange={(event) => setLimb(event.target.value)}><option value="">{v4("oscBlankLimb")}</option>{OSC_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("oscFilm")}<select className="c4-field" aria-label={v4("oscFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("oscAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("oscQuarter")}<select className="c4-field" aria-label={v4("oscQuarter")} value={beatNo} disabled={viewer} onChange={(event) => setBeatNo(event.target.value)}><option value="">{v4("oscAll")}</option>{BEATS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("oscStrike")}<select className="c4-field" aria-label={v4("oscStrike")} value={rateNo} disabled={viewer} onChange={(event) => setRateNo(event.target.value)}><option value="">{v4("oscAll")}</option>{RATES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("oscTag")}<input className="c4-field" aria-label={v4("oscTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("oscAdd")}</button>
      </form>
      <div className="c4-oscillator-tools">
        <input ref={searchRef} className="c4-field c4-oscillator-search" aria-label={v4("oscSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("oscSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "oscBoard" : item === "peg" ? "oscPeg" : "oscCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={limbFilter === "inner" ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === "inner" ? "all" : "inner")}>{v4("oscInner")}</button>
        <button type="button" className="c4-chip" data-on={limbFilter === "outer" ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === "outer" ? "all" : "outer")}>{v4("oscOuter")}</button>
        {FILMS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={filmFilter === item ? "1" : "0"} onClick={() => setFilmFilter(filmFilter === item ? "all" : item)}>{filmLabel(v4, item)}</button>
        ))}
        {BEATS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={beatFilter === item ? "1" : "0"} onClick={() => setBeatFilter(beatFilter === item ? "all" : item)}>{item}</button>
        ))}
        {RATES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rateFilter === item ? "1" : "0"} onClick={() => setRateFilter(rateFilter === item ? "all" : item)}>{item}</button>
        ))}
        {poisers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={poiserFilter === name ? "1" : "0"} onClick={() => setPoiserFilter(poiserFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "poiser" ? "1" : "0"} onClick={() => setSort(sort === "poiser" ? "limb" : "poiser")}>{sort === "poiser" ? v4("oscSortPoiser") : v4("oscSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("oscClose") : v4("oscAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("oscTimeline")}</button>
        <label className="c4-lab">{v4("oscDesk")}<select className="c4-field" aria-label={v4("oscDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{OSC_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-oscillator-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addOscillatorView(views, { id, name: viewName, tray, query, poiser: poiserFilter, film: filmFilter, limb: limbFilter, beat: beatFilter, rate: rateFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("oscViewName")}<input className="c4-field" aria-label={v4("oscViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("oscSaveView")}</button>
      </form>
      <ul className="c4-oscillator-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setPoiserFilter(view.poiser); setFilmFilter(view.film); setLimbFilter(view.limb); setBeatFilter(view.beat); setRateFilter(view.rate); }}>{v4("oscApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropOscillatorView(views, view.id))}>{v4("oscDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-oscillator-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOscillatorPoise(cards, picked))}>{v4("oscBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOscillatorCoffer(cards, picked))}>{v4("oscBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOscillatorGraphite(cards, picked))}>{v4("oscBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOscillatorTag(cards, picked))}>{v4("oscBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("oscillator-rules.csv", oscillatorCsv(shown, station))}>{v4("oscCsv")}</button>
        <p className="c4-oscillator-meta">{v4("oscKeys")} / n x a j k · {v4("oscQuiet")} {counts.quiet} · {v4("oscInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-oscillator-time" aria-label={v4("oscTimeline")}>
          {timeline.map((lane) => <li key={lane.beat}><span>{lane.beat}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("oscEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-oscillator-list">
          {shown.map((card) => {
            const late = lateOscillator(card, station);
            return (
              <li key={card.id} className="c4-oscillator-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleOscillator(card) ? "1" : "0"} data-brisk={briskOscillator(card) ? "1" : "0"} data-overdue={overdueOscillator(card) ? "1" : "0"} data-resting={restingOscillator(card) ? "1" : "0"} data-inner={oscillatorInner(card.limb) ? "1" : "0"} data-outer={oscillatorOuter(card.limb) ? "1" : "0"}>
                <label className="c4-oscillator-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editOscillator(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("oscEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("oscApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editOscillatorNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("oscNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-oscillator-meta">{limbLabel(v4, card.limb)} · {filmLabel(v4, card.film)} · {card.beat ?? "—"} · {card.rate} · {card.poiser || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "oscAuditSave")}` : ""}{late ? ` · ${v4("oscOverdue")}` : ""}</p>
                </div>
                <div className="c4-oscillator-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("oscEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOscillatorPoise(cards, card.id, !card.poised))}>{card.poised ? v4("oscFree") : v4("oscPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOscillatorFilm(cards, card.id, suggestedFilm))}>{v4("oscSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOscillatorPeg(cards, card.id, !card.pegged))}>{card.pegged ? v4("oscUnpeg") : v4("oscPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOscillatorCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("oscUncoffer") : v4("oscCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOscillatorStar(cards, card.id, !card.starred))}>{card.starred ? v4("oscUnstar") : v4("oscStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addOscillatorTag(cards, card.id, "c"))}>{v4("oscTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBeatFocused(cards, card.id))}>{v4("oscRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBeatFocused(cards, card.id))}>{v4("oscLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseRateFocused(cards, card.id))}>{v4("oscStrike")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRateFocused(cards, card.id))}>{v4("oscStrike")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(filmFocused(cards, card.id))}>{v4("oscFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOscillatorFocused(cards, card.id))}>{v4("oscPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pegOscillatorFocused(cards, card.id))}>{v4("oscPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starOscillatorFocused(cards, card.id))}>{v4("oscStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(oscillatorCopy(card))}>{v4("oscCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type ForenameUser = { id?: string; name?: string | null; firstName?: string | null };

export function ForenamePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: ForenameUser[] }>("/api/admin/users?take=24&meta=0");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<ForenameShape>("all");
  const [review, setReview] = useState<ForenameReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): ForenameRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { firstName: textField(row.firstName) } satisfies ForenameValue,
    };
  }).filter((row): row is ForenameRow => Boolean(row));
  const present = presentForenameLanes(rows);
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
    const next = readHiddenForename(readJson(FNM_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(FNM_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedForename(readJson(FNM_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(FNM_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleForenameLanes(present, hidden, showHidden);
  const shown = visibleForename(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = forenameLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = forenameLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingForename(rows);
  const leadHue = leadingForenameHue(rows);
  const whole = rows.filter((row) => forenameLane(row.code)).length;
  const share = forenameShare(laneForenameCount(rows, "anna"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("forename-lanes.csv", forenameLanesCsv(rows));
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
    writeJson(FNM_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(FNM_REVIEW_KEY, next);
  }

  return (
    <section className="c4-forename" aria-label={v4("fnmTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-forename-mast">
        <p className="c4-forename-seal" data-logo="mono">{v4("fnmLogo")}</p>
        <div>
          <p className="c4-forename-kicker">{v4("fnmSub")}</p>
          <h2 className="c4-title">{v4("fnmTitle")}</h2>
        </div>
        <p className="c4-forename-count">{shown.length}</p>
      </header>
      <p className="c4-forename-links">
        <Link href={crmv4Href(base, "osc")}>{v4("oscTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("fnmCustomer")}</Link>
      </p>
      <p className="c4-forename-hint">{v4("fnmHint")}</p>
      {viewer && <p className="c4-forename-note">{v4("fnmViewer")}</p>}
      <p className="c4-forename-meta">{v4("fnmLead")} {laneLabel(v4, lead)} · {v4("fnmToneLead")} {hueLabel(v4, leadHue)} · {v4("fnmShare")} {share}</p>
      <div className="c4-forename-chart" aria-label={v4("fnmChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-forename-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-forename-tools">
        <input ref={searchRef} className="c4-field c4-forename-search" aria-label={v4("fnmSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("fnmSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("fnmShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "fnmAll" : item === "reviewed" ? "fnmReviewed" : "fnmFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("fnmAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as ForenameShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleForename(hidden, item))}>{hidden.includes(item) ? v4("fnmShow") : v4("fnmHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-forename-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkForenameReview(reviewed, picked, true))}>{v4("fnmBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkForenameReview(reviewed, picked, false))}>{v4("fnmBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("forename-lanes.csv", forenameLanesCsv(rows))}>{v4("fnmCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("forename-rows.csv", forenameRowsCsv(shown, reviewed))}>{v4("fnmRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("fnmLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("fnmFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("fnmEmpty")}</p>}
      <ul className="c4-forename-list">
        {shown.map((row) => {
          const name = forenameCopy(row.code);
          const tone = forenameHue(row.code);
          return (
            <li key={row.id} className="c4-forename-card" data-lane={forenameLane(row.code) || "open"} data-hue={tone || "none"} data-anna={forenameLane(row.code) === "anna" ? "1" : "0"} data-noah={forenameNoah(row.code) ? "1" : "0"} data-leo={forenameLeo(row.code) ? "1" : "0"} data-max={forenameMax(row.code) ? "1" : "0"} data-open={forenameOpen(row.code) ? "1" : "0"} data-even={forenameEven(row.code) ? "1" : "0"} data-digit={forenameDigit(row.code) ? "1" : "0"} data-letter={forenameLetter(row.code) ? "1" : "0"} data-mixed={forenameMixed(row.code) ? "1" : "0"} data-upper={forenameUpper(row.code) ? "1" : "0"} data-lower={forenameLower(row.code) ? "1" : "0"} data-space={forenameSpace(row.code) ? "1" : "0"} data-vowel={forenameVowel(row.code) ? "1" : "0"} data-tail={forenameTail(row.code) ? "1" : "0"} data-first={forenameFirst(row.code) ? "1" : "0"} data-held={forenameHeld(row.code) ? "1" : "0"} data-join={forenameJoin(row.code) ? "1" : "0"} data-gap={forenameGap(row.code) ? "1" : "0"} data-bead={forenameBead(row.code) ? "1" : "0"}>
              <label className="c4-forename-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-forename-meta">{name || v4("fnmOpen")} · {forenameStamp(row.code) || "—"} · {forenameFamily(row.code) || "—"} · {forenameLength(row.code) ?? "—"} · {laneLabel(v4, forenameLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-forename-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleForenameReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("fnmReviewed") : v4("fnmReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = forenameCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("fnmCopied") : v4("fnmCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("fnmCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
