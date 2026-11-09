"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  REASON_KEY,
  RIBBON_KEY,
  RIBBON_VIEW_KEY,
  activeFamily,
  activeGrade,
  activeHour,
  activeLane,
  activeLength,
  activeReason,
  activeReasonMark,
  activeSeal,
  activeSteward,
  addRibbon,
  addRibbonView,
  bulkRibbonDone,
  bulkRibbonPinned,
  dayQuarterCounts,
  dropRibbonView,
  editRibbon,
  familyArg,
  familyLines,
  familyOf,
  gradeArg,
  hourArg,
  hourBand,
  hourGap,
  laneArg,
  laneOf,
  leadingFamily,
  leadingLength,
  leadingReason,
  leadingReasonMark,
  lengthArg,
  lengthLines,
  lengthOf,
  namedFamilies,
  namedLengths,
  namedReasonMarks,
  namedReasons,
  nextRibbon,
  readHiddenReasons,
  readRibbonViews,
  readRibbons,
  reasonLines,
  reasonMarkArg,
  reasonMarkLines,
  reasonMarkOf,
  reasonShare,
  reasonText,
  reasonsCsv,
  resetRibbons,
  ribbonClashIds,
  ribbonCopy,
  ribbonCounts,
  ribbonGrades,
  ribbonLanes,
  ribbonSeals,
  ribbonShare,
  ribbonStewards,
  ribbonTimeline,
  ribbonsCsv,
  sealArg,
  setRibbonDone,
  setRibbonHeld,
  setRibbonPinned,
  stepRibbonGrade,
  stewardArg,
  toggleReason,
  visibleReasonCustomers,
  visibleReasons,
  visibleRibbons,
  gradeOf,
  type Family,
  type ReasonLength,
  type ReasonRow,
  type Ribbon,
  type RibbonGrade,
  type RibbonLane,
  type RibbonTray,
  type RibbonView,
} from "@/lib/crmv4/round143";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  leadInvalidReason?: string | null;
};

type GlanceRow = ReasonRow & { id: string };

const QUARTERS = ["q1", "q2", "q3", "q4"] as const;

function laneName(v4: V4, lane: RibbonLane): string {
  if (lane === "floor") return v4("ribLaneFloor");
  if (lane === "mezz") return v4("ribLaneMezz");
  if (lane === "loft") return v4("ribLaneLoft");
  if (lane === "roof") return v4("ribLaneRoof");
  return v4("ribBlankLane");
}

function gradeName(v4: V4, grade: RibbonGrade): string {
  if (grade === "plain") return v4("ribGradePlain");
  if (grade === "firm") return v4("ribGradeFirm");
  if (grade === "bold") return v4("ribGradeBold");
  return v4("ribBlankGrade");
}

function familyName(v4: V4, name: string): string {
  if (name === "geo") return v4("rsnGeo");
  if (name === "person") return v4("rsnPerson");
  if (name === "quality") return v4("rsnQuality");
  if (name === "duplicate") return v4("rsnDuplicate");
  if (name === "hours") return v4("rsnHours");
  if (name === "other") return v4("rsnFamilyOther");
  return v4("rsnBlankFamily");
}

function lengthName(v4: V4, name: string): string {
  if (name === "short") return v4("rsnShort");
  if (name === "mid") return v4("rsnMid");
  if (name === "long") return v4("rsnLong");
  return v4("rsnBlankLength");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("ribAuditSave");
  if (audit === "edit") return v4("ribAuditEdit");
  if (audit === "raise") return v4("ribAuditRaise");
  if (audit === "lower") return v4("ribAuditLower");
  if (audit === "pin") return v4("ribAuditPin");
  if (audit === "unpin") return v4("ribAuditUnpin");
  if (audit === "hold") return v4("ribAuditHold");
  if (audit === "release") return v4("ribAuditRelease");
  if (audit === "done") return v4("ribAuditDone");
  if (audit === "reopen") return v4("ribAuditReopen");
  return "";
}

function quarterLabel(index: number): string {
  const start = index * 6;
  const end = start + 5;
  return `${String(start).padStart(2, "0")}–${String(end).padStart(2, "0")}`;
}

