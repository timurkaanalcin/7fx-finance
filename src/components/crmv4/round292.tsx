"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CLEPSYDRA_VESSELS,
  CLY_DENSITY_KEY,
  CLY_KEY,
  CLY_VIEW_KEY,
  TDE_KEY,
  TDE_REVIEW_KEY,
  addClepsydra,
  addClepsydraTag,
  addClepsydraView,
  briskClepsydra,
  bulkClepsydraRush,
  bulkClepsydraLog,
  bulkClepsydraStow,
  bulkClepsydraTag,
  bulkTideReview,
  busiestBowlKeeper,
  dripFocused,
  cisternClepsydraFocused,
  cycleDrip,
  dropClepsydraView,
  editClepsydra,
  editClepsydraNote,
  fairBowlKeeper,
  idleClepsydra,
  innerVessel,
  laneTideCount,
  lateClepsydra,
  leadingTide,
  leadingTideHue,
  liftDropFocused,
  logClepsydraFocused,
  lowerNotchFocused,
  lowerDropFocused,
  moveClepsydraFocus,
  clepsydraBars,
  clepsydraCopy,
  clepsydraCounts,
  clepsydraCsv,
  clepsydraDensity,
  clepsydraKeepers,
  clepsydraTimeline,
  outerVessel,
  overdueClepsydra,
  presentTideLanes,
  raiseNotchFocused,
  readHiddenTide,
  readClepsydraViews,
  readClepsydras,
  readReviewedTide,
  reminderClepsydras,
  restingClepsydra,
  setClepsydraDrip,
  setClepsydraCistern,
  setClepsydraLogged,
  setClepsydraStar,
  setClepsydraStow,
  sortClepsydras,
  starClepsydraFocused,
  suggestClepsydraDrip,
  suggestDrop,
  suggestVessel,
  tagClepsydraFocused,
  toggleTide,
  toggleTideReview,
  visibleClepsydras,
  visibleTide,
  visibleTideLanes,
  tideCopy,
  tideEven,
  tideFirst,
  tideHeld,
  tideEbb,
  tideHue,
  tideLane,
  tideLanes,
  tideLanesCsv,
  tideLeap,
  tideMark,
  tideMinutes,
  tideMorning,
  tideOpen,
  tideRowsCsv,
  tideShare,
  tideSoon,
  tideSpace,
  tideSpent,
  tideStamp,
  tideStep,
  tideTail,
  tideToday,
  tideTwin,
  tideWeekday,
  tideWeekend,
  type Clepsydra,
  type ClepsydraDensity,
  type ClepsydraSort,
  type ClepsydraTray,
  type ClepsydraView,
  type TideReview,
  type TideRow,
  type TideShape,
  type TideValue,
} from "@/lib/crmv4/round292";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type LockedRow = { id?: string; name?: string | null; expiresAt?: string | null };

const CLIMATES = ["TRICKLE", "STEADY", "RUSH"] as const;
const DROPS = ["3", "6", "9"] as const;
const NOTCHES = ["1", "3", "5"] as const;
const SHAPES: TideShape[] = ["all", "ebb", "neap", "spring", "flood", "spent", "open", "soon", "today", "weekday", "weekend", "morning", "leap", "first", "even", "twin", "tail", "mark", "space", "held"];

const WORLD_KEY: Record<string, CrmV4CopyKey> = {
  clay: "clyClay",
  glass: "clyGlass",
  bronze: "clyBronze",
  pearl: "clyPearl",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "clyAuditSave",
  edit: "clyAuditEdit",
  note: "clyAuditNote",
  drip: "clyAuditDrip",
  log: "clyAuditLog",
  unlog: "clyAuditUnlog",
  cistern: "clyAuditCistern",
  resume: "clyAuditResume",
  stow: "clyAuditStow",
  open: "clyAuditOpen",
  tag: "clyAuditTag",
  notch: "clyAuditNotch",
  drop: "clyAuditDrop",
  lower: "clyAuditLower",
  star: "clyAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  ebb: "tdeEbb",
  neap: "tdeNeap",
  spring: "tdeSpring",
  flood: "tdeFlood",
  spent: "tdeSpent",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "tdeIvory",
  graphite: "tdeGraphite",
  champagne: "tdeChampagne",
};

