"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  EQM_DENSITY_KEY,
  EQM_KEY,
  EQM_VIEW_KEY,
  EQUATORIUM_METALS,
  RGD_KEY,
  RGD_REVIEW_KEY,
  addEquatorium,
  addEquatoriumTag,
  addEquatoriumView,
  briskEquatorium,
  bulkEquatoriumHot,
  bulkEquatoriumLog,
  bulkEquatoriumStow,
  bulkEquatoriumTag,
  bulkRegisterReview,
  busiestKeeper,
  cycleTemper,
  dropEquatoriumView,
  editEquatorium,
  editEquatoriumNote,
  equatoriumBars,
  equatoriumCopy,
  equatoriumCounts,
  equatoriumCsv,
  equatoriumDensity,
  equatoriumKeepers,
  equatoriumTimeline,
  fairKeeper,
  firmMetal,
  idleEquatorium,
  laneRegisterCount,
  lateEquatorium,
  leadingRegister,
  leadingRegisterHue,
  liftArcFocused,
  lockEquatoriumFocused,
  logEquatoriumFocused,
  lowerArcFocused,
  lowerToothFocused,
  moveEquatoriumFocus,
  overdueEquatorium,
  presentRegisterLanes,
  raiseToothFocused,
  readEquatoriumViews,
  readEquatoriums,
  readHiddenRegister,
  readReviewedRegister,
  registerAnniversary,
  registerArchive,
  registerCopy,
  registerDawn,
  registerDays,
  registerEven,
  registerFirst,
  registerFuture,
  registerHue,
  registerLane,
  registerLanes,
  registerLanesCsv,
  registerLeap,
  registerMark,
  registerMorning,
  registerQuiet,
  registerRowsCsv,
  registerShare,
  registerSpace,
  registerStamp,
  registerStep,
  registerTail,
  registerToday,
  registerTwin,
  registerWeekday,
  registerWeekend,
  registerWelcome,
  reminderEquatoriums,
  restingEquatorium,
  setEquatoriumLock,
  setEquatoriumLogged,
  setEquatoriumStar,
  setEquatoriumStow,
  setEquatoriumTemper,
  sharedRegisterCount,
  softMetal,
  sortEquatoriums,
  starEquatoriumFocused,
  suggestArc,
  suggestEquatoriumTemper,
  suggestMetal,
  tagEquatoriumFocused,
  temperFocused,
  toggleRegister,
  toggleRegisterReview,
  visibleEquatoriums,
  visibleRegister,
  visibleRegisterLanes,
  type Equatorium,
  type EquatoriumDensity,
  type EquatoriumSort,
  type EquatoriumTray,
  type EquatoriumView,
  type RegisterReview,
  type RegisterRow,
  type RegisterShape,
  type RegisterValue,
} from "@/lib/crmv4/round290";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type OpenedRow = { id?: string; name?: string | null; registrationDate?: string | null };

const TEMPERS = ["COOL", "WARM", "HOT"] as const;
const ARCS = ["15", "30", "45"] as const;
const TEETH = ["1", "3", "5"] as const;
const SHAPES: RegisterShape[] = ["all", "dawn", "archive", "quiet", "today", "weekday", "weekend", "morning", "anniversary", "future", "leap", "first", "even", "twin", "tail", "mark", "space", "week", "moon", "year"];

const METAL_KEY: Record<string, CrmV4CopyKey> = {
  brass: "eqmBrass",
  ivory: "eqmIvory",
  steel: "eqmSteel",
  ebony: "eqmEbony",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "eqmAuditSave",
  edit: "eqmAuditEdit",
  note: "eqmAuditNote",
  temper: "eqmAuditTemper",
  log: "eqmAuditLog",
  unlog: "eqmAuditUnlog",
  lock: "eqmAuditLock",
  resume: "eqmAuditResume",
  stow: "eqmAuditStow",
  open: "eqmAuditOpen",
  tag: "eqmAuditTag",
  tooth: "eqmAuditTooth",
  arc: "eqmAuditArc",
  lower: "eqmAuditLower",
  star: "eqmAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  dawn: "rgdDawn",
  week: "rgdWeek",
  moon: "rgdMoon",
  year: "rgdYear",
  archive: "rgdArchive",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "rgdIvory",
  graphite: "rgdGraphite",
  champagne: "rgdChampagne",
};

