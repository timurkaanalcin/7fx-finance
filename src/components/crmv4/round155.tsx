"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DOCKET_KEY,
  DOCKET_VIEW_KEY,
  FAMILY_KEY,
  activeClerk,
  activeCloth,
  activeInitial,
  activeMark,
  activeNumber,
  activeShape,
  activeSpan,
  activeWax,
  addDocket,
  addDocketView,
  assignedFamily,
  bulkDocketFiled,
  bulkDocketPinned,
  clerkArg,
  clothArg,
  docketClashIds,
  docketClerks,
  docketCloths,
  docketCopy,
  docketGap,
  docketCounts,
  docketMarks,
  docketShare,
  docketTimeline,
  docketWaxes,
  docketsCsv,
  dropDocketView,
  editDocket,
  familyCsv,
  familyShare,
  initialArg,
  initialLines,
  initialOf,
  leadingInitial,
  leadingShape,
  markArg,
  namedInitials,
  namedShapes,
  namedSpans,
  nextDocket,
  numberArg,
  readDocketViews,
  readDockets,
  readHiddenInitials,
  resetDockets,
  ringOf,
  setDocketFiled,
  setDocketParked,
  setDocketPinned,
  shapeArg,
  shapeLines,
  shapeOf,
  spanArg,
  spanLines,
  spanOf,
  stepDocketWax,
  toggleInitial,
  visibleDockets,
  visibleFamilyCustomers,
  visibleInitials,
  watchCounts,
  watchOf,
  waxArg,
  type DocketCard,
  type DocketCloth,
  type DocketTray,
  type DocketView,
  type DocketWax,
  type FamilyRow,
} from "@/lib/crmv4/round155";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  lastName?: string | null;
};

type GlanceRow = FamilyRow & { id: string };

const WATCHES = ["dawn", "noon", "dusk", "night"] as const;

function clothName(v4: V4, cloth: DocketCloth): string {
  if (cloth === "linen") return v4("dktClothLinen");
  if (cloth === "silk") return v4("dktClothSilk");
  if (cloth === "wool") return v4("dktClothWool");
  if (cloth === "canvas") return v4("dktClothCanvas");
  return v4("dktBlankCloth");
}

function waxName(v4: V4, wax: DocketWax): string {
  if (wax === "soft") return v4("dktWaxSoft");
  if (wax === "firm") return v4("dktWaxFirm");
  if (wax === "hard") return v4("dktWaxHard");
  return v4("dktBlankWax");
}

function watchName(v4: V4, name: string): string {
  if (name === "dawn") return v4("dktDawn");
  if (name === "noon") return v4("dktNoon");
  if (name === "dusk") return v4("dktDusk");
  if (name === "night") return v4("dktNight");
  if (name === "inner") return v4("dktInner");
  if (name === "outer") return v4("dktOuter");
  if (/^(?:0?[1-9]|[1-3]\d|40)$/.test(name)) return String(Number(name));
  return v4("dktBlankNumber");
}

function spanName(v4: V4, name: string): string {
  if (name === "short") return v4("famShort");
  if (name === "mid") return v4("famMid");
  if (name === "long") return v4("famLong");
  return v4("famUnmarked");
}

function shapeName(v4: V4, name: string): string {
  if (name === "plain") return v4("famPlain");
  if (name === "joined") return v4("famJoined");
  if (name === "stacked") return v4("famStacked");
  return v4("famUnmarked");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("dktAuditSave");
  if (audit === "edit") return v4("dktAuditEdit");
  if (audit === "raise") return v4("dktAuditRaise");
  if (audit === "lower") return v4("dktAuditLower");
  if (audit === "pin") return v4("dktAuditPin");
  if (audit === "unpin") return v4("dktAuditUnpin");
  if (audit === "park") return v4("dktAuditPark");
  if (audit === "release") return v4("dktAuditRelease");
  if (audit === "file") return v4("dktAuditFile");
  if (audit === "unfile") return v4("dktAuditUnfile");
  return "";
}

function numberLabel(docket: number | null): string {
  return docket === null ? "—" : String(docket);
}

