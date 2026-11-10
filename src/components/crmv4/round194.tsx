"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CCR_DENSITY_KEY,
  CCR_KEY,
  CCR_VIEW_KEY,
  SEAL_KEY,
  SEAL_REVIEW_KEY,
  activeAgent,
  activeDesk,
  activeHour,
  activeSealBand,
  activeSealTone,
  activeStage,
  activeTone,
  activeWeight,
  activeWindow,
  addCard,
  addCardTag,
  addCardView,
  agentArg,
  bulkCardClose,
  bulkCardPin,
  bulkCardTag,
  bulkCardTone,
  bulkSealReview,
  busiestAgent,
  cardCopy,
  cardCounts,
  cardDesks,
  cardShare,
  cardTimeline,
  cardsCsv,
  catalogSeal,
  catalogSealCount,
  clashHourCount,
  cycleStage,
  densityOf,
  deskArg,
  dropCardView,
  editCard,
  editCardNote,
  fairAgent,
  hourArg,
  hourGap,
  houseDesk,
  lateCard,
  leadingSeal,
  leadingSealTone,
  moveFocus,
  nextCard,
  presentSeals,
  readCardViews,
  readCards,
  readHiddenSeals,
  readReviewedSeals,
  reminderCards,
  resetCards,
  sealBand,
  sealBandArg,
  sealBands,
  sealCopy,
  sealRowsCsv,
  sealShare,
  sealState,
  sealTone,
  sealToneArg,
  sealsCsv,
  setCardClose,
  setCardHold,
  setCardPin,
  setCardSnooze,
  sharedSealCount,
  softSealCount,
  soonCard,
  sortCards,
  sortMode,
  stageArg,
  suggestAgent,
  suggestTone,
  suggestWindow,
  toneArg,
  toneCounts,
  toggleSeal,
  toggleSealReview,
  usedHours,
  visibleCards,
  visibleSealBands,
  visibleSealCustomers,
  weightArg,
  weightClashCount,
  wideSealCount,
  windowArg,
  type CcrDensity,
  type CcrSort,
  type CcrStage,
  type CcrTone,
  type CcrTray,
  type CcrView,
  type Courtesy,
  type SealRow,
  type SealShape,
} from "@/lib/crmv4/round194";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  country?: string | null;
};

type GlanceRow = SealRow & { id: string };

const TONES = ["calm", "brisk", "warm", "firm"] as const;
const BANDS = ["pair", "trio", "span"] as const;

function toneLabel(v4: V4, tone: CcrTone | string): string {
  if (tone === "calm") return v4("ccrCalm");
  if (tone === "brisk") return v4("ccrBrisk");
  if (tone === "warm") return v4("ccrWarm");
  if (tone === "firm") return v4("ccrFirm");
  return v4("ccrBlankTone");
}

function stageLabel(v4: V4, stage: CcrStage | string): string {
  if (stage === "draft") return v4("ccrDraft");
  if (stage === "ring") return v4("ccrRing");
  if (stage === "done") return v4("ccrDone");
  return v4("ccrBlankStage");
}

function weightLabel(v4: V4, weight: number | null): string {
  if (weight === 1) return v4("ccrWeight1");
  if (weight === 3) return v4("ccrWeight3");
  if (weight === 5) return v4("ccrWeight5");
  return v4("ccrBlankWeight");
}

function windowLabel(v4: V4, span: number | null): string {
  if (span === 10) return v4("ccrWindow10");
  if (span === 20) return v4("ccrWindow20");
  if (span === 40) return v4("ccrWindow40");
  return v4("ccrBlankWindow");
}

function bandLabel(v4: V4, name: string): string {
  if (name === "pair") return v4("nslPair");
  if (name === "trio") return v4("nslTrio");
  if (name === "span") return v4("nslSpan");
  if (name === "blank") return v4("nslClear");
  return v4("nslUnmarked");
}