const SHAPE_KEY: Record<RegisterShape, CrmV4CopyKey> = {
  all: "rgdShapeAll",
  dawn: "rgdShapeDawn",
  archive: "rgdShapeArchive",
  quiet: "rgdShapeQuiet",
  today: "rgdShapeToday",
  weekday: "rgdShapeWeekday",
  weekend: "rgdShapeWeekend",
  morning: "rgdShapeMorning",
  anniversary: "rgdShapeAnniversary",
  future: "rgdShapeFuture",
  leap: "rgdShapeLeap",
  first: "rgdShapeFirst",
  even: "rgdShapeEven",
  twin: "rgdShapeTwin",
  tail: "rgdShapeTail",
  mark: "rgdShapeMark",
  space: "rgdShapeSpace",
  week: "rgdShapeWeek",
  moon: "rgdShapeMoon",
  year: "rgdShapeYear",
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

function metalLabel(v4: V4, metal: string): string {
  const key = METAL_KEY[metal];
  return key ? v4(key) : v4("eqmBlankMetal");
}

function temperLabel(v4: V4, temper: string): string {
  if (temper === "COOL") return v4("eqmCool");
  if (temper === "WARM") return v4("eqmWarm");
  if (temper === "HOT") return v4("eqmHot");
  return v4("eqmAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("rgdUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("rgdUnmarked");
}

export function EquatoriumRings({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Equatorium[]>([]);
  const [views, setViews] = useState<EquatoriumView[]>([]);
  const [density, setDensity] = useState<EquatoriumDensity>("wide");
  const [tray, setTray] = useState<EquatoriumTray>("ring");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("");
  const [temperFilter, setTemperFilter] = useState("all");
  const [metalFilter, setMetalFilter] = useState("all");
  const [arcFilter, setArcFilter] = useState("all");
  const [toothFilter, setToothFilter] = useState("all");
  const [sort, setSort] = useState<EquatoriumSort>("metal");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [metal, setMetal] = useState("");
  const [temper, setTemper] = useState("");
  const [arcNo, setArcNo] = useState("");
  const [toothNo, setToothNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("brass");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readEquatoriums(readJson(EQM_KEY, [])));
    setViews(readEquatoriumViews(readJson(EQM_VIEW_KEY, [])));
    setDensity(equatoriumDensity(readJson(EQM_DENSITY_KEY, "wide")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Equatorium[]) {
    setCards(next);
    writeJson(EQM_KEY, next);
  }
  function storeViews(next: EquatoriumView[]) {
    setViews(next);
    writeJson(EQM_VIEW_KEY, next);
  }
  function storeDensity(next: EquatoriumDensity) {
    setDensity(next);
    writeJson(EQM_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortEquatoriums(visibleEquatoriums(cards, tray, query, keeperFilter, temperFilter, metalFilter, arcFilter, toothFilter), sort),
    [cards, tray, query, keeperFilter, temperFilter, metalFilter, arcFilter, toothFilter, sort],
  );
  const counts = equatoriumCounts(cards, shown, desk);
  const bars = equatoriumBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = equatoriumTimeline(cards);
  const keepers = equatoriumKeepers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestEquatoriumTemper(cards);
  const fair = fairKeeper(cards, keepers.join(","));
  const busy = busiestKeeper(cards);
  const reminders = reminderEquatoriums(cards);
  const arcHint = suggestArc(cards, clock);
  const metalHint = suggestMetal(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setMetal("");
        setTemper("");
        setArcNo("");
        setToothNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveEquatoriumFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveEquatoriumFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "q" || event.key === "Q") {
        event.preventDefault();
        store(liftArcFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setEquatoriumStow(cards, id, !shown[focusAt]?.stowed));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        store(temperFocused(cards, id));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        store(lockEquatoriumFocused(cards, id));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        store(logEquatoriumFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("equatorium-rings.csv", equatoriumCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starEquatoriumFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raiseToothFocused(cards, id));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        store(lowerToothFocused(cards, id));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        store(lowerArcFocused(cards, id));
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
    <section className="c4-equatorium" aria-label={v4("eqmTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-equatorium-mast">
        <p className="c4-equatorium-seal" data-logo="mono">{v4("eqmLogo")}</p>
        <div>
          <p className="c4-equatorium-kicker">{v4("eqmSub")}</p>
          <h2 className="c4-title">{v4("eqmTitle")}</h2>
        </div>
        <ol className="c4-equatorium-index" aria-label={v4("eqmTitle")}>
          <li data-tone="gold">{v4("eqmHot")}</li>
          <li data-tone="ink">{v4("eqmWarm")}</li>
          <li data-tone="ivory">{v4("eqmCool")}</li>
        </ol>
      </header>
      <p className="c4-equatorium-links">
        <Link href={crmv4Href(base, "rgd")}>{v4("rgdTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("eqmCustomers")}</Link>
        <Link href={crmv4Href(base, "snooze")}>{v4("szCourtKicker")}</Link>
      </p>
      <p className="c4-equatorium-hint">{v4("eqmHint")}</p>
      {viewer && <p className="c4-equatorium-note">{v4("eqmViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-equatorium-notice" role="status">{v4("eqmOverdue")} {counts.overdue}</p>}
      <ol className="c4-equatorium-dials" aria-label={v4("eqmChart")}>
        <li><span>{v4("eqmRing")}</span><strong>{counts.ring}</strong></li>
        <li><span>{v4("eqmCase")}</span><strong>{counts.case}</strong></li>
        <li><span>{v4("eqmVault")}</span><strong>{counts.vault}</strong></li>
        <li><span>{v4("eqmOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("eqmIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("eqmBrisk")}</span><strong>{counts.brisk}</strong></li>
        <li><span>{v4("eqmFair")}</span><strong>{fair || "·"}</strong></li>
        <li><span>{v4("eqmBusy")}</span><strong>{busy || "·"}</strong></li>
      </ol>
      <div className="c4-equatorium-chart" aria-label={v4("eqmChart")}>
        {bars.map((bar) => (
          <button key={bar.metal} type="button" className="c4-equatorium-column" data-on={metalFilter === bar.metal ? "1" : "0"} data-metal={bar.metal} onClick={() => setMetalFilter(metalFilter === bar.metal ? "all" : bar.metal)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{metalLabel(v4, bar.metal)}</span>
          </button>
        ))}
      </div>
      <div className="c4-equatorium-tools">
        <input ref={searchRef} className="c4-field c4-equatorium-search" aria-label={v4("eqmSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("eqmSearch")} />
        {(["ring", "case", "vault"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "ring" ? "eqmRing" : item === "case" ? "eqmCase" : "eqmVault")}</button>
        ))}
        {(["all", "firm", "soft", ...EQUATORIUM_METALS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={metalFilter === item ? "1" : "0"} onClick={() => setMetalFilter(item)}>{item === "all" ? v4("eqmAll") : item === "firm" ? v4("eqmFirm") : item === "soft" ? v4("eqmSoft") : metalLabel(v4, item)}</button>
        ))}
        {["all", ...TEMPERS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={temperFilter === item ? "1" : "0"} onClick={() => setTemperFilter(item)}>{item === "all" ? v4("eqmTemper") : temperLabel(v4, item)}</button>
        ))}
        {["all", ...ARCS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={arcFilter === item ? "1" : "0"} onClick={() => setArcFilter(item)}>{item === "all" ? v4("eqmArc") : item}</button>
        ))}
        {["all", ...TEETH].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toothFilter === item ? "1" : "0"} onClick={() => setToothFilter(item)}>{item === "all" ? v4("eqmTooth") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort(sort === "metal" ? "keeper" : "metal")}>{sort === "metal" ? v4("eqmSortMetal") : v4("eqmSortKeeper")}</button>
        <button type="button" className="c4-chip" data-on={density === "narrow" ? "1" : "0"} onClick={() => storeDensity(density === "wide" ? "narrow" : "wide")}>{density === "wide" ? v4("eqmWide") : v4("eqmNarrow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("equatorium-rings.csv", equatoriumCsv(shown, desk))}>{v4("eqmCsv")}</button>
      </div>
      <div className="c4-equatorium-tools" role="group" aria-label={v4("eqmDesk")}>
        {EQUATORIUM_METALS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("eqmDesk")} {metalLabel(v4, item)}</button>
        ))}
        <span className="c4-equatorium-meta">{v4("eqmSuggest")} {temperLabel(v4, suggested)} · {arcHint} · {metalLabel(v4, metalHint)}</span>
      </div>
      <form className="c4-equatorium-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addEquatorium(cards, { title, note, keeper, metal, temper: temper || suggested, arc: arcNo, tooth: toothNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("eqmEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("eqmTitle")} />
        <input className="c4-field" aria-label={v4("eqmNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("eqmNote")} />
        <input className="c4-field" aria-label={v4("eqmKeeper")} aria-required={false} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} placeholder={v4("eqmKeeper")} />
        <select className="c4-select" aria-label={v4("eqmMetal")} value={metal} disabled={viewer} onChange={(event) => setMetal(event.target.value)}>
          <option value="">{v4("eqmBlankMetal")}</option>
          {EQUATORIUM_METALS.map((item) => <option key={item} value={item}>{metalLabel(v4, item)}</option>)}
        </select>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("eqmAdd")}</button>
      </form>
      <form className="c4-equatorium-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addEquatoriumView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, keeper: keeperFilter, temper: temperFilter, metal: metalFilter, arc: arcFilter, tooth: toothFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("eqmViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("eqmViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("eqmSaveView")}</button>
      </form>
      <ul className="c4-equatorium-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setKeeperFilter(view.keeper); setTemperFilter(view.temper); setMetalFilter(view.metal); setArcFilter(view.arc); setToothFilter(view.tooth); }}>{v4("eqmApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropEquatoriumView(views, view.id))}>{v4("eqmDrop")}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-equatorium-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkEquatoriumHot(cards, picked))}>{v4("eqmBulkHot")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkEquatoriumLog(cards, picked))}>{v4("eqmBulkLog")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkEquatoriumStow(cards, picked))}>{v4("eqmBulkStow")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkEquatoriumTag(cards, picked))}>{v4("eqmBulkTag")}</button>
        </div>
      )}
      <p className="c4-equatorium-meta">{v4("eqmKeys")} · j k n l g v s f q u y x /</p>
      {timeline.length > 0 && (
        <ol className="c4-equatorium-time" aria-label={v4("eqmTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.arc}><span>{v4("eqmArc")} {lane.arc}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
        </ol>
      )}
      {reminders.length > 0 && <p className="c4-equatorium-meta">{v4("eqmRemind")} {reminders.join(" · ")}</p>}
      {!shown.length && <p className="c4-equatorium-empty">{v4("eqmEmpty")}</p>}
      <ol className="c4-equatorium-board">
        {shown.map((card, index) => {
          const on = index === focusAt;
          return (
            <li key={card.id} className="c4-equatorium-card" data-on={on ? "1" : "0"} data-overdue={overdueEquatorium(card) ? "1" : "0"} data-idle={idleEquatorium(card) ? "1" : "0"} data-brisk={briskEquatorium(card) ? "1" : "0"} data-resting={restingEquatorium(card) ? "1" : "0"} data-late={lateEquatorium(card, desk) ? "1" : "0"} data-soft={softMetal(card.metal) ? "1" : "0"} data-firm={firmMetal(card.metal) ? "1" : "0"} data-star={card.flagged ? "1" : "0"}>
              <label className="c4-equatorium-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((current) => (current.includes(card.id) ? current.filter((item) => item !== card.id) : [...current, card.id]))} /></label>
              <div>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("eqmEdit")} aria-required={false} value={card.title} onChange={(event) => store(editEquatorium(cards, card.id, event.target.value))} />
                ) : (
                  <strong>{card.title}</strong>
                )}
                <p className="c4-equatorium-meta">{card.keeper || v4("eqmKeeper")} · {metalLabel(v4, card.metal)} · {temperLabel(v4, card.temper)} · {card.arc ?? "·"} · {v4("eqmTooth")} {card.tooth}{card.tags.length ? ` · ${card.tags.join("")}` : ""}{card.audit ? ` · ${AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : card.audit}` : ""}</p>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("eqmNote")} aria-required={false} value={card.note} onChange={(event) => store(editEquatoriumNote(cards, card.id, event.target.value))} />
                ) : (
                  card.note && <p className="c4-equatorium-meta">{card.note}</p>
                )}
                <div className="c4-equatorium-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEquatoriumLogged(cards, card.id, !card.logged))}>{card.logged ? v4("eqmUnlog") : v4("eqmLog")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEquatoriumLock(cards, card.id, !card.locked))}>{card.locked ? v4("eqmUnlock") : v4("eqmLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEquatoriumStow(cards, card.id, !card.stowed))}>{card.stowed ? v4("eqmUnstow") : v4("eqmStow")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEquatoriumStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("eqmUnstar") : v4("eqmStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEquatoriumTemper(cards, card.id, cycleTemper(card.temper)))}>{v4("eqmTemper")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftArcFocused(cards, card.id))}>{v4("eqmLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerArcFocused(cards, card.id))}>{v4("eqmLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseToothFocused(cards, card.id))}>{v4("eqmTooth")}+</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerToothFocused(cards, card.id))}>{v4("eqmTooth")}−</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addEquatoriumTag(cards, card.id, "a"))}>{v4("eqmTag")} a</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(tagEquatoriumFocused(cards, card.id))}>{v4("eqmTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(equatoriumCopy(card)); }}>{v4("rgdCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="c4-equatorium-meta">{v4("eqmMatched")} {counts.matched} · {ids.length}</p>
    </section>
  );
}

export function RegisterPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: OpenedRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<RegisterShape>("all");
  const [review, setReview] = useState<RegisterReview>("all");
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

  const rows = useMemo<RegisterRow[]>(() => {
    return (queue.data?.users || []).map((row, index) => ({
      id: textField(row.id) || `c${index}`,
      label: textField(row.name),
      opened: { registrationDate: textField(row.registrationDate) } satisfies RegisterValue,
    }));
  }, [queue.data]);

  useEffect(() => {
    const ids = rows.map((row) => row.id);
    const clock = Date.now();
    setHidden(readHiddenRegister(readJson(RGD_KEY, []), presentRegisterLanes(rows, clock)));
    setReviewed(readReviewedRegister(readJson(RGD_REVIEW_KEY, []), ids));
  }, [rows]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(RGD_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(RGD_REVIEW_KEY, next);
  }

  const lanes = visibleRegisterLanes(presentRegisterLanes(rows, now), hidden, showHidden);
  const shown = visibleRegister(rows, lane, hue, query, review, reviewed, shape, now).filter((row) => !hidden.includes(registerLane(row.opened, now)) || showHidden);
  const bars = registerLanes(rows, now);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingRegister(rows, now);
  const leadHue = leadingRegisterHue(rows, now);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveEquatoriumFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveEquatoriumFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        if (viewer) return;
        const id = shown[focusAt]?.id;
        if (id) storeReviewed(toggleRegisterReview(reviewed, id));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusAt, reviewed, shown, viewer]);

  return (
    <section className="c4-register" aria-label={v4("rgdTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-register-mast">
        <p className="c4-register-seal" data-logo="mono">{v4("rgdLogo")}</p>
        <div>
          <p className="c4-register-kicker">{v4("rgdSub")}</p>
          <h2 className="c4-title">{v4("rgdTitle")}</h2>
        </div>
      </header>
      <ol className="c4-register-index" aria-label={v4("rgdTitle")}>
        <li data-tone="gold">{v4("rgdDawn")}</li>
        <li data-tone="ink">{v4("rgdArchive")}</li>
        <li data-tone="ivory">{v4("rgdWeek")}</li>
        <li data-tone="mist">{v4("rgdMoon")}</li>
        <li data-tone="line">{v4("rgdYear")}</li>
      </ol>
      <p className="c4-register-links">
        <Link href={crmv4Href(base, "eqm")}>{v4("eqmTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("eqmCustomers")}</Link>
        <Link href={crmv4Href(base, "suppulse")}>{v4("qpHallKicker")}</Link>
      </p>
      <p className="c4-register-hint">{v4("rgdHint")}</p>
      {viewer && <p className="c4-register-note">{v4("rgdViewer")}</p>}
      {queue.loading && <p className="c4-register-meta">{v4("rgdEmpty")}</p>}
      {queue.error && <p className="c4-register-meta">{queue.error}</p>}
      <ul className="c4-register-kpis" aria-label={v4("rgdRules")}>
        <li><span>{v4("rgdLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("rgdUnmarked")}</strong></li>
        <li><span>{v4("rgdToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("rgdUnmarked")}</strong></li>
        <li><span>{v4("rgdDawn")}</span><strong>{laneRegisterCount(rows, "dawn", now)}</strong></li>
        <li><span>{v4("rgdArchive")}</span><strong>{laneRegisterCount(rows, "archive", now)}</strong></li>
        <li><span>{v4("rgdShare")}</span><strong>{registerShare(laneRegisterCount(rows, "archive", now), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("rgdQuiet")}</span><strong>{rows.filter((row) => registerQuiet(row.opened)).length}</strong></li>
        <li><span>{v4("rgdToday")}</span><strong>{rows.filter((row) => registerToday(row.opened, now)).length}</strong></li>
        <li><span>{v4("rgdWelcome")}</span><strong>{rows.filter((row) => registerWelcome(row.opened, now)).length}</strong></li>
        <li><span>{v4("rgdTwin")}</span><strong>{sharedRegisterCount(rows, now)}</strong></li>
      </ul>
      <div className="c4-register-chart" aria-label={v4("rgdRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-register-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-register-tools">
        <input ref={searchRef} className="c4-field c4-register-search" aria-label={v4("rgdSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rgdSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("rgdAll") : hueLabel(v4, item)}</button>
        ))}
        {SHAPES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("rgdAll") : item === "reviewed" ? v4("rgdReviewed") : v4("rgdFreshCut")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("rgdShow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("register-lanes.csv", registerLanesCsv(rows, now))}>{v4("rgdCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("register-rows.csv", registerRowsCsv(rows, reviewed, now))}>{v4("rgdRowCsv")}</button>
      </div>
      <ul className="c4-register-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleRegister(hidden, item))}>{hidden.includes(item) ? v4("rgdShow") : v4("rgdHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-register-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRegisterReview(reviewed, picked, true))}>{v4("rgdBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRegisterReview(reviewed, picked, false))}>{v4("rgdBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-register-empty">{v4("rgdEmpty")}</p>}
      <ol className="c4-register-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          const days = registerDays(row.opened, now);
          return (
            <li key={row.id} className="c4-register-card" data-on={index === focusAt ? "1" : "0"} data-lane={registerLane(row.opened, now)} data-hue={registerHue(row.opened, now)} data-reviewed={seen ? "1" : "0"} data-warm={registerDawn(row.opened, now) ? "1" : "0"} data-cold={registerArchive(row.opened, now) ? "1" : "0"} data-today={registerToday(row.opened, now) ? "1" : "0"} data-welcome={registerWelcome(row.opened, now) ? "1" : "0"}>
              <p className="c4-register-stamp">{registerStamp(row.opened, now) || "·"}</p>
              <label className="c4-register-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("rgdUnmarked")}</strong>
                <p className="c4-register-meta">{laneLabel(v4, registerLane(row.opened, now))} · {hueLabel(v4, registerHue(row.opened, now))} · {v4("rgdStep")} {registerStep(row.opened, now)}{days !== null ? ` · ${days}d` : ""}{registerWeekday(row.opened, now) ? ` · ${v4("rgdWeekday")}` : ""}{registerWeekend(row.opened, now) ? ` · ${v4("rgdWeekend")}` : ""}{registerMorning(row.opened, now) ? ` · ${v4("rgdMorning")}` : ""}{registerEven(row.opened, now) ? ` · ${v4("rgdEven")}` : ""}{registerLeap(row.opened, now) ? ` · ${v4("rgdLeap")}` : ""}{registerFirst(row.opened, now) ? ` · ${v4("rgdFirst")}` : ""}{registerAnniversary(row.opened, now) ? ` · ${v4("rgdAnniversary")}` : ""}{registerFuture(row.opened, now) ? ` · ${v4("rgdFuture")}` : ""}{registerTwin(row.opened, now) ? ` · ${v4("rgdTwin")}` : ""}{registerTail(row.opened) ? ` · ${v4("rgdTail")}` : ""}{registerMark(row.opened) ? ` · ${v4("rgdMark")}` : ""}{registerSpace(row.opened) ? ` · ${v4("rgdSpace")}` : ""}{registerQuiet(row.opened) ? ` · ${v4("rgdQuiet")}` : ""}{registerWelcome(row.opened, now) ? ` · ${v4("rgdWelcome")}` : ""}</p>
                <div className="c4-register-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleRegisterReview(reviewed, row.id))}>{seen ? v4("rgdReviewed") : v4("rgdReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(registerCopy(row.opened)); setCopied(row.id); }}>{copied === row.id ? v4("rgdCopied") : v4("rgdCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
