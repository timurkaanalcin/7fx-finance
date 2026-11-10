"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  HBF_DENSITY_KEY,
  HBF_KEY,
  HBF_VIEW_KEY,
  PLEDGE_KEY,
  PLEDGE_REVIEW_KEY,
  activeAuthor,
  activeHour,
  activeLane,
  activeLength,
  activePledgeBand,
  activePledgeTone,
  activeStage,
  activeWeight,
  addBrief,
  addBriefTag,
  addBriefView,
  authorArg,
  briefAuthors,
  briefCopy,
  briefCounts,
  briefLanes,
  briefShare,
  briefTimeline,
  briefsCsv,
  bulkBriefClose,
  bulkBriefLane,
  bulkBriefPin,
  bulkBriefTag,
  bulkPledgeReview,
  busiestAuthor,
  catalogPledge,
  catalogPledgeCount,
  clashHourCount,
  cycleStage,
  dawnHour,
  densityOf,
  dropBriefView,
  editBrief,
  editBriefNote,
  fairAuthor,
  hourArg,
  hourGap,
  houseLane,
  laneArg,
  lateBrief,
  leadingPledge,
  leadingPledgeTone,
  lengthArg,
  moveFocus,
  nextBrief,
  pagePledgeCount,
  peakHour,
  pledgeBand,
  pledgeBandArg,
  pledgeBands,
  pledgeCopy,
  pledgeRowsCsv,
  pledgeShare,
  pledgeState,
  pledgeTone,
  pledgeToneArg,
  pledgesCsv,
  presentPledges,
  readBriefViews,
  readBriefs,
  readHiddenPledges,
  readReviewedPledges,
  reminderBriefs,
  resetBriefs,
  setBriefClose,
  setBriefHold,
  setBriefPause,
  setBriefPin,
  sharedPledgeCount,
  soonBrief,
  sortBriefs,
  sortMode,
  stageArg,
  suggestAuthor,
  suggestLane,
  suggestLength,
  togglePledge,
  togglePledgeReview,
  usedHours,
  visibleBriefs,
  visiblePledgeBands,
  visiblePledgeCustomers,
  warmPledgeCount,
  weightArg,
  weightClashCount,
  type HandoffBrief,
  type HbfDensity,
  type HbfLane,
  type HbfSort,
  type HbfStage,
  type HbfTray,
  type HbfView,
  type PledgeRow,
  type PledgeShape,
} from "@/lib/crmv4/round198";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  retentionNote?: string | null;
};

type GlanceRow = PledgeRow & { id: string };

const LANES = ["ink", "oak", "gilt"] as const;
const BANDS = ["dot", "line", "page"] as const;

function laneLabel(v4: V4, lane: HbfLane | string): string {
  if (lane === "ink" || lane === "INK") return v4("hbfInk");
  if (lane === "oak" || lane === "OAK") return v4("hbfOak");
  if (lane === "gilt" || lane === "GILT") return v4("hbfGilt");
  return v4("hbfBlankLane");
}

function stageLabel(v4: V4, stage: HbfStage | string): string {
  if (stage === "draft") return v4("hbfDraft");
  if (stage === "sent") return v4("hbfSent");
  if (stage === "ack") return v4("hbfAck");
  return v4("hbfBlankStage");
}

function weightLabel(v4: V4, weight: number | null): string {
  if (weight === 1) return v4("hbfWeight1");
  if (weight === 3) return v4("hbfWeight3");
  if (weight === 5) return v4("hbfWeight5");
  return v4("hbfBlankWeight");
}

function lengthLabel(v4: V4, length: number | null): string {
  if (length === 20) return v4("hbfLen20");
  if (length === 40) return v4("hbfLen40");
  if (length === 80) return v4("hbfLen80");
  return v4("hbfBlankLen");
}

