"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  HOUSE_KEY,
  VELLUM_KEY,
  VELLUM_VIEW_KEY,
  activeBearer,
  activeDomain,
  activeHouse,
  activeHour,
  activeLane,
  activeStamp,
  activeStay,
  activeTone,
  addVellum,
  addVellumView,
  bearerArg,
  bulkVellumDone,
  bulkVellumPinned,
  domainArg,
  domainLines,
  dropVellumView,
  editVellum,
  hourArg,
  hourGap,
  hourWatch,
  houseArg,
  houseLines,
  houseShare,
  housesCsv,
  laneArg,
  leadingDomain,
  leadingHouse,
  leadingStay,
  mailDomain,
  mailHouse,
  namedDomains,
  namedHouses,
  namedStays,
  nextVellum,
  readHiddenDomains,
  readVellumViews,
  readVellums,
  resetVellums,
  setVellumDone,
  setVellumHeld,
  setVellumPinned,
  stampArg,
  stayArg,
  stayLines,
  stayOf,
  stepVellumTone,
  toggleDomain,
  toneArg,
  vellumBearers,
  vellumClashIds,
  vellumCopy,
  vellumCounts,
  vellumLanes,
  vellumShare,
  vellumStamps,
  vellumTimeline,
  vellumTones,
  vellumsCsv,
  visibleDomains,
  visibleHouseCustomers,
  visibleVellums,
  watchCounts,
  type MailHouse,
  type Stay,
  type Vellum,
  type VellumLane,
  type VellumTone,
  type VellumTray,
  type VellumView,
  type HouseRow,
} from "@/lib/crmv4/round147";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  isResident?: boolean | null;
};

type GlanceRow = HouseRow & { id: string };

const WATCHES = ["night", "morning", "afternoon", "evening"] as const;
const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour));

function laneName(v4: V4, lane: VellumLane): string {
  if (lane === "sale") return v4("vlmLaneSale");
  if (lane === "retain") return v4("vlmLaneRetain");
  if (lane === "kyc") return v4("vlmLaneKyc");
  if (lane === "support") return v4("vlmLaneSupport");
  return v4("vlmBlankLane");
}

function toneName(v4: V4, tone: VellumTone): string {
  if (tone === "quiet") return v4("vlmToneQuiet");
  if (tone === "warm") return v4("vlmToneWarm");
  if (tone === "firm") return v4("vlmToneFirm");
  return v4("vlmBlankTone");
}

function watchName(v4: V4, name: string): string {
  if (name === "night") return v4("vlmNight");
  if (name === "morning") return v4("vlmMorning");
  if (name === "afternoon") return v4("vlmAfternoon");
  if (name === "evening") return v4("vlmEvening");
  if (name === "am") return v4("vlmAm");
  if (name === "pm") return v4("vlmPm");
  return v4("vlmBlankHour");
}

function stayName(v4: V4, name: string): string {
  if (name === "resident") return v4("hhdResident");
  if (name === "visitor") return v4("hhdVisitor");
  return v4("hhdUnmarked");
}

