"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CALLING_KEY,
  PROMISE_KEY,
  PROMISE_VIEW_KEY,
  activeAllowance,
  activeChannel,
  activeCode,
  activeDigit,
  activeOwner,
  activePace,
  activeRegion,
  activeTag,
  addPromise,
  addPromiseView,
  allowanceArg,
  allowanceBand,
  allowanceCounts,
  allowanceGap,
  allowanceHalf,
  bulkPromiseClosed,
  bulkPromiseStarred,
  callingCsv,
  callingShare,
  channelArg,
  codeArg,
  codeLines,
  dialCode,
  dialRegion,
  digitArg,
  digitLines,
  dropPromiseView,
  editPromise,
  leadingCode,
  leadingRegion,
  namedCodes,
  namedDigits,
  namedRegions,
  nextPromise,
  ownerArg,
  paceArg,
  promiseChannels,
  promiseClashIds,
  promiseCopy,
  promiseCounts,
  promiseOwners,
  promisePaces,
  promiseShare,
  promiseTags,
  promiseTimeline,
  promisesCsv,
  readHiddenCodes,
  readPromiseViews,
  readPromises,
  regionArg,
  regionLines,
  resetPromises,
  setPromiseClosed,
  setPromiseStarred,
  setPromiseWaiting,
  stepPromisePace,
  tagArg,
  toggleCode,
  visibleCallingCustomers,
  visibleCodes,
  visiblePromises,
  type CallingRow,
  type PromiseCard,
  type PromiseChannel,
  type PromisePace,
  type PromiseTray,
  type PromiseView,
} from "@/lib/crmv4/round149";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  phone?: string | null;
};

type GlanceRow = CallingRow & { id: string };

const ALLOWANCES = ["15", "30", "45", "60", "90", "120"] as const;

function channelName(v4: V4, channel: PromiseChannel): string {
  if (channel === "phone") return v4("slaChannelPhone");
  if (channel === "mail") return v4("slaChannelMail");
  if (channel === "chat") return v4("slaChannelChat");
  if (channel === "visit") return v4("slaChannelVisit");
  return v4("slaBlankChannel");
}

function paceName(v4: V4, pace: PromisePace): string {
  if (pace === "calm") return v4("slaPaceCalm");
  if (pace === "due") return v4("slaPaceDue");
  if (pace === "hot") return v4("slaPaceHot");
  return v4("slaBlankPace");
}

function allowanceName(v4: V4, name: string): string {
  if (name === "15") return v4("sla15");
  if (name === "30") return v4("sla30");
  if (name === "45") return v4("sla45");
  if (name === "60") return v4("sla60");
  if (name === "90") return v4("sla90");
  if (name === "120") return v4("sla120");
  if (name === "short") return v4("slaShort");
  if (name === "mid") return v4("slaMid");
  if (name === "long") return v4("slaLong");
  if (name === "first") return v4("slaFirst");
  if (name === "second") return v4("slaSecond");
  return v4("slaBlankAllowance");
}

function regionName(v4: V4, name: string): string {
  if (name === "tr") return v4("clgTr");
  if (name === "us") return v4("clgUs");
  if (name === "uk") return v4("clgUk");
  if (name === "de") return v4("clgDe");
  if (name === "ru") return v4("clgRu");
  if (name === "ae") return v4("clgAe");
  if (name === "other") return v4("clgOther");
  if (name === "local") return v4("clgLocalPhone");
  return v4("clgUnmarked");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("slaAuditSave");
  if (audit === "edit") return v4("slaAuditEdit");
  if (audit === "raise") return v4("slaAuditRaise");
  if (audit === "lower") return v4("slaAuditLower");
  if (audit === "star") return v4("slaAuditStar");
  if (audit === "unstar") return v4("slaAuditUnstar");
  if (audit === "wait") return v4("slaAuditWait");
  if (audit === "release") return v4("slaAuditRelease");
  if (audit === "close") return v4("slaAuditClose");
  if (audit === "reopen") return v4("slaAuditReopen");
  return "";
}