function bandLabel(v4: V4, name: string): string {
  if (name === "dot") return v4("pgmDot");
  if (name === "line") return v4("pgmLine");
  if (name === "page") return v4("pgmPage");
  if (name === "blank") return v4("pgmClear");
  return v4("pgmUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "warm") return v4("pgmWarm");
  if (name === "cool") return v4("pgmCool");
  return v4("pgmUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "hbfAuditSave",
    edit: "hbfAuditEdit",
    stage: "hbfAuditStage",
    pin: "hbfAuditPin",
    unpin: "hbfAuditUnpin",
    hold: "hbfAuditHold",
    lift: "hbfAuditLift",
    close: "hbfAuditClose",
    reopen: "hbfAuditReopen",
    lane: "hbfAuditLane",
    tag: "hbfAuditTag",
    pause: "hbfAuditPause",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, hour: number | null, desk: string): string {
  const gap = hourGap(hour, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("hbfPast")} ${gap}`;
  if (gap < 0) return `${v4("hbfAhead")} ${Math.abs(gap)}`;
  return v4("hbfDue");
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
  const node = event.target as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
}

function tagOfSafe(raw: string): boolean {
  return /^[a-z]+$/.test(raw.trim());
}

export function HandoffBriefs({ v4 }: { v4: V4 }) {
  const [briefs, setBriefs] = useState<HandoffBrief[]>([]);
  const [views, setViews] = useState<HbfView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [author, setAuthor] = useState("");
  const [hour, setHour] = useState("");
  const [lane, setLane] = useState("");
  const [stage, setStage] = useState("");
  const [weight, setWeight] = useState("");
  const [lengthValue, setLengthValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<HbfTray>("open");
  const [authorFilter, setAuthorFilter] = useState("all");
  const [laneFilter, setLaneFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [lengthFilter, setLengthFilter] = useState("all");
  const [draftingOnly, setDraftingOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [dawnOnly, setDawnOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [order, setOrder] = useState<HbfSort>("hour");
  const [density, setDensity] = useState<HbfDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskHour, setDeskHour] = useState("");
  const [moveLane, setMoveLane] = useState("ink");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readBriefs(readJson(HBF_KEY, []));
    const saved = readBriefViews(readJson(HBF_VIEW_KEY, []));
    setBriefs(next);
    setViews(saved);
    setDensity(densityOf(readJson(HBF_DENSITY_KEY, "roomy")));
    writeJson(HBF_KEY, next);
    writeJson(HBF_VIEW_KEY, saved);
    setRole(storedRole());
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: HandoffBrief[]) {
    const saved = readBriefs(next);
    setBriefs(saved);
    writeJson(HBF_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((brief) => brief.id === id)));
  }
  function storeViews(next: HbfView[]) {
    const saved = readBriefViews(next);
    setViews(saved);
    writeJson(HBF_VIEW_KEY, saved);
  }
  function storeDensity(next: HbfDensity) {
    setDensity(next);
    writeJson(HBF_DENSITY_KEY, next);
  }
  const authors = briefAuthors(briefs);
  const lanes = briefLanes(briefs);
  const bars = LANES.map((item) => ({ lane: item.toUpperCase(), count: briefs.filter((brief) => brief.lane === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const authorOn = activeAuthor(authorFilter, authors);
  const laneOn = activeLane(laneFilter, lanes);
  const stageOn = activeStage(stageFilter, ["draft", "sent", "ack"]);
  const hourOn = activeHour(hourFilter);
  const weightOn = activeWeight(weightFilter);
  const lengthOn = activeLength(lengthFilter);
  const pickedHour = hourArg(hourOn);
  const shown = sortBriefs(visibleBriefs(
    briefs,
    tray,
    query,
    authorArg(authorOn),
    laneArg(laneOn),
    stageArg(stageOn),
    pickedHour.exact,
    pickedHour.pick,
    weightArg(weightOn),
    lengthArg(lengthOn),
    draftingOnly,
    peakOnly,
    houseOnly,
    dawnOnly,
    awakeOnly,
  ), order);
  const timeline = briefTimeline(briefs, query);
  const counts = briefCounts(briefs, deskHour);
  const clashes = clashHourCount(briefs);
  const weights = weightClashCount(briefs);
  const nextId = nextBrief(briefs, deskHour);
  const nextRow = briefs.find((brief) => brief.id === nextId);
  const suggestedLane = suggestLane(briefs);
  const suggestedAuthor = suggestAuthor(briefs);
  const suggestedLength = suggestLength(briefs);
  const fair = fairAuthor(briefs, roster);
  const busy = busiestAuthor(briefs);
  const reminders = reminderBriefs(briefs, deskHour);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const focusAt = shown.length ? moveFocus(focus, shown.length, 0) : 0;
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveFocus(index, shown.length, -1));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);
  function clearDraft() {
    setTitle("");
    setNote("");
    setAuthor("");
    setHour("");
    setLane("");
    setStage("");
    setWeight("");
    setLengthValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: HbfView) {
    setTray(view.tray);
    setQuery(view.query);
    setAuthorFilter(view.author);
    setLaneFilter(view.lane);
    setStageFilter(view.stage);
    setHourFilter(view.hour);
    setWeightFilter(view.weight);
    setLengthFilter(view.length);
  }
  return (
    <section className="c4-hbf" aria-label={v4("hbfTitle")} data-handoff="1" data-role={role} data-density={density}>
      <header className="c4-hbf-mast">
        <div>
          <p className="c4-hbf-kicker">{v4("hbfSub")}</p>
          <h2 className="c4-title">{v4("hbfTitle")}</h2>
        </div>
        <p className="c4-hbf-plate" data-logo="mono">{v4("hbfLogo")}</p>
      </header>
      <p className="c4-hbf-rules">{v4("hbfHint")}</p>
      <p className="c4-meta">{v4("hbfLocal")}</p>
      <p className="c4-meta">{v4("hbfNew")} {v4("hbfSlash")} {v4("hbfEscape")} {v4("hbfKeys")}</p>
      {viewer && <p className="c4-hbf-notice" data-viewer="1">{v4("hbfViewer")}</p>}
      {counts.peak > 0 && (
        <p className="c4-hbf-notice" role="status">
          {v4("hbfNotice")} · {counts.peak}
          <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("hbfNoticeAll") : v4("hbfNoticePeak")}</button>
        </p>
      )}
      <dl className="c4-hbf-kpi" aria-label={v4("hbfKpi")}>
        <div><dt>{v4("hbfOpen")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("hbfHeld")}</dt><dd>{counts.held}</dd></div>
        <div><dt>{v4("hbfClosed")}</dt><dd>{counts.closed}</dd></div>
        <div><dt>{v4("hbfPinned")}</dt><dd>{counts.pinned}</dd></div>
        <div><dt>{v4("hbfPeak")}</dt><dd>{counts.peak}</dd></div>
        <div><dt>{v4("hbfLate")}</dt><dd>{counts.late}</dd></div>
        <div><dt>{v4("hbfSoon")}</dt><dd>{counts.soon}</dd></div>
        <div><dt>{v4("hbfPause")}</dt><dd>{counts.pause}</dd></div>
        <div><dt>{v4("hbfHouseShare")}</dt><dd>{briefShare(counts.house, briefs.length)}%</dd></div>
      </dl>
      <div className="c4-hbf-chart" aria-label={v4("hbfLanes")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-hbf-col">
            <div className="c4-hbf-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setLaneFilter(bar.lane)}>{laneLabel(v4, bar.lane)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("hbfEmpty")}</p>}
      </div>
      <p className="c4-meta">{v4("hbfSuggestLane")} · {laneLabel(v4, suggestedLane)} · {v4("hbfSuggestAuthor")} · {suggestedAuthor || v4("hbfBlankAuthor")} · {v4("hbfSuggestLen")} · {lengthLabel(v4, suggestedLength)}</p>
      <p className="c4-meta">{v4("hbfHours")} · {usedHours(briefs)} · {clashes ? `${v4("hbfClash")} · ${clashes}` : v4("hbfClashNone")} · {weights ? `${v4("hbfWeightClash")} · ${weights}` : v4("hbfWeightClashNone")}</p>
      <p className="c4-meta">{nextRow ? `${v4("hbfNext")} · ${nextRow.title}` : v4("hbfNextNone")} · {busy ? `${v4("hbfBusiest")} · ${busy}` : v4("hbfBusiestNone")} · {reminders.length ? `${v4("hbfReminders")} · ${reminders.length}` : v4("hbfReminderNone")}</p>
      <ul className="c4-hbf-reminders" aria-label={v4("hbfReminders")}>
        {reminders.map((brief) => (
          <li key={brief.id}>{brief.title} · {lateBrief(brief, deskHour) ? v4("hbfLate") : v4("hbfSoon")}</li>
        ))}
        {!reminders.length && <li className="c4-empty-gold">{v4("hbfReminderNone")}</li>}
      </ul>
      <form className="c4-hbf-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        store(addBrief(briefs, {
          id: `b${Date.now().toString(36)}`,
          title,
          note,
          author,
          hour,
          lane,
          stage,
          weight,
          length: lengthValue,
          tags: tag,
        }));
        setTitle("");
        setNote("");
      }}>
        <label className="c4-lab"><span>{v4("hbfLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("hbfLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("hbfNote")}</span>
          <input className="c4-field" aria-label={v4("hbfNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("hbfAuthor")}</span>
          <input className="c4-field" aria-label={v4("hbfAuthor")} value={author} disabled={viewer} onChange={(event) => setAuthor(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("hbfHour")}</span>
          <input className="c4-field" aria-label={v4("hbfHour")} value={hour} disabled={viewer} onChange={(event) => setHour(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("hbfLane")}</span>
          <select className="c4-field" aria-label={v4("hbfLane")} value={lane} disabled={viewer} onChange={(event) => setLane(event.target.value)}>
            <option value="">{v4("hbfBlankLane")}</option>
            {LANES.map((item) => <option key={item} value={item}>{laneLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("hbfStage")}</span>
          <select className="c4-field" aria-label={v4("hbfStage")} value={stage} disabled={viewer} onChange={(event) => setStage(event.target.value)}>
            <option value="">{v4("hbfBlankStage")}</option>
            <option value="draft">{v4("hbfDraft")}</option>
            <option value="sent">{v4("hbfSent")}</option>
            <option value="ack">{v4("hbfAck")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("hbfWeight")}</span>
          <input className="c4-field" aria-label={v4("hbfWeight")} value={weight} disabled={viewer} onChange={(event) => setWeight(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("hbfLen")}</span>
          <input className="c4-field" aria-label={v4("hbfLen")} value={lengthValue} disabled={viewer} onChange={(event) => setLengthValue(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("hbfTag")}</span>
          <input className="c4-field" aria-label={v4("hbfTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("hbfRoster")}</span>
          <input className="c4-field" aria-label={v4("hbfRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("hbfAdd")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setLane(suggestedLane.toLowerCase())}>{v4("hbfUseLane")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !suggestedAuthor} onClick={() => setAuthor(suggestedAuthor)}>{v4("hbfUseAuthor")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setLengthValue(String(suggestedLength))}>{v4("hbfUseLen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setAuthor(fair)}>{v4("hbfAssign")}</button>
      </form>
      <div className="c4-hbf-filters">
        <label className="c4-lab"><span>{v4("hbfSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("hbfSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("hbfDeskHour")}</span>
          <input className="c4-field" aria-label={v4("hbfDeskHour")} value={deskHour} onChange={(event) => setDeskHour(event.target.value)} />
        </label>
      </div>
      <div className="c4-row">
        {(["open", "held", "closed"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} aria-pressed={tray === item} onClick={() => setTray(item)}>
            {item === "open" ? v4("hbfOpen") : item === "held" ? v4("hbfHeld") : v4("hbfClosed")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={draftingOnly ? "1" : "0"} aria-pressed={draftingOnly} onClick={() => setDraftingOnly((on) => !on)}>{v4("hbfDrafting")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} aria-pressed={houseOnly} onClick={() => setHouseOnly((on) => !on)}>{v4("hbfHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={dawnOnly ? "1" : "0"} aria-pressed={dawnOnly} onClick={() => setDawnOnly((on) => !on)}>{v4("hbfDawnOnly")}</button>
        <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} aria-pressed={awakeOnly} onClick={() => setAwakeOnly((on) => !on)}>{v4("hbfAwake")}</button>
        <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} aria-pressed={board === "cards"} onClick={() => setBoard("cards")}>{v4("hbfCards")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard("timeline")}>{v4("hbfTimeline")}</button>
        <button type="button" className="c4-chip" data-on={order === "hour" ? "1" : "0"} aria-pressed={order === "hour"} onClick={() => setOrder(sortMode(order === "hour" ? "title" : "hour"))}>{order === "hour" ? v4("hbfSortHour") : v4("hbfSortTitle")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} aria-pressed={density === "tight"} onClick={() => storeDensity(densityOf(density === "tight" ? "roomy" : "tight"))}>{density === "tight" ? v4("hbfTight") : v4("hbfRoomy")}</button>
      </div>
      <div className="c4-hbf-filters">
        <label className="c4-lab"><span>{v4("hbfAuthor")}</span>
          <select className="c4-field" aria-label={v4("hbfAuthor")} value={authorOn} onChange={(event) => setAuthorFilter(event.target.value)}>
            <option value="all">{v4("hbfAll")}</option>
            <option value="blank">{v4("hbfBlankAuthor")}</option>
            {authors.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("hbfLane")}</span>
          <select className="c4-field" aria-label={v4("hbfLane")} value={laneOn} onChange={(event) => setLaneFilter(event.target.value)}>
            <option value="all">{v4("hbfAll")}</option>
            <option value="blank">{v4("hbfBlankLane")}</option>
            {lanes.map((item) => <option key={item} value={item}>{laneLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("hbfStage")}</span>
          <select className="c4-field" aria-label={v4("hbfStage")} value={stageOn} onChange={(event) => setStageFilter(event.target.value)}>
            <option value="all">{v4("hbfAll")}</option>
            <option value="blank">{v4("hbfBlankStage")}</option>
            <option value="draft">{v4("hbfDraft")}</option>
            <option value="sent">{v4("hbfSent")}</option>
            <option value="ack">{v4("hbfAck")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("hbfHour")}</span>
          <select className="c4-field" aria-label={v4("hbfHour")} value={hourOn} onChange={(event) => setHourFilter(event.target.value)}>
            <option value="all">{v4("hbfAll")}</option>
            <option value="blank">{v4("hbfBlankHour")}</option>
            <option value="early">{v4("hbfEarly")}</option>
            <option value="mid">{v4("hbfMid")}</option>
            <option value="late">{v4("hbfLateBand")}</option>
            <option value="peak">{v4("hbfPeak")}</option>
            <option value="dawn">{v4("hbfDawn")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("hbfWeight")}</span>
          <select className="c4-field" aria-label={v4("hbfWeight")} value={weightOn} onChange={(event) => setWeightFilter(event.target.value)}>
            <option value="all">{v4("hbfAll")}</option>
            <option value="blank">{v4("hbfBlankWeight")}</option>
            <option value="1">{v4("hbfWeight1")}</option>
            <option value="3">{v4("hbfWeight3")}</option>
            <option value="5">{v4("hbfWeight5")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("hbfLen")}</span>
          <select className="c4-field" aria-label={v4("hbfLen")} value={lengthOn} onChange={(event) => setLengthFilter(event.target.value)}>
            <option value="all">{v4("hbfAll")}</option>
            <option value="blank">{v4("hbfBlankLen")}</option>
            <option value="20">{v4("hbfLen20")}</option>
            <option value="40">{v4("hbfLen40")}</option>
            <option value="80">{v4("hbfLen80")}</option>
          </select>
        </label>
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        if (viewer || !viewName.trim()) return;
        storeViews(addBriefView(views, {
          id: `v${Date.now().toString(36)}`,
          name: viewName,
          tray,
          query,
          author: authorOn,
          lane: laneOn,
          stage: stageOn,
          hour: hourOn,
          weight: weightOn,
          length: lengthOn,
        }));
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("hbfViews")}</span>
          <input className="c4-field" aria-label={v4("hbfViews")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("hbfSaveView")}</button>
      </form>
      {!!views.length && (
        <ul className="c4-hbf-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropBriefView(views, view.id))}>{v4("hbfDropView")}</button>
            </li>
          ))}
        </ul>
      )}
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((brief) => brief.id))}>{v4("hbfPickAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("hbfPickNone")}</button>
        <span className="c4-meta">{v4("hbfPicked")} · {picked.length}</span>
        <select className="c4-field" aria-label={v4("hbfBulkLane")} value={moveLane} disabled={viewer} onChange={(event) => setMoveLane(event.target.value)}>
          {LANES.map((item) => <option key={item} value={item}>{laneLabel(v4, item)}</option>)}
        </select>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBriefLane(briefs, picked, moveLane))}>{v4("hbfBulkLane")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBriefPin(briefs, picked, true))}>{v4("hbfBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBriefClose(briefs, picked, true))}>{v4("hbfBulkClose")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length || !tagOfSafe(tag)} onClick={() => store(bulkBriefTag(briefs, picked, tag))}>{v4("hbfBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("handoff-briefs.csv", briefsCsv(briefs, deskHour))}>{v4("hbfCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetBriefs())}>{v4("hbfReset")}</button>
      </div>
      {board === "timeline" ? (
        <ol className="c4-hbf-time" aria-label={v4("hbfTimeline")}>
          {timeline.map((brief) => (
            <li key={brief.id} data-peak={peakHour(brief.hour) ? "1" : "0"} data-house={houseLane(brief.lane) ? "1" : "0"} data-dawn={dawnHour(brief.hour) ? "1" : "0"}>
              <strong>{brief.hour}</strong>
              <span>{brief.title}</span>
              <span>{gapLabel(v4, brief.hour, deskHour)}</span>
            </li>
          ))}
          {!timeline.length && <li className="c4-empty-gold">{v4("hbfEmpty")}</li>}
        </ol>
      ) : (
        <ul className="c4-hbf-cards">
          {shown.map((brief, index) => {
            const open = editing === brief.id;
            return (
              <li key={brief.id} data-focus={index === focusAt ? "1" : "0"} data-peak={peakHour(brief.hour) ? "1" : "0"} data-late={lateBrief(brief, deskHour) ? "1" : "0"} data-soon={soonBrief(brief) ? "1" : "0"} data-house={houseLane(brief.lane) ? "1" : "0"} data-dawn={dawnHour(brief.hour) ? "1" : "0"}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(brief.id)} aria-label={brief.title} onChange={() => setPicked((ids) => ids.includes(brief.id) ? ids.filter((id) => id !== brief.id) : [...ids, brief.id])} />
                  {open ? (
                    <input className="c4-field" aria-label={v4("hbfEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                  ) : <strong>{brief.title}</strong>}
                </label>
                <p className="c4-meta">{brief.author || v4("hbfBlankAuthor")} · {brief.hour ?? v4("hbfBlankHour")} · {laneLabel(v4, brief.lane)} · {stageLabel(v4, brief.stage)} · {weightLabel(v4, brief.weight)} · {lengthLabel(v4, brief.length)} · {gapLabel(v4, brief.hour, deskHour)} · {auditLabel(v4, brief.audit)}</p>
                <p className="c4-meta">{brief.tags.join(" ") || v4("hbfBlankTag")} · {brief.note}</p>
                {open && (
                  <input className="c4-field" aria-label={v4("hbfNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                )}
                <div className="c4-row">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleStage(briefs, brief.id))}>{v4("hbfStageUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBriefPin(briefs, brief.id, !brief.pinned))}>{brief.pinned ? v4("hbfUnpin") : v4("hbfPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBriefHold(briefs, brief.id, !brief.held))}>{brief.held ? v4("hbfLift") : v4("hbfHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBriefClose(briefs, brief.id, !brief.closed))}>{brief.closed ? v4("hbfReopen") : v4("hbfClose")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBriefPause(briefs, brief.id, brief.pause ? 0 : 20))}>{brief.pause ? v4("hbfPauseOff") : v4("hbfPauseOn")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || !tagOfSafe(tag)} onClick={() => store(addBriefTag(briefs, brief.id, tag))}>{v4("hbfTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                    if (open) {
                      store(editBriefNote(editBrief(briefs, brief.id, draft), brief.id, noteDraft));
                      setEditing("");
                      return;
                    }
                    setEditing(brief.id);
                    setDraft(brief.title);
                    setNoteDraft(brief.note);
                  }}>{open ? v4("hbfSaveView") : v4("hbfEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => {
                    void navigator.clipboard?.writeText(briefCopy(brief, deskHour));
                    setCopied(brief.id);
                  }}>{copied === brief.id ? v4("hbfCopied") : v4("hbfCopy")}</button>
                </div>
              </li>
            );
          })}
          {!shown.length && <li className="c4-empty-gold">{v4("hbfEmpty")}</li>}
        </ul>
      )}
      <p className="c4-meta">{v4("hbfRules")}</p>
    </section>
  );
}

export function PledgeMarks({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<PledgeShape>("all");
  const [review, setReview] = useState<"all" | "reviewed" | "open">("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GlanceRow[]>(() => (data.data?.users || []).map((user) => ({
    id: user.id,
    label: user.name || user.id,
    note: { retentionNote: user.retentionNote ?? null },
  })), [data.data?.users]);
  useEffect(() => {
    setRole(storedRole());
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  useEffect(() => {
    const present = presentPledges(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenPledges(readJson(PLEDGE_KEY, []), present);
    const nextReviewed = readReviewedPledges(readJson(PLEDGE_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(PLEDGE_KEY, nextHidden);
    writeJson(PLEDGE_REVIEW_KEY, nextReviewed);
  }, [rows]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N" || event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const present = presentPledges(rows);
  const bands = visiblePledgeBands(present, hidden, showHidden);
  const bandOn = activePledgeBand(band, present);
  const toneOn = activePledgeTone(tone);
  const shown = visiblePledgeCustomers(rows, pledgeBandArg(bandOn), pledgeToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = pledgeState(row.note);
      const token = state === "set" ? pledgeBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingPledge(rows);
  const toneLead = leadingPledgeTone(rows);
  const shared = sharedPledgeCount(rows);
  const catalog = catalogPledgeCount(rows);
  const bars = pledgeBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(PLEDGE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedPledges(next, ids);
    setReviewed(saved);
    writeJson(PLEDGE_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-pgm" aria-label={v4("pgmTitle")} data-pledges="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <header className="c4-pgm-mast">
        <div>
          <p className="c4-pgm-kicker">{v4("pgmSub")}</p>
          <h2 className="c4-title">{v4("pgmTitle")}</h2>
        </div>
        <p className="c4-pgm-plate" data-logo="mono">{v4("pgmLogo")}</p>
      </header>
      <p className="c4-pgm-rules">{v4("pgmHint")}</p>
      <p className="c4-meta">{v4("pgmKept")} {v4("pgmEscape")}</p>
      {viewer && <p className="c4-pgm-notice" data-viewer="1">{v4("pgmViewer")}</p>}
      {data.error && <p className="c4-empty-gold" role="alert">{v4("pgmFailed")}</p>}
      {data.loading && <p className="c4-meta">{v4("pgmLoading")}</p>}
      {shared > 0 && <p className="c4-pgm-notice" role="status">{v4("pgmNotice")} · {shared}</p>}
      <dl className="c4-pgm-kpi" aria-label={v4("pgmKpi")}>
        <div><dt>{v4("pgmSet")}</dt><dd>{rows.filter((row) => pledgeState(row.note) === "set").length}</dd></div>
        <div><dt>{v4("pgmCatalog")}</dt><dd>{catalog}</dd></div>
        <div><dt>{v4("pgmPageCount")}</dt><dd>{pagePledgeCount(rows)}</dd></div>
        <div><dt>{v4("pgmWarmCount")}</dt><dd>{warmPledgeCount(rows)}</dd></div>
        <div><dt>{v4("pgmShare")}</dt><dd>{pledgeShare(catalog, rows.length)}%</dd></div>
        <div><dt>{v4("pgmShared")}</dt><dd>{shared}</dd></div>
      </dl>
      <div className="c4-pgm-chart" aria-label={v4("pgmBands")}>
        {bars.map((bar) => (
          <div key={bar.band} className="c4-pgm-col">
            <div className="c4-pgm-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandLabel(v4, bar.band)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("pgmEmpty")}</p>}
      </div>
      <p className="c4-meta">{lead ? `${v4("pgmLeading")} · ${bandLabel(v4, lead)}` : v4("pgmLeadingNone")} · {toneLead ? `${v4("pgmToneLead")} · ${toneLabel(v4, toneLead)}` : v4("pgmToneNone")} · {shared ? `${v4("pgmShared")} · ${shared}` : v4("pgmSharedNone")}</p>
      <div className="c4-pgm-filters">
        <label className="c4-lab"><span>{v4("pgmSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("pgmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab"><span>{v4("pgmBands")}</span>
          <select className="c4-field" aria-label={v4("pgmBands")} value={bandOn} onChange={(event) => setBand(event.target.value)}>
            <option value="all">{v4("pgmAll")}</option>
            <option value="blank">{v4("pgmClear")}</option>
            {BANDS.map((item) => <option key={item} value={item}>{bandLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pgmTone")}</span>
          <select className="c4-field" aria-label={v4("pgmTone")} value={toneOn} onChange={(event) => setTone(event.target.value)}>
            <option value="all">{v4("pgmAll")}</option>
            <option value="warm">{v4("pgmWarm")}</option>
            <option value="cool">{v4("pgmCool")}</option>
          </select>
        </label>
      </div>
      <div className="c4-row">
        {(["all", "catalog", "page", "warm"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} aria-pressed={shape === item} onClick={() => setShape(item)}>
            {item === "all" ? v4("pgmAllShapes") : item === "catalog" ? v4("pgmCatalog") : item === "page" ? v4("pgmPage") : v4("pgmWarm")}
          </button>
        ))}
        {(["all", "reviewed", "open"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} aria-pressed={review === item} onClick={() => setReview(item)}>
            {item === "all" ? v4("pgmAllReview") : item === "reviewed" ? v4("pgmReviewed") : v4("pgmOpenReview")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("pgmShown") : v4("pgmHidden")}</button>
      </div>
      <ul className="c4-pgm-bands" aria-label={v4("pgmBands")}>
        {present.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(togglePledge(hidden, item, present))}>{bandLabel(v4, item)} · {hidden.includes(item) ? v4("pgmShow") : v4("pgmHide")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPledgeReview(reviewed, shown.flatMap((row) => (row.id ? [row.id] : [])), ids, true))}>{v4("pgmBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPledgeReview(reviewed, shown.flatMap((row) => (row.id ? [row.id] : [])), ids, false))}>{v4("pgmBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("pledge-marks.csv", pledgesCsv(rows))}>{v4("pgmCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("pledge-mark-rows.csv", pledgeRowsCsv(shown, reviewed))}>{v4("pgmRowCsv")}</button>
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("pgmCustomers")}</Link>
      </div>
      <ul className="c4-pgm-rows">
        {shown.map((row) => {
          const code = pledgeCopy(row.note);
          const marked = reviewed.includes(row.id);
          return (
            <li key={row.id || row.label} data-band={pledgeBand(row.note) || "blank"} data-tone={pledgeTone(row.note) || "blank"} data-catalog={catalogPledge(row.note) ? "1" : "0"} data-reviewed={marked ? "1" : "0"}>
              <strong>{row.label}</strong>
              <p className="c4-meta">{code || v4("pgmClear")} · {bandLabel(v4, pledgeBand(row.note) || (pledgeState(row.note) === "clear" ? "blank" : ""))} · {toneLabel(v4, pledgeTone(row.note))} {catalogPledge(row.note) ? `· ${v4("pgmCatalogMark")}` : ""}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(togglePledgeReview(reviewed, row.id, ids))}>{marked ? v4("pgmReviewed") : v4("pgmReview")}</button>
                <button type="button" className="c4-btn" disabled={!code} onClick={() => {
                  if (!code) return;
                  void navigator.clipboard?.writeText(code);
                  setCopied(row.id);
                }}>{copied === row.id ? v4("pgmCopied") : v4("pgmCopy")}</button>
              </div>
            </li>
          );
        })}
        {!data.loading && !shown.length && <li className="c4-empty-gold">{v4("pgmEmpty")}</li>}
      </ul>
      <p className="c4-meta">{v4("pgmRules")}</p>
    </section>
  );
}
