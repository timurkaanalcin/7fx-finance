"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  ATP_KEY,
  ATP_REVIEW_KEY,
  CAX_DENSITY_KEY,
  CAX_KEY,
  CAX_LIMBS,
  CAX_VIEW_KEY,
  addCoaxial,
  addCoaxialTag,
  addCoaxialView,
  briskCoaxial,
  bulkTypeplateReview,
  bulkCoaxialCoffer,
  bulkCoaxialGraphite,
  bulkCoaxialPoise,
  bulkCoaxialTag,
  busiestSetter,
  dropCoaxialView,
  editCoaxial,
  editCoaxialNote,
  typeplateBead,
  typeplateCopy,
  typeplateDigit,
  typeplateEven,
  typeplateFamily,
  typeplateFirst,
  typeplateGap,
  typeplateHeld,
  typeplateVip,
  typeplateHue,
  typeplateJoin,
  typeplateDemo,
  typeplateLane,
  typeplateLanes,
  typeplateLanesCsv,
  typeplateLength,
  typeplateLetter,
  typeplateLower,
  typeplateMixed,
  typeplateOpen,
  typeplateRowsCsv,
  typeplateShare,
  typeplateSpace,
  typeplateStamp,
  typeplateTail,
  typeplateUpper,
  typeplatePro,
  typeplateVowel,
  fairSetter,
  filmFocused,
  coaxialBars,
  coaxialCopy,
  coaxialCounts,
  coaxialCsv,
  coaxialDensity,
  coaxialInner,
  coaxialOuter,
  coaxialTimeline,
  coaxialSetters,
  idleCoaxial,
  laneTypeplateCount,
  lateCoaxial,
  leadingTypeplate,
  leadingTypeplateHue,
  lowerBeatFocused,
  lowerRateFocused,
  moveCoaxialFocus,
  overdueCoaxial,
  pegCoaxialFocused,
  presentTypeplateLanes,
  raiseBeatFocused,
  raiseRateFocused,
  readHiddenTypeplate,
  readCoaxialRules,
  readCoaxialViews,
  readReviewedTypeplate,
  reminderCoaxialRules,
  restingCoaxial,
  setCoaxialCoffer,
  setCoaxialFilm,
  setCoaxialFocused,
  setCoaxialPeg,
  setCoaxialPoise,
  setCoaxialStar,
  sortCoaxialRules,
  starCoaxialFocused,
  suggestTurn,
  suggestFinish,
  suggestPart,
  toggleTypeplate,
  toggleTypeplateReview,
  visibleTypeplate,
  visibleTypeplateLanes,
  visibleCoaxialRules,
  type TypeplateReview,
  type TypeplateRow,
  type TypeplateShape,
  type TypeplateValue,
  type Coaxial,
  type CoaxialDensity,
  type CoaxialSort,
  type CoaxialTray,
  type CoaxialView,
} from "@/lib/crmv4/round337";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const BEATS = ["3", "9", "15", "21"] as const;
const RATES = ["2", "5", "8"] as const;

const LIMB_KEY: Record<string, CrmV4CopyKey> = {
  escape: "caxEscape",
  pallet: "caxPallet",
  impulse: "caxImpulse",
  locking: "caxLocking",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "caxAuditSave",
  edit: "caxAuditEdit",
  note: "caxAuditNote",
  film: "caxAuditFilm",
  poise: "caxAuditPoise",
  free: "caxAuditFree",
  peg: "caxAuditPeg",
  return: "caxAuditReturn",
  coffer: "caxAuditCoffer",
  open: "caxAuditOpen",
  tag: "caxAuditTag",
  rate: "caxAuditRate",
  beat: "caxAuditBeat",
  lower: "caxAuditLower",
  star: "caxAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  standard: "ctpStandard",
  vip: "ctpVip",
  pro: "ctpPro",
  demo: "ctpDemo",
  join: "ctpJoin",
  gap: "ctpGap",
  bead: "ctpBead",
  ribbon: "ctpRibbon",
  mark: "ctpMark",
  vowel: "ctpVowel",
  plain: "ctpPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "ctpChampagne",
  ivory: "ctpIvory",
  graphite: "ctpGraphite",
};

