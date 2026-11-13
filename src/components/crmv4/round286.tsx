"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  HRS_KEY,
  HRS_REVIEW_KEY,
  WAY_ROADS,
  WYR_DENSITY_KEY,
  WYR_KEY,
  WYR_VIEW_KEY,
  addWayTag,
  addWayView,
  addWaywiser,
  briskWay,
  bulkHourReview,
  bulkWayGilt,
  bulkWayLog,
  bulkWayStow,
  bulkWayTag,
  busiestWalker,
  cycleRim,
  dipSpokeFocused,
  dropWayView,
  editWayNote,
  editWaywiser,
  fairWalker,
  hourCopy,
  hourEven,
  hourHue,
  hourLane,
  hourLanes,
  hourLanesCsv,
  hourLeap,
  hourLive,
  hourMark,
  hourQuiet,
  hourRowsCsv,
  hourShare,
  hourSpace,
  hourStale,
  hourStamp,
  hourStep,
  hourTail,
  hourToday,
  hourTwin,
  hourWeekend,
  hourWide,
  idleWay,
  laneHourCount,
  lateWay,
  leadingHour,
  leadingHourHue,
  liftSpokeFocused,
  lockWayFocused,
  logWayFocused,
  lowerTurnFocused,
  moveWayFocus,
  overdueWay,
  pavedRoad,
  presentHourLanes,
  raiseTurnFocused,
  readHiddenHours,
  readReviewedHours,
  readWayViews,
  readWaywisers,
  reminderWaywisers,
  restingWay,
  rimFocused,
  setWayLock,
  setWayLogged,
  setWayRim,
  setWayStar,
  setWayStow,
  sharedHourCount,
  softRoad,
  sortWaywisers,
  starWayFocused,
  suggestRoad,
  suggestSpoke,
  suggestWayRim,
  tagWayFocused,
  toggleHour,
  toggleHourReview,
  visibleHourLanes,
  visibleHours,
  visibleWaywisers,
  wayBars,
  wayCopy,
  wayCounts,
  wayCsv,
  wayDensity,
  wayTimeline,
  wayWalkers,
  type HourReview,
  type HourRow,
  type HourShape,
  type HourValue,
  type WayDensity,
  type WaySort,
  type WayTray,
  type WayView,
  type Waywiser,
} from "@/lib/crmv4/round286";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type SeenRow = { id?: string; name?: string | null; lastSeenAt?: string | null };

const RIMS = ["OAK", "IRON", "GILT"] as const;
const SPOKES = ["4", "6", "8"] as const;
const TURNS = ["1", "2", "3"] as const;
const SHAPES: HourShape[] = ["all", "live", "stale", "quiet", "today", "weekend", "even", "leap", "wide", "twin", "tail", "mark", "space", "dawn", "noon", "dusk", "night"];

const ROAD_KEY: Record<string, CrmV4CopyKey> = {
  lane: "wyrLane",
  court: "wyrCourt",
  quay: "wyrQuay",
  park: "wyrPark",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "wyrAuditSave",
  edit: "wyrAuditEdit",
  note: "wyrAuditNote",
  rim: "wyrAuditRim",
  log: "wyrAuditLog",
  unlog: "wyrAuditUnlog",
  lock: "wyrAuditLock",
  resume: "wyrAuditResume",
  stow: "wyrAuditStow",
  open: "wyrAuditOpen",
  tag: "wyrAuditTag",
  turn: "wyrAuditTurn",
  spoke: "wyrAuditSpoke",
  dip: "wyrAuditDip",
  star: "wyrAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "hrsLive",
  stale: "hrsStale",
  dawn: "hrsDawn",
  noon: "hrsNoon",
  dusk: "hrsDusk",
  night: "hrsNight",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "hrsIvory",
  graphite: "hrsGraphite",
  champagne: "hrsChampagne",
};

