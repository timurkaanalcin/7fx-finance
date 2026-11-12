"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CSH_DENSITY_KEY,
  CSH_KEY,
  CSH_VIEW_KEY,
  PPL_KEY,
  PPL_REVIEW_KEY,
  activeAgent,
  activeBay,
  activeMinute,
  activePace,
  activePlateLane,
  activePlateTone,
  activeRank,
  activeTone,
  addCall,
  addCallView,
  agentArg,
  bayArg,
  bayBand,
  bayGap,
  bindPlateCount,
  bulkCallArchive,
  bulkCallPace,
  bulkCallPin,
  bulkCallTag,
  bulkCallTone,
  bulkPlateReview,
  busiestAgent,
  callAgents,
  callCopy,
  callCounts,
  callDensity,
  callShare,
  callSort,
  callTimeline,
  callTones,
  callsCsv,
  clashBayCount,
  coolingCall,
  coolingCalls,
  cyclePace,
  dropCallView,
  editCall,
  editCallNote,
  fairAgent,
  folioPlateCount,
  freshPlateCount,
  giltPlateCount,
  gonePlateCount,
  holdFocusedCall,
  houseTone,
  joinedPlate,
  joinedPlateCount,
  keptPlateCount,
  lateCall,
  lateCallShare,
  leadingPlate,
  leadingPlateTone,
  matchedCalls,
  minuteArg,
  moveCallFocus,
  neighborCallCount,
  nextCall,
  notchPlate,
  paceArg,
  paceFocusedCall,
  pairAgentCount,
  peakBay,
  pinFocusedCall,
  plainPlateCount,
  plateCopy,
  plateLane,
  plateLaneArg,
  plateLanes,
  plateMark,
  plateRowsCsv,
  plateShare,
  plateState,
  plateStep,
  plateTone,
  plateToneArg,
  platesCsv,
  presentPlateLanes,
  quietBay,
  rankArg,
  rankFocusedCall,
  rankLoad,
  readCallViews,
  readCalls,
  readHiddenPlates,
  readReviewedPlates,
  reminderCalls,
  sealFocusedCall,
  setCallArchive,
  setCallHold,
  setCallPin,
  setCallRank,
  setCallSeal,
  sharedPlateCount,
  snoozeCall,
  snoozeFocusedCall,
  sortCalls,
  spanClashCount,
  stillPlateCount,
  suggestAgent,
  suggestMinutes,
  suggestTone,
  tagFocusedCall,
  togglePlate,
  togglePlateReview,
  toneArg,
  visibleCalls,
  visiblePlateLanes,
  visiblePlates,
  widePlate,
  windowCalls,
  type CallDensity,
  type CallSheet,
  type CallSort,
  type CallTray,
  type CallView,
  type PlateReview,
  type PlateRow,
  type PlateShape,
  type PlateValue,
} from "@/lib/crmv4/round241";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const TONES = ["linen", "gilt", "soot"] as const;
const PACES = ["hush", "even", "keen"] as const;
const SPANS = ["5", "10", "20"] as const;
const RANKS = ["1", "4", "7"] as const;
const BAYS = ["1", "2", "3", "4", "5", "6"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "cshAuditSave",
  edit: "cshAuditEdit",
  note: "cshAuditNote",
  pace: "cshAuditPace",
  pin: "cshAuditPin",
  unpin: "cshAuditUnpin",
  hold: "cshAuditHold",
  resume: "cshAuditResume",
  archive: "cshAuditArchive",
  open: "cshAuditOpen",
  tone: "cshAuditTone",
  tag: "cshAuditTag",
  rank: "cshAuditRank",
  span: "cshAuditSpan",
  seal: "cshAuditSeal",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  retentionStatus?: string | null;
  desk?: string | null;
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
  const node = event.target as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
}

function textField(raw: string | null | undefined): string {
  return typeof raw === "string" ? raw : "";
}

function toneLabel(v4: V4, tone: string): string {
  if (tone === "LINEN" || tone === "linen") return v4("cshLinen");
  if (tone === "GILT" || tone === "gilt") return v4("cshGilt");
  if (tone === "SOOT" || tone === "soot") return v4("cshSoot");
  return v4("cshBlankTone");
}

