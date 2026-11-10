"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BENCH_KEY,
  BENCH_VIEW_KEY,
  PLATE_KEY,
  activeBench,
  activeBloom,
  activeFold,
  activeGardener,
  activeLight,
  activeRibbon,
  activeShelf,
  activeSpan,
  addBench,
  addBenchView,
  assignedPlate,
  benchArg,
  benchClashIds,
  benchCopy,
  benchCounts,
  benchGap,
  benchBlooms,
  benchGardeners,
  benchLights,
  benchRibbons,
  benchShare,
  benchTimeline,
  benchesCsv,
  bloomArg,
  clashBenchCount,
  courtCounts,
  courtOf,
  dropBenchView,
  editBench,
  foldArg,
  foldLines,
  foldOf,
  gardenerArg,
  leadingFold,
  leadingShelf,
  lightArg,
  namedFolds,
  namedShelves,
  namedSpans,
  nextBench,
  plateShare,
  platesCsv,
  readBenchViews,
  readBenches,
  readHiddenShelves,
  resetBenches,
  ribbonArg,
  setBenchPinned,
  setBenchPressed,
  setBenchRested,
  shelfArg,
  shelfLines,
  shelfOf,
  spanArg,
  spanLines,
  spanOf,
  stepBenchLight,
  toggleShelf,
  visibleBenches,
  visiblePlateCustomers,
  visibleShelves,
  wingOf,
  bulkBenchPinned,
  bulkBenchPressed,
  bloomOf,
  lightOf,
  type BenchBloom,
  type BenchCard,
  type BenchLight,
  type BenchTray,
  type BenchView,
  type PlateRow,
} from "@/lib/crmv4/round157";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  lastCountryName?: string | null;
};

type GlanceRow = PlateRow & { id: string };

const COURTS = ["north", "east", "south", "west"] as const;

function bloomName(v4: V4, bloom: BenchBloom): string {
  if (bloom === "rose") return v4("bnkBloomRose");
  if (bloom === "lily") return v4("bnkBloomLily");
  if (bloom === "fern") return v4("bnkBloomFern");
  if (bloom === "moss") return v4("bnkBloomMoss");
  return v4("bnkBlankBloom");
}

function lightName(v4: V4, light: BenchLight): string {
  if (light === "shade") return v4("bnkLightShade");
  if (light === "dappled") return v4("bnkLightDappled");
  if (light === "sun") return v4("bnkLightSun");
  return v4("bnkBlankLight");
}

function courtName(v4: V4, name: string): string {
  if (name === "north") return v4("bnkNorth");
  if (name === "east") return v4("bnkEast");
  if (name === "south") return v4("bnkSouth");
  if (name === "west") return v4("bnkWest");
  if (name === "near") return v4("bnkNear");
  if (name === "far") return v4("bnkFar");
  if (/^(?:0?[1-9]|1\d|2[0-4])$/.test(name)) return String(Number(name));
  return v4("bnkBlankBench");
}

function shelfName(v4: V4, name: string): string {
  if (name === "alpha") return v4("pltAlpha");
  if (name === "beta") return v4("pltBeta");
  if (name === "gamma") return v4("pltGamma");
  if (name === "delta") return v4("pltDelta");
  if (name === "other") return v4("pltOther");
  return v4("pltUnmarked");
}

function spanName(v4: V4, name: string): string {
  if (name === "short") return v4("pltShort");
  if (name === "mid") return v4("pltMid");
  if (name === "long") return v4("pltLong");
  return v4("pltUnmarked");
}

function foldName(v4: V4, name: string): string {
  if (name === "plain") return v4("pltFoldPlain");
  if (name === "joined") return v4("pltFoldJoined");
  if (name === "stacked") return v4("pltFoldStacked");
  return v4("pltUnmarked");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("bnkAuditSave");
  if (audit === "edit") return v4("bnkAuditEdit");
  if (audit === "raise") return v4("bnkAuditRaise");
  if (audit === "lower") return v4("bnkAuditLower");
  if (audit === "pin") return v4("bnkAuditPin");
  if (audit === "unpin") return v4("bnkAuditUnpin");
  if (audit === "rest") return v4("bnkAuditRest");
  if (audit === "wake") return v4("bnkAuditWake");
  if (audit === "press") return v4("bnkAuditPress");
  if (audit === "unpress") return v4("bnkAuditUnpress");
  return "";
}

function benchLabel(bench: number | null): string {
  return bench === null ? "—" : String(bench);
}