function minuteLabel(minutes: number | null): string {
  return minutes === null ? "—" : String(minutes);
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

export function SlaPromises({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<PromiseCard[]>([]);
  const [views, setViews] = useState<PromiseView[]>([]);
  const [text, setText] = useState("");
  const [owner, setOwner] = useState("");
  const [minutes, setMinutes] = useState("");
  const [channel, setChannel] = useState("");
  const [tag, setTag] = useState("");
  const [pace, setPace] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<PromiseTray>("open");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [allowanceFilter, setAllowanceFilter] = useState("all");
  const [hotOnly, setHotOnly] = useState(false);
  const [lateOnly, setLateOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [elapsed, setElapsed] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readPromises(readJson(PROMISE_KEY, []));
    const saved = readPromiseViews(readJson(PROMISE_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(PROMISE_KEY, next);
    writeJson(PROMISE_VIEW_KEY, saved);
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
      if (event.key === "p" || event.key === "P") {
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
  const owners = promiseOwners(cards);
  const channels = promiseChannels(cards);
  const tags = promiseTags(cards);
  const paces = promisePaces(cards);
  const bars = allowanceCounts(cards);
  const ownerOn = activeOwner(ownerFilter, owners);
  const channelOn = activeChannel(channelFilter, channels);
  const tagOn = activeTag(tagFilter, tags);
  const paceOn = activePace(paceFilter, paces);
  const allowanceOn = activeAllowance(allowanceFilter);
  const picked = allowanceArg(allowanceOn);
  const shown = visiblePromises(
    cards,
    tray,
    query,
    ownerArg(ownerOn),
    channelArg(channelOn),
    tagArg(tagOn),
    paceArg(paceOn),
    picked.exact,
    picked.band,
    hotOnly,
    lateOnly,
    elapsed,
  );
  const timeline = promiseTimeline(cards, query);
  const counts = promiseCounts(cards, elapsed);
  const total = cards.length;
  const nextId = nextPromise(cards, elapsed);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);

  function store(next: PromiseCard[]) {
    setCards(next);
    writeJson(PROMISE_KEY, next);
  }

  function storeViews(next: PromiseView[]) {
    setViews(next);
    writeJson(PROMISE_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setOwner("");
    setMinutes("");
    setChannel("");
    setTag("");
    setPace("");
  }

  function copyCard(card: PromiseCard) {
    const body = promiseCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: PromiseView) {
    setTray(view.tray);
    setQuery(view.query);
    setOwnerFilter(activeOwner(view.owner, promiseOwners(cards)));
    setChannelFilter(activeChannel(view.channel, promiseChannels(cards)));
    setTagFilter(activeTag(view.tag, promiseTags(cards)));
    setPaceFilter(activePace(view.pace, promisePaces(cards)));
    setAllowanceFilter(activeAllowance(view.minutes));
    setBoard("cards");
    setHotOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-prm" aria-label={v4("slaTitle")} data-promise="1" data-role={role}>
      <header className="c4-prm-head">
        <p className="c4-prm-plate" data-logo="mono">{v4("slaLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("slaSub")}</p>
          <h2 className="c4-title">{v4("slaTitle")}</h2>
        </div>
        <p className="c4-prm-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("slaHint")}</p>
      <p className="c4-meta">{v4("slaLocal")}</p>
      <p className="c4-meta">{v4("slaBlank")}</p>
      <p className="c4-meta">{v4("slaOwnerBlank")}</p>
      <p className="c4-meta">{v4("slaMinutesBlank")}</p>
      <p className="c4-meta">{v4("slaChannelBlank")}</p>
      <p className="c4-meta">{v4("slaTagBlank")}</p>
      <p className="c4-meta">{v4("slaPaceBlank")}</p>
      <p className="c4-meta">{v4("slaEscape")}</p>
      <p className="c4-meta">{v4("slaSlash")}</p>
      <p className="c4-meta">{v4("slaNew")}</p>
      {viewer ? <p className="c4-prm-notice" role="status">{v4("slaViewer")}</p> : null}
      <p className="c4-prm-notice" role="status">
        <span>{v4("slaNotice")}</span>
        <span className="c4-prm-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("slaNoticeAll") : v4("slaNoticeOpen")}
        </button>
      </p>
      <section className="c4-prm-kpi" aria-label={v4("slaKpi")}>
        <p className="c4-pay-kicker">{v4("slaKpi")}</p>
        {(["open", "waiting", "closed", "starred"] as const).map((key) => {
          const count = counts[key];
          const share = promiseShare(count, total);
          const label = key === "open" ? v4("slaOpen") : key === "waiting" ? v4("slaWaiting") : key === "closed" ? v4("slaClosed") : v4("slaStarred");
          return (
            <p key={key} className="c4-prm-meter" data-tray={key}>
              <span>{label}</span>
              <span>{count}</span>
              <span>{v4("slaShare")} {share}%</span>
              <span className="c4-prm-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-prm-chart" aria-label={v4("slaChart")}>
        <p className="c4-pay-kicker">{v4("slaChart")}</p>
        {ALLOWANCES.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(count ? 8 : 0, Math.round((count / widest) * 100));
          return (
            <button
              key={name}
              type="button"
              className="c4-prm-band"
              data-minutes={name}
              aria-pressed={allowanceOn === name}
              onClick={() => { setAllowanceFilter(allowanceOn === name ? "all" : name); setBoard("cards"); }}
            >
              <span>{allowanceName(v4, name)}</span>
              <span className="c4-prm-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-prm-next" onSubmit={(event) => event.preventDefault()}>
        <label className="c4-lab">
          <span>{v4("slaDeskElapsed")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("slaDeskElapsed")} value={elapsed} onChange={(event) => setElapsed(event.target.value)} />
        </label>
        <p className="c4-prm-next-card">
          <span>{v4("slaNext")}</span>
          {nextCard ? <strong>{nextCard.text}</strong> : <span>{v4("slaNextEmpty")}</span>}
        </p>
      </form>
      <form
        className="c4-prm-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addPromise(cards, { id: `sla-${Date.now()}`, text, owner, minutes, channel, tag, pace });
          if (next.length === cards.length) return;
          store(next);
          clearDraft();
        }}
      >
        <label className="c4-lab">
          <span>{v4("slaText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("slaText")} value={text} disabled={viewer} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("slaOwner")}</span>
          <input className="c4-field" aria-label={v4("slaOwner")} value={owner} disabled={viewer} onChange={(event) => setOwner(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("slaMinutes")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("slaMinutes")} value={minutes} disabled={viewer} onChange={(event) => setMinutes(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("slaChannel")}</span>
          <select className="c4-select" aria-label={v4("slaChannel")} value={channel} disabled={viewer} onChange={(event) => setChannel(event.target.value)}>
            <option value="">{v4("slaBlankChannel")}</option>
            <option value="phone">{v4("slaChannelPhone")}</option>
            <option value="mail">{v4("slaChannelMail")}</option>
            <option value="chat">{v4("slaChannelChat")}</option>
            <option value="visit">{v4("slaChannelVisit")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("slaTag")}</span>
          <input className="c4-field" aria-label={v4("slaTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("slaPace")}</span>
          <select className="c4-select" aria-label={v4("slaPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("slaBlankPace")}</option>
            <option value="calm">{v4("slaPaceCalm")}</option>
            <option value="due">{v4("slaPaceDue")}</option>
            <option value="hot">{v4("slaPaceHot")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("slaAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("slaTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => { setTray("open"); setBoard("cards"); }}>{v4("slaOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "waiting" ? "1" : "0"} aria-pressed={tray === "waiting"} onClick={() => { setTray("waiting"); setBoard("cards"); }}>{v4("slaWaiting")}</button>
        <button type="button" className="c4-chip" data-on={tray === "closed" ? "1" : "0"} aria-pressed={tray === "closed"} onClick={() => { setTray("closed"); setBoard("cards"); }}>{v4("slaClosed")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard("timeline")}>{v4("slaTimeline")}</button>
        <button type="button" className="c4-btn" aria-pressed={hotOnly} onClick={() => setHotOnly((value) => !value)}>{v4("slaHot")}</button>
        <button type="button" className="c4-btn" onClick={() => download("sla-promises.csv", promisesCsv(cards, elapsed))}>{v4("slaCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkPromiseStarred(cards, shown.map((card) => card.id), true))}>{v4("slaBulkStar")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkPromiseClosed(cards, shown.map((card) => card.id), true))}>{v4("slaBulkClose")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetPromises()); setEditing(""); }}>{v4("slaReset")}</button>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("slaSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("slaSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("slaOwners")}</span>
          <select className="c4-select" aria-label={v4("slaOwners")} value={ownerOn} onChange={(event) => setOwnerFilter(event.target.value)}>
            <option value="all">{v4("slaAllOwners")}</option>
            <option value="blank">{v4("slaBlankOwner")}</option>
            {owners.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("slaChannels")}</span>
          <select className="c4-select" aria-label={v4("slaChannels")} value={channelOn} onChange={(event) => setChannelFilter(event.target.value)}>
            <option value="all">{v4("slaAllChannels")}</option>
            <option value="blank">{v4("slaBlankChannel")}</option>
            {channels.map((item) => <option key={item} value={item}>{channelName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("slaTags")}</span>
          <select className="c4-select" aria-label={v4("slaTags")} value={tagOn} onChange={(event) => setTagFilter(event.target.value)}>
            <option value="all">{v4("slaAllTags")}</option>
            <option value="blank">{v4("slaBlankTag")}</option>
            {tags.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("slaPaces")}</span>
          <select className="c4-select" aria-label={v4("slaPaces")} value={paceOn} onChange={(event) => setPaceFilter(event.target.value)}>
            <option value="all">{v4("slaAllPaces")}</option>
            <option value="blank">{v4("slaBlankPace")}</option>
            {paces.map((item) => <option key={item} value={item}>{paceName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("slaAllowances")}</span>
          <select className="c4-select" aria-label={v4("slaAllowances")} value={allowanceOn} onChange={(event) => setAllowanceFilter(event.target.value)}>
            <option value="all">{v4("slaAllAllowances")}</option>
            <option value="blank">{v4("slaBlankAllowance")}</option>
            <option value="short">{v4("slaShort")}</option>
            <option value="mid">{v4("slaMid")}</option>
            <option value="long">{v4("slaLong")}</option>
            <option value="first">{v4("slaFirst")}</option>
            <option value="second">{v4("slaSecond")}</option>
            {ALLOWANCES.map((item) => <option key={item} value={item}>{allowanceName(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <form
        className="c4-prm-view"
        onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addPromiseView(views, {
            id: `view-${Date.now()}`,
            name: viewName,
            tray,
            query,
            owner: ownerOn,
            channel: channelOn,
            tag: tagOn,
            pace: paceOn,
            minutes: allowanceOn,
          });
          if (next.length === views.length) return;
          storeViews(next);
          setViewName("");
        }}
      >
        <label className="c4-lab">
          <span>{v4("slaViewName")}</span>
          <input className="c4-field" aria-label={v4("slaViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("slaSaveView")}</button>
      </form>
      <section aria-label={v4("slaViews")}>
        <p className="c4-pay-kicker">{v4("slaViews")}</p>
        {!views.length && <p className="c4-prm-empty">{v4("slaViewEmpty")}</p>}
        <ul className="c4-prm-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropPromiseView(views, view.id))}>{v4("slaDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-prm-empty">{v4("slaEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-prm-rows">
          {shown.map((card) => {
            const gap = allowanceGap(card.minutes, elapsed);
            const clashes = promiseClashIds(cards, card.id);
            const band = allowanceBand(card.minutes);
            const half = allowanceHalf(card.minutes);
            return (
              <li key={card.id} data-pace={card.pace || "blank"} data-minutes={band} data-starred={card.starred ? "1" : "0"}>
                <span className="c4-prm-clock">{minuteLabel(card.minutes)}</span>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); store(editPromise(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("slaEdit")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("slaSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-meta">
                    {card.owner || v4("slaBlankOwner")}
                    {" · "}
                    {channelName(v4, (card.channel || "blank") as PromiseChannel)}
                    {" · "}
                    {card.tag || v4("slaBlankTag")}
                    {" · "}
                    {paceName(v4, (card.pace || "blank") as PromisePace)}
                    {" · "}
                    {allowanceName(v4, half === "blank" ? "blank" : half)}
                    {gap === null ? "" : ` · ${gap > 0 ? v4("slaLateWord") : gap < 0 ? v4("slaLeft") : v4("slaNow")} ${gap}`}
                    {card.audit ? ` · ${v4("slaAudit")} ${auditName(v4, card.audit)}` : ""}
                    {clashes.length ? ` · ${v4("slaClash")} ${clashes.length}` : ` · ${v4("slaClashNone")}`}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("slaCopied") : v4("slaCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("slaEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepPromisePace(cards, card.id, 1))}>{v4("slaRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepPromisePace(cards, card.id, -1))}>{v4("slaLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.starred} onClick={() => store(setPromiseStarred(cards, card.id, !card.starred))}>{card.starred ? v4("slaUnstar") : v4("slaStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.waiting} onClick={() => store(setPromiseWaiting(cards, card.id, !card.waiting))}>{card.waiting ? v4("slaRelease") : v4("slaWait")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.closed} onClick={() => store(setPromiseClosed(cards, card.id, !card.closed))}>{card.closed ? v4("slaReopen") : v4("slaClose")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-prm-time">
          {timeline.map((card) => (
            <li key={card.id} data-minutes={allowanceBand(card.minutes)}>
              <span className="c4-prm-clock">{minuteLabel(card.minutes)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function CallingCodes({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenCodes, setHiddenCodes] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [region, setRegion] = useState("all");
  const [digit, setDigit] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      phone: row.phone,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const regions = regionLines(rows);
  const codes = codeLines(rows);
  const digits = digitLines(rows);
  const present = namedCodes(rows);
  const presentKey = present.join("\n");
  const regionNames = namedRegions(rows);
  const digitNames = namedDigits(rows);
  const blankRegion = regions.find((line) => !line.region)?.count || 0;
  const leadRegion = leadingRegion(rows);
  const leadCode = leadingCode(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenCodes(readJson(CALLING_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenCodes(next);
    writeJson(CALLING_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleCodes(present, hiddenCodes, showHidden);
  const codeOn = activeCode(selected, chips);
  const regionOn = activeRegion(region, regionNames);
  const digitOn = activeDigit(digit, digitNames);
  const shown = visibleCallingCustomers(rows, regionArg(regionOn), codeArg(codeOn), digitArg(digitOn), query);
  const widest = Math.max(1, ...regions.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenCodes(next);
    writeJson(CALLING_KEY, next);
    if (clear && activeCode(selected, [clear]) === clear) setSelected("");
  }

  return (
    <section className="c4-clg" aria-label={v4("clgTitle")} data-calling="1">
      <header className="c4-clg-head">
        <div>
          <p className="c4-pay-kicker">{v4("clgSub")}</p>
          <h2 className="c4-title">{v4("clgTitle")}</h2>
        </div>
        <p className="c4-prm-count">{v4("clgRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("clgHint")}</p>
      <p className="c4-meta">{v4("clgLocal")}</p>
      <p className="c4-meta">{v4("clgEscape")}</p>
      {leadRegion ? <p className="c4-clg-lead"><span>{v4("clgLeadRegion")}</span> {regionName(v4, leadRegion)}</p> : null}
      {leadCode ? <p className="c4-clg-lead"><span>{v4("clgLeadCode")}</span> {leadCode}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("clgBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("calling-codes.csv", callingCsv(rows))}>{v4("clgCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("clgLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("clgFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-prm-empty">{v4("clgNone")}</p>}
      {regions.length > 0 && (
        <section className="c4-clg-chart" aria-label={v4("clgAllRegion")}>
          {regions.map((line) => {
            const share = callingShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.region || "blank";
            return (
              <p key={name} className="c4-clg-col" data-region={name}>
                <span>{regionName(v4, line.region)}</span>
                <span className="c4-clg-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("clgShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-clg-regions" role="group" aria-label={v4("clgAllRegion")}>
        <button type="button" className="c4-clg-region" data-region="all" data-on={regionOn === "all" ? "1" : "0"} aria-pressed={regionOn === "all"} onClick={() => setRegion("all")}>
          <span>{v4("clgAllRegion")}</span>
          <span className="c4-prm-count">{rows.length}</span>
        </button>
        {blankRegion > 0 && (
          <button type="button" className="c4-clg-region" data-region="blank" data-on={regionOn === "blank" ? "1" : "0"} aria-pressed={regionOn === "blank"} onClick={() => { setRegion(regionOn === "blank" ? "all" : "blank"); setSelected(""); }}>
            <span>{v4("clgUnmarked")}</span>
            <span className="c4-prm-count">{blankRegion}</span>
          </button>
        )}
        {regionNames.map((item) => {
          const count = regions.find((line) => line.region === item)?.count || 0;
          return (
            <button key={item} type="button" className="c4-clg-region" data-region={item} data-on={regionOn === item ? "1" : "0"} aria-pressed={regionOn === item} onClick={() => { setSelected(""); setRegion(regionOn === item ? "all" : item); }}>
              <span>{regionName(v4, item)}</span>
              <span className="c4-prm-count">{count}</span>
              <span>{v4("clgShare")} {callingShare(count, rows.length)}%</span>
            </button>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("clgDigits")}>
        <button type="button" className="c4-chip" data-on={digitOn === "all" ? "1" : "0"} aria-pressed={digitOn === "all"} onClick={() => setDigit("all")}>{v4("clgAllDigits")}</button>
        {digits.map((line) => (
          <button key={line.digit} type="button" className="c4-chip" data-on={digitOn === line.digit ? "1" : "0"} aria-pressed={digitOn === line.digit} onClick={() => setDigit(digitOn === line.digit ? "all" : line.digit)}>
            {line.digit} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("clgShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("clgShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("clgHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("clgCodes")}>
        <button type="button" className="c4-chip" data-on={codeOn === "all" && regionOn === "all" && digitOn === "all" ? "1" : "0"} aria-pressed={codeOn === "all"} onClick={() => { setSelected(""); setRegion("all"); setDigit("all"); }}>{v4("clgAll")}</button>
        {chips.map((item) => {
          const line = codes.find((row) => row.code === item);
          const count = line?.count || 0;
          const share = callingShare(count, rows.length);
          const regionMark = line?.region || "";
          return (
            <span key={item} className="c4-clg-pair" data-code={item}>
              <button type="button" className="c4-chip" data-on={codeOn === item ? "1" : "0"} aria-pressed={codeOn === item} onClick={() => { setRegion("all"); setDigit("all"); setSelected(codeOn === item ? "" : item); }}>{item}</button>
              {regionMark ? <span className="c4-clg-region-name">{regionName(v4, regionMark)}</span> : null}
              <span className="c4-prm-count">{count}</span>
              <span className="c4-clg-share">{v4("clgShare")} {share}%</span>
              <span className="c4-clg-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleCode(hiddenCodes, item, present), showHidden ? "" : item)}>{showHidden ? v4("clgShow") : v4("clgHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("clgSearch")}</span>
        <input className="c4-field" aria-label={v4("clgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-prm-empty">{v4("clgEmpty")}</p>}
      <ul className="c4-clg-rows">
        {shown.map((row) => {
          const regionMark = dialRegion(row.phone);
          const code = dialCode(row.phone);
          return (
            <li key={row.id} data-region={regionMark || "blank"} data-code={code || "blank"}>
              <span className="c4-clg-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {regionName(v4, regionMark)}
                {code ? ` · ${code}` : ""}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
