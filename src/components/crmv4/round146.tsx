"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  FOLIO_KEY,
  FOLIO_VIEW_KEY,
  NATAL_KEY,
  activeBand,
  activeDay,
  activeDecade,
  activeFinish,
  activeGeneration,
  activeKeeper,
  activeMonth,
  activeSeason,
  activeSeal,
  activeWing,
  addFolio,
  addFolioView,
  bandArg,
  bandLines,
  bandOf,
  bulkFolioDone,
  bulkFolioPinned,
  dayArg,
  dayBand,
  dayGap,
  dayQuarterCounts,
  decadeArg,
  decadeLines,
  decadeOf,
  dropFolioView,
  editFolio,
  finishArg,
  finishOf,
  folioClashIds,
  folioCopy,
  folioCounts,
  folioFinishes,
  folioKeepers,
  folioSeals,
  folioShare,
  folioTimeline,
  folioWings,
  foliosCsv,
  generationArg,
  generationLines,
  generationOf,
  keeperArg,
  leadingBand,
  leadingDecade,
  leadingGeneration,
  leadingMonth,
  leadingSeason,
  namedBands,
  namedDecades,
  namedGenerations,
  namedMonths,
  namedSeasons,
  natalLines,
  natalShare,
  natalText,
  natalsCsv,
  nextFolio,
  readFolioViews,
  readFolios,
  readHiddenMonths,
  resetFolios,
  sealArg,
  seasonArg,
  seasonLines,
  seasonOf,
  setFolioDone,
  setFolioHeld,
  setFolioPinned,
  stepFolioFinish,
  toggleMonth,
  visibleFolios,
  visibleMonths,
  visibleNatalCustomers,
  wingArg,
  wingOf,
  type Folio,
  type FolioFinish,
  type FolioTray,
  type FolioView,
  type FolioWing,
  type NatalBand,
  type NatalGeneration,
  type NatalRow,
  type NatalSeason,
} from "@/lib/crmv4/round146";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  birthDate?: string | null;
};

type GlanceRow = NatalRow & { id: string };

const QUARTERS = ["q1", "q2", "q3", "q4"] as const;

function wingName(v4: V4, wing: FolioWing): string {
  if (wing === "desk") return v4("folWingDesk");
  if (wing === "floor") return v4("folWingFloor");
  if (wing === "line") return v4("folWingLine");
  if (wing === "field") return v4("folWingField");
  return v4("folBlankWing");
}

function finishName(v4: V4, finish: FolioFinish): string {
  if (finish === "ivory") return v4("folFinishIvory");
  if (finish === "ink") return v4("folFinishInk");
  if (finish === "champagne") return v4("folFinishChampagne");
  return v4("folBlankFinish");
}

function bandName(v4: V4, name: string): string {
  if (name === "young") return v4("ntlYoung");
  if (name === "settled") return v4("ntlSettled");
  if (name === "senior") return v4("ntlSenior");
  return v4("ntlBlankBand");
}

function seasonName(v4: V4, name: string): string {
  if (name === "winter") return v4("ntlWinter");
  if (name === "spring") return v4("ntlSpring");
  if (name === "summer") return v4("ntlSummer");
  if (name === "autumn") return v4("ntlAutumn");
  return v4("ntlBlankSeason");
}

function generationName(v4: V4, name: string): string {
  if (name === "silent") return v4("ntlSilent");
  if (name === "boom") return v4("ntlBoom");
  if (name === "genx") return v4("ntlGenx");
  if (name === "millennial") return v4("ntlMillennial");
  if (name === "genz") return v4("ntlGenz");
  return v4("ntlBlankGeneration");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("folAuditSave");
  if (audit === "edit") return v4("folAuditEdit");
  if (audit === "raise") return v4("folAuditRaise");
  if (audit === "lower") return v4("folAuditLower");
  if (audit === "pin") return v4("folAuditPin");
  if (audit === "unpin") return v4("folAuditUnpin");
  if (audit === "hold") return v4("folAuditHold");
  if (audit === "release") return v4("folAuditRelease");
  if (audit === "done") return v4("folAuditDone");
  if (audit === "reopen") return v4("folAuditReopen");
  return "";
}

function quarterLabel(index: number): string {
  if (index === 0) return "1–7";
  if (index === 1) return "8–14";
  if (index === 2) return "15–21";
  return "22–31";
}