function gapLabel(v4: V4, bench: number | null, desk: string): string {
  const gap = benchGap(bench, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("bnkPast")} ${gap}`;
  if (gap < 0) return `${v4("bnkAhead")} ${Math.abs(gap)}`;
  return v4("bnkDue");
}

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
  const tagName = (event.target as HTMLElement | null)?.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

function marks(light: string): number {
  if (light === "sun") return 3;
  if (light === "dappled") return 2;
  if (light === "shade") return 1;
  return 0;
}

export function ConservatoryBenches({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<BenchCard[]>([]);
  const [views, setViews] = useState<BenchView[]>([]);
  const [text, setText] = useState("");
  const [gardener, setGardener] = useState("");
  const [bench, setBench] = useState("");
  const [bloom, setBloom] = useState("");
  const [ribbon, setRibbon] = useState("");
  const [light, setLight] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<BenchTray>("open");
  const [gardenerFilter, setGardenerFilter] = useState("all");
  const [bloomFilter, setBloomFilter] = useState("all");
  const [ribbonFilter, setRibbonFilter] = useState("all");
  const [lightFilter, setLightFilter] = useState("all");
  const [benchFilter, setBenchFilter] = useState("all");
  const [sunOnly, setSunOnly] = useState(false);
  const [lateOnly, setLateOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readBenches(readJson(BENCH_KEY, []));
    const saved = readBenchViews(readJson(BENCH_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(BENCH_KEY, next);
    writeJson(BENCH_VIEW_KEY, saved);
    setRole(storedRole());
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        textRef.current?.focus();
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const gardeners = benchGardeners(cards);
  const blooms = benchBlooms(cards);
  const ribbons = benchRibbons(cards);
  const lights = benchLights(cards);
  const bars = courtCounts(cards);
  const gardenerOn = activeGardener(gardenerFilter, gardeners);
  const bloomOn = activeBloom(bloomFilter, blooms);
  const ribbonOn = activeRibbon(ribbonFilter, ribbons);
  const lightOn = activeLight(lightFilter, lights);
  const benchOn = activeBench(benchFilter);
  const picked = benchArg(benchOn);
  const shown = visibleBenches(
    cards,
    tray,
    query,
    gardenerArg(gardenerOn),
    bloomArg(bloomOn),
    ribbonArg(ribbonOn),
    lightArg(lightOn),
    picked.exact,
    picked.band,
    sunOnly,
    lateOnly,
    desk,
  );
  const timeline = benchTimeline(cards, query);
  const counts = benchCounts(cards, desk);
  const clashes = clashBenchCount(cards);
  const total = cards.length;
  const nextId = nextBench(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);

  function store(next: BenchCard[]) {
    setCards(next);
    writeJson(BENCH_KEY, next);
  }

  function storeViews(next: BenchView[]) {
    setViews(next);
    writeJson(BENCH_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setGardener("");
    setBench("");
    setBloom("");
    setRibbon("");
    setLight("");
  }

  function copyCard(card: BenchCard) {
    const body = benchCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: BenchView) {
    setTray(view.tray);
    setQuery(view.query);
    setGardenerFilter(activeGardener(view.gardener, benchGardeners(cards)));
    setBloomFilter(activeBloom(view.bloom, benchBlooms(cards)));
    setRibbonFilter(activeRibbon(view.ribbon, benchRibbons(cards)));
    setLightFilter(activeLight(view.light, benchLights(cards)));
    setBenchFilter(activeBench(view.bench));
    setBoard("cards");
    setSunOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-bnk" aria-label={v4("bnkTitle")} data-benches="1" data-role={role}>
      <header className="c4-bnk-head">
        <p className="c4-bnk-plate" data-logo="mono">{v4("bnkLogo")}</p>
        <div>
          <p className="c4-bnk-kicker">{v4("bnkSub")}</p>
          <h2 className="c4-title">{v4("bnkTitle")}</h2>
        </div>
        <p className="c4-bnk-count">{shown.length}</p>
      </header>
      <details className="c4-bnk-rules">
        <summary>{v4("bnkRules")}</summary>
        <p className="c4-meta">{v4("bnkHint")}</p>
        <p className="c4-meta">{v4("bnkLocal")}</p>
        <p className="c4-meta">{v4("bnkBlank")}</p>
        <p className="c4-meta">{v4("bnkGardenerBlank")}</p>
        <p className="c4-meta">{v4("bnkBenchBlank")}</p>
        <p className="c4-meta">{v4("bnkBloomBlank")}</p>
        <p className="c4-meta">{v4("bnkRibbonBlank")}</p>
        <p className="c4-meta">{v4("bnkLightBlank")}</p>
        <p className="c4-meta">{v4("bnkEscape")}</p>
        <p className="c4-meta">{v4("bnkSlash")}</p>
        <p className="c4-meta">{v4("bnkNew")}</p>
      </details>
      {viewer ? <p className="c4-bnk-notice" role="status">{v4("bnkViewer")}</p> : null}
      <p className="c4-bnk-notice" role="status">
        <span>{v4("bnkNotice")}</span>
        <span className="c4-bnk-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("bnkNoticeAll") : v4("bnkNoticeOpen")}
        </button>
      </p>
      <p className="c4-bnk-notice" role="status">
        <span>{v4("bnkClashNotice")}</span>
        <span className="c4-bnk-count">{clashes}</span>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-bnk-pins" aria-label={v4("bnkPinned")}>
          {pinned.map((card) => (
            <li key={card.id}>
              <button type="button" className="c4-chip" onClick={() => { setQuery(card.text); setBoard("cards"); }}>{card.text}</button>
            </li>
          ))}
        </ul>
      )}
      <section className="c4-bnk-kpi" aria-label={v4("bnkKpi")}>
        {(["open", "rested", "pressed", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = benchShare(count, total);
          const label = key === "open" ? v4("bnkOpen") : key === "rested" ? v4("bnkRested") : key === "pressed" ? v4("bnkPressed") : v4("bnkPinned");
          return (
            <p key={key} className="c4-bnk-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("bnkShare")} {share}%</span>
              <span className="c4-bnk-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-bnk-chart" aria-label={v4("bnkChart")}>
        <p className="c4-bnk-kicker">{v4("bnkChart")}</p>
        {COURTS.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-bnk-col" data-on={benchOn === name ? "1" : "0"} aria-pressed={benchOn === name} onClick={() => setBenchFilter(benchOn === name ? "all" : name)}>
              <span>{courtName(v4, name)}</span>
              <span className="c4-bnk-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-bnk-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addBench(cards, { id: `bnk-${Date.now()}`, text, gardener, bench, bloom, ribbon, light });
        if (next === cards || next.length === cards.length) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("bnkText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("bnkText")} value={text} disabled={viewer} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("bnkGardener")}</span>
          <input className="c4-field" aria-label={v4("bnkGardener")} value={gardener} disabled={viewer} onChange={(event) => setGardener(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("bnkBench")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("bnkBench")} value={bench} disabled={viewer} onChange={(event) => setBench(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("bnkBloom")}</span>
          <select className="c4-select" aria-label={v4("bnkBloom")} value={bloom} disabled={viewer} onChange={(event) => setBloom(event.target.value)}>
            <option value="">{v4("bnkBlankBloom")}</option>
            <option value="rose">{v4("bnkBloomRose")}</option>
            <option value="lily">{v4("bnkBloomLily")}</option>
            <option value="fern">{v4("bnkBloomFern")}</option>
            <option value="moss">{v4("bnkBloomMoss")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("bnkRibbon")}</span>
          <input className="c4-field" aria-label={v4("bnkRibbon")} value={ribbon} disabled={viewer} onChange={(event) => setRibbon(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("bnkLight")}</span>
          <select className="c4-select" aria-label={v4("bnkLight")} value={light} disabled={viewer} onChange={(event) => setLight(event.target.value)}>
            <option value="">{v4("bnkBlankLight")}</option>
            <option value="shade">{v4("bnkLightShade")}</option>
            <option value="dappled">{v4("bnkLightDappled")}</option>
            <option value="sun">{v4("bnkLightSun")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("bnkAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("bnkTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("bnkOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "rested" ? "1" : "0"} aria-pressed={tray === "rested"} onClick={() => setTray("rested")}>{v4("bnkRested")}</button>
        <button type="button" className="c4-chip" data-on={tray === "pressed" ? "1" : "0"} aria-pressed={tray === "pressed"} onClick={() => setTray("pressed")}>{v4("bnkPressed")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("bnkTimeline")}</button>
        <button type="button" className="c4-chip" data-on={sunOnly ? "1" : "0"} aria-pressed={sunOnly} onClick={() => setSunOnly((value) => !value)}>{v4("bnkSun")}</button>
        <button type="button" className="c4-btn" onClick={() => download("conservatory-benches.csv", benchesCsv(cards, desk))}>{v4("bnkCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBenchPinned(cards, shown.map((card) => card.id), true))}>{v4("bnkBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBenchPressed(cards, shown.map((card) => card.id), true))}>{v4("bnkBulkPress")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetBenches()); setEditing(""); }}>{v4("bnkReset")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("bnkBenches")}>
        <button type="button" className="c4-chip" data-on={benchOn === "all" ? "1" : "0"} aria-pressed={benchOn === "all"} onClick={() => setBenchFilter("all")}>{v4("bnkAllBenches")}</button>
        <button type="button" className="c4-chip" data-on={benchOn === "blank" ? "1" : "0"} aria-pressed={benchOn === "blank"} onClick={() => setBenchFilter("blank")}>{v4("bnkBlankBench")}</button>
        <button type="button" className="c4-chip" data-on={benchOn === "near" ? "1" : "0"} aria-pressed={benchOn === "near"} onClick={() => setBenchFilter("near")}>{v4("bnkNear")}</button>
        <button type="button" className="c4-chip" data-on={benchOn === "far" ? "1" : "0"} aria-pressed={benchOn === "far"} onClick={() => setBenchFilter("far")}>{v4("bnkFar")}</button>
        {["1", "7", "13", "19"].map((slot) => (
          <button key={slot} type="button" className="c4-chip" data-on={benchOn === slot ? "1" : "0"} aria-pressed={benchOn === slot} onClick={() => setBenchFilter(benchOn === slot ? "all" : slot)}>{slot}</button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("bnkSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("bnkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-bnk-next">
        <label className="c4-lab">
          <span>{v4("bnkDesk")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("bnkDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <p className="c4-meta">
          <span>{v4("bnkNext")}</span>
          {" "}
          {nextCard ? nextCard.text : v4("bnkNextEmpty")}
        </p>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("bnkGardeners")}</span>
          <select className="c4-select" aria-label={v4("bnkGardeners")} value={gardenerOn} onChange={(event) => setGardenerFilter(event.target.value)}>
            <option value="all">{v4("bnkAllGardeners")}</option>
            <option value="blank">{v4("bnkBlankGardener")}</option>
            {gardeners.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("bnkBlooms")}</span>
          <select className="c4-select" aria-label={v4("bnkBlooms")} value={bloomOn} onChange={(event) => setBloomFilter(event.target.value)}>
            <option value="all">{v4("bnkAllBlooms")}</option>
            <option value="blank">{v4("bnkBlankBloom")}</option>
            {blooms.map((item) => <option key={item} value={item}>{bloomName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("bnkRibbons")}</span>
          <select className="c4-select" aria-label={v4("bnkRibbons")} value={ribbonOn} onChange={(event) => setRibbonFilter(event.target.value)}>
            <option value="all">{v4("bnkAllRibbons")}</option>
            <option value="blank">{v4("bnkBlankRibbon")}</option>
            {ribbons.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("bnkLights")}</span>
          <select className="c4-select" aria-label={v4("bnkLights")} value={lightOn} onChange={(event) => setLightFilter(event.target.value)}>
            <option value="all">{v4("bnkAllLights")}</option>
            <option value="blank">{v4("bnkBlankLight")}</option>
            {lights.map((item) => <option key={item} value={item}>{lightName(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <form className="c4-bnk-view" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addBenchView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          gardener: gardenerOn,
          bloom: bloomOn,
          ribbon: ribbonOn,
          light: lightOn,
          bench: benchOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("bnkViewName")}</span>
          <input className="c4-field" aria-label={v4("bnkViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("bnkSaveView")}</button>
      </form>
      <section aria-label={v4("bnkViews")}>
        <p className="c4-bnk-kicker">{v4("bnkViews")}</p>
        {!views.length && <p className="c4-bnk-empty">{v4("bnkViewEmpty")}</p>}
        <ul className="c4-bnk-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropBenchView(views, view.id))}>{v4("bnkDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-bnk-empty">{v4("bnkEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-bnk-rows">
          {shown.map((card) => {
            const clashesOn = benchClashIds(cards, card.id);
            const gap = gapLabel(v4, card.bench, desk);
            const wing = wingOf(card.bench);
            const editingCard = editing === card.id;
            return (
              <li key={card.id} data-light={card.light || "blank"} data-bloom={card.bloom || "blank"} data-court={courtOf(card.bench)}>
                <span className="c4-bnk-folio" aria-hidden="true">{benchLabel(card.bench)}</span>
                <span className="c4-bnk-marks" aria-hidden="true">
                  {[0, 1, 2].map((index) => <i key={index} data-on={index < marks(card.light) ? "1" : "0"} />)}
                </span>
                <div>
                  {editingCard ? (
                    <form className="c4-row" onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editBench(cards, card.id, draft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("bnkEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("bnkSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-meta">
                    {card.gardener || v4("bnkBlankGardener")}
                    {" · "}
                    {benchLabel(card.bench)}
                    {" · "}
                    {bloomName(v4, bloomOf(card.bloom))}
                    {" · "}
                    {card.ribbon || v4("bnkBlankRibbon")}
                    {" · "}
                    {lightName(v4, lightOf(card.light))}
                    {wing === "blank" ? "" : ` · ${wing === "near" ? v4("bnkNear") : v4("bnkFar")}`}
                    {gap ? ` · ${gap}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("bnkAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashesOn.length ? `${v4("bnkClash")} ${clashesOn.length}` : v4("bnkClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("bnkCopied") : v4("bnkCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("bnkEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepBenchLight(cards, card.id, 1))}>{v4("bnkRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepBenchLight(cards, card.id, -1))}>{v4("bnkLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setBenchPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("bnkUnpin") : v4("bnkPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.rested} onClick={() => store(setBenchRested(cards, card.id, !card.rested))}>{card.rested ? v4("bnkWake") : v4("bnkRest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pressed} onClick={() => store(setBenchPressed(cards, card.id, !card.pressed))}>{card.pressed ? v4("bnkUnpress") : v4("bnkPress")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-bnk-time">
          {timeline.map((card) => (
            <li key={card.id} data-court={courtOf(card.bench)}>
              <span className="c4-bnk-clock">{benchLabel(card.bench)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function CountryPlates({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenShelves, setHiddenShelves] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [shelf, setShelf] = useState("all");
  const [span, setSpan] = useState("all");
  const [fold, setFold] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      lastCountryName: row.lastCountryName,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const shelves = shelfLines(rows);
  const spans = spanLines(rows);
  const folds = foldLines(rows);
  const present = namedShelves(rows);
  const presentKey = present.join("\n");
  const shelfNames = namedShelves(rows);
  const spanNames = namedSpans(rows);
  const foldNames = namedFolds(rows);
  const blankShelf = shelves.find((line) => !line.shelf)?.count || 0;
  const leadShelf = leadingShelf(rows);
  const leadFold = leadingFold(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenShelves(readJson(PLATE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenShelves(next);
    writeJson(PLATE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleShelves(present, hiddenShelves, showHidden);
  const shelfOn = activeShelf(selected || shelf, selected ? chips : shelfNames);
  const spanOn = activeSpan(span, spanNames);
  const foldOn = activeFold(fold, foldNames);
  const shown = visiblePlateCustomers(
    rows,
    selected ? shelfArg(activeShelf(selected, chips)) : shelfArg(activeShelf(shelf, shelfNames)),
    foldArg(foldOn),
    spanArg(spanOn),
    query,
  );
  const widest = Math.max(1, ...shelves.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenShelves(next);
    writeJson(PLATE_KEY, next);
    if (clear && activeShelf(selected, [clear]) === clear) setSelected("");
  }

  return (
    <section className="c4-plt" aria-label={v4("pltTitle")} data-plates="1">
      <header className="c4-plt-head">
        <div>
          <p className="c4-bnk-kicker">{v4("pltSub")}</p>
          <h2 className="c4-title">{v4("pltTitle")}</h2>
        </div>
        <p className="c4-bnk-count">{v4("pltRows")} {rows.length}</p>
      </header>
      <details className="c4-bnk-rules">
        <summary>{v4("pltRules")}</summary>
        <p className="c4-meta">{v4("pltHint")}</p>
        <p className="c4-meta">{v4("pltLocal")}</p>
        <p className="c4-meta">{v4("pltEscape")}</p>
      </details>
      {leadShelf ? <p className="c4-plt-lead"><span>{v4("pltLeadShelf")}</span> {shelfName(v4, leadShelf)}</p> : null}
      {leadFold ? <p className="c4-plt-lead"><span>{v4("pltLeadFold")}</span> {foldName(v4, leadFold)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("pltBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("country-plates.csv", platesCsv(rows))}>{v4("pltCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("pltLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("pltFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-bnk-empty">{v4("pltNone")}</p>}
      {shelves.length > 0 && (
        <section className="c4-plt-chart" aria-label={v4("pltAllShelf")}>
          {shelves.map((line) => {
            const share = plateShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.shelf || "blank";
            return (
              <p key={name} className="c4-plt-col" data-shelf={line.shelf || "blank"}>
                <span>{shelfName(v4, line.shelf)}</span>
                <span className="c4-bnk-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("pltShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-plt-shelves" role="group" aria-label={v4("pltAllShelf")}>
        <button type="button" className="c4-plt-shelf" data-on={!selected && shelfOn === "all" ? "1" : "0"} aria-pressed={!selected && shelfOn === "all"} onClick={() => { setSelected(""); setShelf("all"); }}>
          <span>{v4("pltAllShelf")}</span>
          <span className="c4-bnk-count">{rows.length}</span>
        </button>
        {blankShelf > 0 && (
          <button type="button" className="c4-plt-shelf" data-on={!selected && shelf === "blank" ? "1" : "0"} aria-pressed={!selected && shelf === "blank"} onClick={() => { setSelected(""); setShelf(shelf === "blank" ? "all" : "blank"); }}>
            <span>{v4("pltUnmarked")}</span>
            <span className="c4-bnk-count">{blankShelf}</span>
          </button>
        )}
        {shelfNames.map((item) => {
          const count = shelves.find((line) => line.shelf === item)?.count || 0;
          return (
            <button key={item} type="button" className="c4-plt-shelf" data-on={!selected && shelf === item ? "1" : "0"} aria-pressed={!selected && shelf === item} onClick={() => { setSelected(""); setShelf(shelf === item ? "all" : item); }}>
              <span>{shelfName(v4, item)}</span>
              <span className="c4-bnk-count">{count}</span>
              <span>{v4("pltShare")} {plateShare(count, rows.length)}%</span>
            </button>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("pltSpans")}>
        <button type="button" className="c4-chip" data-on={spanOn === "all" ? "1" : "0"} aria-pressed={spanOn === "all"} onClick={() => setSpan("all")}>{v4("pltSpans")}</button>
        {spans.filter((line) => line.span).map((line) => (
          <button key={line.span} type="button" className="c4-chip" data-on={spanOn === line.span ? "1" : "0"} aria-pressed={spanOn === line.span} onClick={() => setSpan(spanOn === line.span ? "all" : line.span)}>
            {spanName(v4, line.span)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("pltFolds")}>
        <button type="button" className="c4-chip" data-on={foldOn === "all" ? "1" : "0"} aria-pressed={foldOn === "all"} onClick={() => setFold("all")}>{v4("pltAllFolds")}</button>
        {folds.filter((line) => line.fold).map((line) => (
          <button key={line.fold} type="button" className="c4-chip" data-on={foldOn === line.fold ? "1" : "0"} aria-pressed={foldOn === line.fold} onClick={() => setFold(foldOn === line.fold ? "all" : line.fold)}>
            {foldName(v4, line.fold)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("pltShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("pltShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("pltHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("pltShelves")}>
        <button type="button" className="c4-chip" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>{v4("pltAll")}</button>
        {chips.map((item) => {
          const line = shelves.find((row) => row.shelf === item);
          const count = line?.count || 0;
          const share = plateShare(count, rows.length);
          return (
            <span key={item} className="c4-plt-pair">
              <button type="button" className="c4-chip" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => { setShelf("all"); setSelected(selected === item ? "" : item); }}>{shelfName(v4, item)}</button>
              <span className="c4-bnk-count">{count}</span>
              <span className="c4-plt-share">{v4("pltShare")} {share}%</span>
              <span className="c4-bnk-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleShelf(hiddenShelves, item, present), showHidden ? "" : item)}>{showHidden ? v4("pltShow") : v4("pltHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("pltSearch")}</span>
        <input className="c4-field" aria-label={v4("pltSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-bnk-empty">{v4("pltEmpty")}</p>}
      <ul className="c4-plt-rows">
        {shown.map((row) => {
          const plate = assignedPlate(row.lastCountryName);
          const shelfMark = shelfOf(row.lastCountryName);
          const spanMark = spanOf(row.lastCountryName);
          const foldMark = foldOf(row.lastCountryName);
          return (
            <li key={row.id} data-shelf={shelfMark || "blank"} data-fold={foldMark || "blank"} data-span={spanMark || "blank"}>
              <span className="c4-plt-face" aria-hidden="true">{shelfMark ? shelfName(v4, shelfMark).slice(0, 1) : "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {plate || v4("pltUnmarked")}
                {" · "}
                {shelfName(v4, shelfMark)}
                {" · "}
                {spanName(v4, spanMark)}
                {" · "}
                {foldName(v4, foldMark)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
