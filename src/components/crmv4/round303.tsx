"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CIV_KEY,
  CIV_REVIEW_KEY,
  SPH_CLIMATES,
  SPH_DENSITY_KEY,
  SPH_KEY,
  SPH_VIEW_KEY,
  addSapheaTag,
  addSapheaView,
  addSaphea,
  briskSaphea,
  bulkCivicReview,
  bulkSapheaVault,
  bulkSapheaScribed,
  bulkSapheaTag,
  bulkSapheaFelt,
  busiestScribe,
  dropSapheaView,
  editSapheaNote,
  editSaphea,
  fairScribe,
  civicCapital,
  civicCopy,
  civicDigit,
  civicEven,
  civicFamily,
  civicFirst,
  civicHeld,
  civicHue,
  civicHyphen,
  civicLane,
  civicLanes,
  civicLanesCsv,
  civicLength,
  civicLetter,
  civicLower,
  civicMixed,
  civicOpen,
  civicPeriod,
  civicRowsCsv,
  civicShare,
  civicSpace,
  civicStamp,
  civicTail,
  civicUpper,
  civicVowel,
  idleSaphea,
  laneCivicCount,
  lateSaphea,
  leadingCivic,
  leadingCivicHue,
  liftLatitudeFocused,
  lowerPegFocused,
  lowerLatitudeFocused,
  moveSapheaFocus,
  sapheaBars,
  sapheaCopy,
  sapheaCounts,
  sapheaCsv,
  sapheaDensity,
  sapheaInner,
  sapheaOuter,
  sapheaScribes,
  sapheaTimeline,
  overdueSaphea,
  presentCivicLanes,
  raisePegFocused,
  readHiddenCivics,
  readSapheaViews,
  readSapheas,
  readReviewedCivics,
  reminderSapheas,
  restingSaphea,
  setSapheaFocused,
  setSapheaVault,
  setSapheaScribed,
  setSapheaSleeve,
  setSapheaStar,
  setSapheaCloth,
  sortSapheas,
  starSapheaFocused,
  suggestLatitude,
  suggestClimate,
  suggestWeave,
  toggleCivic,
  toggleCivicReview,
  visibleCivicLanes,
  visibleCivics,
  visibleSapheas,
  weaveFocused,
  sleeveSapheaFocused,
  type CivicReview,
  type CivicRow,
  type CivicShape,
  type CivicValue,
  type SapheaDensity,
  type SapheaSort,
  type SapheaTray,
  type SapheaView,
  type Saphea,
} from "@/lib/crmv4/round303";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const WEAVES = ["SILK", "WOOL", "FELT"] as const;
const LATITUDES = ["15", "30", "45", "60"] as const;
const PEGS = ["3", "6", "9"] as const;

const CLIMATE_KEY: Record<string, CrmV4CopyKey> = {
  tropic: "sphTropic",
  temperate: "sphTemperate",
  polar: "sphPolar",
  desert: "sphDesert",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "sphAuditSave",
  edit: "sphAuditEdit",
  note: "sphAuditNote",
  weave: "sphAuditWeave",
  set: "sphAuditSet",
  clear: "sphAuditClear",
  sleeve: "sphAuditSleeve",
  resume: "sphAuditResume",
  vault: "sphAuditVault",
  open: "sphAuditOpen",
  tag: "sphAuditTag",
  peg: "sphAuditPeg",
  latitude: "sphAuditLatitude",
  lower: "sphAuditLower",
  star: "sphAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "civHouse",
  fort: "civFort",
  harbor: "civHarbor",
  digit: "civDigit",
  spark: "civSpark",
  scroll: "civScroll",
  vowel: "civVowel",
  post: "civPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "civChampagne",
  ivory: "civIvory",
  graphite: "civGraphite",
};

