"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  HELIOMETER_SEPARATIONS,
  HLM_DENSITY_KEY,
  HLM_KEY,
  HLM_VIEW_KEY,
  PMB_KEY,
  PMB_REVIEW_KEY,
  addHeliometer,
  addHeliometerTag,
  addHeliometerView,
  briskHeliometer,
  bulkHeliometerFlare,
  bulkHeliometerSplit,
  bulkHeliometerTag,
  bulkHeliometerVault,
  bulkPlumbReview,
  busiestHalfReader,
  caseHeliometerFocused,
  cycleGlass,
  dropHeliometerView,
  editHeliometer,
  editHeliometerNote,
  fairHalfReader,
  glassFocused,
  heliometerCopy,
  heliometerCounts,
  heliometerCsv,
  heliometerDensity,
  heliometerReaders,
  heliometerBars,
  heliometerTimeline,
  idleHeliometer,
  innerSeparation,
  lanePlumbCount,
  lateHeliometer,
  leadingPlumb,
  leadingPlumbHue,
  liftSecondFocused,
  lowerSecondFocused,
  lowerSlideFocused,
  moveHeliometerFocus,
  outerSeparation,
  overdueHeliometer,
  plumbBob,
  plumbCopy,
  plumbDrop,
  plumbEven,
  plumbEvening,
  plumbFirst,
  plumbHeld,
  plumbHue,
  plumbLane,
  plumbLanes,
  plumbLanesCsv,
  plumbLeap,
  plumbMark,
  plumbMinutes,
  plumbMorning,
  plumbOpen,
  plumbRowsCsv,
  plumbShare,
  plumbSlack,
  plumbSoon,
  plumbSpace,
  plumbStamp,
  plumbStep,
  plumbTail,
  plumbToday,
  plumbTwin,
  plumbWeekday,
  plumbWeekend,
  presentPlumbLanes,
  raiseSlideFocused,
  readHeliometerViews,
  readHeliometers,
  readHiddenPlumb,
  readReviewedPlumb,
  reminderHeliometers,
  restingHeliometer,
  setHeliometerCase,
  setHeliometerGlass,
  setHeliometerSplit,
  setHeliometerStar,
  setHeliometerVault,
  sortHeliometers,
  splitHeliometerFocused,
  starHeliometerFocused,
  suggestHeliometerGlass,
  suggestSecond,
  suggestSeparation,
  tagHeliometerFocused,
  togglePlumb,
  togglePlumbReview,
  visibleHeliometers,
  visiblePlumb,
  visiblePlumbLanes,
  type Heliometer,
  type HeliometerDensity,
  type HeliometerSort,
  type HeliometerTray,
  type HeliometerView,
  type PlumbReview,
  type PlumbRow,
  type PlumbShape,
  type PlumbValue,
} from "@/lib/crmv4/round295";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type FollowRow = { id?: string; name?: string | null; retentionFollowUpAt?: string | null };

const GLASSES = ["CLEAR", "VEIL", "FLARE"] as const;
const SECONDS = ["8", "16", "32"] as const;
const SLIDES = ["2", "4", "8"] as const;
const SHAPES: PlumbShape[] = ["all", "bob", "cord", "weight", "slack", "coil", "drop", "open", "soon", "today", "weekday", "weekend", "morning", "evening", "leap", "first", "even", "twin", "tail", "mark", "space", "held"];

const SEPARATION_KEY: Record<string, CrmV4CopyKey> = {
  near: "hlmNear",
  mid: "hlmMid",
  far: "hlmFar",
  limb: "hlmLimb",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "hlmAuditSave",
  edit: "hlmAuditEdit",
  note: "hlmAuditNote",
  glass: "hlmAuditGlass",
  split: "hlmAuditSplit",
  unsplit: "hlmAuditUnsplit",
  case: "hlmAuditCase",
  resume: "hlmAuditResume",
  vault: "hlmAuditVault",
  open: "hlmAuditOpen",
  tag: "hlmAuditTag",
  slide: "hlmAuditSlide",
  second: "hlmAuditSecond",
  lower: "hlmAuditLower",
  star: "hlmAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  bob: "pmbBob",
  cord: "pmbCord",
  weight: "pmbWeight",
  slack: "pmbSlack",
  coil: "pmbCoil",
  drop: "pmbDrop",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "pmbIvory",
  graphite: "pmbGraphite",
  champagne: "pmbChampagne",
};

