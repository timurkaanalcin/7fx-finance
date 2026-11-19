"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  GTP_KEY,
  GTP_REVIEW_KEY,
  CHD_PARTS,
  CHD_DENSITY_KEY,
  CHD_KEY,
  CHD_VIEW_KEY,
  addChilTag,
  addChilView,
  addChilindrum,
  briskChil,
  bulkGateReview,
  bulkChilVault,
  bulkChilScribed,
  bulkChilTag,
  bulkChilGilt,
  busiestKeeper,
  dropChilView,
  editChilNote,
  editChilindrum,
  fairKeeper,
  gateCapital,
  gateKeep,
  gateCopy,
  gateDigit,
  gateEven,
  gateFamily,
  gateFirst,
  gateHeld,
  gateHue,
  gateHyphen,
  gateLane,
  gateLanes,
  gateLanesCsv,
  gateLength,
  gateLetter,
  gateLong,
  gateLower,
  gateMark,
  gateMixed,
  gateOpen,
  gatePair,
  gatePeriod,
  gatePost,
  gateRowsCsv,
  gateShare,
  gateShort,
  gateSpace,
  gateStamp,
  gateTail,
  gateVow,
  gateUpper,
  gateVowel,
  idleChil,
  laneGateCount,
  lateChil,
  leadingGate,
  leadingGateHue,
  liftHeightFocused,
  lowerNotchFocused,
  lowerHeightFocused,
  moveChilFocus,
  chilBars,
  chilCopy,
  chilCounts,
  chilCsv,
  chilDensity,
  chilInner,
  chilOuter,
  chilKeepers,
  chilTimeline,
  overdueChil,
  presentGateLanes,
  raiseNotchFocused,
  readHiddenGates,
  readChilViews,
  readChilindrums,
  readReviewedGates,
  reminderChils,
  restingChil,
  setChilFocused,
  setChilVault,
  setChilScribed,
  setChilSleeve,
  setChilStar,
  setChilCloth,
  sortChilindrums,
  starChilFocused,
  suggestHeight,
  suggestPart,
  suggestCloth,
  toggleGate,
  toggleGateReview,
  visibleGateLanes,
  visibleGates,
  visibleChilindrums,
  clothFocused,
  sleeveChilFocused,
  type GateReview,
  type GateRow,
  type GateShape,
  type GateValue,
  type ChilDensity,
  type ChilSort,
  type ChilTray,
  type ChilView,
  type Chilindrum,
} from "@/lib/crmv4/round302";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const CLOTHS = ["LINEN", "VELLUM", "GILT"] as const;
const HEIGHTS = ["12", "24", "36", "48"] as const;
const NOTCHES = ["4", "8", "12"] as const;

const STATION_KEY: Record<string, CrmV4CopyKey> = {
  foot: "chdFoot",
  barrel: "chdBarrel",
  lip: "chdLip",
  style: "chdStyle",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "chdAuditSave",
  edit: "chdAuditEdit",
  note: "chdAuditNote",
  wood: "chdAuditWood",
  set: "chdAuditSet",
  clear: "chdAuditClear",
  sleeve: "chdAuditSleeve",
  resume: "chdAuditResume",
  vault: "chdAuditVault",
  open: "chdAuditOpen",
  tag: "chdAuditTag",
  hour: "chdAuditHour",
  latitude: "chdAuditLatitude",
  lower: "chdAuditLower",
  star: "chdAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  vow: "gtpVow",
  mark: "gtpMark",
  pair: "gtpPair",
  short: "gtpShort",
  long: "gtpLong",
  vowel: "gtpVowel",
  keep: "gtpKeep",
  post: "gtpPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "gtpChampagne",
  ivory: "gtpIvory",
  graphite: "gtpGraphite",
};

const SHAPE_KEY: Record<GateShape, CrmV4CopyKey> = {
  all: "gtpShapeAll",
  vow: "gtpShapeVow",
  mark: "gtpShapeMark",
  pair: "gtpShapePair",
  short: "gtpShapeShort",
  long: "gtpShapeLong",
  vowel: "gtpShapeVowel",
  keep: "gtpShapeKeep",
  post: "gtpShapePost",
  open: "gtpShapeOpen",
  soon: "gtpShapeSoon",
  letter: "gtpShapeLetter",
  mixed: "gtpShapeMixed",
  upper: "gtpShapeUpper",
  lower: "gtpShapeLower",
  space: "gtpShapeSpace",
  even: "gtpShapeEven",
  odd: "gtpShapeOdd",
  tail: "gtpShapeTail",
  digit: "gtpShapeDigit",
  first: "gtpShapeFirst",
  held: "gtpShapeHeld",
  hyphen: "gtpShapeHyphen",
  period: "gtpShapePeriod",
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
  return key ? v4(key) : v4("chdBlankPart");
}