function houseName(v4: V4, name: string): string {
  if (name === "public") return v4("hhdPublic");
  if (name === "house") return v4("hhdHouse");
  return v4("hhdBlankHouse");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("vlmAuditSave");
  if (audit === "edit") return v4("vlmAuditEdit");
  if (audit === "raise") return v4("vlmAuditRaise");
  if (audit === "lower") return v4("vlmAuditLower");
  if (audit === "pin") return v4("vlmAuditPin");
  if (audit === "unpin") return v4("vlmAuditUnpin");
  if (audit === "hold") return v4("vlmAuditHold");
  if (audit === "release") return v4("vlmAuditRelease");
  if (audit === "done") return v4("vlmAuditDone");
  if (audit === "reopen") return v4("vlmAuditReopen");
  return "";
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

export function VellumSlips({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Vellum[]>([]);
  const [views, setViews] = useState<VellumView[]>([]);
  const [text, setText] = useState("");
  const [bearer, setBearer] = useState("");
  const [hour, setHour] = useState("");
  const [lane, setLane] = useState("");
  const [stamp, setStamp] = useState("");
  const [tone, setTone] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<VellumTray>("open");
  const [bearerFilter, setBearerFilter] = useState("all");
  const [laneFilter, setLaneFilter] = useState("all");
  const [stampFilter, setStampFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [firmOnly, setFirmOnly] = useState(false);
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
    const next = readVellums(readJson(VELLUM_KEY, []));
    const saved = readVellumViews(readJson(VELLUM_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(VELLUM_KEY, next);
    writeJson(VELLUM_VIEW_KEY, saved);
    setDesk(String(new Date().getUTCHours()));
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
      if (event.key === "a" || event.key === "A") {
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
  const bearers = vellumBearers(cards);
  const lanes = vellumLanes(cards);
  const stamps = vellumStamps(cards);
  const tones = vellumTones(cards);
  const watches = watchCounts(cards);
  const bearerOn = activeBearer(bearerFilter, bearers);
  const laneOn = activeLane(laneFilter, lanes);
  const stampOn = activeStamp(stampFilter, stamps);
  const toneOn = activeTone(toneFilter, tones);
  const hourOn = activeHour(hourFilter);
  const picked = hourArg(hourOn);
  const shown = visibleVellums(
    cards,
    tray,
    query,
    bearerArg(bearerOn),
    laneArg(laneOn),
    stampArg(stampOn),
    toneArg(toneOn),
    picked.exact,
    picked.band,
    firmOnly,
    lateOnly,
    desk,
  );
  const timeline = vellumTimeline(cards, query);
  const counts = vellumCounts(cards, desk);
  const total = cards.length;
  const nextId = nextVellum(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...watches);

  function store(next: Vellum[]) {
    setCards(next);
    writeJson(VELLUM_KEY, next);
  }

  function storeViews(next: VellumView[]) {
    setViews(next);
    writeJson(VELLUM_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setBearer("");
    setHour("");
    setLane("");
    setStamp("");
    setTone("");
  }

  function copyCard(card: Vellum) {
    const body = vellumCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: VellumView) {
    setTray(view.tray);
    setQuery(view.query);
    setBearerFilter(activeBearer(view.bearer, vellumBearers(cards)));
    setLaneFilter(activeLane(view.lane, vellumLanes(cards)));
    setStampFilter(activeStamp(view.stamp, vellumStamps(cards)));
    setToneFilter(activeTone(view.tone, vellumTones(cards)));
    setHourFilter(activeHour(view.hour));
    setBoard("cards");
    setFirmOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-vlm" aria-label={v4("vlmTitle")} data-vellum="1" data-role={role} data-vellum-ledger="1">
      <header className="c4-vlm-head">
        <p className="c4-vlm-plate" data-logo="mono">{v4("vlmLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("vlmSub")}</p>
          <h2 className="c4-title">{v4("vlmTitle")}</h2>
        </div>
        <p className="c4-vlm-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("vlmHint")}</p>
      <p className="c4-meta">{v4("vlmLocal")}</p>
      <p className="c4-meta">{v4("vlmBlank")}</p>
      <p className="c4-meta">{v4("vlmBearerBlank")}</p>
      <p className="c4-meta">{v4("vlmHourBlank")}</p>
      <p className="c4-meta">{v4("vlmLaneBlank")}</p>
      <p className="c4-meta">{v4("vlmStampBlank")}</p>
      <p className="c4-meta">{v4("vlmToneBlank")}</p>
      <p className="c4-meta">{v4("vlmEscape")}</p>
      <p className="c4-meta">{v4("vlmSlash")}</p>
      <p className="c4-meta">{v4("vlmNew")}</p>
      {viewer ? <p className="c4-vlm-notice" role="status">{v4("vlmViewer")}</p> : null}
      <p className="c4-vlm-notice" role="status">
        <span>{v4("vlmNotice")}</span>
        <span className="c4-vlm-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("vlmNoticeAll") : v4("vlmNoticeOpen")}
        </button>
      </p>
      <section className="c4-vlm-kpi" aria-label={v4("vlmKpi")}>
        <p className="c4-pay-kicker">{v4("vlmKpi")}</p>
        {(["open", "held", "done", "pinned"] as const).map((key) => {
          const count = key === "pinned" ? counts.pinned : counts[key];
          const share = vellumShare(count, total);
          const label = key === "open" ? v4("vlmOpen") : key === "held" ? v4("vlmHeld") : key === "done" ? v4("vlmDoneTray") : v4("vlmPinned");
          return (
            <p key={key} className="c4-vlm-meter" data-tray={key}>
              <span>{label}</span>
              <span>{count}</span>
              <span>{v4("vlmShare")} {share}%</span>
              <span className="c4-vlm-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-vlm-chart" aria-label={v4("vlmChart")}>
        <p className="c4-pay-kicker">{v4("vlmChart")}</p>
        {WATCHES.map((name, index) => {
          const count = watches[index] || 0;
          const width = Math.max(count ? 8 : 0, Math.round((count / widest) * 100));
          return (
            <button
              key={name}
              type="button"
              className="c4-vlm-band"
              data-watch={name}
              aria-pressed={hourOn === name}
              onClick={() => { setHourFilter(hourOn === name ? "all" : name); setBoard("cards"); }}
            >
              <span>{watchName(v4, name)}</span>
              <span className="c4-vlm-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-vlm-next" onSubmit={(event) => event.preventDefault()}>
        <label className="c4-lab">
          <span>{v4("vlmDeskHour")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("vlmDeskHour")} value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <p className="c4-vlm-next-card">
          <span>{v4("vlmNext")}</span>
          {nextCard ? <strong>{nextCard.text}</strong> : <span>{v4("vlmNextEmpty")}</span>}
        </p>
      </form>
      <form
        className="c4-vlm-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addVellum(cards, { id: `vlm-${Date.now()}`, text, bearer, hour, lane, stamp, tone });
          if (next.length === cards.length) return;
          store(next);
          clearDraft();
        }}
      >
        <label className="c4-lab">
          <span>{v4("vlmText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("vlmText")} value={text} disabled={viewer} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("vlmBearer")}</span>
          <input className="c4-field" aria-label={v4("vlmBearer")} value={bearer} disabled={viewer} onChange={(event) => setBearer(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("vlmHour")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("vlmHour")} value={hour} disabled={viewer} onChange={(event) => setHour(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("vlmLane")}</span>
          <select className="c4-select" aria-label={v4("vlmLane")} value={lane} disabled={viewer} onChange={(event) => setLane(event.target.value)}>
            <option value="">{v4("vlmBlankLane")}</option>
            <option value="sale">{v4("vlmLaneSale")}</option>
            <option value="retain">{v4("vlmLaneRetain")}</option>
            <option value="kyc">{v4("vlmLaneKyc")}</option>
            <option value="support">{v4("vlmLaneSupport")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("vlmStamp")}</span>
          <input className="c4-field" aria-label={v4("vlmStamp")} value={stamp} disabled={viewer} onChange={(event) => setStamp(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("vlmTone")}</span>
          <select className="c4-select" aria-label={v4("vlmTone")} value={tone} disabled={viewer} onChange={(event) => setTone(event.target.value)}>
            <option value="">{v4("vlmBlankTone")}</option>
            <option value="quiet">{v4("vlmToneQuiet")}</option>
            <option value="warm">{v4("vlmToneWarm")}</option>
            <option value="firm">{v4("vlmToneFirm")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("vlmAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("vlmTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => { setTray("open"); setBoard("cards"); }}>{v4("vlmOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} aria-pressed={tray === "held"} onClick={() => { setTray("held"); setBoard("cards"); }}>{v4("vlmHeld")}</button>
        <button type="button" className="c4-chip" data-on={tray === "done" ? "1" : "0"} aria-pressed={tray === "done"} onClick={() => { setTray("done"); setBoard("cards"); }}>{v4("vlmDoneTray")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard("timeline")}>{v4("vlmTimeline")}</button>
        <button type="button" className="c4-btn" aria-pressed={firmOnly} onClick={() => setFirmOnly((value) => !value)}>{v4("vlmFirm")}</button>
        <button type="button" className="c4-btn" onClick={() => download("vellum-slips.csv", vellumsCsv(cards, desk))}>{v4("vlmCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkVellumPinned(cards, shown.map((card) => card.id), true))}>{v4("vlmBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkVellumDone(cards, shown.map((card) => card.id), true))}>{v4("vlmBulkDone")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetVellums()); setEditing(""); }}>{v4("vlmReset")}</button>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("vlmSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("vlmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("vlmBearers")}</span>
          <select className="c4-select" aria-label={v4("vlmBearers")} value={bearerOn} onChange={(event) => setBearerFilter(event.target.value)}>
            <option value="all">{v4("vlmAllBearers")}</option>
            <option value="blank">{v4("vlmBlankBearer")}</option>
            {bearers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("vlmLanes")}</span>
          <select className="c4-select" aria-label={v4("vlmLanes")} value={laneOn} onChange={(event) => setLaneFilter(event.target.value)}>
            <option value="all">{v4("vlmAllLanes")}</option>
            <option value="blank">{v4("vlmBlankLane")}</option>
            {lanes.map((item) => <option key={item} value={item}>{laneName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("vlmStamps")}</span>
          <select className="c4-select" aria-label={v4("vlmStamps")} value={stampOn} onChange={(event) => setStampFilter(event.target.value)}>
            <option value="all">{v4("vlmAllStamps")}</option>
            <option value="blank">{v4("vlmBlankStamp")}</option>
            {stamps.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("vlmTones")}</span>
          <select className="c4-select" aria-label={v4("vlmTones")} value={toneOn} onChange={(event) => setToneFilter(event.target.value)}>
            <option value="all">{v4("vlmAllTones")}</option>
            <option value="blank">{v4("vlmBlankTone")}</option>
            {tones.map((item) => <option key={item} value={item}>{toneName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("vlmHours")}</span>
          <select className="c4-select" aria-label={v4("vlmHours")} value={hourOn} onChange={(event) => setHourFilter(event.target.value)}>
            <option value="all">{v4("vlmAllHours")}</option>
            <option value="blank">{v4("vlmBlankHour")}</option>
            <option value="night">{v4("vlmNight")}</option>
            <option value="morning">{v4("vlmMorning")}</option>
            <option value="afternoon">{v4("vlmAfternoon")}</option>
            <option value="evening">{v4("vlmEvening")}</option>
            <option value="am">{v4("vlmAm")}</option>
            <option value="pm">{v4("vlmPm")}</option>
            {HOURS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <form
        className="c4-vlm-view"
        onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addVellumView(views, {
            id: `view-${Date.now()}`,
            name: viewName,
            tray,
            query,
            bearer: bearerOn,
            lane: laneOn,
            stamp: stampOn,
            tone: toneOn,
            hour: hourOn,
          });
          if (next.length === views.length) return;
          storeViews(next);
          setViewName("");
        }}
      >
        <label className="c4-lab">
          <span>{v4("vlmViewName")}</span>
          <input className="c4-field" aria-label={v4("vlmViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("vlmSaveView")}</button>
      </form>
      <section aria-label={v4("vlmViews")}>
        <p className="c4-pay-kicker">{v4("vlmViews")}</p>
        {!views.length && <p className="c4-vlm-empty">{v4("vlmViewEmpty")}</p>}
        <ul className="c4-vlm-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropVellumView(views, view.id))}>{v4("vlmDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-vlm-empty">{v4("vlmEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-vlm-rows">
          {shown.map((card) => {
            const gap = hourGap(card.hour, desk);
            const clashes = vellumClashIds(cards, card.id);
            const watch = hourWatch(card.hour);
            return (
              <li key={card.id} data-tone={card.tone || "blank"} data-watch={watch} data-pinned={card.pinned ? "1" : "0"}>
                <span className="c4-vlm-clock">{hourLabel(card.hour)}</span>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); store(editVellum(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("vlmEdit")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("vlmSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-meta">
                    {card.bearer || v4("vlmBlankBearer")}
                    {" · "}
                    {laneName(v4, (card.lane || "blank") as VellumLane)}
                    {" · "}
                    {card.stamp || v4("vlmBlankStamp")}
                    {" · "}
                    {toneName(v4, (card.tone || "blank") as VellumTone)}
                    {" · "}
                    {watchName(v4, watch)}
                    {gap === null ? "" : ` · ${gap > 0 ? v4("vlmLate") : gap < 0 ? v4("vlmAhead") : v4("vlmNow")} ${gap}`}
                    {card.audit ? ` · ${v4("vlmAudit")} ${auditName(v4, card.audit)}` : ""}
                    {clashes.length ? ` · ${v4("vlmClash")} ${clashes.length}` : ` · ${v4("vlmClashNone")}`}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("vlmCopied") : v4("vlmCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("vlmEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepVellumTone(cards, card.id, 1))}>{v4("vlmRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepVellumTone(cards, card.id, -1))}>{v4("vlmLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setVellumPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("vlmUnpin") : v4("vlmPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.held} onClick={() => store(setVellumHeld(cards, card.id, !card.held))}>{card.held ? v4("vlmRelease") : v4("vlmHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.done} onClick={() => store(setVellumDone(cards, card.id, !card.done))}>{card.done ? v4("vlmReopen") : v4("vlmDone")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-vlm-time">
          {timeline.map((card) => (
            <li key={card.id} data-watch={hourWatch(card.hour)}>
              <span className="c4-vlm-clock">{hourLabel(card.hour)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function HouseholdMarks({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenDomains, setHiddenDomains] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [stay, setStay] = useState("all");
  const [house, setHouse] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      stay: row.isResident,
      mail: row.email,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const stays = stayLines(rows);
  const houses = houseLines(rows);
  const domains = domainLines(rows);
  const present = namedDomains(rows);
  const presentKey = present.join("\n");
  const stayNames = namedStays(rows);
  const houseNames = namedHouses(rows);
  const blankStay = stays.find((line) => !line.stay)?.count || 0;
  const blankHouse = houses.find((line) => !line.house)?.count || 0;
  const leadStay = leadingStay(rows);
  const leadHouse = leadingHouse(rows);
  const leadDomain = leadingDomain(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenDomains(readJson(HOUSE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenDomains(next);
    writeJson(HOUSE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleDomains(present, hiddenDomains, showHidden);
  const domainOn = activeDomain(selected, chips);
  const stayOn = activeStay(stay, stayNames);
  const houseOn = activeHouse(house, houseNames);
  const shown = visibleHouseCustomers(rows, stayArg(stayOn), houseArg(houseOn), domainArg(domainOn), query);
  const widest = Math.max(1, ...houses.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenDomains(next);
    writeJson(HOUSE_KEY, next);
    if (clear && activeDomain(selected, [clear]) === clear) setSelected("");
  }

  return (
    <section className="c4-hhd" aria-label={v4("hhdTitle")} data-house="1" data-vellum-ledger="1">
      <header className="c4-hhd-head">
        <div>
          <p className="c4-pay-kicker">{v4("hhdSub")}</p>
          <h2 className="c4-title">{v4("hhdTitle")}</h2>
        </div>
        <p className="c4-vlm-count">{v4("hhdRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("hhdHint")}</p>
      <p className="c4-meta">{v4("hhdLocal")}</p>
      <p className="c4-meta">{v4("hhdEscape")}</p>
      {leadStay ? <p className="c4-hhd-lead"><span>{v4("hhdLeadStay")}</span> {stayName(v4, leadStay)}</p> : null}
      {leadHouse ? <p className="c4-hhd-lead"><span>{v4("hhdLeadHouse")}</span> {houseName(v4, leadHouse)}</p> : null}
      {leadDomain ? <p className="c4-hhd-lead"><span>{v4("hhdLeadDomain")}</span> {leadDomain}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("hhdBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("household-marks.csv", housesCsv(rows))}>{v4("hhdCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("hhdLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("hhdFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-vlm-empty">{v4("hhdNone")}</p>}
      {houses.length > 0 && (
        <section className="c4-hhd-chart" aria-label={v4("hhdAllHouse")}>
          {houses.map((line) => {
            const share = houseShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.house || "blank";
            return (
              <p key={name} className="c4-hhd-col" data-house={name}>
                <span>{houseName(v4, line.house)}</span>
                <span className="c4-hhd-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("hhdShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-hhd-stays" role="group" aria-label={v4("hhdAllStay")}>
        <button type="button" className="c4-hhd-stay" data-stay="all" data-on={stayOn === "all" ? "1" : "0"} aria-pressed={stayOn === "all"} onClick={() => setStay("all")}>
          <span>{v4("hhdAllStay")}</span>
          <span className="c4-vlm-count">{rows.length}</span>
        </button>
        {blankStay > 0 && (
          <button type="button" className="c4-hhd-stay" data-stay="blank" data-on={stayOn === "blank" ? "1" : "0"} aria-pressed={stayOn === "blank"} onClick={() => { setStay(stayOn === "blank" ? "all" : "blank"); setSelected(""); }}>
            <span>{v4("hhdUnmarked")}</span>
            <span className="c4-vlm-count">{blankStay}</span>
          </button>
        )}
        {stayNames.map((item) => {
          const count = stays.find((line) => line.stay === item)?.count || 0;
          return (
            <button key={item} type="button" className="c4-hhd-stay" data-stay={item} data-on={stayOn === item ? "1" : "0"} aria-pressed={stayOn === item} onClick={() => { setSelected(""); setStay(stayOn === item ? "all" : item); }}>
              <span>{stayName(v4, item)}</span>
              <span className="c4-vlm-count">{count}</span>
              <span>{v4("hhdShare")} {houseShare(count, rows.length)}%</span>
            </button>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("hhdAllHouse")}>
        <button type="button" className="c4-chip" data-on={houseOn === "all" ? "1" : "0"} aria-pressed={houseOn === "all"} onClick={() => setHouse("all")}>{v4("hhdAllHouse")}</button>
        {blankHouse > 0 && (
          <button type="button" className="c4-chip" data-on={houseOn === "blank" ? "1" : "0"} aria-pressed={houseOn === "blank"} onClick={() => { setHouse(houseOn === "blank" ? "all" : "blank"); setSelected(""); }}>{v4("hhdBlankHouse")}</button>
        )}
        {houseNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={houseOn === item ? "1" : "0"} aria-pressed={houseOn === item} onClick={() => { setSelected(""); setHouse(houseOn === item ? "all" : item); }}>{houseName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("hhdShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("hhdShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("hhdHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("hhdDomains")}>
        <button type="button" className="c4-chip" data-on={domainOn === "all" && stayOn === "all" && houseOn === "all" ? "1" : "0"} aria-pressed={domainOn === "all"} onClick={() => { setSelected(""); setStay("all"); setHouse("all"); }}>{v4("hhdAll")}</button>
        {chips.map((item) => {
          const line = domains.find((row) => row.domain === item);
          const count = line?.count || 0;
          const share = houseShare(count, rows.length);
          const houseMark = (line?.house || "") as MailHouse;
          return (
            <span key={item} className="c4-hhd-pair" data-domain={item}>
              <button type="button" className="c4-chip" data-on={domainOn === item ? "1" : "0"} aria-pressed={domainOn === item} onClick={() => { setStay("all"); setHouse("all"); setSelected(domainOn === item ? "" : item); }}>{item}</button>
              {houseMark ? <span className="c4-hhd-house">{houseName(v4, houseMark)}</span> : null}
              <span className="c4-vlm-count">{count}</span>
              <span className="c4-hhd-share">{v4("hhdShare")} {share}%</span>
              <span className="c4-hhd-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleDomain(hiddenDomains, item, present), showHidden ? "" : item)}>{showHidden ? v4("hhdShow") : v4("hhdHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("hhdSearch")}</span>
        <input className="c4-field" aria-label={v4("hhdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-vlm-empty">{v4("hhdEmpty")}</p>}
      <ul className="c4-hhd-rows">
        {shown.map((row) => {
          const stayMark = stayOf(row.stay) as Stay;
          const houseMark = mailHouse(row.mail) as MailHouse;
          const domain = mailDomain(row.mail);
          return (
            <li key={row.id} data-stay={stayMark || "blank"} data-house={houseMark || "blank"}>
              <span className="c4-hhd-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {stayName(v4, stayMark)}
                {" · "}
                {houseName(v4, houseMark)}
                {domain ? ` · ${domain}` : ""}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