function paceLabel(v4: V4, pace: string): string {
  if (pace === "hush") return v4("cshHush");
  if (pace === "even") return v4("cshEven");
  if (pace === "keen") return v4("cshKeen");
  return v4("cshBlankPace");
}

function laneLabel(v4: V4, lane: string): string {
  if (lane === "folio") return v4("pplFolio");
  if (lane === "fresh") return v4("pplFresh");
  if (lane === "kept") return v4("pplKept");
  if (lane === "still") return v4("pplStill");
  if (lane === "gone") return v4("pplGone");
  if (lane === "plain") return v4("pplPlain");
  if (lane === "bind") return v4("pplBind");
  return v4("pplUnmarked");
}

function plateToneLabel(v4: V4, tone: string): string {
  if (tone === "gilt") return v4("pplGilt");
  if (tone === "linen") return v4("pplLinen");
  if (tone === "sand") return v4("pplSand");
  if (tone === "clay") return v4("pplClay");
  if (tone === "mist") return v4("pplMist");
  if (tone === "ivory") return v4("pplIvory");
  return v4("pplUnmarked");
}

function bandLabel(v4: V4, band: string): string {
  if (band === "early") return v4("cshEarly");
  if (band === "mid") return v4("cshMid");
  if (band === "late") return v4("cshLate");
  return v4("cshBlank");
}

