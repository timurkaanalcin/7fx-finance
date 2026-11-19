"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CIRC_STATIONS,
  CFC_DENSITY_KEY,
  CFC_KEY,
  CFC_VIEW_KEY,
  NTC_KEY,
  NTC_REVIEW_KEY,
  addCircTag,
  addCircView,
  addCircumferentor,
  briskCirc,
  bulkCircChest,
  bulkCircGold,
  bulkCircSet,
  bulkCircTag,
  bulkNoticeReview,
  busiestCircBearer,
  circBars,
  circBearers,
  circCopy,
  circCounts,
  circCsv,
  circDensity,
  circTimeline,
  cycleMetal,
  dropCircView,
  editCircNote,
  editCircumferentor,
  fairCircBearer,
  idleCirc,
  innerStation,
  laneNoticeCount,
  lateCirc,
  leadingNotice,
  leadingNoticeHue,
  liftDegreeFocused,
  lowerDegreeFocused,
  lowerPinFocused,
  metalFocused,
  moveCircFocus,
  noticeCapital,
  noticeCopy,
  noticeDash,
  noticeDigit,
  noticeEven,
  noticeFamily,
  noticeFirst,
  noticeHeld,
  noticeHouse,
  noticeHue,
  noticeHyphen,
  noticeLane,
  noticeLanes,
  noticeLanesCsv,
  noticeLength,
  noticeLetter,
  noticeLower,
  noticeMixed,
  noticeOpen,
  noticePair,
  noticePeriod,
  noticePost,
  noticeQuery,
  noticeRowsCsv,
  noticeScroll,
  noticeSeed,
  noticeShare,
  noticeSoon,
  noticeSpace,
  noticeSpark,
  noticeStamp,
  noticeTail,
  noticeUpper,
  noticeVowel,
  outerStation,
  overdueCirc,
  presentNoticeLanes,
  raisePinFocused,
  readCircViews,
  readCircumferentors,
  readHiddenNotices,
  readReviewedNotices,
  reminderCircs,
  restingCirc,
  setCircChest,
  setCircFocused,
  setCircMetal,
  setCircSet,
  setCircSleeve,
  setCircStar,
  sleeveCircFocused,
  sortCircumferentors,
  starCircFocused,
  suggestCircMetal,
  suggestDegree,
  suggestStation,
  tagCircFocused,
  toggleNotice,
  toggleNoticeReview,
  visibleCircumferentors,
  visibleNoticeLanes,
  visibleNotices,
  type CircDensity,
  type CircSort,
  type CircTray,
  type CircView,
  type Circumferentor,
  type NoticeReview,
  type NoticeRow,
  type NoticeShape,
  type NoticeValue,
} from "@/lib/crmv4/round300";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const METALS = ["TIN", "COPPER", "GOLD"] as const;
const DEGREES = ["7", "14", "21", "28"] as const;
const PINS = ["2", "4", "8"] as const;
const STATION_KEY: Record<string, CrmV4CopyKey> = {
  box: "cfcBox",
  needle: "cfcNeedle",
  vane: "cfcVane",
  clamp: "cfcClamp",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "cfcAuditSave",
  edit: "cfcAuditEdit",
  note: "cfcAuditNote",
  metal: "cfcAuditMetal",
  set: "cfcAuditSet",
  clear: "cfcAuditClear",
  sleeve: "cfcAuditSleeve",
  resume: "cfcAuditResume",
  chest: "cfcAuditChest",
  open: "cfcAuditOpen",
  tag: "cfcAuditTag",
  pin: "cfcAuditPin",
  degree: "cfcAuditDegree",
  lower: "cfcAuditLower",
  star: "cfcAuditStar",
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

function stationLabel(v4: V4, station: string): string {
  const key = STATION_KEY[station];
  return key ? v4(key) : v4("cfcBlankStation");
}

function metalLabel(v4: V4, metal: string): string {
  if (metal === "TIN") return v4("cfcTin");
  if (metal === "COPPER") return v4("cfcCopper");
  if (metal === "GOLD") return v4("cfcGold");
  return v4("cfcAll");
}

export function CircumferentorDials({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Circumferentor[]>([]);
  const [views, setViews] = useState<CircView[]>([]);
  const [density, setDensity] = useState<CircDensity>("broad");
  const [tray, setTray] = useState<CircTray>("bench");
  const [query, setQuery] = useState("");
  const [bearerFilter, setBearerFilter] = useState("");
  const [metalFilter, setMetalFilter] = useState("all");
  const [stationFilter, setStationFilter] = useState("all");
  const [degreeFilter, setDegreeFilter] = useState("all");
  const [pinFilter, setPinFilter] = useState("all");
  const [sort, setSort] = useState<CircSort>("station");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [bearer, setBearer] = useState("");
  const [station, setStation] = useState("");
  const [metal, setMetal] = useState("");
  const [degreeNo, setDegreeNo] = useState("");
  const [pinNo, setPinNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("box");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readCircumferentors(readJson(CFC_KEY, [])));
    setViews(readCircViews(readJson(CFC_VIEW_KEY, [])));
    setDensity(circDensity(readJson(CFC_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Circumferentor[]) {
    setCards(next);
    writeJson(CFC_KEY, next);
  }
  function storeViews(next: CircView[]) {
    setViews(next);
    writeJson(CFC_VIEW_KEY, next);
  }
  function storeDensity(next: CircDensity) {
    setDensity(next);
    writeJson(CFC_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortCircumferentors(visibleCircumferentors(cards, tray, query, bearerFilter, metalFilter, stationFilter, degreeFilter, pinFilter), sort),
    [cards, tray, query, bearerFilter, metalFilter, stationFilter, degreeFilter, pinFilter, sort],
  );
  const counts = circCounts(cards, shown, desk);
  const bars = circBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = circTimeline(cards);
  const bearers = circBearers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestCircMetal(cards);
  const fair = fairCircBearer(cards, bearers.join(","));
  const busy = busiestCircBearer(cards);
  const reminders = reminderCircs(cards);
  const degreeHint = suggestDegree(cards, clock);
  const stationHint = suggestStation(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setBearer("");
        setStation("");
        setMetal("");
        setDegreeNo("");
        setPinNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveCircFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveCircFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        store(liftDegreeFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setCircChest(cards, id, !shown[focusAt]?.chested));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(metalFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(sleeveCircFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setCircFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("circumferentor-dials.csv", circCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starCircFocused(cards, id));
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
        store(lowerDegreeFocused(cards, id));
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
    <section className="c4-circ" aria-label={v4("cfcTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-circ-mast">
        <p className="c4-circ-seal" data-logo="mono">{v4("cfcLogo")}</p>
        <div>
          <p className="c4-circ-kicker">{v4("cfcSub")}</p>
          <h2 className="c4-title">{v4("cfcTitle")}</h2>
        </div>
        <ol className="c4-circ-index" aria-label={v4("cfcTitle")}>
          <li data-tone="gold">{v4("cfcBench")}</li>
          <li data-tone="ink">{v4("cfcSleeve")}</li>
          <li data-tone="ivory">{v4("cfcChest")}</li>
        </ol>
      </header>
      <p className="c4-circ-links">
        <Link href={crmv4Href(base, "ntc")}>{v4("ntcTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("cfcCustomers")}</Link>
        <Link href={crmv4Href(base, "ibglance")}>{v4("igExedraKicker")}</Link>
        <Link href={crmv4Href(base, "wdreason")}>{v4("wrTribuneKicker")}</Link>
      </p>
      <p className="c4-circ-hint">{v4("cfcHint")}</p>
      {viewer && <p className="c4-circ-note">{v4("cfcViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-circ-notice" role="status">{v4("cfcOverdue")} {counts.overdue}</p>}
      <ol className="c4-circ-dials" aria-label={v4("cfcChart")}>
        <li><span>{v4("cfcInner")}</span><strong>{counts.inner}</strong></li>
        <li><span>{v4("cfcOuter")}</span><strong>{counts.outer}</strong></li>
        <li><span>{v4("cfcSet")}</span><strong>{counts.set}</strong></li>
        <li><span>{v4("cfcWide")}</span><strong>{counts.wide}</strong></li>
        <li><span>{v4("cfcHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("cfcIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("cfcBrisk")}</span><strong>{counts.brisk}</strong></li>
        <li><span>{v4("cfcMatched")}</span><strong>{counts.matched}</strong></li>
      </ol>
      <div className="c4-circ-chart" aria-label={v4("cfcChart")}>
        {bars.map((bar) => (
          <button key={bar.station} type="button" className="c4-circ-column" data-on={stationFilter === bar.station ? "1" : "0"} data-station={bar.station} onClick={() => setStationFilter(stationFilter === bar.station ? "all" : bar.station)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{stationLabel(v4, bar.station)}</span>
          </button>
        ))}
      </div>
      <div className="c4-circ-tools">
        <input ref={searchRef} className="c4-field c4-circ-search" aria-label={v4("cfcSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("cfcSearch")} />
        <select className="c4-select" aria-label={v4("cfcBearer")} value={bearerFilter} onChange={(event) => setBearerFilter(event.target.value)}>
          <option value="">{v4("cfcBearer")}</option>
          {bearers.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        {(["bench", "sleeve", "chest"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bench" ? "cfcBench" : item === "sleeve" ? "cfcSleeve" : "cfcChest")}</button>
        ))}
        {(["all", "inner", "outer", ...CIRC_STATIONS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={stationFilter === item ? "1" : "0"} onClick={() => setStationFilter(item)}>{item === "all" ? v4("cfcAll") : item === "inner" ? v4("cfcInner") : item === "outer" ? v4("cfcOuter") : stationLabel(v4, item)}</button>
        ))}
        {["all", ...METALS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={metalFilter === item ? "1" : "0"} onClick={() => setMetalFilter(item)}>{item === "all" ? v4("cfcMetal") : metalLabel(v4, item)}</button>
        ))}
        {["all", ...DEGREES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={degreeFilter === item ? "1" : "0"} onClick={() => setDegreeFilter(item)}>{item === "all" ? v4("cfcDegree") : item}</button>
        ))}
        {["all", ...PINS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={pinFilter === item ? "1" : "0"} onClick={() => setPinFilter(item)}>{item === "all" ? v4("cfcPin") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "bearer" ? "1" : "0"} onClick={() => setSort(sort === "station" ? "bearer" : "station")}>{sort === "station" ? v4("cfcSortStation") : v4("cfcSortBearer")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "broad" ? "tight" : "broad")}>{density === "broad" ? v4("cfcBroad") : v4("cfcTight")}</button>
        <button type="button" className="c4-btn" onClick={() => download("circumferentor-dials.csv", circCsv(shown, desk))}>{v4("cfcCsv")}</button>
      </div>
      <div className="c4-circ-tools" role="group" aria-label={v4("cfcDesk")}>
        {CIRC_STATIONS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("cfcDesk")} {stationLabel(v4, item)}</button>
        ))}
        <span className="c4-circ-meta">{v4("cfcSuggest")} {metalLabel(v4, suggested)} · {degreeHint} · {stationLabel(v4, stationHint)}</span>
        <span className="c4-circ-meta">{v4("cfcFair")} {fair || "·"} · {v4("cfcBusy")} {busy || "·"}</span>
      </div>
      <form className="c4-circ-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addCircumferentor(cards, { title, note, bearer, station, metal: metal || suggested, degree: degreeNo, pin: pinNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("cfcEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("cfcTitle")} />
        <input className="c4-field" aria-label={v4("cfcNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("cfcNote")} />
        <input className="c4-field" aria-label={v4("cfcBearer")} aria-required={false} value={bearer} disabled={viewer} onChange={(event) => setBearer(event.target.value)} placeholder={v4("cfcBearer")} />
        <select className="c4-select" aria-label={v4("cfcDesk")} value={station} disabled={viewer} onChange={(event) => setStation(event.target.value)}>
          <option value="">{v4("cfcBlankStation")}</option>
          {CIRC_STATIONS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
        </select>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("cfcAdd")}</button>
      </form>
      <form className="c4-circ-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addCircView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, bearer: bearerFilter, metal: metalFilter, station: stationFilter, degree: degreeFilter, pin: pinFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("cfcViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("cfcViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("cfcSaveView")}</button>
      </form>
      <ul className="c4-circ-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setBearerFilter(view.bearer); setMetalFilter(view.metal); setStationFilter(view.station); setDegreeFilter(view.degree); setPinFilter(view.pin); }}>{v4("cfcApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropCircView(views, view.id))}>{v4("cfcDrop")}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-circ-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCircGold(cards, picked))}>{v4("cfcBulkGold")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCircSet(cards, picked))}>{v4("cfcBulkSet")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCircChest(cards, picked))}>{v4("cfcBulkChest")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCircTag(cards, picked))}>{v4("cfcBulkTag")}</button>
        </div>
      )}
      <p className="c4-circ-meta">{v4("cfcKeys")} · j k a c m v s o p u d x /</p>
      {timeline.length > 0 && (
        <ol className="c4-circ-time" aria-label={v4("cfcTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.degree}><span>{v4("cfcDegree")} {lane.degree}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
        </ol>
      )}
      {reminders.length > 0 && <p className="c4-circ-meta">{v4("cfcRemind")} {reminders.join(" · ")}</p>}
      {!shown.length && <p className="c4-circ-empty">{v4("cfcEmpty")}</p>}
      <ol className="c4-circ-board">
        {shown.map((card, index) => {
          const on = index === focusAt;
          return (
            <li key={card.id} className="c4-circ-card" data-on={on ? "1" : "0"} data-overdue={overdueCirc(card) ? "1" : "0"} data-idle={idleCirc(card) ? "1" : "0"} data-brisk={briskCirc(card) ? "1" : "0"} data-resting={restingCirc(card) ? "1" : "0"} data-late={lateCirc(card, desk) ? "1" : "0"} data-outer={outerStation(card.station) ? "1" : "0"} data-inner={innerStation(card.station) ? "1" : "0"} data-star={card.flagged ? "1" : "0"}>
              <label className="c4-circ-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((current) => (current.includes(card.id) ? current.filter((item) => item !== card.id) : [...current, card.id]))} /></label>
              <div>
                {on ? (
                  <input className="c4-field" aria-label={v4("cfcEdit")} aria-required={false} value={card.title} onChange={(event) => store(editCircumferentor(cards, card.id, event.target.value))} />
                ) : (
                  <strong>{card.title}</strong>
                )}
                <p className="c4-circ-meta">{card.bearer || v4("cfcBearer")} · {stationLabel(v4, card.station)} · {metalLabel(v4, card.metal)} · {card.degree ?? "·"} · {v4("cfcPin")} {card.pin}{card.tags.length ? ` · ${card.tags.join("")}` : ""}{card.audit ? ` · ${AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : card.audit}` : ""}</p>
                {on ? (
                  <input className="c4-field" aria-label={v4("cfcNote")} aria-required={false} value={card.note} onChange={(event) => store(editCircNote(cards, card.id, event.target.value))} />
                ) : (
                  card.note && <p className="c4-circ-meta">{card.note}</p>
                )}
                <div className="c4-circ-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCircSet(cards, card.id, !card.set))}>{card.set ? v4("cfcClear") : v4("cfcSet")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCircSleeve(cards, card.id, !card.sleeved))}>{card.sleeved ? v4("cfcUnsleeve") : v4("cfcSleeveIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCircChest(cards, card.id, !card.chested))}>{card.chested ? v4("cfcUnchest") : v4("cfcChestIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCircStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("cfcUnstar") : v4("cfcStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCircMetal(cards, card.id, cycleMetal(card.metal)))}>{v4("cfcMetal")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftDegreeFocused(cards, card.id))}>{v4("cfcLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDegreeFocused(cards, card.id))}>{v4("cfcLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCircTag(cards, card.id, "a"))}>{v4("cfcTag")} a</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(tagCircFocused(cards, card.id))}>{v4("cfcTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(circCopy(card)); }}>{v4("cfcCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="c4-circ-meta">{v4("cfcMatched")} {counts.matched} · {ids.length}</p>
    </section>
  );
}

const NOTICE_SHAPES: NoticeShape[] = ["all", "query", "house", "dash", "pair", "seed", "spark", "scroll", "post", "open", "soon", "letter", "mixed", "upper", "lower", "space", "even", "odd", "vowel", "tail", "digit", "first", "held", "hyphen", "period"];

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  query: "ntcQuery",
  house: "ntcHouse",
  dash: "ntcDash",
  pair: "ntcPair",
  seed: "ntcSeed",
  spark: "ntcSpark",
  scroll: "ntcScroll",
  post: "ntcPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "ntcIvory",
  graphite: "ntcGraphite",
  champagne: "ntcChampagne",
};

const SHAPE_KEY: Record<NoticeShape, CrmV4CopyKey> = {
  all: "ntcShapeAll",
  query: "ntcShapeQuery",
  house: "ntcShapeHouse",
  dash: "ntcShapeDash",
  pair: "ntcShapePair",
  seed: "ntcShapeSeed",
  spark: "ntcShapeSpark",
  scroll: "ntcShapeScroll",
  post: "ntcShapePost",
  open: "ntcShapeOpen",
  soon: "ntcShapeSoon",
  letter: "ntcShapeLetter",
  mixed: "ntcShapeMixed",
  upper: "ntcShapeUpper",
  lower: "ntcShapeLower",
  space: "ntcShapeSpace",
  even: "ntcShapeEven",
  odd: "ntcShapeOdd",
  vowel: "ntcShapeVowel",
  tail: "ntcShapeTail",
  digit: "ntcShapeDigit",
  first: "ntcShapeFirst",
  held: "ntcShapeHeld",
  hyphen: "ntcShapeHyphen",
  period: "ntcShapePeriod",
};

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("ntcUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("ntcUnmarked");
}

type NoticeUser = { id?: string; name?: string | null; loginBlockedMessage?: string | null };

export function NoticePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NoticeUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<NoticeShape>("all");
  const [review, setReview] = useState<NoticeReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";

  useEffect(() => {
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  const rows = useMemo<NoticeRow[]>(() => {
    return (queue.data?.users || []).map((row, index) => ({
      id: textField(row.id) || `c${index}`,
      label: textField(row.name),
      notice: { loginBlockedMessage: textField(row.loginBlockedMessage) } satisfies NoticeValue,
    }));
  }, [queue.data]);

  useEffect(() => {
    const ids = rows.map((row) => row.id);
    setHidden(readHiddenNotices(readJson(NTC_KEY, []), presentNoticeLanes(rows)));
    setReviewed(readReviewedNotices(readJson(NTC_REVIEW_KEY, []), ids));
  }, [rows]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(NTC_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(NTC_REVIEW_KEY, next);
  }

  const lanes = visibleNoticeLanes(presentNoticeLanes(rows), hidden, showHidden);
  const shown = visibleNotices(rows, lane, hue, query, review, reviewed, shape).filter((row) => !hidden.includes(noticeLane(row.notice)) || showHidden);
  const bars = noticeLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingNotice(rows);
  const leadHue = leadingNoticeHue(rows);
  const soon = rows.filter((row) => noticeSoon(row.notice)).length;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveCircFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveCircFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (viewer) return;
        const id = shown[focusAt]?.id;
        if (id) storeReviewed(toggleNoticeReview(reviewed, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("notice-rows.csv", noticeRowsCsv(rows, reviewed));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusAt, reviewed, rows, shown, viewer]);

  return (
    <section className="c4-notice" aria-label={v4("ntcTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-notice-mast">
        <p className="c4-notice-seal" data-logo="mono">{v4("ntcLogo")}</p>
        <div>
          <p className="c4-notice-kicker">{v4("ntcSub")}</p>
          <h2 className="c4-title">{v4("ntcTitle")}</h2>
        </div>
      </header>
      <ol className="c4-notice-index" aria-label={v4("ntcTitle")}>
        <li data-tone="gold">{v4("ntcSeed")}</li>
        <li data-tone="ink">{v4("ntcQuery")}</li>
        <li data-tone="ivory">{v4("ntcHouse")}</li>
        <li data-tone="mist">{v4("ntcScroll")}</li>
        <li data-tone="line">{v4("ntcPair")}</li>
      </ol>
      <p className="c4-notice-links">
        <Link href={crmv4Href(base, "cfc")}>{v4("cfcTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("cfcCustomers")}</Link>
        <Link href={crmv4Href(base, "ibglance")}>{v4("igExedraKicker")}</Link>
      </p>
      <p className="c4-notice-hint">{v4("ntcHint")}</p>
      {viewer && <p className="c4-notice-note">{v4("ntcViewer")}</p>}
      {soon > 0 && <p className="c4-notice-notice" role="status">{v4("ntcSoon")} {soon}</p>}
      {queue.loading && <p className="c4-notice-meta">{v4("ntcEmpty")}</p>}
      {queue.error && <p className="c4-notice-meta">{queue.error}</p>}
      <ul className="c4-notice-kpis" aria-label={v4("ntcRules")}>
        <li><span>{v4("ntcLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("ntcUnmarked")}</strong></li>
        <li><span>{v4("ntcToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("ntcUnmarked")}</strong></li>
        <li><span>{v4("ntcSeed")}</span><strong>{laneNoticeCount(rows, "seed")}</strong></li>
        <li><span>{v4("ntcHouse")}</span><strong>{laneNoticeCount(rows, "house")}</strong></li>
        <li><span>{v4("ntcShare")}</span><strong>{noticeShare(laneNoticeCount(rows, "house"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("ntcOpen")}</span><strong>{rows.filter((row) => noticeOpen(row.notice)).length}</strong></li>
        <li><span>{v4("ntcHeld")}</span><strong>{rows.filter((row) => noticeHeld(row.notice)).length}</strong></li>
        <li><span>{v4("ntcPair")}</span><strong>{rows.filter((row) => noticePair(row.notice)).length}</strong></li>
      </ul>
      <div className="c4-notice-chart" aria-label={v4("ntcRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-notice-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / maxBar) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-notice-tools">
        <input ref={searchRef} className="c4-field c4-notice-search" aria-label={v4("ntcSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ntcSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("ntcAll") : hueLabel(v4, item)}</button>
        ))}
        {NOTICE_SHAPES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("ntcAll") : item === "reviewed" ? v4("ntcReviewed") : v4("ntcFresh")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("ntcShow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("notice-lanes.csv", noticeLanesCsv(rows))}>{v4("ntcCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("notice-rows.csv", noticeRowsCsv(rows, reviewed))}>{v4("ntcRowCsv")}</button>
      </div>
      <ul className="c4-notice-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleNotice(hidden, item))}>{hidden.includes(item) ? v4("ntcShow") : v4("ntcHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-notice-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkNoticeReview(reviewed, picked, true))}>{v4("ntcBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkNoticeReview(reviewed, picked, false))}>{v4("ntcBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-notice-empty">{v4("ntcEmpty")}</p>}
      <ol className="c4-notice-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          const length = noticeLength(row.notice);
          const family = noticeFamily(row.notice);
          return (
            <li key={row.id} className="c4-notice-card" data-on={index === focusAt ? "1" : "0"} data-lane={noticeLane(row.notice)} data-hue={noticeHue(row.notice)} data-reviewed={seen ? "1" : "0"} data-seed={noticeSeed(row.notice) ? "1" : "0"} data-query={noticeQuery(row.notice) ? "1" : "0"} data-house={noticeHouse(row.notice) ? "1" : "0"} data-soon={noticeSoon(row.notice) ? "1" : "0"}>
              <p className="c4-notice-stamp">{noticeStamp(row.notice) || "·"}</p>
              <label className="c4-notice-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("ntcUnmarked")}</strong>
                <p className="c4-notice-meta">{laneLabel(v4, noticeLane(row.notice))} · {hueLabel(v4, noticeHue(row.notice))}{family ? ` · ${family}` : ""}{length !== null ? ` · ${length}` : ""}{noticeDigit(row.notice) ? ` · ${v4("ntcDigit")}` : ""}{noticeLetter(row.notice) ? ` · ${v4("ntcLetter")}` : ""}{noticeMixed(row.notice) ? ` · ${v4("ntcMixed")}` : ""}{noticeUpper(row.notice) ? ` · ${v4("ntcUpper")}` : ""}{noticeLower(row.notice) ? ` · ${v4("ntcLower")}` : ""}{noticeEven(row.notice) ? ` · ${v4("ntcEven")}` : ""}{noticeVowel(row.notice) ? ` · ${v4("ntcVowel")}` : ""}{noticeFirst(row.notice) ? ` · ${v4("ntcFirst")}` : ""}{noticeTail(row.notice) ? ` · ${v4("ntcTail")}` : ""}{noticeCapital(row.notice) ? ` · ${v4("ntcCapital")}` : ""}{noticeSpace(row.notice) ? ` · ${v4("ntcSpace")}` : ""}{noticeHyphen(row.notice) ? ` · ${v4("ntcHyphen")}` : ""}{noticePeriod(row.notice) ? ` · ${v4("ntcPeriod")}` : ""}{noticePost(row.notice) ? ` · ${v4("ntcPost")}` : ""}{noticeSpark(row.notice) ? ` · ${v4("ntcSpark")}` : ""}{noticeHeld(row.notice) ? ` · ${v4("ntcHeld")}` : ""}{noticeSoon(row.notice) ? ` · ${v4("ntcSoon")}` : ""}{noticeOpen(row.notice) ? ` · ${v4("ntcOpen")}` : ""}{noticeSeed(row.notice) ? ` · ${v4("ntcSeed")}` : ""}{noticeDash(row.notice) ? ` · ${v4("ntcDash")}` : ""}{noticeQuery(row.notice) ? ` · ${v4("ntcQuery")}` : ""}{noticeScroll(row.notice) ? ` · ${v4("ntcScroll")}` : ""}</p>
                <div className="c4-notice-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleNoticeReview(reviewed, row.id))}>{seen ? v4("ntcReviewed") : v4("ntcReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(noticeCopy(row.notice)); setCopied(row.id); }}>{copied === row.id ? v4("ntcCopied") : v4("ntcCopy")}</button>
                  <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("cfcCustomers")}</Link>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