const SHAPE_KEY: Record<TypeplateShape, CrmV4CopyKey> = {
  all: "ctpShapeAll",
  standard: "ctpShapeStandard",
  vip: "ctpShapeVip",
  pro: "ctpShapePro",
  demo: "ctpShapeDemo",
  join: "ctpShapeJoin",
  gap: "ctpShapeGap",
  bead: "ctpShapeBead",
  ribbon: "ctpShapeRibbon",
  mark: "ctpShapeMark",
  vowel: "ctpShapeVowel",
  plain: "ctpShapePlain",
  open: "ctpShapeOpen",
  soon: "ctpShapeOpen",
  letter: "ctpShapePlain",
  mixed: "ctpShapeMark",
  upper: "ctpShapeStandard",
  lower: "ctpShapePlain",
  space: "ctpShapeGap",
  even: "ctpShapeEven",
  odd: "ctpShapeEven",
  tail: "ctpShapeMark",
  first: "ctpShapePlain",
  held: "ctpShapeRibbon",
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
  return key ? v4(key) : v4("caxBlankLimb");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("caxGilt");
  if (film === "IVORY") return v4("caxIvory");
  if (film === "GRAPHITE") return v4("caxGraphite");
  return v4("caxAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("ctpBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("ctpBlank");
}

export function CoaxialRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Coaxial[]>([]);
  const [views, setViews] = useState<CoaxialView[]>([]);
  const [density, setDensity] = useState<CoaxialDensity>("airy");
  const [tray, setTray] = useState<CoaxialTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [limbFilter, setLimbFilter] = useState("all");
  const [beatFilter, setBeatFilter] = useState("all");
  const [rateFilter, setRateFilter] = useState("all");
  const [sort, setSort] = useState<CoaxialSort>("limb");
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
  const [station, setStation] = useState("escape");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readCoaxialRules(readJson(CAX_KEY, [])));
    setViews(readCoaxialViews(readJson(CAX_VIEW_KEY, [])));
    setDensity(coaxialDensity(readJson(CAX_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Coaxial[]) {
    setCards(next);
    writeJson(CAX_KEY, next);
  }
  function storeViews(next: CoaxialView[]) {
    setViews(next);
    writeJson(CAX_VIEW_KEY, next);
  }
  function storeDensity(next: CoaxialDensity) {
    setDensity(next);
    writeJson(CAX_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortCoaxialRules(visibleCoaxialRules(cards, tray, query, setterFilter, filmFilter, limbFilter, beatFilter, rateFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, limbFilter, beatFilter, rateFilter, sort],
  );
  const counts = coaxialCounts(cards, shown, station);
  const bars = coaxialBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = coaxialTimeline(cards);
  const reminders = reminderCoaxialRules(cards);
  const setters = coaxialSetters(cards);
  const busy = busiestSetter(cards);
  const fair = fairSetter(cards, setters.join(","));
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
        download("coaxial-rules.csv", coaxialCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveCoaxialFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveCoaxialFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addCoaxial(cards, { title, note, setter: setter, limb, beat: beatNo, film, rate: rateNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-coaxial" aria-label={v4("caxTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-coaxial-mast">
        <p className="c4-coaxial-seal" data-logo="mono">{v4("caxLogo")}</p>
        <div>
          <p className="c4-coaxial-kicker">{v4("caxSub")}</p>
          <h2 className="c4-title">{v4("caxTitle")}</h2>
        </div>
        <p className="c4-coaxial-count">{shown.length}</p>
      </header>
      <p className="c4-coaxial-links">
        <Link href={crmv4Href(base, "ctp")}>{v4("ctpTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("caxCustomers")}</Link>
      </p>
      <p className="c4-coaxial-hint">{v4("caxHint")}</p>
      {viewer && <p className="c4-coaxial-note">{v4("caxViewer")}</p>}
      <p className="c4-coaxial-meta">{v4("caxFair")} {fair || "—"} · {v4("caxBusy")} {busy || "—"} · {v4("caxSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-coaxial-index" aria-label={v4("caxRemind")}>
        <li data-tone="gold">{v4("caxOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("caxIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("caxBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("caxResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-coaxial-remind c4-coaxial-notices" role="status" aria-label={v4("caxRemind")}>
          {reminders.map((name) => <li key={name}>{v4("caxOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-coaxial-chart" aria-label={v4("caxChart")}>
        {bars.map((bar) => (
          <button key={bar.limb} type="button" className="c4-coaxial-column" data-on={limbFilter === bar.limb ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === bar.limb ? "all" : bar.limb)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.limb)}</span>
          </button>
        ))}
      </div>
      <form className="c4-coaxial-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("caxEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("caxEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("caxNote")}<input className="c4-field" aria-label={v4("caxNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("caxSetter")}<input className="c4-field" aria-label={v4("caxSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("caxLimb")}<select className="c4-field" aria-label={v4("caxLimb")} value={limb} disabled={viewer} onChange={(event) => setLimb(event.target.value)}><option value="">{v4("caxBlankLimb")}</option>{CAX_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("caxFilm")}<select className="c4-field" aria-label={v4("caxFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("caxAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("caxQuarter")}<select className="c4-field" aria-label={v4("caxQuarter")} value={beatNo} disabled={viewer} onChange={(event) => setBeatNo(event.target.value)}><option value="">{v4("caxAll")}</option>{BEATS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("caxStrike")}<select className="c4-field" aria-label={v4("caxStrike")} value={rateNo} disabled={viewer} onChange={(event) => setRateNo(event.target.value)}><option value="">{v4("caxAll")}</option>{RATES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("caxTag")}<input className="c4-field" aria-label={v4("caxTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("caxAdd")}</button>
      </form>
      <div className="c4-coaxial-tools">
        <input ref={searchRef} className="c4-field c4-coaxial-search" aria-label={v4("caxSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("caxSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "caxBoard" : item === "peg" ? "caxPeg" : "caxCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={limbFilter === "inner" ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === "inner" ? "all" : "inner")}>{v4("caxInner")}</button>
        <button type="button" className="c4-chip" data-on={limbFilter === "outer" ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === "outer" ? "all" : "outer")}>{v4("caxOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "limb" : "setter")}>{sort === "setter" ? v4("caxSortSetter") : v4("caxSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("caxClose") : v4("caxAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("caxTimeline")}</button>
        <label className="c4-lab">{v4("caxDesk")}<select className="c4-field" aria-label={v4("caxDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{CAX_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-coaxial-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addCoaxialView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, limb: limbFilter, beat: beatFilter, rate: rateFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("caxViewName")}<input className="c4-field" aria-label={v4("caxViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("caxSaveView")}</button>
      </form>
      <ul className="c4-coaxial-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setLimbFilter(view.limb); setBeatFilter(view.beat); setRateFilter(view.rate); }}>{v4("caxApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropCoaxialView(views, view.id))}>{v4("caxDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-coaxial-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCoaxialPoise(cards, picked))}>{v4("caxBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCoaxialCoffer(cards, picked))}>{v4("caxBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCoaxialGraphite(cards, picked))}>{v4("caxBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCoaxialTag(cards, picked))}>{v4("caxBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("coaxial-rules.csv", coaxialCsv(shown, station))}>{v4("caxCsv")}</button>
        <p className="c4-coaxial-meta">{v4("caxKeys")} / n x a j k · {v4("caxQuiet")} {counts.quiet} · {v4("caxInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-coaxial-time" aria-label={v4("caxTimeline")}>
          {timeline.map((lane) => <li key={lane.beat}><span>{lane.beat}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("caxEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-coaxial-list">
          {shown.map((card) => {
            const late = lateCoaxial(card, station);
            return (
              <li key={card.id} className="c4-coaxial-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleCoaxial(card) ? "1" : "0"} data-brisk={briskCoaxial(card) ? "1" : "0"} data-overdue={overdueCoaxial(card) ? "1" : "0"} data-resting={restingCoaxial(card) ? "1" : "0"} data-inner={coaxialInner(card.limb) ? "1" : "0"} data-outer={coaxialOuter(card.limb) ? "1" : "0"}>
                <label className="c4-coaxial-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCoaxial(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("caxEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("caxApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCoaxialNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("caxNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-coaxial-meta">{limbLabel(v4, card.limb)} · {filmLabel(v4, card.film)} · {card.beat ?? "—"} · {card.rate} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "caxAuditSave")}` : ""}{late ? ` · ${v4("caxOverdue")}` : ""}</p>
                </div>
                <div className="c4-coaxial-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("caxEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCoaxialPoise(cards, card.id, !card.poised))}>{card.poised ? v4("caxFree") : v4("caxPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCoaxialFilm(cards, card.id, suggestedFilm))}>{v4("caxSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCoaxialPeg(cards, card.id, !card.pegged))}>{card.pegged ? v4("caxUnpeg") : v4("caxPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCoaxialCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("caxUncoffer") : v4("caxCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCoaxialStar(cards, card.id, !card.starred))}>{card.starred ? v4("caxUnstar") : v4("caxStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCoaxialTag(cards, card.id, "a"))}>{v4("caxTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBeatFocused(cards, card.id))}>{v4("caxRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBeatFocused(cards, card.id))}>{v4("caxLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseRateFocused(cards, card.id))}>{v4("caxStrike")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRateFocused(cards, card.id))}>{v4("caxStrike")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(filmFocused(cards, card.id))}>{v4("caxFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCoaxialFocused(cards, card.id))}>{v4("caxPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pegCoaxialFocused(cards, card.id))}>{v4("caxPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starCoaxialFocused(cards, card.id))}>{v4("caxStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(coaxialCopy(card))}>{v4("caxCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type TypeplateUser = { id?: string; name?: string | null; accountType?: string | null };

export function TypeplatePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TypeplateUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<TypeplateShape>("all");
  const [review, setReview] = useState<TypeplateReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): TypeplateRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { accountType: textField(row.accountType) } satisfies TypeplateValue,
    };
  }).filter((row): row is TypeplateRow => Boolean(row));
  const present = presentTypeplateLanes(rows);
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
    const next = readHiddenTypeplate(readJson(ATP_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(ATP_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedTypeplate(readJson(ATP_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(ATP_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleTypeplateLanes(present, hidden, showHidden);
  const shown = visibleTypeplate(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = typeplateLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = typeplateLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingTypeplate(rows);
  const leadHue = leadingTypeplateHue(rows);
  const whole = rows.filter((row) => typeplateLane(row.code)).length;
  const share = typeplateShare(laneTypeplateCount(rows, "standard"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("typeplate-lanes.csv", typeplateLanesCsv(rows));
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
    writeJson(ATP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(ATP_REVIEW_KEY, next);
  }

  return (
    <section className="c4-typeplate" aria-label={v4("ctpTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-typeplate-mast">
        <p className="c4-typeplate-seal" data-logo="mono">{v4("ctpLogo")}</p>
        <div>
          <p className="c4-typeplate-kicker">{v4("ctpSub")}</p>
          <h2 className="c4-title">{v4("ctpTitle")}</h2>
        </div>
        <p className="c4-typeplate-count">{shown.length}</p>
      </header>
      <p className="c4-typeplate-links">
        <Link href={crmv4Href(base, "cax")}>{v4("caxTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ctpCustomer")}</Link>
      </p>
      <p className="c4-typeplate-hint">{v4("ctpHint")}</p>
      {viewer && <p className="c4-typeplate-note">{v4("ctpViewer")}</p>}
      <p className="c4-typeplate-meta">{v4("ctpLead")} {laneLabel(v4, lead)} · {v4("ctpToneLead")} {hueLabel(v4, leadHue)} · {v4("ctpShare")} {share}</p>
      <div className="c4-typeplate-chart" aria-label={v4("ctpChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-typeplate-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-typeplate-tools">
        <input ref={searchRef} className="c4-field c4-typeplate-search" aria-label={v4("ctpSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ctpSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("ctpShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "ctpAll" : item === "reviewed" ? "ctpReviewed" : "ctpFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("ctpAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as TypeplateShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleTypeplate(hidden, item))}>{hidden.includes(item) ? v4("ctpShow") : v4("ctpHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-typeplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkTypeplateReview(reviewed, picked, true))}>{v4("ctpBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkTypeplateReview(reviewed, picked, false))}>{v4("ctpBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("typeplate-lanes.csv", typeplateLanesCsv(rows))}>{v4("ctpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("typeplate-rows.csv", typeplateRowsCsv(shown, reviewed))}>{v4("ctpRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("ctpLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("ctpFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("ctpEmpty")}</p>}
      <ul className="c4-typeplate-list">
        {shown.map((row) => {
          const name = typeplateCopy(row.code);
          const tone = typeplateHue(row.code);
          return (
            <li key={row.id} className="c4-typeplate-card" data-lane={typeplateLane(row.code) || "open"} data-hue={tone || "none"} data-standard={typeplateLane(row.code) === "standard" ? "1" : "0"} data-vip={typeplateVip(row.code) ? "1" : "0"} data-pro={typeplatePro(row.code) ? "1" : "0"} data-demo={typeplateDemo(row.code) ? "1" : "0"} data-open={typeplateOpen(row.code) ? "1" : "0"} data-even={typeplateEven(row.code) ? "1" : "0"} data-digit={typeplateDigit(row.code) ? "1" : "0"} data-letter={typeplateLetter(row.code) ? "1" : "0"} data-mixed={typeplateMixed(row.code) ? "1" : "0"} data-upper={typeplateUpper(row.code) ? "1" : "0"} data-lower={typeplateLower(row.code) ? "1" : "0"} data-space={typeplateSpace(row.code) ? "1" : "0"} data-vowel={typeplateVowel(row.code) ? "1" : "0"} data-tail={typeplateTail(row.code) ? "1" : "0"} data-first={typeplateFirst(row.code) ? "1" : "0"} data-held={typeplateHeld(row.code) ? "1" : "0"} data-join={typeplateJoin(row.code) ? "1" : "0"} data-gap={typeplateGap(row.code) ? "1" : "0"} data-bead={typeplateBead(row.code) ? "1" : "0"}>
              <label className="c4-typeplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-typeplate-meta">{name || v4("ctpOpen")} · {typeplateStamp(row.code) || "—"} · {typeplateFamily(row.code) || "—"} · {typeplateLength(row.code) ?? "—"} · {laneLabel(v4, typeplateLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-typeplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleTypeplateReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("ctpReviewed") : v4("ctpReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = typeplateCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("ctpCopied") : v4("ctpCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("ctpCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
