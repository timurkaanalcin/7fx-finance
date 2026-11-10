"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DISPATCH_KEY,
  DISPATCH_VIEW_KEY,
  WING_KEY,
  activeCourier,
  activeDesk,
  activeHour,
  activeInitial,
  activeLane,
  activePace,
  activeSpan,
  activeWax,
  activeWing,
  addDispatch,
  addDispatchView,
  assignedDesk,
  bulkDispatchFiled,
  bulkDispatchPinned,
  courierArg,
  daypartCounts,
  deskArg,
  deskLines,
  deskShare,
  desksCsv,
  dispatchClashIds,
  dispatchCopy,
  dispatchCounts,
  dispatchCouriers,
  dispatchLanes,
  dispatchPaces,
  dispatchShare,
  dispatchTimeline,
  dispatchWaxes,
  dispatchesCsv,
  dropDispatchView,
  editDispatch,
  hourArg,
  hourBand,
  hourGap,
  hourPair,
  initialArg,
  initialLines,
  initialOf,
  laneArg,
  leadingDesk,
  leadingWing,
  namedDesks,
  namedInitials,
  namedWings,
  nextDispatch,
  paceArg,
  readDispatchViews,
  readDispatches,
  readHiddenDesks,
  resetDispatches,
  setDispatchFiled,
  setDispatchHeld,
  setDispatchPinned,
  spanArg,
  spanLines,
  spanOf,
  stepDispatchPace,
  toggleDesk,
  visibleDeskCustomers,
  visibleDesks,
  visibleDispatches,
  waxArg,
  wingArg,
  wingLines,
  wingOf,
  type DeskRow,
  type DispatchCard,
  type DispatchLane,
  type DispatchPace,
  type DispatchTray,
  type DispatchView,
} from "@/lib/crmv4/round151";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  desk?: string | null;
};

type GlanceRow = DeskRow & { id: string };

const DAYPARTS = ["night", "morning", "afternoon", "evening"] as const;

function laneName(v4: V4, lane: DispatchLane): string {
  if (lane === "north") return v4("dspLaneNorth");
  if (lane === "south") return v4("dspLaneSouth");
  if (lane === "east") return v4("dspLaneEast");
  if (lane === "west") return v4("dspLaneWest");
  return v4("dspBlankLane");
}

function paceName(v4: V4, pace: DispatchPace): string {
  if (pace === "walk") return v4("dspPaceWalk");
  if (pace === "trot") return v4("dspPaceTrot");
  if (pace === "gallop") return v4("dspPaceGallop");
  return v4("dspBlankPace");
}

function hourName(v4: V4, name: string): string {
  if (name === "night") return v4("dspNight");
  if (name === "morning") return v4("dspMorning");
  if (name === "afternoon") return v4("dspAfternoon");
  if (name === "evening") return v4("dspEvening");
  if (name === "odd") return v4("dspOdd");
  if (name === "even") return v4("dspEven");
  if (/^(?:0|[1-9]|1\d|2[0-3])$/.test(name)) return name;
  return v4("dspBlankHour");
}

function wingName(v4: V4, name: string): string {
  if (name === "north") return v4("dskNorth");
  if (name === "south") return v4("dskSouth");
  if (name === "east") return v4("dskEast");
  if (name === "west") return v4("dskWest");
  if (name === "floor") return v4("dskFloor");
  return v4("dskUnmarked");
}

function spanName(v4: V4, name: string): string {
  if (name === "short") return v4("dskShort");
  if (name === "mid") return v4("dskMid");
  if (name === "long") return v4("dskLong");
  return v4("dskUnmarked");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("dspAuditSave");
  if (audit === "edit") return v4("dspAuditEdit");
  if (audit === "raise") return v4("dspAuditRaise");
  if (audit === "lower") return v4("dspAuditLower");
  if (audit === "pin") return v4("dspAuditPin");
  if (audit === "unpin") return v4("dspAuditUnpin");
  if (audit === "hold") return v4("dspAuditHold");
  if (audit === "release") return v4("dspAuditRelease");
  if (audit === "file") return v4("dspAuditFile");
  if (audit === "reopen") return v4("dspAuditReopen");
  return "";
}

function hourLabel(hour: number | null): string {
  return hour === null ? "—" : String(hour);
}

