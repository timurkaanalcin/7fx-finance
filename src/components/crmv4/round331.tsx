"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  EQN_KEY,
  EQN_REVIEW_KEY,
  HSP_DENSITY_KEY,
  HSP_KEY,
  HSP_LIMBS,
  HSP_VIEW_KEY,
  addHairspring,
  addHairspringTag,
  addHairspringView,
  briskHairspring,
  bulkEquationReview,
  bulkHairspringCoffer,
  bulkHairspringGraphite,
  bulkHairspringPoise,
  bulkHairspringTag,
  busiestWarden,
  dropHairspringView,
  editHairspring,
  editHairspringNote,
  equationBead,
  equationCopy,
  equationDigit,
  equationEven,
  equationFamily,
  equationFirst,
  equationGap,
  equationHeld,
  equationHue,
  equationJoin,
  equationLane,
  equationLanes,
  equationLanesCsv,
  equationLength,
  equationLetter,
  equationLower,
  equationMixed,
  equationOpen,
  equationRowsCsv,
  equationShare,
  equationSpace,
  equationStamp,
  equationTail,
  equationUpper,
  equationVowel,
  fairWarden,
  filmFocused,
  hairspringBars,
  hairspringCopy,
  hairspringCounts,
  hairspringCsv,
  hairspringDensity,
  hairspringInner,
  hairspringOuter,
  hairspringTimeline,
  hairspringWardens,
  idleHairspring,
  laneEquationCount,
  lateHairspring,
  leadingEquation,
  leadingEquationHue,
  lowerBeatFocused,
  lowerRateFocused,
  moveHairspringFocus,
  overdueHairspring,
  pegHairspringFocused,
  presentEquationLanes,
  raiseBeatFocused,
  raiseRateFocused,
  readHiddenEquation,
  readHairspringRules,
  readHairspringViews,
  readReviewedEquation,
  reminderHairspringRules,
  restingHairspring,
  setHairspringCoffer,
  setHairspringFilm,
  setHairspringFocused,
  setHairspringPeg,
  setHairspringPoise,
  setHairspringStar,
  sortHairspringRules,
  starHairspringFocused,
  suggestBeat,
  suggestFilm,
  suggestLimb,
  toggleEquation,
  toggleEquationReview,
  visibleEquation,
  visibleEquationLanes,
  visibleHairspringRules,
  type EquationReview,
  type EquationRow,
  type EquationShape,
  type EquationValue,
  type Hairspring,
  type HairspringDensity,
  type HairspringSort,
  type HairspringTray,
  type HairspringView,
} from "@/lib/crmv4/round331";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const BEATS = ["2", "5", "8", "11"] as const;
const RATES = ["2", "6", "10"] as const;

const LIMB_KEY: Record<string, CrmV4CopyKey> = {
  collet: "hspCollet",
  coil: "hspCoil",
  stud: "hspStud",
  curb: "hspCurb",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "hspAuditSave",
  edit: "hspAuditEdit",
  note: "hspAuditNote",
  film: "hspAuditFilm",
  poise: "hspAuditPoise",
  free: "hspAuditFree",
  peg: "hspAuditPeg",
  return: "hspAuditReturn",
  coffer: "hspAuditCoffer",
  open: "hspAuditOpen",
  tag: "hspAuditTag",
  rate: "hspAuditRate",
  beat: "hspAuditBeat",
  lower: "hspAuditLower",
  star: "hspAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  code: "eqnCode",
  join: "eqnJoin",
  gap: "eqnGap",
  bead: "eqnBead",
  ribbon: "eqnRibbon",
  mark: "eqnMark",
  vowel: "eqnVowel",
  plain: "eqnPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "eqnChampagne",
  ivory: "eqnIvory",
  graphite: "eqnGraphite",
};

