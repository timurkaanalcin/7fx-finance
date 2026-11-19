"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  SPC_KEY,
  SPC_REVIEW_KEY,
  ALD_QUARTERS,
  ALD_DENSITY_KEY,
  ALD_KEY,
  ALD_VIEW_KEY,
  addAlidadeTag,
  addAlidadeView,
  addAlidade,
  briskAlidade,
  bulkSpecimenReview,
  bulkAlidadeVault,
  bulkAlidadeSighted,
  bulkAlidadeTag,
  bulkAlidadeBone,
  busiestSighter,
  dropAlidadeView,
  editAlidadeNote,
  editAlidade,
  fairSighter,
  specimenCapital,
  specimenCopy,
  specimenDigit,
  specimenEven,
  specimenFamily,
  specimenFirst,
  specimenHeld,
  specimenHue,
  specimenHyphen,
  specimenLane,
  specimenLanes,
  specimenLanesCsv,
  specimenLength,
  specimenLetter,
  specimenLower,
  specimenMixed,
  specimenOpen,
  specimenPeriod,
  specimenRowsCsv,
  specimenShare,
  specimenSpace,
  specimenStamp,
  specimenTail,
  specimenUpper,
  specimenVowel,
  idleAlidade,
  laneSpecimenCount,
  lateAlidade,
  leadingSpecimen,
  leadingSpecimenHue,
  liftSpanFocused,
  lowerPinFocused,
  lowerSpanFocused,
  moveAlidadeFocus,
  alidadeBars,
  alidadeCopy,
  alidadeCounts,
  alidadeCsv,
  alidadeDensity,
  alidadeInner,
  alidadeOuter,
  alidadeSighters,
  alidadeTimeline,
  overdueAlidade,
  presentSpecimenLanes,
  raisePinFocused,
  readHiddenSpecimens,
  readAlidadeViews,
  readAlidadeRules,
  readReviewedSpecimens,
  reminderAlidadeRules,
  restingAlidade,
  setAlidadeFocused,
  setAlidadeVault,
  setAlidadeSighted,
  setAlidadeSleeve,
  setAlidadeStar,
  setAlidadeCloth,
  sortAlidadeRules,
  starAlidadeFocused,
  suggestSpan,
  suggestQuarter,
  suggestFinish,
  toggleSpecimen,
  toggleSpecimenReview,
  visibleSpecimenLanes,
  visibleSpecimens,
  visibleAlidadeRules,
  finishFocused,
  sleeveAlidadeFocused,
  type SpecimenReview,
  type SpecimenRow,
  type SpecimenShape,
  type SpecimenValue,
  type AlidadeDensity,
  type AlidadeSort,
  type AlidadeTray,
  type AlidadeView,
  type Alidade,
} from "@/lib/crmv4/round305";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FINISHES = ["LINEN", "INK", "GILT"] as const;
const SPANS = ["12", "24", "48", "96"] as const;
const PINS = ["3", "6", "9"] as const;

const CLIMATE_KEY: Record<string, CrmV4CopyKey> = {
  rise: "aldRise",
  crest: "aldCrest",
  gloam: "aldGloam",
  dark: "aldDark",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "aldAuditSave",
  edit: "aldAuditEdit",
  note: "aldAuditNote",
  finish: "aldAuditFinish",
  set: "aldAuditSet",
  clear: "aldAuditClear",
  sheath: "aldAuditSheath",
  resume: "aldAuditResume",
  crypt: "aldAuditCrypt",
  open: "aldAuditOpen",
  tag: "aldAuditTag",
  pin: "aldAuditPin",
  span: "aldAuditSpan",
  lower: "aldAuditLower",
  star: "aldAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "spcHouse",
  fort: "spcFort",
  harbor: "spcHarbor",
  digit: "spcDigit",
  spark: "spcSpark",
  scroll: "spcScroll",
  vowel: "spcVowel",
  post: "spcPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "spcChampagne",
  ivory: "spcIvory",
  graphite: "spcGraphite",
};

