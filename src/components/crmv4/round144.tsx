"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  SOURCE_KEY,
  PLAYBILL_KEY,
  PLAYBILL_VIEW_KEY,
  activeAct,
  activeCue,
  activeKind,
  activePlayer,
  activeSource,
  activeSourceMark,
  activeSpan,
  activeTone,
  activeWing,
  actArg,
  actBand,
  actGap,
  actThirdCounts,
  addPlaybill,
  addPlaybillView,
  bulkPlaybillDone,
  bulkPlaybillPinned,
  cueArg,
  dropPlaybillView,
  editPlaybill,
  kindArg,
  kindLines,
  kindOf,
  leadingKind,
  leadingSource,
  leadingSourceMark,
  leadingSpan,
  namedKinds,
  namedSourceMarks,
  namedSources,
  namedSpans,
  nextPlaybill,
  playbillClashIds,
  playbillCopy,
  playbillCounts,
  playbillCues,
  playbillPlayers,
  playbillShare,
  playbillTimeline,
  playbillTones,
  playbillWings,
  playbillsCsv,
  playerArg,
  readHiddenSources,
  readPlaybillViews,
  readPlaybills,
  resetPlaybills,
  setPlaybillDone,
  setPlaybillHeld,
  setPlaybillPinned,
  sourceLines,
  sourceMarkArg,
  sourceMarkLines,
  sourceMarkOf,
  sourceShare,
  sourceText,
  sourcesCsv,
  spanArg,
  spanLines,
  spanOf,
  stepPlaybillTone,
  toggleSource,
  toneArg,
  visiblePlaybills,
  visibleSourceCustomers,
  visibleSources,
  wingArg,
  wingOf,
  toneOf,
  type Kind,
  type Playbill,
  type PlaybillTone,
  type PlaybillTray,
  type PlaybillView,
  type PlaybillWing,
  type SourceRow,
  type SourceSpan,
} from "@/lib/crmv4/round144";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  leadInvalidSource?: string | null;
};

type GlanceRow = SourceRow & { id: string };

const THIRDS = ["i", "ii", "iii"] as const;

function wingName(v4: V4, wing: PlaybillWing): string {
  if (wing === "pit") return v4("plyWingPit");
  if (wing === "box") return v4("plyWingBox");
  if (wing === "circle") return v4("plyWingCircle");
  if (wing === "gallery") return v4("plyWingGallery");
  return v4("plyBlankWing");
}

function toneName(v4: V4, tone: PlaybillTone): string {
  if (tone === "hush") return v4("plyToneHush");
  if (tone === "warm") return v4("plyToneWarm");
  if (tone === "bright") return v4("plyToneBright");
  return v4("plyBlankTone");
}

function kindName(v4: V4, name: string): string {
  if (name === "hand") return v4("ivsHand");
  if (name === "clock") return v4("ivsClock");
  if (name === "other") return v4("ivsKindOther");
  return v4("ivsBlankKind");
}

function spanName(v4: V4, name: string): string {
  if (name === "brief") return v4("ivsBrief");
  if (name === "full") return v4("ivsFull");
  if (name === "wide") return v4("ivsWide");
  return v4("ivsBlankSpan");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("plyAuditSave");
  if (audit === "edit") return v4("plyAuditEdit");
  if (audit === "raise") return v4("plyAuditRaise");
  if (audit === "lower") return v4("plyAuditLower");
  if (audit === "pin") return v4("plyAuditPin");
  if (audit === "unpin") return v4("plyAuditUnpin");
  if (audit === "hold") return v4("plyAuditHold");
  if (audit === "release") return v4("plyAuditRelease");
  if (audit === "done") return v4("plyAuditDone");
  if (audit === "reopen") return v4("plyAuditReopen");
  return "";
}

function thirdLabel(index: number): string {
  if (index === 0) return "1";
  if (index === 1) return "2–3";
  return "4–5";
}