const SHAPE_KEY: Record<EquationShape, CrmV4CopyKey> = {
  all: "eqnShapeAll",
  code: "eqnShapeCode",
  join: "eqnShapeJoin",
  gap: "eqnShapeGap",
  bead: "eqnShapeBead",
  ribbon: "eqnShapeRibbon",
  mark: "eqnShapeMark",
  vowel: "eqnShapeVowel",
  plain: "eqnShapePlain",
  open: "eqnShapeOpen",
  soon: "eqnShapeOpen",
  letter: "eqnShapePlain",
  mixed: "eqnShapeMark",
  upper: "eqnShapeCode",
  lower: "eqnShapePlain",
  space: "eqnShapeGap",
  even: "eqnShapeEven",
  odd: "eqnShapeEven",
  tail: "eqnShapeMark",
  first: "eqnShapePlain",
  held: "eqnShapeRibbon",
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
  return key ? v4(key) : v4("hspBlankLimb");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("hspGilt");
  if (film === "IVORY") return v4("hspIvory");
  if (film === "GRAPHITE") return v4("hspGraphite");
  return v4("hspAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("eqnBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("eqnBlank");
}

export function HairspringRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Hairspring[]>([]);
  const [views, setViews] = useState<HairspringView[]>([]);
  const [density, setDensity] = useState<HairspringDensity>("airy");
  const [tray, setTray] = useState<HairspringTray>("board");
  const [query, setQuery] = useState("");
  const [wardenFilter, setWardenFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [limbFilter, setLimbFilter] = useState("all");
  const [beatFilter, setBeatFilter] = useState("all");
  const [rateFilter, setRateFilter] = useState("all");
  const [sort, setSort] = useState<HairspringSort>("limb");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [warden, setWarden] = useState("");
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
  const [station, setStation] = useState("collet");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readHairspringRules(readJson(HSP_KEY, [])));
    setViews(readHairspringViews(readJson(HSP_VIEW_KEY, [])));
    setDensity(hairspringDensity(readJson(HSP_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Hairspring[]) {
    setCards(next);
    writeJson(HSP_KEY, next);
  }
  function storeViews(next: HairspringView[]) {
    setViews(next);
    writeJson(HSP_VIEW_KEY, next);
  }
  function storeDensity(next: HairspringDensity) {
    setDensity(next);
    writeJson(HSP_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortHairspringRules(visibleHairspringRules(cards, tray, query, wardenFilter, filmFilter, limbFilter, beatFilter, rateFilter), sort),
    [cards, tray, query, wardenFilter, filmFilter, limbFilter, beatFilter, rateFilter, sort],
  );
  const counts = hairspringCounts(cards, shown, station);
  const bars = hairspringBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = hairspringTimeline(cards);
  const reminders = reminderHairspringRules(cards);
  const wardens = hairspringWardens(cards);
  const busy = busiestWarden(cards);
  const fair = fairWarden(cards, wardens.join(","));
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
        download("hairspring-rules.csv", hairspringCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveHairspringFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveHairspringFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addHairspring(cards, { title, note, warden, limb, beat: beatNo, film, rate: rateNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-hairspring" aria-label={v4("hspTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-hairspring-mast">
        <p className="c4-hairspring-seal" data-logo="mono">{v4("hspLogo")}</p>
        <div>
          <p className="c4-hairspring-kicker">{v4("hspSub")}</p>
          <h2 className="c4-title">{v4("hspTitle")}</h2>
        </div>
        <p className="c4-hairspring-count">{shown.length}</p>
      </header>
      <p className="c4-hairspring-links">
        <Link href={crmv4Href(base, "eqn")}>{v4("eqnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("hspCustomers")}</Link>
      </p>
      <p className="c4-hairspring-hint">{v4("hspHint")}</p>
      {viewer && <p className="c4-hairspring-note">{v4("hspViewer")}</p>}
      <p className="c4-hairspring-meta">{v4("hspFair")} {fair || "—"} · {v4("hspBusy")} {busy || "—"} · {v4("hspSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-hairspring-index" aria-label={v4("hspRemind")}>
        <li data-tone="gold">{v4("hspOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("hspIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("hspBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("hspResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-hairspring-remind c4-hairspring-notices" role="status" aria-label={v4("hspRemind")}>
          {reminders.map((name) => <li key={name}>{v4("hspOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-hairspring-chart" aria-label={v4("hspChart")}>
        {bars.map((bar) => (
          <button key={bar.limb} type="button" className="c4-hairspring-column" data-on={limbFilter === bar.limb ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === bar.limb ? "all" : bar.limb)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.limb)}</span>
          </button>
        ))}
      </div>
      <form className="c4-hairspring-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("hspEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("hspEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("hspNote")}<input className="c4-field" aria-label={v4("hspNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("hspWarden")}<input className="c4-field" aria-label={v4("hspWarden")} aria-required={false} value={warden} maxLength={24} disabled={viewer} onChange={(event) => setWarden(event.target.value)} /></label>
        <label className="c4-lab">{v4("hspLimb")}<select className="c4-field" aria-label={v4("hspLimb")} value={limb} disabled={viewer} onChange={(event) => setLimb(event.target.value)}><option value="">{v4("hspBlankLimb")}</option>{HSP_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("hspFilm")}<select className="c4-field" aria-label={v4("hspFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("hspAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("hspBeat")}<select className="c4-field" aria-label={v4("hspBeat")} value={beatNo} disabled={viewer} onChange={(event) => setBeatNo(event.target.value)}><option value="">{v4("hspAll")}</option>{BEATS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("hspRate")}<select className="c4-field" aria-label={v4("hspRate")} value={rateNo} disabled={viewer} onChange={(event) => setRateNo(event.target.value)}><option value="">{v4("hspAll")}</option>{RATES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("hspTag")}<input className="c4-field" aria-label={v4("hspTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("hspAdd")}</button>
      </form>
      <div className="c4-hairspring-tools">
        <input ref={searchRef} className="c4-field c4-hairspring-search" aria-label={v4("hspSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("hspSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "hspBoard" : item === "peg" ? "hspPeg" : "hspCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={limbFilter === "inner" ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === "inner" ? "all" : "inner")}>{v4("hspInner")}</button>
        <button type="button" className="c4-chip" data-on={limbFilter === "outer" ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === "outer" ? "all" : "outer")}>{v4("hspOuter")}</button>
        {FILMS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={filmFilter === item ? "1" : "0"} onClick={() => setFilmFilter(filmFilter === item ? "all" : item)}>{filmLabel(v4, item)}</button>
        ))}
        {BEATS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={beatFilter === item ? "1" : "0"} onClick={() => setBeatFilter(beatFilter === item ? "all" : item)}>{item}</button>
        ))}
        {RATES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rateFilter === item ? "1" : "0"} onClick={() => setRateFilter(rateFilter === item ? "all" : item)}>{item}</button>
        ))}
        {wardens.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={wardenFilter === name ? "1" : "0"} onClick={() => setWardenFilter(wardenFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "warden" ? "1" : "0"} onClick={() => setSort(sort === "warden" ? "limb" : "warden")}>{sort === "warden" ? v4("hspSortWarden") : v4("hspSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("hspClose") : v4("hspAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("hspTimeline")}</button>
        <label className="c4-lab">{v4("hspDesk")}<select className="c4-field" aria-label={v4("hspDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{HSP_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-hairspring-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addHairspringView(views, { id, name: viewName, tray, query, warden: wardenFilter, film: filmFilter, limb: limbFilter, beat: beatFilter, rate: rateFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("hspViewName")}<input className="c4-field" aria-label={v4("hspViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("hspSaveView")}</button>
      </form>
      <ul className="c4-hairspring-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setWardenFilter(view.warden); setFilmFilter(view.film); setLimbFilter(view.limb); setBeatFilter(view.beat); setRateFilter(view.rate); }}>{v4("hspApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropHairspringView(views, view.id))}>{v4("hspDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-hairspring-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHairspringPoise(cards, picked))}>{v4("hspBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHairspringCoffer(cards, picked))}>{v4("hspBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHairspringGraphite(cards, picked))}>{v4("hspBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHairspringTag(cards, picked))}>{v4("hspBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("hairspring-rules.csv", hairspringCsv(shown, station))}>{v4("hspCsv")}</button>
        <p className="c4-hairspring-meta">{v4("hspKeys")} / n x a j k · {v4("hspQuiet")} {counts.quiet} · {v4("hspInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-hairspring-time" aria-label={v4("hspTimeline")}>
          {timeline.map((lane) => <li key={lane.beat}><span>{lane.beat}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("hspEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-hairspring-list">
          {shown.map((card) => {
            const late = lateHairspring(card, station);
            return (
              <li key={card.id} className="c4-hairspring-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleHairspring(card) ? "1" : "0"} data-brisk={briskHairspring(card) ? "1" : "0"} data-overdue={overdueHairspring(card) ? "1" : "0"} data-resting={restingHairspring(card) ? "1" : "0"} data-inner={hairspringInner(card.limb) ? "1" : "0"} data-outer={hairspringOuter(card.limb) ? "1" : "0"}>
                <label className="c4-hairspring-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editHairspring(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("hspEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("hspApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editHairspringNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("hspNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-hairspring-meta">{limbLabel(v4, card.limb)} · {filmLabel(v4, card.film)} · {card.beat ?? "—"} · {card.rate} · {card.warden || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "hspAuditSave")}` : ""}{late ? ` · ${v4("hspOverdue")}` : ""}</p>
                </div>
                <div className="c4-hairspring-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("hspEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHairspringPoise(cards, card.id, !card.poised))}>{card.poised ? v4("hspFree") : v4("hspPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHairspringFilm(cards, card.id, suggestedFilm))}>{v4("hspSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHairspringPeg(cards, card.id, !card.pegged))}>{card.pegged ? v4("hspUnpeg") : v4("hspPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHairspringCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("hspUncoffer") : v4("hspCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHairspringStar(cards, card.id, !card.starred))}>{card.starred ? v4("hspUnstar") : v4("hspStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addHairspringTag(cards, card.id, "h"))}>{v4("hspTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBeatFocused(cards, card.id))}>{v4("hspRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBeatFocused(cards, card.id))}>{v4("hspLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseRateFocused(cards, card.id))}>{v4("hspRate")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRateFocused(cards, card.id))}>{v4("hspRate")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(filmFocused(cards, card.id))}>{v4("hspFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHairspringFocused(cards, card.id))}>{v4("hspPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pegHairspringFocused(cards, card.id))}>{v4("hspPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starHairspringFocused(cards, card.id))}>{v4("hspStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(hairspringCopy(card))}>{v4("hspCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type EquationUser = { id?: string; name?: string | null; lastOs?: string | null };

export function EquationPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: EquationUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<EquationShape>("all");
  const [review, setReview] = useState<EquationReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): EquationRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { lastOs: textField(row.lastOs) } satisfies EquationValue,
    };
  }).filter((row): row is EquationRow => Boolean(row));
  const present = presentEquationLanes(rows);
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
    const next = readHiddenEquation(readJson(EQN_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(EQN_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedEquation(readJson(EQN_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(EQN_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleEquationLanes(present, hidden, showHidden);
  const shown = visibleEquation(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = equationLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = equationLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingEquation(rows);
  const leadHue = leadingEquationHue(rows);
  const whole = rows.filter((row) => equationLane(row.code)).length;
  const share = equationShare(laneEquationCount(rows, "code"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("equation-lanes.csv", equationLanesCsv(rows));
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
    writeJson(EQN_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(EQN_REVIEW_KEY, next);
  }

  return (
    <section className="c4-equation" aria-label={v4("eqnTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-equation-mast">
        <p className="c4-equation-seal" data-logo="mono">{v4("eqnLogo")}</p>
        <div>
          <p className="c4-equation-kicker">{v4("eqnSub")}</p>
          <h2 className="c4-title">{v4("eqnTitle")}</h2>
        </div>
        <p className="c4-equation-count">{shown.length}</p>
      </header>
      <p className="c4-equation-links">
        <Link href={crmv4Href(base, "hsp")}>{v4("hspTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("eqnCustomer")}</Link>
      </p>
      <p className="c4-equation-hint">{v4("eqnHint")}</p>
      {viewer && <p className="c4-equation-note">{v4("eqnViewer")}</p>}
      <p className="c4-equation-meta">{v4("eqnLead")} {laneLabel(v4, lead)} · {v4("eqnToneLead")} {hueLabel(v4, leadHue)} · {v4("eqnShare")} {share}</p>
      <div className="c4-equation-chart" aria-label={v4("eqnChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-equation-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-equation-tools">
        <input ref={searchRef} className="c4-field c4-equation-search" aria-label={v4("eqnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("eqnSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("eqnShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "eqnAll" : item === "reviewed" ? "eqnReviewed" : "eqnFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("eqnAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as EquationShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleEquation(hidden, item))}>{hidden.includes(item) ? v4("eqnShow") : v4("eqnHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-equation-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkEquationReview(reviewed, picked, true))}>{v4("eqnBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkEquationReview(reviewed, picked, false))}>{v4("eqnBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("equation-lanes.csv", equationLanesCsv(rows))}>{v4("eqnCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("equation-rows.csv", equationRowsCsv(shown, reviewed))}>{v4("eqnRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("eqnLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("eqnFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("eqnEmpty")}</p>}
      <ul className="c4-equation-list">
        {shown.map((row) => {
          const name = equationCopy(row.code);
          const tone = equationHue(row.code);
          return (
            <li key={row.id} className="c4-equation-card" data-lane={equationLane(row.code) || "open"} data-hue={tone || "none"} data-code={equationLane(row.code) === "code" ? "1" : "0"} data-open={equationOpen(row.code) ? "1" : "0"} data-even={equationEven(row.code) ? "1" : "0"} data-digit={equationDigit(row.code) ? "1" : "0"} data-letter={equationLetter(row.code) ? "1" : "0"} data-mixed={equationMixed(row.code) ? "1" : "0"} data-upper={equationUpper(row.code) ? "1" : "0"} data-lower={equationLower(row.code) ? "1" : "0"} data-space={equationSpace(row.code) ? "1" : "0"} data-vowel={equationVowel(row.code) ? "1" : "0"} data-tail={equationTail(row.code) ? "1" : "0"} data-first={equationFirst(row.code) ? "1" : "0"} data-held={equationHeld(row.code) ? "1" : "0"} data-join={equationJoin(row.code) ? "1" : "0"} data-gap={equationGap(row.code) ? "1" : "0"} data-bead={equationBead(row.code) ? "1" : "0"}>
              <label className="c4-equation-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-equation-meta">{name || v4("eqnOpen")} · {equationStamp(row.code) || "—"} · {equationFamily(row.code) || "—"} · {equationLength(row.code) ?? "—"} · {laneLabel(v4, equationLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-equation-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleEquationReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("eqnReviewed") : v4("eqnReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = equationCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("eqnCopied") : v4("eqnCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("eqnCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
