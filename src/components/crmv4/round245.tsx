"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  MRD_KEY,
  MRD_REVIEW_KEY,
  ORB_DENSITY_KEY,
  ORB_KEY,
  ORB_VIEW_KEY,
  ORCHARD_SEASONS,
  activeBloom,
  activeHeight,
  activeSeason,
  activeSoil,
  activeWater,
  addOrchardBench,
  addOrchardTag,
  addOrchardView,
  bloomFocusedBench,
  bulkMeridianReview,
  bulkOrchardArchive,
  bulkOrchardBloom,
  bulkOrchardPin,
  bulkOrchardSoil,
  bulkOrchardTag,
  busiestGardener,
  clashSeasonCount,
  cycleBloom,
  dropOrchardView,
  editOrchard,
  editOrchardNote,
  fairGardener,
  heightLoad,
  holdFocusedBench,
  houseSoil,
  hueMeridianCount,
  idleBench,
  idleBenches,
  laneMeridianCount,
  lateBench,
  leadingMeridian,
  leadingMeridianHue,
  lengthenFocusedBench,
  lengthenWater,
  lowerFocusedBench,
  lowerHeight,
  matchedBenches,
  meridianBound,
  meridianCopy,
  meridianHue,
  meridianJoin,
  meridianLane,
  meridianLanes,
  meridianLanesCsv,
  meridianNotch,
  meridianRowsCsv,
  meridianShare,
  meridianStamp,
  meridianState,
  meridianStep,
  meridianWide,
  moveOrchardFocus,
  neighborBenchCount,
  nextBench,
  orchardCopy,
  orchardCounts,
  orchardCsv,
  orchardDensity,
  orchardGardeners,
  orchardShare,
  orchardSort,
  orchardTimeline,
  overdueBench,
  pairGardenerCount,
  peakSeason,
  pinFocusedBench,
  presentMeridianLanes,
  quietSeason,
  raiseFocusedBench,
  raiseHeight,
  readHiddenMeridians,
  readOrchardBenches,
  readOrchardViews,
  readReviewedMeridians,
  reminderBenches,
  restingBench,
  rushBench,
  seasonBand,
  seasonGap,
  setBenchArchive,
  sharedMeridianCount,
  setBenchHold,
  setBenchPin,
  setBenchShade,
  setBenchSoil,
  shadeFocusedBench,
  shortenFocusedBench,
  shortenWater,
  sortOrchard,
  suggestSoil,
  suggestWater,
  tagFocusedBench,
  toggleMeridian,
  toggleMeridianReview,
  visibleMeridianLanes,
  visibleMeridians,
  visibleOrchard,
  waterClashCount,
  type BenchDensity,
  type BenchSort,
  type BenchTray,
  type MeridianReview,
  type MeridianRow,
  type MeridianShape,
  type MeridianValue,
  type OrchardBench,
  type OrchardView,
} from "@/lib/crmv4/round245";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const SOILS = ["loam", "clay", "sand"] as const;
const BLOOMS = ["bud", "open", "spent"] as const;
const WATERS = ["10", "20", "40"] as const;
const HEIGHTS = ["1", "2", "3", "4"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "orbAuditSave",
  edit: "orbAuditEdit",
  note: "orbAuditNote",
  bloom: "orbAuditBloom",
  pin: "orbAuditPin",
  unpin: "orbAuditUnpin",
  hold: "orbAuditHold",
  resume: "orbAuditResume",
  archive: "orbAuditArchive",
  open: "orbAuditOpen",
  soil: "orbAuditSoil",
  tag: "orbAuditTag",
  height: "orbAuditHeight",
  water: "orbAuditWater",
  short: "orbAuditShort",
  shade: "orbAuditShade",
};