const SHAPE_KEY: Record<TideShape, CrmV4CopyKey> = {
  all: "tdeShapeAll",
  ebb: "tdeShapeEbb",
  neap: "tdeShapeNeap",
  spring: "tdeShapeSpring",
  flood: "tdeShapeFlood",
  spent: "tdeShapeSpent",
  open: "tdeShapeOpen",
  soon: "tdeShapeSoon",
  today: "tdeShapeToday",
  weekday: "tdeShapeWeekday",
  weekend: "tdeShapeWeekend",
  morning: "tdeShapeMorning",
  leap: "tdeShapeLeap",
  first: "tdeShapeFirst",
  even: "tdeShapeEven",
  twin: "tdeShapeTwin",
  tail: "tdeShapeTail",
  mark: "tdeShapeMark",
  space: "tdeShapeSpace",
  held: "tdeShapeHeld",
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
  return key ? v4(key) : v4("clyBlankWorld");
}

function climateLabel(v4: V4, climate: string): string {
  if (climate === "TRICKLE") return v4("clyFrost");
  if (climate === "STEADY") return v4("clyMild");
  if (climate === "RUSH") return v4("clyBlaze");
  return v4("clyAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("tdeUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("tdeUnmarked");
}

export function ClepsydraBowls({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Clepsydra[]>([]);
  const [views, setViews] = useState<ClepsydraView[]>([]);
  const [density, setDensity] = useState<ClepsydraDensity>("wide");
  const [tray, setTray] = useState<ClepsydraTray>("bowl");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("");
  const [climateFilter, setClimateFilter] = useState("all");
  const [worldFilter, setWorldFilter] = useState("all");
  const [radiusFilter, setRadiusFilter] = useState("all");
  const [moonFilter, setMoonFilter] = useState("all");
  const [sort, setSort] = useState<ClepsydraSort>("vessel");
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
  const [desk, setDesk] = useState("clay");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readClepsydras(readJson(CLY_KEY, [])));
    setViews(readClepsydraViews(readJson(CLY_VIEW_KEY, [])));
    setDensity(clepsydraDensity(readJson(CLY_DENSITY_KEY, "wide")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Clepsydra[]) {
    setCards(next);
    writeJson(CLY_KEY, next);
  }
  function storeViews(next: ClepsydraView[]) {
    setViews(next);
    writeJson(CLY_VIEW_KEY, next);
  }
  function storeDensity(next: ClepsydraDensity) {
    setDensity(next);
    writeJson(CLY_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortClepsydras(visibleClepsydras(cards, tray, query, keeperFilter, climateFilter, worldFilter, radiusFilter, moonFilter), sort),
    [cards, tray, query, keeperFilter, climateFilter, worldFilter, radiusFilter, moonFilter, sort],
  );
  const counts = clepsydraCounts(cards, shown, desk);
  const bars = clepsydraBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = clepsydraTimeline(cards);
  const keepers = clepsydraKeepers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestClepsydraDrip(cards);
  const fair = fairBowlKeeper(cards, keepers.join(","));
  const busy = busiestBowlKeeper(cards);
  const reminders = reminderClepsydras(cards);
  const radiusHint = suggestDrop(cards, clock);
  const worldHint = suggestVessel(clock);
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
        setFocusAt((index) => moveClepsydraFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveClepsydraFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "q" || event.key === "Q") {
        event.preventDefault();
        store(liftDropFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setClepsydraStow(cards, id, !shown[focusAt]?.stowed));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        store(dripFocused(cards, id));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        store(cisternClepsydraFocused(cards, id));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        store(logClepsydraFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("clepsydra-bowls.csv", clepsydraCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starClepsydraFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raiseNotchFocused(cards, id));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        store(lowerNotchFocused(cards, id));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        store(lowerDropFocused(cards, id));
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
    <section className="c4-clepsydra" aria-label={v4("clyTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-clepsydra-mast">
        <p className="c4-clepsydra-seal" data-logo="mono">{v4("clyLogo")}</p>
        <div>
          <p className="c4-clepsydra-kicker">{v4("clySub")}</p>
          <h2 className="c4-title">{v4("clyTitle")}</h2>
        </div>
        <ol className="c4-clepsydra-index" aria-label={v4("clyTitle")}>
          <li data-tone="gold">{v4("clyBlaze")}</li>
          <li data-tone="ink">{v4("clyMild")}</li>
          <li data-tone="ivory">{v4("clyFrost")}</li>
        </ol>
      </header>
      <p className="c4-clepsydra-links">
        <Link href={crmv4Href(base, "tde")}>{v4("tdeTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("clyCustomers")}</Link>
        <Link href={crmv4Href(base, "pinboard")}>{v4("pnAtelierKicker")}</Link>
      </p>
      <p className="c4-clepsydra-hint">{v4("clyHint")}</p>
      {viewer && <p className="c4-clepsydra-note">{v4("clyViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-clepsydra-notice" role="status">{v4("clyOverdue")} {counts.overdue}</p>}
      <ol className="c4-clepsydra-dials" aria-label={v4("clyChart")}>
        <li><span>{v4("clyArm")}</span><strong>{counts.arm}</strong></li>
        <li><span>{v4("clyCradle")}</span><strong>{counts.cradle}</strong></li>
        <li><span>{v4("clyCoffer")}</span><strong>{counts.coffer}</strong></li>
        <li><span>{v4("clyOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("clyIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("clyBrisk")}</span><strong>{counts.brisk}</strong></li>
        <li><span>{v4("clyFair")}</span><strong>{fair || "·"}</strong></li>
        <li><span>{v4("clyBusy")}</span><strong>{busy || "·"}</strong></li>
      </ol>
      <div className="c4-clepsydra-chart" aria-label={v4("clyChart")}>
        {bars.map((bar) => (
          <button key={bar.vessel} type="button" className="c4-clepsydra-column" data-on={worldFilter === bar.vessel ? "1" : "0"} data-world={bar.vessel} onClick={() => setWorldFilter(worldFilter === bar.vessel ? "all" : bar.vessel)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{worldLabel(v4, bar.vessel)}</span>
          </button>
        ))}
      </div>
      <div className="c4-clepsydra-tools">
        <input ref={searchRef} className="c4-field c4-clepsydra-search" aria-label={v4("clySearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("clySearch")} />
        {(["bowl", "cistern", "cellar"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bowl" ? "clyArm" : item === "cistern" ? "clyCradle" : "clyCoffer")}</button>
        ))}
        {(["all", "inner", "outer", ...CLEPSYDRA_VESSELS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={worldFilter === item ? "1" : "0"} onClick={() => setWorldFilter(item)}>{item === "all" ? v4("clyAll") : item === "inner" ? v4("clyInner") : item === "outer" ? v4("clyOuter") : worldLabel(v4, item)}</button>
        ))}
        {["all", ...CLIMATES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={climateFilter === item ? "1" : "0"} onClick={() => setClimateFilter(item)}>{item === "all" ? v4("clyClimate") : climateLabel(v4, item)}</button>
        ))}
        {["all", ...DROPS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={radiusFilter === item ? "1" : "0"} onClick={() => setRadiusFilter(item)}>{item === "all" ? v4("clyRadius") : item}</button>
        ))}
        {["all", ...NOTCHES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={moonFilter === item ? "1" : "0"} onClick={() => setMoonFilter(item)}>{item === "all" ? v4("clyMoon") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort(sort === "vessel" ? "keeper" : "vessel")}>{sort === "vessel" ? v4("clySortVessel") : v4("clySortKeeper")}</button>
        <button type="button" className="c4-chip" data-on={density === "narrow" ? "1" : "0"} onClick={() => storeDensity(density === "wide" ? "narrow" : "wide")}>{density === "wide" ? v4("clyWide") : v4("clyNarrow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("clepsydra-bowls.csv", clepsydraCsv(shown, desk))}>{v4("clyCsv")}</button>
      </div>
      <div className="c4-clepsydra-tools" role="group" aria-label={v4("clyDesk")}>
        {CLEPSYDRA_VESSELS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("clyDesk")} {worldLabel(v4, item)}</button>
        ))}
        <span className="c4-clepsydra-meta">{v4("clySuggest")} {climateLabel(v4, suggested)} · {radiusHint} · {worldLabel(v4, worldHint)}</span>
      </div>
      <form className="c4-clepsydra-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addClepsydra(cards, { title, note, keeper, vessel: world, drip: climate || suggested, drop: radiusNo, notch: moonNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("clyEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("clyTitle")} />
        <input className="c4-field" aria-label={v4("clyNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("clyNote")} />
        <input className="c4-field" aria-label={v4("clyKeeper")} aria-required={false} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} placeholder={v4("clyKeeper")} />
        <select className="c4-select" aria-label={v4("clyWorld")} value={world} disabled={viewer} onChange={(event) => setWorld(event.target.value)}>
          <option value="">{v4("clyBlankWorld")}</option>
          {CLEPSYDRA_VESSELS.map((item) => <option key={item} value={item}>{worldLabel(v4, item)}</option>)}
        </select>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("clyAdd")}</button>
      </form>
      <form className="c4-clepsydra-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addClepsydraView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, keeper: keeperFilter, drip: climateFilter, vessel: worldFilter, drop: radiusFilter, notch: moonFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("clyViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("clyViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("clySaveView")}</button>
      </form>
      <ul className="c4-clepsydra-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setKeeperFilter(view.keeper); setClimateFilter(view.drip); setWorldFilter(view.vessel); setRadiusFilter(view.drop); setMoonFilter(view.notch); }}>{v4("clyApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropClepsydraView(views, view.id))}>{v4("clyDrop")}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-clepsydra-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkClepsydraRush(cards, picked))}>{v4("clyBulkBlaze")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkClepsydraLog(cards, picked))}>{v4("clyBulkLog")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkClepsydraStow(cards, picked))}>{v4("clyBulkStow")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkClepsydraTag(cards, picked))}>{v4("clyBulkTag")}</button>
        </div>
      )}
      <p className="c4-clepsydra-meta">{v4("clyKeys")} · j k n l g v s f q u y x /</p>
      {timeline.length > 0 && (
        <ol className="c4-clepsydra-time" aria-label={v4("clyTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.drop}><span>{v4("clyRadius")} {lane.drop}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
        </ol>
      )}
      {reminders.length > 0 && <p className="c4-clepsydra-meta">{v4("clyRemind")} {reminders.join(" · ")}</p>}
      {!shown.length && <p className="c4-clepsydra-empty">{v4("clyEmpty")}</p>}
      <ol className="c4-clepsydra-board">
        {shown.map((card, index) => {
          const on = index === focusAt;
          return (
            <li key={card.id} className="c4-clepsydra-card" data-on={on ? "1" : "0"} data-overdue={overdueClepsydra(card) ? "1" : "0"} data-idle={idleClepsydra(card) ? "1" : "0"} data-brisk={briskClepsydra(card) ? "1" : "0"} data-resting={restingClepsydra(card) ? "1" : "0"} data-late={lateClepsydra(card, desk) ? "1" : "0"} data-outer={outerVessel(card.vessel) ? "1" : "0"} data-inner={innerVessel(card.vessel) ? "1" : "0"} data-star={card.flagged ? "1" : "0"}>
              <label className="c4-clepsydra-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((current) => (current.includes(card.id) ? current.filter((item) => item !== card.id) : [...current, card.id]))} /></label>
              <div>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("clyEdit")} aria-required={false} value={card.title} onChange={(event) => store(editClepsydra(cards, card.id, event.target.value))} />
                ) : (
                  <strong>{card.title}</strong>
                )}
                <p className="c4-clepsydra-meta">{card.keeper || v4("clyKeeper")} · {worldLabel(v4, card.vessel)} · {climateLabel(v4, card.drip)} · {card.drop ?? "·"} · {v4("clyMoon")} {card.notch}{card.tags.length ? ` · ${card.tags.join("")}` : ""}{card.audit ? ` · ${AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : card.audit}` : ""}</p>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("clyNote")} aria-required={false} value={card.note} onChange={(event) => store(editClepsydraNote(cards, card.id, event.target.value))} />
                ) : (
                  card.note && <p className="c4-clepsydra-meta">{card.note}</p>
                )}
                <div className="c4-clepsydra-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setClepsydraLogged(cards, card.id, !card.logged))}>{card.logged ? v4("clyUnlog") : v4("clyLog")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setClepsydraCistern(cards, card.id, !card.locked))}>{card.locked ? v4("clyUnlock") : v4("clyLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setClepsydraStow(cards, card.id, !card.stowed))}>{card.stowed ? v4("clyUnstow") : v4("clyStow")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setClepsydraStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("clyUnstar") : v4("clyStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setClepsydraDrip(cards, card.id, cycleDrip(card.drip)))}>{v4("clyClimate")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftDropFocused(cards, card.id))}>{v4("clyLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDropFocused(cards, card.id))}>{v4("clyLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseNotchFocused(cards, card.id))}>{v4("clyMoon")}+</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerNotchFocused(cards, card.id))}>{v4("clyMoon")}−</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addClepsydraTag(cards, card.id, "x"))}>{v4("clyTag")} x</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(tagClepsydraFocused(cards, card.id))}>{v4("clyTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(clepsydraCopy(card)); }}>{v4("tdeCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="c4-clepsydra-meta">{v4("clyMatched")} {counts.matched} · {ids.length}</p>
    </section>
  );
}

export function TidePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: LockedRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<TideShape>("all");
  const [review, setReview] = useState<TideReview>("all");
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

  const rows = useMemo<TideRow[]>(() => {
    return (queue.data?.users || []).map((row, index) => ({
      id: textField(row.id) || `c${index}`,
      label: textField(row.name),
      expires: { expiresAt: textField(row.expiresAt) } satisfies TideValue,
    }));
  }, [queue.data]);

  useEffect(() => {
    const ids = rows.map((row) => row.id);
    const clock = Date.now();
    setHidden(readHiddenTide(readJson(TDE_KEY, []), presentTideLanes(rows, clock)));
    setReviewed(readReviewedTide(readJson(TDE_REVIEW_KEY, []), ids));
  }, [rows]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(TDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(TDE_REVIEW_KEY, next);
  }

  const lanes = visibleTideLanes(presentTideLanes(rows, now), hidden, showHidden);
  const shown = visibleTide(rows, lane, hue, query, review, reviewed, shape, now).filter((row) => !hidden.includes(tideLane(row.expires, now)) || showHidden);
  const bars = tideLanes(rows, now);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingTide(rows, now);
  const leadHue = leadingTideHue(rows, now);
  const soon = rows.filter((row) => tideSoon(row.expires, now)).length;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveClepsydraFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveClepsydraFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        if (viewer) return;
        const id = shown[focusAt]?.id;
        if (id) storeReviewed(toggleTideReview(reviewed, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("tide-rows.csv", tideRowsCsv(rows, reviewed, now));
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
    <section className="c4-tide" aria-label={v4("tdeTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-tide-mast">
        <p className="c4-tide-seal" data-logo="mono">{v4("tdeLogo")}</p>
        <div>
          <p className="c4-tide-kicker">{v4("tdeSub")}</p>
          <h2 className="c4-title">{v4("tdeTitle")}</h2>
        </div>
      </header>
      <ol className="c4-tide-index" aria-label={v4("tdeTitle")}>
        <li data-tone="gold">{v4("tdeEbb")}</li>
        <li data-tone="ink">{v4("tdeSpent")}</li>
        <li data-tone="ivory">{v4("tdeNeap")}</li>
        <li data-tone="mist">{v4("tdeSpring")}</li>
        <li data-tone="line">{v4("tdeFlood")}</li>
      </ol>
      <p className="c4-tide-links">
        <Link href={crmv4Href(base, "cly")}>{v4("clyTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("clyCustomers")}</Link>
        <Link href={crmv4Href(base, "desktimer")}>{v4("dtDialKicker")}</Link>
      </p>
      <p className="c4-tide-hint">{v4("tdeHint")}</p>
      {viewer && <p className="c4-tide-note">{v4("tdeViewer")}</p>}
      {soon > 0 && <p className="c4-tide-notice" role="status">{v4("tdeSoon")} {soon}</p>}
      {queue.loading && <p className="c4-tide-meta">{v4("tdeEmpty")}</p>}
      {queue.error && <p className="c4-tide-meta">{queue.error}</p>}
      <ul className="c4-tide-kpis" aria-label={v4("tdeRules")}>
        <li><span>{v4("tdeLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("tdeUnmarked")}</strong></li>
        <li><span>{v4("tdeToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("tdeUnmarked")}</strong></li>
        <li><span>{v4("tdeEbb")}</span><strong>{laneTideCount(rows, "ebb", now)}</strong></li>
        <li><span>{v4("tdeSpent")}</span><strong>{laneTideCount(rows, "spent", now)}</strong></li>
        <li><span>{v4("tdeShare")}</span><strong>{tideShare(laneTideCount(rows, "flood", now), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("tdeOpen")}</span><strong>{rows.filter((row) => tideOpen(row.expires, now)).length}</strong></li>
        <li><span>{v4("tdeToday")}</span><strong>{rows.filter((row) => tideToday(row.expires, now)).length}</strong></li>
        <li><span>{v4("tdeHeld")}</span><strong>{rows.filter((row) => tideHeld(row.expires, now)).length}</strong></li>
        <li><span>{v4("tdeTwin")}</span><strong>{rows.filter((row) => tideTwin(row.expires, now)).length}</strong></li>
      </ul>
      <div className="c4-tide-chart" aria-label={v4("tdeRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-tide-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-tide-tools">
        <input ref={searchRef} className="c4-field c4-tide-search" aria-label={v4("tdeSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("tdeSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("tdeAll") : hueLabel(v4, item)}</button>
        ))}
        {SHAPES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("tdeAll") : item === "reviewed" ? v4("tdeReviewed") : v4("tdeFresh")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("tdeShow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("tide-lanes.csv", tideLanesCsv(rows, now))}>{v4("tdeCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("tide-rows.csv", tideRowsCsv(rows, reviewed, now))}>{v4("tdeRowCsv")}</button>
      </div>
      <ul className="c4-tide-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleTide(hidden, item))}>{hidden.includes(item) ? v4("tdeShow") : v4("tdeHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-tide-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkTideReview(reviewed, picked, true))}>{v4("tdeBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkTideReview(reviewed, picked, false))}>{v4("tdeBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-tide-empty">{v4("tdeEmpty")}</p>}
      <ol className="c4-tide-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          const minutes = tideMinutes(row.expires, now);
          return (
            <li key={row.id} className="c4-tide-card" data-on={index === focusAt ? "1" : "0"} data-lane={tideLane(row.expires, now)} data-hue={tideHue(row.expires, now)} data-reviewed={seen ? "1" : "0"} data-ebb={tideEbb(row.expires, now) ? "1" : "0"} data-spent={tideSpent(row.expires, now) ? "1" : "0"} data-today={tideToday(row.expires, now) ? "1" : "0"} data-soon={tideSoon(row.expires, now) ? "1" : "0"}>
              <p className="c4-tide-stamp">{tideStamp(row.expires, now) || "·"}</p>
              <label className="c4-tide-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("tdeUnmarked")}</strong>
                <p className="c4-tide-meta">{laneLabel(v4, tideLane(row.expires, now))} · {hueLabel(v4, tideHue(row.expires, now))} · {v4("tdeStep")} {tideStep(row.expires, now)}{minutes !== null ? ` · ${minutes}m` : ""}{tideWeekday(row.expires, now) ? ` · ${v4("tdeWeekday")}` : ""}{tideWeekend(row.expires, now) ? ` · ${v4("tdeWeekend")}` : ""}{tideMorning(row.expires, now) ? ` · ${v4("tdeMorning")}` : ""}{tideEven(row.expires, now) ? ` · ${v4("tdeEven")}` : ""}{tideLeap(row.expires, now) ? ` · ${v4("tdeLeap")}` : ""}{tideFirst(row.expires, now) ? ` · ${v4("tdeFirst")}` : ""}{tideHeld(row.expires, now) ? ` · ${v4("tdeHeld")}` : ""}{tideSoon(row.expires, now) ? ` · ${v4("tdeSoon")}` : ""}{tideTwin(row.expires, now) ? ` · ${v4("tdeTwin")}` : ""}{tideTail(row.expires) ? ` · ${v4("tdeTail")}` : ""}{tideMark(row.expires) ? ` · ${v4("tdeMark")}` : ""}{tideSpace(row.expires) ? ` · ${v4("tdeSpace")}` : ""}{tideOpen(row.expires, now) ? ` · ${v4("tdeOpen")}` : ""}</p>
                <div className="c4-tide-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleTideReview(reviewed, row.id))}>{seen ? v4("tdeReviewed") : v4("tdeReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(tideCopy(row.expires)); setCopied(row.id); }}>{copied === row.id ? v4("tdeCopied") : v4("tdeCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