function woodLabel(v4: V4, wood: string): string {
  if (wood === "LINEN") return v4("chdLinen");
  if (wood === "VELLUM") return v4("chdVellum");
  if (wood === "GILT") return v4("chdGilt");
  return v4("chdAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("gtpUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("gtpUnmarked");
}

export function ChilindrumColumns({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Chilindrum[]>([]);
  const [views, setViews] = useState<ChilView[]>([]);
  const [density, setDensity] = useState<ChilDensity>("broad");
  const [tray, setTray] = useState<ChilTray>("yard");
  const [query, setQuery] = useState("");
  const [pilotFilter, setPilotFilter] = useState("");
  const [woodFilter, setWoodFilter] = useState("all");
  const [stationFilter, setStationFilter] = useState("all");
  const [latitudeFilter, setLatitudeFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [sort, setSort] = useState<ChilSort>("station");
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
  const [desk, setDesk] = useState("foot");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readChilindrums(readJson(CHD_KEY, [])));
    setViews(readChilViews(readJson(CHD_VIEW_KEY, [])));
    setDensity(chilDensity(readJson(CHD_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Chilindrum[]) {
    setCards(next);
    writeJson(CHD_KEY, next);
  }
  function storeViews(next: ChilView[]) {
    setViews(next);
    writeJson(CHD_VIEW_KEY, next);
  }
  function storeDensity(next: ChilDensity) {
    setDensity(next);
    writeJson(CHD_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortChilindrums(visibleChilindrums(cards, tray, query, pilotFilter, woodFilter, stationFilter, latitudeFilter, hourFilter), sort),
    [cards, tray, query, pilotFilter, woodFilter, stationFilter, latitudeFilter, hourFilter, sort],
  );
  const counts = chilCounts(cards, shown, desk);
  const bars = chilBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = chilTimeline(cards);
  const pilots = chilKeepers(cards);
  const suggested = suggestCloth(cards);
  const fair = fairKeeper(cards, pilots.join(","));
  const busy = busiestKeeper(cards);
  const reminders = reminderChils(cards);
  const latitudeHint = suggestHeight(cards, clock);
  const stationHint = suggestPart(clock);
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
        setFocusAt((index) => moveChilFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveChilFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        store(liftHeightFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setChilVault(cards, id, !shown[focusAt]?.held));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(clothFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(sleeveChilFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setChilFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("chilindrum-columns.csv", chilCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starChilFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raiseNotchFocused(cards, id));
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        store(lowerNotchFocused(cards, id));
        return;
      }
      if (event.key === "o" || event.key === "O") {
        event.preventDefault();
        store(lowerHeightFocused(cards, id));
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
    <section className="c4-chilindrum" aria-label={v4("chdTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-chilindrum-mast">
        <p className="c4-chilindrum-seal" data-logo="mono">{v4("chdLogo")}</p>
        <div>
          <p className="c4-chilindrum-kicker">{v4("chdSub")}</p>
          <h2 className="c4-title">{v4("chdTitle")}</h2>
        </div>
        <ol className="c4-chilindrum-index" aria-label={v4("chdTitle")}>
          <li data-tone="gold">{v4("chdYard")}</li>
          <li data-tone="ink">{v4("chdSleeve")}</li>
          <li data-tone="ivory">{v4("chdVault")}</li>
        </ol>
      </header>
      <p className="c4-chilindrum-links">
        <Link href={crmv4Href(base, "gtp")}>{v4("gtpTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("chdCustomers")}</Link>
        <Link href={crmv4Href(base, "layoutlock")}>{v4("lxChapelKicker")}</Link>
        <Link href={crmv4Href(base, "doctypemix")}>{v4("kmScriptoriumKicker")}</Link>
      </p>
      <p className="c4-chilindrum-hint">{v4("chdHint")}</p>
      {viewer && <p className="c4-chilindrum-note">{v4("chdViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-chilindrum-notice" role="status">{v4("chdOverdue")} {counts.overdue}</p>}
      <ol className="c4-chilindrum-dials" aria-label={v4("chdChart")}>
        <li><span>{v4("chdInner")}</span><strong>{counts.inner}</strong></li>
        <li><span>{v4("chdOuter")}</span><strong>{counts.outer}</strong></li>
        <li><span>{v4("chdLay")}</span><strong>{counts.laid}</strong></li>
        <li><span>{v4("chdWide")}</span><strong>{counts.wide}</strong></li>
        <li><span>{v4("chdHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("chdIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("chdBrisk")}</span><strong>{counts.brisk}</strong></li>
        <li><span>{v4("chdResting")}</span><strong>{counts.resting}</strong></li>
        <li><span>{v4("chdMatched")}</span><strong>{counts.matched}</strong></li>
      </ol>
      <div className="c4-chilindrum-chart" aria-label={v4("chdChart")}>
        {bars.map((bar) => (
          <button key={bar.station} type="button" className="c4-chilindrum-column" data-on={stationFilter === bar.station ? "1" : "0"} data-station={bar.station} onClick={() => setStationFilter(stationFilter === bar.station ? "all" : bar.station)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{stationLabel(v4, bar.station)}</span>
          </button>
        ))}
      </div>
      <div className="c4-chilindrum-tools">
        <input ref={searchRef} className="c4-field c4-chilindrum-search" aria-label={v4("chdSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("chdSearch")} />
        <select className="c4-select" aria-label={v4("chdKeeper")} value={pilotFilter} onChange={(event) => setPilotFilter(event.target.value)}>
          <option value="">{v4("chdKeeper")}</option>
          {pilots.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        {(["yard", "sleeve", "vault"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "yard" ? "chdYard" : item === "sleeve" ? "chdSleeve" : "chdVault")}</button>
        ))}
        {(["all", "inner", "outer", ...CHD_PARTS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={stationFilter === item ? "1" : "0"} onClick={() => setStationFilter(item)}>{item === "all" ? v4("chdAll") : item === "inner" ? v4("chdInner") : item === "outer" ? v4("chdOuter") : stationLabel(v4, item)}</button>
        ))}
        {["all", ...CLOTHS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={woodFilter === item ? "1" : "0"} onClick={() => setWoodFilter(item)}>{item === "all" ? v4("chdCloth") : woodLabel(v4, item)}</button>
        ))}
        {["all", ...HEIGHTS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={latitudeFilter === item ? "1" : "0"} onClick={() => setLatitudeFilter(item)}>{item === "all" ? v4("chdHeight") : item}</button>
        ))}
        {["all", ...NOTCHES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hourFilter === item ? "1" : "0"} onClick={() => setHourFilter(item)}>{item === "all" ? v4("chdNotch") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "station" ? "1" : "0"} onClick={() => setSort("station")}>{v4("chdSortPart")}</button>
        <button type="button" className="c4-chip" data-on={sort === "pilot" ? "1" : "0"} onClick={() => setSort("pilot")}>{v4("chdSortKeeper")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("chdTight") : v4("chdBroad")}</button>
        <label className="c4-lab">
          <span>{v4("chdDesk")}</span>
          <select className="c4-select" aria-label={v4("chdDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {CHD_PARTS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <p className="c4-chilindrum-meta">{v4("chdSuggest")} {woodLabel(v4, suggested)} · {latitudeHint} · {stationLabel(v4, stationHint)} · {v4("chdFair")} {fair || "—"} · {v4("chdBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-chilindrum-remind" aria-label={v4("chdRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-chilindrum-time" aria-label={v4("chdTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.latitude}><span>{lane.latitude}</span><strong>{lane.titles.join(", ")}</strong></li>
          ))}
        </ol>
      )}
      <form className="c4-chilindrum-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addChilindrum(cards, { title, note, pilot, station, wood, latitude: latitudeNo, hour: hourNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("chdEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("chdEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("chdNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("chdNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("chdKeeper")} aria-required={false} value={pilot} onChange={(event) => setPilot(event.target.value)} placeholder={v4("chdKeeper")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("chdDesk")} value={station} onChange={(event) => setStation(event.target.value)} disabled={viewer}>
          <option value="">{v4("chdBlankPart")}</option>
          {CHD_PARTS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("chdCloth")} value={wood} onChange={(event) => setWood(event.target.value)} disabled={viewer}>
          <option value="">{v4("chdCloth")}</option>
          {CLOTHS.map((item) => <option key={item} value={item}>{woodLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("chdHeight")} value={latitudeNo} onChange={(event) => setLatitudeNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("chdHeight")}</option>
          {HEIGHTS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("chdNotch")} value={hourNo} onChange={(event) => setHourNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("chdNotch")}</option>
          {NOTCHES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("chdTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("chdTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("chdAdd")}</button>
      </form>
      <form className="c4-chilindrum-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addChilView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, pilot: pilotFilter, wood: woodFilter, station: stationFilter, latitude: latitudeFilter, hour: hourFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("chdViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("chdViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("chdSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-chilindrum-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setPilotFilter(view.pilot); setWoodFilter(view.wood); setStationFilter(view.station); setLatitudeFilter(view.latitude); setHourFilter(view.hour); }}>{v4("chdApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropChilView(views, view.id))}>{v4("chdDrop")}</button>
          </span>
        ))}
      </form>
      <div className="c4-chilindrum-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkChilScribed(cards, picked))}>{v4("chdBulkLaid")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkChilGilt(cards, picked))}>{v4("chdBulkGilt")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkChilVault(cards, picked))}>{v4("chdBulkVault")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkChilTag(cards, picked))}>{v4("chdBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("chilindrum-columns.csv", chilCsv(shown, desk))}>{v4("chdCsv")}</button>
      </div>
      <p className="c4-chilindrum-keys">{v4("chdKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("chdEmpty")}</p>}
      <ul className="c4-chilindrum-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-chilindrum-card" data-on={focused?.id === card.id ? "1" : "0"} data-station={card.station || "blank"} data-late={lateChil(card, desk) ? "1" : "0"} data-idle={idleChil(card) ? "1" : "0"} data-brisk={briskChil(card) ? "1" : "0"} data-resting={restingChil(card) ? "1" : "0"} data-overdue={overdueChil(card) ? "1" : "0"} data-inner={chilInner(card.station) ? "1" : "0"} data-outer={chilOuter(card.station) ? "1" : "0"}>
              <label className="c4-chilindrum-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("chdEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editChilindrum(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("chdNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editChilNote(cards, card.id, event.target.value))} />
                <p className="c4-chilindrum-meta">{card.pilot || "—"} · {stationLabel(v4, card.station)} · {woodLabel(v4, card.wood)} · {card.latitude ?? "—"} · {card.hour} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-chilindrum-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-chilindrum-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChilScribed(cards, card.id, !card.laid))}>{card.laid ? v4("chdClear") : v4("chdLay")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChilCloth(cards, card.id, suggested))}>{v4("chdSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChilSleeve(cards, card.id, !card.locked))}>{card.locked ? v4("chdUnsleeve") : v4("chdSleeveIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChilVault(cards, card.id, !card.held))}>{card.held ? v4("chdUnvault") : v4("chdVaultIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChilStar(cards, card.id, !card.starred))}>{card.starred ? v4("chdUnstar") : v4("chdStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addChilTag(cards, card.id, "a"))}>{v4("chdTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftHeightFocused(cards, card.id))}>{v4("chdLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHeightFocused(cards, card.id))}>{v4("chdLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(chilCopy(card))}>{v4("chdCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type GateUser = { id?: string; name?: string | null; mustChangePassword?: boolean | null };

export function GatePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GateUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<GateShape>("all");
  const [review, setReview] = useState<GateReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): GateRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      gate: { mustChangePassword: row.mustChangePassword ?? "" } satisfies GateValue,
    };
  }).filter((row): row is GateRow => Boolean(row));
  const present = presentGateLanes(rows);
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
    const next = readHiddenGates(readJson(GTP_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(GTP_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedGates(readJson(GTP_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(GTP_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleGateLanes(present, hidden, showHidden);
  const shown = visibleGates(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = gateLane(row.gate);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = gateLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingGate(rows);
  const leadHue = leadingGateHue(rows);
  const whole = rows.filter((row) => gateLane(row.gate)).length;
  const share = gateShare(laneGateCount(rows, "vow"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("gate-lanes.csv", gateLanesCsv(rows));
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
    writeJson(GTP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(GTP_REVIEW_KEY, next);
  }

  return (
    <section className="c4-gate" aria-label={v4("gtpTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-gate-mast">
        <p className="c4-gate-seal" data-logo="mono">{v4("gtpLogo")}</p>
        <div>
          <p className="c4-gate-kicker">{v4("gtpSub")}</p>
          <h2 className="c4-title">{v4("gtpTitle")}</h2>
        </div>
        <p className="c4-gate-count">{shown.length}</p>
      </header>
      <p className="c4-gate-links">
        <Link href={crmv4Href(base, "chd")}>{v4("chdTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("chdCustomers")}</Link>
      </p>
      <p className="c4-gate-hint">{v4("gtpHint")}</p>
      {viewer && <p className="c4-gate-note">{v4("gtpViewer")}</p>}
      <p className="c4-gate-meta">{v4("gtpLead")} {laneLabel(v4, lead)} · {v4("gtpToneLead")} {hueLabel(v4, leadHue)} · {v4("gtpShare")} {share}</p>
      <div className="c4-gate-chart" aria-label={v4("gtpChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-gate-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-gate-tools">
        <input ref={searchRef} className="c4-field c4-gate-search" aria-label={v4("gtpSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("gtpSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("gtpShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "gtpAll" : item === "reviewed" ? "gtpReviewed" : "gtpFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("gtpAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as GateShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
      </div>
      <div className="c4-gate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkGateReview(reviewed, picked, true))}>{v4("gtpBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkGateReview(reviewed, picked, false))}>{v4("gtpBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("gate-lanes.csv", gateLanesCsv(rows))}>{v4("gtpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("gate-rows.csv", gateRowsCsv(shown, reviewed))}>{v4("gtpRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("gtpLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("gtpFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("gtpEmpty")}</p>}
      <ul className="c4-gate-lanes">
        {present.map((item) => (
          <li key={item} data-lane={item} data-hidden={hidden.includes(item) ? "1" : "0"}>
            <button type="button" className="c4-chip" data-on={lane === item ? "1" : "0"} onClick={() => setLane(lane === item ? "all" : item)}>{laneLabel(v4, item)} {laneGateCount(rows, item as "vow" | "mark" | "pair" | "short" | "long" | "vowel" | "keep" | "post")}</button>
            <button type="button" className="c4-btn" onClick={() => storeHidden(toggleGate(hidden, item))}>{hidden.includes(item) ? v4("gtpShow") : v4("gtpHide")}</button>
          </li>
        ))}
      </ul>
      <ul className="c4-gate-list" data-plates="1">
        {shown.map((row) => {
          const name = gateCopy(row.gate);
          const tone = gateHue(row.gate);
          return (
            <li key={row.id} className="c4-gate-card" data-lane={gateLane(row.gate) || "open"} data-hue={tone || "none"} data-vow={gateVow(row.gate) ? "1" : "0"} data-mark={gateMark(row.gate) ? "1" : "0"} data-pair={gatePair(row.gate) ? "1" : "0"} data-short={gateShort(row.gate) ? "1" : "0"} data-long={gateLong(row.gate) ? "1" : "0"} data-keep={gateKeep(row.gate) ? "1" : "0"} data-post={gatePost(row.gate) ? "1" : "0"} data-open={gateOpen(row.gate) ? "1" : "0"} data-held={gateHeld(row.gate) ? "1" : "0"} data-even={gateEven(row.gate) ? "1" : "0"} data-digit={gateDigit(row.gate) ? "1" : "0"} data-letter={gateLetter(row.gate) ? "1" : "0"} data-mixed={gateMixed(row.gate) ? "1" : "0"} data-upper={gateUpper(row.gate) ? "1" : "0"} data-lower={gateLower(row.gate) ? "1" : "0"} data-space={gateSpace(row.gate) ? "1" : "0"} data-vowel={gateVowel(row.gate) ? "1" : "0"} data-tail={gateTail(row.gate) ? "1" : "0"} data-first={gateFirst(row.gate) ? "1" : "0"} data-capital={gateCapital(row.gate) ? "1" : "0"} data-hyphen={gateHyphen(row.gate) ? "1" : "0"} data-period={gatePeriod(row.gate) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
              <label>
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-gate-meta">{name || v4("gtpOpen")} · {gateStamp(row.gate) || "—"} · {gateFamily(row.gate) || "—"} · {gateLength(row.gate) ?? "—"} · {laneLabel(v4, gateLane(row.gate))} · {hueLabel(v4, tone)}</p>
              </div>
              <div>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleGateReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("gtpReviewed") : v4("gtpReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = gateCopy(row.gate); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("gtpCopied") : v4("gtpCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("gtpCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
