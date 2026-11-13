"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  ADP_KEY,
  ADP_REVIEW_KEY,
  NOC_DENSITY_KEY,
  NOC_KEY,
  NOC_VIEW_KEY,
  NOCTURNAL_STATIONS,
  addNocturnal,
  addNocturnalTag,
  addNocturnalView,
  addressCap,
  addressCopy,
  addressEcho,
  addressHue,
  addressKnown,
  addressLane,
  addressLanes,
  addressLanesCsv,
  addressLeap,
  addressNotch,
  addressRowsCsv,
  addressShare,
  addressSlash,
  addressStamp,
  addressStep,
  addressTail,
  addressTwin,
  addressVowel,
  addressWide,
  addressWords,
  briskNocturnal,
  bulkAddressReview,
  bulkNocturnalBrass,
  bulkNocturnalChampagne,
  bulkNocturnalLog,
  bulkNocturnalStow,
  bulkNocturnalTag,
  busiestKeeper,
  clashStationCount,
  cycleTone,
  dipWatch,
  dipWatchFocused,
  dropNocturnalView,
  editNocturnal,
  editNocturnalNote,
  fairKeeper,
  houseMetal,
  idleNocturnal,
  idleNocturnals,
  keenStation,
  laneAddressCount,
  lateNocturnal,
  leadingAddress,
  leadingAddressHue,
  liftWatch,
  liftWatchFocused,
  lockNocturnalFocused,
  logNocturnalFocused,
  lowerTooth,
  lowerToothFocused,
  moveNocturnalFocus,
  neighborNocturnalCount,
  nocturnalBars,
  nocturnalCopy,
  nocturnalCounts,
  nocturnalCsv,
  nocturnalDensity,
  nocturnalKeepers,
  nocturnalTimeline,
  overdueNocturnal,
  presentAddressLanes,
  raiseTooth,
  raiseToothFocused,
  readHiddenAddresses,
  readNocturnalViews,
  readNocturnals,
  readReviewedAddresses,
  reminderNocturnals,
  restingNocturnal,
  setNocturnalLock,
  setNocturnalLogged,
  setNocturnalMetal,
  setNocturnalStar,
  setNocturnalStow,
  sharedAddressCount,
  sortNocturnals,
  starNocturnalFocused,
  stillStation,
  suggestMetal,
  suggestStation,
  suggestWatch,
  tagNocturnalFocused,
  toggleAddress,
  toggleAddressReview,
  toneFocused,
  visibleAddressLanes,
  visibleAddresses,
  visibleNocturnals,
  type AddressReview,
  type AddressRow,
  type AddressShape,
  type AddressValue,
  type NocturnalDensity,
  type NocturnalSight,
  type NocturnalSort,
  type NocturnalTray,
  type NocturnalView,
} from "@/lib/crmv4/round281";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const METALS = ["ivory", "graphite", "champagne"] as const;
const TONES = ["pearl", "ink", "brass"] as const;
const WATCHES = ["15", "45", "75"] as const;
const TEETH = ["2", "6", "9"] as const;

const STATION_KEY: Record<string, CrmV4CopyKey> = {
  polaris: "nocPolaris",
  pointer: "nocPointer",
  guard: "nocGuard",
  dial: "nocDial",
  keen: "nocKeen",
  still: "nocStill",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "nocAuditSave",
  edit: "nocAuditEdit",
  note: "nocAuditNote",
  tone: "nocAuditTone",
  log: "nocAuditLog",
  unlog: "nocAuditUnlog",
  lock: "nocAuditLock",
  resume: "nocAuditResume",
  stow: "nocAuditStow",
  open: "nocAuditOpen",
  metal: "nocAuditMetal",
  tag: "nocAuditTag",
  tooth: "nocAuditTooth",
  watch: "nocAuditWatch",
  dip: "nocAuditDip",
  star: "nocAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  court: "adpCourt",
  mews: "adpMews",
  number: "adpNumber",
  square: "adpSquare",
  row: "adpRow",
  close: "adpClose",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "adpIvory",
  graphite: "adpGraphite",
  champagne: "adpChampagne",
};

type NameRow = {
  id?: string;
  name?: string | null;
  address?: string | null;
  code?: string | null;
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
  const node = event.target as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
}

