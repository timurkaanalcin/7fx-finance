"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  ASY_KEY,
  ASY_REVIEW_KEY,
  RXG_QUARTERS,
  RXG_DENSITY_KEY,
  RXG_KEY,
  RXG_VIEW_KEY,
  addRectangulusTag,
  addRectangulusView,
  addRectangulus,
  briskRectangulus,
  bulkAssayReview,
  bulkRectangulusVault,
  bulkRectangulusSighted,
  bulkRectangulusTag,
  bulkRectangulusBone,
  busiestSighter,
  dropRectangulusView,
  editRectangulusNote,
  editRectangulus,
  fairSighter,
  assayCapital,
  assayCopy,
  assayDigit,
  assayEven,
  assayFamily,
  assayFirst,
  assayHeld,
  assayHue,
  assayHyphen,
  assayLane,
  assayLanes,
  assayLanesCsv,
  assayLength,
  assayLetter,
  assayLower,
  assayMixed,
  assayOpen,
  assayPeriod,
  assayRowsCsv,
  assayShare,
  assaySpace,
  assayStamp,
  assayTail,
  assayUpper,
  assayVowel,
  idleRectangulus,
  laneAssayCount,
  lateRectangulus,
  leadingAssay,
  leadingAssayHue,
  liftSpanFocused,
  lowerPinFocused,
  lowerSpanFocused,
  moveRectangulusFocus,
  rectangulusBars,
  rectangulusCopy,
  rectangulusCounts,
  rectangulusCsv,
  rectangulusDensity,
  rectangulusInner,
  rectangulusOuter,
  rectangulusSighters,
  rectangulusTimeline,
  overdueRectangulus,
  presentAssayLanes,
  raisePinFocused,
  readHiddenAssays,
  readRectangulusViews,
  readRectangulusRules,
  readReviewedAssays,
  reminderRectangulusRules,
  restingRectangulus,
  setRectangulusFocused,
  setRectangulusVault,
  setRectangulusSighted,
  setRectangulusSleeve,
  setRectangulusStar,
  setRectangulusCloth,
  sortRectangulusRules,
  starRectangulusFocused,
  suggestSpan,
  suggestQuarter,
  suggestFinish,
  toggleAssay,
  toggleAssayReview,
  visibleAssayLanes,
  visibleAssays,
  visibleRectangulusRules,
  finishFocused,
  sleeveRectangulusFocused,
  type AssayReview,
  type AssayRow,
  type AssayShape,
  type AssayValue,
  type RectangulusDensity,
  type RectangulusSort,
  type RectangulusTray,
  type RectangulusView,
  type Rectangulus,
} from "@/lib/crmv4/round304";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FINISHES = ["BRASS", "EBONY", "BONE"] as const;
const SPANS = ["10", "20", "40", "80"] as const;
const PINS = ["2", "5", "8"] as const;

const CLIMATE_KEY: Record<string, CrmV4CopyKey> = {
  dawn: "rxgDawn",
  noon: "rxgNoon",
  dusk: "rxgDusk",
  night: "rxgNight",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "rxgAuditSave",
  edit: "rxgAuditEdit",
  note: "rxgAuditNote",
  finish: "rxgAuditFinish",
  set: "rxgAuditSet",
  clear: "rxgAuditClear",
  sleeve: "rxgAuditSleeve",
  resume: "rxgAuditResume",
  vault: "rxgAuditVault",
  open: "rxgAuditOpen",
  tag: "rxgAuditTag",
  pin: "rxgAuditPin",
  span: "rxgAuditSpan",
  lower: "rxgAuditLower",
  star: "rxgAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "asyHouse",
  fort: "asyFort",
  harbor: "asyHarbor",
  digit: "asyDigit",
  spark: "asySpark",
  scroll: "asyScroll",
  vowel: "asyVowel",
  post: "asyPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "asyChampagne",
  ivory: "asyIvory",
  graphite: "asyGraphite",
};