const SHAPE_KEY: Record<PlumbShape, CrmV4CopyKey> = {
  all: "pmbShapeAll",
  bob: "pmbShapeBob",
  cord: "pmbShapeCord",
  weight: "pmbShapeWeight",
  slack: "pmbShapeSlack",
  coil: "pmbShapeCoil",
  drop: "pmbShapeDrop",
  open: "pmbShapeOpen",
  soon: "pmbShapeSoon",
  today: "pmbShapeToday",
  weekday: "pmbShapeWeekday",
  weekend: "pmbShapeWeekend",
  morning: "pmbShapeMorning",
  evening: "pmbShapeEvening",
  leap: "pmbShapeLeap",
  first: "pmbShapeFirst",
  even: "pmbShapeEven",
  twin: "pmbShapeTwin",
  tail: "pmbShapeTail",
  mark: "pmbShapeMark",
  space: "pmbShapeSpace",
  held: "pmbShapeHeld",
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

function separationLabel(v4: V4, separation: string): string {
  const key = SEPARATION_KEY[separation];
  return key ? v4(key) : v4("hlmBlankSeparation");
}

function glassLabel(v4: V4, glass: string): string {
  if (glass === "CLEAR") return v4("hlmClear");
  if (glass === "VEIL") return v4("hlmVeil");
  if (glass === "FLARE") return v4("hlmFlare");
  return v4("hlmAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("pmbUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("pmbUnmarked");
}

export function HeliometerHalves({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Heliometer[]>([]);
  const [views, setViews] = useState<HeliometerView[]>([]);
  const [density, setDensity] = useState<HeliometerDensity>("wide");
  const [tray, setTray] = useState<HeliometerTray>("half");
  const [query, setQuery] = useState("");
  const [readerFilter, setReaderFilter] = useState("");
  const [glassFilter, setGlassFilter] = useState("all");
  const [separationFilter, setSeparationFilter] = useState("all");
  const [secondFilter, setSecondFilter] = useState("all");
  const [slideFilter, setSlideFilter] = useState("all");
  const [sort, setSort] = useState<HeliometerSort>("separation");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [reader, setReader] = useState("");
  const [separation, setSeparation] = useState("");
  const [glass, setGlass] = useState("");
  const [secondNo, setSecondNo] = useState("");
  const [slideNo, setSlideNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("near");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readHeliometers(readJson(HLM_KEY, [])));
    setViews(readHeliometerViews(readJson(HLM_VIEW_KEY, [])));
    setDensity(heliometerDensity(readJson(HLM_DENSITY_KEY, "wide")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Heliometer[]) {
    setCards(next);
    writeJson(HLM_KEY, next);
  }
  function storeViews(next: HeliometerView[]) {
    setViews(next);
    writeJson(HLM_VIEW_KEY, next);
  }
  function storeDensity(next: HeliometerDensity) {
    setDensity(next);
    writeJson(HLM_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortHeliometers(visibleHeliometers(cards, tray, query, readerFilter, glassFilter, separationFilter, secondFilter, slideFilter), sort),
    [cards, tray, query, readerFilter, glassFilter, separationFilter, secondFilter, slideFilter, sort],
  );
  const counts = heliometerCounts(cards, shown, desk);
  const bars = heliometerBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = heliometerTimeline(cards);
  const readers = heliometerReaders(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestHeliometerGlass(cards);
  const fair = fairHalfReader(cards, readers.join(","));
  const busy = busiestHalfReader(cards);
  const reminders = reminderHeliometers(cards);
  const secondHint = suggestSecond(cards, clock);
  const separationHint = suggestSeparation(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setReader("");
        setSeparation("");
        setGlass("");
        setSecondNo("");
        setSlideNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveHeliometerFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveHeliometerFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "q" || event.key === "Q") {
        event.preventDefault();
        store(liftSecondFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setHeliometerVault(cards, id, !shown[focusAt]?.vaulted));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        store(glassFocused(cards, id));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        store(caseHeliometerFocused(cards, id));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        store(splitHeliometerFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("heliometer-halves.csv", heliometerCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starHeliometerFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raiseSlideFocused(cards, id));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        store(lowerSlideFocused(cards, id));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        store(lowerSecondFocused(cards, id));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards, desk, focusAt, shown, viewer]);

  return (
    <section className="c4-heliometer" aria-label={v4("hlmTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-heliometer-mast">
        <p className="c4-heliometer-seal" data-logo="mono">{v4("hlmLogo")}</p>
        <div>
          <p className="c4-heliometer-kicker">{v4("hlmSub")}</p>
          <h2 className="c4-title">{v4("hlmTitle")}</h2>
        </div>
        <ol className="c4-heliometer-index" aria-label={v4("hlmTitle")}>
          <li data-tone="gold">{v4("hlmFlare")}</li>
          <li data-tone="ink">{v4("hlmVeil")}</li>
          <li data-tone="ivory">{v4("hlmClear")}</li>
        </ol>
      </header>
      <p className="c4-heliometer-links">
        <Link href={crmv4Href(base, "pmb")}>{v4("pmbTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("hlmCustomers")}</Link>
        <Link href={crmv4Href(base, "quicklinks")}>{v4("qkCloisterKicker")}</Link>
      </p>
      <p className="c4-heliometer-hint">{v4("hlmHint")}</p>
      {viewer && <p className="c4-heliometer-note">{v4("hlmViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-heliometer-notice" role="status">{v4("hlmOverdue")} {counts.overdue}</p>}
      <ol className="c4-heliometer-dials" aria-label={v4("hlmChart")}>
        <li><span>{v4("hlmHalf")}</span><strong>{counts.half}</strong></li>
        <li><span>{v4("hlmCase")}</span><strong>{counts.case}</strong></li>
        <li><span>{v4("hlmVault")}</span><strong>{counts.vault}</strong></li>
        <li><span>{v4("hlmOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("hlmIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("hlmBrisk")}</span><strong>{counts.brisk}</strong></li>
        <li><span>{v4("hlmFair")}</span><strong>{fair || "·"}</strong></li>
        <li><span>{v4("hlmBusy")}</span><strong>{busy || "·"}</strong></li>
      </ol>
      <div className="c4-heliometer-chart" aria-label={v4("hlmChart")}>
        {bars.map((bar) => (
          <button key={bar.separation} type="button" className="c4-heliometer-column" data-on={separationFilter === bar.separation ? "1" : "0"} data-separation={bar.separation} onClick={() => setSeparationFilter(separationFilter === bar.separation ? "all" : bar.separation)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{separationLabel(v4, bar.separation)}</span>
          </button>
        ))}
      </div>
      <div className="c4-heliometer-tools">
        <input ref={searchRef} className="c4-field c4-heliometer-search" aria-label={v4("hlmSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("hlmSearch")} />
        {(["half", "case", "vault"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "half" ? "hlmHalf" : item === "case" ? "hlmCase" : "hlmVault")}</button>
        ))}
        {(["all", "inner", "outer", ...HELIOMETER_SEPARATIONS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={separationFilter === item ? "1" : "0"} onClick={() => setSeparationFilter(item)}>{item === "all" ? v4("hlmAll") : item === "inner" ? v4("hlmInner") : item === "outer" ? v4("hlmOuter") : separationLabel(v4, item)}</button>
        ))}
        {["all", ...GLASSES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={glassFilter === item ? "1" : "0"} onClick={() => setGlassFilter(item)}>{item === "all" ? v4("hlmGlass") : glassLabel(v4, item)}</button>
        ))}
        {["all", ...SECONDS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={secondFilter === item ? "1" : "0"} onClick={() => setSecondFilter(item)}>{item === "all" ? v4("hlmSecond") : item}</button>
        ))}
        {["all", ...SLIDES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={slideFilter === item ? "1" : "0"} onClick={() => setSlideFilter(item)}>{item === "all" ? v4("hlmSlide") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "reader" ? "1" : "0"} onClick={() => setSort(sort === "separation" ? "reader" : "separation")}>{sort === "separation" ? v4("hlmSortSeparation") : v4("hlmSortReader")}</button>
        <button type="button" className="c4-chip" data-on={density === "narrow" ? "1" : "0"} onClick={() => storeDensity(density === "wide" ? "narrow" : "wide")}>{density === "wide" ? v4("hlmWide") : v4("hlmNarrow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("heliometer-halves.csv", heliometerCsv(shown, desk))}>{v4("hlmCsv")}</button>
      </div>
      <div className="c4-heliometer-tools" role="group" aria-label={v4("hlmDesk")}>
        {HELIOMETER_SEPARATIONS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("hlmDesk")} {separationLabel(v4, item)}</button>
        ))}
        <span className="c4-heliometer-meta">{v4("hlmSuggest")} {glassLabel(v4, suggested)} · {secondHint} · {separationLabel(v4, separationHint)}</span>
      </div>
      <form className="c4-heliometer-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addHeliometer(cards, { title, note, reader, separation, glass: glass || suggested, second: secondNo, slide: slideNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("hlmEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("hlmTitle")} />
        <input className="c4-field" aria-label={v4("hlmNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("hlmNote")} />
        <input className="c4-field" aria-label={v4("hlmReaderName")} aria-required={false} value={reader} disabled={viewer} onChange={(event) => setReader(event.target.value)} placeholder={v4("hlmReaderName")} />
        <select className="c4-select" aria-label={v4("hlmDesk")} value={separation} disabled={viewer} onChange={(event) => setSeparation(event.target.value)}>
          <option value="">{v4("hlmBlankSeparation")}</option>
          {HELIOMETER_SEPARATIONS.map((item) => <option key={item} value={item}>{separationLabel(v4, item)}</option>)}
        </select>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("hlmAdd")}</button>
      </form>
      <form className="c4-heliometer-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addHeliometerView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, reader: readerFilter, glass: glassFilter, separation: separationFilter, second: secondFilter, slide: slideFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("hlmViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("hlmViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("hlmSaveView")}</button>
      </form>
      <ul className="c4-heliometer-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setReaderFilter(view.reader); setGlassFilter(view.glass); setSeparationFilter(view.separation); setSecondFilter(view.second); setSlideFilter(view.slide); }}>{v4("hlmApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropHeliometerView(views, view.id))}>{v4("hlmDrop")}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-heliometer-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkHeliometerFlare(cards, picked))}>{v4("hlmBulkFlare")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkHeliometerSplit(cards, picked))}>{v4("hlmBulkSplit")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkHeliometerVault(cards, picked))}>{v4("hlmBulkVault")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkHeliometerTag(cards, picked))}>{v4("hlmBulkTag")}</button>
        </div>
      )}
      <p className="c4-heliometer-meta">{v4("hlmKeys")} · j k n l g v s f q u y x /</p>
      {timeline.length > 0 && (
        <ol className="c4-heliometer-time" aria-label={v4("hlmTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.second}><span>{v4("hlmSecond")} {lane.second}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
        </ol>
      )}
      {reminders.length > 0 && <p className="c4-heliometer-meta">{v4("hlmRemind")} {reminders.join(" · ")}</p>}
      {!shown.length && <p className="c4-heliometer-empty">{v4("hlmEmpty")}</p>}
      <ol className="c4-heliometer-board">
        {shown.map((card, index) => {
          const on = index === focusAt;
          return (
            <li key={card.id} className="c4-heliometer-card" data-on={on ? "1" : "0"} data-overdue={overdueHeliometer(card) ? "1" : "0"} data-idle={idleHeliometer(card) ? "1" : "0"} data-brisk={briskHeliometer(card) ? "1" : "0"} data-resting={restingHeliometer(card) ? "1" : "0"} data-late={lateHeliometer(card, desk) ? "1" : "0"} data-outer={outerSeparation(card.separation) ? "1" : "0"} data-inner={innerSeparation(card.separation) ? "1" : "0"} data-star={card.flagged ? "1" : "0"}>
              <label className="c4-heliometer-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((current) => (current.includes(card.id) ? current.filter((item) => item !== card.id) : [...current, card.id]))} /></label>
              <div>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("hlmEdit")} aria-required={false} value={card.title} onChange={(event) => store(editHeliometer(cards, card.id, event.target.value))} />
                ) : (
                  <strong>{card.title}</strong>
                )}
                <p className="c4-heliometer-meta">{card.reader || v4("hlmReaderName")} · {separationLabel(v4, card.separation)} · {glassLabel(v4, card.glass)} · {card.second ?? "·"} · {v4("hlmSlide")} {card.slide}{card.tags.length ? ` · ${card.tags.join("")}` : ""}{card.audit ? ` · ${AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : card.audit}` : ""}</p>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("hlmNote")} aria-required={false} value={card.note} onChange={(event) => store(editHeliometerNote(cards, card.id, event.target.value))} />
                ) : (
                  card.note && <p className="c4-heliometer-meta">{card.note}</p>
                )}
                <div className="c4-heliometer-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHeliometerSplit(cards, card.id, !card.split))}>{card.split ? v4("hlmUnsplit") : v4("hlmSplit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHeliometerCase(cards, card.id, !card.cased))}>{card.cased ? v4("hlmUncase") : v4("hlmCaseIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHeliometerVault(cards, card.id, !card.vaulted))}>{card.vaulted ? v4("hlmUnstow") : v4("hlmStow")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHeliometerStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("hlmUnstar") : v4("hlmStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHeliometerGlass(cards, card.id, cycleGlass(card.glass)))}>{v4("hlmGlass")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftSecondFocused(cards, card.id))}>{v4("hlmLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerSecondFocused(cards, card.id))}>{v4("hlmLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseSlideFocused(cards, card.id))}>{v4("hlmSlide")}+</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerSlideFocused(cards, card.id))}>{v4("hlmSlide")}−</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addHeliometerTag(cards, card.id, "a"))}>{v4("hlmTag")} a</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(tagHeliometerFocused(cards, card.id))}>{v4("hlmTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(heliometerCopy(card)); }}>{v4("hlmCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="c4-heliometer-meta">{v4("hlmMatched")} {counts.matched} · {ids.length}</p>
    </section>
  );
}

