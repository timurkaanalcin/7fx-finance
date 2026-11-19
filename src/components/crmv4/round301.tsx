"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  HVN_KEY,
  HVN_REVIEW_KEY,
  NAV_STATIONS,
  NVC_DENSITY_KEY,
  NVC_KEY,
  NVC_VIEW_KEY,
  addNavTag,
  addNavView,
  addNavicula,
  briskNav,
  bulkHavenReview,
  bulkNavHold,
  bulkNavLaid,
  bulkNavTag,
  bulkNavYew,
  busiestPilot,
  dropNavView,
  editNavNote,
  editNavicula,
  fairPilot,
  havenCapital,
  havenCoast,
  havenCopy,
  havenDigit,
  havenEven,
  havenFamily,
  havenFirst,
  havenHeld,
  havenHue,
  havenHyphen,
  havenLane,
  havenLanes,
  havenLanesCsv,
  havenLength,
  havenLetter,
  havenLong,
  havenLower,
  havenMark,
  havenMixed,
  havenOpen,
  havenPair,
  havenPeriod,
  havenPost,
  havenRowsCsv,
  havenShare,
  havenShort,
  havenSpace,
  havenStamp,
  havenTail,
  havenUnion,
  havenUpper,
  havenVowel,
  idleNav,
  laneHavenCount,
  lateNav,
  leadingHaven,
  leadingHavenHue,
  liftLatitudeFocused,
  lowerHourFocused,
  lowerLatitudeFocused,
  moveNavFocus,
  navBars,
  navCopy,
  navCounts,
  navCsv,
  navDensity,
  navInner,
  navOuter,
  navPilots,
  navTimeline,
  overdueNav,
  presentHavenLanes,
  raiseHourFocused,
  readHiddenHavens,
  readNavViews,
  readNaviculas,
  readReviewedHavens,
  reminderNavs,
  restingNav,
  setNavFocused,
  setNavHold,
  setNavLaid,
  setNavLocker,
  setNavStar,
  setNavWood,
  sortNaviculas,
  starNavFocused,
  suggestLatitude,
  suggestStation,
  suggestWood,
  toggleHaven,
  toggleHavenReview,
  visibleHavenLanes,
  visibleHavens,
  visibleNaviculas,
  woodFocused,
  lockerNavFocused,
  type HavenReview,
  type HavenRow,
  type HavenShape,
  type HavenValue,
  type NavDensity,
  type NavSort,
  type NavTray,
  type NavView,
  type Navicula,
} from "@/lib/crmv4/round301";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const WOODS = ["OAK", "ASH", "YEW"] as const;
const LATITUDES = ["15", "30", "45", "60"] as const;
const HOURS = ["3", "6", "9"] as const;

const STATION_KEY: Record<string, CrmV4CopyKey> = {
  prow: "nvcProw",
  hull: "nvcHull",
  mast: "nvcMast",
  stern: "nvcStern",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "nvcAuditSave",
  edit: "nvcAuditEdit",
  note: "nvcAuditNote",
  wood: "nvcAuditWood",
  set: "nvcAuditSet",
  clear: "nvcAuditClear",
  locker: "nvcAuditLocker",
  resume: "nvcAuditResume",
  hold: "nvcAuditHold",
  open: "nvcAuditOpen",
  tag: "nvcAuditTag",
  hour: "nvcAuditHour",
  latitude: "nvcAuditLatitude",
  lower: "nvcAuditLower",
  star: "nvcAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  union: "hvnUnion",
  mark: "hvnMark",
  pair: "hvnPair",
  short: "hvnShort",
  long: "hvnLong",
  vowel: "hvnVowel",
  coast: "hvnCoast",
  post: "hvnPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "hvnChampagne",
  ivory: "hvnIvory",
  graphite: "hvnGraphite",
};