function dayLabel(day: number | null): string {
  return day === null ? "—" : String(day);
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

export function FolioSlips({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Folio[]>([]);
  const [views, setViews] = useState<FolioView[]>([]);
  const [text, setText] = useState("");
  const [keeper, setKeeper] = useState("");
  const [day, setDay] = useState("");
  const [wing, setWing] = useState("");
  const [seal, setSeal] = useState("");
  const [finish, setFinish] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<FolioTray>("open");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [wingFilter, setWingFilter] = useState("all");
  const [sealFilter, setSealFilter] = useState("all");
  const [finishFilter, setFinishFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [champagneOnly, setChampagneOnly] = useState(false);
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
    const next = readFolios(readJson(FOLIO_KEY, []));
    const saved = readFolioViews(readJson(FOLIO_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(FOLIO_KEY, next);
    writeJson(FOLIO_VIEW_KEY, saved);
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
  const keepers = folioKeepers(cards);
  const wings = folioWings(cards);
  const seals = folioSeals(cards);
  const finishes = folioFinishes(cards);
  const quarters = dayQuarterCounts(cards);
  const keeperOn = activeKeeper(keeperFilter, keepers);
  const wingOn = activeWing(wingFilter, wings);
  const sealOn = activeSeal(sealFilter, seals);
  const finishOn = activeFinish(finishFilter, finishes);
  const dayOn = activeDay(dayFilter);
  const picked = dayArg(dayOn);
  const shown = visibleFolios(
    cards,
    tray,
    query,
    keeperArg(keeperOn),
    wingArg(wingOn),
    sealArg(sealOn),
    finishArg(finishOn),
    picked.exact,
    picked.band,
    champagneOnly,
    lateOnly,
    desk,
  );
  const timeline = folioTimeline(cards, query);
  const counts = folioCounts(cards, desk);
  const total = cards.length;
  const nextId = nextFolio(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const tallest = Math.max(1, ...quarters);

  function store(next: Folio[]) {
    setCards(next);
    writeJson(FOLIO_KEY, next);
  }

  function storeViews(next: FolioView[]) {
    setViews(next);
    writeJson(FOLIO_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setKeeper("");
    setDay("");
    setWing("");
    setSeal("");
    setFinish("");
  }

  function copyCard(card: Folio) {
    const body = folioCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: FolioView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(activeKeeper(view.keeper, folioKeepers(cards)));
    setWingFilter(activeWing(view.wing, folioWings(cards)));
    setSealFilter(activeSeal(view.seal, folioSeals(cards)));
    setFinishFilter(activeFinish(view.finish, folioFinishes(cards)));
    setDayFilter(activeDay(view.day));
    setBoard("cards");
    setChampagneOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-fol" aria-label={v4("folTitle")} data-folio="1" data-role={role} data-folio-ledger="1">
      <header className="c4-fol-head">
        <p className="c4-fol-plate" data-logo="mono">{v4("folLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("folSub")}</p>
          <h2 className="c4-title">{v4("folTitle")}</h2>
        </div>
        <p className="c4-fol-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("folHint")}</p>
      <p className="c4-meta">{v4("folLocal")}</p>
      <p className="c4-meta">{v4("folBlank")}</p>
      <p className="c4-meta">{v4("folKeeperBlank")}</p>
      <p className="c4-meta">{v4("folDayBlank")}</p>
      <p className="c4-meta">{v4("folWingBlank")}</p>
      <p className="c4-meta">{v4("folSealBlank")}</p>
      <p className="c4-meta">{v4("folFinishBlank")}</p>
      <p className="c4-meta">{v4("folEscape")}</p>
      <p className="c4-meta">{v4("folSlash")}</p>
      <p className="c4-meta">{v4("folNew")}</p>
      {viewer ? <p className="c4-fol-notice" role="status">{v4("folViewer")}</p> : null}
      <p className="c4-fol-notice" role="status">
        <span>{v4("folNotice")}</span>
        <span className="c4-fol-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("folNoticeAll") : v4("folNoticeOpen")}
        </button>
      </p>
      <section className="c4-fol-kpi" aria-label={v4("folKpi")}>
        <p className="c4-pay-kicker">{v4("folKpi")}</p>
        {(["open", "held", "done", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = folioShare(count, total);
          const label = key === "open" ? v4("folOpen") : key === "held" ? v4("folHeld") : key === "done" ? v4("folDoneTray") : v4("folPinned");
          return (
            <p key={key} className="c4-fol-meter" data-tray={key}>
              <span>{label}</span>
              <span>{count}</span>
              <span>{v4("folShare")} {share}%</span>
              <span className="c4-fol-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-fol-chart" aria-label={v4("folChart")}>
        {quarters.map((count, index) => {
          const code = QUARTERS[index];
          const on = dayOn === code;
          const height = Math.max(8, Math.round((count / tallest) * 100));
          return (
            <button
              key={code}
              type="button"
              className="c4-fol-band"
              data-on={on ? "1" : "0"}
              data-filled={count ? "1" : "0"}
              aria-pressed={on}
              onClick={() => setDayFilter(on ? "all" : code)}
            >
              <span className="c4-fol-bar" aria-hidden="true"><i style={{ height: `${height}%` }} /></span>
              <span>{quarterLabel(index)}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-fol-next" onSubmit={(event) => event.preventDefault()}>
        <label className="c4-lab">
          <span>{v4("folDeskDay")}</span>
          <input className="c4-field" aria-label={v4("folDeskDay")} value={desk} inputMode="numeric" maxLength={2} onChange={(event) => setDesk(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setDesk("");
          }} />
        </label>
        <p className="c4-fol-next-line">
          <span>{v4("folNext")}</span>
          {nextCard ? <strong>{dayLabel(nextCard.day)} {nextCard.text}</strong> : <span>{dayArg(desk).exact !== null ? v4("folNextEmpty") : "—"}</span>}
        </p>
      </form>
      <form className="c4-fol-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addFolio(cards, { id: `fol-${Date.now().toString(36)}`, text, keeper, day, wing, seal, finish });
        if (next.length === cards.length) return;
        store(next);
        clearDraft();
      }} onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("folText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("folText")} aria-keyshortcuts="A" value={text} maxLength={96} disabled={viewer} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("folKeeper")}</span>
          <input className="c4-field" aria-label={v4("folKeeper")} value={keeper} maxLength={20} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("folDay")}</span>
          <input className="c4-field" aria-label={v4("folDay")} value={day} inputMode="numeric" maxLength={2} disabled={viewer} onChange={(event) => setDay(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("folWing")}</span>
          <input className="c4-field" aria-label={v4("folWing")} value={wing} maxLength={8} disabled={viewer} onChange={(event) => setWing(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("folSeal")}</span>
          <input className="c4-field" aria-label={v4("folSeal")} value={seal} maxLength={14} disabled={viewer} onChange={(event) => setSeal(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("folFinish")}</span>
          <input className="c4-field" aria-label={v4("folFinish")} value={finish} maxLength={10} disabled={viewer} onChange={(event) => setFinish(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("folAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("folTitle")}>
        {(["open", "held", "done"] as const).map((key) => (
          <button key={key} type="button" className="c4-chip" data-on={tray === key ? "1" : "0"} aria-pressed={tray === key} onClick={() => { setTray(key); setBoard("cards"); if (key !== "open") setLateOnly(false); }}>
            {key === "open" ? v4("folOpen") : key === "held" ? v4("folHeld") : v4("folDoneTray")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard((value) => value === "timeline" ? "cards" : "timeline")}>{v4("folTimeline")}</button>
        <button type="button" className="c4-chip" data-on={champagneOnly ? "1" : "0"} aria-pressed={champagneOnly} onClick={() => setChampagneOnly((value) => !value)}>{v4("folChampagne")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("folSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("folSearch")} aria-keyshortcuts="/" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("folKeepers")}>
        <button type="button" className="c4-chip" data-on={keeperOn === "all" ? "1" : "0"} aria-pressed={keeperOn === "all"} onClick={() => setKeeperFilter("all")}>{v4("folAllKeepers")}</button>
        <button type="button" className="c4-chip" data-on={keeperOn === "blank" ? "1" : "0"} aria-pressed={keeperOn === "blank"} onClick={() => setKeeperFilter(keeperOn === "blank" ? "all" : "blank")}>{v4("folBlankKeeper")}</button>
        {keepers.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={keeperOn === item ? "1" : "0"} aria-pressed={keeperOn === item} onClick={() => setKeeperFilter(keeperOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("folWings")}>
        <button type="button" className="c4-chip" data-on={wingOn === "all" ? "1" : "0"} aria-pressed={wingOn === "all"} onClick={() => setWingFilter("all")}>{v4("folAllWings")}</button>
        <button type="button" className="c4-chip" data-on={wingOn === "blank" ? "1" : "0"} aria-pressed={wingOn === "blank"} onClick={() => setWingFilter(wingOn === "blank" ? "all" : "blank")}>{v4("folBlankWing")}</button>
        {wings.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={wingOn === item ? "1" : "0"} aria-pressed={wingOn === item} onClick={() => setWingFilter(wingOn === item ? "all" : item)}>{wingName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("folSeals")}>
        <button type="button" className="c4-chip" data-on={sealOn === "all" ? "1" : "0"} aria-pressed={sealOn === "all"} onClick={() => setSealFilter("all")}>{v4("folAllSeals")}</button>
        <button type="button" className="c4-chip" data-on={sealOn === "blank" ? "1" : "0"} aria-pressed={sealOn === "blank"} onClick={() => setSealFilter(sealOn === "blank" ? "all" : "blank")}>{v4("folBlankSeal")}</button>
        {seals.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={sealOn === item ? "1" : "0"} aria-pressed={sealOn === item} onClick={() => setSealFilter(sealOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("folFinishes")}>
        <button type="button" className="c4-chip" data-on={finishOn === "all" ? "1" : "0"} aria-pressed={finishOn === "all"} onClick={() => setFinishFilter("all")}>{v4("folAllFinishes")}</button>
        <button type="button" className="c4-chip" data-on={finishOn === "blank" ? "1" : "0"} aria-pressed={finishOn === "blank"} onClick={() => setFinishFilter(finishOn === "blank" ? "all" : "blank")}>{v4("folBlankFinish")}</button>
        {finishes.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={finishOn === item ? "1" : "0"} aria-pressed={finishOn === item} onClick={() => setFinishFilter(finishOn === item ? "all" : item)}>{finishName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("folDays")}>
        {(["all", "blank", "opening", "hinge", "close"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={dayOn === item ? "1" : "0"} aria-pressed={dayOn === item} onClick={() => setDayFilter(item)}>
            {item === "all" ? v4("folAllDays") : item === "blank" ? v4("folBlankDay") : item === "opening" ? v4("folOpening") : item === "hinge" ? v4("folHinge") : v4("folClose")}
          </button>
        ))}
      </div>
      <form className="c4-fol-view" onSubmit={(event) => {
        event.preventDefault();
        const next = addFolioView(views, {
          id: `view-${Date.now().toString(36)}`,
          name: viewName,
          tray,
          query,
          keeper: keeperOn,
          wing: wingOn,
          seal: sealOn,
          finish: finishOn,
          day: dayOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("folViewName")}</span>
          <input className="c4-field" aria-label={v4("folViewName")} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("folSaveView")}</button>
      </form>
      <section aria-label={v4("folViews")}>
        <p className="c4-pay-kicker">{v4("folViews")}</p>
        {!views.length && <p className="c4-meta">{v4("folViewEmpty")}</p>}
        <ul className="c4-fol-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" onClick={() => storeViews(dropFolioView(views, view.id))}>{v4("folDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      <p className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkFolioPinned(cards, shown.map((card) => card.id), true))}>{v4("folBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkFolioDone(cards, shown.map((card) => card.id), true))}>{v4("folBulkDone")}</button>
        <button type="button" className="c4-btn" onClick={() => download("folio-slips.csv", foliosCsv(cards, desk))}>{v4("folCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetFolios())}>{v4("folReset")}</button>
      </p>
      {board === "cards" && !shown.length && <p className="c4-fol-empty">{v4("folEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-fol-rows">
          {shown.map((card) => {
            const band = dayBand(card.day);
            const clashes = folioClashIds(cards, card.id);
            const gap = dayGap(card.day, desk);
            const wingLabel = wingOf(card.wing);
            const finishLabel = finishOf(card.finish);
            return (
              <li key={card.id} data-band={band} data-wing={wingLabel} data-finish={finishLabel} data-late={gap !== null && gap > 0 && !card.held && !card.done ? "1" : "0"}>
                <span className="c4-fol-day">{dayLabel(card.day)}</span>
                <div>
                  <p className="c4-fol-pips" aria-label={v4("folFinish")}>
                    {(["ivory", "ink", "champagne"] as const).map((pip) => <i key={pip} data-on={finishLabel === pip || (pip === "ivory" && finishLabel === "ink") || (pip !== "champagne" && finishLabel === "champagne") ? "1" : "0"} />)}
                  </p>
                  {editing === card.id ? (
                    <form onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editFolio(cards, card.id, draft));
                      setEditing("");
                      setDraft("");
                    }}>
                      <label className="c4-lab">
                        <span>{v4("folEdit")}</span>
                        <input className="c4-field" aria-label={v4("folEdit")} value={draft} maxLength={96} disabled={viewer} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
                          if (event.key !== "Escape") return;
                          event.preventDefault();
                          setEditing("");
                          setDraft("");
                        }} />
                      </label>
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("folSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-fol-wing">{wingName(v4, wingLabel)}</p>
                  <p className="c4-fol-finish">{finishName(v4, finishLabel)}</p>
                  {card.keeper ? <p className="c4-fol-keeper">{v4("folAssign")} {card.keeper}</p> : null}
                  {card.seal ? <p className="c4-fol-seal">{card.seal}</p> : null}
                  {gap !== null ? <p className="c4-meta">{gap > 0 ? v4("folLate") : gap < 0 ? v4("folAhead") : v4("folNow")} {gap === 0 ? "" : Math.abs(gap)}</p> : null}
                  <p className="c4-meta">{clashes.length ? `${v4("folClash")} ${clashes.length}` : v4("folClashNone")}</p>
                  {card.audit ? <p className="c4-meta">{v4("folAudit")} {auditName(v4, card.audit)}</p> : null}
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("folCopied") : v4("folCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("folEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepFolioFinish(cards, card.id, 1))}>{v4("folRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepFolioFinish(cards, card.id, -1))}>{v4("folLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setFolioPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("folUnpin") : v4("folPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.held} onClick={() => store(setFolioHeld(cards, card.id, !card.held))}>{card.held ? v4("folRelease") : v4("folHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.done} onClick={() => store(setFolioDone(cards, card.id, !card.done))}>{card.done ? v4("folReopen") : v4("folDone")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-fol-time">
          {timeline.map((card) => (
            <li key={card.id} data-band={dayBand(card.day)}>
              <span className="c4-fol-clock">{dayLabel(card.day)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function NatalMonths({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const asOf = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [hiddenMonths, setHiddenMonths] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [band, setBand] = useState("all");
  const [season, setSeason] = useState("all");
  const [decade, setDecade] = useState("all");
  const [generation, setGeneration] = useState("all");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || row.email || "").trim(),
      born: row.birthDate,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = natalLines(rows, asOf);
  const bands = bandLines(rows, asOf);
  const seasons = seasonLines(rows);
  const decades = decadeLines(rows);
  const generations = generationLines(rows);
  const present = namedMonths(rows);
  const presentKey = present.join("\n");
  const bandNames = namedBands(rows, asOf);
  const seasonNames = namedSeasons(rows);
  const decadeNames = namedDecades(rows);
  const generationNames = namedGenerations(rows);
  const blankCount = lines.find((line) => !line.mark)?.count || 0;
  const blankDecade = decades.find((line) => !line.decade)?.count || 0;
  const lead = leadingMonth(rows);
  const leadBand = leadingBand(rows, asOf);
  const leadSeason = leadingSeason(rows);
  const leadDecade = leadingDecade(rows);
  const leadGeneration = leadingGeneration(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenMonths(readJson(NATAL_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenMonths(next);
    writeJson(NATAL_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleMonths(present, hiddenMonths, showHidden);
  const mark = activeMonth(selected, chips);
  const bandOn = activeBand(band, bandNames);
  const seasonOn = activeSeason(season, seasonNames);
  const decadeOn = activeDecade(decade, decadeNames);
  const generationOn = activeGeneration(generation, generationNames);
  const shown = visibleNatalCustomers(rows, mark, blank, bandArg(bandOn), seasonArg(seasonOn), decadeArg(decadeOn), generationArg(generationOn), query, asOf);
  const widest = Math.max(1, ...generations.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenMonths(next);
    writeJson(NATAL_KEY, next);
    if (clear && activeMonth(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-ntl" aria-label={v4("ntlTitle")} data-natal="1" data-folio-ledger="1">
      <header className="c4-ntl-head">
        <div>
          <p className="c4-pay-kicker">{v4("ntlSub")}</p>
          <h2 className="c4-title">{v4("ntlTitle")}</h2>
        </div>
        <p className="c4-fol-count">{v4("ntlRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("ntlHint")}</p>
      <p className="c4-meta">{v4("ntlLocal")}</p>
      <p className="c4-meta">{v4("ntlEscape")}</p>
      {lead ? <p className="c4-ntl-lead"><span>{v4("ntlLead")}</span> {lead}</p> : null}
      {leadBand ? <p className="c4-ntl-lead"><span>{v4("ntlLeadBand")}</span> {bandName(v4, leadBand)}</p> : null}
      {leadSeason ? <p className="c4-ntl-lead"><span>{v4("ntlLeadSeason")}</span> {seasonName(v4, leadSeason)}</p> : null}
      {leadDecade ? <p className="c4-ntl-lead"><span>{v4("ntlLeadDecade")}</span> {leadDecade}</p> : null}
      {leadGeneration ? <p className="c4-ntl-lead"><span>{v4("ntlLeadGeneration")}</span> {generationName(v4, leadGeneration)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("ntlBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("natal-months.csv", natalsCsv(rows, asOf))}>{v4("ntlCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("ntlLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("ntlFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-fol-empty">{v4("ntlNone")}</p>}
      {generations.length > 0 && (
        <section className="c4-ntl-chart" aria-label={v4("ntlGenerations")}>
          {generations.map((line) => {
            const share = natalShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.generation || "blank";
            return (
              <p key={name} className="c4-ntl-col" data-generation={name}>
                <span>{generationName(v4, line.generation)}</span>
                <span className="c4-ntl-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("ntlShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      {blankCount > 0 && (
        <button type="button" className="c4-ntl-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); setBand("all"); setSeason("all"); setDecade("all"); setGeneration("all"); }}>
          <span>{v4("ntlBlank")}</span>
          <span className="c4-fol-count">{blankCount}</span>
          <span className="c4-ntl-track" aria-hidden="true"><i style={{ width: `${natalShare(blankCount, rows.length)}%` }} /></span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("ntlBand")}>
        <button type="button" className="c4-chip" data-on={bandOn === "all" && !blank ? "1" : "0"} aria-pressed={bandOn === "all"} onClick={() => { setBand("all"); setBlank(false); }}>{v4("ntlAllBand")}</button>
        {bands.some((line) => !line.band) && (
          <button type="button" className="c4-chip" data-on={bandOn === "blank" ? "1" : "0"} aria-pressed={bandOn === "blank"} onClick={() => { setBand(bandOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("ntlBlankBand")}</button>
        )}
        {bandNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={bandOn === item ? "1" : "0"} aria-pressed={bandOn === item} onClick={() => { setBlank(false); setSelected(""); setBand(bandOn === item ? "all" : item); }}>{bandName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ntlSeasons")}>
        <button type="button" className="c4-chip" data-on={seasonOn === "all" && !blank ? "1" : "0"} aria-pressed={seasonOn === "all"} onClick={() => { setSeason("all"); setBlank(false); }}>{v4("ntlAllSeasons")}</button>
        {seasons.some((line) => !line.season) && (
          <button type="button" className="c4-chip" data-on={seasonOn === "blank" ? "1" : "0"} aria-pressed={seasonOn === "blank"} onClick={() => { setSeason(seasonOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("ntlBlankSeason")}</button>
        )}
        {seasonNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={seasonOn === item ? "1" : "0"} aria-pressed={seasonOn === item} onClick={() => { setBlank(false); setSelected(""); setSeason(seasonOn === item ? "all" : item); }}>{seasonName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ntlDecades")}>
        <button type="button" className="c4-chip" data-on={decadeOn === "all" && !blank ? "1" : "0"} aria-pressed={decadeOn === "all"} onClick={() => { setDecade("all"); setBlank(false); }}>{v4("ntlAllDecades")}</button>
        {blankDecade > 0 && (
          <button type="button" className="c4-chip" data-on={decadeOn === "blank" ? "1" : "0"} aria-pressed={decadeOn === "blank"} onClick={() => { setDecade(decadeOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("ntlBlankDecade")}</button>
        )}
        {decadeNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={decadeOn === item ? "1" : "0"} aria-pressed={decadeOn === item} onClick={() => { setBlank(false); setSelected(""); setDecade(decadeOn === item ? "all" : item); }}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ntlGenerations")}>
        <button type="button" className="c4-chip" data-on={generationOn === "all" && !blank ? "1" : "0"} aria-pressed={generationOn === "all"} onClick={() => { setGeneration("all"); setBlank(false); }}>{v4("ntlAllGenerations")}</button>
        {generations.some((line) => !line.generation) && (
          <button type="button" className="c4-chip" data-on={generationOn === "blank" ? "1" : "0"} aria-pressed={generationOn === "blank"} onClick={() => { setGeneration(generationOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("ntlBlankGeneration")}</button>
        )}
        {generationNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={generationOn === item ? "1" : "0"} aria-pressed={generationOn === item} onClick={() => { setBlank(false); setSelected(""); setGeneration(generationOn === item ? "all" : item); }}>{generationName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ntlShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("ntlShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("ntlHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("ntlTitle")}>
        <button type="button" className="c4-chip" data-on={!mark && !blank && bandOn === "all" && seasonOn === "all" && decadeOn === "all" && generationOn === "all" ? "1" : "0"} aria-pressed={!mark && !blank} onClick={() => { setSelected(""); setBlank(false); setBand("all"); setSeason("all"); setDecade("all"); setGeneration("all"); }}>{v4("ntlAll")}</button>
        {chips.map((item) => {
          const line = lines.find((row) => row.mark === item);
          const count = line?.count || 0;
          const share = natalShare(count, rows.length);
          const decadeMark = decadeOf(item);
          const bandMark = bandOf(item, asOf) as NatalBand;
          const seasonMark = seasonOf(item) as NatalSeason;
          const generationMark = generationOf(item) as NatalGeneration;
          return (
            <span key={item} className="c4-ntl-pair" data-mark={item}>
              <button type="button" className="c4-chip" data-on={mark === item ? "1" : "0"} aria-pressed={mark === item} onClick={() => { setBlank(false); setBand("all"); setSeason("all"); setDecade("all"); setGeneration("all"); setSelected(mark === item ? "" : item); }}>{item}</button>
              {bandMark ? <span className="c4-ntl-band">{bandName(v4, bandMark)}</span> : null}
              {seasonMark ? <span className="c4-ntl-season">{seasonName(v4, seasonMark)}</span> : null}
              {generationMark ? <span className="c4-ntl-generation">{generationName(v4, generationMark)}</span> : null}
              {decadeMark ? <span className="c4-ntl-decade">{v4("ntlDecade")} {decadeMark}</span> : null}
              <span className="c4-fol-count">{count}</span>
              <span className="c4-ntl-share">{v4("ntlShare")} {share}%</span>
              <span className="c4-ntl-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleMonth(hiddenMonths, item, present), showHidden ? "" : item)}>{showHidden ? v4("ntlShow") : v4("ntlHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("ntlSearch")}</span>
        <input className="c4-field" aria-label={v4("ntlSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-fol-empty">{v4("ntlEmpty")}</p>}
      <ul className="c4-ntl-rows">
        {shown.map((row) => {
          const name = natalText(row.born);
          const decadeMark = decadeOf(row.born);
          const bandMark = bandOf(row.born, asOf);
          const seasonMark = seasonOf(row.born) as NatalSeason;
          const generationMark = generationOf(row.born) as NatalGeneration;
          return (
            <li key={row.id} data-mark={name || "blank"}>
              <span className="c4-ntl-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("ntlBlank")}</p>
              {bandMark ? <p className="c4-ntl-band">{bandName(v4, bandMark)}</p> : null}
              {seasonMark ? <p className="c4-ntl-season">{seasonName(v4, seasonMark)}</p> : null}
              {generationMark ? <p className="c4-ntl-generation">{generationName(v4, generationMark)}</p> : null}
              {decadeMark ? <p className="c4-ntl-decade">{decadeMark}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