export function CallSheets({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<CallSheet[]>([]);
  const [views, setViews] = useState<CallView[]>([]);
  const [density, setDensity] = useState<CallDensity>("airy");
  const [sort, setSort] = useState<CallSort>("bay");
  const [tray, setTray] = useState<CallTray>("open");
  const [query, setQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [restingOnly, setRestingOnly] = useState(false);
  const [keenOnly, setKeenOnly] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [agent, setAgent] = useState("");
  const [bay, setBay] = useState("");
  const [tone, setTone] = useState("");
  const [pace, setPace] = useState("");
  const [spanValue, setSpanValue] = useState("");
  const [rank, setRank] = useState("1");
  const [tag, setTag] = useState("");
  const [viewName, setViewName] = useState("");
  const [roster, setRoster] = useState("Ada, Bea, Cam");
  const [desk, setDesk] = useState("3");
  const [board, setBoard] = useState<"hall" | "index">("hall");
  const [focus, setFocus] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const spanRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const paceRef = useRef<() => void>(() => {});
  const sealRef = useRef<() => void>(() => {});
  const rankRef = useRef<() => void>(() => {});
  const tagRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const agents = callAgents(cards);
  const agentOn = activeAgent(agentFilter, agents);
  const toneOn = activeTone(toneFilter);
  const paceOn = activePace(paceFilter, ["all", "blank", ...PACES]);
  const bayOn = activeBay(bayFilter);
  const spanOn = activeMinute(spanFilter);
  const rankOn = activeRank(rankFilter);
  const shown = useMemo(() => sortCalls(visibleCalls(
    cards,
    tray,
    query,
    agentArg(agentOn),
    toneArg(toneOn),
    paceArg(paceOn),
    bayArg(bayOn),
    minuteArg(spanOn),
    rankArg(rankOn),
    houseOnly,
    peakOnly,
    quietOnly,
    restingOnly,
    keenOnly,
  ), sort), [cards, tray, query, agentOn, toneOn, paceOn, bayOn, spanOn, rankOn, houseOnly, peakOnly, quietOnly, restingOnly, keenOnly, sort]);
  const counts = callCounts(cards, desk);
  const reminders = reminderCalls(cards, desk);
  const cooling = coolingCalls(cards);
  const timeline = callTimeline(cards);
  const suggestedTone = suggestTone(cards);
  const suggestedSpan = suggestMinutes(cards, desk);
  const suggestedAgent = suggestAgent(cards, roster);
  const busyAgent = busiestAgent(cards);
  const focusAt = shown.length ? focus % shown.length : 0;

  function store(next: CallSheet[]) {
    const saved = readCalls(next);
    setCards(saved);
    writeJson(CSH_KEY, saved);
  }
  function storeViews(next: CallView[]) {
    const saved = readCallViews(next);
    setViews(saved);
    writeJson(CSH_VIEW_KEY, saved);
  }
  function storeDensity(next: CallDensity) {
    setDensity(next);
    writeJson(CSH_DENSITY_KEY, next);
  }

  useEffect(() => {
    setCards(readCalls(readJson(CSH_KEY, [])));
    setViews(readCallViews(readJson(CSH_VIEW_KEY, [])));
    setDensity(callDensity(readJson(CSH_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  useEffect(() => {
    pinRef.current = () => {
      if (viewer) return;
      store(pinFocusedCall(cards, shown.map((card) => card.id), focusAt));
    };
    spanRef.current = () => {
      if (viewer) return;
      store(snoozeFocusedCall(cards, shown.map((card) => card.id), focusAt));
    };
    holdRef.current = () => {
      if (viewer) return;
      store(holdFocusedCall(cards, shown.map((card) => card.id), focusAt));
    };
    paceRef.current = () => {
      if (viewer) return;
      store(paceFocusedCall(cards, shown.map((card) => card.id), focusAt));
    };
    sealRef.current = () => {
      if (viewer) return;
      store(sealFocusedCall(cards, shown.map((card) => card.id), focusAt));
    };
    rankRef.current = () => {
      if (viewer) return;
      store(rankFocusedCall(cards, shown.map((card) => card.id), focusAt));
    };
    tagRef.current = () => {
      if (viewer) return;
      store(tagFocusedCall(cards, shown.map((card) => card.id), focusAt));
    };
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event) && event.key !== "Escape") return;
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setTag("");
        return;
      }
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveCallFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveCallFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        pinRef.current();
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        spanRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        paceRef.current();
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        sealRef.current();
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        rankRef.current();
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        tagRef.current();
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        setBoard((value) => (value === "hall" ? "index" : "hall"));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);

  function saveCall() {
    if (viewer) return;
    store(addCall(cards, { id: `csh-${Date.now()}`, title, note, agent, bay, tone, pace, span: spanValue, rank, tags: tag }));
    setTitle("");
    setNote("");
    setTag("");
  }
  function applyView(view: CallView) {
    setTray(view.tray);
    setQuery(view.query);
    setAgentFilter(view.agent || "all");
    setToneFilter(view.tone || "all");
    setPaceFilter(view.pace || "all");
    setBayFilter(view.bay || "all");
    setSpanFilter(view.span || "all");
    setRankFilter(view.rank || "all");
  }
  function togglePick(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }
  async function copyCard(card: CallSheet) {
    const body = callCopy(card);
    try { await navigator.clipboard.writeText(body); } catch { /* the desk still shows copied */ }
    setCopied(card.id);
  }
  const focused = shown[focusAt];
  const tones = callTones(cards);
  const maxTone = Math.max(1, ...TONES.map((item) => cards.filter((card) => card.tone === item.toUpperCase()).length));

  return (
    <section className="c4-csh" aria-label={v4("cshTitle")} data-sheets="1" data-desk="salon" data-role={role} data-board={board} data-density={density}>
      <header className="c4-csh-mast">
        <p className="c4-csh-seal" data-logo="mono">{v4("cshLogo")}</p>
        <div>
          <p className="c4-csh-kicker">{v4("cshSub")}</p>
          <h2 className="c4-title">{v4("cshTitle")}</h2>
        </div>
        <ol className="c4-csh-index" aria-label={v4("cshTones")}>
          <li data-tone="ivory">{v4("cshLinen")}</li>
          <li data-tone="gold">{v4("cshGilt")}</li>
          <li data-tone="ink">{v4("cshSoot")}</li>
        </ol>
      </header>
      <p className="c4-csh-links">
        <Link href={crmv4Href(base, "ppl")}>{v4("pplTitle")}</Link>
        <Link href={crmv4Href(base, "blotter")}>{v4("cshSub")}</Link>
      </p>
      {viewer && <p className="c4-csh-note">{v4("cshViewer")}</p>}
      <p className="c4-csh-rule">{v4("cshHint")}</p>
      <ul className="c4-csh-kpis" aria-label={v4("cshKpi")}>
        <li><span>{v4("cshOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("cshHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("cshArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("cshPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("cshPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("cshLate")}</span><strong>{counts.late}</strong></li>
        <li><span>{v4("cshSame")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("cshLoad")}</span><strong>{rankLoad(cards)}</strong></li>
        <li><span>{v4("cshHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("cshWindow")}</span><strong>{windowCalls(cards, desk).length}</strong></li>
        <li><span>{v4("cshMatched")}</span><strong>{matchedCalls(cards, desk)}</strong></li>
        <li><span>{v4("cshSeal")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("cshCooling")}</span><strong>{counts.cooling}</strong></li>
        <li><span>{v4("cshLateShare")}</span><strong>{lateCallShare(cards, desk)}%</strong></li>
        <li><span>{v4("cshShared")}</span><strong>{pairAgentCount(cards)}</strong></li>
      </ul>
      <div className="c4-csh-bars" aria-label={v4("cshTones")}>
        {TONES.map((item) => {
          const count = cards.filter((card) => card.tone === item.toUpperCase()).length;
          return (
            <div key={item} className="c4-csh-bar" data-tone={item}>
              <span>{toneLabel(v4, item)}</span>
              <i style={{ width: `${Math.round((count / maxTone) * 100)}%` }} />
              <strong>{count}</strong>
            </div>
          );
        })}
      </div>
      <p className="c4-csh-meta">
        {v4("cshSuggestTone")} {toneLabel(v4, suggestedTone)} · {v4("cshSuggestSpan")} {suggestedSpan} · {v4("cshSuggestAgent")} {suggestedAgent || v4("cshBlankAgent")} · {busyAgent ? `${v4("cshBusiest")} ${busyAgent}` : v4("cshBusiestNone")} · {v4("cshNeighbors")} {neighborCallCount(cards) || v4("cshNeighborsNone")} · {clashBayCount(cards) ? `${v4("cshClash")} ${clashBayCount(cards)}` : v4("cshClashNone")} · {v4("cshSpanClash")} {spanClashCount(cards)} · {v4("cshBays")} {timeline.length} · {tones.length ? v4("cshTones") : v4("cshBlankTone")}
      </p>
      <div className="c4-csh-tools">
        <label className="c4-lab"><span>{v4("cshSearch")}</span><input ref={searchRef} className="c4-field c4-csh-search" aria-label={v4("cshSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("cshDesk")}</span>
          <select className="c4-select" aria-label={v4("cshDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {BAYS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cshRoster")}</span><input className="c4-field" aria-label={v4("cshRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("cshDensityTight") : v4("cshDensityAiry")}</button>
        <button type="button" className="c4-btn" onClick={() => setSort(callSort(sort === "bay" ? "agent" : "bay"))}>{sort === "bay" ? v4("cshSortAgent") : v4("cshSortBay")}</button>
        <button type="button" className="c4-btn" onClick={() => download("call-sheets.csv", callsCsv(cards, desk))}>{v4("cshCsv")}</button>
      </div>
      <div className="c4-csh-tools" role="group" aria-label={v4("cshAll")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} aria-pressed={tray === item} onClick={() => setTray(item)}>{item === "open" ? v4("cshOpen") : item === "held" ? v4("cshHeld") : v4("cshArchived")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} aria-pressed={houseOnly} onClick={() => setHouseOnly((value) => !value)}>{v4("cshHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} aria-pressed={peakOnly} onClick={() => setPeakOnly((value) => !value)}>{v4("cshPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} aria-pressed={quietOnly} onClick={() => setQuietOnly((value) => !value)}>{v4("cshQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} aria-pressed={restingOnly} onClick={() => setRestingOnly((value) => !value)}>{v4("cshRestingOnly")}</button>
        <button type="button" className="c4-chip" data-on={keenOnly ? "1" : "0"} aria-pressed={keenOnly} onClick={() => setKeenOnly((value) => !value)}>{v4("cshKeenOnly")}</button>
      </div>
      <div className="c4-csh-tools">
        <label className="c4-lab"><span>{v4("cshAgent")}</span>
          <select className="c4-select" aria-label={v4("cshAgent")} value={agentOn} onChange={(event) => setAgentFilter(event.target.value)}>
            <option value="all">{v4("cshAll")}</option>
            <option value="blank">{v4("cshBlankAgent")}</option>
            {agents.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cshTones")}</span>
          <select className="c4-select" aria-label={v4("cshTones")} value={toneOn} onChange={(event) => setToneFilter(event.target.value)}>
            <option value="all">{v4("cshAll")}</option>
            <option value="blank">{v4("cshBlankTone")}</option>
            {TONES.map((item) => <option key={item} value={item}>{toneLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cshPace")}</span>
          <select className="c4-select" aria-label={v4("cshPace")} value={paceOn} onChange={(event) => setPaceFilter(event.target.value)}>
            <option value="all">{v4("cshAll")}</option>
            <option value="blank">{v4("cshBlankPace")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cshDesk")}</span>
          <select className="c4-select" aria-label={v4("cshBayWidth")} value={bayOn} onChange={(event) => setBayFilter(event.target.value)}>
            <option value="all">{v4("cshAll")}</option>
            <option value="blank">{v4("cshBlank")}</option>
            <option value="early">{v4("cshEarly")}</option>
            <option value="mid">{v4("cshMid")}</option>
            <option value="late">{v4("cshLate")}</option>
            <option value="peak">{v4("cshPeak")}</option>
            <option value="quiet">{v4("cshQuiet")}</option>
            {BAYS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cshSpan")}</span>
          <select className="c4-select" aria-label={v4("cshSpan")} value={spanOn} onChange={(event) => setSpanFilter(event.target.value)}>
            <option value="all">{v4("cshAll")}</option>
            <option value="blank">{v4("cshBlankSpan")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cshRank")}</span>
          <select className="c4-select" aria-label={v4("cshRank")} value={rankOn} onChange={(event) => setRankFilter(event.target.value)}>
            <option value="all">{v4("cshAll")}</option>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <form className="c4-csh-form" onSubmit={(event) => { event.preventDefault(); saveCall(); }}>
        <label className="c4-lab"><span>{v4("cshTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("cshTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("cshNote")}</span><input className="c4-field" aria-label={v4("cshNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("cshAgent")}</span><input className="c4-field" aria-label={v4("cshSuggestAgent")} value={agent} onChange={(event) => setAgent(event.target.value)} placeholder={suggestedAgent} /></label>
        <label className="c4-lab"><span>{v4("cshDesk")}</span>
          <select className="c4-select" aria-label={v4("cshDue")} value={bay} onChange={(event) => setBay(event.target.value)}>
            <option value="">{v4("cshBlank")}</option>
            {BAYS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cshTones")}</span>
          <select className="c4-select" aria-label={v4("cshSuggestTone")} value={tone} onChange={(event) => setTone(event.target.value)}>
            <option value="">{v4("cshBlankTone")}</option>
            {TONES.map((item) => <option key={item} value={item}>{toneLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cshPace")}</span>
          <select className="c4-select" aria-label={v4("cshPace")} value={pace} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("cshBlankPace")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cshSpan")}</span>
          <select className="c4-select" aria-label={v4("cshSuggestSpan")} value={spanValue} onChange={(event) => setSpanValue(event.target.value)}>
            <option value="">{v4("cshBlankSpan")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cshRank")}</span>
          <select className="c4-select" aria-label={v4("cshRank")} value={rank} onChange={(event) => setRank(event.target.value)}>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cshTag")}</span><input className="c4-field" aria-label={v4("cshTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
        <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("cshAdd")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setAgent(fairAgent(cards, roster))}>{v4("cshAssign")}</button>
      </form>
      <p className="c4-csh-meta">{v4("cshKeys")} {v4("cshHoldKey")} {v4("cshSpanKey")} {v4("cshBoardKey")} {v4("cshEscape")}</p>
      <div className="c4-csh-tools">
        <label className="c4-lab"><span>{v4("cshView")}</span><input className="c4-field" aria-label={v4("cshView")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="button" className="c4-btn" disabled={viewer || !viewName.trim()} onClick={() => { storeViews(addCallView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, agent: agentOn, tone: toneOn, pace: paceOn, bay: bayOn, span: spanOn, rank: rankOn })); setViewName(""); }}>{v4("cshSaveView")}</button>
        <span className="c4-csh-meta">{v4("cshSelected")} {picked.length}</span>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCallArchive(cards, picked, true))}>{v4("cshBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCallPace(cards, picked, "keen"))}>{v4("cshBulkPace")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCallPin(cards, picked, true))}>{v4("cshBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCallTag(cards, picked, "a"))}>{v4("cshBulkTag")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCallTone(cards, picked, "gilt"))}>{v4("cshBulkTone")}</button>
      </div>
      <ul className="c4-csh-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-chip" onClick={() => applyView(view)}>{v4("cshApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropCallView(views, view.id))}>{v4("cshDropView")}</button>
          </li>
        ))}
      </ul>
      {board === "hall" ? (
        <ol className="c4-csh-board">
          {!shown.length && <li className="c4-csh-empty">{v4("cshEmpty")}</li>}
          {shown.map((card, index) => {
            const gap = bayGap(card.bay, desk);
            return (
              <li key={card.id} className="c4-csh-card" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-seal={card.seal ? "1" : "0"} data-tone={card.tone || "blank"} data-late={lateCall(card, desk) ? "1" : "0"}>
                <label className="c4-lab"><span>{v4("cshSelect")}</span><input type="checkbox" aria-label={v4("cshSelect")} checked={picked.includes(card.id)} onChange={() => togglePick(card.id)} /></label>
                <input className="c4-field" aria-label={v4("cshEdit")} value={card.title} disabled={viewer} onChange={(event) => { if (!viewer) store(editCall(cards, card.id, event.target.value)); }} />
                <input className="c4-field" aria-label={v4("cshEditNote")} value={card.note} disabled={viewer} onChange={(event) => { if (!viewer) store(editCallNote(cards, card.id, event.target.value)); }} />
                <p className="c4-csh-meta">{card.agent || v4("cshBlankAgent")} · {card.bay ?? v4("cshBlank")} · {toneLabel(v4, card.tone)} · {paceLabel(v4, card.pace)} · {card.span ?? v4("cshBlankSpan")} · {v4("cshRank")} {card.rank} · {card.tags.join(" ") || v4("cshBlank")} · {bandLabel(v4, bayBand(card.bay))}{peakBay(card.bay) ? ` · ${v4("cshPeak")}` : ""}{quietBay(card.bay) ? ` · ${v4("cshQuiet")}` : ""}{houseTone(card.tone) ? ` · ${v4("cshHouse")}` : ""}{coolingCall(card) ? ` · ${v4("cshCooling")}` : ""}</p>
                <p className="c4-csh-meta">{gap === null ? v4("cshBlank") : gap > 0 ? `${v4("cshPast")} ${gap}` : gap < 0 ? `${v4("cshAhead")} ${Math.abs(gap)}` : v4("cshDue")} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("cshBlank")} · {nextCall(cards, card.id) ? `${v4("cshNext")} ${nextCall(cards, card.id)?.title}` : v4("cshNextNone")}</p>
                <div className="c4-csh-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(cards, card.id))}>{v4("cshPace")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCallPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("cshUnpin") : v4("cshPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.archived} onClick={() => store(setCallHold(cards, card.id, !card.held))}>{card.held ? v4("cshResume") : v4("cshHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCallArchive(cards, card.id, !card.archived))}>{card.archived ? v4("cshReopen") : v4("cshArchive")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCallSeal(cards, card.id, !card.seal))}>{card.seal ? v4("cshUnseal") : v4("cshSeal")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeCall(cards, card.id))}>{v4("cshSnooze")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCallRank(cards, card.id, card.rank === 7 ? "1" : card.rank === 4 ? "7" : "4"))}>{v4("cshRaised")}</button>
                  <button type="button" className="c4-btn" onClick={() => void copyCard(card)}>{copied === card.id ? v4("cshCopied") : v4("cshCopy")}</button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className="c4-csh-timeline">
          {!timeline.length && <li className="c4-csh-empty">{v4("cshEmpty")}</li>}
          {timeline.map((lane) => <li key={lane.bay}><span>{lane.bay}</span><strong>{lane.titles.join(" · ")}</strong></li>)}
        </ol>
      )}
      <aside className="c4-csh-side" aria-label={v4("cshReminders")}>
        <h3 className="c4-title">{v4("cshReminders")}</h3>
        {!reminders.length && <p>{v4("cshEmpty")}</p>}
        <ul>{reminders.map((card) => <li key={card.id}>{card.title} · {lateCall(card, desk) ? v4("cshLate") : v4("cshSame")}</li>)}</ul>
        <h3 className="c4-title">{v4("cshCooling")}</h3>
        {!cooling.length && <p>{v4("cshCoolingEmpty")}</p>}
        <ul>{cooling.map((card) => <li key={card.id}>{card.title}</li>)}</ul>
        {focused && <p>{v4("cshFocus")} {focused.title} · {callShare(counts.house, Math.max(1, counts.open))}%</p>}
      </aside>
    </section>
  );
}

function plateNote(row: TraderRow): PlateValue {
  return { name: textField(row.name), ink: textField(row.retentionStatus), press: textField(row.desk) };
}

export function PressPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<PlateReview>("all");
  const [shape, setShape] = useState<PlateShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const rows = useMemo<PlateRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `trader-${row.id}` : `trader-${index}`,
    label: textField(row.name),
    note: plateNote(row),
  })), [queue.data?.users]);
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
    const present = presentPlateLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenPlates(readJson(PPL_KEY, []), present);
    const nextReviewed = readReviewedPlates(readJson(PPL_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(PPL_KEY, nextHidden);
    writeJson(PPL_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentPlateLanes(rows);
  const lanes = visiblePlateLanes(present, hidden, showHidden);
  const laneOn = activePlateLane(lane, present);
  const toneOn = activePlateTone(tone);
  const shown = visiblePlates(rows, plateLaneArg(laneOn), plateToneArg(toneOn), query, review, reviewed, shape).filter((row) => {
    const token = plateLane(row.note) || (plateState(row.note) === "clear" ? "blank" : "");
    if (!token || token === "blank") return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  useEffect(() => {
    reviewRef.current = () => {
      if (viewer) return;
      const row = shown[focusAt];
      if (!row) return;
      const next = togglePlateReview(reviewed, row.id);
      setReviewed(next);
      writeJson(PPL_REVIEW_KEY, next);
    };
  });
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveCallFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveCallFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        reviewRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        const order: PlateShape[] = ["all", "join", "wide", "folio", "bind", "notch"];
        setShape((value) => order[(order.indexOf(value) + 1) % order.length]);
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);
  const lead = leadingPlate(rows);
  const toneLead = leadingPlateTone(rows);
  const shared = sharedPlateCount(rows);
  const joined = joinedPlateCount(rows);
  const bars = plateLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((row) => row.id);
  const known = rows.filter((row) => plateState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(PPL_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedPlates(next, rows.map((row) => row.id));
    setReviewed(saved);
    writeJson(PPL_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-ppl" aria-label={v4("pplTitle")} data-plates="1" data-desk="salon" data-traders={queue.data?.users?.length ? "1" : "0"} data-role={role} data-keyed={joined ? "1" : "0"}>
      <header className="c4-ppl-mast">
        <p className="c4-ppl-seal" data-logo="mono">{v4("pplLogo")}</p>
        <div>
          <p className="c4-ppl-kicker">{v4("pplSub")}</p>
          <h2 className="c4-title">{v4("pplTitle")}</h2>
        </div>
        <ol className="c4-ppl-index" aria-label={v4("pplTitle")}>
          <li data-tone="gold">{v4("pplChampagne")}</li>
          <li data-tone="ink">{v4("pplGraphite")}</li>
          <li data-tone="ivory">{v4("pplIvory")}</li>
        </ol>
      </header>
      <p className="c4-ppl-links">
        <Link href={crmv4Href(base, "csh")}>{v4("cshTitle")}</Link>
        <Link href={crmv4Href(base, "blotter")}>{v4("pplGallery")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("pplSub")}</Link>
      </p>
      {viewer && <p className="c4-ppl-note">{v4("pplViewer")}</p>}
      <p className="c4-ppl-rule">{v4("pplHint")}</p>
      <ul className="c4-ppl-kpis" aria-label={v4("pplRules")}>
        <li><span>{v4("pplSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("pplClear")}</span><strong>{rows.filter((row) => plateState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("pplFolio")}</span><strong>{folioPlateCount(rows)}</strong></li>
        <li><span>{v4("pplFresh")}</span><strong>{freshPlateCount(rows)}</strong></li>
        <li><span>{v4("pplKept")}</span><strong>{keptPlateCount(rows)}</strong></li>
        <li><span>{v4("pplStill")}</span><strong>{stillPlateCount(rows)}</strong></li>
        <li><span>{v4("pplGone")}</span><strong>{gonePlateCount(rows)}</strong></li>
        <li><span>{v4("pplPlain")}</span><strong>{plainPlateCount(rows)}</strong></li>
        <li><span>{v4("pplBind")}</span><strong>{bindPlateCount(rows)}</strong></li>
        <li><span>{v4("pplGilt")}</span><strong>{giltPlateCount(rows)}</strong></li>
        <li><span>{v4("pplNotch")}</span><strong>{rows.filter((row) => notchPlate(row.note)).length}</strong></li>
        <li><span>{v4("pplShare")}</span><strong>{plateShare(joined, Math.max(1, known))}%</strong></li>
        <li><span>{v4("pplShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-ppl-bars" aria-label={v4("pplLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-ppl-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-ppl-meta">{lead ? `${v4("pplLead")} ${laneLabel(v4, lead)}` : v4("pplEmpty")} · {toneLead ? `${v4("pplToneLead")} ${plateToneLabel(v4, toneLead)}` : v4("pplUnmarked")} · {v4("pplWide")} {rows.filter((row) => widePlate(row.note)).length}</p>
      <div className="c4-ppl-tools">
        <label className="c4-lab"><span>{v4("pplSearch")}</span><input ref={searchRef} className="c4-field c4-ppl-search" aria-label={v4("pplSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => download("press-lanes.csv", platesCsv(rows))}>{v4("pplCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("press-rows.csv", plateRowsCsv(rows, reviewed))}>{v4("pplRowCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={showHidden} onClick={() => setShowHidden((value) => !value)}>{v4("pplShow")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPlateReview(reviewed, ids, true))}>{v4("pplBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPlateReview(reviewed, ids, false))}>{v4("pplBulkClear")}</button>
      </div>
      <div className="c4-ppl-tools" role="group" aria-label={v4("pplAll")}>
        <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("pplAll")}</button>
        {lanes.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
        {(["gilt", "linen", "sand", "clay", "mist", "ivory"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toneOn === item ? "1" : "0"} onClick={() => setTone(toneOn === item ? "all" : item)}>{plateToneLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("pplAll") : item === "reviewed" ? v4("pplReviewed") : v4("pplUnreviewed")}</button>
        ))}
        {(["all", "join", "wide", "folio", "bind", "notch"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("pplShapeAll") : item === "join" ? v4("pplShapeJoin") : item === "wide" ? v4("pplShapeWide") : item === "folio" ? v4("pplShapeFolio") : item === "bind" ? v4("pplShapeBind") : v4("pplShapeNotch")}</button>
        ))}
      </div>
      {!shown.length && <p className="c4-ppl-empty">{v4("pplEmpty")}</p>}
      <ol className="c4-ppl-board">
        {shown.map((row, index) => {
          const current = plateLane(row.note);
          const toneName = plateTone(row.note);
          return (
            <li key={row.id} className="c4-ppl-card" data-on={index === focusAt ? "1" : "0"} data-lane={current || "blank"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-wide={widePlate(row.note) ? "1" : "0"} data-join={joinedPlate(row.note) ? "1" : "0"} data-notch={notchPlate(row.note) ? "1" : "0"}>
              <strong>{row.label || v4("pplClear")}</strong>
              <p className="c4-ppl-meta">{v4("pplMark")} {plateMark(row.note) || v4("pplUnmarked")} · {laneLabel(v4, current)} · {plateToneLabel(v4, toneName)} · {v4("pplStep")} {plateStep(row.note)} · {v4("pplStatus")} · {v4("pplDesk")}</p>
              <div className="c4-ppl-tools">
                <button type="button" className="c4-btn" disabled={viewer || !current} onClick={() => storeHidden(togglePlate(hidden, current))}>{hidden.includes(current) ? v4("pplShow") : v4("pplHide")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(togglePlateReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("pplReviewed") : v4("pplReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = plateCopy(row.note); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(row.id); }}>{copied === row.id ? v4("pplCopied") : v4("pplCopy")}</button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