function gapLabel(v4: V4, hour: number | null, clock: string): string {
  const gap = hourGap(hour, clock);
  if (gap === null) return "";
  if (gap > 0) return `${v4("dspOver")} ${gap}`;
  if (gap < 0) return `${v4("dspLeft")} ${Math.abs(gap)}`;
  return v4("dspNow");
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

export function DispatchSlips({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<DispatchCard[]>([]);
  const [views, setViews] = useState<DispatchView[]>([]);
  const [text, setText] = useState("");
  const [courier, setCourier] = useState("");
  const [hour, setHour] = useState("");
  const [lane, setLane] = useState("");
  const [wax, setWax] = useState("");
  const [pace, setPace] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<DispatchTray>("open");
  const [courierFilter, setCourierFilter] = useState("all");
  const [laneFilter, setLaneFilter] = useState("all");
  const [waxFilter, setWaxFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [gallopOnly, setGallopOnly] = useState(false);
  const [lateOnly, setLateOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [clock, setClock] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readDispatches(readJson(DISPATCH_KEY, []));
    const saved = readDispatchViews(readJson(DISPATCH_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(DISPATCH_KEY, next);
    writeJson(DISPATCH_VIEW_KEY, saved);
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
      if (event.key === "d" || event.key === "D") {
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
  const couriers = dispatchCouriers(cards);
  const lanes = dispatchLanes(cards);
  const waxes = dispatchWaxes(cards);
  const paces = dispatchPaces(cards);
  const bars = daypartCounts(cards);
  const courierOn = activeCourier(courierFilter, couriers);
  const laneOn = activeLane(laneFilter, lanes);
  const waxOn = activeWax(waxFilter, waxes);
  const paceOn = activePace(paceFilter, paces);
  const hourOn = activeHour(hourFilter);
  const picked = hourArg(hourOn);
  const shown = visibleDispatches(
    cards,
    tray,
    query,
    courierArg(courierOn),
    laneArg(laneOn),
    waxArg(waxOn),
    paceArg(paceOn),
    picked.exact,
    picked.band,
    gallopOnly,
    lateOnly,
    clock,
  );
  const timeline = dispatchTimeline(cards, query);
  const counts = dispatchCounts(cards, clock);
  const total = cards.length;
  const nextId = nextDispatch(cards, clock);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);

  function store(next: DispatchCard[]) {
    setCards(next);
    writeJson(DISPATCH_KEY, next);
  }

  function storeViews(next: DispatchView[]) {
    setViews(next);
    writeJson(DISPATCH_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setCourier("");
    setHour("");
    setLane("");
    setWax("");
    setPace("");
  }

  function copyCard(card: DispatchCard) {
    const body = dispatchCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: DispatchView) {
    setTray(view.tray);
    setQuery(view.query);
    setCourierFilter(activeCourier(view.courier, dispatchCouriers(cards)));
    setLaneFilter(activeLane(view.lane, dispatchLanes(cards)));
    setWaxFilter(activeWax(view.wax, dispatchWaxes(cards)));
    setPaceFilter(activePace(view.pace, dispatchPaces(cards)));
    setHourFilter(activeHour(view.hour));
    setBoard("cards");
    setGallopOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-dsp" aria-label={v4("dspTitle")} data-dispatch="1" data-role={role}>
      <header className="c4-dsp-head">
        <p className="c4-dsp-plate" data-logo="mono">{v4("dspLogo")}</p>
        <div>
          <p className="c4-dsp-kicker">{v4("dspSub")}</p>
          <h2 className="c4-title">{v4("dspTitle")}</h2>
        </div>
        <p className="c4-dsp-count">{shown.length}</p>
      </header>
      <details className="c4-dsp-rules">
        <summary>{v4("dspRules")}</summary>
        <p className="c4-meta">{v4("dspHint")}</p>
        <p className="c4-meta">{v4("dspLocal")}</p>
        <p className="c4-meta">{v4("dspBlank")}</p>
        <p className="c4-meta">{v4("dspCourierBlank")}</p>
        <p className="c4-meta">{v4("dspHourBlank")}</p>
        <p className="c4-meta">{v4("dspLaneBlank")}</p>
        <p className="c4-meta">{v4("dspWaxBlank")}</p>
        <p className="c4-meta">{v4("dspPaceBlank")}</p>
        <p className="c4-meta">{v4("dspEscape")}</p>
        <p className="c4-meta">{v4("dspSlash")}</p>
        <p className="c4-meta">{v4("dspNew")}</p>
      </details>
      {viewer ? <p className="c4-dsp-notice" role="status">{v4("dspViewer")}</p> : null}
      <p className="c4-dsp-notice" role="status">
        <span>{v4("dspNotice")}</span>
        <span className="c4-dsp-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("dspNoticeAll") : v4("dspNoticeOpen")}
        </button>
      </p>
      <section className="c4-dsp-kpi" aria-label={v4("dspKpi")}>
        {(["open", "held", "filed", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = dispatchShare(count, total);
          const label = key === "open" ? v4("dspOpen") : key === "held" ? v4("dspHeld") : key === "filed" ? v4("dspFiled") : v4("dspPinned");
          return (
            <p key={key} className="c4-dsp-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("dspShare")} {share}%</span>
              <span className="c4-dsp-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-dsp-chart" aria-label={v4("dspChart")}>
        <p className="c4-dsp-kicker">{v4("dspChart")}</p>
        {DAYPARTS.map((name, index) => {
          const count = bars[index] || 0;
          const height = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-dsp-col" data-on={hourOn === name ? "1" : "0"} aria-pressed={hourOn === name} onClick={() => setHourFilter(hourOn === name ? "all" : name)}>
              <span className="c4-dsp-bar" aria-hidden="true"><i style={{ height: `${height}%` }} /></span>
              <span>{hourName(v4, name)}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-dsp-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addDispatch(cards, { id: `dsp-${Date.now()}`, text, courier, hour, lane, wax, pace });
        if (next === cards || next.length === cards.length) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("dspText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("dspText")} value={text} disabled={viewer} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("dspCourier")}</span>
          <input className="c4-field" aria-label={v4("dspCourier")} value={courier} disabled={viewer} onChange={(event) => setCourier(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("dspHour")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("dspHour")} value={hour} disabled={viewer} onChange={(event) => setHour(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("dspLane")}</span>
          <select className="c4-select" aria-label={v4("dspLane")} value={lane} disabled={viewer} onChange={(event) => setLane(event.target.value)}>
            <option value="">{v4("dspBlankLane")}</option>
            <option value="north">{v4("dspLaneNorth")}</option>
            <option value="south">{v4("dspLaneSouth")}</option>
            <option value="east">{v4("dspLaneEast")}</option>
            <option value="west">{v4("dspLaneWest")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("dspWax")}</span>
          <input className="c4-field" aria-label={v4("dspWax")} value={wax} disabled={viewer} onChange={(event) => setWax(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("dspPace")}</span>
          <select className="c4-select" aria-label={v4("dspPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("dspBlankPace")}</option>
            <option value="walk">{v4("dspPaceWalk")}</option>
            <option value="trot">{v4("dspPaceTrot")}</option>
            <option value="gallop">{v4("dspPaceGallop")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("dspAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("dspTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("dspOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} aria-pressed={tray === "held"} onClick={() => setTray("held")}>{v4("dspHeld")}</button>
        <button type="button" className="c4-chip" data-on={tray === "filed" ? "1" : "0"} aria-pressed={tray === "filed"} onClick={() => setTray("filed")}>{v4("dspFiled")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("dspTimeline")}</button>
        <button type="button" className="c4-chip" data-on={gallopOnly ? "1" : "0"} aria-pressed={gallopOnly} onClick={() => setGallopOnly((value) => !value)}>{v4("dspGallop")}</button>
        <button type="button" className="c4-btn" onClick={() => download("dispatch-slips.csv", dispatchesCsv(cards, clock))}>{v4("dspCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkDispatchPinned(cards, shown.map((card) => card.id), true))}>{v4("dspBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkDispatchFiled(cards, shown.map((card) => card.id), true))}>{v4("dspBulkFile")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetDispatches()); setEditing(""); }}>{v4("dspReset")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("dspHours")}>
        <button type="button" className="c4-chip" data-on={hourOn === "all" ? "1" : "0"} aria-pressed={hourOn === "all"} onClick={() => setHourFilter("all")}>{v4("dspAllHours")}</button>
        <button type="button" className="c4-chip" data-on={hourOn === "blank" ? "1" : "0"} aria-pressed={hourOn === "blank"} onClick={() => setHourFilter("blank")}>{v4("dspBlankHour")}</button>
        <button type="button" className="c4-chip" data-on={hourOn === "odd" ? "1" : "0"} aria-pressed={hourOn === "odd"} onClick={() => setHourFilter("odd")}>{v4("dspOdd")}</button>
        <button type="button" className="c4-chip" data-on={hourOn === "even" ? "1" : "0"} aria-pressed={hourOn === "even"} onClick={() => setHourFilter("even")}>{v4("dspEven")}</button>
        {["0", "6", "12", "18"].map((slot) => (
          <button key={slot} type="button" className="c4-chip" data-on={hourOn === slot ? "1" : "0"} aria-pressed={hourOn === slot} onClick={() => setHourFilter(hourOn === slot ? "all" : slot)}>{slot}</button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("dspSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("dspSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-dsp-next">
        <label className="c4-lab">
          <span>{v4("dspClock")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("dspClock")} value={clock} onChange={(event) => setClock(event.target.value)} />
        </label>
        <p className="c4-meta">
          <span>{v4("dspNext")}</span>
          {" "}
          {nextCard ? nextCard.text : v4("dspNextEmpty")}
        </p>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("dspCouriers")}</span>
          <select className="c4-select" aria-label={v4("dspCouriers")} value={courierOn} onChange={(event) => setCourierFilter(event.target.value)}>
            <option value="all">{v4("dspAllCouriers")}</option>
            <option value="blank">{v4("dspBlankCourier")}</option>
            {couriers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("dspLanes")}</span>
          <select className="c4-select" aria-label={v4("dspLanes")} value={laneOn} onChange={(event) => setLaneFilter(event.target.value)}>
            <option value="all">{v4("dspAllLanes")}</option>
            <option value="blank">{v4("dspBlankLane")}</option>
            {lanes.map((item) => <option key={item} value={item}>{laneName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("dspWaxes")}</span>
          <select className="c4-select" aria-label={v4("dspWaxes")} value={waxOn} onChange={(event) => setWaxFilter(event.target.value)}>
            <option value="all">{v4("dspAllWaxes")}</option>
            <option value="blank">{v4("dspBlankWax")}</option>
            {waxes.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("dspPaces")}</span>
          <select className="c4-select" aria-label={v4("dspPaces")} value={paceOn} onChange={(event) => setPaceFilter(event.target.value)}>
            <option value="all">{v4("dspAllPaces")}</option>
            <option value="blank">{v4("dspBlankPace")}</option>
            {paces.map((item) => <option key={item} value={item}>{paceName(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <form className="c4-dsp-view" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addDispatchView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          courier: courierOn,
          lane: laneOn,
          wax: waxOn,
          pace: paceOn,
          hour: hourOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("dspViewName")}</span>
          <input className="c4-field" aria-label={v4("dspViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("dspSaveView")}</button>
      </form>
      <section aria-label={v4("dspViews")}>
        <p className="c4-dsp-kicker">{v4("dspViews")}</p>
        {!views.length && <p className="c4-dsp-empty">{v4("dspViewEmpty")}</p>}
        <ul className="c4-dsp-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropDispatchView(views, view.id))}>{v4("dspDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-dsp-empty">{v4("dspEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-dsp-rows">
          {shown.map((card) => {
            const clashes = dispatchClashIds(cards, card.id);
            const gap = gapLabel(v4, card.hour, clock);
            const pair = hourPair(card.hour);
            return (
              <li key={card.id} data-pace={card.pace || "blank"} data-lane={card.lane || "blank"} data-hour={hourBand(card.hour)}>
                <span className="c4-dsp-clock">{hourLabel(card.hour)}</span>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editDispatch(cards, card.id, draft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("dspEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("dspSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-meta">
                    {card.courier || v4("dspBlankCourier")}
                    {" · "}
                    {laneName(v4, laneOfCard(card.lane))}
                    {" · "}
                    {card.wax || v4("dspBlankWax")}
                    {" · "}
                    {paceName(v4, paceOfCard(card.pace))}
                    {pair === "blank" ? "" : ` · ${pair === "odd" ? v4("dspOdd") : v4("dspEven")}`}
                    {gap ? ` · ${gap}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("dspAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashes.length ? `${v4("dspClash")} ${clashes.length}` : v4("dspClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("dspCopied") : v4("dspCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("dspEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepDispatchPace(cards, card.id, 1))}>{v4("dspRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepDispatchPace(cards, card.id, -1))}>{v4("dspLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setDispatchPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("dspUnpin") : v4("dspPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.held} onClick={() => store(setDispatchHeld(cards, card.id, !card.held))}>{card.held ? v4("dspRelease") : v4("dspHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.filed} onClick={() => store(setDispatchFiled(cards, card.id, !card.filed))}>{card.filed ? v4("dspReopen") : v4("dspFile")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-dsp-time">
          {timeline.map((card) => (
            <li key={card.id} data-hour={hourBand(card.hour)}>
              <span className="c4-dsp-clock">{hourLabel(card.hour)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function laneOfCard(lane: string): DispatchLane {
  if (lane === "north" || lane === "south" || lane === "east" || lane === "west") return lane;
  return "blank";
}

function paceOfCard(pace: string): DispatchPace {
  if (pace === "walk" || pace === "trot" || pace === "gallop") return pace;
  return "blank";
}

export function DeskWings({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenDesks, setHiddenDesks] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [desk, setDesk] = useState("all");
  const [wing, setWing] = useState("all");
  const [span, setSpan] = useState("all");
  const [initial, setInitial] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      desk: row.desk,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const desks = deskLines(rows);
  const wings = wingLines(rows);
  const spans = spanLines(rows);
  const initials = initialLines(rows);
  const present = namedDesks(rows);
  const presentKey = present.join("\n");
  const deskNames = namedDesks(rows);
  const wingNames = namedWings(rows);
  const spanNames = spans.map((line) => line.span).filter(Boolean);
  const initialNames = namedInitials(rows);
  const blankDesk = desks.find((line) => !line.desk)?.count || 0;
  const leadDesk = leadingDesk(rows);
  const leadWing = leadingWing(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenDesks(readJson(WING_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenDesks(next);
    writeJson(WING_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleDesks(present, hiddenDesks, showHidden);
  const deskOn = activeDesk(selected || desk, selected ? chips : deskNames);
  const wingOn = activeWing(wing, wingNames);
  const spanOn = activeSpan(span, spanNames);
  const initialOn = activeInitial(initial, initialNames);
  const shown = visibleDeskCustomers(
    rows,
    selected ? deskArg(activeDesk(selected, chips)) : deskArg(activeDesk(desk, deskNames)),
    wingArg(wingOn),
    spanArg(spanOn),
    initialArg(initialOn),
    query,
  );
  const widest = Math.max(1, ...desks.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenDesks(next);
    writeJson(WING_KEY, next);
    if (clear && activeDesk(selected, [clear]) === clear) setSelected("");
  }

  return (
    <section className="c4-dsk" aria-label={v4("dskTitle")} data-wings="1">
      <header className="c4-dsk-head">
        <div>
          <p className="c4-dsp-kicker">{v4("dskSub")}</p>
          <h2 className="c4-title">{v4("dskTitle")}</h2>
        </div>
        <p className="c4-dsp-count">{v4("dskRows")} {rows.length}</p>
      </header>
      <details className="c4-dsp-rules">
        <summary>{v4("dskRules")}</summary>
        <p className="c4-meta">{v4("dskHint")}</p>
        <p className="c4-meta">{v4("dskLocal")}</p>
        <p className="c4-meta">{v4("dskEscape")}</p>
      </details>
      {leadDesk ? <p className="c4-dsk-lead"><span>{v4("dskLeadDesk")}</span> {leadDesk}</p> : null}
      {leadWing ? <p className="c4-dsk-lead"><span>{v4("dskLeadWing")}</span> {wingName(v4, leadWing)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("dskBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("desk-wings.csv", desksCsv(rows))}>{v4("dskCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("dskLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("dskFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-dsp-empty">{v4("dskNone")}</p>}
      {desks.length > 0 && (
        <section className="c4-dsk-chart" aria-label={v4("dskAllDesk")}>
          {desks.map((line) => {
            const share = deskShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.desk || "blank";
            return (
              <p key={name} className="c4-dsk-col" data-wing={wingOf(line.desk) || "blank"}>
                <span className="c4-dsk-mark">{initialOf(line.desk) || "—"}</span>
                <span>{line.desk || v4("dskUnmarked")}</span>
                <span className="c4-dsk-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("dskShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-dsk-desks" role="group" aria-label={v4("dskAllDesk")}>
        <button type="button" className="c4-dsk-desk" data-wing="all" data-on={!selected && deskOn === "all" ? "1" : "0"} aria-pressed={!selected && deskOn === "all"} onClick={() => { setSelected(""); setDesk("all"); }}>
          <span>{v4("dskAllDesk")}</span>
          <span className="c4-dsp-count">{rows.length}</span>
        </button>
        {blankDesk > 0 && (
          <button type="button" className="c4-dsk-desk" data-wing="blank" data-on={!selected && desk === "blank" ? "1" : "0"} aria-pressed={!selected && desk === "blank"} onClick={() => { setSelected(""); setDesk(desk === "blank" ? "all" : "blank"); }}>
            <span>{v4("dskUnmarked")}</span>
            <span className="c4-dsp-count">{blankDesk}</span>
          </button>
        )}
        {deskNames.map((item) => {
          const count = desks.find((line) => line.desk === item)?.count || 0;
          return (
            <button key={item} type="button" className="c4-dsk-desk" data-wing={wingOf(item) || "blank"} data-on={!selected && desk === item ? "1" : "0"} aria-pressed={!selected && desk === item} onClick={() => { setSelected(""); setDesk(desk === item ? "all" : item); }}>
              <span>{item}</span>
              <span className="c4-dsp-count">{count}</span>
              <span>{v4("dskShare")} {deskShare(count, rows.length)}%</span>
            </button>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("dskWings")}>
        <button type="button" className="c4-chip" data-on={wingOn === "all" ? "1" : "0"} aria-pressed={wingOn === "all"} onClick={() => setWing("all")}>{v4("dskWings")}</button>
        {wings.filter((line) => line.wing).map((line) => (
          <button key={line.wing} type="button" className="c4-chip" data-on={wingOn === line.wing ? "1" : "0"} aria-pressed={wingOn === line.wing} onClick={() => setWing(wingOn === line.wing ? "all" : line.wing)}>
            {wingName(v4, line.wing)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("dskSpans")}>
        <button type="button" className="c4-chip" data-on={spanOn === "all" ? "1" : "0"} aria-pressed={spanOn === "all"} onClick={() => setSpan("all")}>{v4("dskSpans")}</button>
        {spans.filter((line) => line.span).map((line) => (
          <button key={line.span} type="button" className="c4-chip" data-on={spanOn === line.span ? "1" : "0"} aria-pressed={spanOn === line.span} onClick={() => setSpan(spanOn === line.span ? "all" : line.span)}>
            {spanName(v4, line.span)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("dskInitials")}>
        <button type="button" className="c4-chip" data-on={initialOn === "all" ? "1" : "0"} aria-pressed={initialOn === "all"} onClick={() => setInitial("all")}>{v4("dskAllInitials")}</button>
        {initials.map((line) => (
          <button key={line.initial} type="button" className="c4-chip" data-on={initialOn === line.initial ? "1" : "0"} aria-pressed={initialOn === line.initial} onClick={() => setInitial(initialOn === line.initial ? "all" : line.initial)}>
            {line.initial} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("dskShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("dskShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("dskHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("dskDesks")}>
        <button type="button" className="c4-chip" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>{v4("dskAll")}</button>
        {chips.map((item) => {
          const line = desks.find((row) => row.desk === item);
          const count = line?.count || 0;
          const share = deskShare(count, rows.length);
          return (
            <span key={item} className="c4-dsk-pair" data-wing={wingOf(item) || "blank"}>
              <button type="button" className="c4-chip" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => { setDesk("all"); setSelected(selected === item ? "" : item); }}>{item}</button>
              <span className="c4-dsp-count">{count}</span>
              <span className="c4-dsk-share">{v4("dskShare")} {share}%</span>
              <span className="c4-dsk-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleDesk(hiddenDesks, item, present), showHidden ? "" : item)}>{showHidden ? v4("dskShow") : v4("dskHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("dskSearch")}</span>
        <input className="c4-field" aria-label={v4("dskSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-dsp-empty">{v4("dskEmpty")}</p>}
      <ul className="c4-dsk-rows">
        {shown.map((row) => {
          const deskMark = assignedDesk(row.desk);
          const wingMark = wingOf(row.desk);
          const spanMark = spanOf(row.desk);
          return (
            <li key={row.id} data-wing={wingMark || "blank"} data-span={spanMark || "blank"}>
              <span className="c4-dsk-letter" aria-hidden="true">{initialOf(row.desk) || "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {deskMark || v4("dskUnmarked")}
                {" · "}
                {wingName(v4, wingMark)}
                {" · "}
                {spanName(v4, spanMark)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
