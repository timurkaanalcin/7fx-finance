"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BNC_DENSITY_KEY,
  BNC_KEY,
  BNC_VIEW_KEY,
  LUF_KEY,
  LUF_REVIEW_KEY,
  SAIL_POINTS,
  activeBearing,
  activeDeviation,
  activeDrift,
  activePoint,
  activeReef,
  addBinnacleCard,
  addBinnacleTag,
  addBinnacleView,
  bearingLoad,
  binnacleCopy,
  binnacleCounts,
  binnacleCsv,
  binnacleDensity,
  binnacleHelmsmen,
  binnacleShare,
  binnacleSort,
  binnacleTimeline,
  bulkBinnacleArchive,
  bulkBinnacleDev,
  bulkBinnaclePin,
  bulkBinnacleReef,
  bulkBinnacleTag,
  bulkLuffReview,
  busiestHelmsman,
  clashPointCount,
  cycleReef,
  driftClashCount,
  dropBinnacleView,
  editBinnacle,
  editBinnacleNote,
  fairHelmsman,
  holdFocusedCard,
  houseDeviation,
  hueLuffCount,
  idleCard,
  idleCards,
  lampFocusedCard,
  laneLuffCount,
  lateCard,
  leadingLuff,
  leadingLuffHue,
  leePoint,
  lengthenDrift,
  lengthenFocusedCard,
  lowerBearing,
  lowerFocusedCard,
  luffBound,
  luffCopy,
  luffHue,
  luffJoin,
  luffLane,
  luffLanes,
  luffLanesCsv,
  luffNotch,
  luffRowsCsv,
  luffShare,
  luffStamp,
  luffState,
  luffStep,
  luffWide,
  matchedCards,
  moveBinnacleFocus,
  neighborCardCount,
  nextCard,
  overdueCard,
  pairHelmsmanCount,
  pinFocusedCard,
  pointBand,
  pointGap,
  presentLuffLanes,
  raiseBearing,
  raiseFocusedCard,
  readBinnacleCards,
  readBinnacleViews,
  readHiddenLuffs,
  readReviewedLuffs,
  reefFocusedCard,
  reminderCards,
  restingCard,
  rushCard,
  setCardArchive,
  setCardDeviation,
  setCardHold,
  setCardLamp,
  setCardPin,
  sharedLuffCount,
  shortenDrift,
  shortenFocusedCard,
  sortBinnacle,
  suggestDeviation,
  suggestDrift,
  tagFocusedCard,
  toggleLuff,
  toggleLuffReview,
  visibleBinnacle,
  visibleLuffLanes,
  visibleLuffs,
  weatherPoint,
  type BinnacleCard,
  type BinnacleView,
  type CardDensity,
  type CardSort,
  type CardTray,
  type LuffReview,
  type LuffRow,
  type LuffShape,
  type LuffValue,
} from "@/lib/crmv4/round244";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const DEVIATIONS = ["port", "even", "starboard"] as const;
const REEFS = ["bare", "one", "two"] as const;
const DRIFTS = ["5", "15", "30"] as const;
const BEARINGS = ["0", "90", "180", "270"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "bncAuditSave",
  edit: "bncAuditEdit",
  note: "bncAuditNote",
  reef: "bncAuditReef",
  pin: "bncAuditPin",
  unpin: "bncAuditUnpin",
  hold: "bncAuditHold",
  resume: "bncAuditResume",
  archive: "bncAuditArchive",
  open: "bncAuditOpen",
  dev: "bncAuditDev",
  tag: "bncAuditTag",
  bear: "bncAuditBear",
  drift: "bncAuditDrift",
  short: "bncAuditShort",
  lamp: "bncAuditLamp",
};

