"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  ORRERY_WORLDS,
  ORY_DENSITY_KEY,
  ORY_KEY,
  ORY_VIEW_KEY,
  WRD_KEY,
  WRD_REVIEW_KEY,
  addOrrery,
  addOrreryTag,
  addOrreryView,
  briskOrrery,
  bulkOrreryBlaze,
  bulkOrreryLog,
  bulkOrreryStow,
  bulkOrreryTag,
  bulkWardReview,
  busiestOrbKeeper,
  climateFocused,
  cradleOrreryFocused,
  cycleClimate,
  dropOrreryView,
  editOrrery,
  editOrreryNote,
  fairOrbKeeper,
  idleOrrery,
  innerWorld,
  laneWardCount,
  lateOrrery,
  leadingWard,
  leadingWardHue,
  liftRadiusFocused,
  logOrreryFocused,
  lowerMoonFocused,
  lowerRadiusFocused,
  moveOrreryFocus,
  orreryBars,
  orreryCopy,
  orreryCounts,
  orreryCsv,
  orreryDensity,
  orreryKeepers,
  orreryTimeline,
  outerWorld,
  overdueOrrery,
  presentWardLanes,
  raiseMoonFocused,
  readHiddenWard,
  readOrreryViews,
  readOrrerys,
  readReviewedWard,
  reminderOrrerys,
  restingOrrery,
  setOrreryClimate,
  setOrreryCradle,
  setOrreryLogged,
  setOrreryStar,
  setOrreryStow,
  sortOrrerys,
  starOrreryFocused,
  suggestOrreryClimate,
  suggestRadius,
  suggestWorld,
  tagOrreryFocused,
  toggleWard,
  toggleWardReview,
  visibleOrrerys,
  visibleWard,
  visibleWardLanes,
  wardCopy,
  wardEven,
  wardFirst,
  wardHeld,
  wardHour,
  wardHue,
  wardLane,
  wardLanes,
  wardLanesCsv,
  wardLeap,
  wardMark,
  wardMinutes,
  wardMorning,
  wardOpen,
  wardRowsCsv,
  wardShare,
  wardSoon,
  wardSpace,
  wardSpent,
  wardStamp,
  wardStep,
  wardTail,
  wardToday,
  wardTwin,
  wardWeekday,
  wardWeekend,
  type Orrery,
  type OrreryDensity,
  type OrrerySort,
  type OrreryTray,
  type OrreryView,
  type WardReview,
  type WardRow,
  type WardShape,
  type WardValue,
} from "@/lib/crmv4/round291";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type LockedRow = { id?: string; name?: string | null; lockedUntil?: string | null };

const CLIMATES = ["FROST", "MILD", "BLAZE"] as const;
const RADII = ["2", "4", "8"] as const;
const MOONS = ["0", "2", "4"] as const;
const SHAPES: WardShape[] = ["all", "hour", "day", "week", "far", "spent", "open", "soon", "today", "weekday", "weekend", "morning", "leap", "first", "even", "twin", "tail", "mark", "space", "held"];

const WORLD_KEY: Record<string, CrmV4CopyKey> = {
  mercury: "oryMercury",
  venus: "oryVenus",
  mars: "oryMars",
  saturn: "orySaturn",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "oryAuditSave",
  edit: "oryAuditEdit",
  note: "oryAuditNote",
  climate: "oryAuditClimate",
  log: "oryAuditLog",
  unlog: "oryAuditUnlog",
  cradle: "oryAuditCradle",
  resume: "oryAuditResume",
  stow: "oryAuditStow",
  open: "oryAuditOpen",
  tag: "oryAuditTag",
  moon: "oryAuditMoon",
  radius: "oryAuditRadius",
  lower: "oryAuditLower",
  star: "oryAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hour: "wrdHour",
  day: "wrdDay",
  week: "wrdWeek",
  far: "wrdFar",
  spent: "wrdSpent",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "wrdIvory",
  graphite: "wrdGraphite",
  champagne: "wrdChampagne",
};

