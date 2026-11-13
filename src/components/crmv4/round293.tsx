"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  PLANISPHERE_CHARTS,
  PLN_DENSITY_KEY,
  PLN_KEY,
  PLN_VIEW_KEY,
  SLP_KEY,
  SLP_REVIEW_KEY,
  addPlanisphere,
  addPlanisphereTag,
  addPlanisphereView,
  briskPlanisphere,
  bulkPlanisphereGale,
  bulkPlanisphereLog,
  bulkPlanisphereStow,
  bulkPlanisphereTag,
  bulkSealReview,
  busiestDiscKeeper,
  windFocused,
  casePlanisphereFocused,
  cycleWind,
  dropPlanisphereView,
  editPlanisphere,
  editPlanisphereNote,
  fairDiscKeeper,
  idlePlanisphere,
  innerChart,
  laneSealCount,
  latePlanisphere,
  leadingSeal,
  leadingSealHue,
  liftSpanFocused,
  logPlanisphereFocused,
  lowerPegFocused,
  lowerSpanFocused,
  movePlanisphereFocus,
  planisphereBars,
  planisphereCopy,
  planisphereCounts,
  planisphereCsv,
  planisphereDensity,
  planisphereKeepers,
  planisphereTimeline,
  outerChart,
  overduePlanisphere,
  presentSealLanes,
  raisePegFocused,
  readHiddenSeal,
  readPlanisphereViews,
  readPlanispheres,
  readReviewedSeal,
  reminderPlanispheres,
  restingPlanisphere,
  setPlanisphereWind,
  setPlanisphereCase,
  setPlanisphereLogged,
  setPlanisphereStar,
  setPlanisphereStow,
  sortPlanispheres,
  starPlanisphereFocused,
  suggestPlanisphereWind,
  suggestSpan,
  suggestChart,
  tagPlanisphereFocused,
  toggleSeal,
  toggleSealReview,
  visiblePlanispheres,
  visibleSeal,
  visibleSealLanes,
  sealCopy,
  sealEven,
  sealFirst,
  sealHeld,
  sealMint,
  sealHue,
  sealLane,
  sealLanes,
  sealLanesCsv,
  sealLeap,
  sealMark,
  sealMinutes,
  sealMorning,
  sealOpen,
  sealRowsCsv,
  sealShare,
  sealSoon,
  sealSpace,
  sealRust,
  sealStamp,
  sealStep,
  sealTail,
  sealToday,
  sealTwin,
  sealWeekday,
  sealWeekend,
  type Planisphere,
  type PlanisphereDensity,
  type PlanisphereSort,
  type PlanisphereTray,
  type PlanisphereView,
  type SealReview,
  type SealRow,
  type SealShape,
  type SealValue,
} from "@/lib/crmv4/round293";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type LockedRow = { id?: string; name?: string | null; passwordChangedAt?: string | null };

const CLIMATES = ["CALM", "BREEZE", "GALE"] as const;
const DROPS = ["5", "10", "15"] as const;
const NOTCHES = ["2", "4", "6"] as const;
const SHAPES: SealShape[] = ["all", "mint", "linen", "oak", "iron", "rust", "open", "soon", "today", "weekday", "weekend", "morning", "leap", "first", "even", "twin", "tail", "mark", "space", "held"];

const WORLD_KEY: Record<string, CrmV4CopyKey> = {
  lyre: "plnLyre",
  harp: "plnHarp",
  crown: "plnCrown",
  keel: "plnKeel",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "plnAuditSave",
  edit: "plnAuditEdit",
  note: "plnAuditNote",
  wind: "plnAuditWind",
  log: "plnAuditLog",
  unlog: "plnAuditUnlog",
  case: "plnAuditCase",
  resume: "plnAuditResume",
  stow: "plnAuditStow",
  open: "plnAuditOpen",
  tag: "plnAuditTag",
  peg: "plnAuditPeg",
  span: "plnAuditSpan",
  lower: "plnAuditLower",
  star: "plnAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  mint: "slpMint",
  linen: "slpLinen",
  oak: "slpOak",
  iron: "slpIron",
  rust: "slpRust",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "slpIvory",
  graphite: "slpGraphite",
  champagne: "slpChampagne",
};

