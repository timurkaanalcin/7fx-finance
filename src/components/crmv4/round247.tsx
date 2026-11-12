"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  EMC_KEY,
  EMC_REVIEW_KEY,
  NCH_DENSITY_KEY,
  NCH_KEY,
  NCH_VIEW_KEY,
  NICHE_AISLES,
  activeAisle,
  activeLeaf,
  activePace,
  activeWait,
  activeWax,
  addNicheCard,
  addNicheTag,
  addNicheView,
  aisleBand,
  bulkCrestReview,
  bulkNicheArchive,
  bulkNicheBrisk,
  bulkNichePin,
  bulkNicheTag,
  bulkNicheWax,
  busiestKeeper,
  clashAisleCount,
  cordFocusedCard,
  crestBound,
  crestCopy,
  crestHue,
  crestJoin,
  crestLane,
  crestLanes,
  crestLanesCsv,
  crestNotch,
  crestRowsCsv,
  crestShare,
  crestStamp,
  crestState,
  crestStep,
  crestWide,
  cyclePace,
  dropNicheView,
  editNiche,
  editNicheNote,
  fairKeeper,
  holdFocusedCard,
  houseWax,
  hueCrestCount,
  idleCard,
  idleCards,
  laneCrestCount,
  lateCard,
  leadingCrest,
  leadingCrestHue,
  leafLoad,
  lengthenFocusedCard,
  lengthenNicheWait,
  lowerFocusedCard,
  lowerLeaf,
  matchedCards,
  moveNicheFocus,
  neighborCardCount,
  nextCard,
  nicheCopy,
  nicheCounts,
  nicheCsv,
  nicheDensity,
  nicheKeepers,
  nicheShare,
  nicheSort,
  nicheTimeline,
  overdueCard,
  paceFocusedCard,
  pairKeeperCount,
  peakAisle,
  pinFocusedCard,
  presentCrestLanes,
  quietAisle,
  raiseFocusedCard,
  raiseLeaf,
  readHiddenCrests,
  readNicheCards,
  readNicheViews,
  readReviewedCrests,
  reminderCards,
  restingCard,
  rushCard,
  setCardArchive,
  setCardCord,
  setCardHold,
  setCardPin,
  setCardWax,
  sharedCrestCount,
  shortenFocusedCard,
  shortenNicheWait,
  sortNiche,
  suggestWait,
  suggestWax,
  tagFocusedCard,
  toggleCrest,
  toggleCrestReview,
  visibleCrestLanes,
  visibleCrests,
  visibleNiche,
  waitClashCount,
  type CardDensity,
  type CardSort,
  type CardTray,
  type CrestReview,
  type CrestRow,
  type CrestShape,
  type CrestValue,
  type NicheCard,
  type NicheView,
} from "@/lib/crmv4/round247";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const WAXES = ["bees", "resin", "ash"] as const;
const PACES = ["slow", "even", "brisk"] as const;
const WAITS = ["20", "40", "60"] as const;
const LEAVES = ["3", "5", "7", "9"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "nchAuditSave",
  edit: "nchAuditEdit",
  note: "nchAuditNote",
  pace: "nchAuditPace",
  pin: "nchAuditPin",
  unpin: "nchAuditUnpin",
  hold: "nchAuditHold",
  resume: "nchAuditResume",
  archive: "nchAuditArchive",
  open: "nchAuditOpen",
  wax: "nchAuditWax",
  tag: "nchAuditTag",
  leaf: "nchAuditLeaf",
  wait: "nchAuditWait",
  short: "nchAuditShort",
  cord: "nchAuditCord",
};