const SEASON_KEY: Record<string, CrmV4CopyKey> = {
  bud: "orbBud",
  leaf: "orbLeaf",
  fruit: "orbFruit",
  rain: "orbRain",
  frost: "orbFrost",
  bloom: "orbBloomSeason",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  timezone?: string | null;
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

function soilLabel(v4: V4, soil: string): string {
  if (soil === "LOAM" || soil === "loam") return v4("orbLoam");
  if (soil === "CLAY" || soil === "clay") return v4("orbClay");
  if (soil === "SAND" || soil === "sand") return v4("orbSand");
  return v4("orbBlankSoil");
}

function bloomLabel(v4: V4, bloom: string): string {
  if (bloom === "bud") return v4("orbBudBloom");
  if (bloom === "open") return v4("orbOpen");
  if (bloom === "spent") return v4("orbSpent");
  return v4("orbBlankBloom");
}

function seasonLabel(v4: V4, season: string): string {
  const key = SEASON_KEY[season];
  return key ? v4(key) : v4("orbBlank");
}

function bandLabel(v4: V4, band: string): string {
  if (band === "early") return v4("orbEarly");
  if (band === "mid") return v4("orbMid");
  if (band === "late") return v4("orbLate");
  return v4("orbBlank");
}

function laneLabel(v4: V4, lane: string): string {
  if (lane === "deep") return v4("mrdDeep");
  if (lane === "score") return v4("mrdScore");
  if (lane === "dash") return v4("mrdDash");
  if (lane === "mark") return v4("mrdMark");
  if (lane === "hush") return v4("mrdHush");
  if (lane === "trio") return v4("mrdTrio");
  if (lane === "pair") return v4("mrdPair");
  if (lane === "long") return v4("mrdLong");
  return v4("mrdUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  if (hue === "gilt") return v4("mrdGilt");
  if (hue === "slate") return v4("mrdSlate");
  if (hue === "sand") return v4("mrdSand");
  if (hue === "clay") return v4("mrdClay");
  if (hue === "soot") return v4("mrdSoot");
  if (hue === "pearl") return v4("mrdPearl");
  if (hue === "mist") return v4("mrdMist");
  return v4("mrdUnmarked");
}

export function OrchardBenches({ base, v4 }: { base: string; v4: V4 }) {
  const [benches, setBenches] = useState<OrchardBench[]>([]);
  const [views, setViews] = useState<OrchardView[]>([]);
  const [density, setDensity] = useState<BenchDensity>("airy");
  const [sort, setSort] = useState<BenchSort>("season");
  const [tray, setTray] = useState<BenchTray>("open");
  const [query, setQuery] = useState("");
  const [gardenerFilter, setGardenerFilter] = useState("all");
  const [soilFilter, setSoilFilter] = useState("all");
  const [bloomFilter, setBloomFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [waterFilter, setWaterFilter] = useState("all");
  const [heightFilter, setHeightFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("leaf");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [gardener, setGardener] = useState("");
  const [season, setSeason] = useState("");
  const [soil, setSoil] = useState("");
  const [bloom, setBloom] = useState("");
  const [waterMin, setWaterMin] = useState("");
  const [height, setHeight] = useState("1");
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
    setBenches(readOrchardBenches(readJson(ORB_KEY, [])));
    setViews(readOrchardViews(readJson(ORB_VIEW_KEY, [])));
    setDensity(orchardDensity(readJson(ORB_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortOrchard(visibleOrchard(benches, tray, query, gardenerFilter, soilFilter, bloomFilter, seasonFilter, waterFilter, heightFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = orchardCounts(benches, shown, desk);
  const timeline = orchardTimeline(benches);
  const reminders = reminderBenches(benches);
  const idling = idleBenches(benches);
  const gardeners = orchardGardeners(benches);
  const focused = shown[focusAt];
  const ids = shown.map((bench) => bench.id);
  function store(next: OrchardBench[]) {
    const saved = readOrchardBenches(next);
    setBenches(saved);
    writeJson(ORB_KEY, saved);
  }
  function storeViews(next: OrchardView[]) {
    const saved = readOrchardViews(next);
    setViews(saved);
    writeJson(ORB_VIEW_KEY, saved);
  }
  function storeDensity(next: BenchDensity) {
    setDensity(next);
    writeJson(ORB_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: OrchardView) {
    setTray(view.tray);
    setQuery(view.query);
    setGardenerFilter(view.gardener || "all");
    setSoilFilter(view.soil);
    setBloomFilter(view.bloom);
    setSeasonFilter(view.season);
    setWaterFilter(view.water);
    setHeightFilter(view.height);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setGardener("");
        setSeason("");
        setSoil("");
        setBloom("");
        setWaterMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveOrchardFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveOrchardFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(holdFocusedBench(benches, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinFocusedBench(benches, ids, focusAt));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        if (!viewer) store(bloomFocusedBench(benches, ids, focusAt));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        if (!viewer) store(lengthenFocusedBench(benches, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(shortenFocusedBench(benches, ids, focusAt));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        if (!viewer) store(tagFocusedBench(benches, ids, focusAt, "p"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(shadeFocusedBench(benches, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        if (!viewer) store(raiseFocusedBench(benches, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(lowerFocusedBench(benches, ids, focusAt));
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
  const bars = ORCHARD_SEASONS.map((item) => ({ season: item, count: benches.filter((bench) => !bench.archived && !bench.held && bench.season === item).length }));
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const suggested = suggestSoil(benches);
  const suggestedWater = suggestWater(benches, new Date().getUTCHours());
  const fair = fairGardener(benches, gardeners.join(", "));
  return (
    <section className="c4-orb" aria-label={v4("orbTitle")} data-benches="1" data-desk="conservatory" data-role={role} data-density={density}>
      <header className="c4-orb-mast">
        <p className="c4-orb-seal" data-logo="mono">{v4("orbLogo")}</p>
        <div className="c4-orb-trellis" aria-hidden="true"><i /><i /><i /><i /></div>
        <div>
          <p className="c4-orb-kicker">{v4("orbSub")}</p>
          <h2 className="c4-title">{v4("orbTitle")}</h2>
        </div>
        <ol className="c4-orb-index" aria-label={v4("orbTitle")}>
          <li data-tone="gold">{v4("orbChampagne")}</li>
          <li data-tone="ink">{v4("orbGraphite")}</li>
          <li data-tone="ivory">{v4("orbIvory")}</li>
        </ol>
      </header>
      <p className="c4-orb-links">
        <Link href={crmv4Href(base, "mrd")}>{v4("mrdTitle")}</Link>
        <Link href={crmv4Href(base, "sop")}>{v4("orbProcedures")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("orbCustomers")}</Link>
      </p>
      {viewer && <p className="c4-orb-note">{v4("orbViewer")}</p>}
      <p className="c4-orb-rule">{v4("orbHint")}</p>
      <p className="c4-orb-meta">{v4("orbLocal")} · {v4("orbKeys")} · {v4("orbHoldKey")} · {v4("orbPinKey")} · {v4("orbWaterKey")} · {v4("orbShortKey")} · {v4("orbTagKey")} · {v4("orbBoardKey")} · {v4("orbHeightKey")} · {v4("orbLowerKey")} · {v4("orbBloomKey")} · {v4("orbShadeKey")} · {v4("orbEscape")}</p>
      <ul className="c4-orb-kpis" aria-label={v4("orbKpi")}>
        <li><span>{v4("orbOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("orbHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("orbArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("orbPin")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("orbPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("orbQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("orbSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("orbLoad")}</span><strong>{counts.height}</strong></li>
        <li><span>{v4("orbHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("orbWater")}</span><strong>{counts.water}</strong></li>
        <li><span>{v4("orbMatched")}</span><strong>{counts.matched}</strong></li>
        <li><span>{v4("orbShade")}</span><strong>{counts.shade}</strong></li>
        <li><span>{v4("orbIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("orbRush")}</span><strong>{counts.rush}</strong></li>
        <li><span>{v4("orbResting")}</span><strong>{counts.resting}</strong></li>
        <li><span>{v4("orbOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("orbLateShare")}</span><strong>{orchardShare(shown.filter((bench) => lateBench(bench, desk)).length, Math.max(1, shown.length))}%</strong></li>
        <li><span>{v4("orbShare")}</span><strong>{orchardShare(counts.house, Math.max(1, counts.open))}%</strong></li>
        <li><span>{v4("orbNeighbors")}</span><strong>{neighborBenchCount(benches)}</strong></li>
        <li><span>{v4("orbClash")}</span><strong>{clashSeasonCount(benches)}</strong></li>
        <li><span>{v4("orbWaterClash")}</span><strong>{waterClashCount(benches)}</strong></li>
      </ul>
      <div className="c4-orb-bars" aria-label={v4("orbChart")}>
        {bars.map((bar) => (
          <div key={bar.season} className="c4-orb-bar" data-season={bar.season}>
            <span>{seasonLabel(v4, bar.season)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-orb-meta">{v4("orbSuggest")} {soilLabel(v4, suggested)} · {v4("orbWater")} {suggestedWater} · {fair ? `${v4("orbAssign")} ${fair}` : v4("orbBlankGardener")} · {busiestGardener(benches) ? `${v4("orbBusiest")} ${busiestGardener(benches)}` : v4("orbBusiestNone")}</p>
      <form className="c4-orb-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addOrchardBench(benches, { id: `orb-${Date.now()}`, title, note, gardener, season, soil, bloom, water: waterMin, height, tags });
        if (next.length === benches.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
        titleRef.current?.focus();
      }}>
        <label className="c4-lab"><span>{v4("orbTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("orbTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("orbNote")}</span><input className="c4-field" aria-label={v4("orbNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("orbGardener")}</span><input className="c4-field" aria-label={v4("orbGardener")} value={gardener} onChange={(event) => setGardener(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("orbSeason")}</span>
          <select className="c4-field" aria-label={v4("orbSeason")} value={season} onChange={(event) => setSeason(event.target.value)}>
            <option value="">{v4("orbBlank")}</option>
            {ORCHARD_SEASONS.map((item) => <option key={item} value={item}>{seasonLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("orbSoil")}</span>
          <select className="c4-field" aria-label={v4("orbSoil")} value={soil} onChange={(event) => setSoil(event.target.value)}>
            <option value="">{v4("orbBlankSoil")}</option>
            {SOILS.map((item) => <option key={item} value={item}>{soilLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("orbBloom")}</span>
          <select className="c4-field" aria-label={v4("orbBloom")} value={bloom} onChange={(event) => setBloom(event.target.value)}>
            <option value="">{v4("orbBlankBloom")}</option>
            {BLOOMS.map((item) => <option key={item} value={item}>{bloomLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("orbWater")}</span>
          <select className="c4-field" aria-label={v4("orbWater")} value={waterMin} onChange={(event) => setWaterMin(event.target.value)}>
            <option value="">{v4("orbBlankWater")}</option>
            {WATERS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("orbHeight")}</span>
          <select className="c4-field" aria-label={v4("orbHeight")} value={height} onChange={(event) => setHeight(event.target.value)}>
            {HEIGHTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("orbTag")}</span><input className="c4-field" aria-label={v4("orbTag")} value={tags} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("orbAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => { setSoil(suggested === "CLAY" ? "clay" : suggested === "SAND" ? "sand" : "loam"); setWaterMin(String(suggestedWater)); if (fair) setGardener(fair); }}>{v4("orbSuggest")}</button>
      </form>
      <div className="c4-orb-tools">
        <label className="c4-lab"><span>{v4("orbSearch")}</span><input ref={searchRef} className="c4-field c4-orb-search" aria-label={v4("orbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("orbDesk")}</span>
          <select className="c4-field" aria-label={v4("orbDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {ORCHARD_SEASONS.map((item) => <option key={item} value={item}>{seasonLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" onClick={() => download("orchard-benches.csv", orchardCsv(benches, desk))}>{v4("orbCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={density === "tight"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("orbDensityTight") : v4("orbDensityAiry")}</button>
        <button type="button" className="c4-btn" aria-pressed={sort === "gardener"} onClick={() => setSort(orchardSort(sort === "season" ? "gardener" : "season"))}>{sort === "season" ? v4("orbSortGardener") : v4("orbSortSeason")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrchardPin(benches, picked))}>{v4("orbBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrchardArchive(benches, picked))}>{v4("orbBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrchardBloom(benches, picked))}>{v4("orbBulkBloom")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrchardTag(benches, picked, "q"))}>{v4("orbBulkTag")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrchardSoil(benches, picked, "sand"))}>{v4("orbBulkSoil")}</button>
      </div>
      <div className="c4-orb-tools" role="group" aria-label={v4("orbTray")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("orbOpen") : item === "held" ? v4("orbHeld") : v4("orbArchived")}</button>
        ))}
        {(["hall", "index"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={board === item ? "1" : "0"} onClick={() => setBoard(item)}>{item === "hall" ? v4("orbBoardHall") : v4("orbBoardIndex")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} aria-pressed={houseOnly} onClick={() => setHouseOnly((value) => !value)}>{v4("orbHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} aria-pressed={peakOnly} onClick={() => setPeakOnly((value) => !value)}>{v4("orbPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} aria-pressed={quietOnly} onClick={() => setQuietOnly((value) => !value)}>{v4("orbQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={gardenerFilter === "all" ? "1" : "0"} onClick={() => setGardenerFilter("all")}>{v4("orbAll")}</button>
        {gardeners.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={gardenerFilter === item ? "1" : "0"} onClick={() => setGardenerFilter(item)}>{item}</button>
        ))}
        {SOILS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={soilFilter === item ? "1" : "0"} onClick={() => setSoilFilter(activeSoil(soilFilter) === item ? "all" : item)}>{soilLabel(v4, item)}</button>
        ))}
        {BLOOMS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={bloomFilter === item ? "1" : "0"} onClick={() => setBloomFilter(activeBloom(bloomFilter, BLOOMS) === item ? "all" : item)}>{bloomLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-chip" data-on={seasonFilter === "all" ? "1" : "0"} onClick={() => setSeasonFilter("all")}>{v4("orbAll")}</button>
        <button type="button" className="c4-chip" data-on={seasonFilter === "peak" ? "1" : "0"} onClick={() => setSeasonFilter("peak")}>{v4("orbPeak")}</button>
        <button type="button" className="c4-chip" data-on={seasonFilter === "quiet" ? "1" : "0"} onClick={() => setSeasonFilter("quiet")}>{v4("orbQuiet")}</button>
        {ORCHARD_SEASONS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={seasonFilter === item ? "1" : "0"} onClick={() => setSeasonFilter(activeSeason(seasonFilter) === item ? "all" : item)}>{seasonLabel(v4, item)}</button>
        ))}
        {WATERS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={waterFilter === item ? "1" : "0"} onClick={() => setWaterFilter(activeWater(waterFilter) === item ? "all" : item)}>{item}</button>
        ))}
        {HEIGHTS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={heightFilter === item ? "1" : "0"} onClick={() => setHeightFilter(activeHeight(heightFilter) === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <form className="c4-orb-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addOrchardView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, gardener: gardenerFilter, soil: soilFilter, bloom: bloomFilter, season: seasonFilter, water: waterFilter, height: heightFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("orbViewName")}</span><input className="c4-field" aria-label={v4("orbViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("orbSaveView")}</button>
      </form>
      <ul className="c4-orb-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("orbApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropOrchardView(views, view.id))}>{v4("orbDropView")}</button>
          </li>
        ))}
      </ul>
      {board === "hall" ? (
        <ol className="c4-orb-board">
          {!shown.length && <li className="c4-orb-empty"><span className="c4-orb-trellis" aria-hidden="true"><i /><i /><i /><i /></span>{v4("orbEmpty")}</li>}
          {shown.map((bench, index) => {
            const gap = seasonGap(bench.season, desk);
            return (
              <li key={bench.id} className="c4-orb-card" data-on={index === focusAt ? "1" : "0"} data-pinned={bench.pinned ? "1" : "0"} data-shade={bench.shade ? "1" : "0"} data-soil={bench.soil || "blank"} data-late={lateBench(bench, desk) ? "1" : "0"} data-idle={idleBench(bench) ? "1" : "0"} data-rush={rushBench(bench) ? "1" : "0"} data-resting={restingBench(bench) ? "1" : "0"} data-overdue={overdueBench(bench) ? "1" : "0"}>
                <p className="c4-orb-dial" aria-hidden="true">{bench.height}</p>
                <label className="c4-lab"><span>{v4("orbSelect")}</span><input type="checkbox" aria-label={v4("orbSelect")} checked={picked.includes(bench.id)} onChange={() => togglePick(bench.id)} /></label>
                <input className="c4-field" aria-label={v4("orbEdit")} value={bench.title} disabled={viewer} onChange={(event) => { if (!viewer) store(editOrchard(benches, bench.id, event.target.value)); }} />
                <input className="c4-field" aria-label={v4("orbEditNote")} value={bench.note} disabled={viewer} onChange={(event) => { if (!viewer) store(editOrchardNote(benches, bench.id, event.target.value)); }} />
                <p className="c4-orb-meta">{bench.gardener || v4("orbBlankGardener")} · {seasonLabel(v4, bench.season)} · {soilLabel(v4, bench.soil)} · {bloomLabel(v4, bench.bloom)} · {bench.water ?? v4("orbBlankWater")} · {v4("orbHeight")} {bench.height} · {bench.tags.join(" ") || v4("orbBlank")} · {bandLabel(v4, seasonBand(bench.season))}{peakSeason(bench.season) ? ` · ${v4("orbPeak")}` : ""}{quietSeason(bench.season) ? ` · ${v4("orbQuiet")}` : ""}{houseSoil(bench.soil) ? ` · ${v4("orbHouse")}` : ""}{idleBench(bench) ? ` · ${v4("orbIdle")}` : ""}{rushBench(bench) ? ` · ${v4("orbRush")}` : ""}{restingBench(bench) ? ` · ${v4("orbResting")}` : ""}{overdueBench(bench) ? ` · ${v4("orbOverdue")}` : ""}</p>
                <p className="c4-orb-meta">{gap === null ? v4("orbBlank") : gap > 0 ? `${v4("orbPast")} ${gap}` : gap < 0 ? `${v4("orbAhead")} ${Math.abs(gap)}` : v4("orbDue")} · {AUDIT_KEY[bench.audit] ? v4(AUDIT_KEY[bench.audit]) : v4("orbBlank")} · {nextBench(benches, bench.id) ? `${v4("orbNext")} ${nextBench(benches, bench.id)?.title}` : v4("orbNextNone")}</p>
                <div className="c4-orb-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleBloom(benches, bench.id))}>{v4("orbBloom")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBenchPin(benches, bench.id, !bench.pinned))}>{bench.pinned ? v4("orbUnpin") : v4("orbPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || bench.archived} onClick={() => store(setBenchHold(benches, bench.id, !bench.held))}>{bench.held ? v4("orbResume") : v4("orbHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBenchArchive(benches, bench.id, !bench.archived))}>{bench.archived ? v4("orbReopen") : v4("orbArchive")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBenchShade(benches, bench.id, !bench.shade))}>{bench.shade ? v4("orbUnshade") : v4("orbShade")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenWater(benches, bench.id))}>{v4("orbWater")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenWater(benches, bench.id))}>{v4("orbShorten")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHeight(benches, bench.id))}>{v4("orbRaised")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHeight(benches, bench.id))}>{v4("orbLowered")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBenchSoil(benches, bench.id, bench.soil === "SAND" ? "loam" : bench.soil === "CLAY" ? "sand" : "clay"))}>{v4("orbSoil")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addOrchardTag(benches, bench.id, "r"))}>{v4("orbTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard.writeText(orchardCopy(bench)).catch(() => undefined); setCopied(bench.id); }}>{copied === bench.id ? v4("orbCopied") : v4("orbCopy")}</button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className="c4-orb-timeline">
          {!timeline.length && <li className="c4-orb-empty">{v4("orbEmpty")}</li>}
          {timeline.map((lane) => <li key={lane.height}><span>{lane.height}</span><strong>{lane.titles.join(" · ")}</strong></li>)}
        </ol>
      )}
      <aside className="c4-orb-side" aria-label={v4("orbReminders")}>
        <h3 className="c4-title">{v4("orbReminders")}</h3>
        {!reminders.length && <p>{v4("orbEmpty")}</p>}
        <ul>{reminders.map((bench) => <li key={bench.id}>{bench.title} · {lateBench(bench, desk) ? v4("orbLate") : v4("orbSame")}</li>)}</ul>
        <h3 className="c4-title">{v4("orbIdle")}</h3>
        {!idling.length && <p>{v4("orbIdleEmpty")}</p>}
        <ul>{idling.map((bench) => <li key={bench.id}>{bench.title}</li>)}</ul>
        {focused && <p>{v4("orbFocus")} {focused.title} · {orchardShare(counts.house, Math.max(1, counts.open))}%</p>}
        <p>{clashSeasonCount(benches) ? v4("orbClash") : v4("orbClashNone")} · {pairGardenerCount(benches) ? v4("orbPair") : v4("orbPairNone")} · {heightLoad(benches)} · {matchedBenches(benches, desk).length}</p>
      </aside>
    </section>
  );
}

function markNote(row: TraderRow): MeridianValue {
  return { zone: textField(row.timezone), timezone: textField(row.timezone) };
}

export function MeridianMarks({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [review, setReview] = useState<MeridianReview>("all");
  const [shape, setShape] = useState<MeridianShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const rows = useMemo<MeridianRow[]>(() => (queue.data?.users || []).map((row, index) => ({
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
    const present = presentMeridianLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenMeridians(readJson(MRD_KEY, []), present);
    const nextReviewed = readReviewedMeridians(readJson(MRD_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(MRD_KEY, nextHidden);
    writeJson(MRD_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentMeridianLanes(rows);
  const lanes = visibleMeridianLanes(present, hidden, showHidden);
  const shown = visibleMeridians(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = meridianLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  useEffect(() => {
    reviewRef.current = () => {
      if (viewer) return;
      const row = shown[focusAt];
      if (!row) return;
      const next = toggleMeridianReview(reviewed, row.id);
      setReviewed(next);
      writeJson(MRD_REVIEW_KEY, next);
    };
  });
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveOrchardFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveOrchardFocus(index, shown.length, -1));
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
        const order: MeridianShape[] = ["all", "deep", "wide", "bound", "notch", "score"];
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
  const lead = leadingMeridian(rows);
  const hueLead = leadingMeridianHue(rows);
  const shared = sharedMeridianCount(rows);
  const bound = rows.filter((row) => meridianBound(row.note)).length;
  const bars = meridianLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((row) => row.id);
  const known = rows.filter((row) => meridianState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(MRD_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedMeridians(next, rows.map((row) => row.id));
    setReviewed(saved);
    writeJson(MRD_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-mrd" aria-label={v4("mrdTitle")} data-marks="1" data-desk="conservatory" data-traders={queue.data?.users?.length ? "1" : "0"} data-role={role} data-keyed={bound ? "1" : "0"}>
      <header className="c4-mrd-mast">
        <p className="c4-mrd-seal" data-logo="mono">{v4("mrdLogo")}</p>
        <div>
          <p className="c4-mrd-kicker">{v4("mrdSub")}</p>
          <h2 className="c4-title">{v4("mrdTitle")}</h2>
        </div>
        <ol className="c4-mrd-index" aria-label={v4("mrdTitle")}>
          <li data-tone="gold">{v4("mrdChampagne")}</li>
          <li data-tone="ink">{v4("mrdGraphite")}</li>
          <li data-tone="ivory">{v4("mrdIvory")}</li>
        </ol>
      </header>
      <p className="c4-mrd-links">
        <Link href={crmv4Href(base, "orb")}>{v4("mrdGallery")}</Link>
        <Link href={crmv4Href(base, "sop")}>{v4("orbProcedures")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("mrdSub")}</Link>
      </p>
      {viewer && <p className="c4-mrd-note">{v4("mrdViewer")}</p>}
      <p className="c4-mrd-rule">{v4("mrdHint")}</p>
      <ul className="c4-mrd-kpis" aria-label={v4("mrdRules")}>
        <li><span>{v4("mrdSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("mrdClear")}</span><strong>{rows.filter((row) => meridianState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("mrdDeep")}</span><strong>{laneMeridianCount(rows, "deep")}</strong></li>
        <li><span>{v4("mrdScore")}</span><strong>{laneMeridianCount(rows, "score")}</strong></li>
        <li><span>{v4("mrdDash")}</span><strong>{laneMeridianCount(rows, "dash")}</strong></li>
        <li><span>{v4("mrdMark")}</span><strong>{laneMeridianCount(rows, "mark")}</strong></li>
        <li><span>{v4("mrdHush")}</span><strong>{laneMeridianCount(rows, "hush")}</strong></li>
        <li><span>{v4("mrdTrio")}</span><strong>{laneMeridianCount(rows, "trio")}</strong></li>
        <li><span>{v4("mrdPair")}</span><strong>{laneMeridianCount(rows, "pair")}</strong></li>
        <li><span>{v4("mrdLong")}</span><strong>{laneMeridianCount(rows, "long")}</strong></li>
        <li><span>{v4("mrdGilt")}</span><strong>{hueMeridianCount(rows, "gilt")}</strong></li>
        <li><span>{v4("mrdNotch")}</span><strong>{rows.filter((row) => meridianNotch(row.note)).length}</strong></li>
        <li><span>{v4("mrdWide")}</span><strong>{rows.filter((row) => meridianWide(row.note)).length}</strong></li>
        <li><span>{v4("mrdJoin")}</span><strong>{rows.filter((row) => meridianJoin(row.note)).length}</strong></li>
        <li><span>{v4("mrdShare")}</span><strong>{meridianShare(bound, Math.max(1, known))}%</strong></li>
        <li><span>{v4("mrdShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-mrd-bars" aria-label={v4("mrdLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-mrd-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-mrd-meta">{lead ? `${v4("mrdLead")} ${laneLabel(v4, lead)}` : v4("mrdEmpty")} · {hueLead ? `${v4("mrdToneLead")} ${hueLabel(v4, hueLead)}` : v4("mrdUnmarked")}</p>
      <div className="c4-mrd-tools">
        <label className="c4-lab"><span>{v4("mrdSearch")}</span><input ref={searchRef} className="c4-field c4-mrd-search" aria-label={v4("mrdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => download("meridian-lanes.csv", meridianLanesCsv(rows))}>{v4("mrdCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("meridian-rows.csv", meridianRowsCsv(rows, reviewed))}>{v4("mrdRowCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={showHidden} onClick={() => setShowHidden((value) => !value)}>{v4("mrdShow")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkMeridianReview(reviewed, ids, true))}>{v4("mrdBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkMeridianReview(reviewed, ids, false))}>{v4("mrdBulkClear")}</button>
      </div>
      <div className="c4-mrd-tools" role="group" aria-label={v4("mrdAll")}>
        <button type="button" className="c4-chip" data-on={lane === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("mrdAll")}</button>
        {lanes.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={lane === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
        {(["gilt", "slate", "sand", "clay", "soot", "pearl", "mist"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(hue === item ? "all" : item)}>{hueLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("mrdAll") : item === "reviewed" ? v4("mrdReviewed") : v4("mrdUnreviewed")}</button>
        ))}
        {(["all", "deep", "wide", "bound", "notch", "score"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("mrdShapeAll") : item === "deep" ? v4("mrdShapeDeep") : item === "wide" ? v4("mrdShapeWide") : item === "bound" ? v4("mrdShapeBound") : item === "notch" ? v4("mrdShapeNotch") : v4("mrdShapeScore")}</button>
        ))}
      </div>
      {!shown.length && <p className="c4-mrd-empty">{v4("mrdEmpty")}</p>}
      <ol className="c4-mrd-board">
        {shown.map((row, index) => {
          const current = meridianLane(row.note);
          const hueName = meridianHue(row.note);
          return (
            <li key={row.id} className="c4-mrd-card" data-on={index === focusAt ? "1" : "0"} data-lane={current || "blank"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-wide={meridianWide(row.note) ? "1" : "0"} data-join={meridianJoin(row.note) ? "1" : "0"} data-notch={meridianNotch(row.note) ? "1" : "0"} data-bound={meridianBound(row.note) ? "1" : "0"}>
              <strong>{row.label || v4("mrdClear")}</strong>
              <p className="c4-mrd-meta">{v4("mrdMarkWord")} {meridianStamp(row.note) || v4("mrdUnmarked")} · {laneLabel(v4, current)} · {hueLabel(v4, hueName)} · {v4("mrdStep")} {meridianStep(row.note)} · {v4("mrdZone")}</p>
              <div className="c4-mrd-tools">
                <button type="button" className="c4-btn" disabled={viewer || !current} onClick={() => storeHidden(toggleMeridian(hidden, current))}>{hidden.includes(current) ? v4("mrdShow") : v4("mrdHide")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleMeridianReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("mrdReviewed") : v4("mrdReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = meridianCopy(row.note); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(row.id); }}>{copied === row.id ? v4("mrdCopied") : v4("mrdCopy")}</button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