function gapLabel(v4: V4, docket: number | null, desk: string): string {
  const gap = docketGap(docket, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("dktPast")} ${gap}`;
  if (gap < 0) return `${v4("dktAhead")} ${Math.abs(gap)}`;
  return v4("dktDue");
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

function seals(wax: string): number {
  if (wax === "hard") return 3;
  if (wax === "firm") return 2;
  if (wax === "soft") return 1;
  return 0;
}

export function DocketSlips({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<DocketCard[]>([]);
  const [views, setViews] = useState<DocketView[]>([]);
  const [text, setText] = useState("");
  const [clerk, setClerk] = useState("");
  const [docket, setDocket] = useState("");
  const [cloth, setCloth] = useState("");
  const [mark, setMark] = useState("");
  const [wax, setWax] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<DocketTray>("open");
  const [clerkFilter, setClerkFilter] = useState("all");
  const [clothFilter, setClothFilter] = useState("all");
  const [markFilter, setMarkFilter] = useState("all");
  const [waxFilter, setWaxFilter] = useState("all");
  const [numberFilter, setNumberFilter] = useState("all");
  const [hardOnly, setHardOnly] = useState(false);
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
    const next = readDockets(readJson(DOCKET_KEY, []));
    const saved = readDocketViews(readJson(DOCKET_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(DOCKET_KEY, next);
    writeJson(DOCKET_VIEW_KEY, saved);
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
      if (event.key === "k" || event.key === "K") {
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
  const clerks = docketClerks(cards);
  const cloths = docketCloths(cards);
  const marks = docketMarks(cards);
  const waxes = docketWaxes(cards);
  const bars = watchCounts(cards);
  const clerkOn = activeClerk(clerkFilter, clerks);
  const clothOn = activeCloth(clothFilter, cloths);
  const markOn = activeMark(markFilter, marks);
  const waxOn = activeWax(waxFilter, waxes);
  const numberOn = activeNumber(numberFilter);
  const picked = numberArg(numberOn);
  const shown = visibleDockets(
    cards,
    tray,
    query,
    clerkArg(clerkOn),
    clothArg(clothOn),
    markArg(markOn),
    waxArg(waxOn),
    picked.exact,
    picked.band,
    hardOnly,
    lateOnly,
    desk,
  );
  const timeline = docketTimeline(cards, query);
  const counts = docketCounts(cards, desk);
  const total = cards.length;
  const nextId = nextDocket(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);

  function store(next: DocketCard[]) {
    setCards(next);
    writeJson(DOCKET_KEY, next);
  }

  function storeViews(next: DocketView[]) {
    setViews(next);
    writeJson(DOCKET_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setClerk("");
    setDocket("");
    setCloth("");
    setMark("");
    setWax("");
  }

  function copyCard(card: DocketCard) {
    const body = docketCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: DocketView) {
    setTray(view.tray);
    setQuery(view.query);
    setClerkFilter(activeClerk(view.clerk, docketClerks(cards)));
    setClothFilter(activeCloth(view.cloth, docketCloths(cards)));
    setMarkFilter(activeMark(view.mark, docketMarks(cards)));
    setWaxFilter(activeWax(view.wax, docketWaxes(cards)));
    setNumberFilter(activeNumber(view.docket));
    setBoard("cards");
    setHardOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-dkt" aria-label={v4("dktTitle")} data-dockets="1" data-role={role}>
      <header className="c4-dkt-head">
        <p className="c4-dkt-plate" data-logo="mono">{v4("dktLogo")}</p>
        <div>
          <p className="c4-dkt-kicker">{v4("dktSub")}</p>
          <h2 className="c4-title">{v4("dktTitle")}</h2>
        </div>
        <p className="c4-dkt-count">{shown.length}</p>
      </header>
      <details className="c4-dkt-rules">
        <summary>{v4("dktRules")}</summary>
        <p className="c4-meta">{v4("dktHint")}</p>
        <p className="c4-meta">{v4("dktLocal")}</p>
        <p className="c4-meta">{v4("dktBlank")}</p>
        <p className="c4-meta">{v4("dktClerkBlank")}</p>
        <p className="c4-meta">{v4("dktNumberBlank")}</p>
        <p className="c4-meta">{v4("dktClothBlank")}</p>
        <p className="c4-meta">{v4("dktMarkBlank")}</p>
        <p className="c4-meta">{v4("dktWaxBlank")}</p>
        <p className="c4-meta">{v4("dktEscape")}</p>
        <p className="c4-meta">{v4("dktSlash")}</p>
        <p className="c4-meta">{v4("dktNew")}</p>
      </details>
      {viewer ? <p className="c4-dkt-notice" role="status">{v4("dktViewer")}</p> : null}
      <p className="c4-dkt-notice" role="status">
        <span>{v4("dktNotice")}</span>
        <span className="c4-dkt-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("dktNoticeAll") : v4("dktNoticeOpen")}
        </button>
      </p>
      <section className="c4-dkt-kpi" aria-label={v4("dktKpi")}>
        {(["open", "parked", "filed", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = docketShare(count, total);
          const label = key === "open" ? v4("dktOpen") : key === "parked" ? v4("dktParked") : key === "filed" ? v4("dktFiled") : v4("dktPinned");
          return (
            <p key={key} className="c4-dkt-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("dktShare")} {share}%</span>
              <span className="c4-dkt-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-dkt-chart" aria-label={v4("dktChart")}>
        <p className="c4-dkt-kicker">{v4("dktChart")}</p>
        {WATCHES.map((name, index) => {
          const count = bars[index] || 0;
          const height = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-dkt-col" data-on={numberOn === name ? "1" : "0"} aria-pressed={numberOn === name} onClick={() => setNumberFilter(numberOn === name ? "all" : name)}>
              <span className="c4-dkt-bar" aria-hidden="true"><i style={{ height: `${height}%` }} /></span>
              <span>{watchName(v4, name)}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-dkt-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addDocket(cards, { id: `dkt-${Date.now()}`, text, clerk, docket, cloth, mark, wax });
        if (next === cards || next.length === cards.length) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("dktText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("dktText")} value={text} disabled={viewer} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("dktClerk")}</span>
          <input className="c4-field" aria-label={v4("dktClerk")} value={clerk} disabled={viewer} onChange={(event) => setClerk(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("dktNumber")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("dktNumber")} value={docket} disabled={viewer} onChange={(event) => setDocket(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("dktCloth")}</span>
          <select className="c4-select" aria-label={v4("dktCloth")} value={cloth} disabled={viewer} onChange={(event) => setCloth(event.target.value)}>
            <option value="">{v4("dktBlankCloth")}</option>
            <option value="linen">{v4("dktClothLinen")}</option>
            <option value="silk">{v4("dktClothSilk")}</option>
            <option value="wool">{v4("dktClothWool")}</option>
            <option value="canvas">{v4("dktClothCanvas")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("dktMark")}</span>
          <input className="c4-field" aria-label={v4("dktMark")} value={mark} disabled={viewer} onChange={(event) => setMark(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("dktWax")}</span>
          <select className="c4-select" aria-label={v4("dktWax")} value={wax} disabled={viewer} onChange={(event) => setWax(event.target.value)}>
            <option value="">{v4("dktBlankWax")}</option>
            <option value="soft">{v4("dktWaxSoft")}</option>
            <option value="firm">{v4("dktWaxFirm")}</option>
            <option value="hard">{v4("dktWaxHard")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("dktAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("dktTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("dktOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "parked" ? "1" : "0"} aria-pressed={tray === "parked"} onClick={() => setTray("parked")}>{v4("dktParked")}</button>
        <button type="button" className="c4-chip" data-on={tray === "filed" ? "1" : "0"} aria-pressed={tray === "filed"} onClick={() => setTray("filed")}>{v4("dktFiled")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("dktTimeline")}</button>
        <button type="button" className="c4-chip" data-on={hardOnly ? "1" : "0"} aria-pressed={hardOnly} onClick={() => setHardOnly((value) => !value)}>{v4("dktHard")}</button>
        <button type="button" className="c4-btn" onClick={() => download("docket-slips.csv", docketsCsv(cards, desk))}>{v4("dktCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkDocketPinned(cards, shown.map((card) => card.id), true))}>{v4("dktBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkDocketFiled(cards, shown.map((card) => card.id), true))}>{v4("dktBulkFile")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetDockets()); setEditing(""); }}>{v4("dktReset")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("dktNumbers")}>
        <button type="button" className="c4-chip" data-on={numberOn === "all" ? "1" : "0"} aria-pressed={numberOn === "all"} onClick={() => setNumberFilter("all")}>{v4("dktAllNumbers")}</button>
        <button type="button" className="c4-chip" data-on={numberOn === "blank" ? "1" : "0"} aria-pressed={numberOn === "blank"} onClick={() => setNumberFilter("blank")}>{v4("dktBlankNumber")}</button>
        <button type="button" className="c4-chip" data-on={numberOn === "inner" ? "1" : "0"} aria-pressed={numberOn === "inner"} onClick={() => setNumberFilter("inner")}>{v4("dktInner")}</button>
        <button type="button" className="c4-chip" data-on={numberOn === "outer" ? "1" : "0"} aria-pressed={numberOn === "outer"} onClick={() => setNumberFilter("outer")}>{v4("dktOuter")}</button>
        {["1", "11", "21", "31"].map((slot) => (
          <button key={slot} type="button" className="c4-chip" data-on={numberOn === slot ? "1" : "0"} aria-pressed={numberOn === slot} onClick={() => setNumberFilter(numberOn === slot ? "all" : slot)}>{slot}</button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("dktSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("dktSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-dkt-next">
        <label className="c4-lab">
          <span>{v4("dktDesk")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("dktDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <p className="c4-meta">
          <span>{v4("dktNext")}</span>
          {" "}
          {nextCard ? nextCard.text : v4("dktNextEmpty")}
        </p>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("dktClerks")}</span>
          <select className="c4-select" aria-label={v4("dktClerks")} value={clerkOn} onChange={(event) => setClerkFilter(event.target.value)}>
            <option value="all">{v4("dktAllClerks")}</option>
            <option value="blank">{v4("dktBlankClerk")}</option>
            {clerks.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("dktCloths")}</span>
          <select className="c4-select" aria-label={v4("dktCloths")} value={clothOn} onChange={(event) => setClothFilter(event.target.value)}>
            <option value="all">{v4("dktAllCloths")}</option>
            <option value="blank">{v4("dktBlankCloth")}</option>
            {cloths.map((item) => <option key={item} value={item}>{clothName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("dktMarks")}</span>
          <select className="c4-select" aria-label={v4("dktMarks")} value={markOn} onChange={(event) => setMarkFilter(event.target.value)}>
            <option value="all">{v4("dktAllMarks")}</option>
            <option value="blank">{v4("dktBlankMark")}</option>
            {marks.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("dktWaxes")}</span>
          <select className="c4-select" aria-label={v4("dktWaxes")} value={waxOn} onChange={(event) => setWaxFilter(event.target.value)}>
            <option value="all">{v4("dktAllWaxes")}</option>
            <option value="blank">{v4("dktBlankWax")}</option>
            {waxes.map((item) => <option key={item} value={item}>{waxName(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <form className="c4-dkt-view" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addDocketView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          clerk: clerkOn,
          cloth: clothOn,
          mark: markOn,
          wax: waxOn,
          docket: numberOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("dktViewName")}</span>
          <input className="c4-field" aria-label={v4("dktViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("dktSaveView")}</button>
      </form>
      <section aria-label={v4("dktViews")}>
        <p className="c4-dkt-kicker">{v4("dktViews")}</p>
        {!views.length && <p className="c4-dkt-empty">{v4("dktViewEmpty")}</p>}
        <ul className="c4-dkt-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropDocketView(views, view.id))}>{v4("dktDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-dkt-empty">{v4("dktEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-dkt-rows">
          {shown.map((card) => {
            const clashes = docketClashIds(cards, card.id);
            const gap = gapLabel(v4, card.docket, desk);
            const ring = ringOf(card.docket);
            const editingCard = editing === card.id;
            return (
              <li key={card.id} data-wax={card.wax || "blank"} data-cloth={card.cloth || "blank"} data-watch={watchOf(card.docket)}>
                <span className="c4-dkt-folio" aria-hidden="true">{numberLabel(card.docket)}</span>
                <span className="c4-dkt-seals" aria-hidden="true">
                  {[0, 1, 2].map((index) => <i key={index} data-on={index < seals(card.wax) ? "1" : "0"} />)}
                </span>
                <div>
                  {editingCard ? (
                    <form className="c4-row" onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editDocket(cards, card.id, draft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("dktEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("dktSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-meta">
                    {card.clerk || v4("dktBlankClerk")}
                    {" · "}
                    {numberLabel(card.docket)}
                    {" · "}
                    {clothName(v4, clothOfCard(card.cloth))}
                    {" · "}
                    {card.mark || v4("dktBlankMark")}
                    {" · "}
                    {waxName(v4, waxOfCard(card.wax))}
                    {ring === "blank" ? "" : ` · ${ring === "inner" ? v4("dktInner") : v4("dktOuter")}`}
                    {gap ? ` · ${gap}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("dktAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashes.length ? `${v4("dktClash")} ${clashes.length}` : v4("dktClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("dktCopied") : v4("dktCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("dktEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepDocketWax(cards, card.id, 1))}>{v4("dktRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepDocketWax(cards, card.id, -1))}>{v4("dktLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setDocketPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("dktUnpin") : v4("dktPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.parked} onClick={() => store(setDocketParked(cards, card.id, !card.parked))}>{card.parked ? v4("dktRelease") : v4("dktPark")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.filed} onClick={() => store(setDocketFiled(cards, card.id, !card.filed))}>{card.filed ? v4("dktUnfile") : v4("dktFile")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-dkt-time">
          {timeline.map((card) => (
            <li key={card.id} data-watch={watchOf(card.docket)}>
              <span className="c4-dkt-clock">{numberLabel(card.docket)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function clothOfCard(cloth: string): DocketCloth {
  if (cloth === "linen" || cloth === "silk" || cloth === "wool" || cloth === "canvas") return cloth;
  return "blank";
}

function waxOfCard(wax: string): DocketWax {
  if (wax === "soft" || wax === "firm" || wax === "hard") return wax;
  return "blank";
}

export function FamilyNames({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenInitials, setHiddenInitials] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [initial, setInitial] = useState("all");
  const [span, setSpan] = useState("all");
  const [shape, setShape] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      family: row.lastName,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const initials = initialLines(rows);
  const spans = spanLines(rows);
  const shapes = shapeLines(rows);
  const present = namedInitials(rows);
  const presentKey = present.join("\n");
  const initialNames = namedInitials(rows);
  const spanNames = namedSpans(rows);
  const shapeNames = namedShapes(rows);
  const blankInitial = initials.find((line) => !line.initial)?.count || 0;
  const leadInitial = leadingInitial(rows);
  const leadShape = leadingShape(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenInitials(readJson(FAMILY_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenInitials(next);
    writeJson(FAMILY_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleInitials(present, hiddenInitials, showHidden);
  const initialOn = activeInitial(selected || initial, selected ? chips : initialNames);
  const spanOn = activeSpan(span, spanNames);
  const shapeOn = activeShape(shape, shapeNames);
  const shown = visibleFamilyCustomers(
    rows,
    selected ? initialArg(activeInitial(selected, chips)) : initialArg(activeInitial(initial, initialNames)),
    shapeArg(shapeOn),
    spanArg(spanOn),
    query,
  );
  const widest = Math.max(1, ...initials.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenInitials(next);
    writeJson(FAMILY_KEY, next);
    if (clear && activeInitial(selected, [clear]) === clear) setSelected("");
  }

  return (
    <section className="c4-fam" aria-label={v4("famTitle")} data-family="1">
      <header className="c4-fam-head">
        <div>
          <p className="c4-dkt-kicker">{v4("famSub")}</p>
          <h2 className="c4-title">{v4("famTitle")}</h2>
        </div>
        <p className="c4-dkt-count">{v4("famRows")} {rows.length}</p>
      </header>
      <details className="c4-dkt-rules">
        <summary>{v4("famRules")}</summary>
        <p className="c4-meta">{v4("famHint")}</p>
        <p className="c4-meta">{v4("famLocal")}</p>
        <p className="c4-meta">{v4("famEscape")}</p>
      </details>
      {leadInitial ? <p className="c4-fam-lead"><span>{v4("famLeadInitial")}</span> {leadInitial}</p> : null}
      {leadShape ? <p className="c4-fam-lead"><span>{v4("famLeadShape")}</span> {shapeName(v4, leadShape)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("famBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("family-names.csv", familyCsv(rows))}>{v4("famCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("famLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("famFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-dkt-empty">{v4("famNone")}</p>}
      {initials.length > 0 && (
        <section className="c4-fam-chart" aria-label={v4("famAllInitial")}>
          {initials.map((line) => {
            const share = familyShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.initial || "blank";
            return (
              <p key={name} className="c4-fam-col" data-span={line.initial ? "initial" : "blank"}>
                <span className="c4-fam-mark">{line.initial || "—"}</span>
                <span>{line.initial || v4("famUnmarked")}</span>
                <span className="c4-dkt-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("famShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-fam-initials" role="group" aria-label={v4("famAllInitial")}>
        <button type="button" className="c4-fam-initial" data-on={!selected && initialOn === "all" ? "1" : "0"} aria-pressed={!selected && initialOn === "all"} onClick={() => { setSelected(""); setInitial("all"); }}>
          <span>{v4("famAllInitial")}</span>
          <span className="c4-dkt-count">{rows.length}</span>
        </button>
        {blankInitial > 0 && (
          <button type="button" className="c4-fam-initial" data-on={!selected && initial === "blank" ? "1" : "0"} aria-pressed={!selected && initial === "blank"} onClick={() => { setSelected(""); setInitial(initial === "blank" ? "all" : "blank"); }}>
            <span>{v4("famUnmarked")}</span>
            <span className="c4-dkt-count">{blankInitial}</span>
          </button>
        )}
        {initialNames.map((item) => {
          const count = initials.find((line) => line.initial === item)?.count || 0;
          return (
            <button key={item} type="button" className="c4-fam-initial" data-on={!selected && initial === item ? "1" : "0"} aria-pressed={!selected && initial === item} onClick={() => { setSelected(""); setInitial(initial === item ? "all" : item); }}>
              <span className="c4-fam-mark">{item}</span>
              <span className="c4-dkt-count">{count}</span>
              <span>{v4("famShare")} {familyShare(count, rows.length)}%</span>
            </button>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("famSpans")}>
        <button type="button" className="c4-chip" data-on={spanOn === "all" ? "1" : "0"} aria-pressed={spanOn === "all"} onClick={() => setSpan("all")}>{v4("famSpans")}</button>
        {spans.filter((line) => line.span).map((line) => (
          <button key={line.span} type="button" className="c4-chip" data-on={spanOn === line.span ? "1" : "0"} aria-pressed={spanOn === line.span} onClick={() => setSpan(spanOn === line.span ? "all" : line.span)}>
            {spanName(v4, line.span)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("famShapes")}>
        <button type="button" className="c4-chip" data-on={shapeOn === "all" ? "1" : "0"} aria-pressed={shapeOn === "all"} onClick={() => setShape("all")}>{v4("famAllShapes")}</button>
        {shapes.filter((line) => line.shape).map((line) => (
          <button key={line.shape} type="button" className="c4-chip" data-on={shapeOn === line.shape ? "1" : "0"} aria-pressed={shapeOn === line.shape} onClick={() => setShape(shapeOn === line.shape ? "all" : line.shape)}>
            {shapeName(v4, line.shape)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("famShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("famShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("famHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("famInitials")}>
        <button type="button" className="c4-chip" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>{v4("famAll")}</button>
        {chips.map((item) => {
          const line = initials.find((row) => row.initial === item);
          const count = line?.count || 0;
          const share = familyShare(count, rows.length);
          return (
            <span key={item} className="c4-fam-pair">
              <button type="button" className="c4-chip" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => { setInitial("all"); setSelected(selected === item ? "" : item); }}>{item}</button>
              <span className="c4-dkt-count">{count}</span>
              <span className="c4-fam-share">{v4("famShare")} {share}%</span>
              <span className="c4-dkt-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleInitial(hiddenInitials, item, present), showHidden ? "" : item)}>{showHidden ? v4("famShow") : v4("famHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("famSearch")}</span>
        <input className="c4-field" aria-label={v4("famSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-dkt-empty">{v4("famEmpty")}</p>}
      <ul className="c4-fam-rows">
        {shown.map((row) => {
          const family = assignedFamily(row.family);
          const initialMark = initialOf(row.family);
          const spanMark = spanOf(row.family);
          const shapeMark = shapeOf(row.family);
          return (
            <li key={row.id} data-span={spanMark || "blank"} data-shape={shapeMark || "blank"}>
              <span className="c4-fam-face" aria-hidden="true">{initialMark || "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {family || v4("famUnmarked")}
                {" · "}
                {spanName(v4, spanMark)}
                {" · "}
                {shapeName(v4, shapeMark)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
