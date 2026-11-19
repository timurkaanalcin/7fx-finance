"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  PEL_KEY,
  PEL_REVIEW_KEY,
  ARM_QUARTERS,
  ARM_DENSITY_KEY,
  ARM_KEY,
  ARM_VIEW_KEY,
  addArmillaryTag,
  addArmillaryView,
  addArmillary,
  briskArmillary,
  bulkPelorusReview,
  bulkArmillaryVault,
  bulkArmillarySighted,
  bulkArmillaryTag,
  bulkArmillaryBone,
  busiestSighter,
  dropArmillaryView,
  editArmillaryNote,
  editArmillary,
  fairSighter,
  pelorusCapital,
  pelorusCopy,
  pelorusDigit,
  pelorusEven,
  pelorusFamily,
  pelorusFirst,
  pelorusHeld,
  pelorusHue,
  pelorusHyphen,
  pelorusLane,
  pelorusLanes,
  pelorusLanesCsv,
  pelorusLength,
  pelorusLetter,
  pelorusLower,
  pelorusMixed,
  pelorusOpen,
  pelorusPeriod,
  pelorusRowsCsv,
  pelorusShare,
  pelorusSpace,
  pelorusStamp,
  pelorusTail,
  pelorusUpper,
  pelorusVowel,
  idleArmillary,
  lanePelorusCount,
  lateArmillary,
  leadingPelorus,
  leadingPelorusHue,
  liftSpanFocused,
  lowerPinFocused,
  lowerSpanFocused,
  moveArmillaryFocus,
  armillaryBars,
  armillaryCopy,
  armillaryCounts,
  armillaryCsv,
  armillaryDensity,
  armillaryInner,
  armillaryOuter,
  armillarySighters,
  armillaryTimeline,
  overdueArmillary,
  presentPelorusLanes,
  raisePinFocused,
  readHiddenPeloruss,
  readArmillaryViews,
  readArmillaryRules,
  readReviewedPeloruss,
  reminderArmillaryRules,
  restingArmillary,
  setArmillaryFocused,
  setArmillaryVault,
  setArmillarySighted,
  setArmillarySleeve,
  setArmillaryStar,
  setArmillaryCloth,
  sortArmillaryRules,
  starArmillaryFocused,
  suggestSpan,
  suggestQuarter,
  suggestFinish,
  togglePelorus,
  togglePelorusReview,
  visiblePelorusLanes,
  visiblePeloruss,
  visibleArmillaryRules,
  finishFocused,
  sleeveArmillaryFocused,
  type PelorusReview,
  type PelorusRow,
  type PelorusShape,
  type PelorusValue,
  type ArmillaryDensity,
  type ArmillarySort,
  type ArmillaryTray,
  type ArmillaryView,
  type Armillary,
} from "@/lib/crmv4/round306";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FINISHES = ["SILK", "WOOL", "GILT"] as const;
const SPANS = ["8", "16", "32", "64"] as const;
const PINS = ["2", "4", "8"] as const;

const CLIMATE_KEY: Record<string, CrmV4CopyKey> = {
  east: "armEast",
  south: "armSouth",
  west: "armWest",
  north: "armNorth",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "armAuditSave",
  edit: "armAuditEdit",
  note: "armAuditNote",
  finish: "armAuditFinish",
  set: "armAuditSet",
  clear: "armAuditClear",
  sheath: "armAuditSheath",
  resume: "armAuditResume",
  crypt: "armAuditCrypt",
  open: "armAuditOpen",
  tag: "armAuditTag",
  pin: "armAuditPin",
  span: "armAuditSpan",
  lower: "armAuditLower",
  star: "armAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "pelHouse",
  fort: "pelFort",
  harbor: "pelHarbor",
  digit: "pelDigit",
  spark: "pelSpark",
  scroll: "pelScroll",
  vowel: "pelVowel",
  post: "pelPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "pelChampagne",
  ivory: "pelIvory",
  graphite: "pelGraphite",
};

