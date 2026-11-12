"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DAWN_CITIES,
  DNB_DENSITY_KEY,
  DNB_KEY,
  DNB_VIEW_KEY,
  LCR_KEY,
  LCR_REVIEW_KEY,
  activeCity,
  activeCloth,
  activeGait,
  activeWeight,
  activeWindow,
  addDawnBook,
  addDawnView,
  bulkCrestReview,
  bulkDawnArchive,
  bulkDawnCloth,
  bulkDawnGait,
  bulkDawnPin,
  bulkDawnTag,
  busiestKeeper,
  cityBand,
  cityGap,
  clashCityCount,
  coolingBook,
  coolingBooks,
  crestBound,
  crestCopy,
  crestJoin,
  crestLane,
  crestLanes,
  crestMark,
  crestNotch,
  crestRowsCsv,
  crestShare,
  crestState,
  crestStep,
  crestTone,
  crestWide,
  crestsCsv,
  cycleGait,
  dawnCopy,
  dawnCounts,
  dawnCsv,
  dawnDensity,
  dawnKeepers,
  dawnShare,
  dawnSort,
  dawnTimeline,
  dropDawnView,
  editDawn,
  editDawnNote,
  fairKeeper,
  gaitFocusedDawn,
  holdFocusedDawn,
  houseCloth,
  laneCrestCount,
  lateBook,
  leadingCrest,
  leadingCrestTone,
  matchedBooks,
  moveDawnFocus,
  neighborBookCount,
  nextDawn,
  pairKeeperCount,
  peakCity,
  pinFocusedDawn,
  presentCrestLanes,
  quietCity,
  readDawnBooks,
  readDawnViews,
  readHiddenCrests,
  readReviewedCrests,
  reminderBooks,
  sealFocusedDawn,
  setDawnArchive,
  setDawnHold,
  setDawnPin,
  setDawnSeal,
  setDawnWeight,
  sharedCrestCount,
  snoozeFocusedDawn,
  snoozeWindow,
  sortDawn,
  suggestCloth,
  suggestWindow,
  tagFocusedDawn,
  toggleCrest,
  toggleCrestReview,
  toneCrestCount,
  visibleCrestLanes,
  visibleCrests,
  visibleDawn,
  weightFocusedDawn,
  weightLoad,
  windowClashCount,
  type CrestReview,
  type CrestRow,
  type CrestShape,
  type CrestValue,
  type DawnBook,
  type DawnDensity,
  type DawnSort,
  type DawnTray,
  type DawnView,
} from "@/lib/crmv4/round242";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const CLOTHS = ["ivory", "champagne", "ink"] as const;
const GAITS = ["soft", "firm", "swift"] as const;
const WINDOWS = ["15", "30", "45"] as const;
const WEIGHTS = ["3", "6", "9"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "dnbAuditSave",
  edit: "dnbAuditEdit",
  note: "dnbAuditNote",
  gait: "dnbAuditGait",
  pin: "dnbAuditPin",
  unpin: "dnbAuditUnpin",
  hold: "dnbAuditHold",
  resume: "dnbAuditResume",
  archive: "dnbAuditArchive",
  open: "dnbAuditOpen",
  cloth: "dnbAuditCloth",
  tag: "dnbAuditTag",
  weight: "dnbAuditWeight",
  window: "dnbAuditWindow",
  seal: "dnbAuditSeal",
};

