"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  MDN_KEY,
  MDN_REVIEW_KEY,
  KML_QUARTERS,
  KML_DENSITY_KEY,
  KML_KEY,
  KML_VIEW_KEY,
  addKamalTag,
  addKamalView,
  addKamal,
  briskKamal,
  bulkMeridianReview,
  bulkKamalVault,
  bulkKamalSighted,
  bulkKamalTag,
  bulkKamalWire,
  busiestSighter,
  dropKamalView,
  editKamalNote,
  editKamal,
  fairSighter,
  meridianCapital,
  meridianCopy,
  meridianDigit,
  meridianEven,
  meridianFamily,
  meridianFirst,
  meridianHeld,
  meridianHue,
  meridianHyphen,
  meridianLane,
  meridianLanes,
  meridianLanesCsv,
  meridianLength,
  meridianLetter,
  meridianLower,
  meridianMixed,
  meridianOpen,
  meridianPeriod,
  meridianRowsCsv,
  meridianShare,
  meridianSpace,
  meridianStamp,
  meridianTail,
  meridianUpper,
  meridianVowel,
  idleKamal,
  laneMeridianCount,
  lateKamal,
  leadingMeridian,
  leadingMeridianHue,
  liftSpanFocused,
  lowerPinFocused,
  lowerSpanFocused,
  moveKamalFocus,
  kamalBars,
  kamalCopy,
  kamalCounts,
  kamalCsv,
  kamalDensity,
  kamalInner,
  kamalOuter,
  kamalSighters,
  kamalTimeline,
  overdueKamal,
  presentMeridianLanes,
  raisePinFocused,
  readHiddenMeridians,
  readKamalViews,
  readKamalRules,
  readReviewedMeridians,
  reminderKamalRules,
  restingKamal,
  setKamalFocused,
  setKamalVault,
  setKamalSighted,
  setKamalSleeve,
  setKamalStar,
  setKamalCloth,
  sortKamalRules,
  starKamalFocused,
  suggestSpan,
  suggestQuarter,
  suggestFinish,
  toggleMeridian,
  toggleMeridianReview,
  visibleMeridianLanes,
  visibleMeridians,
  visibleKamalRules,
  finishFocused,
  sleeveKamalFocused,
  type MeridianReview,
  type MeridianRow,
  type MeridianShape,
  type MeridianValue,
  type KamalDensity,
  type KamalSort,
  type KamalTray,
  type KamalView,
  type Kamal,
} from "@/lib/crmv4/round308";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FINISHES = ["HEMP", "FLAX", "WIRE"] as const;
const SPANS = ["4", "8", "16", "32"] as const;
const PINS = ["1", "5", "7"] as const;

const CLIMATE_KEY: Record<string, CrmV4CopyKey> = {
  palm: "kmlPalm",
  fist: "kmlFist",
  cubit: "kmlCubit",
  fathom: "kmlFathom",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "kmlAuditSave",
  edit: "kmlAuditEdit",
  note: "kmlAuditNote",
  finish: "kmlAuditCord",
  set: "kmlAuditSet",
  clear: "kmlAuditClear",
  sheath: "kmlAuditCoil",
  resume: "kmlAuditResume",
  crypt: "kmlAuditChest",
  open: "kmlAuditOpen",
  tag: "kmlAuditTag",
  pin: "kmlAuditBead",
  span: "kmlAuditKnot",
  lower: "kmlAuditLowerKnot",
  star: "kmlAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "mdnHouse",
  fort: "mdnFort",
  harbor: "mdnHarbor",
  digit: "mdnDigit",
  spark: "mdnSpark",
  scroll: "mdnScroll",
  vowel: "mdnVowel",
  post: "mdnPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "mdnChampagne",
  ivory: "mdnIvory",
  graphite: "mdnGraphite",
};