const SHAPE_KEY: Record<HourShape, CrmV4CopyKey> = {
  all: "hrsShapeAll",
  live: "hrsShapeLive",
  stale: "hrsShapeStale",
  quiet: "hrsShapeQuiet",
  today: "hrsShapeToday",
  weekend: "hrsShapeWeekend",
  even: "hrsShapeEven",
  leap: "hrsShapeLeap",
  wide: "hrsShapeWide",
  twin: "hrsShapeTwin",
  tail: "hrsShapeTail",
  mark: "hrsShapeMark",
  space: "hrsShapeSpace",
  dawn: "hrsShapeDawn",
  noon: "hrsShapeNoon",
  dusk: "hrsShapeDusk",
  night: "hrsShapeNight",
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

function roadLabel(v4: V4, road: string): string {
  const key = ROAD_KEY[road];
  return key ? v4(key) : v4("wyrBlankRoad");
}

function rimLabel(v4: V4, rim: string): string {
  if (rim === "OAK") return v4("wyrOak");
  if (rim === "IRON") return v4("wyrIron");
  if (rim === "GILT") return v4("wyrGilt");
  return v4("wyrAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("hrsUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("hrsUnmarked");
}

export function WaywiserWheels({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Waywiser[]>([]);
  const [views, setViews] = useState<WayView[]>([]);
  const [density, setDensity] = useState<WayDensity>("air");
  const [tray, setTray] = useState<WayTray>("yard");
  const [query, setQuery] = useState("");
  const [walkerFilter, setWalkerFilter] = useState("");
  const [rimFilter, setRimFilter] = useState("all");
  const [roadFilter, setRoadFilter] = useState("all");
  const [spokeFilter, setSpokeFilter] = useState("all");
  const [turnFilter, setTurnFilter] = useState("all");
  const [sort, setSort] = useState<WaySort>("road");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [walker, setWalker] = useState("");
  const [road, setRoad] = useState("");
  const [rim, setRim] = useState("");
  const [spokeNo, setSpokeNo] = useState("");
  const [turnNo, setTurnNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("lane");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readWaywisers(readJson(WYR_KEY, [])));
    setViews(readWayViews(readJson(WYR_VIEW_KEY, [])));
    setDensity(wayDensity(readJson(WYR_DENSITY_KEY, "air")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Waywiser[]) {
    setCards(next);
    writeJson(WYR_KEY, next);
  }
  function storeViews(next: WayView[]) {
    setViews(next);
    writeJson(WYR_VIEW_KEY, next);
  }
  function storeDensity(next: WayDensity) {
    setDensity(next);
    writeJson(WYR_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortWaywisers(visibleWaywisers(cards, tray, query, walkerFilter, rimFilter, roadFilter, spokeFilter, turnFilter), sort),
    [cards, tray, query, walkerFilter, rimFilter, roadFilter, spokeFilter, turnFilter, sort],
  );
  const counts = wayCounts(cards, shown, desk);
  const bars = wayBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = wayTimeline(cards);
  const walkers = wayWalkers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestWayRim(cards);
  const fair = fairWalker(cards, walkers.join(","));
  const busy = busiestWalker(cards);
  const reminders = reminderWaywisers(cards);
  const spokeHint = suggestSpoke(cards, clock);
  const roadHint = suggestRoad(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setWalker("");
        setRoad("");
        setRim("");
        setSpokeNo("");
        setTurnNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveWayFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveWayFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        store(liftSpokeFocused(cards, id));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        store(setWayStow(cards, id, !shown[focusAt]?.stowed));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        store(rimFocused(cards, id));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        store(lockWayFocused(cards, id));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        store(logWayFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("waywiser.csv", wayCsv(shown, desk));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        store(starWayFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raiseTurnFocused(cards, id));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        store(lowerTurnFocused(cards, id));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        store(dipSpokeFocused(cards, id));
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
    <section className="c4-waywiser" aria-label={v4("wyrTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-waywiser-mast">
        <p className="c4-waywiser-seal" data-logo="mono">{v4("wyrLogo")}</p>
        <div>
          <p className="c4-waywiser-kicker">{v4("wyrSub")}</p>
          <h2 className="c4-title">{v4("wyrTitle")}</h2>
        </div>
        <ol className="c4-waywiser-index" aria-label={v4("wyrTitle")}>
          <li data-tone="gold">{v4("wyrGilt")}</li>
          <li data-tone="ink">{v4("wyrIron")}</li>
          <li data-tone="ivory">{v4("wyrOak")}</li>
        </ol>
      </header>
      <p className="c4-waywiser-links">
        <Link href={crmv4Href(base, "hrs")}>{v4("hrsTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("wyrCustomers")}</Link>
        <Link href={crmv4Href(base, "shortcuts")}>{v4("scLampKicker")}</Link>
      </p>
      <p className="c4-waywiser-hint">{v4("wyrHint")}</p>
      {viewer && <p className="c4-waywiser-note">{v4("wyrViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-waywiser-notice" role="status">{v4("wyrOverdue")} {counts.overdue}</p>}
      <ol className="c4-waywiser-dials" aria-label={v4("wyrChart")}>
        <li><span>{v4("wyrYard")}</span><strong>{counts.yard}</strong></li>
        <li><span>{v4("wyrShed")}</span><strong>{counts.shed}</strong></li>
        <li><span>{v4("wyrLoft")}</span><strong>{counts.loft}</strong></li>
        <li><span>{v4("wyrOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("wyrIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("wyrBrisk")}</span><strong>{counts.brisk}</strong></li>
        <li><span>{v4("wyrFair")}</span><strong>{fair || "·"}</strong></li>
        <li><span>{v4("wyrBusy")}</span><strong>{busy || "·"}</strong></li>
      </ol>
      <div className="c4-waywiser-chart" aria-label={v4("wyrChart")}>
        {bars.map((bar) => (
          <button key={bar.road} type="button" className="c4-waywiser-column" data-on={roadFilter === bar.road ? "1" : "0"} data-road={bar.road} onClick={() => setRoadFilter(roadFilter === bar.road ? "all" : bar.road)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{roadLabel(v4, bar.road)}</span>
          </button>
        ))}
      </div>
      <div className="c4-waywiser-tools">
        <input ref={searchRef} className="c4-field c4-waywiser-search" aria-label={v4("wyrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("wyrSearch")} />
        {(["yard", "shed", "loft"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "yard" ? "wyrYard" : item === "shed" ? "wyrShed" : "wyrLoft")}</button>
        ))}
        {(["all", "paved", "soft", ...WAY_ROADS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={roadFilter === item ? "1" : "0"} onClick={() => setRoadFilter(item)}>{item === "all" ? v4("wyrAll") : item === "paved" ? v4("wyrPaved") : item === "soft" ? v4("wyrSoft") : roadLabel(v4, item)}</button>
        ))}
        {["all", ...RIMS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rimFilter === item ? "1" : "0"} onClick={() => setRimFilter(item)}>{item === "all" ? v4("wyrRim") : rimLabel(v4, item)}</button>
        ))}
        {["all", ...SPOKES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={spokeFilter === item ? "1" : "0"} onClick={() => setSpokeFilter(item)}>{item === "all" ? v4("wyrSpoke") : item}</button>
        ))}
        {["all", ...TURNS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={turnFilter === item ? "1" : "0"} onClick={() => setTurnFilter(item)}>{item === "all" ? v4("wyrTurn") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "walker" ? "1" : "0"} onClick={() => setSort(sort === "road" ? "walker" : "road")}>{sort === "road" ? v4("wyrSortRoad") : v4("wyrSortWalker")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "air" ? "tight" : "air")}>{density === "air" ? v4("wyrAir") : v4("wyrTight")}</button>
        <button type="button" className="c4-btn" onClick={() => download("waywiser.csv", wayCsv(shown, desk))}>{v4("wyrCsv")}</button>
      </div>
      <div className="c4-waywiser-tools" role="group" aria-label={v4("wyrDesk")}>
        {WAY_ROADS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("wyrDesk")} {roadLabel(v4, item)}</button>
        ))}
        <span className="c4-waywiser-meta">{v4("wyrSuggest")} {rimLabel(v4, suggested)} · {spokeHint} · {roadLabel(v4, roadHint)}</span>
      </div>
      <form className="c4-waywiser-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addWaywiser(cards, { title, note, walker, road, rim: rim || suggested, spoke: spokeNo, turn: turnNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("wyrEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("wyrTitle")} />
        <input className="c4-field" aria-label={v4("wyrNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("wyrNote")} />
        <input className="c4-field" aria-label={v4("wyrWalker")} aria-required={false} value={walker} disabled={viewer} onChange={(event) => setWalker(event.target.value)} placeholder={v4("wyrWalker")} />
        <select className="c4-select" aria-label={v4("wyrRoad")} value={road} disabled={viewer} onChange={(event) => setRoad(event.target.value)}>
          <option value="">{v4("wyrBlankRoad")}</option>
          {WAY_ROADS.map((item) => <option key={item} value={item}>{roadLabel(v4, item)}</option>)}
        </select>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("wyrAdd")}</button>
      </form>
      <form className="c4-waywiser-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addWayView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, walker: walkerFilter, rim: rimFilter, road: roadFilter, spoke: spokeFilter, turn: turnFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("wyrViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("wyrViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("wyrSaveView")}</button>
      </form>
      <ul className="c4-waywiser-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setWalkerFilter(view.walker); setRimFilter(view.rim); setRoadFilter(view.road); setSpokeFilter(view.spoke); setTurnFilter(view.turn); }}>{v4("wyrApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropWayView(views, view.id))}>{v4("wyrDrop")}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-waywiser-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWayGilt(cards, picked))}>{v4("wyrBulkGilt")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWayLog(cards, picked))}>{v4("wyrBulkLog")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWayStow(cards, picked))}>{v4("wyrBulkStow")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWayTag(cards, picked))}>{v4("wyrBulkTag")}</button>
        </div>
      )}
      <p className="c4-waywiser-meta">{v4("wyrKeys")} · j k n l g h w b p u y x /</p>
      {timeline.length > 0 && (
        <ol className="c4-waywiser-time" aria-label={v4("wyrTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.spoke}><span>{v4("wyrSpoke")} {lane.spoke}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
        </ol>
      )}
      {reminders.length > 0 && <p className="c4-waywiser-meta">{v4("wyrRemind")} {reminders.join(" · ")}</p>}
      {!shown.length && <p className="c4-waywiser-empty">{v4("wyrEmpty")}</p>}
      <ol className="c4-waywiser-board">
        {shown.map((card, index) => {
          const on = index === focusAt;
          return (
            <li key={card.id} className="c4-waywiser-card" data-on={on ? "1" : "0"} data-overdue={overdueWay(card) ? "1" : "0"} data-idle={idleWay(card) ? "1" : "0"} data-brisk={briskWay(card) ? "1" : "0"} data-resting={restingWay(card) ? "1" : "0"} data-late={lateWay(card, desk) ? "1" : "0"} data-soft={softRoad(card.road) ? "1" : "0"} data-paved={pavedRoad(card.road) ? "1" : "0"} data-star={card.flagged ? "1" : "0"}>
              <label className="c4-waywiser-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((current) => (current.includes(card.id) ? current.filter((item) => item !== card.id) : [...current, card.id]))} /></label>
              <div>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("wyrEdit")} aria-required={false} value={card.title} onChange={(event) => store(editWaywiser(cards, card.id, event.target.value))} />
                ) : (
                  <strong>{card.title}</strong>
                )}
                <p className="c4-waywiser-meta">{card.walker || v4("wyrWalker")} · {roadLabel(v4, card.road)} · {rimLabel(v4, card.rim)} · {card.spoke ?? "·"} · {v4("wyrTurn")} {card.turn}{card.tags.length ? ` · ${card.tags.join("")}` : ""}{card.audit ? ` · ${AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : card.audit}` : ""}</p>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("wyrNote")} aria-required={false} value={card.note} onChange={(event) => store(editWayNote(cards, card.id, event.target.value))} />
                ) : (
                  card.note && <p className="c4-waywiser-meta">{card.note}</p>
                )}
                <div className="c4-waywiser-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWayLogged(cards, card.id, !card.logged))}>{card.logged ? v4("wyrUnlog") : v4("wyrLog")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWayLock(cards, card.id, !card.locked))}>{card.locked ? v4("wyrUnlock") : v4("wyrLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWayStow(cards, card.id, !card.stowed))}>{card.stowed ? v4("wyrUnstow") : v4("wyrStow")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWayStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("wyrUnstar") : v4("wyrStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWayRim(cards, card.id, cycleRim(card.rim)))}>{v4("wyrRim")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftSpokeFocused(cards, card.id))}>{v4("wyrLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(dipSpokeFocused(cards, card.id))}>{v4("wyrDip")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseTurnFocused(cards, card.id))}>{v4("wyrTurn")}+</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerTurnFocused(cards, card.id))}>{v4("wyrTurn")}−</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addWayTag(cards, card.id, "a"))}>{v4("wyrTag")} a</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(tagWayFocused(cards, card.id))}>{v4("wyrTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(wayCopy(card)); }}>{v4("hrsCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="c4-waywiser-meta">{v4("wyrMatched")} {counts.matched} · {ids.length}</p>
    </section>
  );
}