function actLabel(act: number | null): string {
  return act === null ? "—" : String(act);
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

export function PlaybillCards({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Playbill[]>([]);
  const [views, setViews] = useState<PlaybillView[]>([]);
  const [text, setText] = useState("");
  const [player, setPlayer] = useState("");
  const [act, setAct] = useState("");
  const [wing, setWing] = useState("");
  const [cue, setCue] = useState("");
  const [tone, setTone] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<PlaybillTray>("open");
  const [playerFilter, setPlayerFilter] = useState("all");
  const [wingFilter, setWingFilter] = useState("all");
  const [cueFilter, setCueFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState("all");
  const [actFilter, setActFilter] = useState("all");
  const [brightOnly, setBrightOnly] = useState(false);
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
    const next = readPlaybills(readJson(PLAYBILL_KEY, []));
    const saved = readPlaybillViews(readJson(PLAYBILL_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(PLAYBILL_KEY, next);
    writeJson(PLAYBILL_VIEW_KEY, saved);
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
  const players = playbillPlayers(cards);
  const wings = playbillWings(cards);
  const cues = playbillCues(cards);
  const tones = playbillTones(cards);
  const thirds = actThirdCounts(cards);
  const playerOn = activePlayer(playerFilter, players);
  const wingOn = activeWing(wingFilter, wings);
  const cueOn = activeCue(cueFilter, cues);
  const toneOn = activeTone(toneFilter, tones);
  const actOn = activeAct(actFilter);
  const picked = actArg(actOn);
  const shown = visiblePlaybills(
    cards,
    tray,
    query,
    playerArg(playerOn),
    wingArg(wingOn),
    cueArg(cueOn),
    toneArg(toneOn),
    picked.exact,
    picked.band,
    brightOnly,
    lateOnly,
    desk,
  );
  const timeline = playbillTimeline(cards, query);
  const counts = playbillCounts(cards, desk);
  const total = cards.length;
  const nextId = nextPlaybill(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const tallest = Math.max(1, ...thirds);

  function store(next: Playbill[]) {
    setCards(next);
    writeJson(PLAYBILL_KEY, next);
  }

  function storeViews(next: PlaybillView[]) {
    setViews(next);
    writeJson(PLAYBILL_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setPlayer("");
    setAct("");
    setWing("");
    setCue("");
    setTone("");
  }

  function copyCard(card: Playbill) {
    const body = playbillCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: PlaybillView) {
    setTray(view.tray);
    setQuery(view.query);
    setPlayerFilter(activePlayer(view.player, playbillPlayers(cards)));
    setWingFilter(activeWing(view.wing, playbillWings(cards)));
    setCueFilter(activeCue(view.cue, playbillCues(cards)));
    setToneFilter(activeTone(view.tone, playbillTones(cards)));
    setActFilter(activeAct(view.act));
    setBoard("cards");
    setBrightOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-ply" aria-label={v4("plyTitle")} data-playbill="1" data-role={role} data-playbill-atelier="1">
      <header className="c4-ply-head">
        <p className="c4-ply-plate" data-logo="mono">{v4("plyLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("plySub")}</p>
          <h2 className="c4-title">{v4("plyTitle")}</h2>
        </div>
        <p className="c4-ply-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("plyHint")}</p>
      <p className="c4-meta">{v4("plyLocal")}</p>
      <p className="c4-meta">{v4("plyBlank")}</p>
      <p className="c4-meta">{v4("plyPlayerBlank")}</p>
      <p className="c4-meta">{v4("plyActBlank")}</p>
      <p className="c4-meta">{v4("plyWingBlank")}</p>
      <p className="c4-meta">{v4("plyCueBlank")}</p>
      <p className="c4-meta">{v4("plyToneBlank")}</p>
      <p className="c4-meta">{v4("plyEscape")}</p>
      <p className="c4-meta">{v4("plySlash")}</p>
      <p className="c4-meta">{v4("plyNew")}</p>
      {viewer ? <p className="c4-ply-notice" role="status">{v4("plyViewer")}</p> : null}
      <p className="c4-ply-notice" role="status">
        <span>{v4("plyNotice")}</span>
        <span className="c4-ply-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("plyNoticeAll") : v4("plyNoticeOpen")}
        </button>
      </p>
      <section className="c4-ply-kpi" aria-label={v4("plyKpi")}>
        <p className="c4-pay-kicker">{v4("plyKpi")}</p>
        {(["open", "held", "done", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = playbillShare(count, total);
          const label = key === "open" ? v4("plyOpen") : key === "held" ? v4("plyHeld") : key === "done" ? v4("plyDoneTray") : v4("plyPinned");
          return (
            <p key={key} className="c4-ply-meter" data-tray={key}>
              <span>{label}</span>
              <span>{count}</span>
              <span>{v4("plyShare")} {share}%</span>
              <span className="c4-ply-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-ply-chart" aria-label={v4("plyChart")}>
        {thirds.map((count, index) => {
          const code = THIRDS[index];
          const on = actOn === code;
          const height = Math.max(8, Math.round((count / tallest) * 100));
          return (
            <button
              key={code}
              type="button"
              className="c4-ply-band"
              data-on={on ? "1" : "0"}
              data-filled={count ? "1" : "0"}
              aria-pressed={on}
              onClick={() => setActFilter(on ? "all" : code)}
            >
              <span className="c4-ply-bar" aria-hidden="true"><i style={{ height: `${height}%` }} /></span>
              <span>{thirdLabel(index)}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-ply-next" onSubmit={(event) => event.preventDefault()}>
        <label className="c4-lab">
          <span>{v4("plyDeskAct")}</span>
          <input className="c4-field" aria-label={v4("plyDeskAct")} value={desk} inputMode="numeric" maxLength={1} onChange={(event) => setDesk(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setDesk("");
          }} />
        </label>
        <p className="c4-ply-next-line">
          <span>{v4("plyNext")}</span>
          {nextCard ? <strong>{actLabel(nextCard.act)} {nextCard.text}</strong> : <span>{actArg(desk).exact !== null ? v4("plyNextEmpty") : "—"}</span>}
        </p>
      </form>
      <form className="c4-ply-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addPlaybill(cards, { id: `ply-${Date.now().toString(36)}`, text, player, act, wing, cue, tone });
        if (next.length === cards.length) return;
        store(next);
        clearDraft();
      }} onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("plyText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("plyText")} aria-keyshortcuts="n" value={text} maxLength={80} disabled={viewer} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("plyPlayer")}</span>
          <input className="c4-field" aria-label={v4("plyPlayer")} value={player} maxLength={18} disabled={viewer} onChange={(event) => setPlayer(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("plyAct")}</span>
          <input className="c4-field" aria-label={v4("plyAct")} value={act} inputMode="numeric" maxLength={1} disabled={viewer} onChange={(event) => setAct(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("plyWing")}</span>
          <input className="c4-field" aria-label={v4("plyWing")} value={wing} maxLength={8} disabled={viewer} onChange={(event) => setWing(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("plyCue")}</span>
          <input className="c4-field" aria-label={v4("plyCue")} value={cue} maxLength={12} disabled={viewer} onChange={(event) => setCue(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("plyTone")}</span>
          <input className="c4-field" aria-label={v4("plyTone")} value={tone} maxLength={8} disabled={viewer} onChange={(event) => setTone(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("plyAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("plyTitle")}>
        {(["open", "held", "done"] as const).map((key) => (
          <button key={key} type="button" className="c4-chip" data-on={tray === key ? "1" : "0"} aria-pressed={tray === key} onClick={() => { setTray(key); setBoard("cards"); if (key !== "open") setLateOnly(false); }}>
            {key === "open" ? v4("plyOpen") : key === "held" ? v4("plyHeld") : v4("plyDoneTray")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard((value) => value === "timeline" ? "cards" : "timeline")}>{v4("plyTimeline")}</button>
        <button type="button" className="c4-chip" data-on={brightOnly ? "1" : "0"} aria-pressed={brightOnly} onClick={() => setBrightOnly((value) => !value)}>{v4("plyBright")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("plySearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("plySearch")} aria-keyshortcuts="/" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("plyPlayers")}>
        <button type="button" className="c4-chip" data-on={playerOn === "all" ? "1" : "0"} aria-pressed={playerOn === "all"} onClick={() => setPlayerFilter("all")}>{v4("plyAllPlayers")}</button>
        <button type="button" className="c4-chip" data-on={playerOn === "blank" ? "1" : "0"} aria-pressed={playerOn === "blank"} onClick={() => setPlayerFilter(playerOn === "blank" ? "all" : "blank")}>{v4("plyBlankPlayer")}</button>
        {players.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={playerOn === item ? "1" : "0"} aria-pressed={playerOn === item} onClick={() => setPlayerFilter(playerOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("plyWings")}>
        <button type="button" className="c4-chip" data-on={wingOn === "all" ? "1" : "0"} aria-pressed={wingOn === "all"} onClick={() => setWingFilter("all")}>{v4("plyAllWings")}</button>
        <button type="button" className="c4-chip" data-on={wingOn === "blank" ? "1" : "0"} aria-pressed={wingOn === "blank"} onClick={() => setWingFilter(wingOn === "blank" ? "all" : "blank")}>{v4("plyBlankWing")}</button>
        {wings.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={wingOn === item ? "1" : "0"} aria-pressed={wingOn === item} onClick={() => setWingFilter(wingOn === item ? "all" : item)}>{wingName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("plyCues")}>
        <button type="button" className="c4-chip" data-on={cueOn === "all" ? "1" : "0"} aria-pressed={cueOn === "all"} onClick={() => setCueFilter("all")}>{v4("plyAllCues")}</button>
        <button type="button" className="c4-chip" data-on={cueOn === "blank" ? "1" : "0"} aria-pressed={cueOn === "blank"} onClick={() => setCueFilter(cueOn === "blank" ? "all" : "blank")}>{v4("plyBlankCue")}</button>
        {cues.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={cueOn === item ? "1" : "0"} aria-pressed={cueOn === item} onClick={() => setCueFilter(cueOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("plyTones")}>
        <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} aria-pressed={toneOn === "all"} onClick={() => setToneFilter("all")}>{v4("plyAllTones")}</button>
        <button type="button" className="c4-chip" data-on={toneOn === "blank" ? "1" : "0"} aria-pressed={toneOn === "blank"} onClick={() => setToneFilter(toneOn === "blank" ? "all" : "blank")}>{v4("plyBlankTone")}</button>
        {tones.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toneOn === item ? "1" : "0"} aria-pressed={toneOn === item} onClick={() => setToneFilter(toneOn === item ? "all" : item)}>{toneName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("plyActs")}>
        {(["all", "blank", "opening", "hinge", "finale"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={actOn === item ? "1" : "0"} aria-pressed={actOn === item} onClick={() => setActFilter(item)}>
            {item === "all" ? v4("plyAllActs") : item === "blank" ? v4("plyBlankAct") : item === "opening" ? v4("plyOpening") : item === "hinge" ? v4("plyHinge") : v4("plyFinale")}
          </button>
        ))}
      </div>
      <form className="c4-ply-view" onSubmit={(event) => {
        event.preventDefault();
        const next = addPlaybillView(views, {
          id: `view-${Date.now().toString(36)}`,
          name: viewName,
          tray,
          query,
          player: playerOn,
          wing: wingOn,
          cue: cueOn,
          tone: toneOn,
          act: actOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("plyViewName")}</span>
          <input className="c4-field" aria-label={v4("plyViewName")} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("plySaveView")}</button>
      </form>
      <section aria-label={v4("plyViews")}>
        <p className="c4-pay-kicker">{v4("plyViews")}</p>
        {!views.length && <p className="c4-meta">{v4("plyViewEmpty")}</p>}
        <ul className="c4-ply-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" onClick={() => storeViews(dropPlaybillView(views, view.id))}>{v4("plyDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      <p className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkPlaybillPinned(cards, shown.map((card) => card.id), true))}>{v4("plyBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkPlaybillDone(cards, shown.map((card) => card.id), true))}>{v4("plyBulkDone")}</button>
        <button type="button" className="c4-btn" onClick={() => download("playbill-cards.csv", playbillsCsv(cards, desk))}>{v4("plyCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetPlaybills())}>{v4("plyReset")}</button>
      </p>
      {board === "cards" && !shown.length && <p className="c4-ply-empty">{v4("plyEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-ply-rows">
          {shown.map((card) => {
            const band = actBand(card.act);
            const clashes = playbillClashIds(cards, card.id);
            const gap = actGap(card.act, desk);
            const wingLabel = wingOf(card.wing);
            const toneLabel = toneOf(card.tone);
            return (
              <li key={card.id} data-band={band} data-wing={wingLabel} data-tone={toneLabel} data-late={gap !== null && gap > 0 && !card.held && !card.done ? "1" : "0"}>
                <span className="c4-ply-act">{actLabel(card.act)}</span>
                <div>
                  <p className="c4-ply-pips" aria-label={v4("plyTone")}>
                    {(["hush", "warm", "bright"] as const).map((pip) => <i key={pip} data-on={toneLabel === pip || (pip === "hush" && toneLabel === "warm") || (pip !== "bright" && toneLabel === "bright") ? "1" : "0"} />)}
                  </p>
                  {editing === card.id ? (
                    <form onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editPlaybill(cards, card.id, draft));
                      setEditing("");
                      setDraft("");
                    }}>
                      <label className="c4-lab">
                        <span>{v4("plyEdit")}</span>
                        <input className="c4-field" aria-label={v4("plyEdit")} value={draft} maxLength={80} disabled={viewer} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
                          if (event.key !== "Escape") return;
                          event.preventDefault();
                          setEditing("");
                          setDraft("");
                        }} />
                      </label>
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("plySaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-ply-wing">{wingName(v4, wingLabel)}</p>
                  <p className="c4-ply-tone">{toneName(v4, toneLabel)}</p>
                  {card.player ? <p className="c4-ply-player">{v4("plyAssign")} {card.player}</p> : null}
                  {card.cue ? <p className="c4-ply-cue">{card.cue}</p> : null}
                  {gap !== null ? <p className="c4-meta">{gap > 0 ? v4("plyLate") : gap < 0 ? v4("plyAhead") : v4("plyNow")} {gap === 0 ? "" : Math.abs(gap)}</p> : null}
                  <p className="c4-meta">{clashes.length ? `${v4("plyClash")} ${clashes.length}` : v4("plyClashNone")}</p>
                  {card.audit ? <p className="c4-meta">{v4("plyAudit")} {auditName(v4, card.audit)}</p> : null}
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("plyCopied") : v4("plyCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("plyEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepPlaybillTone(cards, card.id, 1))}>{v4("plyRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepPlaybillTone(cards, card.id, -1))}>{v4("plyLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setPlaybillPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("plyUnpin") : v4("plyPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.held} onClick={() => store(setPlaybillHeld(cards, card.id, !card.held))}>{card.held ? v4("plyRelease") : v4("plyHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.done} onClick={() => store(setPlaybillDone(cards, card.id, !card.done))}>{card.done ? v4("plyReopen") : v4("plyDone")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-ply-time">
          {timeline.map((card) => (
            <li key={card.id} data-band={actBand(card.act)}>
              <span className="c4-ply-clock">{actLabel(card.act)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function InvalidSources({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenSources, setHiddenSources] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [kind, setKind] = useState("all");
  const [span, setSpan] = useState("all");
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
      source: row.leadInvalidSource,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = sourceLines(rows);
  const kinds = kindLines(rows);
  const spans = spanLines(rows);
  const letters = sourceMarkLines(rows);
  const present = namedSources(rows);
  const presentKey = present.join("\n");
  const kindNames = namedKinds(rows);
  const spanNames = namedSpans(rows);
  const letterNames = namedSourceMarks(rows);
  const blankCount = lines.find((line) => !line.source)?.count || 0;
  const blankLetter = letters.find((line) => !line.letter)?.count || 0;
  const lead = leadingSource(rows);
  const leadKind = leadingKind(rows);
  const leadSpan = leadingSpan(rows);
  const leadLetter = leadingSourceMark(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenSources(readJson(SOURCE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenSources(next);
    writeJson(SOURCE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleSources(present, hiddenSources, showHidden);
  const source = activeSource(selected, chips);
  const kindOn = activeKind(kind, kindNames);
  const spanOn = activeSpan(span, spanNames);
  const letterOn = activeSourceMark(letter, letterNames);
  const shown = visibleSourceCustomers(rows, source, blank, kindArg(kindOn), spanArg(spanOn), sourceMarkArg(letterOn), query);
  const widest = Math.max(1, ...kinds.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenSources(next);
    writeJson(SOURCE_KEY, next);
    if (clear && activeSource(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-ivs" aria-label={v4("ivsTitle")} data-ivsource="1" data-playbill-atelier="1">
      <header className="c4-ivs-head">
        <div>
          <p className="c4-pay-kicker">{v4("ivsSub")}</p>
          <h2 className="c4-title">{v4("ivsTitle")}</h2>
        </div>
        <p className="c4-ply-count">{v4("ivsRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("ivsHint")}</p>
      <p className="c4-meta">{v4("ivsLocal")}</p>
      <p className="c4-meta">{v4("ivsEscape")}</p>
      {lead ? <p className="c4-ivs-lead"><span>{v4("ivsLead")}</span> {lead}</p> : null}
      {leadKind ? <p className="c4-ivs-lead"><span>{v4("ivsLeadKind")}</span> {kindName(v4, leadKind)}</p> : null}
      {leadSpan ? <p className="c4-ivs-lead"><span>{v4("ivsLeadSpan")}</span> {spanName(v4, leadSpan)}</p> : null}
      {leadLetter ? <p className="c4-ivs-lead"><span>{v4("ivsLeadLetter")}</span> {leadLetter}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("ivsBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("invalid-sources.csv", sourcesCsv(rows))}>{v4("ivsCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("ivsLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("ivsFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-ply-empty">{v4("ivsNone")}</p>}
      {kinds.length > 0 && (
        <section className="c4-ivs-chart" aria-label={v4("ivsKind")}>
          {kinds.map((line) => {
            const share = sourceShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.kind || "blank";
            return (
              <p key={name} className="c4-ivs-col" data-kind={name}>
                <span>{kindName(v4, line.kind)}</span>
                <span className="c4-ivs-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("ivsShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      {blankCount > 0 && (
        <button type="button" className="c4-ivs-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); setKind("all"); setSpan("all"); setLetter("all"); }}>
          <span>{v4("ivsBlank")}</span>
          <span className="c4-ply-count">{blankCount}</span>
          <span className="c4-ivs-track" aria-hidden="true"><i style={{ width: `${sourceShare(blankCount, rows.length)}%` }} /></span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("ivsKind")}>
        <button type="button" className="c4-chip" data-on={kindOn === "all" && !blank ? "1" : "0"} aria-pressed={kindOn === "all"} onClick={() => { setKind("all"); setBlank(false); }}>{v4("ivsAllKind")}</button>
        {kinds.some((line) => !line.kind) && (
          <button type="button" className="c4-chip" data-on={kindOn === "blank" ? "1" : "0"} aria-pressed={kindOn === "blank"} onClick={() => { setKind(kindOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("ivsBlankKind")}</button>
        )}
        {kindNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={kindOn === item ? "1" : "0"} aria-pressed={kindOn === item} onClick={() => { setBlank(false); setSelected(""); setKind(kindOn === item ? "all" : item); }}>{kindName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ivsSpans")}>
        <button type="button" className="c4-chip" data-on={spanOn === "all" && !blank ? "1" : "0"} aria-pressed={spanOn === "all"} onClick={() => { setSpan("all"); setBlank(false); }}>{v4("ivsAllSpans")}</button>
        {spans.some((line) => !line.span) && (
          <button type="button" className="c4-chip" data-on={spanOn === "blank" ? "1" : "0"} aria-pressed={spanOn === "blank"} onClick={() => { setSpan(spanOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("ivsBlankSpan")}</button>
        )}
        {spanNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={spanOn === item ? "1" : "0"} aria-pressed={spanOn === item} onClick={() => { setBlank(false); setSelected(""); setSpan(spanOn === item ? "all" : item); }}>{spanName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ivsLetters")}>
        <button type="button" className="c4-chip" data-on={letterOn === "all" && !blank ? "1" : "0"} aria-pressed={letterOn === "all"} onClick={() => { setLetter("all"); setBlank(false); }}>{v4("ivsAllLetters")}</button>
        {blankLetter > 0 && (
          <button type="button" className="c4-chip" data-on={letterOn === "blank" ? "1" : "0"} aria-pressed={letterOn === "blank"} onClick={() => { setLetter(letterOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("ivsBlankLetter")}</button>
        )}
        {letterNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={letterOn === item ? "1" : "0"} aria-pressed={letterOn === item} onClick={() => { setBlank(false); setSelected(""); setLetter(letterOn === item ? "all" : item); }}>{item === "#" ? v4("ivsOther") : item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ivsShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("ivsShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("ivsHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("ivsTitle")}>
        <button type="button" className="c4-chip" data-on={!source && !blank && kindOn === "all" && spanOn === "all" && letterOn === "all" ? "1" : "0"} aria-pressed={!source && !blank} onClick={() => { setSelected(""); setBlank(false); setKind("all"); setSpan("all"); setLetter("all"); }}>{v4("ivsAll")}</button>
        {chips.map((item) => {
          const line = lines.find((row) => row.source === item);
          const count = line?.count || 0;
          const share = sourceShare(count, rows.length);
          const mark = sourceMarkOf(item);
          const kindMark = kindOf(item) as Kind;
          const spanMark = spanOf(item) as SourceSpan;
          return (
            <span key={item} className="c4-ivs-pair" data-source={item}>
              <button type="button" className="c4-chip" data-on={source === item ? "1" : "0"} aria-pressed={source === item} onClick={() => { setBlank(false); setKind("all"); setSpan("all"); setLetter("all"); setSelected(source === item ? "" : item); }}>{item}</button>
              {kindMark ? <span className="c4-ivs-kind">{kindName(v4, kindMark)}</span> : null}
              {spanMark ? <span className="c4-ivs-span">{spanName(v4, spanMark)}</span> : null}
              {mark ? <span className="c4-ivs-letter">{v4("ivsLetter")} {mark === "#" ? v4("ivsOther") : mark}</span> : null}
              <span className="c4-ply-count">{count}</span>
              <span className="c4-ivs-share">{v4("ivsShare")} {share}%</span>
              <span className="c4-ivs-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleSource(hiddenSources, item, present), showHidden ? "" : item)}>{showHidden ? v4("ivsShow") : v4("ivsHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("ivsSearch")}</span>
        <input className="c4-field" aria-label={v4("ivsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-ply-empty">{v4("ivsEmpty")}</p>}
      <ul className="c4-ivs-rows">
        {shown.map((row) => {
          const name = sourceText(row.source);
          const mark = sourceMarkOf(name);
          const kindMark = kindOf(name);
          const spanMark = spanOf(name);
          return (
            <li key={row.id} data-source={name || "blank"}>
              <span className="c4-ivs-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("ivsBlank")}</p>
              {kindMark ? <p className="c4-ivs-kind">{kindName(v4, kindMark)}</p> : null}
              {spanMark ? <p className="c4-ivs-span">{spanName(v4, spanMark)}</p> : null}
              {mark ? <p className="c4-ivs-letter">{mark === "#" ? v4("ivsOther") : mark}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