const SHAPE_KEY: Record<MeridianShape, CrmV4CopyKey> = {
  all: "mdnShapeAll",
  house: "mdnShapeHouse",
  fort: "mdnShapeFort",
  harbor: "mdnShapeHarbor",
  digit: "mdnShapeDigit",
  spark: "mdnShapeSpark",
  scroll: "mdnShapeScroll",
  vowel: "mdnShapeVowel",
  post: "mdnShapePost",
  open: "mdnShapeOpen",
  soon: "mdnShapeSoon",
  letter: "mdnShapeLetter",
  mixed: "mdnShapeMixed",
  upper: "mdnShapeUpper",
  lower: "mdnShapeLower",
  space: "mdnShapeSpace",
  even: "mdnShapeEven",
  odd: "mdnShapeOdd",
  tail: "mdnShapeTail",
  first: "mdnShapeFirst",
  held: "mdnShapeHeld",
  hyphen: "mdnShapeHyphen",
  period: "mdnShapePeriod",
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

function quarterLabel(v4: V4, quarter: string): string {
  const key = CLIMATE_KEY[quarter];
  return key ? v4(key) : v4("kmlBlankBoard");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "HEMP") return v4("kmlHemp");
  if (finish === "FLAX") return v4("kmlFlax");
  if (finish === "WIRE") return v4("kmlWire");
  return v4("kmlAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("mdnUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("mdnUnmarked");
}

export function KamalRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Kamal[]>([]);
  const [views, setViews] = useState<KamalView[]>([]);
  const [density, setDensity] = useState<KamalDensity>("broad");
  const [tray, setTray] = useState<KamalTray>("face");
  const [query, setQuery] = useState("");
  const [sighterFilter, setSighterFilter] = useState("");
  const [finishFilter, setFinishFilter] = useState("all");
  const [quarterFilter, setQuarterFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [pinFilter, setPinFilter] = useState("all");
  const [sort, setSort] = useState<KamalSort>("quarter");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [sighter, setSighter] = useState("");
  const [quarter, setQuarter] = useState("");
  const [finish, setFinish] = useState("");
  const [spanNo, setSpanNo] = useState("");
  const [pinNo, setPinNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("palm");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readKamalRules(readJson(KML_KEY, [])));
    setViews(readKamalViews(readJson(KML_VIEW_KEY, [])));
    setDensity(kamalDensity(readJson(KML_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Kamal[]) {
    setCards(next);
    writeJson(KML_KEY, next);
  }
  function storeViews(next: KamalView[]) {
    setViews(next);
    writeJson(KML_VIEW_KEY, next);
  }
  function storeDensity(next: KamalDensity) {
    setDensity(next);
    writeJson(KML_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortKamalRules(visibleKamalRules(cards, tray, query, sighterFilter, finishFilter, quarterFilter, spanFilter, pinFilter), sort),
    [cards, tray, query, sighterFilter, finishFilter, quarterFilter, spanFilter, pinFilter, sort],
  );
  const counts = kamalCounts(cards, shown, desk);
  const bars = kamalBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = kamalTimeline(cards);
  const sighters = kamalSighters(cards);
  const suggested = suggestFinish(cards);
  const fair = fairSighter(cards, sighters.join(","));
  const busy = busiestSighter(cards);
  const reminders = reminderKamalRules(cards);
  const spanHint = suggestSpan(cards, clock);
  const quarterHint = suggestQuarter(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setSighter("");
        setQuarter("");
        setFinish("");
        setSpanNo("");
        setPinNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveKamalFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveKamalFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        store(liftSpanFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setKamalVault(cards, id, !shown[focusAt]?.held));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(finishFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(sleeveKamalFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setKamalFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("kamal-rules.csv", kamalCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starKamalFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raisePinFocused(cards, id));
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        store(lowerPinFocused(cards, id));
        return;
      }
      if (event.key === "o" || event.key === "O") {
        event.preventDefault();
        store(lowerSpanFocused(cards, id));
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
    <section className="c4-kamal" aria-label={v4("kmlTitle")} data-cards="1" data-desk={tray} data-names="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-kamal-mast">
        <p className="c4-kamal-seal" data-logo="mono">{v4("kmlLogo")}</p>
        <div>
          <p className="c4-kamal-kicker">{v4("kmlSub")}</p>
          <h2 className="c4-title">{v4("kmlTitle")}</h2>
        </div>
        <p className="c4-kamal-count">{counts.matched}</p>
      </header>
      <ol className="c4-kamal-index" aria-label={v4("kmlTitle")}>
        <li data-tone="gold">{v4("kmlBoard")} {counts.court}</li>
        <li data-tone="ink">{v4("kmlOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("kmlHouse")} {counts.house}</li>
      </ol>
      <p className="c4-kamal-links">
        <Link href={crmv4Href(base, "mdn")}>{v4("mdnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("kmlCustomers")}</Link>
      </p>
      <p className="c4-kamal-hint">{v4("kmlHint")}</p>
      {viewer && <p className="c4-kamal-note">{v4("kmlViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-kamal-notice" role="status">{v4("kmlOverdue")} {counts.overdue}</p>}
      <ol className="c4-kamal-dials" aria-label={v4("kmlChart")}>
        <li>{v4("kmlBoard")} {counts.court}</li>
        <li>{v4("kmlCoil")} {counts.sleeve}</li>
        <li>{v4("kmlChest")} {counts.vault}</li>
        <li>{v4("kmlInner")} {counts.inner}</li>
        <li>{v4("kmlOuter")} {counts.outer}</li>
        <li>{v4("kmlWide")} {counts.wide}</li>
        <li>{v4("kmlStar")} {counts.starred}</li>
        <li>{v4("kmlIdle")} {counts.idle}</li>
        <li>{v4("kmlBrisk")} {counts.brisk}</li>
        <li>{v4("kmlResting")} {counts.resting}</li>
      </ol>
      <div className="c4-kamal-chart" aria-label={v4("kmlChart")}>
        {bars.map((bar) => (
          <button key={bar.quarter} type="button" className="c4-kamal-column" data-on={quarterFilter === bar.quarter ? "1" : "0"} data-quarter={bar.quarter} onClick={() => setQuarterFilter(quarterFilter === bar.quarter ? "all" : bar.quarter)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{quarterLabel(v4, bar.quarter)}</span>
          </button>
        ))}
      </div>
      <div className="c4-kamal-tools">
        <input ref={searchRef} className="c4-field c4-kamal-search" aria-label={v4("kmlSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("kmlSearch")} />
        {(["face", "sleeve", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "face" ? "kmlBoard" : item === "sleeve" ? "kmlCoil" : "kmlChest")}</button>
        ))}
        {(["all", "inner", "outer", ...KML_QUARTERS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={quarterFilter === item ? "1" : "0"} onClick={() => setQuarterFilter(item)}>{item === "all" ? v4("kmlAll") : item === "inner" ? v4("kmlInner") : item === "outer" ? v4("kmlOuter") : quarterLabel(v4, item)}</button>
        ))}
        {(["all", ...FINISHES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={finishFilter === item ? "1" : "0"} onClick={() => setFinishFilter(item)}>{item === "all" ? v4("kmlAll") : finishLabel(v4, item)}</button>
        ))}
        {(["all", ...SPANS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={spanFilter === item ? "1" : "0"} onClick={() => setSpanFilter(item)}>{item === "all" ? v4("kmlKnot") : item}</button>
        ))}
        {(["all", ...PINS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={pinFilter === item ? "1" : "0"} onClick={() => setPinFilter(item)}>{item === "all" ? v4("kmlBead") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "quarter" ? "1" : "0"} onClick={() => setSort("quarter")}>{v4("kmlSortBoard")}</button>
        <button type="button" className="c4-chip" data-on={sort === "sighter" ? "1" : "0"} onClick={() => setSort("sighter")}>{v4("kmlSortPilot")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("kmlTight") : v4("kmlBroad")}</button>
        {KML_QUARTERS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("kmlDesk")} {quarterLabel(v4, item)}</button>
        ))}
        {sighters.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={sighterFilter === name ? "1" : "0"} onClick={() => setSighterFilter(sighterFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-kamal-meta">{v4("kmlSuggest")} {finishLabel(v4, suggested)} · {spanHint} · {quarterLabel(v4, quarterHint)} · {v4("kmlFair")} {fair || "—"} · {v4("kmlBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-kamal-remind" aria-label={v4("kmlRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-kamal-time" aria-label={v4("kmlTimeline")}>
          {timeline.map((lane) => <li key={lane.span}>{lane.span} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-kamal-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addKamal(cards, { title, note, sighter, quarter, finish, span: spanNo, pin: pinNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("kmlEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("kmlEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("kmlNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("kmlNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("kmlPilot")} aria-required={false} value={sighter} onChange={(event) => setSighter(event.target.value)} placeholder={v4("kmlPilot")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("kmlDesk")} value={quarter} onChange={(event) => setQuarter(event.target.value)} disabled={viewer}>
          <option value="">{v4("kmlBlankBoard")}</option>
          {KML_QUARTERS.map((item) => <option key={item} value={item}>{quarterLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("kmlCord")} value={finish} onChange={(event) => setFinish(event.target.value)} disabled={viewer}>
          <option value="">{v4("kmlCord")}</option>
          {FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("kmlKnot")} value={spanNo} onChange={(event) => setSpanNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("kmlKnot")}</option>
          {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("kmlBead")} value={pinNo} onChange={(event) => setPinNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("kmlBead")}</option>
          {PINS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("kmlTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("kmlTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("kmlAdd")}</button>
      </form>
      <form className="c4-kamal-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addKamalView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, sighter: sighterFilter, finish: finishFilter, quarter: quarterFilter, span: spanFilter, pin: pinFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("kmlViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("kmlViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("kmlSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-kamal-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setSighterFilter(view.sighter); setFinishFilter(view.finish); setQuarterFilter(view.quarter); setSpanFilter(view.span); setPinFilter(view.pin); }}>{v4("kmlApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropKamalView(views, view.id))}>{v4("kmlDrop")}</button>
          </span>
        ))}
      </form>
      <div className="c4-kamal-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKamalSighted(cards, picked))}>{v4("kmlBulkLaid")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKamalWire(cards, picked))}>{v4("kmlBulkWire")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKamalVault(cards, picked))}>{v4("kmlBulkCrypt")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKamalTag(cards, picked))}>{v4("kmlBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("kamal-rules.csv", kamalCsv(shown, desk))}>{v4("kmlCsv")}</button>
      </div>
      <p className="c4-kamal-keys">{v4("kmlKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("kmlEmpty")}</p>}
      <ul className="c4-kamal-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-kamal-card" data-on={focused?.id === card.id ? "1" : "0"} data-quarter={card.quarter || "blank"} data-late={lateKamal(card, desk) ? "1" : "0"} data-idle={idleKamal(card) ? "1" : "0"} data-brisk={briskKamal(card) ? "1" : "0"} data-resting={restingKamal(card) ? "1" : "0"} data-overdue={overdueKamal(card) ? "1" : "0"} data-inner={kamalInner(card.quarter) ? "1" : "0"} data-outer={kamalOuter(card.quarter) ? "1" : "0"}>
              <label className="c4-kamal-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("kmlEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editKamal(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("kmlNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editKamalNote(cards, card.id, event.target.value))} />
                <p className="c4-kamal-meta">{card.sighter || "—"} · {quarterLabel(v4, card.quarter)} · {finishLabel(v4, card.finish)} · {card.span ?? "—"} · {card.pin} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-kamal-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-kamal-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKamalSighted(cards, card.id, !card.laid))}>{card.laid ? v4("kmlClear") : v4("kmlLay")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKamalCloth(cards, card.id, suggested))}>{v4("kmlSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKamalSleeve(cards, card.id, !card.locked))}>{card.locked ? v4("kmlUncoil") : v4("kmlCoilIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKamalVault(cards, card.id, !card.held))}>{card.held ? v4("kmlUnchest") : v4("kmlChestIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKamalStar(cards, card.id, !card.starred))}>{card.starred ? v4("kmlUnstar") : v4("kmlStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addKamalTag(cards, card.id, "k"))}>{v4("kmlTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftSpanFocused(cards, card.id))}>{v4("kmlLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerSpanFocused(cards, card.id))}>{v4("kmlLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(kamalCopy(card))}>{v4("kmlCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type MeridianUser = { id?: string; name?: string | null; country?: boolean | string | number | null };

export function MeridianPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: MeridianUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<MeridianShape>("all");
  const [review, setReview] = useState<MeridianReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): MeridianRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      meridian: { country: textField(row.country) } satisfies MeridianValue,
    };
  }).filter((row): row is MeridianRow => Boolean(row));
  const present = presentMeridianLanes(rows);
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
    const next = readHiddenMeridians(readJson(MDN_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(MDN_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedMeridians(readJson(MDN_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(MDN_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleMeridianLanes(present, hidden, showHidden);
  const shown = visibleMeridians(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = meridianLane(row.meridian);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = meridianLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingMeridian(rows);
  const leadHue = leadingMeridianHue(rows);
  const whole = rows.filter((row) => meridianLane(row.meridian)).length;
  const share = meridianShare(laneMeridianCount(rows, "house"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("meridian-lanes.csv", meridianLanesCsv(rows));
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
    writeJson(MDN_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(MDN_REVIEW_KEY, next);
  }

  return (
    <section className="c4-meridian" aria-label={v4("mdnTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-meridian-mast">
        <p className="c4-meridian-seal" data-logo="mono">{v4("mdnLogo")}</p>
        <div>
          <p className="c4-meridian-kicker">{v4("mdnSub")}</p>
          <h2 className="c4-title">{v4("mdnTitle")}</h2>
        </div>
        <p className="c4-meridian-count">{shown.length}</p>
      </header>
      <p className="c4-meridian-links">
        <Link href={crmv4Href(base, "kml")}>{v4("kmlTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("mdnCustomer")}</Link>
      </p>
      <p className="c4-meridian-hint">{v4("mdnHint")}</p>
      {viewer && <p className="c4-meridian-note">{v4("mdnViewer")}</p>}
      <p className="c4-meridian-meta">{v4("mdnLead")} {laneLabel(v4, lead)} · {v4("mdnToneLead")} {hueLabel(v4, leadHue)} · {v4("mdnShare")} {share}</p>
      <div className="c4-meridian-chart" aria-label={v4("mdnChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-meridian-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-meridian-tools">
        <input ref={searchRef} className="c4-field c4-meridian-search" aria-label={v4("mdnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("mdnSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("mdnShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "mdnAll" : item === "reviewed" ? "mdnReviewed" : "mdnFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("mdnAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as MeridianShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleMeridian(hidden, item))}>{hidden.includes(item) ? v4("mdnShow") : v4("mdnHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-meridian-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkMeridianReview(reviewed, picked, true))}>{v4("mdnBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkMeridianReview(reviewed, picked, false))}>{v4("mdnBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("meridian-lanes.csv", meridianLanesCsv(rows))}>{v4("mdnCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("meridian-rows.csv", meridianRowsCsv(shown, reviewed))}>{v4("mdnRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("mdnLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("mdnFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("mdnEmpty")}</p>}
      <ul className="c4-meridian-list">
        {shown.map((row) => {
          const name = meridianCopy(row.meridian);
          const tone = meridianHue(row.meridian);
          return (
            <li key={row.id} className="c4-meridian-card" data-lane={meridianLane(row.meridian) || "open"} data-hue={tone || "none"} data-house={meridianHouseSafe(row.meridian)} data-open={meridianOpen(row.meridian) ? "1" : "0"} data-even={meridianEven(row.meridian) ? "1" : "0"} data-digit={meridianDigit(row.meridian) ? "1" : "0"} data-letter={meridianLetter(row.meridian) ? "1" : "0"} data-mixed={meridianMixed(row.meridian) ? "1" : "0"} data-upper={meridianUpper(row.meridian) ? "1" : "0"} data-lower={meridianLower(row.meridian) ? "1" : "0"} data-space={meridianSpace(row.meridian) ? "1" : "0"} data-vowel={meridianVowel(row.meridian) ? "1" : "0"} data-tail={meridianTail(row.meridian) ? "1" : "0"} data-first={meridianFirst(row.meridian) ? "1" : "0"} data-held={meridianHeld(row.meridian) ? "1" : "0"} data-hyphen={meridianHyphen(row.meridian) ? "1" : "0"} data-period={meridianPeriod(row.meridian) ? "1" : "0"} data-capital={meridianCapital(row.meridian) ? "1" : "0"}>
              <label className="c4-meridian-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-meridian-meta">{name || v4("mdnOpen")} · {meridianStamp(row.meridian) || "—"} · {meridianFamily(row.meridian) || "—"} · {meridianLength(row.meridian) ?? "—"} · {laneLabel(v4, meridianLane(row.meridian))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-meridian-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleMeridianReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("mdnReviewed") : v4("mdnReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = meridianCopy(row.meridian); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("mdnCopied") : v4("mdnCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("mdnCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function meridianHouseSafe(raw: MeridianValue): string {
  return meridianLane(raw) === "house" ? "1" : "0";
}