const CITY_KEY: Record<string, CrmV4CopyKey> = {
  istanbul: "dnbIstanbul",
  london: "dnbLondon",
  berlin: "dnbBerlin",
  moscow: "dnbMoscow",
  dubai: "dnbDubai",
  newyork: "dnbNewYork",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  retentionStatus?: string | null;
  desk?: string | null;
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

function textField(raw: string | null | undefined): string {
  return typeof raw === "string" ? raw : "";
}

function clothLabel(v4: V4, cloth: string): string {
  if (cloth === "IVORY" || cloth === "ivory") return v4("dnbIvory");
  if (cloth === "CHAMPAGNE" || cloth === "champagne") return v4("dnbChampagne");
  if (cloth === "INK" || cloth === "ink") return v4("dnbInk");
  return v4("dnbBlankCloth");
}

function gaitLabel(v4: V4, gait: string): string {
  if (gait === "soft") return v4("dnbSoft");
  if (gait === "firm") return v4("dnbFirm");
  if (gait === "swift") return v4("dnbSwift");
  return v4("dnbBlankGait");
}

function cityLabel(v4: V4, city: string): string {
  return CITY_KEY[city] ? v4(CITY_KEY[city]) : v4("dnbBlank");
}

function bandLabel(v4: V4, band: string): string {
  if (band === "west") return v4("dnbWest");
  if (band === "core") return v4("dnbCore");
  if (band === "east") return v4("dnbEast");
  return v4("dnbBlank");
}

function laneLabel(v4: V4, lane: string): string {
  if (lane === "linked") return v4("lcrLinked");
  if (lane === "named") return v4("lcrNamed");
  if (lane === "rich") return v4("lcrRich");
  if (lane === "even") return v4("lcrEven");
  if (lane === "spare") return v4("lcrSpare");
  if (lane === "mute") return v4("lcrMute");
  return v4("lcrUnmarked");
}

function crestToneLabel(v4: V4, tone: string): string {
  if (tone === "gilt") return v4("lcrGilt");
  if (tone === "linen") return v4("lcrLinen");
  if (tone === "sand") return v4("lcrSand");
  if (tone === "clay") return v4("lcrClay");
  if (tone === "ivory") return v4("lcrIvory");
  if (tone === "soot") return v4("lcrSoot");
  if (tone === "mist") return v4("lcrMist");
  return v4("lcrUnmarked");
}

export function DawnBooks({ base, v4 }: { base: string; v4: V4 }) {
  const [books, setBooks] = useState<DawnBook[]>([]);
  const [views, setViews] = useState<DawnView[]>([]);
  const [density, setDensity] = useState<DawnDensity>("airy");
  const [sort, setSort] = useState<DawnSort>("city");
  const [tray, setTray] = useState<DawnTray>("open");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [clothFilter, setClothFilter] = useState("all");
  const [gaitFilter, setGaitFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [windowFilter, setWindowFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("london");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [city, setCity] = useState("");
  const [cloth, setCloth] = useState("");
  const [gait, setGait] = useState("");
  const [windowMin, setWindowMin] = useState("");
  const [weight, setWeight] = useState("3");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [board, setBoard] = useState<"hall" | "index">("hall");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    setBooks(readDawnBooks(readJson(DNB_KEY, [])));
    setViews(readDawnViews(readJson(DNB_VIEW_KEY, [])));
    setDensity(dawnDensity(readJson(DNB_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortDawn(visibleDawn(books, tray, query, keeperFilter, clothFilter, gaitFilter, cityFilter, windowFilter, weightFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = dawnCounts(books, shown, desk);
  const timeline = dawnTimeline(books);
  const reminders = reminderBooks(books);
  const cooling = coolingBooks(books);
  const keepers = dawnKeepers(books);
  const focused = shown[focusAt];
  const ids = shown.map((book) => book.id);
  function store(next: DawnBook[]) {
    const saved = readDawnBooks(next);
    setBooks(saved);
    writeJson(DNB_KEY, saved);
  }
  function storeViews(next: DawnView[]) {
    const saved = readDawnViews(next);
    setViews(saved);
    writeJson(DNB_VIEW_KEY, saved);
  }
  function storeDensity(next: DawnDensity) {
    setDensity(next);
    writeJson(DNB_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: DawnView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper || "all");
    setClothFilter(view.cloth);
    setGaitFilter(view.gait);
    setCityFilter(view.city);
    setWindowFilter(view.window);
    setWeightFilter(view.weight);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setCity("");
        setCloth("");
        setGait("");
        setWindowMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveDawnFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveDawnFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(holdFocusedDawn(books, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinFocusedDawn(books, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(gaitFocusedDawn(books, ids, focusAt));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        if (!viewer) store(snoozeFocusedDawn(books, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(sealFocusedDawn(books, ids, focusAt));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        if (!viewer) store(tagFocusedDawn(books, ids, focusAt, "p"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(weightFocusedDawn(books, ids, focusAt));
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        setBoard((value) => value === "hall" ? "index" : "hall");
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const bars = DAWN_CITIES.map((item) => ({ city: item, count: books.filter((book) => !book.archived && !book.held && book.city === item).length }));
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const suggested = suggestCloth(books);
  const suggestedWindow = suggestWindow(books, new Date().getUTCHours());
  const fair = fairKeeper(books, keepers.join(", "));
  return (
    <section className="c4-dnb" aria-label={v4("dnbTitle")} data-books="1" data-desk="salon" data-role={role} data-density={density}>
      <header className="c4-dnb-mast">
        <p className="c4-dnb-seal" data-logo="mono">{v4("dnbLogo")}</p>
        <div>
          <p className="c4-dnb-kicker">{v4("dnbSub")}</p>
          <h2 className="c4-title">{v4("dnbTitle")}</h2>
        </div>
        <ol className="c4-dnb-index" aria-label={v4("dnbTitle")}>
          <li data-tone="gold">{v4("dnbChampagne")}</li>
          <li data-tone="ink">{v4("dnbGraphite")}</li>
          <li data-tone="ivory">{v4("dnbIvory")}</li>
        </ol>
      </header>
      <p className="c4-dnb-links">
        <Link href={crmv4Href(base, "lcr")}>{v4("lcrTitle")}</Link>
        <Link href={crmv4Href(base, "clocks")}>{v4("dnbGallery")}</Link>
      </p>
      {viewer && <p className="c4-dnb-note">{v4("dnbViewer")}</p>}
      <p className="c4-dnb-rule">{v4("dnbHint")}</p>
      <p className="c4-dnb-meta">{v4("dnbLocal")} · {v4("dnbKeys")} · {v4("dnbHoldKey")} · {v4("dnbPinKey")} · {v4("dnbWindowKey")} · {v4("dnbTagKey")} · {v4("dnbBoardKey")} · {v4("dnbEscape")}</p>
      <ul className="c4-dnb-kpis" aria-label={v4("dnbKpi")}>
        <li><span>{v4("dnbOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("dnbHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("dnbArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("dnbPin")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("dnbPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("dnbQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("dnbSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("dnbLoad")}</span><strong>{weightLoad(books)}</strong></li>
        <li><span>{v4("dnbHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("dnbMatched")}</span><strong>{matchedBooks(books, desk).length}</strong></li>
        <li><span>{v4("dnbSeal")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("dnbCooling")}</span><strong>{counts.cooling}</strong></li>
        <li><span>{v4("dnbShare")}</span><strong>{dawnShare(counts.house, Math.max(1, counts.open))}%</strong></li>
        <li><span>{v4("dnbLateShare")}</span><strong>{dawnShare(books.filter((book) => !book.archived && !book.held && lateBook(book, desk)).length, Math.max(1, counts.open))}%</strong></li>
        <li><span>{v4("dnbClash")}</span><strong>{clashCityCount(books)}</strong></li>
        <li><span>{v4("dnbWindowClash")}</span><strong>{windowClashCount(books)}</strong></li>
        <li><span>{v4("dnbNeighbors")}</span><strong>{neighborBookCount(books)}</strong></li>
        <li><span>{v4("dnbPair")}</span><strong>{pairKeeperCount(books)}</strong></li>
      </ul>
      <div className="c4-dnb-bars" aria-label={v4("dnbTimeline")}>
        {bars.map((bar) => (
          <div key={bar.city} className="c4-dnb-bar" data-city={bar.city}>
            <span>{cityLabel(v4, bar.city)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-dnb-meta">{v4("dnbSuggest")} {clothLabel(v4, suggested)} · {v4("dnbWindow")} {suggestedWindow} · {fair ? `${v4("dnbAssign")} ${fair}` : v4("dnbBlankKeeper")} · {busiestKeeper(books) ? `${v4("dnbBusiest")} ${busiestKeeper(books)}` : v4("dnbBusiestNone")}</p>
      <form className="c4-dnb-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addDawnBook(books, { id: `dawn-${Date.now()}`, title, note, keeper, city, cloth, gait, window: windowMin, weight, tags });
        if (next.length === books.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("dnbTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("dnbTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("dnbNote")}</span><input className="c4-field" aria-label={v4("dnbNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("dnbKeeper")}</span><input className="c4-field" aria-label={v4("dnbKeeper")} value={keeper} onChange={(event) => setKeeper(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("dnbCity")}</span>
          <select className="c4-field" aria-label={v4("dnbCity")} value={city} onChange={(event) => setCity(event.target.value)}>
            <option value="">{v4("dnbBlank")}</option>
            {DAWN_CITIES.map((item) => <option key={item} value={item}>{cityLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("dnbCloth")}</span>
          <select className="c4-field" aria-label={v4("dnbCloth")} value={cloth} onChange={(event) => setCloth(event.target.value)}>
            <option value="">{v4("dnbBlankCloth")}</option>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("dnbGait")}</span>
          <select className="c4-field" aria-label={v4("dnbGait")} value={gait} onChange={(event) => setGait(event.target.value)}>
            <option value="">{v4("dnbBlankGait")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("dnbWindow")}</span>
          <select className="c4-field" aria-label={v4("dnbWindow")} value={windowMin} onChange={(event) => setWindowMin(event.target.value)}>
            <option value="">{v4("dnbBlankWindow")}</option>
            {WINDOWS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("dnbWeight")}</span>
          <select className="c4-field" aria-label={v4("dnbWeight")} value={weight} onChange={(event) => setWeight(event.target.value)}>
            {WEIGHTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("dnbTag")}</span><input className="c4-field" aria-label={v4("dnbTag")} value={tags} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("dnbAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => { setCloth(suggested.toLowerCase()); setWindowMin(String(suggestedWindow)); if (fair) setKeeper(fair); }}>{v4("dnbSuggest")}</button>
      </form>
      <div className="c4-dnb-tools">
        <label className="c4-lab"><span>{v4("dnbSearch")}</span><input ref={searchRef} className="c4-field c4-dnb-search" aria-label={v4("dnbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("dnbDesk")}</span>
          <select className="c4-field" aria-label={v4("dnbDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {DAWN_CITIES.map((item) => <option key={item} value={item}>{cityLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" onClick={() => download("dawn-books.csv", dawnCsv(books, desk))}>{v4("dnbCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={density === "tight"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("dnbDensityTight") : v4("dnbDensityAiry")}</button>
        <button type="button" className="c4-btn" aria-pressed={sort === "keeper"} onClick={() => setSort(dawnSort(sort === "city" ? "keeper" : "city"))}>{sort === "city" ? v4("dnbSortKeeper") : v4("dnbSortCity")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDawnPin(books, picked))}>{v4("dnbBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDawnArchive(books, picked))}>{v4("dnbBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDawnGait(books, picked))}>{v4("dnbBulkGait")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDawnTag(books, picked, "q"))}>{v4("dnbBulkTag")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDawnCloth(books, picked, "champagne"))}>{v4("dnbBulkCloth")}</button>
      </div>
      <div className="c4-dnb-tools" role="group" aria-label={v4("dnbTray")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("dnbOpen") : item === "held" ? v4("dnbHeld") : v4("dnbArchived")}</button>
        ))}
        {(["hall", "index"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={board === item ? "1" : "0"} onClick={() => setBoard(item)}>{item === "hall" ? v4("dnbBoardHall") : v4("dnbBoardIndex")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} aria-pressed={houseOnly} onClick={() => setHouseOnly((value) => !value)}>{v4("dnbHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} aria-pressed={peakOnly} onClick={() => setPeakOnly((value) => !value)}>{v4("dnbPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} aria-pressed={quietOnly} onClick={() => setQuietOnly((value) => !value)}>{v4("dnbQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={keeperFilter === "all" ? "1" : "0"} onClick={() => setKeeperFilter("all")}>{v4("dnbAll")}</button>
        {keepers.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={keeperFilter === item ? "1" : "0"} onClick={() => setKeeperFilter(item)}>{item}</button>
        ))}
        {CLOTHS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={clothFilter === item ? "1" : "0"} onClick={() => setClothFilter(activeCloth(clothFilter) === item ? "all" : item)}>{clothLabel(v4, item)}</button>
        ))}
        {GAITS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={gaitFilter === item ? "1" : "0"} onClick={() => setGaitFilter(activeGait(gaitFilter, GAITS) === item ? "all" : item)}>{gaitLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-chip" data-on={cityFilter === "all" ? "1" : "0"} onClick={() => setCityFilter("all")}>{v4("dnbAll")}</button>
        <button type="button" className="c4-chip" data-on={cityFilter === "peak" ? "1" : "0"} onClick={() => setCityFilter("peak")}>{v4("dnbPeak")}</button>
        <button type="button" className="c4-chip" data-on={cityFilter === "quiet" ? "1" : "0"} onClick={() => setCityFilter("quiet")}>{v4("dnbQuiet")}</button>
        {DAWN_CITIES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={cityFilter === item ? "1" : "0"} onClick={() => setCityFilter(activeCity(cityFilter) === item ? "all" : item)}>{cityLabel(v4, item)}</button>
        ))}
        {WINDOWS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={windowFilter === item ? "1" : "0"} onClick={() => setWindowFilter(activeWindow(windowFilter) === item ? "all" : item)}>{item}</button>
        ))}
        {WEIGHTS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={weightFilter === item ? "1" : "0"} onClick={() => setWeightFilter(activeWeight(weightFilter) === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <form className="c4-dnb-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addDawnView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, keeper: keeperFilter, cloth: clothFilter, gait: gaitFilter, city: cityFilter, window: windowFilter, weight: weightFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("dnbViewName")}</span><input className="c4-field" aria-label={v4("dnbViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("dnbSaveView")}</button>
      </form>
      <ul className="c4-dnb-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("dnbApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropDawnView(views, view.id))}>{v4("dnbDropView")}</button>
          </li>
        ))}
      </ul>
      {board === "hall" ? (
        <ol className="c4-dnb-board">
          {!shown.length && <li className="c4-dnb-empty">{v4("dnbEmpty")}</li>}
          {shown.map((book, index) => {
            const gap = cityGap(book.city, desk);
            return (
              <li key={book.id} className="c4-dnb-card" data-on={index === focusAt ? "1" : "0"} data-pinned={book.pinned ? "1" : "0"} data-seal={book.seal ? "1" : "0"} data-cloth={book.cloth || "blank"} data-late={lateBook(book, desk) ? "1" : "0"} data-cooling={coolingBook(book) ? "1" : "0"}>
                <label className="c4-lab"><span>{v4("dnbSelect")}</span><input type="checkbox" aria-label={v4("dnbSelect")} checked={picked.includes(book.id)} onChange={() => togglePick(book.id)} /></label>
                <input className="c4-field" aria-label={v4("dnbEdit")} value={book.title} disabled={viewer} onChange={(event) => { if (!viewer) store(editDawn(books, book.id, event.target.value)); }} />
                <input className="c4-field" aria-label={v4("dnbEditNote")} value={book.note} disabled={viewer} onChange={(event) => { if (!viewer) store(editDawnNote(books, book.id, event.target.value)); }} />
                <p className="c4-dnb-meta">{book.keeper || v4("dnbBlankKeeper")} · {cityLabel(v4, book.city)} · {clothLabel(v4, book.cloth)} · {gaitLabel(v4, book.gait)} · {book.window ?? v4("dnbBlankWindow")} · {v4("dnbWeight")} {book.weight} · {book.tags.join(" ") || v4("dnbBlank")} · {bandLabel(v4, cityBand(book.city))}{peakCity(book.city) ? ` · ${v4("dnbPeak")}` : ""}{quietCity(book.city) ? ` · ${v4("dnbQuiet")}` : ""}{houseCloth(book.cloth) ? ` · ${v4("dnbHouse")}` : ""}{coolingBook(book) ? ` · ${v4("dnbCooling")}` : ""}</p>
                <p className="c4-dnb-meta">{gap === null ? v4("dnbBlank") : gap > 0 ? `${v4("dnbPast")} ${gap}` : gap < 0 ? `${v4("dnbAhead")} ${Math.abs(gap)}` : v4("dnbDue")} · {AUDIT_KEY[book.audit] ? v4(AUDIT_KEY[book.audit]) : v4("dnbBlank")} · {nextDawn(books, book.id) ? `${v4("dnbNext")} ${nextDawn(books, book.id)?.title}` : v4("dnbNextNone")}</p>
                <div className="c4-dnb-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleGait(books, book.id))}>{v4("dnbGait")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDawnPin(books, book.id, !book.pinned))}>{book.pinned ? v4("dnbUnpin") : v4("dnbPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || book.archived} onClick={() => store(setDawnHold(books, book.id, !book.held))}>{book.held ? v4("dnbResume") : v4("dnbHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDawnArchive(books, book.id, !book.archived))}>{book.archived ? v4("dnbReopen") : v4("dnbArchive")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDawnSeal(books, book.id, !book.seal))}>{book.seal ? v4("dnbUnseal") : v4("dnbSeal")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeWindow(books, book.id))}>{v4("dnbSnooze")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDawnWeight(books, book.id, book.weight === 9 ? "3" : book.weight === 6 ? "9" : "6"))}>{v4("dnbRaised")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard.writeText(dawnCopy(book)).catch(() => undefined); setCopied(book.id); }}>{copied === book.id ? v4("dnbCopied") : v4("dnbCopy")}</button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className="c4-dnb-timeline">
          {!timeline.length && <li className="c4-dnb-empty">{v4("dnbEmpty")}</li>}
          {timeline.map((lane) => <li key={lane.city}><span>{cityLabel(v4, lane.city)}</span><strong>{lane.titles.join(" · ")}</strong></li>)}
        </ol>
      )}
      <aside className="c4-dnb-side" aria-label={v4("dnbReminders")}>
        <h3 className="c4-title">{v4("dnbReminders")}</h3>
        {!reminders.length && <p>{v4("dnbEmpty")}</p>}
        <ul>{reminders.map((book) => <li key={book.id}>{book.title} · {lateBook(book, desk) ? v4("dnbLate") : v4("dnbSame")}</li>)}</ul>
        <h3 className="c4-title">{v4("dnbCooling")}</h3>
        {!cooling.length && <p>{v4("dnbCoolingEmpty")}</p>}
        <ul>{cooling.map((book) => <li key={book.id}>{book.title}</li>)}</ul>
        {focused && <p>{v4("dnbFocus")} {focused.title} · {dawnShare(counts.house, Math.max(1, counts.open))}%</p>}
        <p>{clashCityCount(books) ? v4("dnbClash") : v4("dnbClashNone")} · {pairKeeperCount(books) ? v4("dnbPair") : v4("dnbPairNone")}</p>
      </aside>
    </section>
  );
}

function crestNote(row: TraderRow): CrestValue {
  return { name: textField(row.name), ink: textField(row.retentionStatus), stand: textField(row.desk) };
}

export function VowelMarks({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<CrestReview>("all");
  const [shape, setShape] = useState<CrestShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const rows = useMemo<CrestRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `trader-${row.id}` : `trader-${index}`,
    label: textField(row.name),
    note: crestNote(row),
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
    const present = presentCrestLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenCrests(readJson(LCR_KEY, []), present);
    const nextReviewed = readReviewedCrests(readJson(LCR_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(LCR_KEY, nextHidden);
    writeJson(LCR_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentCrestLanes(rows);
  const lanes = visibleCrestLanes(present, hidden, showHidden);
  const shown = visibleCrests(rows, lane, tone, query, review, reviewed, shape).filter((row) => {
    const token = crestLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  useEffect(() => {
    reviewRef.current = () => {
      if (viewer) return;
      const row = shown[focusAt];
      if (!row) return;
      const next = toggleCrestReview(reviewed, row.id);
      setReviewed(next);
      writeJson(LCR_REVIEW_KEY, next);
    };
  });
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveDawnFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveDawnFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        reviewRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        const order: CrestShape[] = ["all", "link", "wide", "bound", "notch", "named"];
        setShape((value) => order[(order.indexOf(value) + 1) % order.length]);
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);
  const lead = leadingCrest(rows);
  const toneLead = leadingCrestTone(rows);
  const shared = sharedCrestCount(rows);
  const bound = rows.filter((row) => crestBound(row.note)).length;
  const bars = crestLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((row) => row.id);
  const known = rows.filter((row) => crestState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(LCR_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedCrests(next, rows.map((row) => row.id));
    setReviewed(saved);
    writeJson(LCR_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-lcr" aria-label={v4("lcrTitle")} data-crests="1" data-desk="salon" data-traders={queue.data?.users?.length ? "1" : "0"} data-role={role} data-keyed={bound ? "1" : "0"}>
      <header className="c4-lcr-mast">
        <p className="c4-lcr-seal" data-logo="mono">{v4("lcrLogo")}</p>
        <div>
          <p className="c4-lcr-kicker">{v4("lcrSub")}</p>
          <h2 className="c4-title">{v4("lcrTitle")}</h2>
        </div>
        <ol className="c4-lcr-index" aria-label={v4("lcrTitle")}>
          <li data-tone="gold">{v4("lcrChampagne")}</li>
          <li data-tone="ink">{v4("lcrGraphite")}</li>
          <li data-tone="ivory">{v4("lcrIvory")}</li>
        </ol>
      </header>
      <p className="c4-lcr-links">
        <Link href={crmv4Href(base, "dnb")}>{v4("lcrGallery")}</Link>
        <Link href={crmv4Href(base, "clocks")}>{v4("dnbGallery")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("lcrSub")}</Link>
      </p>
      {viewer && <p className="c4-lcr-note">{v4("lcrViewer")}</p>}
      <p className="c4-lcr-rule">{v4("lcrHint")}</p>
      <ul className="c4-lcr-kpis" aria-label={v4("lcrRules")}>
        <li><span>{v4("lcrSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("lcrClear")}</span><strong>{rows.filter((row) => crestState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("lcrLinked")}</span><strong>{laneCrestCount(rows, "linked")}</strong></li>
        <li><span>{v4("lcrNamed")}</span><strong>{laneCrestCount(rows, "named")}</strong></li>
        <li><span>{v4("lcrRich")}</span><strong>{laneCrestCount(rows, "rich")}</strong></li>
        <li><span>{v4("lcrEven")}</span><strong>{laneCrestCount(rows, "even")}</strong></li>
        <li><span>{v4("lcrSpare")}</span><strong>{laneCrestCount(rows, "spare")}</strong></li>
        <li><span>{v4("lcrMute")}</span><strong>{laneCrestCount(rows, "mute")}</strong></li>
        <li><span>{v4("lcrGilt")}</span><strong>{toneCrestCount(rows, "gilt")}</strong></li>
        <li><span>{v4("lcrNotch")}</span><strong>{rows.filter((row) => crestNotch(row.note)).length}</strong></li>
        <li><span>{v4("lcrWide")}</span><strong>{rows.filter((row) => crestWide(row.note)).length}</strong></li>
        <li><span>{v4("lcrJoin")}</span><strong>{rows.filter((row) => crestJoin(row.note)).length}</strong></li>
        <li><span>{v4("lcrShare")}</span><strong>{crestShare(bound, Math.max(1, known))}%</strong></li>
        <li><span>{v4("lcrShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-lcr-bars" aria-label={v4("lcrLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-lcr-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-lcr-meta">{lead ? `${v4("lcrLead")} ${laneLabel(v4, lead)}` : v4("lcrEmpty")} · {toneLead ? `${v4("lcrToneLead")} ${crestToneLabel(v4, toneLead)}` : v4("lcrUnmarked")}</p>
      <div className="c4-lcr-tools">
        <label className="c4-lab"><span>{v4("lcrSearch")}</span><input ref={searchRef} className="c4-field c4-lcr-search" aria-label={v4("lcrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => download("crest-lanes.csv", crestsCsv(rows))}>{v4("lcrCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("crest-rows.csv", crestRowsCsv(rows, reviewed))}>{v4("lcrRowCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={showHidden} onClick={() => setShowHidden((value) => !value)}>{v4("lcrShow")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, ids, true))}>{v4("lcrBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, ids, false))}>{v4("lcrBulkClear")}</button>
      </div>
      <div className="c4-lcr-tools" role="group" aria-label={v4("lcrAll")}>
        <button type="button" className="c4-chip" data-on={lane === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("lcrAll")}</button>
        {lanes.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={lane === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
        {(["gilt", "linen", "sand", "clay", "ivory", "soot", "mist"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tone === item ? "1" : "0"} onClick={() => setTone(tone === item ? "all" : item)}>{crestToneLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("lcrAll") : item === "reviewed" ? v4("lcrReviewed") : v4("lcrUnreviewed")}</button>
        ))}
        {(["all", "link", "wide", "bound", "notch", "named"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("lcrShapeAll") : item === "link" ? v4("lcrShapeLink") : item === "wide" ? v4("lcrShapeWide") : item === "bound" ? v4("lcrShapeBound") : item === "notch" ? v4("lcrShapeNotch") : v4("lcrShapeNamed")}</button>
        ))}
      </div>
      {!shown.length && <p className="c4-lcr-empty">{v4("lcrEmpty")}</p>}
      <ol className="c4-lcr-board">
        {shown.map((row, index) => {
          const current = crestLane(row.note);
          const toneName = crestTone(row.note);
          return (
            <li key={row.id} className="c4-lcr-card" data-on={index === focusAt ? "1" : "0"} data-lane={current || "blank"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-wide={crestWide(row.note) ? "1" : "0"} data-join={crestJoin(row.note) ? "1" : "0"} data-notch={crestNotch(row.note) ? "1" : "0"} data-bound={crestBound(row.note) ? "1" : "0"}>
              <strong>{row.label || v4("lcrClear")}</strong>
              <p className="c4-lcr-meta">{v4("lcrMark")} {crestMark(row.note) || v4("lcrUnmarked")} · {laneLabel(v4, current)} · {crestToneLabel(v4, toneName)} · {v4("lcrStep")} {crestStep(row.note)} · {v4("lcrStatus")} · {v4("lcrDesk")}</p>
              <div className="c4-lcr-tools">
                <button type="button" className="c4-btn" disabled={viewer || !current} onClick={() => storeHidden(toggleCrest(hidden, current))}>{hidden.includes(current) ? v4("lcrShow") : v4("lcrHide")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCrestReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("lcrReviewed") : v4("lcrReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = crestCopy(row.note); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(row.id); }}>{copied === row.id ? v4("lcrCopied") : v4("lcrCopy")}</button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