const SHAPE_KEY: Record<AssayShape, CrmV4CopyKey> = {
  all: "asyShapeAll",
  house: "asyShapeHouse",
  fort: "asyShapeFort",
  harbor: "asyShapeHarbor",
  digit: "asyShapeDigit",
  spark: "asyShapeSpark",
  scroll: "asyShapeScroll",
  vowel: "asyShapeVowel",
  post: "asyShapePost",
  open: "asyShapeOpen",
  soon: "asyShapeSoon",
  letter: "asyShapeLetter",
  mixed: "asyShapeMixed",
  upper: "asyShapeUpper",
  lower: "asyShapeLower",
  space: "asyShapeSpace",
  even: "asyShapeEven",
  odd: "asyShapeOdd",
  tail: "asyShapeTail",
  first: "asyShapeFirst",
  held: "asyShapeHeld",
  hyphen: "asyShapeHyphen",
  period: "asyShapePeriod",
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

function quarterLabel(v4: V4, quarter: string): string {
  const key = CLIMATE_KEY[quarter];
  return key ? v4(key) : v4("rxgBlankQuarter");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "BRASS") return v4("rxgBrass");
  if (finish === "EBONY") return v4("rxgEbony");
  if (finish === "BONE") return v4("rxgBone");
  return v4("rxgAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("asyUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("asyUnmarked");
}

export function RectangulusRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Rectangulus[]>([]);
  const [views, setViews] = useState<RectangulusView[]>([]);
  const [density, setDensity] = useState<RectangulusDensity>("broad");
  const [tray, setTray] = useState<RectangulusTray>("court");
  const [query, setQuery] = useState("");
  const [sighterFilter, setSighterFilter] = useState("");
  const [finishFilter, setFinishFilter] = useState("all");
  const [quarterFilter, setQuarterFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [pinFilter, setPinFilter] = useState("all");
  const [sort, setSort] = useState<RectangulusSort>("quarter");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [sighter, setSighter] = useState("");
  const [quarter, setQuarter] = useState("");
  const [finish, setFinish] = useState("");
  const [spanNo, setSpanNo] = useState("");
  const [pinNo, setPinNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("dawn");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readRectangulusRules(readJson(RXG_KEY, [])));
    setViews(readRectangulusViews(readJson(RXG_VIEW_KEY, [])));
    setDensity(rectangulusDensity(readJson(RXG_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Rectangulus[]) {
    setCards(next);
    writeJson(RXG_KEY, next);
  }
  function storeViews(next: RectangulusView[]) {
    setViews(next);
    writeJson(RXG_VIEW_KEY, next);
  }
  function storeDensity(next: RectangulusDensity) {
    setDensity(next);
    writeJson(RXG_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortRectangulusRules(visibleRectangulusRules(cards, tray, query, sighterFilter, finishFilter, quarterFilter, spanFilter, pinFilter), sort),
    [cards, tray, query, sighterFilter, finishFilter, quarterFilter, spanFilter, pinFilter, sort],
  );
  const counts = rectangulusCounts(cards, shown, desk);
  const bars = rectangulusBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = rectangulusTimeline(cards);
  const sighters = rectangulusSighters(cards);
  const suggested = suggestFinish(cards);
  const fair = fairSighter(cards, sighters.join(","));
  const busy = busiestSighter(cards);
  const reminders = reminderRectangulusRules(cards);
  const spanHint = suggestSpan(cards, clock);
  const quarterHint = suggestQuarter(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setSighter("");
        setQuarter("");
        setFinish("");
        setSpanNo("");
        setPinNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveRectangulusFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveRectangulusFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        store(liftSpanFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setRectangulusVault(cards, id, !shown[focusAt]?.held));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(finishFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(sleeveRectangulusFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setRectangulusFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("rectangulus-rules.csv", rectangulusCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starRectangulusFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raisePinFocused(cards, id));
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        store(lowerPinFocused(cards, id));
        return;
      }
      if (event.key === "o" || event.key === "O") {
        event.preventDefault();
        store(lowerSpanFocused(cards, id));
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
    <section className="c4-rectangulus" aria-label={v4("rxgTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-rectangulus-mast">
        <p className="c4-rectangulus-seal" data-logo="mono">{v4("rxgLogo")}</p>
        <div>
          <p className="c4-rectangulus-kicker">{v4("rxgSub")}</p>
          <h2 className="c4-title">{v4("rxgTitle")}</h2>
        </div>
        <p className="c4-rectangulus-count">{counts.matched}</p>
      </header>
      <ol className="c4-rectangulus-index" aria-label={v4("rxgTitle")}>
        <li data-tone="gold">{v4("rxgCourt")} {counts.court}</li>
        <li data-tone="ink">{v4("rxgOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("rxgHouse")} {counts.house}</li>
      </ol>
      <p className="c4-rectangulus-links">
        <Link href={crmv4Href(base, "asy")}>{v4("asyTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rxgCustomers")}</Link>
      </p>
      <p className="c4-rectangulus-hint">{v4("rxgHint")}</p>
      {viewer && <p className="c4-rectangulus-note">{v4("rxgViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-rectangulus-notice" role="status">{v4("rxgOverdue")} {counts.overdue}</p>}
      <ol className="c4-rectangulus-dials" aria-label={v4("rxgChart")}>
        <li>{v4("rxgCourt")} {counts.court}</li>
        <li>{v4("rxgSleeve")} {counts.sleeve}</li>
        <li>{v4("rxgVault")} {counts.vault}</li>
        <li>{v4("rxgInner")} {counts.inner}</li>
        <li>{v4("rxgOuter")} {counts.outer}</li>
        <li>{v4("rxgWide")} {counts.wide}</li>
        <li>{v4("rxgStar")} {counts.starred}</li>
        <li>{v4("rxgIdle")} {counts.idle}</li>
        <li>{v4("rxgBrisk")} {counts.brisk}</li>
        <li>{v4("rxgResting")} {counts.resting}</li>
      </ol>
      <div className="c4-rectangulus-chart" aria-label={v4("rxgChart")}>
        {bars.map((bar) => (
          <button key={bar.quarter} type="button" className="c4-rectangulus-column" data-on={quarterFilter === bar.quarter ? "1" : "0"} data-quarter={bar.quarter} onClick={() => setQuarterFilter(quarterFilter === bar.quarter ? "all" : bar.quarter)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{quarterLabel(v4, bar.quarter)}</span>
          </button>
        ))}
      </div>
      <div className="c4-rectangulus-tools">
        <input ref={searchRef} className="c4-field c4-rectangulus-search" aria-label={v4("rxgSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rxgSearch")} />
        {(["court", "sleeve", "vault"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "court" ? "rxgCourt" : item === "sleeve" ? "rxgSleeve" : "rxgVault")}</button>
        ))}
        {(["all", "inner", "outer", ...RXG_QUARTERS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={quarterFilter === item ? "1" : "0"} onClick={() => setQuarterFilter(item)}>{item === "all" ? v4("rxgAll") : item === "inner" ? v4("rxgInner") : item === "outer" ? v4("rxgOuter") : quarterLabel(v4, item)}</button>
        ))}
        {(["all", ...FINISHES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={finishFilter === item ? "1" : "0"} onClick={() => setFinishFilter(item)}>{item === "all" ? v4("rxgAll") : finishLabel(v4, item)}</button>
        ))}
        {(["all", ...SPANS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={spanFilter === item ? "1" : "0"} onClick={() => setSpanFilter(item)}>{item === "all" ? v4("rxgSpan") : item}</button>
        ))}
        {(["all", ...PINS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={pinFilter === item ? "1" : "0"} onClick={() => setPinFilter(item)}>{item === "all" ? v4("rxgPin") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "quarter" ? "1" : "0"} onClick={() => setSort("quarter")}>{v4("rxgSortQuarter")}</button>
        <button type="button" className="c4-chip" data-on={sort === "sighter" ? "1" : "0"} onClick={() => setSort("sighter")}>{v4("rxgSortSighter")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("rxgTight") : v4("rxgBroad")}</button>
        {RXG_QUARTERS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("rxgDesk")} {quarterLabel(v4, item)}</button>
        ))}
        {sighters.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={sighterFilter === name ? "1" : "0"} onClick={() => setSighterFilter(sighterFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-rectangulus-meta">{v4("rxgSuggest")} {finishLabel(v4, suggested)} · {spanHint} · {quarterLabel(v4, quarterHint)} · {v4("rxgFair")} {fair || "—"} · {v4("rxgBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-rectangulus-remind" aria-label={v4("rxgRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-rectangulus-time" aria-label={v4("rxgTimeline")}>
          {timeline.map((lane) => <li key={lane.span}>{lane.span} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-rectangulus-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addRectangulus(cards, { title, note, sighter, quarter, finish, span: spanNo, pin: pinNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("rxgEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("rxgEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("rxgNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("rxgNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("rxgSighter")} aria-required={false} value={sighter} onChange={(event) => setSighter(event.target.value)} placeholder={v4("rxgSighter")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("rxgDesk")} value={quarter} onChange={(event) => setQuarter(event.target.value)} disabled={viewer}>
          <option value="">{v4("rxgBlankQuarter")}</option>
          {RXG_QUARTERS.map((item) => <option key={item} value={item}>{quarterLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("rxgFinish")} value={finish} onChange={(event) => setFinish(event.target.value)} disabled={viewer}>
          <option value="">{v4("rxgFinish")}</option>
          {FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("rxgSpan")} value={spanNo} onChange={(event) => setSpanNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("rxgSpan")}</option>
          {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("rxgPin")} value={pinNo} onChange={(event) => setPinNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("rxgPin")}</option>
          {PINS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("rxgTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("rxgTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("rxgAdd")}</button>
      </form>
      <form className="c4-rectangulus-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addRectangulusView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, sighter: sighterFilter, finish: finishFilter, quarter: quarterFilter, span: spanFilter, pin: pinFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("rxgViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("rxgViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("rxgSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-rectangulus-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setSighterFilter(view.sighter); setFinishFilter(view.finish); setQuarterFilter(view.quarter); setSpanFilter(view.span); setPinFilter(view.pin); }}>{v4("rxgApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropRectangulusView(views, view.id))}>{v4("rxgDrop")}</button>
          </span>
        ))}
      </form>
      <div className="c4-rectangulus-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRectangulusSighted(cards, picked))}>{v4("rxgBulkLaid")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRectangulusBone(cards, picked))}>{v4("rxgBulkBone")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRectangulusVault(cards, picked))}>{v4("rxgBulkVault")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRectangulusTag(cards, picked))}>{v4("rxgBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("rectangulus-rules.csv", rectangulusCsv(shown, desk))}>{v4("rxgCsv")}</button>
      </div>
      <p className="c4-rectangulus-keys">{v4("rxgKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("rxgEmpty")}</p>}
      <ul className="c4-rectangulus-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-rectangulus-card" data-on={focused?.id === card.id ? "1" : "0"} data-quarter={card.quarter || "blank"} data-late={lateRectangulus(card, desk) ? "1" : "0"} data-idle={idleRectangulus(card) ? "1" : "0"} data-brisk={briskRectangulus(card) ? "1" : "0"} data-resting={restingRectangulus(card) ? "1" : "0"} data-overdue={overdueRectangulus(card) ? "1" : "0"} data-inner={rectangulusInner(card.quarter) ? "1" : "0"} data-outer={rectangulusOuter(card.quarter) ? "1" : "0"}>
              <label className="c4-rectangulus-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("rxgEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editRectangulus(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("rxgNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editRectangulusNote(cards, card.id, event.target.value))} />
                <p className="c4-rectangulus-meta">{card.sighter || "—"} · {quarterLabel(v4, card.quarter)} · {finishLabel(v4, card.finish)} · {card.span ?? "—"} · {card.pin} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-rectangulus-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-rectangulus-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRectangulusSighted(cards, card.id, !card.laid))}>{card.laid ? v4("rxgClear") : v4("rxgLay")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRectangulusCloth(cards, card.id, suggested))}>{v4("rxgSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRectangulusSleeve(cards, card.id, !card.locked))}>{card.locked ? v4("rxgUnsleeve") : v4("rxgSleeveIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRectangulusVault(cards, card.id, !card.held))}>{card.held ? v4("rxgUnvault") : v4("rxgVaultIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRectangulusStar(cards, card.id, !card.starred))}>{card.starred ? v4("rxgUnstar") : v4("rxgStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addRectangulusTag(cards, card.id, "a"))}>{v4("rxgTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftSpanFocused(cards, card.id))}>{v4("rxgLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerSpanFocused(cards, card.id))}>{v4("rxgLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(rectangulusCopy(card))}>{v4("rxgCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type AssayUser = { id?: string; name?: string | null; validationStatus?: string | null };

export function AssayPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: AssayUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<AssayShape>("all");
  const [review, setReview] = useState<AssayReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): AssayRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      assay: { validationStatus: textField(row.validationStatus) } satisfies AssayValue,
    };
  }).filter((row): row is AssayRow => Boolean(row));
  const present = presentAssayLanes(rows);
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
    const next = readHiddenAssays(readJson(ASY_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(ASY_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedAssays(readJson(ASY_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(ASY_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleAssayLanes(present, hidden, showHidden);
  const shown = visibleAssays(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = assayLane(row.assay);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = assayLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingAssay(rows);
  const leadHue = leadingAssayHue(rows);
  const whole = rows.filter((row) => assayLane(row.assay)).length;
  const share = assayShare(laneAssayCount(rows, "house"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("assay-lanes.csv", assayLanesCsv(rows));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(ASY_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(ASY_REVIEW_KEY, next);
  }

  return (
    <section className="c4-assay" aria-label={v4("asyTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-assay-mast">
        <p className="c4-assay-seal" data-logo="mono">{v4("asyLogo")}</p>
        <div>
          <p className="c4-assay-kicker">{v4("asySub")}</p>
          <h2 className="c4-title">{v4("asyTitle")}</h2>
        </div>
        <p className="c4-assay-count">{shown.length}</p>
      </header>
      <p className="c4-assay-links">
        <Link href={crmv4Href(base, "rxg")}>{v4("rxgTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("asyCustomer")}</Link>
      </p>
      <p className="c4-assay-hint">{v4("asyHint")}</p>
      {viewer && <p className="c4-assay-note">{v4("asyViewer")}</p>}
      <p className="c4-assay-meta">{v4("asyLead")} {laneLabel(v4, lead)} · {v4("asyToneLead")} {hueLabel(v4, leadHue)} · {v4("asyShare")} {share}</p>
      <div className="c4-assay-chart" aria-label={v4("asyChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-assay-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-assay-tools">
        <input ref={searchRef} className="c4-field c4-assay-search" aria-label={v4("asySearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("asySearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("asyShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "asyAll" : item === "reviewed" ? "asyReviewed" : "asyFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("asyAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as AssayShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleAssay(hidden, item))}>{hidden.includes(item) ? v4("asyShow") : v4("asyHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-assay-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkAssayReview(reviewed, picked, true))}>{v4("asyBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkAssayReview(reviewed, picked, false))}>{v4("asyBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("assay-lanes.csv", assayLanesCsv(rows))}>{v4("asyCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("assay-rows.csv", assayRowsCsv(shown, reviewed))}>{v4("asyRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("asyLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("asyFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("asyEmpty")}</p>}
      <ul className="c4-assay-list">
        {shown.map((row) => {
          const name = assayCopy(row.assay);
          const tone = assayHue(row.assay);
          return (
            <li key={row.id} className="c4-assay-card" data-lane={assayLane(row.assay) || "open"} data-hue={tone || "none"} data-house={assayHouseSafe(row.assay)} data-open={assayOpen(row.assay) ? "1" : "0"} data-even={assayEven(row.assay) ? "1" : "0"} data-digit={assayDigit(row.assay) ? "1" : "0"} data-letter={assayLetter(row.assay) ? "1" : "0"} data-mixed={assayMixed(row.assay) ? "1" : "0"} data-upper={assayUpper(row.assay) ? "1" : "0"} data-lower={assayLower(row.assay) ? "1" : "0"} data-space={assaySpace(row.assay) ? "1" : "0"} data-vowel={assayVowel(row.assay) ? "1" : "0"} data-tail={assayTail(row.assay) ? "1" : "0"} data-first={assayFirst(row.assay) ? "1" : "0"} data-held={assayHeld(row.assay) ? "1" : "0"} data-hyphen={assayHyphen(row.assay) ? "1" : "0"} data-period={assayPeriod(row.assay) ? "1" : "0"} data-capital={assayCapital(row.assay) ? "1" : "0"}>
              <label className="c4-assay-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-assay-meta">{name || v4("asyOpen")} · {assayStamp(row.assay) || "—"} · {assayFamily(row.assay) || "—"} · {assayLength(row.assay) ?? "—"} · {laneLabel(v4, assayLane(row.assay))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-assay-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleAssayReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("asyReviewed") : v4("asyReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = assayCopy(row.assay); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("asyCopied") : v4("asyCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("asyCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function assayHouseSafe(raw: AssayValue): string {
  return assayLane(raw) === "house" ? "1" : "0";
}
