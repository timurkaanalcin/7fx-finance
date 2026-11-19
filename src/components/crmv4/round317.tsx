"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  PRP_KEY,
  PRP_REVIEW_KEY,
  SNG_GLASSES,
  SNG_DENSITY_KEY,
  SNG_KEY,
  SNG_VIEW_KEY,
  addSandglassTag,
  addSandglassView,
  addSandglass,
  briskSandglass,
  bulkPeriplusReview,
  bulkSandglassChest,
  bulkSandglassRun,
  bulkSandglassTag,
  bulkSandglassSlate,
  busiestRunner,
  dropSandglassView,
  editSandglassNote,
  editSandglass,
  fairRunner,
  periplusCapital,
  periplusCopy,
  periplusCipher,
  periplusEven,
  periplusFamily,
  periplusFirst,
  periplusHeld,
  periplusHue,
  periplusHyphen,
  periplusLane,
  periplusLanes,
  periplusLanesCsv,
  periplusLength,
  periplusLetter,
  periplusLower,
  periplusMixed,
  periplusOpen,
  periplusPeriod,
  periplusRowsCsv,
  periplusShare,
  periplusSpace,
  periplusStamp,
  periplusTail,
  periplusUpper,
  periplusMouth,
  idleSandglass,
  lanePeriplusCount,
  lateSandglass,
  leadingPeriplus,
  leadingPeriplusHue,
  liftGrainFocused,
  lowerTurnFocused,
  lowerGrainFocused,
  moveSandglassFocus,
  sandglassBars,
  sandglassCopy,
  sandglassCounts,
  sandglassCsv,
  sandglassDensity,
  sandglassInner,
  sandglassOuter,
  sandglassRunners,
  sandglassTimeline,
  overdueSandglass,
  presentPeriplusLanes,
  raiseTurnFocused,
  readHiddenPeriplus,
  readSandglassViews,
  readSandglassRules,
  readReviewedPeriplus,
  reminderSandglassRules,
  restingSandglass,
  setSandglassFocused,
  setSandglassChest,
  setSandglassRun,
  setSandglassHook,
  setSandglassStar,
  setSandglassSand,
  sortSandglassRules,
  starSandglassFocused,
  suggestGrain,
  suggestGlass,
  suggestSand,
  togglePeriplus,
  togglePeriplusReview,
  visiblePeriplusLanes,
  visiblePeriplus,
  visibleSandglassRules,
  sandFocused,
  hookSandglassFocused,
  type PeriplusReview,
  type PeriplusRow,
  type PeriplusShape,
  type PeriplusValue,
  type SandglassDensity,
  type SandglassSort,
  type SandglassTray,
  type SandglassView,
  type Sandglass,
} from "@/lib/crmv4/round317";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const SANDS = ["GILT", "IVORY", "SLATE"] as const;
const GRAINS = ["3", "9", "15", "30"] as const;
const TURNS = ["1", "5", "7"] as const;

const GLASS_KEY: Record<string, CrmV4CopyKey> = {
  bulb: "sngBulb",
  neck: "sngNeck",
  waist: "sngWaist",
  foot: "sngFoot",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "sngAuditSave",
  edit: "sngAuditEdit",
  note: "sngAuditNote",
  sand: "sngAuditSand",
  set: "sngAuditSet",
  clear: "sngAuditClear",
  hook: "sngAuditHook",
  resume: "sngAuditResume",
  chest: "sngAuditChest",
  open: "sngAuditOpen",
  tag: "sngAuditTag",
  turn: "sngAuditTurn",
  grain: "sngAuditGrain",
  lower: "sngAuditLowerGrain",
  star: "sngAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  home: "prpHome",
  ridge: "prpRidge",
  gulf: "prpGulf",
  cipher: "prpCipher",
  islet: "prpIslet",
  ocean: "prpOcean",
  mouth: "prpMouth",
  cape: "prpCape",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "prpChampagne",
  ivory: "prpIvory",
  graphite: "prpGraphite",
};