const AISLE_KEY: Record<string, CrmV4CopyKey> = {
  porch: "nchPorch",
  nave: "nchNave",
  aisle: "nchAisleWord",
  apse: "nchApse",
  crypt: "nchCrypt",
  loft: "nchLoft",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  email?: string | null;
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

function waxLabel(v4: V4, wax: string): string {
  if (wax === "BEES" || wax === "bees") return v4("nchBees");
  if (wax === "RESIN" || wax === "resin") return v4("nchResin");
  if (wax === "ASH" || wax === "ash") return v4("nchAsh");
  return v4("nchBlankWax");
}

function paceLabel(v4: V4, pace: string): string {
  if (pace === "slow") return v4("nchSlow");
  if (pace === "even") return v4("nchEven");
  if (pace === "brisk") return v4("nchBrisk");
  return v4("nchBlankPace");
}

function aisleLabel(v4: V4, aisle: string): string {
  const key = AISLE_KEY[aisle];
  return key ? v4(key) : v4("nchBlank");
}

function bandLabel(v4: V4, band: string): string {
  if (band === "early") return v4("nchEarly");
  if (band === "mid") return v4("nchMid");
  if (band === "late") return v4("nchLate");
  return v4("nchBlank");
}

function laneLabel(v4: V4, lane: string): string {
  if (lane === "plus") return v4("emcPlus");
  if (lane === "digit") return v4("emcDigit");
  if (lane === "dash") return v4("emcDash");
  if (lane === "dot") return v4("emcDot");
  if (lane === "short") return v4("emcShort");
  if (lane === "firm") return v4("emcFirm");
  if (lane === "long") return v4("emcLong");
  if (lane === "plain") return v4("emcPlain");
  return v4("emcUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  if (hue === "gilt") return v4("emcGilt");
  if (hue === "slate") return v4("emcSlate");
  if (hue === "sand") return v4("emcSand");
  if (hue === "clay") return v4("emcClay");
  if (hue === "soot") return v4("emcSoot");
  if (hue === "pearl") return v4("emcPearl");
  if (hue === "mist") return v4("emcMist");
  return v4("emcUnmarked");
}

export function NicheCards({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<NicheCard[]>([]);
  const [views, setViews] = useState<NicheView[]>([]);
  const [density, setDensity] = useState<CardDensity>("airy");
  const [sort, setSort] = useState<CardSort>("aisle");
  const [tray, setTray] = useState<CardTray>("open");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [waxFilter, setWaxFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [aisleFilter, setAisleFilter] = useState("all");
  const [waitFilter, setWaitFilter] = useState("all");
  const [leafFilter, setLeafFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("nave");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [aisle, setAisle] = useState("");
  const [wax, setWax] = useState("");
  const [pace, setPace] = useState("");
  const [waitMin, setWaitMin] = useState("");
  const [leaf, setLeaf] = useState("3");
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
    setCards(readNicheCards(readJson(NCH_KEY, [])));
    setViews(readNicheViews(readJson(NCH_VIEW_KEY, [])));
    setDensity(nicheDensity(readJson(NCH_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortNiche(visibleNiche(cards, tray, query, keeperFilter, waxFilter, paceFilter, aisleFilter, waitFilter, leafFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = nicheCounts(cards, shown, desk);
  const timeline = nicheTimeline(cards);
  const reminders = reminderCards(cards);
  const idling = idleCards(cards);
  const keepers = nicheKeepers(cards);
  const focused = shown[focusAt];
  const ids = shown.map((card) => card.id);
  function store(next: NicheCard[]) {
    const saved = readNicheCards(next);
    setCards(saved);
    writeJson(NCH_KEY, saved);
  }
  function storeViews(next: NicheView[]) {
    const saved = readNicheViews(next);
    setViews(saved);
    writeJson(NCH_VIEW_KEY, saved);
  }
  function storeDensity(next: CardDensity) {
    setDensity(next);
    writeJson(NCH_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: NicheView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper || "all");
    setWaxFilter(view.wax);
    setPaceFilter(view.pace);
    setAisleFilter(view.aisle);
    setWaitFilter(view.wait);
    setLeafFilter(view.leaf);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setAisle("");
        setWax("");
        setPace("");
        setWaitMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveNicheFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveNicheFocus(index, shown.length, -1));
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
        if (!viewer) store(paceFocusedCard(cards, ids, focusAt));
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
        if (!viewer) store(cordFocusedCard(cards, ids, focusAt));
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
  const bars = NICHE_AISLES.map((item) => ({ aisle: item, count: cards.filter((card) => !card.archived && !card.held && card.aisle === item).length }));
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const suggested = suggestWax(cards);
  const suggestedWait = suggestWait(cards, new Date().getUTCHours());
  const fair = fairKeeper(cards, keepers.join(", "));
  return (
    <section className="c4-nch" aria-label={v4("nchTitle")} data-cards="1" data-desk="niche" data-role={role} data-density={density}>
      <header className="c4-nch-mast">
        <p className="c4-nch-seal" data-logo="mono">{v4("nchLogo")}</p>
        <div className="c4-nch-rule" aria-hidden="true"><i /><i /><i /><i /></div>
        <div>
          <p className="c4-nch-kicker">{v4("nchSub")}</p>
          <h2 className="c4-title">{v4("nchTitle")}</h2>
        </div>
        <ol className="c4-nch-index" aria-label={v4("nchTitle")}>
          <li data-tone="gold">{v4("nchChampagne")}</li>
          <li data-tone="ink">{v4("nchGraphite")}</li>
          <li data-tone="ivory">{v4("nchIvory")}</li>
        </ol>
      </header>
      <p className="c4-nch-links">
        <Link href={crmv4Href(base, "emc")}>{v4("emcTitle")}</Link>
        <Link href={crmv4Href(base, "dupes")}>{v4("nchDupes")}</Link>
        <Link href={crmv4Href(base, "sources")}>{v4("nchSources")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("nchCustomers")}</Link>
      </p>
      {viewer && <p className="c4-nch-note">{v4("nchViewer")}</p>}
      <p className="c4-nch-lead">{v4("nchHint")}</p>
      <p className="c4-nch-meta">{v4("nchLocal")} · {v4("nchKeys")} · {v4("nchHoldKey")} · {v4("nchPinKey")} · {v4("nchWaitKey")} · {v4("nchShortKey")} · {v4("nchTagKey")} · {v4("nchBoardKey")} · {v4("nchLeafKey")} · {v4("nchLowerKey")} · {v4("nchPaceKey")} · {v4("nchCordKey")} · {v4("nchEscape")}</p>
      <ul className="c4-nch-kpis" aria-label={v4("nchKpi")}>
        <li><span>{v4("nchOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("nchHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("nchArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("nchPin")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("nchPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("nchQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("nchSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("nchLoad")}</span><strong>{counts.leaf}</strong></li>
        <li><span>{v4("nchHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("nchWait")}</span><strong>{counts.wait}</strong></li>
        <li><span>{v4("nchMatched")}</span><strong>{counts.matched}</strong></li>
        <li><span>{v4("nchCord")}</span><strong>{counts.cord}</strong></li>
        <li><span>{v4("nchIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("nchRush")}</span><strong>{counts.rush}</strong></li>
        <li><span>{v4("nchResting")}</span><strong>{counts.resting}</strong></li>
        <li><span>{v4("nchOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("nchLateShare")}</span><strong>{nicheShare(shown.filter((card) => lateCard(card, desk)).length, Math.max(1, shown.length))}%</strong></li>
        <li><span>{v4("nchShare")}</span><strong>{nicheShare(counts.house, Math.max(1, counts.open))}%</strong></li>
        <li><span>{v4("nchNeighbors")}</span><strong>{neighborCardCount(cards)}</strong></li>
        <li><span>{v4("nchClash")}</span><strong>{clashAisleCount(cards)}</strong></li>
        <li><span>{v4("nchWaitClash")}</span><strong>{waitClashCount(cards)}</strong></li>
      </ul>
      <div className="c4-nch-bars" aria-label={v4("nchChart")}>
        {bars.map((bar) => (
          <div key={bar.aisle} className="c4-nch-bar" data-aisle={bar.aisle}>
            <span>{aisleLabel(v4, bar.aisle)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-nch-meta">{v4("nchSuggest")} {waxLabel(v4, suggested)} · {v4("nchWait")} {suggestedWait} · {fair ? `${v4("nchAssign")} ${fair}` : v4("nchBlankKeeper")} · {busiestKeeper(cards) ? `${v4("nchBusiest")} ${busiestKeeper(cards)}` : v4("nchBusiestNone")}</p>
      <form className="c4-nch-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addNicheCard(cards, { id: `nch-${Date.now()}`, title, note, keeper, aisle, wax, pace, wait: waitMin, leaf, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
        titleRef.current?.focus();
      }}>
        <label className="c4-lab"><span>{v4("nchTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("nchTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("nchNote")}</span><input className="c4-field" aria-label={v4("nchNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("nchKeeper")}</span><input className="c4-field" aria-label={v4("nchKeeper")} value={keeper} onChange={(event) => setKeeper(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("nchAisle")}</span>
          <select className="c4-field" aria-label={v4("nchAisle")} value={aisle} onChange={(event) => setAisle(event.target.value)}>
            <option value="">{v4("nchBlank")}</option>
            {NICHE_AISLES.map((item) => <option key={item} value={item}>{aisleLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("nchWax")}</span>
          <select className="c4-field" aria-label={v4("nchWax")} value={wax} onChange={(event) => setWax(event.target.value)}>
            <option value="">{v4("nchBlankWax")}</option>
            {WAXES.map((item) => <option key={item} value={item}>{waxLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("nchPace")}</span>
          <select className="c4-field" aria-label={v4("nchPace")} value={pace} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("nchBlankPace")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("nchWait")}</span>
          <select className="c4-field" aria-label={v4("nchWait")} value={waitMin} onChange={(event) => setWaitMin(event.target.value)}>
            <option value="">{v4("nchBlankWait")}</option>
            {WAITS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("nchLeaf")}</span>
          <select className="c4-field" aria-label={v4("nchLeaf")} value={leaf} onChange={(event) => setLeaf(event.target.value)}>
            {LEAVES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("nchTag")}</span><input className="c4-field" aria-label={v4("nchTag")} value={tags} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("nchAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => { setWax(suggested === "RESIN" ? "resin" : suggested === "ASH" ? "ash" : "bees"); setWaitMin(String(suggestedWait)); if (fair) setKeeper(fair); }}>{v4("nchSuggest")}</button>
      </form>
      <div className="c4-nch-tools">
        <label className="c4-lab"><span>{v4("nchSearch")}</span><input ref={searchRef} className="c4-field c4-nch-search" aria-label={v4("nchSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("nchDesk")}</span>
          <select className="c4-field" aria-label={v4("nchDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {NICHE_AISLES.map((item) => <option key={item} value={item}>{aisleLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" onClick={() => download("niche-cards.csv", nicheCsv(cards, desk))}>{v4("nchCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={density === "tight"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("nchDensityTight") : v4("nchDensityAiry")}</button>
        <button type="button" className="c4-btn" aria-pressed={sort === "keeper"} onClick={() => setSort(nicheSort(sort === "aisle" ? "keeper" : "aisle"))}>{sort === "aisle" ? v4("nchSortKeeper") : v4("nchSortAisle")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkNichePin(cards, picked))}>{v4("nchBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkNicheArchive(cards, picked))}>{v4("nchBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkNicheBrisk(cards, picked))}>{v4("nchBulkBrisk")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkNicheTag(cards, picked, "b"))}>{v4("nchBulkTag")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkNicheWax(cards, picked, "ash"))}>{v4("nchBulkWax")}</button>
      </div>
      <div className="c4-nch-tools" role="group" aria-label={v4("nchTray")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("nchOpen") : item === "held" ? v4("nchHeld") : v4("nchArchived")}</button>
        ))}
        {(["hall", "index"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={board === item ? "1" : "0"} onClick={() => setBoard(item)}>{item === "hall" ? v4("nchBoardHall") : v4("nchBoardIndex")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} aria-pressed={houseOnly} onClick={() => setHouseOnly((value) => !value)}>{v4("nchHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} aria-pressed={peakOnly} onClick={() => setPeakOnly((value) => !value)}>{v4("nchPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} aria-pressed={quietOnly} onClick={() => setQuietOnly((value) => !value)}>{v4("nchQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={keeperFilter === "all" ? "1" : "0"} onClick={() => setKeeperFilter("all")}>{v4("nchAll")}</button>
        {keepers.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={keeperFilter === item ? "1" : "0"} onClick={() => setKeeperFilter(item)}>{item}</button>
        ))}
        {WAXES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={waxFilter === item ? "1" : "0"} onClick={() => setWaxFilter(activeWax(waxFilter) === item ? "all" : item)}>{waxLabel(v4, item)}</button>
        ))}
        {PACES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={paceFilter === item ? "1" : "0"} onClick={() => setPaceFilter(activePace(paceFilter, PACES) === item ? "all" : item)}>{paceLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-chip" data-on={aisleFilter === "all" ? "1" : "0"} onClick={() => setAisleFilter("all")}>{v4("nchAll")}</button>
        <button type="button" className="c4-chip" data-on={aisleFilter === "peak" ? "1" : "0"} onClick={() => setAisleFilter("peak")}>{v4("nchPeak")}</button>
        <button type="button" className="c4-chip" data-on={aisleFilter === "quiet" ? "1" : "0"} onClick={() => setAisleFilter("quiet")}>{v4("nchQuiet")}</button>
        {NICHE_AISLES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={aisleFilter === item ? "1" : "0"} onClick={() => setAisleFilter(activeAisle(aisleFilter) === item ? "all" : item)}>{aisleLabel(v4, item)}</button>
        ))}
        {WAITS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={waitFilter === item ? "1" : "0"} onClick={() => setWaitFilter(activeWait(waitFilter) === item ? "all" : item)}>{item}</button>
        ))}
        {LEAVES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={leafFilter === item ? "1" : "0"} onClick={() => setLeafFilter(activeLeaf(leafFilter) === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <form className="c4-nch-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addNicheView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, keeper: keeperFilter, wax: waxFilter, pace: paceFilter, aisle: aisleFilter, wait: waitFilter, leaf: leafFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("nchViewName")}</span><input className="c4-field" aria-label={v4("nchViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("nchSaveView")}</button>
      </form>
      <ul className="c4-nch-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("nchApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropNicheView(views, view.id))}>{v4("nchDropView")}</button>
          </li>
        ))}
      </ul>
      {board === "hall" ? (
        <ol className="c4-nch-board">
          {!shown.length && <li className="c4-nch-empty"><span className="c4-nch-rule" aria-hidden="true"><i /><i /><i /><i /></span>{v4("nchEmpty")}</li>}
          {shown.map((card, index) => {
            const gap = aisleGapSafe(card, desk);
            return (
              <li key={card.id} className="c4-nch-card" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-cord={card.cord ? "1" : "0"} data-wax={card.wax || "blank"} data-late={lateCard(card, desk) ? "1" : "0"} data-idle={idleCard(card) ? "1" : "0"} data-rush={rushCard(card) ? "1" : "0"} data-resting={restingCard(card) ? "1" : "0"} data-overdue={overdueCard(card) ? "1" : "0"}>
                <p className="c4-nch-dial" aria-hidden="true">{card.leaf}</p>
                <label className="c4-lab"><span>{v4("nchSelect")}</span><input type="checkbox" aria-label={v4("nchSelect")} checked={picked.includes(card.id)} onChange={() => togglePick(card.id)} /></label>
                <input className="c4-field" aria-label={v4("nchEdit")} value={card.title} disabled={viewer} onChange={(event) => { if (!viewer) store(editNiche(cards, card.id, event.target.value)); }} />
                <input className="c4-field" aria-label={v4("nchEditNote")} value={card.note} disabled={viewer} onChange={(event) => { if (!viewer) store(editNicheNote(cards, card.id, event.target.value)); }} />
                <p className="c4-nch-meta">{card.keeper || v4("nchBlankKeeper")} · {aisleLabel(v4, card.aisle)} · {waxLabel(v4, card.wax)} · {paceLabel(v4, card.pace)} · {card.wait ?? v4("nchBlankWait")} · {v4("nchLeaf")} {card.leaf} · {card.tags.join(" ") || v4("nchBlank")} · {bandLabel(v4, aisleBand(card.aisle))}{peakAisle(card.aisle) ? ` · ${v4("nchPeak")}` : ""}{quietAisle(card.aisle) ? ` · ${v4("nchQuiet")}` : ""}{houseWax(card.wax) ? ` · ${v4("nchHouse")}` : ""}{idleCard(card) ? ` · ${v4("nchIdle")}` : ""}{rushCard(card) ? ` · ${v4("nchRush")}` : ""}{restingCard(card) ? ` · ${v4("nchResting")}` : ""}{overdueCard(card) ? ` · ${v4("nchOverdue")}` : ""}</p>
                <p className="c4-nch-meta">{gap === null ? v4("nchBlank") : gap > 0 ? `${v4("nchPast")} ${gap}` : gap < 0 ? `${v4("nchAhead")} ${Math.abs(gap)}` : v4("nchDue")} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("nchBlank")} · {nextCard(cards, card.id) ? `${v4("nchNext")} ${nextCard(cards, card.id)?.title}` : v4("nchNextNone")}</p>
                <div className="c4-nch-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(cards, card.id))}>{v4("nchPace")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("nchUnpin") : v4("nchPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.archived} onClick={() => store(setCardHold(cards, card.id, !card.held))}>{card.held ? v4("nchResume") : v4("nchHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardArchive(cards, card.id, !card.archived))}>{card.archived ? v4("nchReopen") : v4("nchArchive")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardCord(cards, card.id, !card.cord))}>{card.cord ? v4("nchUncord") : v4("nchCord")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenNicheWait(cards, card.id))}>{v4("nchWait")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenNicheWait(cards, card.id))}>{v4("nchShorten")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseLeaf(cards, card.id))}>{v4("nchRaised")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerLeaf(cards, card.id))}>{v4("nchLowered")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardWax(cards, card.id, card.wax === "ASH" ? "bees" : card.wax === "RESIN" ? "ash" : "resin"))}>{v4("nchWax")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addNicheTag(cards, card.id, "c"))}>{v4("nchTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard.writeText(nicheCopy(card)).catch(() => undefined); setCopied(card.id); }}>{copied === card.id ? v4("nchCopied") : v4("nchCopy")}</button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className="c4-nch-timeline">
          {!timeline.length && <li className="c4-nch-empty">{v4("nchEmpty")}</li>}
          {timeline.map((lane) => <li key={lane.leaf}><span>{lane.leaf}</span><strong>{lane.titles.join(" · ")}</strong></li>)}
        </ol>
      )}
      <aside className="c4-nch-side" aria-label={v4("nchReminders")}>
        <h3 className="c4-title">{v4("nchReminders")}</h3>
        {!reminders.length && <p>{v4("nchEmpty")}</p>}
        <ul>{reminders.map((card) => <li key={card.id}>{card.title} · {lateCard(card, desk) ? v4("nchLate") : v4("nchSame")}</li>)}</ul>
        <h3 className="c4-title">{v4("nchIdle")}</h3>
        {!idling.length && <p>{v4("nchIdleEmpty")}</p>}
        <ul>{idling.map((card) => <li key={card.id}>{card.title}</li>)}</ul>
        {focused && <p>{v4("nchFocus")} {focused.title} · {nicheShare(counts.house, Math.max(1, counts.open))}%</p>}
        <p>{clashAisleCount(cards) ? v4("nchClash") : v4("nchClashNone")} · {pairKeeperCount(cards) ? v4("nchPair") : v4("nchPairNone")} · {leafLoad(cards)} · {matchedCards(cards, desk).length}</p>
      </aside>
    </section>
  );
}

function aisleGapSafe(card: NicheCard, desk: string): number | null {
  return lateCard(card, desk) || card.aisle ? gapOf(card.aisle, desk) : null;
}

function gapOf(aisle: string, desk: string): number | null {
  const from = NICHE_AISLES.indexOf(aisle as (typeof NICHE_AISLES)[number]);
  const to = NICHE_AISLES.indexOf(desk as (typeof NICHE_AISLES)[number]);
  if (from < 0 || to < 0) return null;
  return to - from;
}

function markNote(row: TraderRow): CrestValue {
  return { email: textField(row.email), address: textField(row.email) };
}

export function EmailCrests({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
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
    const present = presentCrestLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenCrests(readJson(EMC_KEY, []), present);
    const nextReviewed = readReviewedCrests(readJson(EMC_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(EMC_KEY, nextHidden);
    writeJson(EMC_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentCrestLanes(rows);
  const lanes = visibleCrestLanes(present, hidden, showHidden);
  const shown = visibleCrests(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
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
      writeJson(EMC_REVIEW_KEY, next);
    };
  });
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveNicheFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveNicheFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        reviewRef.current();
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        setShowHidden((value) => !value);
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        const order: CrestShape[] = ["all", "plus", "wide", "bound", "notch", "digit"];
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
  const hueLead = leadingCrestHue(rows);
  const shared = sharedCrestCount(rows);
  const bound = rows.filter((row) => crestBound(row.note)).length;
  const bars = crestLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((row) => row.id);
  const known = rows.filter((row) => crestState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(EMC_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedCrests(next, rows.map((row) => row.id));
    setReviewed(saved);
    writeJson(EMC_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-emc" aria-label={v4("emcTitle")} data-crests="1" data-desk="crest" data-traders={queue.data?.users?.length ? "1" : "0"} data-role={role} data-keyed={bound ? "1" : "0"}>
      <header className="c4-emc-mast">
        <p className="c4-emc-seal" data-logo="mono">{v4("emcLogo")}</p>
        <div>
          <p className="c4-emc-kicker">{v4("emcSub")}</p>
          <h2 className="c4-title">{v4("emcTitle")}</h2>
        </div>
        <ol className="c4-emc-index" aria-label={v4("emcTitle")}>
          <li data-tone="gold">{v4("emcChampagne")}</li>
          <li data-tone="ink">{v4("emcGraphite")}</li>
          <li data-tone="ivory">{v4("emcIvory")}</li>
        </ol>
      </header>
      <p className="c4-emc-links">
        <Link href={crmv4Href(base, "nch")}>{v4("emcGallery")}</Link>
        <Link href={crmv4Href(base, "dupes")}>{v4("nchDupes")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("nchCustomers")}</Link>
      </p>
      {viewer && <p className="c4-emc-note">{v4("emcViewer")}</p>}
      <p className="c4-emc-lead">{v4("emcHint")}</p>
      <ul className="c4-emc-kpis" aria-label={v4("emcRules")}>
        <li><span>{v4("emcSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("emcClear")}</span><strong>{rows.filter((row) => crestState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("emcPlus")}</span><strong>{laneCrestCount(rows, "plus")}</strong></li>
        <li><span>{v4("emcDigit")}</span><strong>{laneCrestCount(rows, "digit")}</strong></li>
        <li><span>{v4("emcDash")}</span><strong>{laneCrestCount(rows, "dash")}</strong></li>
        <li><span>{v4("emcDot")}</span><strong>{laneCrestCount(rows, "dot")}</strong></li>
        <li><span>{v4("emcShort")}</span><strong>{laneCrestCount(rows, "short")}</strong></li>
        <li><span>{v4("emcFirm")}</span><strong>{laneCrestCount(rows, "firm")}</strong></li>
        <li><span>{v4("emcLong")}</span><strong>{laneCrestCount(rows, "long")}</strong></li>
        <li><span>{v4("emcPlain")}</span><strong>{laneCrestCount(rows, "plain")}</strong></li>
        <li><span>{v4("emcGilt")}</span><strong>{hueCrestCount(rows, "gilt")}</strong></li>
        <li><span>{v4("emcNotch")}</span><strong>{rows.filter((row) => crestNotch(row.note)).length}</strong></li>
        <li><span>{v4("emcWide")}</span><strong>{rows.filter((row) => crestWide(row.note)).length}</strong></li>
        <li><span>{v4("emcJoin")}</span><strong>{rows.filter((row) => crestJoin(row.note)).length}</strong></li>
        <li><span>{v4("emcShare")}</span><strong>{crestShare(bound, Math.max(1, known))}%</strong></li>
        <li><span>{v4("emcShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-emc-bars" aria-label={v4("emcLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-emc-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-emc-meta">{lead ? `${v4("emcLead")} ${laneLabel(v4, lead)}` : v4("emcEmpty")} · {hueLead ? `${v4("emcToneLead")} ${hueLabel(v4, hueLead)}` : v4("emcUnmarked")}</p>
      <div className="c4-emc-tools">
        <label className="c4-lab"><span>{v4("emcSearch")}</span><input ref={searchRef} className="c4-field c4-emc-search" aria-label={v4("emcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => download("email-crests.csv", crestLanesCsv(rows))}>{v4("emcCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("email-crest-rows.csv", crestRowsCsv(rows, reviewed))}>{v4("emcRowCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={showHidden} onClick={() => setShowHidden((value) => !value)}>{v4("emcShow")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, ids, true))}>{v4("emcBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, ids, false))}>{v4("emcBulkClear")}</button>
      </div>
      <div className="c4-emc-tools" role="group" aria-label={v4("emcAll")}>
        <button type="button" className="c4-chip" data-on={lane === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("emcAll")}</button>
        {lanes.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={lane === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
        {(["gilt", "slate", "sand", "clay", "soot", "pearl", "mist"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(hue === item ? "all" : item)}>{hueLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("emcAll") : item === "reviewed" ? v4("emcReviewed") : v4("emcUnreviewed")}</button>
        ))}
        {(["all", "plus", "wide", "bound", "notch", "digit"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("emcShapeAll") : item === "plus" ? v4("emcShapePlus") : item === "wide" ? v4("emcShapeWide") : item === "bound" ? v4("emcShapeBound") : item === "notch" ? v4("emcShapeNotch") : v4("emcShapeDigit")}</button>
        ))}
      </div>
      {!shown.length && <p className="c4-emc-empty">{v4("emcEmpty")}</p>}
      <ol className="c4-emc-board">
        {shown.map((row, index) => {
          const current = crestLane(row.note);
          const hueName = crestHue(row.note);
          return (
            <li key={row.id} className="c4-emc-card" data-on={index === focusAt ? "1" : "0"} data-lane={current || "blank"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-wide={crestWide(row.note) ? "1" : "0"} data-join={crestJoin(row.note) ? "1" : "0"} data-notch={crestNotch(row.note) ? "1" : "0"} data-bound={crestBound(row.note) ? "1" : "0"}>
              <strong>{row.label || v4("emcClear")}</strong>
              <p className="c4-emc-meta">{v4("emcMarkWord")} {crestStamp(row.note) || v4("emcUnmarked")} · {laneLabel(v4, current)} · {hueLabel(v4, hueName)} · {v4("emcStep")} {crestStep(row.note)} · {v4("emcEmail")}</p>
              <div className="c4-emc-tools">
                <button type="button" className="c4-btn" disabled={viewer || !current} onClick={() => storeHidden(toggleCrest(hidden, current))}>{hidden.includes(current) ? v4("emcShow") : v4("emcHide")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCrestReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("emcReviewed") : v4("emcReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = crestCopy(row.note); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(row.id); }}>{copied === row.id ? v4("emcCopied") : v4("emcCopy")}</button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