const SHAPE_KEY: Record<HavenShape, CrmV4CopyKey> = {
  all: "hvnShapeAll",
  union: "hvnShapeUnion",
  mark: "hvnShapeMark",
  pair: "hvnShapePair",
  short: "hvnShapeShort",
  long: "hvnShapeLong",
  vowel: "hvnShapeVowel",
  coast: "hvnShapeCoast",
  post: "hvnShapePost",
  open: "hvnShapeOpen",
  soon: "hvnShapeSoon",
  letter: "hvnShapeLetter",
  mixed: "hvnShapeMixed",
  upper: "hvnShapeUpper",
  lower: "hvnShapeLower",
  space: "hvnShapeSpace",
  even: "hvnShapeEven",
  odd: "hvnShapeOdd",
  tail: "hvnShapeTail",
  digit: "hvnShapeDigit",
  first: "hvnShapeFirst",
  held: "hvnShapeHeld",
  hyphen: "hvnShapeHyphen",
  period: "hvnShapePeriod",
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

function stationLabel(v4: V4, station: string): string {
  const key = STATION_KEY[station];
  return key ? v4(key) : v4("nvcBlankStation");
}

function woodLabel(v4: V4, wood: string): string {
  if (wood === "OAK") return v4("nvcOak");
  if (wood === "ASH") return v4("nvcAsh");
  if (wood === "YEW") return v4("nvcYew");
  return v4("nvcAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("hvnUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("hvnUnmarked");
}

export function NaviculaDials({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Navicula[]>([]);
  const [views, setViews] = useState<NavView[]>([]);
  const [density, setDensity] = useState<NavDensity>("broad");
  const [tray, setTray] = useState<NavTray>("quay");
  const [query, setQuery] = useState("");
  const [pilotFilter, setPilotFilter] = useState("");
  const [woodFilter, setWoodFilter] = useState("all");
  const [stationFilter, setStationFilter] = useState("all");
  const [latitudeFilter, setLatitudeFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [sort, setSort] = useState<NavSort>("station");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [pilot, setPilot] = useState("");
  const [station, setStation] = useState("");
  const [wood, setWood] = useState("");
  const [latitudeNo, setLatitudeNo] = useState("");
  const [hourNo, setHourNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("prow");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readNaviculas(readJson(NVC_KEY, [])));
    setViews(readNavViews(readJson(NVC_VIEW_KEY, [])));
    setDensity(navDensity(readJson(NVC_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Navicula[]) {
    setCards(next);
    writeJson(NVC_KEY, next);
  }
  function storeViews(next: NavView[]) {
    setViews(next);
    writeJson(NVC_VIEW_KEY, next);
  }
  function storeDensity(next: NavDensity) {
    setDensity(next);
    writeJson(NVC_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortNaviculas(visibleNaviculas(cards, tray, query, pilotFilter, woodFilter, stationFilter, latitudeFilter, hourFilter), sort),
    [cards, tray, query, pilotFilter, woodFilter, stationFilter, latitudeFilter, hourFilter, sort],
  );
  const counts = navCounts(cards, shown, desk);
  const bars = navBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = navTimeline(cards);
  const pilots = navPilots(cards);
  const suggested = suggestWood(cards);
  const fair = fairPilot(cards, pilots.join(","));
  const busy = busiestPilot(cards);
  const reminders = reminderNavs(cards);
  const latitudeHint = suggestLatitude(cards, clock);
  const stationHint = suggestStation(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setPilot("");
        setStation("");
        setWood("");
        setLatitudeNo("");
        setHourNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveNavFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveNavFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        store(liftLatitudeFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setNavHold(cards, id, !shown[focusAt]?.held));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(woodFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(lockerNavFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setNavFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("navicula-dials.csv", navCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starNavFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raiseHourFocused(cards, id));
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        store(lowerHourFocused(cards, id));
        return;
      }
      if (event.key === "o" || event.key === "O") {
        event.preventDefault();
        store(lowerLatitudeFocused(cards, id));
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
    <section className="c4-navicula" aria-label={v4("nvcTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-navicula-mast">
        <p className="c4-navicula-seal" data-logo="mono">{v4("nvcLogo")}</p>
        <div>
          <p className="c4-navicula-kicker">{v4("nvcSub")}</p>
          <h2 className="c4-title">{v4("nvcTitle")}</h2>
        </div>
        <ol className="c4-navicula-index" aria-label={v4("nvcTitle")}>
          <li data-tone="gold">{v4("nvcQuay")}</li>
          <li data-tone="ink">{v4("nvcLocker")}</li>
          <li data-tone="ivory">{v4("nvcHold")}</li>
        </ol>
      </header>
      <p className="c4-navicula-links">
        <Link href={crmv4Href(base, "hvn")}>{v4("hvnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("nvcCustomers")}</Link>
        <Link href={crmv4Href(base, "symbolglance")}>{v4("ymOratoryKicker")}</Link>
        <Link href={crmv4Href(base, "ticketstatus")}>{v4("tzGalleryKicker")}</Link>
      </p>
      <p className="c4-navicula-hint">{v4("nvcHint")}</p>
      {viewer && <p className="c4-navicula-note">{v4("nvcViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-navicula-notice" role="status">{v4("nvcOverdue")} {counts.overdue}</p>}
      <ol className="c4-navicula-dials" aria-label={v4("nvcChart")}>
        <li><span>{v4("nvcInner")}</span><strong>{counts.inner}</strong></li>
        <li><span>{v4("nvcOuter")}</span><strong>{counts.outer}</strong></li>
        <li><span>{v4("nvcLay")}</span><strong>{counts.laid}</strong></li>
        <li><span>{v4("nvcWide")}</span><strong>{counts.wide}</strong></li>
        <li><span>{v4("nvcHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("nvcIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("nvcBrisk")}</span><strong>{counts.brisk}</strong></li>
        <li><span>{v4("nvcResting")}</span><strong>{counts.resting}</strong></li>
        <li><span>{v4("nvcMatched")}</span><strong>{counts.matched}</strong></li>
      </ol>
      <div className="c4-navicula-chart" aria-label={v4("nvcChart")}>
        {bars.map((bar) => (
          <button key={bar.station} type="button" className="c4-navicula-column" data-on={stationFilter === bar.station ? "1" : "0"} data-station={bar.station} onClick={() => setStationFilter(stationFilter === bar.station ? "all" : bar.station)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{stationLabel(v4, bar.station)}</span>
          </button>
        ))}
      </div>
      <div className="c4-navicula-tools">
        <input ref={searchRef} className="c4-field c4-navicula-search" aria-label={v4("nvcSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("nvcSearch")} />
        <select className="c4-select" aria-label={v4("nvcPilot")} value={pilotFilter} onChange={(event) => setPilotFilter(event.target.value)}>
          <option value="">{v4("nvcPilot")}</option>
          {pilots.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        {(["quay", "locker", "hold"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "quay" ? "nvcQuay" : item === "locker" ? "nvcLocker" : "nvcHold")}</button>
        ))}
        {(["all", "inner", "outer", ...NAV_STATIONS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={stationFilter === item ? "1" : "0"} onClick={() => setStationFilter(item)}>{item === "all" ? v4("nvcAll") : item === "inner" ? v4("nvcInner") : item === "outer" ? v4("nvcOuter") : stationLabel(v4, item)}</button>
        ))}
        {["all", ...WOODS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={woodFilter === item ? "1" : "0"} onClick={() => setWoodFilter(item)}>{item === "all" ? v4("nvcWood") : woodLabel(v4, item)}</button>
        ))}
        {["all", ...LATITUDES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={latitudeFilter === item ? "1" : "0"} onClick={() => setLatitudeFilter(item)}>{item === "all" ? v4("nvcLatitude") : item}</button>
        ))}
        {["all", ...HOURS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hourFilter === item ? "1" : "0"} onClick={() => setHourFilter(item)}>{item === "all" ? v4("nvcHour") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "station" ? "1" : "0"} onClick={() => setSort("station")}>{v4("nvcSortStation")}</button>
        <button type="button" className="c4-chip" data-on={sort === "pilot" ? "1" : "0"} onClick={() => setSort("pilot")}>{v4("nvcSortPilot")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("nvcTight") : v4("nvcBroad")}</button>
        <label className="c4-lab">
          <span>{v4("nvcDesk")}</span>
          <select className="c4-select" aria-label={v4("nvcDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {NAV_STATIONS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <p className="c4-navicula-meta">{v4("nvcSuggest")} {woodLabel(v4, suggested)} · {latitudeHint} · {stationLabel(v4, stationHint)} · {v4("nvcFair")} {fair || "—"} · {v4("nvcBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-navicula-remind" aria-label={v4("nvcRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-navicula-time" aria-label={v4("nvcTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.latitude}><span>{lane.latitude}</span><strong>{lane.titles.join(", ")}</strong></li>
          ))}
        </ol>
      )}
      <form className="c4-navicula-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addNavicula(cards, { title, note, pilot, station, wood, latitude: latitudeNo, hour: hourNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("nvcEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("nvcEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("nvcNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("nvcNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("nvcPilot")} aria-required={false} value={pilot} onChange={(event) => setPilot(event.target.value)} placeholder={v4("nvcPilot")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("nvcDesk")} value={station} onChange={(event) => setStation(event.target.value)} disabled={viewer}>
          <option value="">{v4("nvcBlankStation")}</option>
          {NAV_STATIONS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("nvcWood")} value={wood} onChange={(event) => setWood(event.target.value)} disabled={viewer}>
          <option value="">{v4("nvcWood")}</option>
          {WOODS.map((item) => <option key={item} value={item}>{woodLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("nvcLatitude")} value={latitudeNo} onChange={(event) => setLatitudeNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("nvcLatitude")}</option>
          {LATITUDES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("nvcHour")} value={hourNo} onChange={(event) => setHourNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("nvcHour")}</option>
          {HOURS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("nvcTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("nvcTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("nvcAdd")}</button>
      </form>
      <form className="c4-navicula-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addNavView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, pilot: pilotFilter, wood: woodFilter, station: stationFilter, latitude: latitudeFilter, hour: hourFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("nvcViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("nvcViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("nvcSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-navicula-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setPilotFilter(view.pilot); setWoodFilter(view.wood); setStationFilter(view.station); setLatitudeFilter(view.latitude); setHourFilter(view.hour); }}>{v4("nvcApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropNavView(views, view.id))}>{v4("nvcDrop")}</button>
          </span>
        ))}
      </form>
      <div className="c4-navicula-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkNavLaid(cards, picked))}>{v4("nvcBulkLaid")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkNavYew(cards, picked))}>{v4("nvcBulkYew")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkNavHold(cards, picked))}>{v4("nvcBulkHold")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkNavTag(cards, picked))}>{v4("nvcBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("navicula-dials.csv", navCsv(shown, desk))}>{v4("nvcCsv")}</button>
      </div>
      <p className="c4-navicula-keys">{v4("nvcKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("nvcEmpty")}</p>}
      <ul className="c4-navicula-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-navicula-card" data-on={focused?.id === card.id ? "1" : "0"} data-station={card.station || "blank"} data-late={lateNav(card, desk) ? "1" : "0"} data-idle={idleNav(card) ? "1" : "0"} data-brisk={briskNav(card) ? "1" : "0"} data-resting={restingNav(card) ? "1" : "0"} data-overdue={overdueNav(card) ? "1" : "0"} data-inner={navInner(card.station) ? "1" : "0"} data-outer={navOuter(card.station) ? "1" : "0"}>
              <label className="c4-navicula-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("nvcEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editNavicula(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("nvcNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editNavNote(cards, card.id, event.target.value))} />
                <p className="c4-navicula-meta">{card.pilot || "—"} · {stationLabel(v4, card.station)} · {woodLabel(v4, card.wood)} · {card.latitude ?? "—"} · {card.hour} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-navicula-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-navicula-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNavLaid(cards, card.id, !card.laid))}>{card.laid ? v4("nvcClear") : v4("nvcLay")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNavWood(cards, card.id, suggested))}>{v4("nvcSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNavLocker(cards, card.id, !card.locked))}>{card.locked ? v4("nvcUnlock") : v4("nvcLockerIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNavHold(cards, card.id, !card.held))}>{card.held ? v4("nvcUnhold") : v4("nvcHoldIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNavStar(cards, card.id, !card.starred))}>{card.starred ? v4("nvcUnstar") : v4("nvcStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addNavTag(cards, card.id, "a"))}>{v4("nvcTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftLatitudeFocused(cards, card.id))}>{v4("nvcLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerLatitudeFocused(cards, card.id))}>{v4("nvcLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(navCopy(card))}>{v4("nvcCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type HavenUser = { id?: string; name?: string | null; lastCountryName?: string | null };

export function HavenPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: HavenUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<HavenShape>("all");
  const [review, setReview] = useState<HavenReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): HavenRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      haven: { lastCountryName: textField(row.lastCountryName) } satisfies HavenValue,
    };
  }).filter((row): row is HavenRow => Boolean(row));
  const present = presentHavenLanes(rows);
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
    const next = readHiddenHavens(readJson(HVN_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(HVN_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedHavens(readJson(HVN_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(HVN_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleHavenLanes(present, hidden, showHidden);
  const shown = visibleHavens(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = havenLane(row.haven);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = havenLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingHaven(rows);
  const leadHue = leadingHavenHue(rows);
  const whole = rows.filter((row) => havenLane(row.haven)).length;
  const share = havenShare(laneHavenCount(rows, "union"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("haven-lanes.csv", havenLanesCsv(rows));
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
    writeJson(HVN_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(HVN_REVIEW_KEY, next);
  }

  return (
    <section className="c4-haven" aria-label={v4("hvnTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-haven-mast">
        <p className="c4-haven-seal" data-logo="mono">{v4("hvnLogo")}</p>
        <div>
          <p className="c4-haven-kicker">{v4("hvnSub")}</p>
          <h2 className="c4-title">{v4("hvnTitle")}</h2>
        </div>
        <p className="c4-haven-count">{shown.length}</p>
      </header>
      <p className="c4-haven-links">
        <Link href={crmv4Href(base, "nvc")}>{v4("nvcTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("nvcCustomers")}</Link>
      </p>
      <p className="c4-haven-hint">{v4("hvnHint")}</p>
      {viewer && <p className="c4-haven-note">{v4("hvnViewer")}</p>}
      <p className="c4-haven-meta">{v4("hvnLead")} {laneLabel(v4, lead)} · {v4("hvnToneLead")} {hueLabel(v4, leadHue)} · {v4("hvnShare")} {share}</p>
      <div className="c4-haven-chart" aria-label={v4("hvnChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-haven-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-haven-tools">
        <input ref={searchRef} className="c4-field c4-haven-search" aria-label={v4("hvnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("hvnSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("hvnShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "hvnAll" : item === "reviewed" ? "hvnReviewed" : "hvnFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("hvnAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as HavenShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
      </div>
      <div className="c4-haven-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkHavenReview(reviewed, picked, true))}>{v4("hvnBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkHavenReview(reviewed, picked, false))}>{v4("hvnBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("haven-lanes.csv", havenLanesCsv(rows))}>{v4("hvnCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("haven-rows.csv", havenRowsCsv(shown, reviewed))}>{v4("hvnRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("hvnLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("hvnFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("hvnEmpty")}</p>}
      <ul className="c4-haven-lanes">
        {present.map((item) => (
          <li key={item} data-lane={item} data-hidden={hidden.includes(item) ? "1" : "0"}>
            <button type="button" className="c4-chip" data-on={lane === item ? "1" : "0"} onClick={() => setLane(lane === item ? "all" : item)}>{laneLabel(v4, item)} {laneHavenCount(rows, item as "union" | "mark" | "pair" | "short" | "long" | "vowel" | "coast" | "post")}</button>
            <button type="button" className="c4-btn" onClick={() => storeHidden(toggleHaven(hidden, item))}>{hidden.includes(item) ? v4("hvnShow") : v4("hvnHide")}</button>
          </li>
        ))}
      </ul>
      <ul className="c4-haven-list" data-plates="1">
        {shown.map((row) => {
          const name = havenCopy(row.haven);
          const tone = havenHue(row.haven);
          return (
            <li key={row.id} className="c4-haven-card" data-lane={havenLane(row.haven) || "open"} data-hue={tone || "none"} data-union={havenUnion(row.haven) ? "1" : "0"} data-mark={havenMark(row.haven) ? "1" : "0"} data-pair={havenPair(row.haven) ? "1" : "0"} data-short={havenShort(row.haven) ? "1" : "0"} data-long={havenLong(row.haven) ? "1" : "0"} data-coast={havenCoast(row.haven) ? "1" : "0"} data-post={havenPost(row.haven) ? "1" : "0"} data-open={havenOpen(row.haven) ? "1" : "0"} data-held={havenHeld(row.haven) ? "1" : "0"} data-even={havenEven(row.haven) ? "1" : "0"} data-digit={havenDigit(row.haven) ? "1" : "0"} data-letter={havenLetter(row.haven) ? "1" : "0"} data-mixed={havenMixed(row.haven) ? "1" : "0"} data-upper={havenUpper(row.haven) ? "1" : "0"} data-lower={havenLower(row.haven) ? "1" : "0"} data-space={havenSpace(row.haven) ? "1" : "0"} data-vowel={havenVowel(row.haven) ? "1" : "0"} data-tail={havenTail(row.haven) ? "1" : "0"} data-first={havenFirst(row.haven) ? "1" : "0"} data-capital={havenCapital(row.haven) ? "1" : "0"} data-hyphen={havenHyphen(row.haven) ? "1" : "0"} data-period={havenPeriod(row.haven) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
              <label>
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-haven-meta">{name || v4("hvnOpen")} · {havenStamp(row.haven) || "—"} · {havenFamily(row.haven) || "—"} · {havenLength(row.haven) ?? "—"} · {laneLabel(v4, havenLane(row.haven))} · {hueLabel(v4, tone)}</p>
              </div>
              <div>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleHavenReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("hvnReviewed") : v4("hvnReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = havenCopy(row.haven); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("hvnCopied") : v4("hvnCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("hvnCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