const SHAPE_KEY: Record<PeriplusShape, CrmV4CopyKey> = {
  all: "prpShapeAll",
  home: "prpShapeHome",
  ridge: "prpShapeRidge",
  gulf: "prpShapeGulf",
  cipher: "prpShapeCipher",
  islet: "prpShapeIslet",
  ocean: "prpShapeOcean",
  mouth: "prpShapeMouth",
  cape: "prpShapeCape",
  open: "prpShapeOpen",
  soon: "prpShapeSoon",
  letter: "prpShapeLetter",
  mixed: "prpShapeMixed",
  upper: "prpShapeUpper",
  lower: "prpShapeLower",
  space: "prpShapeSpace",
  even: "prpShapeEven",
  odd: "prpShapeOdd",
  tail: "prpShapeTail",
  first: "prpShapeFirst",
  held: "prpShapeHeld",
  hyphen: "prpShapeHyphen",
  period: "prpShapePeriod",
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

function glassLabel(v4: V4, glass: string): string {
  const key = GLASS_KEY[glass];
  return key ? v4(key) : v4("sngBlankGlass");
}

function sandLabel(v4: V4, sand: string): string {
  if (sand === "GILT") return v4("sngGilt");
  if (sand === "IVORY") return v4("sngIvory");
  if (sand === "SLATE") return v4("sngSlate");
  return v4("sngAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("prpUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("prpUnmarked");
}

export function SandglassRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Sandglass[]>([]);
  const [views, setViews] = useState<SandglassView[]>([]);
  const [density, setDensity] = useState<SandglassDensity>("broad");
  const [tray, setTray] = useState<SandglassTray>("table");
  const [query, setQuery] = useState("");
  const [runnerFilter, setRunnerFilter] = useState("");
  const [sandFilter, setSandFilter] = useState("all");
  const [glassFilter, setGlassFilter] = useState("all");
  const [grainFilter, setGrainFilter] = useState("all");
  const [turnFilter, setTurnFilter] = useState("all");
  const [sort, setSort] = useState<SandglassSort>("glass");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [runner, setRunner] = useState("");
  const [glass, setGlass] = useState("");
  const [sand, setSand] = useState("");
  const [grainNo, setGrainNo] = useState("");
  const [turnNo, setTurnNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("bulb");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readSandglassRules(readJson(SNG_KEY, [])));
    setViews(readSandglassViews(readJson(SNG_VIEW_KEY, [])));
    setDensity(sandglassDensity(readJson(SNG_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Sandglass[]) {
    setCards(next);
    writeJson(SNG_KEY, next);
  }
  function storeViews(next: SandglassView[]) {
    setViews(next);
    writeJson(SNG_VIEW_KEY, next);
  }
  function storeDensity(next: SandglassDensity) {
    setDensity(next);
    writeJson(SNG_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortSandglassRules(visibleSandglassRules(cards, tray, query, runnerFilter, sandFilter, glassFilter, grainFilter, turnFilter), sort),
    [cards, tray, query, runnerFilter, sandFilter, glassFilter, grainFilter, turnFilter, sort],
  );
  const counts = sandglassCounts(cards, shown, desk);
  const bars = sandglassBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = sandglassTimeline(cards);
  const runners = sandglassRunners(cards);
  const suggested = suggestSand(cards);
  const fair = fairRunner(cards, runners.join(","));
  const busy = busiestRunner(cards);
  const reminders = reminderSandglassRules(cards);
  const grainHint = suggestGrain(cards, clock);
  const glassHint = suggestGlass(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setRunner("");
        setGlass("");
        setSand("");
        setGrainNo("");
        setTurnNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveSandglassFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveSandglassFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        store(liftGrainFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setSandglassChest(cards, id, !shown[focusAt]?.chested));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(sandFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(hookSandglassFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setSandglassFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("sandglass-rules.csv", sandglassCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starSandglassFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raiseTurnFocused(cards, id));
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        store(lowerTurnFocused(cards, id));
        return;
      }
      if (event.key === "o" || event.key === "O") {
        event.preventDefault();
        store(lowerGrainFocused(cards, id));
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
    <section className="c4-sandglass" aria-label={v4("sngTitle")} data-cards="1" data-desk={tray} data-names="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-sandglass-mast">
        <p className="c4-sandglass-seal" data-logo="mono">{v4("sngLogo")}</p>
        <div>
          <p className="c4-sandglass-kicker">{v4("sngSub")}</p>
          <h2 className="c4-title">{v4("sngTitle")}</h2>
        </div>
        <p className="c4-sandglass-count">{counts.matched}</p>
      </header>
      <ol className="c4-sandglass-index" aria-label={v4("sngTitle")}>
        <li data-tone="gold">{v4("sngTable")} {counts.table}</li>
        <li data-tone="ink">{v4("sngOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("sngHouse")} {counts.house}</li>
      </ol>
      <p className="c4-sandglass-links">
        <Link href={crmv4Href(base, "prp")}>{v4("prpTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("sngCustomers")}</Link>
      </p>
      <p className="c4-sandglass-hint">{v4("sngHint")}</p>
      {viewer && <p className="c4-sandglass-note">{v4("sngViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-sandglass-notice" role="status">{v4("sngOverdue")} {counts.overdue}</p>}
      <ol className="c4-sandglass-dials" aria-label={v4("sngChart")}>
        <li>{v4("sngTable")} {counts.table}</li>
        <li>{v4("sngHook")} {counts.hook}</li>
        <li>{v4("sngChest")} {counts.chest}</li>
        <li>{v4("sngInner")} {counts.inner}</li>
        <li>{v4("sngOuter")} {counts.outer}</li>
        <li>{v4("sngWide")} {counts.wide}</li>
        <li>{v4("sngStar")} {counts.starred}</li>
        <li>{v4("sngIdle")} {counts.idle}</li>
        <li>{v4("sngBrisk")} {counts.brisk}</li>
        <li>{v4("sngResting")} {counts.resting}</li>
      </ol>
      <div className="c4-sandglass-chart" aria-label={v4("sngChart")}>
        {bars.map((bar) => (
          <button key={bar.glass} type="button" className="c4-sandglass-column" data-on={glassFilter === bar.glass ? "1" : "0"} data-glass={bar.glass} onClick={() => setGlassFilter(glassFilter === bar.glass ? "all" : bar.glass)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{glassLabel(v4, bar.glass)}</span>
          </button>
        ))}
      </div>
      <div className="c4-sandglass-tools">
        <input ref={searchRef} className="c4-field c4-sandglass-search" aria-label={v4("sngSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("sngSearch")} />
        {(["table", "hook", "chest"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "table" ? "sngTable" : item === "hook" ? "sngHook" : "sngChest")}</button>
        ))}
        {(["all", "inner", "outer", ...SNG_GLASSES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={glassFilter === item ? "1" : "0"} onClick={() => setGlassFilter(item)}>{item === "all" ? v4("sngAll") : item === "inner" ? v4("sngInner") : item === "outer" ? v4("sngOuter") : glassLabel(v4, item)}</button>
        ))}
        {(["all", ...SANDS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={sandFilter === item ? "1" : "0"} onClick={() => setSandFilter(item)}>{item === "all" ? v4("sngAll") : sandLabel(v4, item)}</button>
        ))}
        {(["all", ...GRAINS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={grainFilter === item ? "1" : "0"} onClick={() => setGrainFilter(item)}>{item === "all" ? v4("sngGrain") : item}</button>
        ))}
        {(["all", ...TURNS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={turnFilter === item ? "1" : "0"} onClick={() => setTurnFilter(item)}>{item === "all" ? v4("sngTurn") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "glass" ? "1" : "0"} onClick={() => setSort("glass")}>{v4("sngSortGlass")}</button>
        <button type="button" className="c4-chip" data-on={sort === "runner" ? "1" : "0"} onClick={() => setSort("runner")}>{v4("sngSortRunner")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("sngTight") : v4("sngBroad")}</button>
        {SNG_GLASSES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("sngDesk")} {glassLabel(v4, item)}</button>
        ))}
        {runners.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={runnerFilter === name ? "1" : "0"} onClick={() => setRunnerFilter(runnerFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-sandglass-meta">{v4("sngSuggest")} {sandLabel(v4, suggested)} · {grainHint} · {glassLabel(v4, glassHint)} · {v4("sngFair")} {fair || "—"} · {v4("sngBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-sandglass-remind" aria-label={v4("sngRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-sandglass-time" aria-label={v4("sngTimeline")}>
          {timeline.map((lane) => <li key={lane.grain}>{lane.grain} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-sandglass-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSandglass(cards, { title, note, runner, glass, sand, grain: grainNo, turn: turnNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("sngEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("sngEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("sngNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("sngNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("sngRunner")} aria-required={false} value={runner} onChange={(event) => setRunner(event.target.value)} placeholder={v4("sngRunner")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("sngDesk")} value={glass} onChange={(event) => setGlass(event.target.value)} disabled={viewer}>
          <option value="">{v4("sngBlankGlass")}</option>
          {SNG_GLASSES.map((item) => <option key={item} value={item}>{glassLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("sngSand")} value={sand} onChange={(event) => setSand(event.target.value)} disabled={viewer}>
          <option value="">{v4("sngSand")}</option>
          {SANDS.map((item) => <option key={item} value={item}>{sandLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("sngGrain")} value={grainNo} onChange={(event) => setGrainNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("sngGrain")}</option>
          {GRAINS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("sngTurn")} value={turnNo} onChange={(event) => setTurnNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("sngTurn")}</option>
          {TURNS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("sngTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("sngTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("sngAdd")}</button>
      </form>
      <form className="c4-sandglass-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSandglassView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, runner: runnerFilter, sand: sandFilter, glass: glassFilter, grain: grainFilter, turn: turnFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("sngViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("sngViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("sngSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-sandglass-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setRunnerFilter(view.runner); setSandFilter(view.sand); setGlassFilter(view.glass); setGrainFilter(view.grain); setTurnFilter(view.turn); }}>{v4("sngApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSandglassView(views, view.id))}>{v4("sngDrop")}</button>
          </span>
        ))}
      </form>
      <div className="c4-sandglass-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSandglassRun(cards, picked))}>{v4("sngBulkRun")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSandglassSlate(cards, picked))}>{v4("sngBulkSlate")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSandglassChest(cards, picked))}>{v4("sngBulkChest")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSandglassTag(cards, picked))}>{v4("sngBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("sandglass-rules.csv", sandglassCsv(shown, desk))}>{v4("sngCsv")}</button>
      </div>
      <p className="c4-sandglass-keys">{v4("sngKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("sngEmpty")}</p>}
      <ul className="c4-sandglass-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-sandglass-card" data-on={focused?.id === card.id ? "1" : "0"} data-glass={card.glass || "blank"} data-late={lateSandglass(card, desk) ? "1" : "0"} data-idle={idleSandglass(card) ? "1" : "0"} data-brisk={briskSandglass(card) ? "1" : "0"} data-resting={restingSandglass(card) ? "1" : "0"} data-overdue={overdueSandglass(card) ? "1" : "0"} data-inner={sandglassInner(card.glass) ? "1" : "0"} data-outer={sandglassOuter(card.glass) ? "1" : "0"}>
              <label className="c4-sandglass-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("sngEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editSandglass(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("sngNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editSandglassNote(cards, card.id, event.target.value))} />
                <p className="c4-sandglass-meta">{card.runner || "—"} · {glassLabel(v4, card.glass)} · {sandLabel(v4, card.sand)} · {card.grain ?? "—"} · {card.turn} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-sandglass-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-sandglass-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSandglassRun(cards, card.id, !card.run))}>{card.run ? v4("sngClear") : v4("sngRun")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSandglassSand(cards, card.id, suggested))}>{v4("sngSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSandglassHook(cards, card.id, !card.hooked))}>{card.hooked ? v4("sngUnhook") : v4("sngHookIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSandglassChest(cards, card.id, !card.chested))}>{card.chested ? v4("sngUnchest") : v4("sngChestIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSandglassStar(cards, card.id, !card.starred))}>{card.starred ? v4("sngUnstar") : v4("sngStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSandglassTag(cards, card.id, "x"))}>{v4("sngTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftGrainFocused(cards, card.id))}>{v4("sngLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerGrainFocused(cards, card.id))}>{v4("sngLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(sandglassCopy(card))}>{v4("sngCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type PeriplusUser = { id?: string; name?: string | null; country?: string | null };

export function PeriplusPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: PeriplusUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<PeriplusShape>("all");
  const [review, setReview] = useState<PeriplusReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): PeriplusRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      coast: { country: textField(row.country) } satisfies PeriplusValue,
    };
  }).filter((row): row is PeriplusRow => Boolean(row));
  const present = presentPeriplusLanes(rows);
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
    const next = readHiddenPeriplus(readJson(PRP_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(PRP_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedPeriplus(readJson(PRP_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(PRP_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visiblePeriplusLanes(present, hidden, showHidden);
  const shown = visiblePeriplus(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = periplusLane(row.coast);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = periplusLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingPeriplus(rows);
  const leadHue = leadingPeriplusHue(rows);
  const whole = rows.filter((row) => periplusLane(row.coast)).length;
  const share = periplusShare(lanePeriplusCount(rows, "home"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("periplus-lanes.csv", periplusLanesCsv(rows));
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
    writeJson(PRP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(PRP_REVIEW_KEY, next);
  }

  return (
    <section className="c4-periplus" aria-label={v4("prpTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-periplus-mast">
        <p className="c4-periplus-seal" data-logo="mono">{v4("prpLogo")}</p>
        <div>
          <p className="c4-periplus-kicker">{v4("prpSub")}</p>
          <h2 className="c4-title">{v4("prpTitle")}</h2>
        </div>
        <p className="c4-periplus-count">{shown.length}</p>
      </header>
      <p className="c4-periplus-links">
        <Link href={crmv4Href(base, "sng")}>{v4("sngTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("prpCustomer")}</Link>
      </p>
      <p className="c4-periplus-hint">{v4("prpHint")}</p>
      {viewer && <p className="c4-periplus-note">{v4("prpViewer")}</p>}
      <p className="c4-periplus-meta">{v4("prpLead")} {laneLabel(v4, lead)} · {v4("prpToneLead")} {hueLabel(v4, leadHue)} · {v4("prpShare")} {share}</p>
      <div className="c4-periplus-chart" aria-label={v4("prpChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-periplus-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-periplus-tools">
        <input ref={searchRef} className="c4-field c4-periplus-search" aria-label={v4("prpSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("prpSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("prpShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "prpAll" : item === "reviewed" ? "prpReviewed" : "prpFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("prpAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as PeriplusShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(togglePeriplus(hidden, item))}>{hidden.includes(item) ? v4("prpShow") : v4("prpHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-periplus-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkPeriplusReview(reviewed, picked, true))}>{v4("prpBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkPeriplusReview(reviewed, picked, false))}>{v4("prpBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("periplus-lanes.csv", periplusLanesCsv(rows))}>{v4("prpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("periplus-rows.csv", periplusRowsCsv(shown, reviewed))}>{v4("prpRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("prpLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("prpFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("prpEmpty")}</p>}
      <ul className="c4-periplus-list">
        {shown.map((row) => {
          const name = periplusCopy(row.coast);
          const tone = periplusHue(row.coast);
          return (
            <li key={row.id} className="c4-periplus-card" data-lane={periplusLane(row.coast) || "open"} data-hue={tone || "none"} data-home={periplusHomeSafe(row.coast)} data-open={periplusOpen(row.coast) ? "1" : "0"} data-even={periplusEven(row.coast) ? "1" : "0"} data-cipher={periplusCipher(row.coast) ? "1" : "0"} data-letter={periplusLetter(row.coast) ? "1" : "0"} data-mixed={periplusMixed(row.coast) ? "1" : "0"} data-upper={periplusUpper(row.coast) ? "1" : "0"} data-lower={periplusLower(row.coast) ? "1" : "0"} data-space={periplusSpace(row.coast) ? "1" : "0"} data-mouth={periplusMouth(row.coast) ? "1" : "0"} data-tail={periplusTail(row.coast) ? "1" : "0"} data-first={periplusFirst(row.coast) ? "1" : "0"} data-held={periplusHeld(row.coast) ? "1" : "0"} data-hyphen={periplusHyphen(row.coast) ? "1" : "0"} data-period={periplusPeriod(row.coast) ? "1" : "0"} data-capital={periplusCapital(row.coast) ? "1" : "0"}>
              <label className="c4-periplus-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-periplus-meta">{name || v4("prpOpen")} · {periplusStamp(row.coast) || "—"} · {periplusFamily(row.coast) || "—"} · {periplusLength(row.coast) ?? "—"} · {laneLabel(v4, periplusLane(row.coast))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-periplus-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(togglePeriplusReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("prpReviewed") : v4("prpReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = periplusCopy(row.coast); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("prpCopied") : v4("prpCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("prpCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function periplusHomeSafe(raw: PeriplusValue): string {
  return periplusLane(raw) === "home" ? "1" : "0";
}