const SHAPE_KEY: Record<CivicShape, CrmV4CopyKey> = {
  all: "civShapeAll",
  house: "civShapeHouse",
  fort: "civShapeFort",
  harbor: "civShapeHarbor",
  digit: "civShapeDigit",
  spark: "civShapeSpark",
  scroll: "civShapeScroll",
  vowel: "civShapeVowel",
  post: "civShapePost",
  open: "civShapeOpen",
  soon: "civShapeSoon",
  letter: "civShapeLetter",
  mixed: "civShapeMixed",
  upper: "civShapeUpper",
  lower: "civShapeLower",
  space: "civShapeSpace",
  even: "civShapeEven",
  odd: "civShapeOdd",
  tail: "civShapeTail",
  first: "civShapeFirst",
  held: "civShapeHeld",
  hyphen: "civShapeHyphen",
  period: "civShapePeriod",
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

function climateLabel(v4: V4, climate: string): string {
  const key = CLIMATE_KEY[climate];
  return key ? v4(key) : v4("sphBlankClimate");
}

function weaveLabel(v4: V4, weave: string): string {
  if (weave === "SILK") return v4("sphSilk");
  if (weave === "WOOL") return v4("sphWool");
  if (weave === "FELT") return v4("sphFelt");
  return v4("sphAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("civUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("civUnmarked");
}

export function SapheaLeaves({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Saphea[]>([]);
  const [views, setViews] = useState<SapheaView[]>([]);
  const [density, setDensity] = useState<SapheaDensity>("broad");
  const [tray, setTray] = useState<SapheaTray>("court");
  const [query, setQuery] = useState("");
  const [scribeFilter, setScribeFilter] = useState("");
  const [weaveFilter, setWeaveFilter] = useState("all");
  const [climateFilter, setClimateFilter] = useState("all");
  const [latitudeFilter, setLatitudeFilter] = useState("all");
  const [pegFilter, setPegFilter] = useState("all");
  const [sort, setSort] = useState<SapheaSort>("climate");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [scribe, setScribe] = useState("");
  const [climate, setClimate] = useState("");
  const [weave, setWeave] = useState("");
  const [latitudeNo, setLatitudeNo] = useState("");
  const [pegNo, setPegNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("tropic");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readSapheas(readJson(SPH_KEY, [])));
    setViews(readSapheaViews(readJson(SPH_VIEW_KEY, [])));
    setDensity(sapheaDensity(readJson(SPH_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Saphea[]) {
    setCards(next);
    writeJson(SPH_KEY, next);
  }
  function storeViews(next: SapheaView[]) {
    setViews(next);
    writeJson(SPH_VIEW_KEY, next);
  }
  function storeDensity(next: SapheaDensity) {
    setDensity(next);
    writeJson(SPH_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortSapheas(visibleSapheas(cards, tray, query, scribeFilter, weaveFilter, climateFilter, latitudeFilter, pegFilter), sort),
    [cards, tray, query, scribeFilter, weaveFilter, climateFilter, latitudeFilter, pegFilter, sort],
  );
  const counts = sapheaCounts(cards, shown, desk);
  const bars = sapheaBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = sapheaTimeline(cards);
  const scribes = sapheaScribes(cards);
  const suggested = suggestWeave(cards);
  const fair = fairScribe(cards, scribes.join(","));
  const busy = busiestScribe(cards);
  const reminders = reminderSapheas(cards);
  const latitudeHint = suggestLatitude(cards, clock);
  const climateHint = suggestClimate(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setScribe("");
        setClimate("");
        setWeave("");
        setLatitudeNo("");
        setPegNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveSapheaFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveSapheaFocus(index, shown.length, -1));
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
        store(setSapheaVault(cards, id, !shown[focusAt]?.held));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(weaveFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(sleeveSapheaFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setSapheaFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("saphea-leaves.csv", sapheaCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starSapheaFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raisePegFocused(cards, id));
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        store(lowerPegFocused(cards, id));
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
    <section className="c4-saphea" aria-label={v4("sphTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-saphea-mast">
        <p className="c4-saphea-seal" data-logo="mono">{v4("sphLogo")}</p>
        <div>
          <p className="c4-saphea-kicker">{v4("sphSub")}</p>
          <h2 className="c4-title">{v4("sphTitle")}</h2>
        </div>
        <p className="c4-saphea-count">{counts.matched}</p>
      </header>
      <ol className="c4-saphea-index" aria-label={v4("sphTitle")}>
        <li data-tone="gold">{v4("sphCourt")} {counts.court}</li>
        <li data-tone="ink">{v4("sphOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("sphHouse")} {counts.house}</li>
      </ol>
      <p className="c4-saphea-links">
        <Link href={crmv4Href(base, "civ")}>{v4("civTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("sphCustomers")}</Link>
      </p>
      <p className="c4-saphea-hint">{v4("sphHint")}</p>
      {viewer && <p className="c4-saphea-note">{v4("sphViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-saphea-notice" role="status">{v4("sphOverdue")} {counts.overdue}</p>}
      <ol className="c4-saphea-dials" aria-label={v4("sphChart")}>
        <li>{v4("sphCourt")} {counts.court}</li>
        <li>{v4("sphSleeve")} {counts.sleeve}</li>
        <li>{v4("sphVault")} {counts.vault}</li>
        <li>{v4("sphInner")} {counts.inner}</li>
        <li>{v4("sphOuter")} {counts.outer}</li>
        <li>{v4("sphWide")} {counts.wide}</li>
        <li>{v4("sphStar")} {counts.starred}</li>
        <li>{v4("sphIdle")} {counts.idle}</li>
        <li>{v4("sphBrisk")} {counts.brisk}</li>
        <li>{v4("sphResting")} {counts.resting}</li>
      </ol>
      <div className="c4-saphea-chart" aria-label={v4("sphChart")}>
        {bars.map((bar) => (
          <button key={bar.climate} type="button" className="c4-saphea-column" data-on={climateFilter === bar.climate ? "1" : "0"} data-climate={bar.climate} onClick={() => setClimateFilter(climateFilter === bar.climate ? "all" : bar.climate)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{climateLabel(v4, bar.climate)}</span>
          </button>
        ))}
      </div>
      <div className="c4-saphea-tools">
        <input ref={searchRef} className="c4-field c4-saphea-search" aria-label={v4("sphSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("sphSearch")} />
        {(["court", "sleeve", "vault"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "court" ? "sphCourt" : item === "sleeve" ? "sphSleeve" : "sphVault")}</button>
        ))}
        {(["all", "inner", "outer", ...SPH_CLIMATES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={climateFilter === item ? "1" : "0"} onClick={() => setClimateFilter(item)}>{item === "all" ? v4("sphAll") : item === "inner" ? v4("sphInner") : item === "outer" ? v4("sphOuter") : climateLabel(v4, item)}</button>
        ))}
        {(["all", ...WEAVES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={weaveFilter === item ? "1" : "0"} onClick={() => setWeaveFilter(item)}>{item === "all" ? v4("sphAll") : weaveLabel(v4, item)}</button>
        ))}
        {(["all", ...LATITUDES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={latitudeFilter === item ? "1" : "0"} onClick={() => setLatitudeFilter(item)}>{item === "all" ? v4("sphLatitude") : item}</button>
        ))}
        {(["all", ...PEGS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={pegFilter === item ? "1" : "0"} onClick={() => setPegFilter(item)}>{item === "all" ? v4("sphPeg") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "climate" ? "1" : "0"} onClick={() => setSort("climate")}>{v4("sphSortClimate")}</button>
        <button type="button" className="c4-chip" data-on={sort === "scribe" ? "1" : "0"} onClick={() => setSort("scribe")}>{v4("sphSortScribe")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("sphTight") : v4("sphBroad")}</button>
        {SPH_CLIMATES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("sphDesk")} {climateLabel(v4, item)}</button>
        ))}
        {scribes.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={scribeFilter === name ? "1" : "0"} onClick={() => setScribeFilter(scribeFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-saphea-meta">{v4("sphSuggest")} {weaveLabel(v4, suggested)} · {latitudeHint} · {climateLabel(v4, climateHint)} · {v4("sphFair")} {fair || "—"} · {v4("sphBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-saphea-remind" aria-label={v4("sphRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-saphea-time" aria-label={v4("sphTimeline")}>
          {timeline.map((lane) => <li key={lane.latitude}>{lane.latitude} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-saphea-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSaphea(cards, { title, note, scribe, climate, weave, latitude: latitudeNo, peg: pegNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("sphEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("sphEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("sphNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("sphNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("sphScribe")} aria-required={false} value={scribe} onChange={(event) => setScribe(event.target.value)} placeholder={v4("sphScribe")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("sphDesk")} value={climate} onChange={(event) => setClimate(event.target.value)} disabled={viewer}>
          <option value="">{v4("sphBlankClimate")}</option>
          {SPH_CLIMATES.map((item) => <option key={item} value={item}>{climateLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("sphWeave")} value={weave} onChange={(event) => setWeave(event.target.value)} disabled={viewer}>
          <option value="">{v4("sphWeave")}</option>
          {WEAVES.map((item) => <option key={item} value={item}>{weaveLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("sphLatitude")} value={latitudeNo} onChange={(event) => setLatitudeNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("sphLatitude")}</option>
          {LATITUDES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("sphPeg")} value={pegNo} onChange={(event) => setPegNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("sphPeg")}</option>
          {PEGS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("sphTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("sphTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("sphAdd")}</button>
      </form>
      <form className="c4-saphea-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSapheaView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, scribe: scribeFilter, weave: weaveFilter, climate: climateFilter, latitude: latitudeFilter, peg: pegFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("sphViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("sphViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("sphSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-saphea-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setScribeFilter(view.scribe); setWeaveFilter(view.weave); setClimateFilter(view.climate); setLatitudeFilter(view.latitude); setPegFilter(view.peg); }}>{v4("sphApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSapheaView(views, view.id))}>{v4("sphDrop")}</button>
          </span>
        ))}
      </form>
      <div className="c4-saphea-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSapheaScribed(cards, picked))}>{v4("sphBulkLaid")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSapheaFelt(cards, picked))}>{v4("sphBulkFelt")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSapheaVault(cards, picked))}>{v4("sphBulkVault")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSapheaTag(cards, picked))}>{v4("sphBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("saphea-leaves.csv", sapheaCsv(shown, desk))}>{v4("sphCsv")}</button>
      </div>
      <p className="c4-saphea-keys">{v4("sphKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("sphEmpty")}</p>}
      <ul className="c4-saphea-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-saphea-card" data-on={focused?.id === card.id ? "1" : "0"} data-climate={card.climate || "blank"} data-late={lateSaphea(card, desk) ? "1" : "0"} data-idle={idleSaphea(card) ? "1" : "0"} data-brisk={briskSaphea(card) ? "1" : "0"} data-resting={restingSaphea(card) ? "1" : "0"} data-overdue={overdueSaphea(card) ? "1" : "0"} data-inner={sapheaInner(card.climate) ? "1" : "0"} data-outer={sapheaOuter(card.climate) ? "1" : "0"}>
              <label className="c4-saphea-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("sphEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editSaphea(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("sphNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editSapheaNote(cards, card.id, event.target.value))} />
                <p className="c4-saphea-meta">{card.scribe || "—"} · {climateLabel(v4, card.climate)} · {weaveLabel(v4, card.weave)} · {card.latitude ?? "—"} · {card.peg} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-saphea-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-saphea-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSapheaScribed(cards, card.id, !card.laid))}>{card.laid ? v4("sphClear") : v4("sphLay")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSapheaCloth(cards, card.id, suggested))}>{v4("sphSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSapheaSleeve(cards, card.id, !card.locked))}>{card.locked ? v4("sphUnsleeve") : v4("sphSleeveIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSapheaVault(cards, card.id, !card.held))}>{card.held ? v4("sphUnvault") : v4("sphVaultIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSapheaStar(cards, card.id, !card.starred))}>{card.starred ? v4("sphUnstar") : v4("sphStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSapheaTag(cards, card.id, "c"))}>{v4("sphTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftLatitudeFocused(cards, card.id))}>{v4("sphLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerLatitudeFocused(cards, card.id))}>{v4("sphLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(sapheaCopy(card))}>{v4("sphCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type CivicUser = { id?: string; name?: string | null; city?: string | null };

export function CivicPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CivicUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<CivicShape>("all");
  const [review, setReview] = useState<CivicReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): CivicRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      civic: { city: textField(row.city) } satisfies CivicValue,
    };
  }).filter((row): row is CivicRow => Boolean(row));
  const present = presentCivicLanes(rows);
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
    const next = readHiddenCivics(readJson(CIV_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(CIV_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedCivics(readJson(CIV_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(CIV_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleCivicLanes(present, hidden, showHidden);
  const shown = visibleCivics(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = civicLane(row.civic);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = civicLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingCivic(rows);
  const leadHue = leadingCivicHue(rows);
  const whole = rows.filter((row) => civicLane(row.civic)).length;
  const share = civicShare(laneCivicCount(rows, "house"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("civic-lanes.csv", civicLanesCsv(rows));
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
    writeJson(CIV_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(CIV_REVIEW_KEY, next);
  }

  return (
    <section className="c4-civic" aria-label={v4("civTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-civic-mast">
        <p className="c4-civic-seal" data-logo="mono">{v4("civLogo")}</p>
        <div>
          <p className="c4-civic-kicker">{v4("civSub")}</p>
          <h2 className="c4-title">{v4("civTitle")}</h2>
        </div>
        <p className="c4-civic-count">{shown.length}</p>
      </header>
      <p className="c4-civic-links">
        <Link href={crmv4Href(base, "sph")}>{v4("sphTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("civCustomer")}</Link>
      </p>
      <p className="c4-civic-hint">{v4("civHint")}</p>
      {viewer && <p className="c4-civic-note">{v4("civViewer")}</p>}
      <p className="c4-civic-meta">{v4("civLead")} {laneLabel(v4, lead)} · {v4("civToneLead")} {hueLabel(v4, leadHue)} · {v4("civShare")} {share}</p>
      <div className="c4-civic-chart" aria-label={v4("civChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-civic-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-civic-tools">
        <input ref={searchRef} className="c4-field c4-civic-search" aria-label={v4("civSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("civSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("civShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "civAll" : item === "reviewed" ? "civReviewed" : "civFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("civAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as CivicShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleCivic(hidden, item))}>{hidden.includes(item) ? v4("civShow") : v4("civHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-civic-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkCivicReview(reviewed, picked, true))}>{v4("civBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkCivicReview(reviewed, picked, false))}>{v4("civBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("civic-lanes.csv", civicLanesCsv(rows))}>{v4("civCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("civic-rows.csv", civicRowsCsv(shown, reviewed))}>{v4("civRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("civLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("civFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("civEmpty")}</p>}
      <ul className="c4-civic-list">
        {shown.map((row) => {
          const name = civicCopy(row.civic);
          const tone = civicHue(row.civic);
          return (
            <li key={row.id} className="c4-civic-card" data-lane={civicLane(row.civic) || "open"} data-hue={tone || "none"} data-house={civicHouseSafe(row.civic)} data-open={civicOpen(row.civic) ? "1" : "0"} data-even={civicEven(row.civic) ? "1" : "0"} data-digit={civicDigit(row.civic) ? "1" : "0"} data-letter={civicLetter(row.civic) ? "1" : "0"} data-mixed={civicMixed(row.civic) ? "1" : "0"} data-upper={civicUpper(row.civic) ? "1" : "0"} data-lower={civicLower(row.civic) ? "1" : "0"} data-space={civicSpace(row.civic) ? "1" : "0"} data-vowel={civicVowel(row.civic) ? "1" : "0"} data-tail={civicTail(row.civic) ? "1" : "0"} data-first={civicFirst(row.civic) ? "1" : "0"} data-held={civicHeld(row.civic) ? "1" : "0"} data-hyphen={civicHyphen(row.civic) ? "1" : "0"} data-period={civicPeriod(row.civic) ? "1" : "0"} data-capital={civicCapital(row.civic) ? "1" : "0"}>
              <label className="c4-civic-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-civic-meta">{name || v4("civOpen")} · {civicStamp(row.civic) || "—"} · {civicFamily(row.civic) || "—"} · {civicLength(row.civic) ?? "—"} · {laneLabel(v4, civicLane(row.civic))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-civic-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCivicReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("civReviewed") : v4("civReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = civicCopy(row.civic); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("civCopied") : v4("civCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("civCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function civicHouseSafe(raw: CivicValue): string {
  return civicLane(raw) === "house" ? "1" : "0";
}
