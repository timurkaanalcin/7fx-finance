"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  RING_KEY,
  RING_REVIEW_KEY,
  WINDOW_KEY,
  WINDOW_VIEW_KEY,
  activeHour,
  activeInviteBand,
  activeInviteParity,
  activeOwner,
  activePace,
  activeRank,
  activeTag,
  activeTone,
  activeWait,
  addCallback,
  addCallbackView,
  bulkCallbackDone,
  bulkCallbackPin,
  bulkCallbackTone,
  bulkInviteReview,
  callbackCopy,
  callbackCounts,
  callbackOwners,
  callbackPaces,
  callbackShare,
  callbackTags,
  callbackTimeline,
  callbacksCsv,
  catalogInvite,
  catalogInviteCount,
  clashHourCount,
  cyclePace,
  dropCallbackView,
  editCallback,
  editCallbackNote,
  evenInvite,
  evenInviteCount,
  fairOwner,
  homeTag,
  hourArg,
  hourGap,
  inviteBand,
  inviteBandArg,
  inviteCopy,
  inviteParity,
  inviteParityArg,
  inviteRowsCsv,
  inviteShare,
  inviteState,
  invitesCsv,
  lateCallback,
  leadingInvite,
  leadingInviteParity,
  nextCallback,
  ownerArg,
  paceArg,
  presentInvites,
  rankArg,
  rankClashCount,
  readCallbackViews,
  readCallbacks,
  readHiddenInvites,
  readReviewedInvites,
  resetCallbacks,
  setCallbackDone,
  setCallbackHold,
  setCallbackPin,
  sharedInviteCount,
  soonCallback,
  suggestOwner,
  suggestTone,
  suggestWait,
  tagArg,
  toggleInvite,
  toggleInviteReview,
  toneArg,
  toneCounts,
  usedHours,
  visibleCallbacks,
  visibleInviteBands,
  visibleInviteCustomers,
  waitArg,
  wideInvite,
  wideInviteCount,
  type Callback,
  type CallbackView,
  type RingRow,
  type RingShape,
  type WindowPace,
  type WindowTone,
  type WindowTray,
} from "@/lib/crmv4/round190";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  referralCodeUsed?: string | null;
};

type GlanceRow = RingRow & { id: string };

const TONES = ["paper", "ink", "gold", "mist"] as const;
const BANDS = ["seed", "stem", "branch", "crown"] as const;

function toneName(v4: V4, tone: WindowTone | string): string {
  if (tone === "paper") return v4("cbkPaper");
  if (tone === "ink") return v4("cbkInk");
  if (tone === "gold") return v4("cbkGold");
  if (tone === "mist") return v4("cbkMist");
  return v4("cbkBlankTone");
}

function paceName(v4: V4, pace: WindowPace | string): string {
  if (pace === "slow") return v4("cbkPaceSlow");
  if (pace === "even") return v4("cbkPaceEven");
  if (pace === "brisk") return v4("cbkPaceBrisk");
  return v4("cbkBlankPace");
}

function hourName(v4: V4, name: string): string {
  if (name === "night") return v4("cbkNight");
  if (name === "day") return v4("cbkDay");
  if (name === "eve") return v4("cbkEve");
  if (name === "peak") return v4("cbkPeak");
  if (name === "quiet") return v4("cbkQuiet");
  if (/^(?:0|[1-9]|1[0-9]|2[0-3])$/.test(name)) return name;
  return v4("cbkBlankHour");
}

function rankName(v4: V4, rank: number | null): string {
  if (rank === 1) return v4("cbkRank1");
  if (rank === 2) return v4("cbkRank2");
  if (rank === 4) return v4("cbkRank4");
  return v4("cbkBlankRank");
}

function waitName(v4: V4, wait: number | null): string {
  if (wait === 1) return v4("cbkWait1");
  if (wait === 3) return v4("cbkWait3");
  if (wait === 7) return v4("cbkWait7");
  return v4("cbkBlankWait");
}

function bandName(v4: V4, name: string): string {
  if (name === "seed") return v4("irgSeed");
  if (name === "stem") return v4("irgStem");
  if (name === "branch") return v4("irgBranch");
  if (name === "crown") return v4("irgCrown");
  if (name === "blank") return v4("irgClear");
  return v4("irgUnmarked");
}