export function PlumbPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: FollowRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<PlumbShape>("all");
  const [review, setReview] = useState<PlumbReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const now = Date.now();

  useEffect(() => {
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  const rows = useMemo<PlumbRow[]>(() => {
    return (queue.data?.users || []).map((row, index) => ({
      id: textField(row.id) || `c${index}`,
      label: textField(row.name),
      follow: { retentionFollowUpAt: textField(row.retentionFollowUpAt) } satisfies PlumbValue,
    }));
  }, [queue.data]);

  useEffect(() => {
    const ids = rows.map((row) => row.id);
    const clock = Date.now();
    setHidden(readHiddenPlumb(readJson(PMB_KEY, []), presentPlumbLanes(rows, clock)));
    setReviewed(readReviewedPlumb(readJson(PMB_REVIEW_KEY, []), ids));
  }, [rows]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(PMB_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(PMB_REVIEW_KEY, next);
  }

  const lanes = visiblePlumbLanes(presentPlumbLanes(rows, now), hidden, showHidden);
  const shown = visiblePlumb(rows, lane, hue, query, review, reviewed, shape, now).filter((row) => !hidden.includes(plumbLane(row.follow, now)) || showHidden);
  const bars = plumbLanes(rows, now);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingPlumb(rows, now);
  const leadHue = leadingPlumbHue(rows, now);
  const soon = rows.filter((row) => plumbSoon(row.follow, now)).length;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveHeliometerFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveHeliometerFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        if (viewer) return;
        const id = shown[focusAt]?.id;
        if (id) storeReviewed(togglePlumbReview(reviewed, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("plumb-rows.csv", plumbRowsCsv(rows, reviewed, now));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusAt, reviewed, rows, shown, viewer, now]);

  return (
    <section className="c4-plumb" aria-label={v4("pmbTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-plumb-mast">
        <p className="c4-plumb-seal" data-logo="mono">{v4("pmbLogo")}</p>
        <div>
          <p className="c4-plumb-kicker">{v4("pmbSub")}</p>
          <h2 className="c4-title">{v4("pmbTitle")}</h2>
        </div>
      </header>
      <ol className="c4-plumb-index" aria-label={v4("pmbTitle")}>
        <li data-tone="gold">{v4("pmbBob")}</li>
        <li data-tone="ink">{v4("pmbDrop")}</li>
        <li data-tone="ivory">{v4("pmbCord")}</li>
        <li data-tone="mist">{v4("pmbWeight")}</li>
        <li data-tone="line">{v4("pmbSlack")}</li>
      </ol>
      <p className="c4-plumb-links">
        <Link href={crmv4Href(base, "hlm")}>{v4("hlmTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("hlmCustomers")}</Link>
        <Link href={crmv4Href(base, "prioglance")}>{v4("pgNaveKicker")}</Link>
      </p>
      <p className="c4-plumb-hint">{v4("pmbHint")}</p>
      {viewer && <p className="c4-plumb-note">{v4("pmbViewer")}</p>}
      {soon > 0 && <p className="c4-plumb-notice" role="status">{v4("pmbSoon")} {soon}</p>}
      {queue.loading && <p className="c4-plumb-meta">{v4("pmbEmpty")}</p>}
      {queue.error && <p className="c4-plumb-meta">{queue.error}</p>}
      <ul className="c4-plumb-kpis" aria-label={v4("pmbRules")}>
        <li><span>{v4("pmbLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("pmbUnmarked")}</strong></li>
        <li><span>{v4("pmbToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("pmbUnmarked")}</strong></li>
        <li><span>{v4("pmbBob")}</span><strong>{lanePlumbCount(rows, "bob", now)}</strong></li>
        <li><span>{v4("pmbDrop")}</span><strong>{lanePlumbCount(rows, "drop", now)}</strong></li>
        <li><span>{v4("pmbShare")}</span><strong>{plumbShare(lanePlumbCount(rows, "drop", now), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("pmbOpen")}</span><strong>{rows.filter((row) => plumbOpen(row.follow, now)).length}</strong></li>
        <li><span>{v4("pmbToday")}</span><strong>{rows.filter((row) => plumbToday(row.follow, now)).length}</strong></li>
        <li><span>{v4("pmbHeld")}</span><strong>{rows.filter((row) => plumbHeld(row.follow, now)).length}</strong></li>
        <li><span>{v4("pmbSlack")}</span><strong>{rows.filter((row) => plumbSlack(row.follow, now)).length}</strong></li>
      </ul>
      <div className="c4-plumb-chart" aria-label={v4("pmbRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-plumb-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-plumb-tools">
        <input ref={searchRef} className="c4-field c4-plumb-search" aria-label={v4("pmbSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("pmbSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("pmbAll") : hueLabel(v4, item)}</button>
        ))}
        {SHAPES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("pmbAll") : item === "reviewed" ? v4("pmbReviewed") : v4("pmbFresh")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("pmbShow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("plumb-lanes.csv", plumbLanesCsv(rows, now))}>{v4("pmbCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("plumb-rows.csv", plumbRowsCsv(rows, reviewed, now))}>{v4("pmbRowCsv")}</button>
      </div>
      <ul className="c4-plumb-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(togglePlumb(hidden, item))}>{hidden.includes(item) ? v4("pmbShow") : v4("pmbHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-plumb-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPlumbReview(reviewed, picked, true))}>{v4("pmbBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPlumbReview(reviewed, picked, false))}>{v4("pmbBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-plumb-empty">{v4("pmbEmpty")}</p>}
      <ol className="c4-plumb-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          const minutes = plumbMinutes(row.follow, now);
          return (
            <li key={row.id} className="c4-plumb-card" data-on={index === focusAt ? "1" : "0"} data-lane={plumbLane(row.follow, now)} data-hue={plumbHue(row.follow, now)} data-reviewed={seen ? "1" : "0"} data-bob={plumbBob(row.follow, now) ? "1" : "0"} data-drop={plumbDrop(row.follow, now) ? "1" : "0"} data-slack={plumbSlack(row.follow, now) ? "1" : "0"} data-today={plumbToday(row.follow, now) ? "1" : "0"} data-soon={plumbSoon(row.follow, now) ? "1" : "0"}>
              <p className="c4-plumb-stamp">{plumbStamp(row.follow, now) || "·"}</p>
              <label className="c4-plumb-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("pmbUnmarked")}</strong>
                <p className="c4-plumb-meta">{laneLabel(v4, plumbLane(row.follow, now))} · {hueLabel(v4, plumbHue(row.follow, now))} · {v4("pmbStep")} {plumbStep(row.follow, now)}{minutes !== null ? ` · ${minutes}m` : ""}{plumbWeekday(row.follow, now) ? ` · ${v4("pmbWeekday")}` : ""}{plumbWeekend(row.follow, now) ? ` · ${v4("pmbWeekend")}` : ""}{plumbMorning(row.follow, now) ? ` · ${v4("pmbMorning")}` : ""}{plumbEvening(row.follow, now) ? ` · ${v4("pmbEvening")}` : ""}{plumbEven(row.follow, now) ? ` · ${v4("pmbEven")}` : ""}{plumbLeap(row.follow, now) ? ` · ${v4("pmbLeap")}` : ""}{plumbFirst(row.follow, now) ? ` · ${v4("pmbFirst")}` : ""}{plumbHeld(row.follow, now) ? ` · ${v4("pmbHeld")}` : ""}{plumbSoon(row.follow, now) ? ` · ${v4("pmbSoon")}` : ""}{plumbTwin(row.follow, now) ? ` · ${v4("pmbTwin")}` : ""}{plumbTail(row.follow) ? ` · ${v4("pmbTail")}` : ""}{plumbMark(row.follow) ? ` · ${v4("pmbMark")}` : ""}{plumbSpace(row.follow) ? ` · ${v4("pmbSpace")}` : ""}{plumbOpen(row.follow, now) ? ` · ${v4("pmbOpen")}` : ""}</p>
                <div className="c4-plumb-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(togglePlumbReview(reviewed, row.id))}>{seen ? v4("pmbReviewed") : v4("pmbReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(plumbCopy(row.follow)); setCopied(row.id); }}>{copied === row.id ? v4("pmbCopied") : v4("pmbCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