function sealToneLabel(v4: V4, name: string): string {
  if (name === "soft") return v4("nslSoft");
  if (name === "hard") return v4("nslHard");
  return v4("nslUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "ccrAuditSave",
    edit: "ccrAuditEdit",
    stage: "ccrAuditStage",
    pin: "ccrAuditPin",
    unpin: "ccrAuditUnpin",
    hold: "ccrAuditHold",
    lift: "ccrAuditLift",
    close: "ccrAuditClose",
    reopen: "ccrAuditReopen",
    tone: "ccrAuditTone",
    tag: "ccrAuditTag",
    snooze: "ccrAuditSnooze",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, hour: number | null, desk: string): string {
  const gap = hourGap(hour, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("ccrPast")} ${gap}`;
  if (gap < 0) return `${v4("ccrAhead")} ${Math.abs(gap)}`;
  return v4("ccrDue");
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

export function CourtesyCards({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Courtesy[]>([]);
  const [views, setViews] = useState<CcrView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [agent, setAgent] = useState("");
  const [hour, setHour] = useState("");
  const [tone, setTone] = useState("");
  const [desk, setDesk] = useState("");
  const [stage, setStage] = useState("");
  const [weight, setWeight] = useState("");
  const [spanValue, setSpanValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<CcrTray>("open");
  const [agentFilter, setAgentFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState("all");
  const [deskFilter, setDeskFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [windowFilter, setWindowFilter] = useState("all");
  const [ringOnly, setRingOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [order, setOrder] = useState<CcrSort>("hour");
  const [density, setDensity] = useState<CcrDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskHour, setDeskHour] = useState("");
  const [moveTone, setMoveTone] = useState("firm");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readCards(readJson(CCR_KEY, []));
    const saved = readCardViews(readJson(CCR_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    setDensity(densityOf(readJson(CCR_DENSITY_KEY, "roomy")));
    writeJson(CCR_KEY, next);
    writeJson(CCR_VIEW_KEY, saved);
    setRole(storedRole());
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: Courtesy[]) {
    const saved = readCards(next);
    setCards(saved);
    writeJson(CCR_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  function storeViews(next: CcrView[]) {
    const saved = readCardViews(next);
    setViews(saved);
    writeJson(CCR_VIEW_KEY, saved);
  }
  function storeDensity(next: CcrDensity) {
    setDensity(next);
    writeJson(CCR_DENSITY_KEY, next);
  }
  const agents = cardAgentsSafe(cards);
  const desks = cardDesks(cards);
  const bars = toneCounts(cards);
  const agentOn = activeAgent(agentFilter, agents);
  const toneOn = activeTone(toneFilter, TONES);
  const deskOn = activeDesk(deskFilter, desks);
  const stageOn = activeStage(stageFilter, ["draft", "ring", "done"]);
  const hourOn = activeHour(hourFilter);
  const weightOn = activeWeight(weightFilter);
  const windowOn = activeWindow(windowFilter);
  const pickedHour = hourArg(hourOn);
  const shown = sortCards(visibleCards(
    cards,
    tray,
    query,
    agentArg(agentOn),
    toneArg(toneOn),
    deskArg(deskOn),
    stageArg(stageOn),
    pickedHour.exact,
    pickedHour.pick,
    weightArg(weightOn),
    windowArg(windowOn),
    ringOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    awakeOnly,
  ), order);
  const timeline = cardTimeline(cards, query);
  const counts = cardCounts(cards, deskHour);
  const clashes = clashHourCount(cards);
  const weights = weightClashCount(cards);
  const nextId = nextCard(cards, deskHour);
  const nextRow = cards.find((card) => card.id === nextId);
  const suggestedTone = suggestTone(cards);
  const suggestedAgent = suggestAgent(cards);
  const suggestedWindow = suggestWindow(cards);
  const fair = fairAgent(cards, roster);
  const busy = busiestAgent(cards);
  const reminders = reminderCards(cards, deskHour);
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
    setAgent("");
    setHour("");
    setTone("");
    setDesk("");
    setStage("");
    setWeight("");
    setSpanValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  return (
    <section className="c4-ccr" aria-label={v4("ccrTitle")} data-courtesy="1" data-role={role} data-density={density}>
      <header className="c4-ccr-mast">
        <div>
          <p className="c4-ccr-kicker">{v4("ccrSub")}</p>
          <h2 className="c4-title">{v4("ccrTitle")}</h2>
        </div>
        <p className="c4-ccr-plate" data-logo="mono">{v4("ccrLogo")}</p>
      </header>
      <p className="c4-ccr-rules">{v4("ccrHint")}</p>
      <p className="c4-meta">{v4("ccrLocal")}</p>
      <p className="c4-meta">{v4("ccrNew")} {v4("ccrSlash")} {v4("ccrEscape")} {v4("ccrKeys")}</p>
      {viewer && <p className="c4-ccr-notice" data-viewer="1">{v4("ccrViewer")}</p>}
      {counts.peak > 0 && (
        <p className="c4-ccr-notice" role="status">
          {v4("ccrNotice")} · {counts.peak}
          <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("ccrNoticeAll") : v4("ccrNoticePeak")}</button>
        </p>
      )}
      <dl className="c4-ccr-kpi" aria-label={v4("ccrKpi")}>
        <div><dt>{v4("ccrOpen")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("ccrHeld")}</dt><dd>{counts.held}</dd></div>
        <div><dt>{v4("ccrClosed")}</dt><dd>{counts.closed}</dd></div>
        <div><dt>{v4("ccrPinned")}</dt><dd>{counts.pinned}</dd></div>
        <div><dt>{v4("ccrPeak")}</dt><dd>{counts.peak}</dd></div>
        <div><dt>{v4("ccrLate")}</dt><dd>{counts.late}</dd></div>
        <div><dt>{v4("ccrSoon")}</dt><dd>{counts.soon}</dd></div>
        <div><dt>{v4("ccrSnoozed")}</dt><dd>{counts.snoozed}</dd></div>
        <div><dt>{v4("ccrHouseShare")}</dt><dd>{cardShare(counts.house, cards.length)}%</dd></div>
      </dl>
      <div className="c4-ccr-chart" aria-label={v4("ccrTones")}>
        {bars.map((bar) => (
          <div key={bar.tone} className="c4-ccr-col">
            <div className="c4-ccr-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setToneFilter(bar.tone)}>{toneLabel(v4, bar.tone)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("ccrEmpty")}</p>}
      </div>
      <p className="c4-meta">{v4("ccrSuggestTone")} · {toneLabel(v4, suggestedTone)} · {v4("ccrSuggestAgent")} · {suggestedAgent || v4("ccrBlankAgent")} · {v4("ccrSuggestWindow")} · {windowLabel(v4, suggestedWindow)}</p>
      <p className="c4-meta">{v4("ccrHourUse")} · {usedHours(cards)} · {clashes ? `${v4("ccrClash")} · ${clashes}` : v4("ccrClashNone")} · {weights ? `${v4("ccrWeightClash")} · ${weights}` : v4("ccrWeightClashNone")}</p>
      <p className="c4-meta">{nextRow ? `${v4("ccrNext")} · ${nextRow.title}` : v4("ccrNextNone")} · {busy ? `${v4("ccrBusiest")} · ${busy}` : v4("ccrBusiestNone")} · {reminders.length ? `${v4("ccrReminders")} · ${reminders.length}` : v4("ccrReminderNone")}</p>
      <form className="c4-ccr-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        store(addCard(cards, {
          id: `c${Date.now().toString(36)}`,
          title,
          note,
          agent,
          hour,
          tone,
          desk,
          stage,
          weight,
          window: spanValue,
          tags: tag,
        }));
        setTitle("");
        setNote("");
      }}>
        <label className="c4-lab"><span>{v4("ccrLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("ccrLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("ccrNote")}</span>
          <input className="c4-field" aria-label={v4("ccrNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("ccrAgent")}</span>
          <input className="c4-field" aria-label={v4("ccrAgent")} value={agent} disabled={viewer} onChange={(event) => setAgent(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("ccrHour")}</span>
          <input className="c4-field" aria-label={v4("ccrHour")} value={hour} disabled={viewer} onChange={(event) => setHour(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("ccrTone")}</span>
          <select className="c4-field" aria-label={v4("ccrTone")} value={tone} disabled={viewer} onChange={(event) => setTone(event.target.value)}>
            <option value="">{v4("ccrBlankTone")}</option>
            {TONES.map((item) => <option key={item} value={item}>{toneLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ccrDesk")}</span>
          <input className="c4-field" aria-label={v4("ccrDesk")} value={desk} disabled={viewer} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("ccrStage")}</span>
          <select className="c4-field" aria-label={v4("ccrStage")} value={stage} disabled={viewer} onChange={(event) => setStage(event.target.value)}>
            <option value="">{v4("ccrBlankStage")}</option>
            <option value="draft">{v4("ccrDraft")}</option>
            <option value="ring">{v4("ccrRing")}</option>
            <option value="done">{v4("ccrDone")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ccrWeight")}</span>
          <input className="c4-field" aria-label={v4("ccrWeight")} value={weight} disabled={viewer} onChange={(event) => setWeight(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("ccrWindow")}</span>
          <input className="c4-field" aria-label={v4("ccrWindow")} value={spanValue} disabled={viewer} onChange={(event) => setSpanValue(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("ccrTag")}</span>
          <input className="c4-field" aria-label={v4("ccrTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("ccrRoster")}</span>
          <input className="c4-field" aria-label={v4("ccrRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ccrAdd")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setTone(suggestedTone)}>{v4("ccrUseTone")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !suggestedAgent} onClick={() => setAgent(suggestedAgent)}>{v4("ccrUseAgent")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setSpanValue(String(suggestedWindow))}>{v4("ccrUseWindow")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setAgent(fair)}>{v4("ccrAssign")}</button>
      </form>
      <p className="c4-meta">{v4("ccrBlank")} {v4("ccrHourBlank")}</p>
      <div className="c4-ccr-filters">
        <label className="c4-lab"><span>{v4("ccrSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("ccrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("ccrHour")}</span>
          <input className="c4-field" aria-label={v4("ccrDeskHour")} value={deskHour} onChange={(event) => setDeskHour(event.target.value)} />
        </label>
      </div>
      <div className="c4-row">
        {(["open", "held", "closed"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} aria-pressed={tray === item} onClick={() => setTray(item)}>
            {item === "open" ? v4("ccrTrayOpen") : item === "held" ? v4("ccrTrayHeld") : v4("ccrTrayClosed")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={ringOnly ? "1" : "0"} aria-pressed={ringOnly} onClick={() => setRingOnly((on) => !on)}>{v4("ccrRing")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} aria-pressed={houseOnly} onClick={() => setHouseOnly((on) => !on)}>{v4("ccrHouse")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} aria-pressed={quietOnly} onClick={() => setQuietOnly((on) => !on)}>{v4("ccrQuiet")}</button>
        <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} aria-pressed={awakeOnly} onClick={() => setAwakeOnly((on) => !on)}>{v4("ccrAwake")}</button>
        <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} aria-pressed={board === "cards"} onClick={() => setBoard("cards")}>{v4("ccrCards")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard("timeline")}>{v4("ccrTimeline")}</button>
        <button type="button" className="c4-chip" data-on={order === "hour" ? "1" : "0"} aria-pressed={order === "hour"} onClick={() => setOrder(sortMode(order === "hour" ? "title" : "hour"))}>{order === "hour" ? v4("ccrSortHour") : v4("ccrSortTitle")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} aria-pressed={density === "tight"} onClick={() => storeDensity(densityOf(density === "tight" ? "roomy" : "tight"))}>{density === "tight" ? v4("ccrTight") : v4("ccrRoomy")}</button>
      </div>
      <div className="c4-ccr-filters">
        <label className="c4-lab"><span>{v4("ccrAgent")}</span>
          <select className="c4-field" aria-label={v4("ccrAgent")} value={agentOn} onChange={(event) => setAgentFilter(event.target.value)}>
            <option value="all">{v4("ccrAll")}</option>
            <option value="blank">{v4("ccrBlankAgent")}</option>
            {agents.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ccrTone")}</span>
          <select className="c4-field" aria-label={v4("ccrTone")} value={toneOn} onChange={(event) => setToneFilter(event.target.value)}>
            <option value="all">{v4("ccrAll")}</option>
            <option value="blank">{v4("ccrBlankTone")}</option>
            {TONES.map((item) => <option key={item} value={item}>{toneLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ccrDesk")}</span>
          <select className="c4-field" aria-label={v4("ccrDesk")} value={deskOn} onChange={(event) => setDeskFilter(event.target.value)}>
            <option value="all">{v4("ccrAll")}</option>
            <option value="blank">{v4("ccrBlankDesk")}</option>
            {desks.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ccrStage")}</span>
          <select className="c4-field" aria-label={v4("ccrStage")} value={stageOn} onChange={(event) => setStageFilter(event.target.value)}>
            <option value="all">{v4("ccrAll")}</option>
            <option value="blank">{v4("ccrBlankStage")}</option>
            <option value="draft">{v4("ccrDraft")}</option>
            <option value="ring">{v4("ccrRing")}</option>
            <option value="done">{v4("ccrDone")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ccrHour")}</span>
          <select className="c4-field" aria-label={v4("ccrHour")} value={hourOn} onChange={(event) => setHourFilter(event.target.value)}>
            <option value="all">{v4("ccrAll")}</option>
            <option value="blank">{v4("ccrBlankHour")}</option>
            <option value="dawn">{v4("ccrDawn")}</option>
            <option value="day">{v4("ccrDay")}</option>
            <option value="night">{v4("ccrNight")}</option>
            <option value="peak">{v4("ccrPeak")}</option>
            <option value="quiet">{v4("ccrQuiet")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ccrWeight")}</span>
          <select className="c4-field" aria-label={v4("ccrWeight")} value={weightOn} onChange={(event) => setWeightFilter(event.target.value)}>
            <option value="all">{v4("ccrAll")}</option>
            <option value="blank">{v4("ccrBlankWeight")}</option>
            <option value="1">{v4("ccrWeight1")}</option>
            <option value="3">{v4("ccrWeight3")}</option>
            <option value="5">{v4("ccrWeight5")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ccrWindow")}</span>
          <select className="c4-field" aria-label={v4("ccrWindow")} value={windowOn} onChange={(event) => setWindowFilter(event.target.value)}>
            <option value="all">{v4("ccrAll")}</option>
            <option value="blank">{v4("ccrBlankWindow")}</option>
            <option value="10">{v4("ccrWindow10")}</option>
            <option value="20">{v4("ccrWindow20")}</option>
            <option value="40">{v4("ccrWindow40")}</option>
          </select>
        </label>
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        if (viewer || !viewName.trim()) return;
        storeViews(addCardView(views, {
          id: `v${Date.now().toString(36)}`,
          name: viewName,
          tray,
          query,
          agent: agentOn,
          tone: toneOn,
          desk: deskOn,
          stage: stageOn,
          hour: hourOn,
          weight: weightOn,
          window: windowOn,
        }));
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("ccrViews")}</span>
          <input className="c4-field" aria-label={v4("ccrViews")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ccrSaveView")}</button>
      </form>
      {!!views.length && (
        <ul className="c4-ccr-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => {
                setTray(view.tray);
                setQuery(view.query);
                setAgentFilter(view.agent);
                setToneFilter(view.tone);
                setDeskFilter(view.desk);
                setStageFilter(view.stage);
                setHourFilter(view.hour);
                setWeightFilter(view.weight);
                setWindowFilter(view.window);
              }}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropCardView(views, view.id))}>{v4("ccrDropView")}</button>
            </li>
          ))}
        </ul>
      )}
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((card) => card.id))}>{v4("ccrPickAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("ccrPickNone")}</button>
        <p className="c4-meta">{v4("ccrPicked")} · {picked.length}</p>
        <label className="c4-lab"><span>{v4("ccrBulkTone")}</span>
          <select className="c4-field" aria-label={v4("ccrBulkTone")} value={moveTone} disabled={viewer} onChange={(event) => setMoveTone(event.target.value)}>
            {TONES.map((item) => <option key={item} value={item}>{toneLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCardTone(cards, picked, moveTone))}>{v4("ccrBulkTone")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCardPin(cards, picked, true))}>{v4("ccrBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCardClose(cards, picked, true))}>{v4("ccrBulkClose")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length || !tag} onClick={() => store(bulkCardTag(cards, picked, tag))}>{v4("ccrBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("courtesy-cards.csv", cardsCsv(cards, deskHour))}>{v4("ccrCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetCards())}>{v4("ccrReset")}</button>
      </div>
      {board === "timeline" ? (
        <ol className="c4-ccr-timeline">
          {timeline.map((card) => (
            <li key={card.id}>
              <strong>{card.hour}</strong> {card.title}
              <span className="c4-meta"> {gapLabel(v4, card.hour, deskHour)}</span>
            </li>
          ))}
          {!timeline.length && <li className="c4-empty-gold">{v4("ccrEmpty")}</li>}
        </ol>
      ) : (
        <ul className="c4-ccr-cards">
          {shown.map((card, index) => {
            const openEdit = editing === card.id;
            const gap = gapLabel(v4, card.hour, deskHour);
            const late = lateCard(card, deskHour);
            const soon = soonCard(card);
            return (
              <li key={card.id} data-late={late ? "1" : "0"} data-soon={soon ? "1" : "0"} data-house={houseDesk(card.desk) ? "1" : "0"} data-tone={card.tone || "blank"} data-focus={index === focusAt ? "1" : "0"} tabIndex={index === focusAt ? 0 : -1}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                  {openEdit ? (
                    <span className="c4-stack">
                      <input className="c4-field" aria-label={v4("ccrLine")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("ccrNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                    </span>
                  ) : (
                    <span><strong>{card.title}</strong> <span className="c4-meta">{card.note}</span></span>
                  )}
                </label>
                <p className="c4-meta">{card.agent || v4("ccrBlankAgent")} · {card.hour ?? v4("ccrBlankHour")} · {toneLabel(v4, card.tone)} · {card.desk || v4("ccrBlankDesk")} · {stageLabel(v4, card.stage)} · {weightLabel(v4, card.weight)} · {windowLabel(v4, card.window)} · {card.tags.join(" ") || v4("ccrBlankTag")} · {gap} {auditLabel(v4, card.audit)}</p>
                <div className="c4-row">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("ccrUnpin") : v4("ccrPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardHold(cards, card.id, !card.held))}>{card.held ? v4("ccrLift") : v4("ccrHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardClose(cards, card.id, !card.closed))}>{card.closed ? v4("ccrReopen") : v4("ccrClose")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleStage(cards, card.id))}>{v4("ccrStageUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardSnooze(cards, card.id, card.snooze === 0 ? 10 : card.snooze === 10 ? 20 : 0))}>{card.snooze ? `${v4("ccrSnooze")} ${card.snooze}` : v4("ccrSnoozeOff")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || !tag} onClick={() => store(addCardTag(cards, card.id, tag))}>{v4("ccrTag")}</button>
                  {openEdit ? (
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                      store(editCardNote(editCard(cards, card.id, draft), card.id, noteDraft));
                      setEditing("");
                    }}>{v4("ccrEdit")}</button>
                  ) : (
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                      setEditing(card.id);
                      setDraft(card.title);
                      setNoteDraft(card.note);
                    }}>{v4("ccrEdit")}</button>
                  )}
                  <button type="button" className="c4-btn" onClick={() => {
                    void navigator.clipboard?.writeText(cardCopy(card, deskHour));
                    setCopied(card.id);
                  }}>{copied === card.id ? v4("ccrCopied") : v4("ccrCopy")}</button>
                </div>
              </li>
            );
          })}
          {!shown.length && <li className="c4-empty-gold">{v4("ccrEmpty")}</li>}
        </ul>
      )}
      <p className="c4-meta">{v4("ccrRules")}</p>
    </section>
  );
}

function cardAgentsSafe(cards: Courtesy[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.agent && !out.includes(card.agent)) out.push(card.agent);
  }
  return out;
}

export function CountrySeals({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<SealShape>("all");
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
    note: { country: user.country ?? null },
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
    const present = presentSeals(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenSeals(readJson(SEAL_KEY, []), present);
    const nextReviewed = readReviewedSeals(readJson(SEAL_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(SEAL_KEY, nextHidden);
    writeJson(SEAL_REVIEW_KEY, nextReviewed);
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
  const present = presentSeals(rows);
  const bands = visibleSealBands(present, hidden, showHidden);
  const bandOn = activeSealBand(band, present);
  const toneOn = activeSealTone(tone);
  const shown = visibleSealCustomers(rows, sealBandArg(bandOn), sealToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = sealState(row.note);
      const token = state === "set" ? sealBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingSeal(rows);
  const toneLead = leadingSealTone(rows);
  const shared = sharedSealCount(rows);
  const catalog = catalogSealCount(rows);
  const bars = sealBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(SEAL_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedSeals(next, ids);
    setReviewed(saved);
    writeJson(SEAL_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-nsl" aria-label={v4("nslTitle")} data-seals="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <header className="c4-nsl-mast">
        <div>
          <p className="c4-nsl-kicker">{v4("nslSub")}</p>
          <h2 className="c4-title">{v4("nslTitle")}</h2>
        </div>
        <p className="c4-nsl-plate" data-logo="mono">{v4("nslLogo")}</p>
      </header>
      <p className="c4-nsl-rules">{v4("nslHint")}</p>
      <p className="c4-meta">{v4("nslKept")} {v4("nslEscape")}</p>
      {viewer && <p className="c4-nsl-notice" data-viewer="1">{v4("nslViewer")}</p>}
      {data.error && <p className="c4-empty-gold" role="alert">{v4("nslFailed")}</p>}
      {data.loading && <p className="c4-meta">{v4("nslLoading")}</p>}
      {shared > 0 && <p className="c4-nsl-notice" role="status">{v4("nslNotice")} · {shared}</p>}
      <dl className="c4-nsl-kpi" aria-label={v4("nslKpi")}>
        <div><dt>{v4("nslSet")}</dt><dd>{rows.filter((row) => sealState(row.note) === "set").length}</dd></div>
        <div><dt>{v4("nslCatalog")}</dt><dd>{catalog}</dd></div>
        <div><dt>{v4("nslWide")}</dt><dd>{wideSealCount(rows)}</dd></div>
        <div><dt>{v4("nslSoftCount")}</dt><dd>{softSealCount(rows)}</dd></div>
        <div><dt>{v4("nslShare")}</dt><dd>{sealShare(catalog, rows.length)}%</dd></div>
        <div><dt>{v4("nslShared")}</dt><dd>{shared}</dd></div>
      </dl>
      <div className="c4-nsl-chart" aria-label={v4("nslBands")}>
        {bars.map((bar) => (
          <div key={bar.band} className="c4-nsl-col">
            <div className="c4-nsl-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandLabel(v4, bar.band)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("nslEmpty")}</p>}
      </div>
      <p className="c4-meta">{lead ? `${v4("nslLeading")} · ${bandLabel(v4, lead)}` : v4("nslLeadingNone")} · {toneLead ? `${v4("nslToneLead")} · ${sealToneLabel(v4, toneLead)}` : v4("nslToneNone")} · {shared ? `${v4("nslShared")} · ${shared}` : v4("nslSharedNone")}</p>
      <div className="c4-nsl-filters">
        <label className="c4-lab"><span>{v4("nslSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("nslSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab"><span>{v4("nslBands")}</span>
          <select className="c4-field" aria-label={v4("nslBands")} value={bandOn} onChange={(event) => setBand(event.target.value)}>
            <option value="all">{v4("nslAll")}</option>
            <option value="blank">{v4("nslClear")}</option>
            {BANDS.map((item) => <option key={item} value={item}>{bandLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("nslTone")}</span>
          <select className="c4-field" aria-label={v4("nslTone")} value={toneOn} onChange={(event) => setTone(event.target.value)}>
            <option value="all">{v4("nslAll")}</option>
            <option value="soft">{v4("nslSoft")}</option>
            <option value="hard">{v4("nslHard")}</option>
          </select>
        </label>
      </div>
      <div className="c4-row">
        {(["all", "catalog", "span", "soft"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} aria-pressed={shape === item} onClick={() => setShape(item)}>
            {item === "all" ? v4("nslAllShapes") : item === "catalog" ? v4("nslCatalog") : item === "span" ? v4("nslSpan") : v4("nslSoft")}
          </button>
        ))}
        {(["all", "reviewed", "open"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} aria-pressed={review === item} onClick={() => setReview(item)}>
            {item === "all" ? v4("nslAllReview") : item === "reviewed" ? v4("nslReviewed") : v4("nslOpenReview")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("nslShown") : v4("nslHidden")}</button>
      </div>
      <ul className="c4-nsl-bands" aria-label={v4("nslBands")}>
        {present.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleSeal(hidden, item, present))}>{bandLabel(v4, item)} · {hidden.includes(item) ? v4("nslShow") : v4("nslHide")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSealReview(reviewed, shown.map((row) => row.id), ids, true))}>{v4("nslBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSealReview(reviewed, shown.map((row) => row.id), ids, false))}>{v4("nslBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("country-seals.csv", sealsCsv(rows))}>{v4("nslCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("country-seal-rows.csv", sealRowsCsv(shown, reviewed))}>{v4("nslRowCsv")}</button>
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("nslCustomers")}</Link>
      </div>
      <ul className="c4-nsl-rows">
        {shown.map((row) => {
          const code = sealCopy(row.note);
          const marked = reviewed.includes(row.id);
          return (
            <li key={row.id} data-band={sealBand(row.note) || "blank"} data-tone={sealTone(row.note) || "blank"} data-catalog={catalogSeal(row.note) ? "1" : "0"} data-reviewed={marked ? "1" : "0"}>
              <strong>{row.label}</strong>
              <p className="c4-meta">{code || v4("nslClear")} · {bandLabel(v4, sealBand(row.note) || (sealState(row.note) === "clear" ? "blank" : ""))} · {sealToneLabel(v4, sealTone(row.note))} {catalogSeal(row.note) ? `· ${v4("nslCatalogMark")}` : ""}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSealReview(reviewed, row.id, ids))}>{marked ? v4("nslReviewed") : v4("nslReview")}</button>
                <button type="button" className="c4-btn" disabled={!code} onClick={() => {
                  if (!code) return;
                  void navigator.clipboard?.writeText(code);
                  setCopied(row.id);
                }}>{copied === row.id ? v4("nslCopied") : v4("nslCopy")}</button>
              </div>
            </li>
          );
        })}
        {!data.loading && !shown.length && <li className="c4-empty-gold">{v4("nslEmpty")}</li>}
      </ul>
      <p className="c4-meta">{v4("nslRules")}</p>
    </section>
  );
}