const SHAPE_KEY: Record<WardShape, CrmV4CopyKey> = {
  all: "wrdShapeAll",
  hour: "wrdShapeHour",
  day: "wrdShapeDay",
  week: "wrdShapeWeek",
  far: "wrdShapeFar",
  spent: "wrdShapeSpent",
  open: "wrdShapeOpen",
  soon: "wrdShapeSoon",
  today: "wrdShapeToday",
  weekday: "wrdShapeWeekday",
  weekend: "wrdShapeWeekend",
  morning: "wrdShapeMorning",
  leap: "wrdShapeLeap",
  first: "wrdShapeFirst",
  even: "wrdShapeEven",
  twin: "wrdShapeTwin",
  tail: "wrdShapeTail",
  mark: "wrdShapeMark",
  space: "wrdShapeSpace",
  held: "wrdShapeHeld",
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
  return key ? v4(key) : v4("oryBlankWorld");
}

function climateLabel(v4: V4, climate: string): string {
  if (climate === "FROST") return v4("oryFrost");
  if (climate === "MILD") return v4("oryMild");
  if (climate === "BLAZE") return v4("oryBlaze");
  return v4("oryAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("wrdUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("wrdUnmarked");
}

export function OrreryOrbs({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Orrery[]>([]);
  const [views, setViews] = useState<OrreryView[]>([]);
  const [density, setDensity] = useState<OrreryDensity>("wide");
  const [tray, setTray] = useState<OrreryTray>("arm");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("");
  const [climateFilter, setClimateFilter] = useState("all");
  const [worldFilter, setWorldFilter] = useState("all");
  const [radiusFilter, setRadiusFilter] = useState("all");
  const [moonFilter, setMoonFilter] = useState("all");
  const [sort, setSort] = useState<OrrerySort>("world");
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
  const [desk, setDesk] = useState("mercury");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readOrrerys(readJson(ORY_KEY, [])));
    setViews(readOrreryViews(readJson(ORY_VIEW_KEY, [])));
    setDensity(orreryDensity(readJson(ORY_DENSITY_KEY, "wide")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Orrery[]) {
    setCards(next);
    writeJson(ORY_KEY, next);
  }
  function storeViews(next: OrreryView[]) {
    setViews(next);
    writeJson(ORY_VIEW_KEY, next);
  }
  function storeDensity(next: OrreryDensity) {
    setDensity(next);
    writeJson(ORY_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortOrrerys(visibleOrrerys(cards, tray, query, keeperFilter, climateFilter, worldFilter, radiusFilter, moonFilter), sort),
    [cards, tray, query, keeperFilter, climateFilter, worldFilter, radiusFilter, moonFilter, sort],
  );
  const counts = orreryCounts(cards, shown, desk);
  const bars = orreryBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = orreryTimeline(cards);
  const keepers = orreryKeepers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestOrreryClimate(cards);
  const fair = fairOrbKeeper(cards, keepers.join(","));
  const busy = busiestOrbKeeper(cards);
  const reminders = reminderOrrerys(cards);
  const radiusHint = suggestRadius(cards, clock);
  const worldHint = suggestWorld(clock);
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
        setFocusAt((index) => moveOrreryFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveOrreryFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "q" || event.key === "Q") {
        event.preventDefault();
        store(liftRadiusFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setOrreryStow(cards, id, !shown[focusAt]?.stowed));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        store(climateFocused(cards, id));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        store(cradleOrreryFocused(cards, id));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        store(logOrreryFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("orrery-orbs.csv", orreryCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starOrreryFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raiseMoonFocused(cards, id));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        store(lowerMoonFocused(cards, id));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        store(lowerRadiusFocused(cards, id));
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
    <section className="c4-orrery" aria-label={v4("oryTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-orrery-mast">
        <p className="c4-orrery-seal" data-logo="mono">{v4("oryLogo")}</p>
        <div>
          <p className="c4-orrery-kicker">{v4("orySub")}</p>
          <h2 className="c4-title">{v4("oryTitle")}</h2>
        </div>
        <ol className="c4-orrery-index" aria-label={v4("oryTitle")}>
          <li data-tone="gold">{v4("oryBlaze")}</li>
          <li data-tone="ink">{v4("oryMild")}</li>
          <li data-tone="ivory">{v4("oryFrost")}</li>
        </ol>
      </header>
      <p className="c4-orrery-links">
        <Link href={crmv4Href(base, "wrd")}>{v4("wrdTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("oryCustomers")}</Link>
        <Link href={crmv4Href(base, "glance")}>{v4("gcCourtKicker")}</Link>
      </p>
      <p className="c4-orrery-hint">{v4("oryHint")}</p>
      {viewer && <p className="c4-orrery-note">{v4("oryViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-orrery-notice" role="status">{v4("oryOverdue")} {counts.overdue}</p>}
      <ol className="c4-orrery-dials" aria-label={v4("oryChart")}>
        <li><span>{v4("oryArm")}</span><strong>{counts.arm}</strong></li>
        <li><span>{v4("oryCradle")}</span><strong>{counts.cradle}</strong></li>
        <li><span>{v4("oryCoffer")}</span><strong>{counts.coffer}</strong></li>
        <li><span>{v4("oryOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("oryIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("oryBrisk")}</span><strong>{counts.brisk}</strong></li>
        <li><span>{v4("oryFair")}</span><strong>{fair || "·"}</strong></li>
        <li><span>{v4("oryBusy")}</span><strong>{busy || "·"}</strong></li>
      </ol>
      <div className="c4-orrery-chart" aria-label={v4("oryChart")}>
        {bars.map((bar) => (
          <button key={bar.world} type="button" className="c4-orrery-column" data-on={worldFilter === bar.world ? "1" : "0"} data-world={bar.world} onClick={() => setWorldFilter(worldFilter === bar.world ? "all" : bar.world)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{worldLabel(v4, bar.world)}</span>
          </button>
        ))}
      </div>
      <div className="c4-orrery-tools">
        <input ref={searchRef} className="c4-field c4-orrery-search" aria-label={v4("orySearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("orySearch")} />
        {(["arm", "cradle", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "arm" ? "oryArm" : item === "cradle" ? "oryCradle" : "oryCoffer")}</button>
        ))}
        {(["all", "inner", "outer", ...ORRERY_WORLDS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={worldFilter === item ? "1" : "0"} onClick={() => setWorldFilter(item)}>{item === "all" ? v4("oryAll") : item === "inner" ? v4("oryInner") : item === "outer" ? v4("oryOuter") : worldLabel(v4, item)}</button>
        ))}
        {["all", ...CLIMATES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={climateFilter === item ? "1" : "0"} onClick={() => setClimateFilter(item)}>{item === "all" ? v4("oryClimate") : climateLabel(v4, item)}</button>
        ))}
        {["all", ...RADII].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={radiusFilter === item ? "1" : "0"} onClick={() => setRadiusFilter(item)}>{item === "all" ? v4("oryRadius") : item}</button>
        ))}
        {["all", ...MOONS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={moonFilter === item ? "1" : "0"} onClick={() => setMoonFilter(item)}>{item === "all" ? v4("oryMoon") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort(sort === "world" ? "keeper" : "world")}>{sort === "world" ? v4("orySortWorld") : v4("orySortKeeper")}</button>
        <button type="button" className="c4-chip" data-on={density === "narrow" ? "1" : "0"} onClick={() => storeDensity(density === "wide" ? "narrow" : "wide")}>{density === "wide" ? v4("oryWide") : v4("oryNarrow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("orrery-orbs.csv", orreryCsv(shown, desk))}>{v4("oryCsv")}</button>
      </div>
      <div className="c4-orrery-tools" role="group" aria-label={v4("oryDesk")}>
        {ORRERY_WORLDS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("oryDesk")} {worldLabel(v4, item)}</button>
        ))}
        <span className="c4-orrery-meta">{v4("orySuggest")} {climateLabel(v4, suggested)} · {radiusHint} · {worldLabel(v4, worldHint)}</span>
      </div>
      <form className="c4-orrery-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addOrrery(cards, { title, note, keeper, world, climate: climate || suggested, radius: radiusNo, moon: moonNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("oryEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("oryTitle")} />
        <input className="c4-field" aria-label={v4("oryNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("oryNote")} />
        <input className="c4-field" aria-label={v4("oryKeeper")} aria-required={false} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} placeholder={v4("oryKeeper")} />
        <select className="c4-select" aria-label={v4("oryWorld")} value={world} disabled={viewer} onChange={(event) => setWorld(event.target.value)}>
          <option value="">{v4("oryBlankWorld")}</option>
          {ORRERY_WORLDS.map((item) => <option key={item} value={item}>{worldLabel(v4, item)}</option>)}
        </select>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("oryAdd")}</button>
      </form>
      <form className="c4-orrery-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addOrreryView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, keeper: keeperFilter, climate: climateFilter, world: worldFilter, radius: radiusFilter, moon: moonFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("oryViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("oryViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("orySaveView")}</button>
      </form>
      <ul className="c4-orrery-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setKeeperFilter(view.keeper); setClimateFilter(view.climate); setWorldFilter(view.world); setRadiusFilter(view.radius); setMoonFilter(view.moon); }}>{v4("oryApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropOrreryView(views, view.id))}>{v4("oryDrop")}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-orrery-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkOrreryBlaze(cards, picked))}>{v4("oryBulkBlaze")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkOrreryLog(cards, picked))}>{v4("oryBulkLog")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkOrreryStow(cards, picked))}>{v4("oryBulkStow")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkOrreryTag(cards, picked))}>{v4("oryBulkTag")}</button>
        </div>
      )}
      <p className="c4-orrery-meta">{v4("oryKeys")} · j k n l g v s f q u y x /</p>
      {timeline.length > 0 && (
        <ol className="c4-orrery-time" aria-label={v4("oryTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.radius}><span>{v4("oryRadius")} {lane.radius}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
        </ol>
      )}
      {reminders.length > 0 && <p className="c4-orrery-meta">{v4("oryRemind")} {reminders.join(" · ")}</p>}
      {!shown.length && <p className="c4-orrery-empty">{v4("oryEmpty")}</p>}
      <ol className="c4-orrery-board">
        {shown.map((card, index) => {
          const on = index === focusAt;
          return (
            <li key={card.id} className="c4-orrery-card" data-on={on ? "1" : "0"} data-overdue={overdueOrrery(card) ? "1" : "0"} data-idle={idleOrrery(card) ? "1" : "0"} data-brisk={briskOrrery(card) ? "1" : "0"} data-resting={restingOrrery(card) ? "1" : "0"} data-late={lateOrrery(card, desk) ? "1" : "0"} data-outer={outerWorld(card.world) ? "1" : "0"} data-inner={innerWorld(card.world) ? "1" : "0"} data-star={card.flagged ? "1" : "0"}>
              <label className="c4-orrery-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((current) => (current.includes(card.id) ? current.filter((item) => item !== card.id) : [...current, card.id]))} /></label>
              <div>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("oryEdit")} aria-required={false} value={card.title} onChange={(event) => store(editOrrery(cards, card.id, event.target.value))} />
                ) : (
                  <strong>{card.title}</strong>
                )}
                <p className="c4-orrery-meta">{card.keeper || v4("oryKeeper")} · {worldLabel(v4, card.world)} · {climateLabel(v4, card.climate)} · {card.radius ?? "·"} · {v4("oryMoon")} {card.moon}{card.tags.length ? ` · ${card.tags.join("")}` : ""}{card.audit ? ` · ${AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : card.audit}` : ""}</p>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("oryNote")} aria-required={false} value={card.note} onChange={(event) => store(editOrreryNote(cards, card.id, event.target.value))} />
                ) : (
                  card.note && <p className="c4-orrery-meta">{card.note}</p>
                )}
                <div className="c4-orrery-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrreryLogged(cards, card.id, !card.logged))}>{card.logged ? v4("oryUnlog") : v4("oryLog")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrreryCradle(cards, card.id, !card.locked))}>{card.locked ? v4("oryUnlock") : v4("oryLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrreryStow(cards, card.id, !card.stowed))}>{card.stowed ? v4("oryUnstow") : v4("oryStow")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrreryStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("oryUnstar") : v4("oryStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrreryClimate(cards, card.id, cycleClimate(card.climate)))}>{v4("oryClimate")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftRadiusFocused(cards, card.id))}>{v4("oryLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRadiusFocused(cards, card.id))}>{v4("oryLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseMoonFocused(cards, card.id))}>{v4("oryMoon")}+</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerMoonFocused(cards, card.id))}>{v4("oryMoon")}−</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addOrreryTag(cards, card.id, "x"))}>{v4("oryTag")} x</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(tagOrreryFocused(cards, card.id))}>{v4("oryTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(orreryCopy(card)); }}>{v4("wrdCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="c4-orrery-meta">{v4("oryMatched")} {counts.matched} · {ids.length}</p>
    </section>
  );
}

export function WardPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: LockedRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<WardShape>("all");
  const [review, setReview] = useState<WardReview>("all");
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

  const rows = useMemo<WardRow[]>(() => {
    return (queue.data?.users || []).map((row, index) => ({
      id: textField(row.id) || `c${index}`,
      label: textField(row.name),
      until: { lockedUntil: textField(row.lockedUntil) } satisfies WardValue,
    }));
  }, [queue.data]);

  useEffect(() => {
    const ids = rows.map((row) => row.id);
    const clock = Date.now();
    setHidden(readHiddenWard(readJson(WRD_KEY, []), presentWardLanes(rows, clock)));
    setReviewed(readReviewedWard(readJson(WRD_REVIEW_KEY, []), ids));
  }, [rows]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(WRD_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(WRD_REVIEW_KEY, next);
  }

  const lanes = visibleWardLanes(presentWardLanes(rows, now), hidden, showHidden);
  const shown = visibleWard(rows, lane, hue, query, review, reviewed, shape, now).filter((row) => !hidden.includes(wardLane(row.until, now)) || showHidden);
  const bars = wardLanes(rows, now);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingWard(rows, now);
  const leadHue = leadingWardHue(rows, now);
  const soon = rows.filter((row) => wardSoon(row.until, now)).length;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveOrreryFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveOrreryFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        if (viewer) return;
        const id = shown[focusAt]?.id;
        if (id) storeReviewed(toggleWardReview(reviewed, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("ward-rows.csv", wardRowsCsv(rows, reviewed, now));
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
    <section className="c4-ward" aria-label={v4("wrdTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-ward-mast">
        <p className="c4-ward-seal" data-logo="mono">{v4("wrdLogo")}</p>
        <div>
          <p className="c4-ward-kicker">{v4("wrdSub")}</p>
          <h2 className="c4-title">{v4("wrdTitle")}</h2>
        </div>
      </header>
      <ol className="c4-ward-index" aria-label={v4("wrdTitle")}>
        <li data-tone="gold">{v4("wrdHour")}</li>
        <li data-tone="ink">{v4("wrdSpent")}</li>
        <li data-tone="ivory">{v4("wrdDay")}</li>
        <li data-tone="mist">{v4("wrdWeek")}</li>
        <li data-tone="line">{v4("wrdFar")}</li>
      </ol>
      <p className="c4-ward-links">
        <Link href={crmv4Href(base, "ory")}>{v4("oryTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("oryCustomers")}</Link>
        <Link href={crmv4Href(base, "docpulse")}>{v4("xpLoftKicker")}</Link>
      </p>
      <p className="c4-ward-hint">{v4("wrdHint")}</p>
      {viewer && <p className="c4-ward-note">{v4("wrdViewer")}</p>}
      {soon > 0 && <p className="c4-ward-notice" role="status">{v4("wrdSoon")} {soon}</p>}
      {queue.loading && <p className="c4-ward-meta">{v4("wrdEmpty")}</p>}
      {queue.error && <p className="c4-ward-meta">{queue.error}</p>}
      <ul className="c4-ward-kpis" aria-label={v4("wrdRules")}>
        <li><span>{v4("wrdLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("wrdUnmarked")}</strong></li>
        <li><span>{v4("wrdToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("wrdUnmarked")}</strong></li>
        <li><span>{v4("wrdHour")}</span><strong>{laneWardCount(rows, "hour", now)}</strong></li>
        <li><span>{v4("wrdSpent")}</span><strong>{laneWardCount(rows, "spent", now)}</strong></li>
        <li><span>{v4("wrdShare")}</span><strong>{wardShare(laneWardCount(rows, "far", now), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("wrdOpen")}</span><strong>{rows.filter((row) => wardOpen(row.until, now)).length}</strong></li>
        <li><span>{v4("wrdToday")}</span><strong>{rows.filter((row) => wardToday(row.until, now)).length}</strong></li>
        <li><span>{v4("wrdHeld")}</span><strong>{rows.filter((row) => wardHeld(row.until, now)).length}</strong></li>
        <li><span>{v4("wrdTwin")}</span><strong>{rows.filter((row) => wardTwin(row.until, now)).length}</strong></li>
      </ul>
      <div className="c4-ward-chart" aria-label={v4("wrdRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-ward-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-ward-tools">
        <input ref={searchRef} className="c4-field c4-ward-search" aria-label={v4("wrdSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("wrdSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("wrdAll") : hueLabel(v4, item)}</button>
        ))}
        {SHAPES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("wrdAll") : item === "reviewed" ? v4("wrdReviewed") : v4("wrdFresh")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("wrdShow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("ward-lanes.csv", wardLanesCsv(rows, now))}>{v4("wrdCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("ward-rows.csv", wardRowsCsv(rows, reviewed, now))}>{v4("wrdRowCsv")}</button>
      </div>
      <ul className="c4-ward-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleWard(hidden, item))}>{hidden.includes(item) ? v4("wrdShow") : v4("wrdHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-ward-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkWardReview(reviewed, picked, true))}>{v4("wrdBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkWardReview(reviewed, picked, false))}>{v4("wrdBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-ward-empty">{v4("wrdEmpty")}</p>}
      <ol className="c4-ward-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          const minutes = wardMinutes(row.until, now);
          return (
            <li key={row.id} className="c4-ward-card" data-on={index === focusAt ? "1" : "0"} data-lane={wardLane(row.until, now)} data-hue={wardHue(row.until, now)} data-reviewed={seen ? "1" : "0"} data-hour={wardHour(row.until, now) ? "1" : "0"} data-spent={wardSpent(row.until, now) ? "1" : "0"} data-today={wardToday(row.until, now) ? "1" : "0"} data-soon={wardSoon(row.until, now) ? "1" : "0"}>
              <p className="c4-ward-stamp">{wardStamp(row.until, now) || "·"}</p>
              <label className="c4-ward-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("wrdUnmarked")}</strong>
                <p className="c4-ward-meta">{laneLabel(v4, wardLane(row.until, now))} · {hueLabel(v4, wardHue(row.until, now))} · {v4("wrdStep")} {wardStep(row.until, now)}{minutes !== null ? ` · ${minutes}m` : ""}{wardWeekday(row.until, now) ? ` · ${v4("wrdWeekday")}` : ""}{wardWeekend(row.until, now) ? ` · ${v4("wrdWeekend")}` : ""}{wardMorning(row.until, now) ? ` · ${v4("wrdMorning")}` : ""}{wardEven(row.until, now) ? ` · ${v4("wrdEven")}` : ""}{wardLeap(row.until, now) ? ` · ${v4("wrdLeap")}` : ""}{wardFirst(row.until, now) ? ` · ${v4("wrdFirst")}` : ""}{wardHeld(row.until, now) ? ` · ${v4("wrdHeld")}` : ""}{wardSoon(row.until, now) ? ` · ${v4("wrdSoon")}` : ""}{wardTwin(row.until, now) ? ` · ${v4("wrdTwin")}` : ""}{wardTail(row.until) ? ` · ${v4("wrdTail")}` : ""}{wardMark(row.until) ? ` · ${v4("wrdMark")}` : ""}{wardSpace(row.until) ? ` · ${v4("wrdSpace")}` : ""}{wardOpen(row.until, now) ? ` · ${v4("wrdOpen")}` : ""}</p>
                <div className="c4-ward-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleWardReview(reviewed, row.id))}>{seen ? v4("wrdReviewed") : v4("wrdReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(wardCopy(row.until)); setCopied(row.id); }}>{copied === row.id ? v4("wrdCopied") : v4("wrdCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