const SHAPE_KEY: Record<SealShape, CrmV4CopyKey> = {
  all: "slpShapeAll",
  mint: "slpShapeMint",
  linen: "slpShapeLinen",
  oak: "slpShapeOak",
  iron: "slpShapeIron",
  rust: "slpShapeRust",
  open: "slpShapeOpen",
  soon: "slpShapeSoon",
  today: "slpShapeToday",
  weekday: "slpShapeWeekday",
  weekend: "slpShapeWeekend",
  morning: "slpShapeMorning",
  leap: "slpShapeLeap",
  first: "slpShapeFirst",
  even: "slpShapeEven",
  twin: "slpShapeTwin",
  tail: "slpShapeTail",
  mark: "slpShapeMark",
  space: "slpShapeSpace",
  held: "slpShapeHeld",
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

function worldLabel(v4: V4, world: string): string {
  const key = WORLD_KEY[world];
  return key ? v4(key) : v4("plnBlankWorld");
}

function climateLabel(v4: V4, climate: string): string {
  if (climate === "CALM") return v4("plnCalm");
  if (climate === "BREEZE") return v4("plnBreeze");
  if (climate === "GALE") return v4("plnGale");
  return v4("plnAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("slpUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("slpUnmarked");
}

export function PlanisphereDiscs({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Planisphere[]>([]);
  const [views, setViews] = useState<PlanisphereView[]>([]);
  const [density, setDensity] = useState<PlanisphereDensity>("wide");
  const [tray, setTray] = useState<PlanisphereTray>("disc");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("");
  const [climateFilter, setClimateFilter] = useState("all");
  const [worldFilter, setWorldFilter] = useState("all");
  const [radiusFilter, setRadiusFilter] = useState("all");
  const [moonFilter, setMoonFilter] = useState("all");
  const [sort, setSort] = useState<PlanisphereSort>("chart");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [world, setWorld] = useState("");
  const [climate, setClimate] = useState("");
  const [radiusNo, setRadiusNo] = useState("");
  const [moonNo, setMoonNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("lyre");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readPlanispheres(readJson(PLN_KEY, [])));
    setViews(readPlanisphereViews(readJson(PLN_VIEW_KEY, [])));
    setDensity(planisphereDensity(readJson(PLN_DENSITY_KEY, "wide")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Planisphere[]) {
    setCards(next);
    writeJson(PLN_KEY, next);
  }
  function storeViews(next: PlanisphereView[]) {
    setViews(next);
    writeJson(PLN_VIEW_KEY, next);
  }
  function storeDensity(next: PlanisphereDensity) {
    setDensity(next);
    writeJson(PLN_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortPlanispheres(visiblePlanispheres(cards, tray, query, keeperFilter, climateFilter, worldFilter, radiusFilter, moonFilter), sort),
    [cards, tray, query, keeperFilter, climateFilter, worldFilter, radiusFilter, moonFilter, sort],
  );
  const counts = planisphereCounts(cards, shown, desk);
  const bars = planisphereBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = planisphereTimeline(cards);
  const keepers = planisphereKeepers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestPlanisphereWind(cards);
  const fair = fairDiscKeeper(cards, keepers.join(","));
  const busy = busiestDiscKeeper(cards);
  const reminders = reminderPlanispheres(cards);
  const radiusHint = suggestSpan(cards, clock);
  const worldHint = suggestChart(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setWorld("");
        setClimate("");
        setRadiusNo("");
        setMoonNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => movePlanisphereFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => movePlanisphereFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "q" || event.key === "Q") {
        event.preventDefault();
        store(liftSpanFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setPlanisphereStow(cards, id, !shown[focusAt]?.stowed));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        store(windFocused(cards, id));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        store(casePlanisphereFocused(cards, id));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        store(logPlanisphereFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("planisphere-discs.csv", planisphereCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starPlanisphereFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raisePegFocused(cards, id));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        store(lowerPegFocused(cards, id));
        return;
      }
      if (event.key === "f" || event.key === "F") {
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
    <section className="c4-planisphere" aria-label={v4("plnTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-planisphere-mast">
        <p className="c4-planisphere-seal" data-logo="mono">{v4("plnLogo")}</p>
        <div>
          <p className="c4-planisphere-kicker">{v4("plnSub")}</p>
          <h2 className="c4-title">{v4("plnTitle")}</h2>
        </div>
        <ol className="c4-planisphere-index" aria-label={v4("plnTitle")}>
          <li data-tone="gold">{v4("plnGale")}</li>
          <li data-tone="ink">{v4("plnBreeze")}</li>
          <li data-tone="ivory">{v4("plnCalm")}</li>
        </ol>
      </header>
      <p className="c4-planisphere-links">
        <Link href={crmv4Href(base, "slp")}>{v4("slxTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("plnCustomers")}</Link>
        <Link href={crmv4Href(base, "voicetray")}>{v4("vsFolioKicker")}</Link>
      </p>
      <p className="c4-planisphere-hint">{v4("plnHint")}</p>
      {viewer && <p className="c4-planisphere-note">{v4("plnViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-planisphere-notice" role="status">{v4("plnOverdue")} {counts.overdue}</p>}
      <ol className="c4-planisphere-dials" aria-label={v4("plnChart")}>
        <li><span>{v4("plnArm")}</span><strong>{counts.arm}</strong></li>
        <li><span>{v4("plnCradle")}</span><strong>{counts.cradle}</strong></li>
        <li><span>{v4("plnCoffer")}</span><strong>{counts.coffer}</strong></li>
        <li><span>{v4("plnOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("plnIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("plnBrisk")}</span><strong>{counts.brisk}</strong></li>
        <li><span>{v4("plnFair")}</span><strong>{fair || "·"}</strong></li>
        <li><span>{v4("plnBusy")}</span><strong>{busy || "·"}</strong></li>
      </ol>
      <div className="c4-planisphere-chart" aria-label={v4("plnChart")}>
        {bars.map((bar) => (
          <button key={bar.chart} type="button" className="c4-planisphere-column" data-on={worldFilter === bar.chart ? "1" : "0"} data-world={bar.chart} onClick={() => setWorldFilter(worldFilter === bar.chart ? "all" : bar.chart)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{worldLabel(v4, bar.chart)}</span>
          </button>
        ))}
      </div>
      <div className="c4-planisphere-tools">
        <input ref={searchRef} className="c4-field c4-planisphere-search" aria-label={v4("plnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("plnSearch")} />
        {(["disc", "case", "drawer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "disc" ? "plnArm" : item === "case" ? "plnCradle" : "plnCoffer")}</button>
        ))}
        {(["all", "inner", "outer", ...PLANISPHERE_CHARTS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={worldFilter === item ? "1" : "0"} onClick={() => setWorldFilter(item)}>{item === "all" ? v4("plnAll") : item === "inner" ? v4("plnInner") : item === "outer" ? v4("plnOuter") : worldLabel(v4, item)}</button>
        ))}
        {["all", ...CLIMATES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={climateFilter === item ? "1" : "0"} onClick={() => setClimateFilter(item)}>{item === "all" ? v4("plnClimate") : climateLabel(v4, item)}</button>
        ))}
        {["all", ...DROPS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={radiusFilter === item ? "1" : "0"} onClick={() => setRadiusFilter(item)}>{item === "all" ? v4("plnRadius") : item}</button>
        ))}
        {["all", ...NOTCHES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={moonFilter === item ? "1" : "0"} onClick={() => setMoonFilter(item)}>{item === "all" ? v4("plnMoon") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort(sort === "chart" ? "keeper" : "chart")}>{sort === "chart" ? v4("plnSortChart") : v4("plnSortKeeper")}</button>
        <button type="button" className="c4-chip" data-on={density === "narrow" ? "1" : "0"} onClick={() => storeDensity(density === "wide" ? "narrow" : "wide")}>{density === "wide" ? v4("plnWide") : v4("plnNarrow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("planisphere-discs.csv", planisphereCsv(shown, desk))}>{v4("plnCsv")}</button>
      </div>
      <div className="c4-planisphere-tools" role="group" aria-label={v4("plnDesk")}>
        {PLANISPHERE_CHARTS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("plnDesk")} {worldLabel(v4, item)}</button>
        ))}
        <span className="c4-planisphere-meta">{v4("plnSuggest")} {climateLabel(v4, suggested)} · {radiusHint} · {worldLabel(v4, worldHint)}</span>
      </div>
      <form className="c4-planisphere-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addPlanisphere(cards, { title, note, keeper, chart: world, wind: climate || suggested, span: radiusNo, peg: moonNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("plnEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("plnTitle")} />
        <input className="c4-field" aria-label={v4("plnNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("plnNote")} />
        <input className="c4-field" aria-label={v4("plnKeeper")} aria-required={false} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} placeholder={v4("plnKeeper")} />
        <select className="c4-select" aria-label={v4("plnWorld")} value={world} disabled={viewer} onChange={(event) => setWorld(event.target.value)}>
          <option value="">{v4("plnBlankWorld")}</option>
          {PLANISPHERE_CHARTS.map((item) => <option key={item} value={item}>{worldLabel(v4, item)}</option>)}
        </select>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("plnAdd")}</button>
      </form>
      <form className="c4-planisphere-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addPlanisphereView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, keeper: keeperFilter, wind: climateFilter, chart: worldFilter, span: radiusFilter, peg: moonFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("plnViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("plnViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("plnSaveView")}</button>
      </form>
      <ul className="c4-planisphere-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setKeeperFilter(view.keeper); setClimateFilter(view.wind); setWorldFilter(view.chart); setRadiusFilter(view.span); setMoonFilter(view.peg); }}>{v4("plnApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropPlanisphereView(views, view.id))}>{v4("plnDrop")}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-planisphere-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkPlanisphereGale(cards, picked))}>{v4("plnBulkBlaze")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkPlanisphereLog(cards, picked))}>{v4("plnBulkLog")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkPlanisphereStow(cards, picked))}>{v4("plnBulkStow")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkPlanisphereTag(cards, picked))}>{v4("plnBulkTag")}</button>
        </div>
      )}
      <p className="c4-planisphere-meta">{v4("plnKeys")} · j k n l g v s f q u y x /</p>
      {timeline.length > 0 && (
        <ol className="c4-planisphere-time" aria-label={v4("plnTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.span}><span>{v4("plnRadius")} {lane.span}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
        </ol>
      )}
      {reminders.length > 0 && <p className="c4-planisphere-meta">{v4("plnRemind")} {reminders.join(" · ")}</p>}
      {!shown.length && <p className="c4-planisphere-empty">{v4("plnEmpty")}</p>}
      <ol className="c4-planisphere-board">
        {shown.map((card, index) => {
          const on = index === focusAt;
          return (
            <li key={card.id} className="c4-planisphere-card" data-on={on ? "1" : "0"} data-overdue={overduePlanisphere(card) ? "1" : "0"} data-idle={idlePlanisphere(card) ? "1" : "0"} data-brisk={briskPlanisphere(card) ? "1" : "0"} data-resting={restingPlanisphere(card) ? "1" : "0"} data-late={latePlanisphere(card, desk) ? "1" : "0"} data-outer={outerChart(card.chart) ? "1" : "0"} data-inner={innerChart(card.chart) ? "1" : "0"} data-star={card.flagged ? "1" : "0"}>
              <label className="c4-planisphere-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((current) => (current.includes(card.id) ? current.filter((item) => item !== card.id) : [...current, card.id]))} /></label>
              <div>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("plnEdit")} aria-required={false} value={card.title} onChange={(event) => store(editPlanisphere(cards, card.id, event.target.value))} />
                ) : (
                  <strong>{card.title}</strong>
                )}
                <p className="c4-planisphere-meta">{card.keeper || v4("plnKeeper")} · {worldLabel(v4, card.chart)} · {climateLabel(v4, card.wind)} · {card.span ?? "·"} · {v4("plnMoon")} {card.peg}{card.tags.length ? ` · ${card.tags.join("")}` : ""}{card.audit ? ` · ${AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : card.audit}` : ""}</p>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("plnNote")} aria-required={false} value={card.note} onChange={(event) => store(editPlanisphereNote(cards, card.id, event.target.value))} />
                ) : (
                  card.note && <p className="c4-planisphere-meta">{card.note}</p>
                )}
                <div className="c4-planisphere-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPlanisphereLogged(cards, card.id, !card.logged))}>{card.logged ? v4("plnUnlog") : v4("plnLog")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPlanisphereCase(cards, card.id, !card.locked))}>{card.locked ? v4("plnUnlock") : v4("plnLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPlanisphereStow(cards, card.id, !card.stowed))}>{card.stowed ? v4("plnUnstow") : v4("plnStow")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPlanisphereStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("plnUnstar") : v4("plnStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPlanisphereWind(cards, card.id, cycleWind(card.wind)))}>{v4("plnClimate")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftSpanFocused(cards, card.id))}>{v4("plnLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerSpanFocused(cards, card.id))}>{v4("plnLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raisePegFocused(cards, card.id))}>{v4("plnMoon")}+</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerPegFocused(cards, card.id))}>{v4("plnMoon")}−</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addPlanisphereTag(cards, card.id, "x"))}>{v4("plnTag")} x</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(tagPlanisphereFocused(cards, card.id))}>{v4("plnTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(planisphereCopy(card)); }}>{v4("slxCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="c4-planisphere-meta">{v4("plnMatched")} {counts.matched} · {ids.length}</p>
    </section>
  );
}

export function SealPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: LockedRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<SealShape>("all");
  const [review, setReview] = useState<SealReview>("all");
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

  const rows = useMemo<SealRow[]>(() => {
    return (queue.data?.users || []).map((row, index) => ({
      id: textField(row.id) || `c${index}`,
      label: textField(row.name),
      changed: { passwordChangedAt: textField(row.passwordChangedAt) } satisfies SealValue,
    }));
  }, [queue.data]);

  useEffect(() => {
    const ids = rows.map((row) => row.id);
    const clock = Date.now();
    setHidden(readHiddenSeal(readJson(SLP_KEY, []), presentSealLanes(rows, clock)));
    setReviewed(readReviewedSeal(readJson(SLP_REVIEW_KEY, []), ids));
  }, [rows]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(SLP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(SLP_REVIEW_KEY, next);
  }

  const lanes = visibleSealLanes(presentSealLanes(rows, now), hidden, showHidden);
  const shown = visibleSeal(rows, lane, hue, query, review, reviewed, shape, now).filter((row) => !hidden.includes(sealLane(row.changed, now)) || showHidden);
  const bars = sealLanes(rows, now);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingSeal(rows, now);
  const leadHue = leadingSealHue(rows, now);
  const soon = rows.filter((row) => sealSoon(row.changed, now)).length;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => movePlanisphereFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => movePlanisphereFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        if (viewer) return;
        const id = shown[focusAt]?.id;
        if (id) storeReviewed(toggleSealReview(reviewed, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("seal-rows.csv", sealRowsCsv(rows, reviewed, now));
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
    <section className="c4-seal" aria-label={v4("slxTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-seal-mast">
        <p className="c4-seal-seal" data-logo="mono">{v4("slxLogo")}</p>
        <div>
          <p className="c4-seal-kicker">{v4("slxSub")}</p>
          <h2 className="c4-title">{v4("slxTitle")}</h2>
        </div>
      </header>
      <ol className="c4-seal-index" aria-label={v4("slxTitle")}>
        <li data-tone="gold">{v4("slpMint")}</li>
        <li data-tone="ink">{v4("slpRust")}</li>
        <li data-tone="ivory">{v4("slpLinen")}</li>
        <li data-tone="mist">{v4("slpOak")}</li>
        <li data-tone="line">{v4("slpIron")}</li>
      </ol>
      <p className="c4-seal-links">
        <Link href={crmv4Href(base, "pln")}>{v4("plnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("plnCustomers")}</Link>
        <Link href={crmv4Href(base, "utcmark")}>{v4("cdRailKicker")}</Link>
      </p>
      <p className="c4-seal-hint">{v4("slxHint")}</p>
      {viewer && <p className="c4-seal-note">{v4("slpViewer")}</p>}
      {soon > 0 && <p className="c4-seal-notice" role="status">{v4("slpSoon")} {soon}</p>}
      {queue.loading && <p className="c4-seal-meta">{v4("slxEmpty")}</p>}
      {queue.error && <p className="c4-seal-meta">{queue.error}</p>}
      <ul className="c4-seal-kpis" aria-label={v4("slpRules")}>
        <li><span>{v4("slpLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("slpUnmarked")}</strong></li>
        <li><span>{v4("slpToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("slpUnmarked")}</strong></li>
        <li><span>{v4("slpMint")}</span><strong>{laneSealCount(rows, "mint", now)}</strong></li>
        <li><span>{v4("slpRust")}</span><strong>{laneSealCount(rows, "rust", now)}</strong></li>
        <li><span>{v4("slxShare")}</span><strong>{sealShare(laneSealCount(rows, "iron", now), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("slpOpen")}</span><strong>{rows.filter((row) => sealOpen(row.changed, now)).length}</strong></li>
        <li><span>{v4("slpToday")}</span><strong>{rows.filter((row) => sealToday(row.changed, now)).length}</strong></li>
        <li><span>{v4("slpHeld")}</span><strong>{rows.filter((row) => sealHeld(row.changed, now)).length}</strong></li>
        <li><span>{v4("slpTwin")}</span><strong>{rows.filter((row) => sealTwin(row.changed, now)).length}</strong></li>
      </ul>
      <div className="c4-seal-chart" aria-label={v4("slpRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-seal-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-seal-tools">
        <input ref={searchRef} className="c4-field c4-seal-search" aria-label={v4("slxSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("slxSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("slpAll") : hueLabel(v4, item)}</button>
        ))}
        {SHAPES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("slpAll") : item === "reviewed" ? v4("slpReviewed") : v4("slpFresh")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("slpShow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("seal-lanes.csv", sealLanesCsv(rows, now))}>{v4("slxCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("seal-rows.csv", sealRowsCsv(rows, reviewed, now))}>{v4("slpRowCsv")}</button>
      </div>
      <ul className="c4-seal-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleSeal(hidden, item))}>{hidden.includes(item) ? v4("slpShow") : v4("slpHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-seal-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSealReview(reviewed, picked, true))}>{v4("slpBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSealReview(reviewed, picked, false))}>{v4("slpBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-seal-empty">{v4("slxEmpty")}</p>}
      <ol className="c4-seal-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          const minutes = sealMinutes(row.changed, now);
          return (
            <li key={row.id} className="c4-seal-card" data-on={index === focusAt ? "1" : "0"} data-lane={sealLane(row.changed, now)} data-hue={sealHue(row.changed, now)} data-reviewed={seen ? "1" : "0"} data-mint={sealMint(row.changed, now) ? "1" : "0"} data-rust={sealRust(row.changed, now) ? "1" : "0"} data-today={sealToday(row.changed, now) ? "1" : "0"} data-soon={sealSoon(row.changed, now) ? "1" : "0"}>
              <p className="c4-seal-stamp">{sealStamp(row.changed, now) || "·"}</p>
              <label className="c4-seal-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("slpUnmarked")}</strong>
                <p className="c4-seal-meta">{laneLabel(v4, sealLane(row.changed, now))} · {hueLabel(v4, sealHue(row.changed, now))} · {v4("slpStep")} {sealStep(row.changed, now)}{minutes !== null ? ` · ${minutes}m` : ""}{sealWeekday(row.changed, now) ? ` · ${v4("slpWeekday")}` : ""}{sealWeekend(row.changed, now) ? ` · ${v4("slpWeekend")}` : ""}{sealMorning(row.changed, now) ? ` · ${v4("slpMorning")}` : ""}{sealEven(row.changed, now) ? ` · ${v4("slpEven")}` : ""}{sealLeap(row.changed, now) ? ` · ${v4("slpLeap")}` : ""}{sealFirst(row.changed, now) ? ` · ${v4("slpFirst")}` : ""}{sealHeld(row.changed, now) ? ` · ${v4("slpHeld")}` : ""}{sealSoon(row.changed, now) ? ` · ${v4("slpSoon")}` : ""}{sealTwin(row.changed, now) ? ` · ${v4("slpTwin")}` : ""}{sealTail(row.changed) ? ` · ${v4("slpTail")}` : ""}{sealMark(row.changed) ? ` · ${v4("slpMark")}` : ""}{sealSpace(row.changed) ? ` · ${v4("slpSpace")}` : ""}{sealOpen(row.changed, now) ? ` · ${v4("slpOpen")}` : ""}</p>
                <div className="c4-seal-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSealReview(reviewed, row.id))}>{seen ? v4("slpReviewed") : v4("slpReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(sealCopy(row.changed)); setCopied(row.id); }}>{copied === row.id ? v4("slxCopied") : v4("slxCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