export function HourPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: SeenRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<HourShape>("all");
  const [review, setReview] = useState<HourReview>("all");
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

  const rows = useMemo<HourRow[]>(() => {
    return (queue.data?.users || []).map((row, index) => ({
      id: textField(row.id) || `h${index}`,
      label: textField(row.name),
      seen: { lastSeenAt: textField(row.lastSeenAt) } satisfies HourValue,
    }));
  }, [queue.data]);

  useEffect(() => {
    const ids = rows.map((row) => row.id);
    const clock = Date.now();
    setHidden(readHiddenHours(readJson(HRS_KEY, []), presentHourLanes(rows, clock)));
    setReviewed(readReviewedHours(readJson(HRS_REVIEW_KEY, []), ids));
  }, [rows]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(HRS_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(HRS_REVIEW_KEY, next);
  }

  const lanes = visibleHourLanes(presentHourLanes(rows, now), hidden, showHidden);
  const shown = visibleHours(rows, lane, hue, query, review, reviewed, shape, now).filter((row) => !hidden.includes(hourLane(row.seen, now)) || showHidden);
  const bars = hourLanes(rows, now);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingHour(rows, now);
  const leadHue = leadingHourHue(rows, now);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveWayFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveWayFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        if (viewer) return;
        const id = shown[focusAt]?.id;
        if (id) storeReviewed(toggleHourReview(reviewed, id));
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
    <section className="c4-hourplate" aria-label={v4("hrsTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-hourplate-mast">
        <p className="c4-hourplate-seal" data-logo="mono">{v4("hrsLogo")}</p>
        <div>
          <p className="c4-hourplate-kicker">{v4("hrsSub")}</p>
          <h2 className="c4-title">{v4("hrsTitle")}</h2>
        </div>
      </header>
      <ol className="c4-hourplate-index" aria-label={v4("hrsTitle")}>
        <li data-tone="gold">{v4("hrsLive")}</li>
        <li data-tone="ink">{v4("hrsStale")}</li>
        <li data-tone="ivory">{v4("hrsNoon")}</li>
        <li data-tone="mist">{v4("hrsDawn")}</li>
        <li data-tone="line">{v4("hrsNight")}</li>
      </ol>
      <p className="c4-hourplate-links">
        <Link href={crmv4Href(base, "wyr")}>{v4("wyrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("wyrCustomers")}</Link>
        <Link href={crmv4Href(base, "cases")}>{v4("cqLampKicker")}</Link>
      </p>
      <p className="c4-hourplate-hint">{v4("hrsHint")}</p>
      {viewer && <p className="c4-hourplate-note">{v4("hrsViewer")}</p>}
      {queue.loading && <p className="c4-hourplate-meta">{v4("hrsEmpty")}</p>}
      {queue.error && <p className="c4-hourplate-meta">{queue.error}</p>}
      <ul className="c4-hourplate-kpis" aria-label={v4("hrsRules")}>
        <li><span>{v4("hrsLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("hrsUnmarked")}</strong></li>
        <li><span>{v4("hrsToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("hrsUnmarked")}</strong></li>
        <li><span>{v4("hrsLive")}</span><strong>{laneHourCount(rows, "live", now)}</strong></li>
        <li><span>{v4("hrsStale")}</span><strong>{laneHourCount(rows, "stale", now)}</strong></li>
        <li><span>{v4("hrsShare")}</span><strong>{hourShare(laneHourCount(rows, "live", now), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("hrsQuiet")}</span><strong>{rows.filter((row) => hourQuiet(row.seen)).length}</strong></li>
        <li><span>{v4("hrsToday")}</span><strong>{rows.filter((row) => hourToday(row.seen, now)).length}</strong></li>
        <li><span>{v4("hrsTwin")}</span><strong>{sharedHourCount(rows, now)}</strong></li>
      </ul>
      <div className="c4-hourplate-chart" aria-label={v4("hrsRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-hourplate-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-hourplate-tools">
        <input ref={searchRef} className="c4-field c4-hourplate-search" aria-label={v4("hrsSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("hrsSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("hrsAll") : hueLabel(v4, item)}</button>
        ))}
        {SHAPES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("hrsAll") : item === "reviewed" ? v4("hrsReviewed") : v4("hrsFresh")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("hrsShow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("hour-lanes.csv", hourLanesCsv(rows, now))}>{v4("hrsCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("hour-rows.csv", hourRowsCsv(rows, reviewed, now))}>{v4("hrsRowCsv")}</button>
      </div>
      <ul className="c4-hourplate-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleHour(hidden, item))}>{hidden.includes(item) ? v4("hrsShow") : v4("hrsHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-hourplate-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkHourReview(reviewed, picked, true))}>{v4("hrsBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkHourReview(reviewed, picked, false))}>{v4("hrsBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-hourplate-empty">{v4("hrsEmpty")}</p>}
      <ol className="c4-hourplate-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-hourplate-card" data-on={index === focusAt ? "1" : "0"} data-lane={hourLane(row.seen, now)} data-hue={hourHue(row.seen, now)} data-reviewed={seen ? "1" : "0"} data-live={hourLive(row.seen, now) ? "1" : "0"} data-stale={hourStale(row.seen, now) ? "1" : "0"} data-today={hourToday(row.seen, now) ? "1" : "0"} data-weekend={hourWeekend(row.seen, now) ? "1" : "0"}>
              <p className="c4-hourplate-stamp">{hourStamp(row.seen, now) || "·"}</p>
              <label className="c4-hourplate-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("hrsUnmarked")}</strong>
                <p className="c4-hourplate-meta">{laneLabel(v4, hourLane(row.seen, now))} · {hueLabel(v4, hourHue(row.seen, now))} · {v4("hrsStep")} {hourStep(row.seen, now)}{hourEven(row.seen, now) ? ` · ${v4("hrsEven")}` : ""}{hourLeap(row.seen, now) ? ` · ${v4("hrsLeap")}` : ""}{hourWide(row.seen, now) ? ` · ${v4("hrsWide")}` : ""}{hourTwin(row.seen, now) ? ` · ${v4("hrsTwin")}` : ""}{hourTail(row.seen) ? ` · ${v4("hrsTail")}` : ""}{hourMark(row.seen) ? ` · ${v4("hrsMark")}` : ""}{hourSpace(row.seen) ? ` · ${v4("hrsSpace")}` : ""}{hourQuiet(row.seen) ? ` · ${v4("hrsQuiet")}` : ""}</p>
                <div className="c4-hourplate-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleHourReview(reviewed, row.id))}>{seen ? v4("hrsReviewed") : v4("hrsReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(hourCopy(row.seen)); setCopied(row.id); }}>{copied === row.id ? v4("hrsCopied") : v4("hrsCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