const SHAPE_KEY: Record<SpecimenShape, CrmV4CopyKey> = {
  all: "spcShapeAll",
  house: "spcShapeHouse",
  fort: "spcShapeFort",
  harbor: "spcShapeHarbor",
  digit: "spcShapeDigit",
  spark: "spcShapeSpark",
  scroll: "spcShapeScroll",
  vowel: "spcShapeVowel",
  post: "spcShapePost",
  open: "spcShapeOpen",
  soon: "spcShapeSoon",
  letter: "spcShapeLetter",
  mixed: "spcShapeMixed",
  upper: "spcShapeUpper",
  lower: "spcShapeLower",
  space: "spcShapeSpace",
  even: "spcShapeEven",
  odd: "spcShapeOdd",
  tail: "spcShapeTail",
  first: "spcShapeFirst",
  held: "spcShapeHeld",
  hyphen: "spcShapeHyphen",
  period: "spcShapePeriod",
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
  return key ? v4(key) : v4("aldBlankQuarter");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "LINEN") return v4("aldLinen");
  if (finish === "INK") return v4("aldInk");
  if (finish === "GILT") return v4("aldGilt");
  return v4("aldAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("spcUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("spcUnmarked");
}

export function AlidadeRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Alidade[]>([]);
  const [views, setViews] = useState<AlidadeView[]>([]);
  const [density, setDensity] = useState<AlidadeDensity>("broad");
  const [tray, setTray] = useState<AlidadeTray>("yard");
  const [query, setQuery] = useState("");
  const [sighterFilter, setSighterFilter] = useState("");
  const [finishFilter, setFinishFilter] = useState("all");
  const [quarterFilter, setQuarterFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [pinFilter, setPinFilter] = useState("all");
  const [sort, setSort] = useState<AlidadeSort>("quarter");
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
  const [desk, setDesk] = useState("rise");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readAlidadeRules(readJson(ALD_KEY, [])));
    setViews(readAlidadeViews(readJson(ALD_VIEW_KEY, [])));
    setDensity(alidadeDensity(readJson(ALD_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Alidade[]) {
    setCards(next);
    writeJson(ALD_KEY, next);
  }
  function storeViews(next: AlidadeView[]) {
    setViews(next);
    writeJson(ALD_VIEW_KEY, next);
  }
  function storeDensity(next: AlidadeDensity) {
    setDensity(next);
    writeJson(ALD_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortAlidadeRules(visibleAlidadeRules(cards, tray, query, sighterFilter, finishFilter, quarterFilter, spanFilter, pinFilter), sort),
    [cards, tray, query, sighterFilter, finishFilter, quarterFilter, spanFilter, pinFilter, sort],
  );
  const counts = alidadeCounts(cards, shown, desk);
  const bars = alidadeBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = alidadeTimeline(cards);
  const sighters = alidadeSighters(cards);
  const suggested = suggestFinish(cards);
  const fair = fairSighter(cards, sighters.join(","));
  const busy = busiestSighter(cards);
  const reminders = reminderAlidadeRules(cards);
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
        setFocusAt((index) => moveAlidadeFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveAlidadeFocus(index, shown.length, -1));
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
        store(setAlidadeVault(cards, id, !shown[focusAt]?.held));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(finishFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(sleeveAlidadeFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setAlidadeFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("alidade-rules.csv", alidadeCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starAlidadeFocused(cards, id));
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
    <section className="c4-alidade" aria-label={v4("aldTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-alidade-mast">
        <p className="c4-alidade-seal" data-logo="mono">{v4("aldLogo")}</p>
        <div>
          <p className="c4-alidade-kicker">{v4("aldSub")}</p>
          <h2 className="c4-title">{v4("aldTitle")}</h2>
        </div>
        <p className="c4-alidade-count">{counts.matched}</p>
      </header>
      <ol className="c4-alidade-index" aria-label={v4("aldTitle")}>
        <li data-tone="gold">{v4("aldCourt")} {counts.court}</li>
        <li data-tone="ink">{v4("aldOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("aldHouse")} {counts.house}</li>
      </ol>
      <p className="c4-alidade-links">
        <Link href={crmv4Href(base, "spc")}>{v4("spcTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("aldCustomers")}</Link>
      </p>
      <p className="c4-alidade-hint">{v4("aldHint")}</p>
      {viewer && <p className="c4-alidade-note">{v4("aldViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-alidade-notice" role="status">{v4("aldOverdue")} {counts.overdue}</p>}
      <ol className="c4-alidade-dials" aria-label={v4("aldChart")}>
        <li>{v4("aldCourt")} {counts.court}</li>
        <li>{v4("aldSheath")} {counts.sleeve}</li>
        <li>{v4("aldCrypt")} {counts.vault}</li>
        <li>{v4("aldInner")} {counts.inner}</li>
        <li>{v4("aldOuter")} {counts.outer}</li>
        <li>{v4("aldWide")} {counts.wide}</li>
        <li>{v4("aldStar")} {counts.starred}</li>
        <li>{v4("aldIdle")} {counts.idle}</li>
        <li>{v4("aldBrisk")} {counts.brisk}</li>
        <li>{v4("aldResting")} {counts.resting}</li>
      </ol>
      <div className="c4-alidade-chart" aria-label={v4("aldChart")}>
        {bars.map((bar) => (
          <button key={bar.quarter} type="button" className="c4-alidade-column" data-on={quarterFilter === bar.quarter ? "1" : "0"} data-quarter={bar.quarter} onClick={() => setQuarterFilter(quarterFilter === bar.quarter ? "all" : bar.quarter)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{quarterLabel(v4, bar.quarter)}</span>
          </button>
        ))}
      </div>
      <div className="c4-alidade-tools">
        <input ref={searchRef} className="c4-field c4-alidade-search" aria-label={v4("aldSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("aldSearch")} />
        {(["yard", "sheath", "crypt"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "yard" ? "aldCourt" : item === "sheath" ? "aldSheath" : "aldCrypt")}</button>
        ))}
        {(["all", "inner", "outer", ...ALD_QUARTERS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={quarterFilter === item ? "1" : "0"} onClick={() => setQuarterFilter(item)}>{item === "all" ? v4("aldAll") : item === "inner" ? v4("aldInner") : item === "outer" ? v4("aldOuter") : quarterLabel(v4, item)}</button>
        ))}
        {(["all", ...FINISHES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={finishFilter === item ? "1" : "0"} onClick={() => setFinishFilter(item)}>{item === "all" ? v4("aldAll") : finishLabel(v4, item)}</button>
        ))}
        {(["all", ...SPANS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={spanFilter === item ? "1" : "0"} onClick={() => setSpanFilter(item)}>{item === "all" ? v4("aldSpan") : item}</button>
        ))}
        {(["all", ...PINS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={pinFilter === item ? "1" : "0"} onClick={() => setPinFilter(item)}>{item === "all" ? v4("aldPin") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "quarter" ? "1" : "0"} onClick={() => setSort("quarter")}>{v4("aldSortQuarter")}</button>
        <button type="button" className="c4-chip" data-on={sort === "sighter" ? "1" : "0"} onClick={() => setSort("sighter")}>{v4("aldSortSight")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("aldTight") : v4("aldBroad")}</button>
        {ALD_QUARTERS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("aldDesk")} {quarterLabel(v4, item)}</button>
        ))}
        {sighters.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={sighterFilter === name ? "1" : "0"} onClick={() => setSighterFilter(sighterFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-alidade-meta">{v4("aldSuggest")} {finishLabel(v4, suggested)} · {spanHint} · {quarterLabel(v4, quarterHint)} · {v4("aldFair")} {fair || "—"} · {v4("aldBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-alidade-remind" aria-label={v4("aldRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-alidade-time" aria-label={v4("aldTimeline")}>
          {timeline.map((lane) => <li key={lane.span}>{lane.span} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-alidade-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addAlidade(cards, { title, note, sighter, quarter, finish, span: spanNo, pin: pinNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("aldEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("aldEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("aldNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("aldNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("aldSight")} aria-required={false} value={sighter} onChange={(event) => setSighter(event.target.value)} placeholder={v4("aldSight")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("aldDesk")} value={quarter} onChange={(event) => setQuarter(event.target.value)} disabled={viewer}>
          <option value="">{v4("aldBlankQuarter")}</option>
          {ALD_QUARTERS.map((item) => <option key={item} value={item}>{quarterLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("aldFinish")} value={finish} onChange={(event) => setFinish(event.target.value)} disabled={viewer}>
          <option value="">{v4("aldFinish")}</option>
          {FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("aldSpan")} value={spanNo} onChange={(event) => setSpanNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("aldSpan")}</option>
          {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("aldPin")} value={pinNo} onChange={(event) => setPinNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("aldPin")}</option>
          {PINS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("aldTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("aldTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("aldAdd")}</button>
      </form>
      <form className="c4-alidade-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addAlidadeView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, sighter: sighterFilter, finish: finishFilter, quarter: quarterFilter, span: spanFilter, pin: pinFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("aldViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("aldViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("aldSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-alidade-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setSighterFilter(view.sighter); setFinishFilter(view.finish); setQuarterFilter(view.quarter); setSpanFilter(view.span); setPinFilter(view.pin); }}>{v4("aldApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropAlidadeView(views, view.id))}>{v4("aldDrop")}</button>
          </span>
        ))}
      </form>
      <div className="c4-alidade-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAlidadeSighted(cards, picked))}>{v4("aldBulkLaid")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAlidadeBone(cards, picked))}>{v4("aldBulkGilt")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAlidadeVault(cards, picked))}>{v4("aldBulkCrypt")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAlidadeTag(cards, picked))}>{v4("aldBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("alidade-rules.csv", alidadeCsv(shown, desk))}>{v4("aldCsv")}</button>
      </div>
      <p className="c4-alidade-keys">{v4("aldKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("aldEmpty")}</p>}
      <ul className="c4-alidade-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-alidade-card" data-on={focused?.id === card.id ? "1" : "0"} data-quarter={card.quarter || "blank"} data-late={lateAlidade(card, desk) ? "1" : "0"} data-idle={idleAlidade(card) ? "1" : "0"} data-brisk={briskAlidade(card) ? "1" : "0"} data-resting={restingAlidade(card) ? "1" : "0"} data-overdue={overdueAlidade(card) ? "1" : "0"} data-inner={alidadeInner(card.quarter) ? "1" : "0"} data-outer={alidadeOuter(card.quarter) ? "1" : "0"}>
              <label className="c4-alidade-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("aldEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editAlidade(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("aldNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editAlidadeNote(cards, card.id, event.target.value))} />
                <p className="c4-alidade-meta">{card.sighter || "—"} · {quarterLabel(v4, card.quarter)} · {finishLabel(v4, card.finish)} · {card.span ?? "—"} · {card.pin} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-alidade-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-alidade-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAlidadeSighted(cards, card.id, !card.laid))}>{card.laid ? v4("aldClear") : v4("aldLay")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAlidadeCloth(cards, card.id, suggested))}>{v4("aldSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAlidadeSleeve(cards, card.id, !card.locked))}>{card.locked ? v4("aldUnsleeve") : v4("aldSheathIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAlidadeVault(cards, card.id, !card.held))}>{card.held ? v4("aldUnvault") : v4("aldCryptIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAlidadeStar(cards, card.id, !card.starred))}>{card.starred ? v4("aldUnstar") : v4("aldStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addAlidadeTag(cards, card.id, "a"))}>{v4("aldTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftSpanFocused(cards, card.id))}>{v4("aldLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerSpanFocused(cards, card.id))}>{v4("aldLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(alidadeCopy(card))}>{v4("aldCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type SpecimenUser = { id?: string; name?: string | null; isTest?: boolean | string | null };

export function SpecimenPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: SpecimenUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<SpecimenShape>("all");
  const [review, setReview] = useState<SpecimenReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): SpecimenRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      specimen: { isTest: textField(row.isTest) } satisfies SpecimenValue,
    };
  }).filter((row): row is SpecimenRow => Boolean(row));
  const present = presentSpecimenLanes(rows);
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
    const next = readHiddenSpecimens(readJson(SPC_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(SPC_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSpecimens(readJson(SPC_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(SPC_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSpecimenLanes(present, hidden, showHidden);
  const shown = visibleSpecimens(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = specimenLane(row.specimen);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = specimenLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSpecimen(rows);
  const leadHue = leadingSpecimenHue(rows);
  const whole = rows.filter((row) => specimenLane(row.specimen)).length;
  const share = specimenShare(laneSpecimenCount(rows, "house"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("specimen-lanes.csv", specimenLanesCsv(rows));
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
    writeJson(SPC_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(SPC_REVIEW_KEY, next);
  }

  return (
    <section className="c4-specimen" aria-label={v4("spcTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-specimen-mast">
        <p className="c4-specimen-seal" data-logo="mono">{v4("spcLogo")}</p>
        <div>
          <p className="c4-specimen-kicker">{v4("spcSub")}</p>
          <h2 className="c4-title">{v4("spcTitle")}</h2>
        </div>
        <p className="c4-specimen-count">{shown.length}</p>
      </header>
      <p className="c4-specimen-links">
        <Link href={crmv4Href(base, "ald")}>{v4("aldTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("spcCustomer")}</Link>
      </p>
      <p className="c4-specimen-hint">{v4("spcHint")}</p>
      {viewer && <p className="c4-specimen-note">{v4("spcViewer")}</p>}
      <p className="c4-specimen-meta">{v4("spcLead")} {laneLabel(v4, lead)} · {v4("spcToneLead")} {hueLabel(v4, leadHue)} · {v4("spcShare")} {share}</p>
      <div className="c4-specimen-chart" aria-label={v4("spcChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-specimen-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-specimen-tools">
        <input ref={searchRef} className="c4-field c4-specimen-search" aria-label={v4("spcSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("spcSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("spcShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "spcAll" : item === "reviewed" ? "spcReviewed" : "spcFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("spcAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as SpecimenShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSpecimen(hidden, item))}>{hidden.includes(item) ? v4("spcShow") : v4("spcHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-specimen-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSpecimenReview(reviewed, picked, true))}>{v4("spcBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSpecimenReview(reviewed, picked, false))}>{v4("spcBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("specimen-lanes.csv", specimenLanesCsv(rows))}>{v4("spcCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("specimen-rows.csv", specimenRowsCsv(shown, reviewed))}>{v4("spcRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("spcLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("spcFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("spcEmpty")}</p>}
      <ul className="c4-specimen-list">
        {shown.map((row) => {
          const name = specimenCopy(row.specimen);
          const tone = specimenHue(row.specimen);
          return (
            <li key={row.id} className="c4-specimen-card" data-lane={specimenLane(row.specimen) || "open"} data-hue={tone || "none"} data-house={specimenHouseSafe(row.specimen)} data-open={specimenOpen(row.specimen) ? "1" : "0"} data-even={specimenEven(row.specimen) ? "1" : "0"} data-digit={specimenDigit(row.specimen) ? "1" : "0"} data-letter={specimenLetter(row.specimen) ? "1" : "0"} data-mixed={specimenMixed(row.specimen) ? "1" : "0"} data-upper={specimenUpper(row.specimen) ? "1" : "0"} data-lower={specimenLower(row.specimen) ? "1" : "0"} data-space={specimenSpace(row.specimen) ? "1" : "0"} data-vowel={specimenVowel(row.specimen) ? "1" : "0"} data-tail={specimenTail(row.specimen) ? "1" : "0"} data-first={specimenFirst(row.specimen) ? "1" : "0"} data-held={specimenHeld(row.specimen) ? "1" : "0"} data-hyphen={specimenHyphen(row.specimen) ? "1" : "0"} data-period={specimenPeriod(row.specimen) ? "1" : "0"} data-capital={specimenCapital(row.specimen) ? "1" : "0"}>
              <label className="c4-specimen-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-specimen-meta">{name || v4("spcOpen")} · {specimenStamp(row.specimen) || "—"} · {specimenFamily(row.specimen) || "—"} · {specimenLength(row.specimen) ?? "—"} · {laneLabel(v4, specimenLane(row.specimen))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-specimen-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSpecimenReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("spcReviewed") : v4("spcReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = specimenCopy(row.specimen); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("spcCopied") : v4("spcCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("spcCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function specimenHouseSafe(raw: SpecimenValue): string {
  return specimenLane(raw) === "house" ? "1" : "0";
}