function textField(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").trim();
}

function stationLabel(v4: V4, station: string): string {
  const key = STATION_KEY[station];
  return key ? v4(key) : v4("nocBlank");
}

function metalLabel(v4: V4, metal: string): string {
  if (metal === "IVORY") return v4("nocIvory");
  if (metal === "GRAPHITE") return v4("nocGraphite");
  if (metal === "CHAMPAGNE") return v4("nocChampagne");
  return v4("nocBlankMetal");
}

function toneLabel(v4: V4, tone: string): string {
  if (tone === "pearl") return v4("nocPearl");
  if (tone === "ink") return v4("nocInk");
  if (tone === "brass") return v4("nocBrass");
  return v4("nocBlankTone");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("adpUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("adpUnmarked");
}

export function NocturnalSights({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<NocturnalSight[]>([]);
  const [views, setViews] = useState<NocturnalView[]>([]);
  const [density, setDensity] = useState<NocturnalDensity>("open");
  const [sheet, setSheet] = useState<"board" | "index">("board");
  const [tray, setTray] = useState<NocturnalTray>("night");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [metalFilter, setMetalFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState("all");
  const [stationFilter, setStationFilter] = useState("all");
  const [watchFilter, setWatchFilter] = useState("all");
  const [toothFilter, setToothFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [keenOnly, setKeenOnly] = useState(false);
  const [stillOnly, setStillOnly] = useState(false);
  const [sort, setSort] = useState<NocturnalSort>("band");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [station, setStation] = useState("");
  const [metal, setMetal] = useState("");
  const [tone, setTone] = useState("");
  const [watchNo, setWatchNo] = useState("");
  const [toothNo, setToothNo] = useState("2");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [desk, setDesk] = useState("polaris");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readNocturnals(readJson(NOC_KEY, [])));
    setViews(readNocturnalViews(readJson(NOC_VIEW_KEY, [])));
    setDensity(nocturnalDensity(readJson(NOC_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: NocturnalSight[]) {
    setCards(next);
    writeJson(NOC_KEY, next);
  }
  function storeViews(next: NocturnalView[]) {
    setViews(next);
    writeJson(NOC_VIEW_KEY, next);
  }
  function storeDensity(next: NocturnalDensity) {
    setDensity(next);
    writeJson(NOC_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortNocturnals(visibleNocturnals(cards, tray, query, keeperFilter, metalFilter, toneFilter, stationFilter, watchFilter, toothFilter, houseOnly, keenOnly, stillOnly), sort),
    [cards, tray, query, keeperFilter, metalFilter, toneFilter, stationFilter, watchFilter, toothFilter, houseOnly, keenOnly, stillOnly, sort],
  );
  const counts = nocturnalCounts(cards, shown, desk);
  const bars = nocturnalBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = nocturnalTimeline(cards);
  const keepers = nocturnalKeepers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestMetal(cards);
  const fair = fairKeeper(cards, keepers.join(","));
  const busy = busiestKeeper(cards);
  const reminders = reminderNocturnals(cards);
  const idling = idleNocturnals(cards);
  const watchHint = suggestWatch(cards, clock);
  const stationHint = suggestStation(clock);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setStation("");
        setMetal("");
        setTone("");
        setWatchNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveNocturnalFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveNocturnalFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(logNocturnalFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(lockNocturnalFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(toneFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(liftWatchFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(dipWatchFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagNocturnalFocused(cards, ids, focusAt, "n"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starNocturnalFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseToothFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerToothFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        setSheet((value) => (value === "board" ? "index" : "board"));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length, viewer, cards, ids, focusAt]);

  function togglePick(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function applyView(view: NocturnalView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper || "all");
    setMetalFilter(view.metal);
    setToneFilter(view.tone);
    setStationFilter(view.station);
    setWatchFilter(view.watch);
    setToothFilter(view.tooth);
  }

  return (
    <section className="c4-nocturnal" aria-label={v4("nocTitle")} data-cards="1" data-desk="night" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-nocturnal-mast">
        <p className="c4-nocturnal-seal" data-logo="mono">{v4("nocLogo")}</p>
        <div>
          <p className="c4-nocturnal-kicker">{v4("nocSub")}</p>
          <h2 className="c4-title">{v4("nocTitle")}</h2>
        </div>
        <ol className="c4-nocturnal-index" aria-label={v4("nocTitle")}>
          <li data-tone="gold">{v4("nocBrass")}</li>
          <li data-tone="ink">{v4("nocInk")}</li>
          <li data-tone="ivory">{v4("nocPearl")}</li>
        </ol>
      </header>
      <p className="c4-nocturnal-links">
        <Link href={crmv4Href(base, "adp")}>{v4("adpTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("nocCustomers")}</Link>
        <Link href={crmv4Href(base, "marketing")}>{v4("nocWeek")}</Link>
      </p>
      {viewer && <p className="c4-nocturnal-note">{v4("nocViewer")}</p>}
      <p className="c4-nocturnal-lead">{v4("nocKeys")}</p>
      <p className="c4-nocturnal-hint">{v4("nocHint")}</p>
      <p className="c4-nocturnal-notice" role="status">{v4("nocNotice")} {counts.overdue}</p>
      <ol className="c4-nocturnal-dials" aria-label={v4("nocChart")}>
        <li><span>{v4("nocNight")}</span><strong>{counts.night}</strong></li>
        <li><span>{v4("nocChest")}</span><strong>{counts.chest}</strong></li>
        <li><span>{v4("nocHold")}</span><strong>{counts.hold}</strong></li>
        <li><span>{v4("nocLogged")}</span><strong>{counts.logged}</strong></li>
        <li><span>{v4("nocOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("nocEven")}</span><strong>{counts.even}</strong></li>
      </ol>
      <div className="c4-nocturnal-chart" aria-label={v4("nocBars")}>
        {bars.map((bar) => (
          <button key={bar.station} type="button" className="c4-nocturnal-column" data-on={stationFilter === bar.station ? "1" : "0"} onClick={() => setStationFilter(stationFilter === bar.station ? "all" : bar.station)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{stationLabel(v4, bar.station)}</span>
          </button>
        ))}
      </div>
      <ol className="c4-nocturnal-time" aria-label={v4("nocIndex")}>
        {timeline.map((lane) => (
          <li key={lane.tooth}><span>{lane.tooth}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <form className="c4-nocturnal-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const id = `noc-${Date.now().toString(36)}`;
        store(addNocturnal(cards, { id, title, note, keeper, station, metal, tone, watch: watchNo, tooth: toothNo, tags }));
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("nocEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("nocTitle")} />
        <input className="c4-field" aria-label={v4("nocNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("nocNote")} />
        <input className="c4-field" aria-label={v4("nocFair")} aria-required={false} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} placeholder={v4("nocBlankKeeper")} />
        <select className="c4-field" aria-label={v4("nocStation")} value={station} disabled={viewer} onChange={(event) => setStation(event.target.value)}>
          <option value="">{v4("nocBlankStation")}</option>
          {NOCTURNAL_STATIONS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("nocMetal")} value={metal} disabled={viewer} onChange={(event) => setMetal(event.target.value)}>
          <option value="">{v4("nocBlankMetal")}</option>
          {METALS.map((item) => <option key={item} value={item}>{metalLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("nocTone")} value={tone} disabled={viewer} onChange={(event) => setTone(event.target.value)}>
          <option value="">{v4("nocBlankTone")}</option>
          {TONES.map((item) => <option key={item} value={item}>{toneLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("nocWatch")} value={watchNo} disabled={viewer} onChange={(event) => setWatchNo(event.target.value)}>
          <option value="">{v4("nocBlankWatch")}</option>
          {WATCHES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("nocTooth")} value={toothNo} disabled={viewer} onChange={(event) => setToothNo(event.target.value)}>
          {TEETH.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("nocTags")} aria-required={false} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} placeholder={v4("nocTags")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("nocAdd")}</button>
      </form>
      <div className="c4-nocturnal-tools">
        <input ref={searchRef} className="c4-field c4-nocturnal-search" aria-label={v4("nocSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("nocSearch")} />
        {(["night", "chest", "hold"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "night" ? v4("nocNight") : item === "chest" ? v4("nocChest") : v4("nocHold")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "open" : "close")}>{v4("nocTight")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("nocHouse")}</button>
        <button type="button" className="c4-chip" data-on={keenOnly ? "1" : "0"} onClick={() => setKeenOnly((value) => !value)}>{v4("nocKeen")}</button>
        <button type="button" className="c4-chip" data-on={stillOnly ? "1" : "0"} onClick={() => setStillOnly((value) => !value)}>{v4("nocStill")}</button>
        <select className="c4-field" aria-label={v4("nocFair")} value={keeperFilter} onChange={(event) => setKeeperFilter(event.target.value)}>
          <option value="all">{v4("nocAll")}</option>
          {keepers.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("nocMetal")} value={metalFilter} onChange={(event) => setMetalFilter(event.target.value)}>
          <option value="all">{v4("nocAll")}</option>
          {METALS.map((item) => <option key={item} value={item}>{metalLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("nocTone")} value={toneFilter} onChange={(event) => setToneFilter(event.target.value)}>
          <option value="all">{v4("nocAll")}</option>
          {TONES.map((item) => <option key={item} value={item}>{toneLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("nocStation")} value={stationFilter} onChange={(event) => setStationFilter(event.target.value)}>
          <option value="all">{v4("nocAll")}</option>
          <option value="keen">{v4("nocKeen")}</option>
          <option value="still">{v4("nocStill")}</option>
          {NOCTURNAL_STATIONS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("nocWatch")} value={watchFilter} onChange={(event) => setWatchFilter(event.target.value)}>
          <option value="all">{v4("nocAll")}</option>
          {WATCHES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("nocTooth")} value={toothFilter} onChange={(event) => setToothFilter(event.target.value)}>
          <option value="all">{v4("nocAll")}</option>
          {TEETH.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("nocStation")} value={desk} onChange={(event) => setDesk(event.target.value)}>
          {NOCTURNAL_STATIONS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
        </select>
      </div>
      <form className="c4-nocturnal-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer || !viewName.trim()) return;
        storeViews(addNocturnalView(views, { id: `view-${Date.now().toString(36)}`, name: viewName, tray, query, keeper: keeperFilter, metal: metalFilter, tone: toneFilter, station: stationFilter, watch: watchFilter, tooth: toothFilter }));
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("nocViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("nocViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("nocSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-nocturnal-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("nocApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropNocturnalView(views, view.id))}>{v4("nocDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-nocturnal-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkNocturnalLog(cards, picked))}>{v4("nocBulkLog")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkNocturnalStow(cards, picked))}>{v4("nocBulkStow")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkNocturnalBrass(cards, picked))}>{v4("nocBulkBrass")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkNocturnalChampagne(cards, picked))}>{v4("nocBulkChampagne")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkNocturnalTag(cards, picked, "s"))}>{v4("nocBulkTag")}</button>
        </div>
      )}
      <p className="c4-nocturnal-meta">{v4("nocSuggest")} {metalLabel(v4, suggested)} · {v4("nocFair")} {fair} · {v4("nocBusy")} {busy || v4("nocBlankKeeper")} · {v4("nocNeighbors")} {neighborNocturnalCount(cards)} · {v4("nocClash")} {clashStationCount(cards)} · {v4("nocWatchHint")} {watchHint} · {v4("nocStationHint")} {stationLabel(v4, stationHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-nocturnal-meta">{v4("nocDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("nocIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-nocturnal-empty">{v4("nocEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-nocturnal-index-list" : "c4-nocturnal-board"} data-density={density}>
        {shown.map((card, index) => (
          <li key={card.id} className="c4-nocturnal-card" data-on={index === focusAt ? "1" : "0"} data-logged={card.logged ? "1" : "0"} data-overdue={overdueNocturnal(card) ? "1" : "0"} data-keen={keenStation(card.station) ? "1" : "0"} data-still={stillStation(card.station) ? "1" : "0"} data-house={houseMetal(card.metal) ? "1" : "0"} data-brisk={briskNocturnal(card) ? "1" : "0"} data-idle={idleNocturnal(card) ? "1" : "0"} data-resting={restingNocturnal(card) ? "1" : "0"} data-late={lateNocturnal(card, desk) ? "1" : "0"}>
            <ol className="c4-nocturnal-ticks" aria-hidden="true">
              {TEETH.map((tick) => <li key={tick} data-on={String(card.tooth) === tick ? "1" : "0"} />)}
            </ol>
            <label className="c4-nocturnal-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("nocEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editNocturnal(cards, card.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("nocEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editNocturnalNote(cards, card.id, event.target.value))} />
              <p className="c4-nocturnal-meta">{card.keeper || v4("nocBlankKeeper")} · {stationLabel(v4, card.station)} · {metalLabel(v4, card.metal)} · {toneLabel(v4, card.tone)} · {card.watch ?? v4("nocBlankWatch")} · {v4("nocTooth")} {card.tooth} · {card.tags.join(" ") || v4("nocTags")}</p>
              <p className="c4-nocturnal-meta">{stationLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("nocAuditSave")}</p>
              <div className="c4-nocturnal-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNocturnalLogged(cards, card.id, !card.logged))}>{card.logged ? v4("nocUnlog") : v4("nocLog")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.stowed} onClick={() => store(setNocturnalLock(cards, card.id, !card.locked))}>{card.locked ? v4("nocResume") : v4("nocLock")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNocturnalStow(cards, card.id, !card.stowed))}>{card.stowed ? v4("nocOpenAgain") : v4("nocStowed")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNocturnalStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("nocUnstar") : v4("nocStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleTone(cards, card.id))}>{v4("nocTone")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftWatch(cards, card.id))}>{v4("nocLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(dipWatch(cards, card.id))}>{v4("nocDip")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseTooth(cards, card.id))}>{v4("nocRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerTooth(cards, card.id))}>{v4("nocLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNocturnalMetal(cards, card.id, card.metal === "CHAMPAGNE" ? "graphite" : "champagne"))}>{v4("nocMetal")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addNocturnalTag(cards, card.id, "n"))}>{v4("nocTags")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(nocturnalCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("nocCopied") : v4("nocCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="c4-btn" onClick={() => { setSort(sort === "band" ? "keeper" : "band"); }}>{sort === "band" ? v4("nocSortKeeper") : v4("nocSortStation")}</button>
      <button type="button" className="c4-btn" onClick={() => download("nocturnal-sights.csv", nocturnalCsv(shown, desk))}>{v4("nocCsv")}</button>
    </section>
  );
}

export function AddressPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<AddressShape>("all");
  const [review, setReview] = useState<AddressReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<AddressRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `name-${row.id}` : `name-${index}`,
    label: textField(row.name),
    note: { address: textField(row.address) } satisfies AddressValue,
  })), [queue.data?.users]);
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
    const present = presentAddressLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenAddresses(readJson(ADP_KEY, []), present);
    const nextReviewed = readReviewedAddresses(readJson(ADP_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(ADP_KEY, nextHidden);
    writeJson(ADP_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentAddressLanes(rows);
  const lanes = visibleAddressLanes(present, hidden, showHidden);
  const shown = visibleAddresses(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = addressLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = addressLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingAddress(rows);
  const leadHue = leadingAddressHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveNocturnalFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveNocturnalFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        setShowHidden((value) => !value);
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length, focusAt]);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(ADP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(ADP_REVIEW_KEY, next);
  }
  return (
    <section className="c4-addressplate" aria-label={v4("adpTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-addressplate-mast">
        <p className="c4-addressplate-seal" data-logo="mono">{v4("adpLogo")}</p>
        <div>
          <p className="c4-addressplate-kicker">{v4("adpSub")}</p>
          <h2 className="c4-title">{v4("adpTitle")}</h2>
        </div>
      </header>
      <ol className="c4-addressplate-index" aria-label={v4("adpTitle")}>
        <li data-tone="gold">{v4("adpCourt")}</li>
        <li data-tone="ink">{v4("adpMews")}</li>
        <li data-tone="ivory">{v4("adpNumber")}</li>
        <li data-tone="mist">{v4("adpSquare")}</li>
        <li data-tone="line">{v4("adpRow")}</li>
      </ol>
      <p className="c4-addressplate-links">
        <Link href={crmv4Href(base, "noc")}>{v4("nocTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("nocCustomers")}</Link>
        <Link href={crmv4Href(base, "marketing")}>{v4("nocWeek")}</Link>
      </p>
      <p className="c4-addressplate-hint">{v4("adpHint")}</p>
      {viewer && <p className="c4-addressplate-note">{v4("adpViewer")}</p>}
      {queue.loading && <p className="c4-addressplate-meta">{v4("adpEmpty")}</p>}
      {queue.error && <p className="c4-addressplate-meta">{queue.error}</p>}
      <ul className="c4-addressplate-kpis" aria-label={v4("adpRules")}>
        <li><span>{v4("adpLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("adpUnmarked")}</strong></li>
        <li><span>{v4("adpToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("adpUnmarked")}</strong></li>
        <li><span>{v4("adpShared")}</span><strong>{sharedAddressCount(rows)}</strong></li>
        <li><span>{v4("adpShare")}</span><strong>{addressShare(laneAddressCount(rows, "court"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("adpKnown")}</span><strong>{rows.filter((row) => addressKnown(row.note)).length}</strong></li>
        <li><span>{v4("adpTwin")}</span><strong>{rows.filter((row) => addressTwin(row.note)).length}</strong></li>
        <li><span>{v4("adpVowel")}</span><strong>{rows.filter((row) => addressVowel(row.note)).length}</strong></li>
        <li><span>{v4("adpWords")}</span><strong>{rows.reduce((sum, row) => sum + addressWords(row.note), 0)}</strong></li>
      </ul>
      <div className="c4-addressplate-chart" aria-label={v4("adpRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-addressplate-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-addressplate-tools">
        <input ref={searchRef} className="c4-field c4-addressplate-search" aria-label={v4("adpSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("adpSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("adpAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "court", "mews", "number", "square", "row", "close", "wide", "notch", "leap", "slash", "twin", "known", "echo", "vowel"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("adpShapeAll") : item === "wide" ? v4("adpShapeWide") : item === "notch" ? v4("adpShapeNotch") : item === "leap" ? v4("adpShapeLeap") : item === "slash" ? v4("adpShapeSlash") : item === "twin" ? v4("adpShapeTwin") : item === "known" ? v4("adpShapeKnown") : item === "echo" ? v4("adpShapeEcho") : item === "vowel" ? v4("adpShapeVowel") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("adpAll") : item === "reviewed" ? v4("adpReviewed") : v4("adpUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("adpShow")}</button>
      </div>
      <ul className="c4-addressplate-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleAddress(hidden, item))}>{hidden.includes(item) ? v4("adpShow") : v4("adpHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-addressplate-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkAddressReview(reviewed, picked, true))}>{v4("adpBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkAddressReview(reviewed, picked, false))}>{v4("adpBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-addressplate-empty">{v4("adpEmpty")}</p>}
      <ol className="c4-addressplate-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-addressplate-card" data-on={index === focusAt ? "1" : "0"} data-lane={addressLane(row.note)} data-hue={addressHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={addressKnown(row.note) ? "1" : "0"}>
              <p className="c4-addressplate-stamp">{addressStamp(row.note) || "·"}</p>
              <label className="c4-addressplate-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("adpUnmarked")}</strong>
                <p className="c4-addressplate-meta">{laneLabel(v4, addressLane(row.note))} · {hueLabel(v4, addressHue(row.note))} · {v4("adpStep")} {addressStep(row.note)} · {v4("adpWords")} {addressWords(row.note)}{addressCap(row.note) ? ` · ${v4("adpCap")}` : ""}{addressTail(row.note) ? ` · ${v4("adpTail")}` : ""}{addressWide(row.note) ? ` · ${v4("adpWide")}` : ""}{addressNotch(row.note) ? ` · ${v4("adpNotch")}` : ""}{addressLeap(row.note) ? ` · ${v4("adpLeap")}` : ""}{addressSlash(row.note) ? ` · ${v4("adpSlash")}` : ""}{addressEcho(row.note) ? ` · ${v4("adpEcho")}` : ""}</p>
                <div className="c4-addressplate-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleAddressReview(reviewed, row.id))}>{seen ? v4("adpReviewed") : v4("adpReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(addressCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("adpCopied") : v4("adpCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-addressplate-tools">
        <button type="button" className="c4-btn" onClick={() => download("address-lanes.csv", addressLanesCsv(rows))}>{v4("adpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("address-rows.csv", addressRowsCsv(shown, reviewed))}>{v4("adpRowCsv")}</button>
      </div>
    </section>
  );
}