function parityName(v4: V4, name: string): string {
  if (name === "even") return v4("irgEven");
  if (name === "odd") return v4("irgOdd");
  return v4("irgUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "cbkAuditSave",
    edit: "cbkAuditEdit",
    pace: "cbkAuditPace",
    pin: "cbkAuditPin",
    unpin: "cbkAuditUnpin",
    hold: "cbkAuditHold",
    lift: "cbkAuditLift",
    done: "cbkAuditDone",
    reopen: "cbkAuditReopen",
    tone: "cbkAuditTone",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, hour: number | null, desk: string): string {
  const gap = hourGap(hour, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("cbkPast")} ${gap}`;
  if (gap < 0) return `${v4("cbkAhead")} ${Math.abs(gap)}`;
  return v4("cbkDue");
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

export function CallbackWindows({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Callback[]>([]);
  const [views, setViews] = useState<CallbackView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [owner, setOwner] = useState("");
  const [hour, setHour] = useState("");
  const [tone, setTone] = useState("");
  const [tag, setTag] = useState("");
  const [pace, setPace] = useState("");
  const [rank, setRank] = useState("");
  const [wait, setWait] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<WindowTray>("open");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [waitFilter, setWaitFilter] = useState("all");
  const [slowOnly, setSlowOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [homeOnly, setHomeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveTone, setMoveTone] = useState("gold");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readCallbacks(readJson(WINDOW_KEY, []));
    const saved = readCallbackViews(readJson(WINDOW_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(WINDOW_KEY, next);
    writeJson(WINDOW_VIEW_KEY, saved);
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
        titleRef.current?.focus();
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  function store(next: Callback[]) {
    const saved = readCallbacks(next);
    setCards(saved);
    writeJson(WINDOW_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  const owners = callbackOwners(cards);
  const tags = callbackTags(cards);
  const paces = callbackPaces(cards);
  const bars = toneCounts(cards);
  const ownerOn = activeOwner(ownerFilter, owners);
  const toneOn = activeTone(toneFilter, TONES);
  const tagOn = activeTag(tagFilter, tags);
  const paceOn = activePace(paceFilter, paces);
  const hourOn = activeHour(hourFilter);
  const rankOn = activeRank(rankFilter);
  const waitOn = activeWait(waitFilter);
  const pickedHour = hourArg(hourOn);
  const shown = visibleCallbacks(
    cards,
    tray,
    query,
    ownerArg(ownerOn),
    toneArg(toneOn),
    tagArg(tagOn),
    paceArg(paceOn),
    pickedHour.exact,
    pickedHour.pick,
    rankArg(rankOn),
    waitArg(waitOn),
    slowOnly,
    peakOnly,
    homeOnly,
    quietOnly,
  );
  const timeline = callbackTimeline(cards, query);
  const counts = callbackCounts(cards, desk);
  const clashes = clashHourCount(cards);
  const ranks = rankClashCount(cards);
  const nextId = nextCallback(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const suggestedTone = suggestTone(cards);
  const suggestedOwner = suggestOwner(cards);
  const suggestedWait = suggestWait(cards);
  const fair = fairOwner(cards, roster);
  const total = cards.length;
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  function clearDraft() {
    setTitle("");
    setNote("");
    setOwner("");
    setHour("");
    setTone("");
    setTag("");
    setPace("");
    setRank("");
    setWait("");
    setQuery("");
    setEditing("");
  }
  return (
    <section className="c4-cbw" aria-label={v4("cbkTitle")} data-windows="1" data-role={role}>
      <header className="c4-cbw-mast">
        <div>
          <p className="c4-cbw-kicker">{v4("cbkSub")}</p>
          <h2 className="c4-title">{v4("cbkTitle")}</h2>
        </div>
        <p className="c4-cbw-plate" data-logo="mono">{v4("cbkLogo")}</p>
      </header>
      <p className="c4-cbw-rules">{v4("cbkHint")}</p>
      <p className="c4-meta">{v4("cbkLocal")}</p>
      <p className="c4-meta">{v4("cbkNew")} {v4("cbkSlash")} {v4("cbkEscape")}</p>
      {viewer && <p className="c4-cbw-notice" data-viewer="1">{v4("cbkViewer")}</p>}
      {counts.peak > 0 && (
        <div className="c4-cbw-bells">
          <p className="c4-cbw-notice">{v4("cbkNotice")} · {counts.peak}</p>
          <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("cbkNoticeAll") : v4("cbkNoticePeak")}</button>
        </div>
      )}
      <dl className="c4-cbw-kpi" aria-label={v4("cbkKpi")}>
        <div><dt>{v4("cbkOpen")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("cbkHeld")}</dt><dd>{counts.held}</dd></div>
        <div><dt>{v4("cbkDone")}</dt><dd>{counts.done}</dd></div>
        <div><dt>{v4("cbkPinned")}</dt><dd>{counts.pinned}</dd></div>
        <div><dt>{v4("cbkPeak")}</dt><dd>{counts.peak}</dd></div>
        <div><dt>{v4("cbkLate")}</dt><dd>{counts.late}</dd></div>
        <div><dt>{v4("cbkSoon")}</dt><dd>{counts.soon}</dd></div>
        <div><dt>{v4("cbkHomeShare")}</dt><dd>{callbackShare(counts.home, total)}%</dd></div>
      </dl>
      <div className="c4-cbw-chart" aria-label={v4("cbkTones")}>
        {bars.map((bar) => (
          <div key={bar.tone} className="c4-cbw-col" data-on={toneOn === bar.tone ? "1" : "0"}>
            <span className="c4-cbw-swatch" data-tone={bar.tone} />
            <div className="c4-cbw-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setToneFilter(bar.tone)}>{toneName(v4, bar.tone)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("cbkEmpty")}</p>}
      </div>
      <div className="c4-cbw-suggest">
        <p>{v4("cbkSuggestTone")} · {toneName(v4, suggestedTone)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setTone(suggestedTone)}>{v4("cbkUseTone")}</button>
        <p>{v4("cbkSuggestOwner")} · {suggestedOwner || v4("cbkBlankOwner")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !suggestedOwner} onClick={() => setOwner(suggestedOwner)}>{v4("cbkUseOwner")}</button>
        <p>{v4("cbkSuggestWait")} · {waitName(v4, suggestedWait)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWait(String(suggestedWait))}>{v4("cbkUseWait")}</button>
        <p>{v4("cbkAssign")} · {fair || v4("cbkBlankOwner")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setOwner(fair)}>{v4("cbkAssign")}</button>
      </div>
      <p className="c4-meta">{v4("cbkHourUse")} · {usedHours(cards)} · {clashes ? `${v4("cbkClash")} · ${clashes}` : v4("cbkClashNone")} · {ranks ? `${v4("cbkRankClash")} · ${ranks}` : v4("cbkRankClashNone")}</p>
      <p className="c4-meta">{v4("cbkNext")} · {nextCard ? nextCard.title : v4("cbkNextNone")}</p>
      <form className="c4-cbw-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addCallback(cards, { id: `cbk-${Date.now()}`, title, note, owner, hour, tone, tag, pace, rank, wait });
        if (next.length === cards.length && title.trim()) return;
        store(next);
        setTitle("");
        setNote("");
      }}>
        <label className="c4-lab"><span>{v4("cbkLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("cbkLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("cbkNote")}</span>
          <input className="c4-field" aria-label={v4("cbkNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("cbkOwner")}</span>
          <input className="c4-field" aria-label={v4("cbkOwner")} value={owner} disabled={viewer} onChange={(event) => setOwner(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("cbkHour")}</span>
          <input className="c4-field" aria-label={v4("cbkHour")} inputMode="numeric" value={hour} disabled={viewer} onChange={(event) => setHour(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("cbkTone")}</span>
          <select className="c4-field" aria-label={v4("cbkTone")} value={tone} disabled={viewer} onChange={(event) => setTone(event.target.value)}>
            <option value="">{v4("cbkBlankTone")}</option>
            {TONES.map((item) => <option key={item} value={item}>{toneName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cbkTag")}</span>
          <input className="c4-field" aria-label={v4("cbkTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("cbkPace")}</span>
          <select className="c4-field" aria-label={v4("cbkPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("cbkBlankPace")}</option>
            <option value="slow">{v4("cbkPaceSlow")}</option>
            <option value="even">{v4("cbkPaceEven")}</option>
            <option value="brisk">{v4("cbkPaceBrisk")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cbkRank")}</span>
          <input className="c4-field" aria-label={v4("cbkRank")} inputMode="numeric" value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("cbkWait")}</span>
          <input className="c4-field" aria-label={v4("cbkWait")} inputMode="numeric" value={wait} disabled={viewer} onChange={(event) => setWait(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("cbkRoster")}</span>
          <input className="c4-field" aria-label={v4("cbkRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("cbkAdd")}</button>
      </form>
      <p className="c4-meta">{v4("cbkBlank")} {v4("cbkHourBlank")}</p>
      <div className="c4-cbw-filters">
        {(["open", "held", "done"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>
            {item === "open" ? v4("cbkOpen") : item === "held" ? v4("cbkHeld") : v4("cbkDone")}
          </button>
        ))}
        <label className="c4-lab"><span>{v4("cbkSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("cbkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("cbkDeskHour")}</span>
          <input className="c4-field" aria-label={v4("cbkDeskHour")} inputMode="numeric" value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("cbkOwners")}</span>
          <select className="c4-field" aria-label={v4("cbkAllOwners")} value={ownerOn} onChange={(event) => setOwnerFilter(event.target.value)}>
            <option value="all">{v4("cbkAllOwners")}</option>
            <option value="blank">{v4("cbkBlankOwner")}</option>
            {owners.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cbkTones")}</span>
          <select className="c4-field" aria-label={v4("cbkTones")} value={toneOn} onChange={(event) => setToneFilter(event.target.value)}>
            <option value="all">{v4("cbkTones")}</option>
            <option value="blank">{v4("cbkBlankTone")}</option>
            {TONES.map((item) => <option key={item} value={item}>{toneName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cbkTags")}</span>
          <select className="c4-field" aria-label={v4("cbkAllTags")} value={tagOn} onChange={(event) => setTagFilter(event.target.value)}>
            <option value="all">{v4("cbkAllTags")}</option>
            <option value="blank">{v4("cbkBlankTag")}</option>
            {tags.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cbkPaces")}</span>
          <select className="c4-field" aria-label={v4("cbkAllPaces")} value={paceOn} onChange={(event) => setPaceFilter(event.target.value)}>
            <option value="all">{v4("cbkAllPaces")}</option>
            <option value="blank">{v4("cbkBlankPace")}</option>
            {paces.map((item) => <option key={item} value={item}>{paceName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cbkHours")}</span>
          <select className="c4-field" aria-label={v4("cbkAllHours")} value={hourOn} onChange={(event) => setHourFilter(event.target.value)}>
            <option value="all">{v4("cbkAllHours")}</option>
            {["blank", "night", "day", "eve", "peak", "quiet", "0", "9", "15", "23"].map((item) => <option key={item} value={item}>{hourName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cbkRanks")}</span>
          <select className="c4-field" aria-label={v4("cbkAllRanks")} value={rankOn} onChange={(event) => setRankFilter(event.target.value)}>
            <option value="all">{v4("cbkAllRanks")}</option>
            <option value="blank">{v4("cbkBlankRank")}</option>
            <option value="1">{v4("cbkRank1")}</option>
            <option value="2">{v4("cbkRank2")}</option>
            <option value="4">{v4("cbkRank4")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cbkWaits")}</span>
          <select className="c4-field" aria-label={v4("cbkAllWaits")} value={waitOn} onChange={(event) => setWaitFilter(event.target.value)}>
            <option value="all">{v4("cbkAllWaits")}</option>
            <option value="blank">{v4("cbkBlankWait")}</option>
            <option value="1">{v4("cbkWait1")}</option>
            <option value="3">{v4("cbkWait3")}</option>
            <option value="7">{v4("cbkWait7")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={slowOnly ? "1" : "0"} onClick={() => setSlowOnly((on) => !on)}>{v4("cbkSlowOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("cbkQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={homeOnly ? "1" : "0"} onClick={() => setHomeOnly((on) => !on)}>{homeOnly ? v4("cbkHomeOnly") : v4("cbkHomeAll")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard((item) => item === "cards" ? "timeline" : "cards")}>{board === "cards" ? v4("cbkTimeline") : v4("cbkCards")}</button>
      </div>
      <form className="c4-cbw-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addCallbackView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          owner: ownerOn,
          tone: toneOn,
          tag: tagOn,
          pace: paceOn,
          hour: hourOn,
          rank: rankOn,
          wait: waitOn,
        });
        setViews(next);
        writeJson(WINDOW_VIEW_KEY, next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("cbkViewName")}</span>
          <input className="c4-field" aria-label={v4("cbkViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("cbkSaveView")}</button>
        <ul aria-label={v4("cbkViews")}>
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => {
                setTray(view.tray);
                setQuery(view.query);
                setOwnerFilter(view.owner);
                setToneFilter(view.tone);
                setTagFilter(view.tag);
                setPaceFilter(view.pace);
                setHourFilter(view.hour);
                setRankFilter(view.rank);
                setWaitFilter(view.wait);
              }}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                const next = dropCallbackView(views, view.id);
                setViews(next);
                writeJson(WINDOW_VIEW_KEY, next);
              }}>{v4("cbkDropView")}</button>
            </li>
          ))}
        </ul>
      </form>
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((card) => card.id))}>{v4("cbkPickAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("cbkPickNone")}</button>
        <span className="c4-meta">{v4("cbkPicked")} · {picked.length}</span>
        <select className="c4-field" aria-label={v4("cbkBulkTone")} value={moveTone} disabled={viewer} onChange={(event) => setMoveTone(event.target.value)}>
          {TONES.map((item) => <option key={item} value={item}>{toneName(v4, item)}</option>)}
        </select>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCallbackTone(cards, picked, moveTone))}>{v4("cbkBulkTone")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCallbackPin(cards, picked, true))}>{v4("cbkBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCallbackDone(cards, picked, true))}>{v4("cbkBulkDone")}</button>
        <button type="button" className="c4-btn" onClick={() => download("callback-windows.csv", callbacksCsv(cards, desk))}>{v4("cbkCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetCallbacks())}>{v4("cbkReset")}</button>
      </div>
      {board === "timeline" ? (
        <ol className="c4-cbw-timeline" aria-label={v4("cbkTimeline")}>
          {timeline.map((card) => <li key={card.id} data-hour={card.hour}>{card.hour} · {card.title}</li>)}
          {!timeline.length && <li className="c4-empty-gold">{v4("cbkEmpty")}</li>}
        </ol>
      ) : (
        <ul className="c4-cbw-cards">
          {shown.map((card) => {
            const openEdit = editing === card.id;
            return (
              <li key={card.id} data-tone={card.tone || "blank"} data-pace={card.pace || "blank"} data-pinned={card.pinned ? "1" : "0"} data-late={lateCallback(card, desk) ? "1" : "0"} data-soon={soonCallback(card) ? "1" : "0"} data-home={homeTag(card.tag) ? "1" : "0"}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, card.id] : ids.filter((id) => id !== card.id))} />
                  {openEdit ? (
                    <input className="c4-field" aria-label={v4("cbkEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                  ) : <strong>{card.title}</strong>}
                </label>
                <p className="c4-meta">{card.owner || v4("cbkBlankOwner")} · {card.hour ?? v4("cbkBlankHour")} · {toneName(v4, card.tone)} · {card.tag || v4("cbkBlankTag")} · {paceName(v4, card.pace)} · {rankName(v4, card.rank)} · {waitName(v4, card.wait)}</p>
                {openEdit ? (
                  <input className="c4-field" aria-label={v4("cbkNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                ) : card.note && <p>{card.note}</p>}
                <p className="c4-meta">{gapLabel(v4, card.hour, desk)} {auditName(v4, card.audit)}</p>
                <div className="c4-row">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCallbackPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("cbkUnpin") : v4("cbkPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCallbackHold(cards, card.id, !card.held))}>{card.held ? v4("cbkLift") : v4("cbkHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCallbackDone(cards, card.id, !card.done))}>{card.done ? v4("cbkReopen") : v4("cbkFile")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(cards, card.id))}>{v4("cbkPaceUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                    if (openEdit) {
                      store(editCallbackNote(editCallback(cards, card.id, draft), card.id, noteDraft));
                      setEditing("");
                      return;
                    }
                    setEditing(card.id);
                    setDraft(card.title);
                    setNoteDraft(card.note);
                  }}>{openEdit ? v4("cbkAdd") : v4("cbkEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => {
                    void navigator.clipboard?.writeText(callbackCopy(card));
                    setCopied(card.id);
                  }}>{copied === card.id ? v4("cbkCopied") : v4("cbkCopy")}</button>
                </div>
              </li>
            );
          })}
          {!shown.length && <li className="c4-empty-gold">{v4("cbkEmpty")}</li>}
        </ul>
      )}
      <p className="c4-meta">{v4("cbkRules")}</p>
    </section>
  );
}

export function InviteRings({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [band, setBand] = useState("all");
  const [parity, setParity] = useState("all");
  const [shape, setShape] = useState<RingShape>("all");
  const [review, setReview] = useState<"all" | "reviewed" | "open">("all");
  const [query, setQuery] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GlanceRow[]>(() => (data.data?.users || []).map((user) => ({
    id: user.id,
    label: user.name || user.id,
    note: { referralCodeUsed: user.referralCodeUsed ?? null },
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
    const present = presentInvites(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenInvites(readJson(RING_KEY, []), present);
    const nextReviewed = readReviewedInvites(readJson(RING_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(RING_KEY, nextHidden);
    writeJson(RING_REVIEW_KEY, nextReviewed);
  }, [rows]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const present = presentInvites(rows);
  const bandOn = activeInviteBand(band, present);
  const parityOn = activeInviteParity(parity);
  const bands = visibleInviteBands(present, hidden, showHidden);
  const shown = visibleInviteCustomers(rows, inviteBandArg(bandOn), inviteParityArg(parityOn), query, review, reviewed, shape).filter((row) => {
    const state = inviteState(row.note);
    if (state === "") return bandOn === "all" && !showHidden;
    const token = state === "set" ? inviteBand(row.note) : "blank";
    return bands.includes(token);
  });
  const lead = leadingInvite(rows);
  const leadParity = leadingInviteParity(rows);
  const shared = sharedInviteCount(rows);
  const setCount = rows.filter((row) => inviteState(row.note) === "set").length;
  return (
    <section className="c4-irg" aria-label={v4("irgTitle")} data-rings="1" data-role={role}>
      <header className="c4-irg-mast">
        <div>
          <p className="c4-irg-kicker">{v4("irgSub")}</p>
          <h2 className="c4-title">{v4("irgTitle")}</h2>
        </div>
        <p className="c4-irg-plate" data-logo="mono">{v4("irgLogo")}</p>
      </header>
      <p className="c4-irg-rules">{v4("irgHint")}</p>
      <p className="c4-meta">{v4("irgKept")} {v4("irgEscape")}</p>
      {viewer && <p className="c4-irg-notice">{v4("irgViewer")}</p>}
      {data.error && <p className="c4-empty-gold">{v4("irgFailed")}</p>}
      {data.loading && <p className="c4-meta">{v4("irgLoading")}</p>}
      {!data.loading && !rows.length && <p className="c4-empty-gold">{v4("irgNone")}</p>}
      <dl className="c4-cbw-kpi" aria-label={v4("irgSetNotice")}>
        <div><dt>{v4("irgCustomers")}</dt><dd>{rows.length}</dd></div>
        <div><dt>{v4("irgSetNotice")}</dt><dd>{setCount}</dd></div>
        <div><dt>{v4("irgShare")}</dt><dd>{inviteShare(setCount, rows.length)}%</dd></div>
        <div><dt>{v4("irgShared")}</dt><dd>{shared}</dd></div>
        <div><dt>{v4("irgLeadBand")}</dt><dd>{lead ? bandName(v4, lead) : v4("irgUnmarked")}</dd></div>
        <div><dt>{v4("irgLeadParity")}</dt><dd>{leadParity ? parityName(v4, leadParity) : v4("irgUnmarked")}</dd></div>
        <div><dt>{v4("irgCatalog")}</dt><dd>{catalogInviteCount(rows)}</dd></div>
        <div><dt>{v4("irgWide")}</dt><dd>{wideInviteCount(rows)}</dd></div>
        <div><dt>{v4("irgEvenMark")}</dt><dd>{evenInviteCount(rows)}</dd></div>
      </dl>
      <div className="c4-cbw-chart" aria-label={v4("irgShapes")}>
        {BANDS.map((item) => {
          const count = rows.filter((row) => inviteBand(row.note) === item).length;
          return (
            <div key={item} className="c4-cbw-col" data-on={bandOn === item ? "1" : "0"}>
              <div className="c4-cbw-track"><i style={{ height: `${inviteShare(count, rows.length) || (count ? 8 : 0)}%` }} /></div>
              <button type="button" className="c4-btn" onClick={() => setBand(item)}>{bandName(v4, item)} · {count}</button>
            </div>
          );
        })}
      </div>
      <div className="c4-row">
        <label className="c4-lab"><span>{v4("irgSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("irgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab"><span>{v4("irgAllBands")}</span>
          <select className="c4-field" aria-label={v4("irgAllBands")} value={bandOn} onChange={(event) => setBand(event.target.value)}>
            <option value="all">{v4("irgAllBands")}</option>
            <option value="blank">{v4("irgClear")}</option>
            {present.filter((item) => item !== "blank").map((item) => <option key={item} value={item}>{bandName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("irgAllParities")}</span>
          <select className="c4-field" aria-label={v4("irgAllParities")} value={parityOn} onChange={(event) => setParity(event.target.value)}>
            <option value="all">{v4("irgAllParities")}</option>
            {["even", "odd"].map((item) => <option key={item} value={item}>{parityName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("irgAllShapes")}</span>
          <select className="c4-field" aria-label={v4("irgAllShapes")} value={shape} onChange={(event) => setShape(event.target.value as RingShape)}>
            <option value="all">{v4("irgAllShapes")}</option>
            <option value="catalog">{v4("irgCatalogOnly")}</option>
            <option value="wide">{v4("irgWideOnly")}</option>
            <option value="even">{v4("irgEvenOnly")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview((item) => item === "open" ? "all" : "open")}>{v4("irgOpenMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview((item) => item === "reviewed" ? "all" : "reviewed")}>{v4("irgReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("irgHidden") : v4("irgShow")}</button>
      </div>
      <ul className="c4-irg-bands" aria-label={v4("irgHide")}>
        {present.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" data-on={hidden.includes(item) ? "1" : "0"} disabled={viewer} onClick={() => {
              const next = toggleInvite(hidden, item, present);
              setHidden(next);
              writeJson(RING_KEY, next);
            }}>{hidden.includes(item) ? v4("irgShow") : v4("irgHide")} · {bandName(v4, item)}</button>
          </li>
        ))}
      </ul>
      <div className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
          const next = bulkInviteReview(reviewed, shown.map((row) => row.id), rows.map((row) => row.id), true);
          setReviewed(next);
          writeJson(RING_REVIEW_KEY, next);
        }}>{v4("irgBulkReview")}</button>
        <button type="button" className="c4-btn" onClick={() => download("invite-rings.csv", invitesCsv(rows))}>{v4("irgCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("invite-ring-rows.csv", inviteRowsCsv(shown, reviewed))}>{v4("irgRowCsv")}</button>
        <span className="c4-meta">{v4("irgShown")} · {shown.length}</span>
      </div>
      <ul className="c4-irg-rows" aria-label={v4("irgBoard")}>
        {shown.map((row) => {
          const code = inviteCopy(row.note);
          const seen = reviewed.includes(row.id);
          const catalog = catalogInvite(row.note);
          const wide = wideInvite(row.note);
          const even = evenInvite(row.note);
          return (
            <li key={row.id} data-band={inviteBand(row.note) || "blank"} data-reviewed={seen ? "1" : "0"} data-catalog={catalog ? "1" : "0"} data-wide={wide ? "1" : "0"} data-even={even ? "1" : "0"}>
              <Link href={crmv4Href(base, `customers/${row.id}`)}>{row.label}</Link>
              <p className="c4-meta">{code || (inviteState(row.note) === "clear" ? v4("irgClear") : v4("irgUnmarked"))} · {bandName(v4, inviteBand(row.note) || (inviteState(row.note) === "clear" ? "blank" : ""))} · {parityName(v4, inviteParity(row.note))}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                  const next = toggleInviteReview(reviewed, row.id, rows.map((item) => item.id));
                  setReviewed(next);
                  writeJson(RING_REVIEW_KEY, next);
                }}>{seen ? v4("irgReviewed") : v4("irgReview")}</button>
                <button type="button" className="c4-btn" disabled={!code} onClick={() => {
                  void navigator.clipboard?.writeText(code);
                  setCopied(row.id);
                }}>{copied === row.id ? v4("irgCopied") : v4("irgCopy")}</button>
              </div>
            </li>
          );
        })}
        {!shown.length && <li className="c4-empty-gold">{v4("irgEmpty")}</li>}
      </ul>
      <p className="c4-meta">{v4("irgUnreviewed")} · {rows.filter((row) => !reviewed.includes(row.id)).length} · {v4("irgRules")}</p>
    </section>
  );
}