const SHAPE_KEY: Record<PelorusShape, CrmV4CopyKey> = {
  all: "pelShapeAll",
  house: "pelShapeHouse",
  fort: "pelShapeFort",
  harbor: "pelShapeHarbor",
  digit: "pelShapeDigit",
  spark: "pelShapeSpark",
  scroll: "pelShapeScroll",
  vowel: "pelShapeVowel",
  post: "pelShapePost",
  open: "pelShapeOpen",
  soon: "pelShapeSoon",
  letter: "pelShapeLetter",
  mixed: "pelShapeMixed",
  upper: "pelShapeUpper",
  lower: "pelShapeLower",
  space: "pelShapeSpace",
  even: "pelShapeEven",
  odd: "pelShapeOdd",
  tail: "pelShapeTail",
  first: "pelShapeFirst",
  held: "pelShapeHeld",
  hyphen: "pelShapeHyphen",
  period: "pelShapePeriod",
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
  return key ? v4(key) : v4("armBlankQuarter");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "SILK") return v4("armSilk");
  if (finish === "WOOL") return v4("armWool");
  if (finish === "GILT") return v4("armGilt");
  return v4("armAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("pelUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("pelUnmarked");
}

export function ArmillaryRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Armillary[]>([]);
  const [views, setViews] = useState<ArmillaryView[]>([]);
  const [density, setDensity] = useState<ArmillaryDensity>("broad");
  const [tray, setTray] = useState<ArmillaryTray>("ring");
  const [query, setQuery] = useState("");
  const [sighterFilter, setSighterFilter] = useState("");
  const [finishFilter, setFinishFilter] = useState("all");
  const [quarterFilter, setQuarterFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [pinFilter, setPinFilter] = useState("all");
  const [sort, setSort] = useState<ArmillarySort>("quarter");
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
  const [desk, setDesk] = useState("east");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readArmillaryRules(readJson(ARM_KEY, [])));
    setViews(readArmillaryViews(readJson(ARM_VIEW_KEY, [])));
    setDensity(armillaryDensity(readJson(ARM_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Armillary[]) {
    setCards(next);
    writeJson(ARM_KEY, next);
  }
  function storeViews(next: ArmillaryView[]) {
    setViews(next);
    writeJson(ARM_VIEW_KEY, next);
  }
  function storeDensity(next: ArmillaryDensity) {
    setDensity(next);
    writeJson(ARM_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortArmillaryRules(visibleArmillaryRules(cards, tray, query, sighterFilter, finishFilter, quarterFilter, spanFilter, pinFilter), sort),
    [cards, tray, query, sighterFilter, finishFilter, quarterFilter, spanFilter, pinFilter, sort],
  );
  const counts = armillaryCounts(cards, shown, desk);
  const bars = armillaryBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = armillaryTimeline(cards);
  const sighters = armillarySighters(cards);
  const suggested = suggestFinish(cards);
  const fair = fairSighter(cards, sighters.join(","));
  const busy = busiestSighter(cards);
  const reminders = reminderArmillaryRules(cards);
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
        setFocusAt((index) => moveArmillaryFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveArmillaryFocus(index, shown.length, -1));
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
        store(setArmillaryVault(cards, id, !shown[focusAt]?.held));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(finishFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(sleeveArmillaryFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setArmillaryFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("armillary-rules.csv", armillaryCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starArmillaryFocused(cards, id));
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
    <section className="c4-armillary" aria-label={v4("armTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-armillary-mast">
        <p className="c4-armillary-seal" data-logo="mono">{v4("armLogo")}</p>
        <div>
          <p className="c4-armillary-kicker">{v4("armSub")}</p>
          <h2 className="c4-title">{v4("armTitle")}</h2>
        </div>
        <p className="c4-armillary-count">{counts.matched}</p>
      </header>
      <ol className="c4-armillary-index" aria-label={v4("armTitle")}>
        <li data-tone="gold">{v4("armRing")} {counts.court}</li>
        <li data-tone="ink">{v4("armOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("armHouse")} {counts.house}</li>
      </ol>
      <p className="c4-armillary-links">
        <Link href={crmv4Href(base, "pel")}>{v4("pelTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("armCustomers")}</Link>
      </p>
      <p className="c4-armillary-hint">{v4("armHint")}</p>
      {viewer && <p className="c4-armillary-note">{v4("armViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-armillary-notice" role="status">{v4("armOverdue")} {counts.overdue}</p>}
      <ol className="c4-armillary-dials" aria-label={v4("armChart")}>
        <li>{v4("armRing")} {counts.court}</li>
        <li>{v4("armCase")} {counts.sleeve}</li>
        <li>{v4("armChest")} {counts.vault}</li>
        <li>{v4("armInner")} {counts.inner}</li>
        <li>{v4("armOuter")} {counts.outer}</li>
        <li>{v4("armWide")} {counts.wide}</li>
        <li>{v4("armStar")} {counts.starred}</li>
        <li>{v4("armIdle")} {counts.idle}</li>
        <li>{v4("armBrisk")} {counts.brisk}</li>
        <li>{v4("armResting")} {counts.resting}</li>
      </ol>
      <div className="c4-armillary-chart" aria-label={v4("armChart")}>
        {bars.map((bar) => (
          <button key={bar.quarter} type="button" className="c4-armillary-column" data-on={quarterFilter === bar.quarter ? "1" : "0"} data-quarter={bar.quarter} onClick={() => setQuarterFilter(quarterFilter === bar.quarter ? "all" : bar.quarter)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{quarterLabel(v4, bar.quarter)}</span>
          </button>
        ))}
      </div>
      <div className="c4-armillary-tools">
        <input ref={searchRef} className="c4-field c4-armillary-search" aria-label={v4("armSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("armSearch")} />
        {(["ring", "case", "chest"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "ring" ? "armRing" : item === "case" ? "armCase" : "armChest")}</button>
        ))}
        {(["all", "inner", "outer", ...ARM_QUARTERS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={quarterFilter === item ? "1" : "0"} onClick={() => setQuarterFilter(item)}>{item === "all" ? v4("armAll") : item === "inner" ? v4("armInner") : item === "outer" ? v4("armOuter") : quarterLabel(v4, item)}</button>
        ))}
        {(["all", ...FINISHES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={finishFilter === item ? "1" : "0"} onClick={() => setFinishFilter(item)}>{item === "all" ? v4("armAll") : finishLabel(v4, item)}</button>
        ))}
        {(["all", ...SPANS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={spanFilter === item ? "1" : "0"} onClick={() => setSpanFilter(item)}>{item === "all" ? v4("armSpan") : item}</button>
        ))}
        {(["all", ...PINS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={pinFilter === item ? "1" : "0"} onClick={() => setPinFilter(item)}>{item === "all" ? v4("armPin") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "quarter" ? "1" : "0"} onClick={() => setSort("quarter")}>{v4("armSortQuarter")}</button>
        <button type="button" className="c4-chip" data-on={sort === "sighter" ? "1" : "0"} onClick={() => setSort("sighter")}>{v4("armSortSight")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("armTight") : v4("armBroad")}</button>
        {ARM_QUARTERS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("armDesk")} {quarterLabel(v4, item)}</button>
        ))}
        {sighters.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={sighterFilter === name ? "1" : "0"} onClick={() => setSighterFilter(sighterFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-armillary-meta">{v4("armSuggest")} {finishLabel(v4, suggested)} · {spanHint} · {quarterLabel(v4, quarterHint)} · {v4("armFair")} {fair || "—"} · {v4("armBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-armillary-remind" aria-label={v4("armRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-armillary-time" aria-label={v4("armTimeline")}>
          {timeline.map((lane) => <li key={lane.span}>{lane.span} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-armillary-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addArmillary(cards, { title, note, sighter, quarter, finish, span: spanNo, pin: pinNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("armEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("armEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("armNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("armNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("armSight")} aria-required={false} value={sighter} onChange={(event) => setSighter(event.target.value)} placeholder={v4("armSight")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("armDesk")} value={quarter} onChange={(event) => setQuarter(event.target.value)} disabled={viewer}>
          <option value="">{v4("armBlankQuarter")}</option>
          {ARM_QUARTERS.map((item) => <option key={item} value={item}>{quarterLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("armFinish")} value={finish} onChange={(event) => setFinish(event.target.value)} disabled={viewer}>
          <option value="">{v4("armFinish")}</option>
          {FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("armSpan")} value={spanNo} onChange={(event) => setSpanNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("armSpan")}</option>
          {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("armPin")} value={pinNo} onChange={(event) => setPinNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("armPin")}</option>
          {PINS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("armTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("armTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("armAdd")}</button>
      </form>
      <form className="c4-armillary-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addArmillaryView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, sighter: sighterFilter, finish: finishFilter, quarter: quarterFilter, span: spanFilter, pin: pinFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("armViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("armViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("armSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-armillary-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setSighterFilter(view.sighter); setFinishFilter(view.finish); setQuarterFilter(view.quarter); setSpanFilter(view.span); setPinFilter(view.pin); }}>{v4("armApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropArmillaryView(views, view.id))}>{v4("armDrop")}</button>
          </span>
        ))}
      </form>
      <div className="c4-armillary-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkArmillarySighted(cards, picked))}>{v4("armBulkLaid")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkArmillaryBone(cards, picked))}>{v4("armBulkGilt")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkArmillaryVault(cards, picked))}>{v4("armBulkCrypt")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkArmillaryTag(cards, picked))}>{v4("armBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("armillary-rules.csv", armillaryCsv(shown, desk))}>{v4("armCsv")}</button>
      </div>
      <p className="c4-armillary-keys">{v4("armKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("armEmpty")}</p>}
      <ul className="c4-armillary-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-armillary-card" data-on={focused?.id === card.id ? "1" : "0"} data-quarter={card.quarter || "blank"} data-late={lateArmillary(card, desk) ? "1" : "0"} data-idle={idleArmillary(card) ? "1" : "0"} data-brisk={briskArmillary(card) ? "1" : "0"} data-resting={restingArmillary(card) ? "1" : "0"} data-overdue={overdueArmillary(card) ? "1" : "0"} data-inner={armillaryInner(card.quarter) ? "1" : "0"} data-outer={armillaryOuter(card.quarter) ? "1" : "0"}>
              <label className="c4-armillary-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("armEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editArmillary(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("armNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editArmillaryNote(cards, card.id, event.target.value))} />
                <p className="c4-armillary-meta">{card.sighter || "—"} · {quarterLabel(v4, card.quarter)} · {finishLabel(v4, card.finish)} · {card.span ?? "—"} · {card.pin} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-armillary-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-armillary-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArmillarySighted(cards, card.id, !card.laid))}>{card.laid ? v4("armClear") : v4("armLay")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArmillaryCloth(cards, card.id, suggested))}>{v4("armSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArmillarySleeve(cards, card.id, !card.locked))}>{card.locked ? v4("armUnsleeve") : v4("armSheathIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArmillaryVault(cards, card.id, !card.held))}>{card.held ? v4("armUnvault") : v4("armCryptIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArmillaryStar(cards, card.id, !card.starred))}>{card.starred ? v4("armUnstar") : v4("armStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addArmillaryTag(cards, card.id, "e"))}>{v4("armTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftSpanFocused(cards, card.id))}>{v4("armLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerSpanFocused(cards, card.id))}>{v4("armLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(armillaryCopy(card))}>{v4("armCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type PelorusUser = { id?: string; name?: string | null; leadInvalid?: boolean | string | number | null };

export function PelorusPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: PelorusUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<PelorusShape>("all");
  const [review, setReview] = useState<PelorusReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): PelorusRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      pelorus: { leadInvalid: textField(row.leadInvalid) } satisfies PelorusValue,
    };
  }).filter((row): row is PelorusRow => Boolean(row));
  const present = presentPelorusLanes(rows);
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
    const next = readHiddenPeloruss(readJson(PEL_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(PEL_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedPeloruss(readJson(PEL_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(PEL_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visiblePelorusLanes(present, hidden, showHidden);
  const shown = visiblePeloruss(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = pelorusLane(row.pelorus);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = pelorusLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingPelorus(rows);
  const leadHue = leadingPelorusHue(rows);
  const whole = rows.filter((row) => pelorusLane(row.pelorus)).length;
  const share = pelorusShare(lanePelorusCount(rows, "house"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("pelorus-lanes.csv", pelorusLanesCsv(rows));
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
    writeJson(PEL_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(PEL_REVIEW_KEY, next);
  }

  return (
    <section className="c4-pelorus" aria-label={v4("pelTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-pelorus-mast">
        <p className="c4-pelorus-seal" data-logo="mono">{v4("pelLogo")}</p>
        <div>
          <p className="c4-pelorus-kicker">{v4("pelSub")}</p>
          <h2 className="c4-title">{v4("pelTitle")}</h2>
        </div>
        <p className="c4-pelorus-count">{shown.length}</p>
      </header>
      <p className="c4-pelorus-links">
        <Link href={crmv4Href(base, "arm")}>{v4("armTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("pelCustomer")}</Link>
      </p>
      <p className="c4-pelorus-hint">{v4("pelHint")}</p>
      {viewer && <p className="c4-pelorus-note">{v4("pelViewer")}</p>}
      <p className="c4-pelorus-meta">{v4("pelLead")} {laneLabel(v4, lead)} · {v4("pelToneLead")} {hueLabel(v4, leadHue)} · {v4("pelShare")} {share}</p>
      <div className="c4-pelorus-chart" aria-label={v4("pelChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-pelorus-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-pelorus-tools">
        <input ref={searchRef} className="c4-field c4-pelorus-search" aria-label={v4("pelSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("pelSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("pelShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "pelAll" : item === "reviewed" ? "pelReviewed" : "pelFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("pelAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as PelorusShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(togglePelorus(hidden, item))}>{hidden.includes(item) ? v4("pelShow") : v4("pelHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-pelorus-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkPelorusReview(reviewed, picked, true))}>{v4("pelBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkPelorusReview(reviewed, picked, false))}>{v4("pelBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("pelorus-lanes.csv", pelorusLanesCsv(rows))}>{v4("pelCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("pelorus-rows.csv", pelorusRowsCsv(shown, reviewed))}>{v4("pelRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("pelLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("pelFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("pelEmpty")}</p>}
      <ul className="c4-pelorus-list">
        {shown.map((row) => {
          const name = pelorusCopy(row.pelorus);
          const tone = pelorusHue(row.pelorus);
          return (
            <li key={row.id} className="c4-pelorus-card" data-lane={pelorusLane(row.pelorus) || "open"} data-hue={tone || "none"} data-house={pelorusHouseSafe(row.pelorus)} data-open={pelorusOpen(row.pelorus) ? "1" : "0"} data-even={pelorusEven(row.pelorus) ? "1" : "0"} data-digit={pelorusDigit(row.pelorus) ? "1" : "0"} data-letter={pelorusLetter(row.pelorus) ? "1" : "0"} data-mixed={pelorusMixed(row.pelorus) ? "1" : "0"} data-upper={pelorusUpper(row.pelorus) ? "1" : "0"} data-lower={pelorusLower(row.pelorus) ? "1" : "0"} data-space={pelorusSpace(row.pelorus) ? "1" : "0"} data-vowel={pelorusVowel(row.pelorus) ? "1" : "0"} data-tail={pelorusTail(row.pelorus) ? "1" : "0"} data-first={pelorusFirst(row.pelorus) ? "1" : "0"} data-held={pelorusHeld(row.pelorus) ? "1" : "0"} data-hyphen={pelorusHyphen(row.pelorus) ? "1" : "0"} data-period={pelorusPeriod(row.pelorus) ? "1" : "0"} data-capital={pelorusCapital(row.pelorus) ? "1" : "0"}>
              <label className="c4-pelorus-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-pelorus-meta">{name || v4("pelOpen")} · {pelorusStamp(row.pelorus) || "—"} · {pelorusFamily(row.pelorus) || "—"} · {pelorusLength(row.pelorus) ?? "—"} · {laneLabel(v4, pelorusLane(row.pelorus))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-pelorus-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(togglePelorusReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("pelReviewed") : v4("pelReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = pelorusCopy(row.pelorus); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("pelCopied") : v4("pelCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("pelCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function pelorusHouseSafe(raw: PelorusValue): string {
  return pelorusLane(raw) === "house" ? "1" : "0";
}