function hourLabel(hour: number | null): string {
  return hour === null ? "—" : String(hour).padStart(2, "0");
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

export function RibbonCards({ v4 }: { v4: V4 }) {
  const [ribbons, setRibbons] = useState<Ribbon[]>([]);
  const [views, setViews] = useState<RibbonView[]>([]);
  const [text, setText] = useState("");
  const [steward, setSteward] = useState("");
  const [hour, setHour] = useState("");
  const [lane, setLane] = useState("");
  const [seal, setSeal] = useState("");
  const [grade, setGrade] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<RibbonTray>("open");
  const [stewardFilter, setStewardFilter] = useState("all");
  const [laneFilter, setLaneFilter] = useState("all");
  const [sealFilter, setSealFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [boldOnly, setBoldOnly] = useState(false);
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
    const next = readRibbons(readJson(RIBBON_KEY, []));
    const saved = readRibbonViews(readJson(RIBBON_VIEW_KEY, []));
    setRibbons(next);
    setViews(saved);
    writeJson(RIBBON_KEY, next);
    writeJson(RIBBON_VIEW_KEY, saved);
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
      if (event.key === "n" || event.key === "N") {
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
  const stewards = ribbonStewards(ribbons);
  const lanes = ribbonLanes(ribbons);
  const seals = ribbonSeals(ribbons);
  const grades = ribbonGrades(ribbons);
  const quarters = dayQuarterCounts(ribbons);
  const stewardOn = activeSteward(stewardFilter, stewards);
  const laneOn = activeLane(laneFilter, lanes);
  const sealOn = activeSeal(sealFilter, seals);
  const gradeOn = activeGrade(gradeFilter, grades);
  const hourOn = activeHour(hourFilter);
  const picked = hourArg(hourOn);
  const shown = visibleRibbons(
    ribbons,
    tray,
    query,
    stewardArg(stewardOn),
    laneArg(laneOn),
    sealArg(sealOn),
    gradeArg(gradeOn),
    picked.exact,
    picked.band,
    boldOnly,
    lateOnly,
    desk,
  );
  const timeline = ribbonTimeline(ribbons, query);
  const counts = ribbonCounts(ribbons, desk);
  const total = ribbons.length;
  const nextId = nextRibbon(ribbons, desk);
  const nextCard = ribbons.find((ribbon) => ribbon.id === nextId);
  const tallest = Math.max(1, ...quarters);

  function store(next: Ribbon[]) {
    setRibbons(next);
    writeJson(RIBBON_KEY, next);
  }

  function storeViews(next: RibbonView[]) {
    setViews(next);
    writeJson(RIBBON_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setSteward("");
    setHour("");
    setLane("");
    setSeal("");
    setGrade("");
  }

  function copyRibbon(ribbon: Ribbon) {
    const body = ribbonCopy(ribbon.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(ribbon.id);
  }

  function applyView(view: RibbonView) {
    setTray(view.tray);
    setQuery(view.query);
    setStewardFilter(activeSteward(view.steward, ribbonStewards(ribbons)));
    setLaneFilter(activeLane(view.lane, ribbonLanes(ribbons)));
    setSealFilter(activeSeal(view.seal, ribbonSeals(ribbons)));
    setGradeFilter(activeGrade(view.grade, ribbonGrades(ribbons)));
    setHourFilter(activeHour(view.hour));
    setBoard("cards");
    setBoldOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-rib" aria-label={v4("ribTitle")} data-ribbon="1" data-role={role} data-ribbon-atelier="1">
      <header className="c4-rib-head">
        <p className="c4-rib-plate" data-logo="mono">{v4("ribLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("ribSub")}</p>
          <h2 className="c4-title">{v4("ribTitle")}</h2>
        </div>
        <p className="c4-rib-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("ribHint")}</p>
      <p className="c4-meta">{v4("ribLocal")}</p>
      <p className="c4-meta">{v4("ribBlank")}</p>
      <p className="c4-meta">{v4("ribStewardBlank")}</p>
      <p className="c4-meta">{v4("ribHourBlank")}</p>
      <p className="c4-meta">{v4("ribLaneBlank")}</p>
      <p className="c4-meta">{v4("ribSealBlank")}</p>
      <p className="c4-meta">{v4("ribGradeBlank")}</p>
      <p className="c4-meta">{v4("ribEscape")}</p>
      <p className="c4-meta">{v4("ribSlash")}</p>
      <p className="c4-meta">{v4("ribNew")}</p>
      {viewer ? <p className="c4-rib-notice" role="status">{v4("ribViewer")}</p> : null}
      <p className="c4-rib-notice" role="status">
        <span>{v4("ribNotice")}</span>
        <span className="c4-rib-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("ribNoticeAll") : v4("ribNoticeOpen")}
        </button>
      </p>
      <section className="c4-rib-kpi" aria-label={v4("ribKpi")}>
        <p className="c4-pay-kicker">{v4("ribKpi")}</p>
        {(["open", "held", "done", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = ribbonShare(count, total);
          const label = key === "open" ? v4("ribOpen") : key === "held" ? v4("ribHeld") : key === "done" ? v4("ribDoneTray") : v4("ribPinned");
          return (
            <p key={key} className="c4-rib-meter" data-tray={key}>
              <span>{label}</span>
              <span>{count}</span>
              <span>{v4("ribShare")} {share}%</span>
              <span className="c4-rib-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-rib-chart" aria-label={v4("ribChart")}>
        {quarters.map((count, index) => {
          const code = QUARTERS[index];
          const on = hourOn === code;
          const height = Math.max(8, Math.round((count / tallest) * 100));
          return (
            <button
              key={code}
              type="button"
              className="c4-rib-band"
              data-on={on ? "1" : "0"}
              data-filled={count ? "1" : "0"}
              aria-pressed={on}
              onClick={() => setHourFilter(on ? "all" : code)}
            >
              <span className="c4-rib-bar" aria-hidden="true"><i style={{ height: `${height}%` }} /></span>
              <span>{quarterLabel(index)}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-rib-next" onSubmit={(event) => event.preventDefault()}>
        <label className="c4-lab">
          <span>{v4("ribDeskHour")}</span>
          <input className="c4-field" aria-label={v4("ribDeskHour")} value={desk} inputMode="numeric" maxLength={2} onChange={(event) => setDesk(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setDesk("");
          }} />
        </label>
        <p className="c4-rib-next-line">
          <span>{v4("ribNext")}</span>
          {nextCard ? <strong>{hourLabel(nextCard.hour)} {nextCard.text}</strong> : <span>{hourArg(desk).exact !== null ? v4("ribNextEmpty") : "—"}</span>}
        </p>
      </form>
      <form className="c4-rib-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addRibbon(ribbons, { id: `rib-${Date.now().toString(36)}`, text, steward, hour, lane, seal, grade });
        if (next.length === ribbons.length) return;
        store(next);
        clearDraft();
      }} onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("ribText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("ribText")} aria-keyshortcuts="n" value={text} maxLength={72} disabled={viewer} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("ribSteward")}</span>
          <input className="c4-field" aria-label={v4("ribSteward")} value={steward} maxLength={16} disabled={viewer} onChange={(event) => setSteward(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("ribHour")}</span>
          <input className="c4-field" aria-label={v4("ribHour")} value={hour} inputMode="numeric" maxLength={2} disabled={viewer} onChange={(event) => setHour(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("ribLane")}</span>
          <input className="c4-field" aria-label={v4("ribLane")} value={lane} maxLength={8} disabled={viewer} onChange={(event) => setLane(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("ribSeal")}</span>
          <input className="c4-field" aria-label={v4("ribSeal")} value={seal} maxLength={10} disabled={viewer} onChange={(event) => setSeal(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("ribGrade")}</span>
          <input className="c4-field" aria-label={v4("ribGrade")} value={grade} maxLength={8} disabled={viewer} onChange={(event) => setGrade(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ribAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("ribTitle")}>
        {(["open", "held", "done"] as const).map((key) => (
          <button key={key} type="button" className="c4-chip" data-on={tray === key ? "1" : "0"} aria-pressed={tray === key} onClick={() => { setTray(key); setBoard("cards"); if (key !== "open") setLateOnly(false); }}>
            {key === "open" ? v4("ribOpen") : key === "held" ? v4("ribHeld") : v4("ribDoneTray")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard((value) => value === "timeline" ? "cards" : "timeline")}>{v4("ribTimeline")}</button>
        <button type="button" className="c4-chip" data-on={boldOnly ? "1" : "0"} aria-pressed={boldOnly} onClick={() => setBoldOnly((value) => !value)}>{v4("ribBold")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("ribSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("ribSearch")} aria-keyshortcuts="/" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("ribStewards")}>
        <button type="button" className="c4-chip" data-on={stewardOn === "all" ? "1" : "0"} aria-pressed={stewardOn === "all"} onClick={() => setStewardFilter("all")}>{v4("ribAllStewards")}</button>
        <button type="button" className="c4-chip" data-on={stewardOn === "blank" ? "1" : "0"} aria-pressed={stewardOn === "blank"} onClick={() => setStewardFilter(stewardOn === "blank" ? "all" : "blank")}>{v4("ribBlankSteward")}</button>
        {stewards.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={stewardOn === item ? "1" : "0"} aria-pressed={stewardOn === item} onClick={() => setStewardFilter(stewardOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ribLanes")}>
        <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} aria-pressed={laneOn === "all"} onClick={() => setLaneFilter("all")}>{v4("ribAllLanes")}</button>
        <button type="button" className="c4-chip" data-on={laneOn === "blank" ? "1" : "0"} aria-pressed={laneOn === "blank"} onClick={() => setLaneFilter(laneOn === "blank" ? "all" : "blank")}>{v4("ribBlankLane")}</button>
        {lanes.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} aria-pressed={laneOn === item} onClick={() => setLaneFilter(laneOn === item ? "all" : item)}>{laneName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ribSeals")}>
        <button type="button" className="c4-chip" data-on={sealOn === "all" ? "1" : "0"} aria-pressed={sealOn === "all"} onClick={() => setSealFilter("all")}>{v4("ribAllSeals")}</button>
        <button type="button" className="c4-chip" data-on={sealOn === "blank" ? "1" : "0"} aria-pressed={sealOn === "blank"} onClick={() => setSealFilter(sealOn === "blank" ? "all" : "blank")}>{v4("ribBlankSeal")}</button>
        {seals.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={sealOn === item ? "1" : "0"} aria-pressed={sealOn === item} onClick={() => setSealFilter(sealOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ribGrades")}>
        <button type="button" className="c4-chip" data-on={gradeOn === "all" ? "1" : "0"} aria-pressed={gradeOn === "all"} onClick={() => setGradeFilter("all")}>{v4("ribAllGrades")}</button>
        <button type="button" className="c4-chip" data-on={gradeOn === "blank" ? "1" : "0"} aria-pressed={gradeOn === "blank"} onClick={() => setGradeFilter(gradeOn === "blank" ? "all" : "blank")}>{v4("ribBlankGrade")}</button>
        {grades.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={gradeOn === item ? "1" : "0"} aria-pressed={gradeOn === item} onClick={() => setGradeFilter(gradeOn === item ? "all" : item)}>{gradeName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ribHours")}>
        {(["all", "blank", "dawn", "day", "dusk"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hourOn === item ? "1" : "0"} aria-pressed={hourOn === item} onClick={() => setHourFilter(item)}>
            {item === "all" ? v4("ribAllHours") : item === "blank" ? v4("ribBlankHour") : item === "dawn" ? v4("ribDawn") : item === "day" ? v4("ribDay") : v4("ribDusk")}
          </button>
        ))}
      </div>
      <form className="c4-rib-view" onSubmit={(event) => {
        event.preventDefault();
        const next = addRibbonView(views, {
          id: `view-${Date.now().toString(36)}`,
          name: viewName,
          tray,
          query,
          steward: stewardOn,
          lane: laneOn,
          seal: sealOn,
          grade: gradeOn,
          hour: hourOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("ribViewName")}</span>
          <input className="c4-field" aria-label={v4("ribViewName")} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("ribSaveView")}</button>
      </form>
      <section aria-label={v4("ribViews")}>
        <p className="c4-pay-kicker">{v4("ribViews")}</p>
        {!views.length && <p className="c4-meta">{v4("ribViewEmpty")}</p>}
        <ul className="c4-rib-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" onClick={() => storeViews(dropRibbonView(views, view.id))}>{v4("ribDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      <p className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkRibbonPinned(ribbons, shown.map((ribbon) => ribbon.id), true))}>{v4("ribBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkRibbonDone(ribbons, shown.map((ribbon) => ribbon.id), true))}>{v4("ribBulkDone")}</button>
        <button type="button" className="c4-btn" onClick={() => download("ribbon-cards.csv", ribbonsCsv(ribbons, desk))}>{v4("ribCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetRibbons())}>{v4("ribReset")}</button>
      </p>
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("ribEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-rib-rows">
          {shown.map((ribbon) => {
            const band = hourBand(ribbon.hour);
            const clashes = ribbonClashIds(ribbons, ribbon.id);
            const gap = hourGap(ribbon.hour, desk);
            const laneLabel = laneOf(ribbon.lane);
            const gradeLabel = gradeOf(ribbon.grade);
            return (
              <li key={ribbon.id} data-band={band} data-lane={laneLabel} data-grade={gradeLabel} data-late={gap !== null && gap > 0 && !ribbon.held && !ribbon.done ? "1" : "0"}>
                <span className="c4-rib-hour">{hourLabel(ribbon.hour)}</span>
                <div>
                  <p className="c4-rib-pips" aria-label={v4("ribGrade")}>
                    {(["plain", "firm", "bold"] as const).map((pip) => <i key={pip} data-on={gradeLabel === pip || (pip === "plain" && gradeLabel === "firm") || (pip !== "bold" && gradeLabel === "bold") ? "1" : "0"} />)}
                  </p>
                  {editing === ribbon.id ? (
                    <form onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editRibbon(ribbons, ribbon.id, draft));
                      setEditing("");
                      setDraft("");
                    }}>
                      <label className="c4-lab">
                        <span>{v4("ribEdit")}</span>
                        <input className="c4-field" aria-label={v4("ribEdit")} value={draft} maxLength={72} disabled={viewer} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
                          if (event.key !== "Escape") return;
                          event.preventDefault();
                          setEditing("");
                          setDraft("");
                        }} />
                      </label>
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("ribSaveEdit")}</button>
                    </form>
                  ) : <p>{ribbon.text}</p>}
                  <p className="c4-rib-lane">{laneName(v4, laneLabel)}</p>
                  <p className="c4-rib-grade">{gradeName(v4, gradeLabel)}</p>
                  {ribbon.steward ? <p className="c4-rib-steward">{v4("ribAssign")} {ribbon.steward}</p> : null}
                  {ribbon.seal ? <p className="c4-rib-seal">{ribbon.seal}</p> : null}
                  {gap !== null ? <p className="c4-meta">{gap > 0 ? v4("ribLate") : gap < 0 ? v4("ribAhead") : v4("ribNow")} {gap === 0 ? "" : Math.abs(gap)}</p> : null}
                  <p className="c4-meta">{clashes.length ? `${v4("ribClash")} ${clashes.length}` : v4("ribClashNone")}</p>
                  {ribbon.audit ? <p className="c4-meta">{v4("ribAudit")} {auditName(v4, ribbon.audit)}</p> : null}
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyRibbon(ribbon)}>{copied === ribbon.id ? v4("ribCopied") : v4("ribCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(ribbon.id); setDraft(ribbon.text); }}>{v4("ribEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepRibbonGrade(ribbons, ribbon.id, 1))}>{v4("ribRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepRibbonGrade(ribbons, ribbon.id, -1))}>{v4("ribLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={ribbon.pinned} onClick={() => store(setRibbonPinned(ribbons, ribbon.id, !ribbon.pinned))}>{ribbon.pinned ? v4("ribUnpin") : v4("ribPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={ribbon.held} onClick={() => store(setRibbonHeld(ribbons, ribbon.id, !ribbon.held))}>{ribbon.held ? v4("ribRelease") : v4("ribHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={ribbon.done} onClick={() => store(setRibbonDone(ribbons, ribbon.id, !ribbon.done))}>{ribbon.done ? v4("ribReopen") : v4("ribDone")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-rib-time">
          {timeline.map((ribbon) => (
            <li key={ribbon.id} data-band={hourBand(ribbon.hour)}>
              <span className="c4-rib-clock">{hourLabel(ribbon.hour)}</span>
              <p>{ribbon.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function InvalidReasons({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenReasons, setHiddenReasons] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [family, setFamily] = useState("all");
  const [length, setLength] = useState("all");
  const [letter, setLetter] = useState("all");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || row.email || "").trim(),
      reason: row.leadInvalidReason,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = reasonLines(rows);
  const families = familyLines(rows);
  const lengths = lengthLines(rows);
  const letters = reasonMarkLines(rows);
  const present = namedReasons(rows);
  const presentKey = present.join("\n");
  const familyNames = namedFamilies(rows);
  const lengthNames = namedLengths(rows);
  const letterNames = namedReasonMarks(rows);
  const blankCount = lines.find((line) => !line.reason)?.count || 0;
  const blankLetter = letters.find((line) => !line.letter)?.count || 0;
  const lead = leadingReason(rows);
  const leadFamily = leadingFamily(rows);
  const leadLength = leadingLength(rows);
  const leadLetter = leadingReasonMark(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenReasons(readJson(REASON_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenReasons(next);
    writeJson(REASON_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleReasons(present, hiddenReasons, showHidden);
  const reason = activeReason(selected, chips);
  const familyOn = activeFamily(family, familyNames);
  const lengthOn = activeLength(length, lengthNames);
  const letterOn = activeReasonMark(letter, letterNames);
  const shown = visibleReasonCustomers(rows, reason, blank, familyArg(familyOn), lengthArg(lengthOn), reasonMarkArg(letterOn), query);
  const widest = Math.max(1, ...families.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenReasons(next);
    writeJson(REASON_KEY, next);
    if (clear && activeReason(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-reason" aria-label={v4("rsnTitle")} data-reason="1" data-ribbon-atelier="1">
      <header className="c4-rsn-head">
        <div>
          <p className="c4-pay-kicker">{v4("rsnSub")}</p>
          <h2 className="c4-title">{v4("rsnTitle")}</h2>
        </div>
        <p className="c4-rib-count">{v4("rsnRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("rsnHint")}</p>
      <p className="c4-meta">{v4("rsnLocal")}</p>
      <p className="c4-meta">{v4("rsnEscape")}</p>
      {lead ? <p className="c4-rsn-lead"><span>{v4("rsnLead")}</span> {lead}</p> : null}
      {leadFamily ? <p className="c4-rsn-lead"><span>{v4("rsnLeadFamily")}</span> {familyName(v4, leadFamily)}</p> : null}
      {leadLength ? <p className="c4-rsn-lead"><span>{v4("rsnLeadLength")}</span> {lengthName(v4, leadLength)}</p> : null}
      {leadLetter ? <p className="c4-rsn-lead"><span>{v4("rsnLeadLetter")}</span> {leadLetter}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("rsnBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("invalid-reasons.csv", reasonsCsv(rows))}>{v4("rsnCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("rsnLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("rsnFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("rsnNone")}</p>}
      {families.length > 0 && (
        <section className="c4-rsn-chart" aria-label={v4("rsnFamily")}>
          {families.map((line) => {
            const share = reasonShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.family || "blank";
            return (
              <p key={name} className="c4-rsn-col" data-family={name}>
                <span>{familyName(v4, line.family)}</span>
                <span className="c4-rsn-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("rsnShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      {blankCount > 0 && (
        <button type="button" className="c4-rsn-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); setFamily("all"); setLength("all"); setLetter("all"); }}>
          <span>{v4("rsnBlank")}</span>
          <span className="c4-rib-count">{blankCount}</span>
          <span className="c4-rsn-track" aria-hidden="true"><i style={{ width: `${reasonShare(blankCount, rows.length)}%` }} /></span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("rsnFamily")}>
        <button type="button" className="c4-chip" data-on={familyOn === "all" && !blank ? "1" : "0"} aria-pressed={familyOn === "all"} onClick={() => { setFamily("all"); setBlank(false); }}>{v4("rsnAllFamily")}</button>
        {families.some((line) => !line.family) && (
          <button type="button" className="c4-chip" data-on={familyOn === "blank" ? "1" : "0"} aria-pressed={familyOn === "blank"} onClick={() => { setFamily(familyOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("rsnBlankFamily")}</button>
        )}
        {familyNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={familyOn === item ? "1" : "0"} aria-pressed={familyOn === item} onClick={() => { setBlank(false); setSelected(""); setFamily(familyOn === item ? "all" : item); }}>{familyName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("rsnLengths")}>
        <button type="button" className="c4-chip" data-on={lengthOn === "all" && !blank ? "1" : "0"} aria-pressed={lengthOn === "all"} onClick={() => { setLength("all"); setBlank(false); }}>{v4("rsnAllLengths")}</button>
        {lengths.some((line) => !line.length) && (
          <button type="button" className="c4-chip" data-on={lengthOn === "blank" ? "1" : "0"} aria-pressed={lengthOn === "blank"} onClick={() => { setLength(lengthOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("rsnBlankLength")}</button>
        )}
        {lengthNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={lengthOn === item ? "1" : "0"} aria-pressed={lengthOn === item} onClick={() => { setBlank(false); setSelected(""); setLength(lengthOn === item ? "all" : item); }}>{lengthName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("rsnLetters")}>
        <button type="button" className="c4-chip" data-on={letterOn === "all" && !blank ? "1" : "0"} aria-pressed={letterOn === "all"} onClick={() => { setLetter("all"); setBlank(false); }}>{v4("rsnAllLetters")}</button>
        {blankLetter > 0 && (
          <button type="button" className="c4-chip" data-on={letterOn === "blank" ? "1" : "0"} aria-pressed={letterOn === "blank"} onClick={() => { setLetter(letterOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("rsnBlankLetter")}</button>
        )}
        {letterNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={letterOn === item ? "1" : "0"} aria-pressed={letterOn === item} onClick={() => { setBlank(false); setSelected(""); setLetter(letterOn === item ? "all" : item); }}>{item === "#" ? v4("rsnOther") : item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("rsnShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("rsnShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("rsnHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("rsnTitle")}>
        <button type="button" className="c4-chip" data-on={!reason && !blank && familyOn === "all" && lengthOn === "all" && letterOn === "all" ? "1" : "0"} aria-pressed={!reason && !blank} onClick={() => { setSelected(""); setBlank(false); setFamily("all"); setLength("all"); setLetter("all"); }}>{v4("rsnAll")}</button>
        {chips.map((item) => {
          const line = lines.find((row) => row.reason === item);
          const count = line?.count || 0;
          const share = reasonShare(count, rows.length);
          const mark = reasonMarkOf(item);
          const familyMark = familyOf(item) as Family;
          const lengthMark = lengthOf(item) as ReasonLength;
          return (
            <span key={item} className="c4-rsn-pair" data-reason={item}>
              <button type="button" className="c4-chip" data-on={reason === item ? "1" : "0"} aria-pressed={reason === item} onClick={() => { setBlank(false); setFamily("all"); setLength("all"); setLetter("all"); setSelected(reason === item ? "" : item); }}>{item}</button>
              {familyMark ? <span className="c4-rsn-family">{familyName(v4, familyMark)}</span> : null}
              {lengthMark ? <span className="c4-rsn-length">{lengthName(v4, lengthMark)}</span> : null}
              {mark ? <span className="c4-rsn-letter">{v4("rsnLetter")} {mark === "#" ? v4("rsnOther") : mark}</span> : null}
              <span className="c4-rib-count">{count}</span>
              <span className="c4-rsn-share">{v4("rsnShare")} {share}%</span>
              <span className="c4-rsn-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleReason(hiddenReasons, item, present), showHidden ? "" : item)}>{showHidden ? v4("rsnShow") : v4("rsnHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("rsnSearch")}</span>
        <input className="c4-field" aria-label={v4("rsnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("rsnEmpty")}</p>}
      <ul className="c4-rsn-rows">
        {shown.map((row) => {
          const name = reasonText(row.reason);
          const mark = reasonMarkOf(name);
          const familyMark = familyOf(name);
          const lengthMark = lengthOf(name);
          return (
            <li key={row.id} data-reason={name || "blank"}>
              <span className="c4-rsn-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("rsnBlank")}</p>
              {familyMark ? <p className="c4-rsn-family">{familyName(v4, familyMark)}</p> : null}
              {lengthMark ? <p className="c4-rsn-length">{lengthName(v4, lengthMark)}</p> : null}
              {mark ? <p className="c4-rsn-letter">{mark === "#" ? v4("rsnOther") : mark}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