const POINT_KEY: Record<string, CrmV4CopyKey> = {
  close: "bncClose",
  reach: "bncReach",
  broad: "bncBroad",
  run: "bncRun",
  beat: "bncBeat",
  drift: "bncLee",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  language?: string | null;
  country?: string | null;
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

function deviationLabel(v4: V4, deviation: string): string {
  if (deviation === "PORT" || deviation === "port") return v4("bncPort");
  if (deviation === "EVEN" || deviation === "even") return v4("bncEven");
  if (deviation === "STAR" || deviation === "starboard") return v4("bncStar");
  return v4("bncBlankDev");
}

function reefLabel(v4: V4, reef: string): string {
  if (reef === "bare") return v4("bncBare");
  if (reef === "one") return v4("bncOne");
  if (reef === "two") return v4("bncTwo");
  return v4("bncBlankReef");
}

function pointLabel(v4: V4, point: string): string {
  const key = POINT_KEY[point];
  return key ? v4(key) : v4("bncBlank");
}

function bandLabel(v4: V4, band: string): string {
  if (band === "windward") return v4("bncWindward");
  if (band === "beam") return v4("bncBeam");
  if (band === "leeward") return v4("bncLeeward");
  return v4("bncBlank");
}

function laneLabel(v4: V4, lane: string): string {
  if (lane === "dash") return v4("lufDash");
  if (lane === "score") return v4("lufScore");
  if (lane === "mark") return v4("lufMark");
  if (lane === "pair") return v4("lufPair");
  if (lane === "trio") return v4("lufTrio");
  if (lane === "long") return v4("lufLong");
  if (lane === "hush") return v4("lufHush");
  return v4("lufUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  if (hue === "pearl") return v4("lufPearl");
  if (hue === "slate") return v4("lufSlate");
  if (hue === "sand") return v4("lufSand");
  if (hue === "clay") return v4("lufClay");
  if (hue === "soot") return v4("lufSoot");
  if (hue === "mist") return v4("lufMist");
  return v4("lufUnmarked");
}

export function BinnacleCards({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<BinnacleCard[]>([]);
  const [views, setViews] = useState<BinnacleView[]>([]);
  const [density, setDensity] = useState<CardDensity>("airy");
  const [sort, setSort] = useState<CardSort>("point");
  const [tray, setTray] = useState<CardTray>("open");
  const [query, setQuery] = useState("");
  const [helmsmanFilter, setHelmsmanFilter] = useState("all");
  const [deviationFilter, setDeviationFilter] = useState("all");
  const [reefFilter, setReefFilter] = useState("all");
  const [pointFilter, setPointFilter] = useState("all");
  const [driftFilter, setDriftFilter] = useState("all");
  const [bearingFilter, setBearingFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [weatherOnly, setWeatherOnly] = useState(false);
  const [leeOnly, setLeeOnly] = useState(false);
  const [desk, setDesk] = useState("reach");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [helmsman, setHelmsman] = useState("");
  const [point, setPoint] = useState("");
  const [deviation, setDeviation] = useState("");
  const [reef, setReef] = useState("");
  const [driftMin, setDriftMin] = useState("");
  const [bearing, setBearing] = useState("0");
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
    setCards(readBinnacleCards(readJson(BNC_KEY, [])));
    setViews(readBinnacleViews(readJson(BNC_VIEW_KEY, [])));
    setDensity(binnacleDensity(readJson(BNC_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortBinnacle(visibleBinnacle(cards, tray, query, helmsmanFilter, deviationFilter, reefFilter, pointFilter, driftFilter, bearingFilter, houseOnly, weatherOnly, leeOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = binnacleCounts(cards, shown, desk);
  const timeline = binnacleTimeline(cards);
  const reminders = reminderCards(cards);
  const idling = idleCards(cards);
  const helmsmen = binnacleHelmsmen(cards);
  const focused = shown[focusAt];
  const ids = shown.map((card) => card.id);
  function store(next: BinnacleCard[]) {
    const saved = readBinnacleCards(next);
    setCards(saved);
    writeJson(BNC_KEY, saved);
  }
  function storeViews(next: BinnacleView[]) {
    const saved = readBinnacleViews(next);
    setViews(saved);
    writeJson(BNC_VIEW_KEY, saved);
  }
  function storeDensity(next: CardDensity) {
    setDensity(next);
    writeJson(BNC_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: BinnacleView) {
    setTray(view.tray);
    setQuery(view.query);
    setHelmsmanFilter(view.helmsman || "all");
    setDeviationFilter(view.deviation);
    setReefFilter(view.reef);
    setPointFilter(view.point);
    setDriftFilter(view.drift);
    setBearingFilter(view.bearing);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setHelmsman("");
        setPoint("");
        setDeviation("");
        setReef("");
        setDriftMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveBinnacleFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveBinnacleFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(holdFocusedCard(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinFocusedCard(cards, ids, focusAt));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        if (!viewer) store(reefFocusedCard(cards, ids, focusAt));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        if (!viewer) store(lengthenFocusedCard(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(shortenFocusedCard(cards, ids, focusAt));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        if (!viewer) store(tagFocusedCard(cards, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(lampFocusedCard(cards, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        if (!viewer) store(raiseFocusedCard(cards, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(lowerFocusedCard(cards, ids, focusAt));
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
  const bars = SAIL_POINTS.map((item) => ({ point: item, count: cards.filter((card) => !card.archived && !card.held && card.point === item).length }));
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const suggested = suggestDeviation(cards);
  const suggestedDrift = suggestDrift(cards, new Date().getUTCHours());
  const fair = fairHelmsman(cards, helmsmen.join(", "));
  return (
    <section className="c4-bnc" aria-label={v4("bncTitle")} data-cards="1" data-desk="salon" data-role={role} data-density={density}>
      <header className="c4-bnc-mast">
        <p className="c4-bnc-seal" data-logo="mono">{v4("bncLogo")}</p>
        <div className="c4-bnc-rose" aria-hidden="true"><i /><i /><i /><i /></div>
        <div>
          <p className="c4-bnc-kicker">{v4("bncSub")}</p>
          <h2 className="c4-title">{v4("bncTitle")}</h2>
        </div>
        <ol className="c4-bnc-index" aria-label={v4("bncTitle")}>
          <li data-tone="gold">{v4("bncChampagne")}</li>
          <li data-tone="ink">{v4("bncGraphite")}</li>
          <li data-tone="ivory">{v4("bncIvory")}</li>
        </ol>
      </header>
      <p className="c4-bnc-links">
        <Link href={crmv4Href(base, "luf")}>{v4("lufTitle")}</Link>
        <Link href={crmv4Href(base, "hgl")}>{v4("bncGallery")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("bncCustomers")}</Link>
      </p>
      {viewer && <p className="c4-bnc-note">{v4("bncViewer")}</p>}
      <p className="c4-bnc-rule">{v4("bncHint")}</p>
      <p className="c4-bnc-meta">{v4("bncLocal")} · {v4("bncKeys")} · {v4("bncHoldKey")} · {v4("bncPinKey")} · {v4("bncDriftKey")} · {v4("bncShortKey")} · {v4("bncTagKey")} · {v4("bncBoardKey")} · {v4("bncBearKey")} · {v4("bncLowerKey")} · {v4("bncReefKey")} · {v4("bncLampKey")} · {v4("bncEscape")}</p>
      <ul className="c4-bnc-kpis" aria-label={v4("bncKpi")}>
        <li><span>{v4("bncOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("bncHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("bncArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("bncPin")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("bncWeather")}</span><strong>{counts.weather}</strong></li>
        <li><span>{v4("bncQuiet")}</span><strong>{counts.lee}</strong></li>
        <li><span>{v4("bncSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("bncLoad")}</span><strong>{counts.bearing}</strong></li>
        <li><span>{v4("bncHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("bncDrift")}</span><strong>{counts.drift}</strong></li>
        <li><span>{v4("bncMatched")}</span><strong>{counts.matched}</strong></li>
        <li><span>{v4("bncLamp")}</span><strong>{counts.lamp}</strong></li>
        <li><span>{v4("bncIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("bncRush")}</span><strong>{counts.rush}</strong></li>
        <li><span>{v4("bncResting")}</span><strong>{counts.resting}</strong></li>
        <li><span>{v4("bncOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("bncLateShare")}</span><strong>{binnacleShare(shown.filter((card) => lateCard(card, desk)).length, Math.max(1, shown.length))}%</strong></li>
        <li><span>{v4("bncShare")}</span><strong>{binnacleShare(counts.house, Math.max(1, counts.open))}%</strong></li>
        <li><span>{v4("bncNeighbors")}</span><strong>{neighborCardCount(cards)}</strong></li>
        <li><span>{v4("bncClash")}</span><strong>{clashPointCount(cards)}</strong></li>
        <li><span>{v4("bncDriftClash")}</span><strong>{driftClashCount(cards)}</strong></li>
      </ul>
      <div className="c4-bnc-bars" aria-label={v4("bncTimeline")}>
        {bars.map((bar) => (
          <div key={bar.point} className="c4-bnc-bar" data-point={bar.point}>
            <span>{pointLabel(v4, bar.point)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-bnc-meta">{v4("bncSuggest")} {deviationLabel(v4, suggested)} · {v4("bncDrift")} {suggestedDrift} · {fair ? `${v4("bncAssign")} ${fair}` : v4("bncBlankHelmsman")} · {busiestHelmsman(cards) ? `${v4("bncBusiest")} ${busiestHelmsman(cards)}` : v4("bncBusiestNone")}</p>
      <form className="c4-bnc-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addBinnacleCard(cards, { id: `bnc-${Date.now()}`, title, note, helmsman, point, deviation, reef, drift: driftMin, bearing, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
        titleRef.current?.focus();
      }}>
        <label className="c4-lab"><span>{v4("bncTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("bncTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("bncNote")}</span><input className="c4-field" aria-label={v4("bncNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("bncHelmsman")}</span><input className="c4-field" aria-label={v4("bncHelmsman")} value={helmsman} onChange={(event) => setHelmsman(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("bncPoint")}</span>
          <select className="c4-field" aria-label={v4("bncPoint")} value={point} onChange={(event) => setPoint(event.target.value)}>
            <option value="">{v4("bncBlank")}</option>
            {SAIL_POINTS.map((item) => <option key={item} value={item}>{pointLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bncDeviation")}</span>
          <select className="c4-field" aria-label={v4("bncDeviation")} value={deviation} onChange={(event) => setDeviation(event.target.value)}>
            <option value="">{v4("bncBlankDev")}</option>
            {DEVIATIONS.map((item) => <option key={item} value={item}>{deviationLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bncReef")}</span>
          <select className="c4-field" aria-label={v4("bncReef")} value={reef} onChange={(event) => setReef(event.target.value)}>
            <option value="">{v4("bncBlankReef")}</option>
            {REEFS.map((item) => <option key={item} value={item}>{reefLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bncDrift")}</span>
          <select className="c4-field" aria-label={v4("bncDrift")} value={driftMin} onChange={(event) => setDriftMin(event.target.value)}>
            <option value="">{v4("bncBlankDrift")}</option>
            {DRIFTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bncBearing")}</span>
          <select className="c4-field" aria-label={v4("bncBearing")} value={bearing} onChange={(event) => setBearing(event.target.value)}>
            {BEARINGS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bncTag")}</span><input className="c4-field" aria-label={v4("bncTag")} value={tags} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("bncAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => { setDeviation(suggested === "PORT" ? "port" : suggested === "STAR" ? "starboard" : "even"); setDriftMin(String(suggestedDrift)); if (fair) setHelmsman(fair); }}>{v4("bncSuggest")}</button>
      </form>
      <div className="c4-bnc-tools">
        <label className="c4-lab"><span>{v4("bncSearch")}</span><input ref={searchRef} className="c4-field c4-bnc-search" aria-label={v4("bncSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("bncDesk")}</span>
          <select className="c4-field" aria-label={v4("bncDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {SAIL_POINTS.map((item) => <option key={item} value={item}>{pointLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" onClick={() => download("binnacle-cards.csv", binnacleCsv(cards, desk))}>{v4("bncCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={density === "tight"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("bncDensityTight") : v4("bncDensityAiry")}</button>
        <button type="button" className="c4-btn" aria-pressed={sort === "helmsman"} onClick={() => setSort(binnacleSort(sort === "point" ? "helmsman" : "point"))}>{sort === "point" ? v4("bncSortHelmsman") : v4("bncSortPoint")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBinnaclePin(cards, picked))}>{v4("bncBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBinnacleArchive(cards, picked))}>{v4("bncBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBinnacleReef(cards, picked))}>{v4("bncBulkReef")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBinnacleTag(cards, picked, "b"))}>{v4("bncBulkTag")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBinnacleDev(cards, picked, "starboard"))}>{v4("bncBulkDev")}</button>
      </div>
      <div className="c4-bnc-tools" role="group" aria-label={v4("bncTray")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("bncOpen") : item === "held" ? v4("bncHeld") : v4("bncArchived")}</button>
        ))}
        {(["hall", "index"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={board === item ? "1" : "0"} onClick={() => setBoard(item)}>{item === "hall" ? v4("bncBoardHall") : v4("bncBoardIndex")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} aria-pressed={houseOnly} onClick={() => setHouseOnly((value) => !value)}>{v4("bncHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={weatherOnly ? "1" : "0"} aria-pressed={weatherOnly} onClick={() => setWeatherOnly((value) => !value)}>{v4("bncWeatherOnly")}</button>
        <button type="button" className="c4-chip" data-on={leeOnly ? "1" : "0"} aria-pressed={leeOnly} onClick={() => setLeeOnly((value) => !value)}>{v4("bncLeeOnly")}</button>
        <button type="button" className="c4-chip" data-on={helmsmanFilter === "all" ? "1" : "0"} onClick={() => setHelmsmanFilter("all")}>{v4("bncAll")}</button>
        {helmsmen.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={helmsmanFilter === item ? "1" : "0"} onClick={() => setHelmsmanFilter(item)}>{item}</button>
        ))}
        {DEVIATIONS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={deviationFilter === item ? "1" : "0"} onClick={() => setDeviationFilter(activeDeviation(deviationFilter) === item ? "all" : item)}>{deviationLabel(v4, item)}</button>
        ))}
        {REEFS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={reefFilter === item ? "1" : "0"} onClick={() => setReefFilter(activeReef(reefFilter, REEFS) === item ? "all" : item)}>{reefLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pointFilter === "all" ? "1" : "0"} onClick={() => setPointFilter("all")}>{v4("bncAll")}</button>
        <button type="button" className="c4-chip" data-on={pointFilter === "weather" ? "1" : "0"} onClick={() => setPointFilter("weather")}>{v4("bncWeather")}</button>
        <button type="button" className="c4-chip" data-on={pointFilter === "lee" ? "1" : "0"} onClick={() => setPointFilter("lee")}>{v4("bncQuiet")}</button>
        {SAIL_POINTS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={pointFilter === item ? "1" : "0"} onClick={() => setPointFilter(activePoint(pointFilter) === item ? "all" : item)}>{pointLabel(v4, item)}</button>
        ))}
        {DRIFTS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={driftFilter === item ? "1" : "0"} onClick={() => setDriftFilter(activeDrift(driftFilter) === item ? "all" : item)}>{item}</button>
        ))}
        {BEARINGS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={bearingFilter === item ? "1" : "0"} onClick={() => setBearingFilter(activeBearing(bearingFilter) === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <form className="c4-bnc-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addBinnacleView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, helmsman: helmsmanFilter, deviation: deviationFilter, reef: reefFilter, point: pointFilter, drift: driftFilter, bearing: bearingFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("bncViewName")}</span><input className="c4-field" aria-label={v4("bncViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("bncSaveView")}</button>
      </form>
      <ul className="c4-bnc-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("bncApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropBinnacleView(views, view.id))}>{v4("bncDropView")}</button>
          </li>
        ))}
      </ul>
      {board === "hall" ? (
        <ol className="c4-bnc-board">
          {!shown.length && <li className="c4-bnc-empty"><span className="c4-bnc-rose" aria-hidden="true"><i /><i /><i /><i /></span>{v4("bncEmpty")}</li>}
          {shown.map((card, index) => {
            const gap = pointGap(card.point, desk);
            return (
              <li key={card.id} className="c4-bnc-card" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-lamp={card.lamp ? "1" : "0"} data-deviation={card.deviation || "blank"} data-late={lateCard(card, desk) ? "1" : "0"} data-idle={idleCard(card) ? "1" : "0"} data-rush={rushCard(card) ? "1" : "0"} data-resting={restingCard(card) ? "1" : "0"} data-overdue={overdueCard(card) ? "1" : "0"}>
                <p className="c4-bnc-dial" aria-hidden="true">{card.bearing}</p>
                <label className="c4-lab"><span>{v4("bncSelect")}</span><input type="checkbox" aria-label={v4("bncSelect")} checked={picked.includes(card.id)} onChange={() => togglePick(card.id)} /></label>
                <input className="c4-field" aria-label={v4("bncEdit")} value={card.title} disabled={viewer} onChange={(event) => { if (!viewer) store(editBinnacle(cards, card.id, event.target.value)); }} />
                <input className="c4-field" aria-label={v4("bncEditNote")} value={card.note} disabled={viewer} onChange={(event) => { if (!viewer) store(editBinnacleNote(cards, card.id, event.target.value)); }} />
                <p className="c4-bnc-meta">{card.helmsman || v4("bncBlankHelmsman")} · {pointLabel(v4, card.point)} · {deviationLabel(v4, card.deviation)} · {reefLabel(v4, card.reef)} · {card.drift ?? v4("bncBlankDrift")} · {v4("bncBearing")} {card.bearing} · {card.tags.join(" ") || v4("bncBlank")} · {bandLabel(v4, pointBand(card.point))}{weatherPoint(card.point) ? ` · ${v4("bncWeather")}` : ""}{leePoint(card.point) ? ` · ${v4("bncQuiet")}` : ""}{houseDeviation(card.deviation) ? ` · ${v4("bncHouse")}` : ""}{idleCard(card) ? ` · ${v4("bncIdle")}` : ""}{rushCard(card) ? ` · ${v4("bncRush")}` : ""}{restingCard(card) ? ` · ${v4("bncResting")}` : ""}{overdueCard(card) ? ` · ${v4("bncOverdue")}` : ""}</p>
                <p className="c4-bnc-meta">{gap === null ? v4("bncBlank") : gap > 0 ? `${v4("bncPast")} ${gap}` : gap < 0 ? `${v4("bncAhead")} ${Math.abs(gap)}` : v4("bncDue")} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("bncBlank")} · {nextCard(cards, card.id) ? `${v4("bncNext")} ${nextCard(cards, card.id)?.title}` : v4("bncNextNone")}</p>
                <div className="c4-bnc-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleReef(cards, card.id))}>{v4("bncReef")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("bncUnpin") : v4("bncPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.archived} onClick={() => store(setCardHold(cards, card.id, !card.held))}>{card.held ? v4("bncResume") : v4("bncHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardArchive(cards, card.id, !card.archived))}>{card.archived ? v4("bncReopen") : v4("bncArchive")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardLamp(cards, card.id, !card.lamp))}>{card.lamp ? v4("bncUnlamp") : v4("bncLamp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenDrift(cards, card.id))}>{v4("bncDrift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenDrift(cards, card.id))}>{v4("bncShorten")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBearing(cards, card.id))}>{v4("bncRaised")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBearing(cards, card.id))}>{v4("bncLowered")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardDeviation(cards, card.id, card.deviation === "STAR" ? "port" : card.deviation === "EVEN" ? "starboard" : "even"))}>{v4("bncDeviation")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addBinnacleTag(cards, card.id, "c"))}>{v4("bncTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard.writeText(binnacleCopy(card)).catch(() => undefined); setCopied(card.id); }}>{copied === card.id ? v4("bncCopied") : v4("bncCopy")}</button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className="c4-bnc-timeline">
          {!timeline.length && <li className="c4-bnc-empty">{v4("bncEmpty")}</li>}
          {timeline.map((lane) => <li key={lane.bearing}><span>{lane.bearing}</span><strong>{lane.titles.join(" · ")}</strong></li>)}
        </ol>
      )}
      <aside className="c4-bnc-side" aria-label={v4("bncReminders")}>
        <h3 className="c4-title">{v4("bncReminders")}</h3>
        {!reminders.length && <p>{v4("bncEmpty")}</p>}
        <ul>{reminders.map((card) => <li key={card.id}>{card.title} · {lateCard(card, desk) ? v4("bncLate") : v4("bncSame")}</li>)}</ul>
        <h3 className="c4-title">{v4("bncIdle")}</h3>
        {!idling.length && <p>{v4("bncIdleEmpty")}</p>}
        <ul>{idling.map((card) => <li key={card.id}>{card.title}</li>)}</ul>
        {focused && <p>{v4("bncFocus")} {focused.title} · {binnacleShare(counts.house, Math.max(1, counts.open))}%</p>}
        <p>{clashPointCount(cards) ? v4("bncClash") : v4("bncClashNone")} · {pairHelmsmanCount(cards) ? v4("bncPair") : v4("bncPairNone")} · {bearingLoad(cards)} · {matchedCards(cards, desk).length}</p>
      </aside>
    </section>
  );
}

function markNote(row: TraderRow): LuffValue {
  return { tongue: textField(row.language), shore: textField(row.country), language: textField(row.language), country: textField(row.country) };
}

export function LuffMarks({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [review, setReview] = useState<LuffReview>("all");
  const [shape, setShape] = useState<LuffShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const rows = useMemo<LuffRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `trader-${row.id}` : `trader-${index}`,
    label: textField(row.name),
    note: markNote(row),
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
    const present = presentLuffLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenLuffs(readJson(LUF_KEY, []), present);
    const nextReviewed = readReviewedLuffs(readJson(LUF_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(LUF_KEY, nextHidden);
    writeJson(LUF_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentLuffLanes(rows);
  const lanes = visibleLuffLanes(present, hidden, showHidden);
  const shown = visibleLuffs(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = luffLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  useEffect(() => {
    reviewRef.current = () => {
      if (viewer) return;
      const row = shown[focusAt];
      if (!row) return;
      const next = toggleLuffReview(reviewed, row.id);
      setReviewed(next);
      writeJson(LUF_REVIEW_KEY, next);
    };
  });
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveBinnacleFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveBinnacleFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        reviewRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        const order: LuffShape[] = ["all", "dash", "wide", "bound", "notch", "score"];
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
  const lead = leadingLuff(rows);
  const hueLead = leadingLuffHue(rows);
  const shared = sharedLuffCount(rows);
  const bound = rows.filter((row) => luffBound(row.note)).length;
  const bars = luffLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((row) => row.id);
  const known = rows.filter((row) => luffState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(LUF_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedLuffs(next, rows.map((row) => row.id));
    setReviewed(saved);
    writeJson(LUF_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-luf" aria-label={v4("lufTitle")} data-marks="1" data-desk="salon" data-traders={queue.data?.users?.length ? "1" : "0"} data-role={role} data-keyed={bound ? "1" : "0"}>
      <header className="c4-luf-mast">
        <p className="c4-luf-seal" data-logo="mono">{v4("lufLogo")}</p>
        <div>
          <p className="c4-luf-kicker">{v4("lufSub")}</p>
          <h2 className="c4-title">{v4("lufTitle")}</h2>
        </div>
        <ol className="c4-luf-index" aria-label={v4("lufTitle")}>
          <li data-tone="gold">{v4("lufChampagne")}</li>
          <li data-tone="ink">{v4("lufGraphite")}</li>
          <li data-tone="ivory">{v4("lufIvory")}</li>
        </ol>
      </header>
      <p className="c4-luf-links">
        <Link href={crmv4Href(base, "bnc")}>{v4("lufGallery")}</Link>
        <Link href={crmv4Href(base, "hgl")}>{v4("bncGallery")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("lufSub")}</Link>
      </p>
      {viewer && <p className="c4-luf-note">{v4("lufViewer")}</p>}
      <p className="c4-luf-rule">{v4("lufHint")}</p>
      <ul className="c4-luf-kpis" aria-label={v4("lufRules")}>
        <li><span>{v4("lufSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("lufClear")}</span><strong>{rows.filter((row) => luffState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("lufDash")}</span><strong>{laneLuffCount(rows, "dash")}</strong></li>
        <li><span>{v4("lufScore")}</span><strong>{laneLuffCount(rows, "score")}</strong></li>
        <li><span>{v4("lufMark")}</span><strong>{laneLuffCount(rows, "mark")}</strong></li>
        <li><span>{v4("lufPair")}</span><strong>{laneLuffCount(rows, "pair")}</strong></li>
        <li><span>{v4("lufTrio")}</span><strong>{laneLuffCount(rows, "trio")}</strong></li>
        <li><span>{v4("lufLong")}</span><strong>{laneLuffCount(rows, "long")}</strong></li>
        <li><span>{v4("lufHush")}</span><strong>{laneLuffCount(rows, "hush")}</strong></li>
        <li><span>{v4("lufPearl")}</span><strong>{hueLuffCount(rows, "pearl")}</strong></li>
        <li><span>{v4("lufNotch")}</span><strong>{rows.filter((row) => luffNotch(row.note)).length}</strong></li>
        <li><span>{v4("lufWide")}</span><strong>{rows.filter((row) => luffWide(row.note)).length}</strong></li>
        <li><span>{v4("lufJoin")}</span><strong>{rows.filter((row) => luffJoin(row.note)).length}</strong></li>
        <li><span>{v4("lufShare")}</span><strong>{luffShare(bound, Math.max(1, known))}%</strong></li>
        <li><span>{v4("lufShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-luf-bars" aria-label={v4("lufLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-luf-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-luf-meta">{lead ? `${v4("lufLead")} ${laneLabel(v4, lead)}` : v4("lufEmpty")} · {hueLead ? `${v4("lufToneLead")} ${hueLabel(v4, hueLead)}` : v4("lufUnmarked")}</p>
      <div className="c4-luf-tools">
        <label className="c4-lab"><span>{v4("lufSearch")}</span><input ref={searchRef} className="c4-field c4-luf-search" aria-label={v4("lufSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => download("luff-lanes.csv", luffLanesCsv(rows))}>{v4("lufCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("luff-rows.csv", luffRowsCsv(rows, reviewed))}>{v4("lufRowCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={showHidden} onClick={() => setShowHidden((value) => !value)}>{v4("lufShow")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkLuffReview(reviewed, ids, true))}>{v4("lufBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkLuffReview(reviewed, ids, false))}>{v4("lufBulkClear")}</button>
      </div>
      <div className="c4-luf-tools" role="group" aria-label={v4("lufAll")}>
        <button type="button" className="c4-chip" data-on={lane === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("lufAll")}</button>
        {lanes.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={lane === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
        {(["pearl", "slate", "sand", "clay", "soot", "mist"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(hue === item ? "all" : item)}>{hueLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("lufAll") : item === "reviewed" ? v4("lufReviewed") : v4("lufUnreviewed")}</button>
        ))}
        {(["all", "dash", "wide", "bound", "notch", "score"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("lufShapeAll") : item === "dash" ? v4("lufShapeDash") : item === "wide" ? v4("lufShapeWide") : item === "bound" ? v4("lufShapeBound") : item === "notch" ? v4("lufShapeNotch") : v4("lufShapeScore")}</button>
        ))}
      </div>
      {!shown.length && <p className="c4-luf-empty">{v4("lufEmpty")}</p>}
      <ol className="c4-luf-board">
        {shown.map((row, index) => {
          const current = luffLane(row.note);
          const hueName = luffHue(row.note);
          return (
            <li key={row.id} className="c4-luf-card" data-on={index === focusAt ? "1" : "0"} data-lane={current || "blank"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-wide={luffWide(row.note) ? "1" : "0"} data-join={luffJoin(row.note) ? "1" : "0"} data-notch={luffNotch(row.note) ? "1" : "0"} data-bound={luffBound(row.note) ? "1" : "0"}>
              <strong>{row.label || v4("lufClear")}</strong>
              <p className="c4-luf-meta">{v4("lufMarkWord")} {luffStamp(row.note) || v4("lufUnmarked")} · {laneLabel(v4, current)} · {hueLabel(v4, hueName)} · {v4("lufStep")} {luffStep(row.note)} · {v4("lufLanguage")} · {v4("lufCountry")}</p>
              <div className="c4-luf-tools">
                <button type="button" className="c4-btn" disabled={viewer || !current} onClick={() => storeHidden(toggleLuff(hidden, current))}>{hidden.includes(current) ? v4("lufShow") : v4("lufHide")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleLuffReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("lufReviewed") : v4("lufReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = luffCopy(row.note); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(row.id); }}>{copied === row.id ? v4("lufCopied") : v4("lufCopy")}</button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
