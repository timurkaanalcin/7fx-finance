"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  INTERLUDE_KEY,
  INTERLUDE_VIEW_KEY,
  VINTAGE_KEY,
  activeDecade,
  activeHost,
  activeHour,
  activeKind,
  activeMark,
  activeRoom,
  activeSeason,
  activeShade,
  activeSpan,
  activeYear,
  addInterlude,
  addInterludeView,
  bulkInterludeDone,
  bulkInterludePinned,
  decadeArg,
  decadeLines,
  decadeOf,
  dropInterludeView,
  editInterlude,
  hostArg,
  hourArg,
  hourBand,
  hourGap,
  hourWatchCounts,
  interludeClashIds,
  interludeCopy,
  interludeCounts,
  interludeHosts,
  interludeMarks,
  interludeRooms,
  interludeShades,
  interludeShare,
  interludeTimeline,
  interludesCsv,
  kindArg,
  kindLines,
  kindOf,
  leadingDecade,
  leadingKind,
  leadingSeason,
  leadingSpan,
  leadingYear,
  markArg,
  namedDecades,
  namedKinds,
  namedSeasons,
  namedSpans,
  namedYears,
  nextInterlude,
  readHiddenYears,
  readInterludeViews,
  readInterludes,
  resetInterludes,
  roomArg,
  roomOf,
  seasonArg,
  seasonLines,
  seasonOf,
  setInterludeDone,
  setInterludeHeld,
  setInterludePinned,
  shadeArg,
  shadeOf,
  spanArg,
  spanLines,
  spanOf,
  stepInterludeShade,
  toggleYear,
  vintageLines,
  vintageShare,
  vintageText,
  vintagesCsv,
  visibleInterludes,
  visibleVintageCustomers,
  visibleYears,
  type Interlude,
  type InterludeRoom,
  type InterludeShade,
  type InterludeTray,
  type InterludeView,
  type VintageKind,
  type VintageRow,
  type VintageSeason,
  type VintageSpan,
} from "@/lib/crmv4/round145";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  registrationDate?: string | null;
};

type GlanceRow = VintageRow & { id: string };

const WATCHES = ["i", "ii", "iii", "iv"] as const;

function roomName(v4: V4, room: InterludeRoom): string {
  if (room === "foyer") return v4("itlRoomFoyer");
  if (room === "salon") return v4("itlRoomSalon");
  if (room === "library") return v4("itlRoomLibrary");
  if (room === "garden") return v4("itlRoomGarden");
  return v4("itlBlankRoom");
}

function shadeName(v4: V4, shade: InterludeShade): string {
  if (shade === "ivory") return v4("itlShadeIvory");
  if (shade === "graphite") return v4("itlShadeGraphite");
  if (shade === "gold") return v4("itlShadeGold");
  return v4("itlBlankShade");
}

function kindName(v4: V4, name: string): string {
  if (name === "founding") return v4("vntFounding");
  if (name === "house") return v4("vntHouse");
  if (name === "fresh") return v4("vntFresh");
  return v4("vntBlankKind");
}

function spanName(v4: V4, name: string): string {
  if (name === "early") return v4("vntEarly");
  if (name === "mid") return v4("vntMid");
  if (name === "late") return v4("vntLate");
  return v4("vntBlankSpan");
}

function seasonName(v4: V4, name: string): string {
  if (name === "winter") return v4("vntWinter");
  if (name === "spring") return v4("vntSpring");
  if (name === "summer") return v4("vntSummer");
  if (name === "autumn") return v4("vntAutumn");
  return v4("vntBlankSeason");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("itlAuditSave");
  if (audit === "edit") return v4("itlAuditEdit");
  if (audit === "raise") return v4("itlAuditRaise");
  if (audit === "lower") return v4("itlAuditLower");
  if (audit === "pin") return v4("itlAuditPin");
  if (audit === "unpin") return v4("itlAuditUnpin");
  if (audit === "hold") return v4("itlAuditHold");
  if (audit === "release") return v4("itlAuditRelease");
  if (audit === "done") return v4("itlAuditDone");
  if (audit === "reopen") return v4("itlAuditReopen");
  return "";
}

function watchLabel(index: number): string {
  if (index === 0) return "1–3";
  if (index === 1) return "4–6";
  if (index === 2) return "7–9";
  return "10–12";
}

function hourLabel(hour: number | null): string {
  return hour === null ? "—" : String(hour);
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

export function InterludeCards({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Interlude[]>([]);
  const [views, setViews] = useState<InterludeView[]>([]);
  const [text, setText] = useState("");
  const [host, setHost] = useState("");
  const [hour, setHour] = useState("");
  const [room, setRoom] = useState("");
  const [mark, setMark] = useState("");
  const [shade, setShade] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<InterludeTray>("open");
  const [hostFilter, setHostFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [markFilter, setMarkFilter] = useState("all");
  const [shadeFilter, setShadeFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [goldOnly, setGoldOnly] = useState(false);
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
    const next = readInterludes(readJson(INTERLUDE_KEY, []));
    const saved = readInterludeViews(readJson(INTERLUDE_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(INTERLUDE_KEY, next);
    writeJson(INTERLUDE_VIEW_KEY, saved);
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
      if (event.key === "i" || event.key === "I") {
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
  const hosts = interludeHosts(cards);
  const rooms = interludeRooms(cards);
  const marks = interludeMarks(cards);
  const shades = interludeShades(cards);
  const watches = hourWatchCounts(cards);
  const hostOn = activeHost(hostFilter, hosts);
  const roomOn = activeRoom(roomFilter, rooms);
  const markOn = activeMark(markFilter, marks);
  const shadeOn = activeShade(shadeFilter, shades);
  const hourOn = activeHour(hourFilter);
  const picked = hourArg(hourOn);
  const shown = visibleInterludes(
    cards,
    tray,
    query,
    hostArg(hostOn),
    roomArg(roomOn),
    markArg(markOn),
    shadeArg(shadeOn),
    picked.exact,
    picked.band,
    goldOnly,
    lateOnly,
    desk,
  );
  const timeline = interludeTimeline(cards, query);
  const counts = interludeCounts(cards, desk);
  const total = cards.length;
  const nextId = nextInterlude(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const tallest = Math.max(1, ...watches);

  function store(next: Interlude[]) {
    setCards(next);
    writeJson(INTERLUDE_KEY, next);
  }

  function storeViews(next: InterludeView[]) {
    setViews(next);
    writeJson(INTERLUDE_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setHost("");
    setHour("");
    setRoom("");
    setMark("");
    setShade("");
  }

  function copyCard(card: Interlude) {
    const body = interludeCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: InterludeView) {
    setTray(view.tray);
    setQuery(view.query);
    setHostFilter(activeHost(view.host, interludeHosts(cards)));
    setRoomFilter(activeRoom(view.room, interludeRooms(cards)));
    setMarkFilter(activeMark(view.mark, interludeMarks(cards)));
    setShadeFilter(activeShade(view.shade, interludeShades(cards)));
    setHourFilter(activeHour(view.hour));
    setBoard("cards");
    setGoldOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-itl" aria-label={v4("itlTitle")} data-interlude="1" data-role={role} data-interlude-salon="1">
      <header className="c4-itl-head">
        <p className="c4-itl-plate" data-logo="mono">{v4("itlLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("itlSub")}</p>
          <h2 className="c4-title">{v4("itlTitle")}</h2>
        </div>
        <p className="c4-itl-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("itlHint")}</p>
      <p className="c4-meta">{v4("itlLocal")}</p>
      <p className="c4-meta">{v4("itlBlank")}</p>
      <p className="c4-meta">{v4("itlHostBlank")}</p>
      <p className="c4-meta">{v4("itlHourBlank")}</p>
      <p className="c4-meta">{v4("itlRoomBlank")}</p>
      <p className="c4-meta">{v4("itlMarkBlank")}</p>
      <p className="c4-meta">{v4("itlShadeBlank")}</p>
      <p className="c4-meta">{v4("itlEscape")}</p>
      <p className="c4-meta">{v4("itlSlash")}</p>
      <p className="c4-meta">{v4("itlNew")}</p>
      {viewer ? <p className="c4-itl-notice" role="status">{v4("itlViewer")}</p> : null}
      <p className="c4-itl-notice" role="status">
        <span>{v4("itlNotice")}</span>
        <span className="c4-itl-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("itlNoticeAll") : v4("itlNoticeOpen")}
        </button>
      </p>
      <section className="c4-itl-kpi" aria-label={v4("itlKpi")}>
        <p className="c4-pay-kicker">{v4("itlKpi")}</p>
        {(["open", "held", "done", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = interludeShare(count, total);
          const label = key === "open" ? v4("itlOpen") : key === "held" ? v4("itlHeld") : key === "done" ? v4("itlDoneTray") : v4("itlPinned");
          return (
            <p key={key} className="c4-itl-meter" data-tray={key}>
              <span>{label}</span>
              <span>{count}</span>
              <span>{v4("itlShare")} {share}%</span>
              <span className="c4-itl-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-itl-chart" aria-label={v4("itlChart")}>
        {watches.map((count, index) => {
          const code = WATCHES[index];
          const on = hourOn === code;
          const height = Math.max(8, Math.round((count / tallest) * 100));
          return (
            <button
              key={code}
              type="button"
              className="c4-itl-band"
              data-on={on ? "1" : "0"}
              data-filled={count ? "1" : "0"}
              aria-pressed={on}
              onClick={() => setHourFilter(on ? "all" : code)}
            >
              <span className="c4-itl-bar" aria-hidden="true"><i style={{ height: `${height}%` }} /></span>
              <span>{watchLabel(index)}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-itl-next" onSubmit={(event) => event.preventDefault()}>
        <label className="c4-lab">
          <span>{v4("itlDeskHour")}</span>
          <input className="c4-field" aria-label={v4("itlDeskHour")} value={desk} inputMode="numeric" maxLength={2} onChange={(event) => setDesk(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setDesk("");
          }} />
        </label>
        <p className="c4-itl-next-line">
          <span>{v4("itlNext")}</span>
          {nextCard ? <strong>{hourLabel(nextCard.hour)} {nextCard.text}</strong> : <span>{hourArg(desk).exact !== null ? v4("itlNextEmpty") : "—"}</span>}
        </p>
      </form>
      <form className="c4-itl-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addInterlude(cards, { id: `itl-${Date.now().toString(36)}`, text, host, hour, room, mark, shade });
        if (next.length === cards.length) return;
        store(next);
        clearDraft();
      }} onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("itlText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("itlText")} aria-keyshortcuts="i" value={text} maxLength={80} disabled={viewer} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("itlHost")}</span>
          <input className="c4-field" aria-label={v4("itlHost")} value={host} maxLength={18} disabled={viewer} onChange={(event) => setHost(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("itlHour")}</span>
          <input className="c4-field" aria-label={v4("itlHour")} value={hour} inputMode="numeric" maxLength={2} disabled={viewer} onChange={(event) => setHour(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("itlRoom")}</span>
          <input className="c4-field" aria-label={v4("itlRoom")} value={room} maxLength={8} disabled={viewer} onChange={(event) => setRoom(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("itlMark")}</span>
          <input className="c4-field" aria-label={v4("itlMark")} value={mark} maxLength={12} disabled={viewer} onChange={(event) => setMark(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("itlShade")}</span>
          <input className="c4-field" aria-label={v4("itlShade")} value={shade} maxLength={8} disabled={viewer} onChange={(event) => setShade(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("itlAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("itlTitle")}>
        {(["open", "held", "done"] as const).map((key) => (
          <button key={key} type="button" className="c4-chip" data-on={tray === key ? "1" : "0"} aria-pressed={tray === key} onClick={() => { setTray(key); setBoard("cards"); if (key !== "open") setLateOnly(false); }}>
            {key === "open" ? v4("itlOpen") : key === "held" ? v4("itlHeld") : v4("itlDoneTray")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard((value) => value === "timeline" ? "cards" : "timeline")}>{v4("itlTimeline")}</button>
        <button type="button" className="c4-chip" data-on={goldOnly ? "1" : "0"} aria-pressed={goldOnly} onClick={() => setGoldOnly((value) => !value)}>{v4("itlGold")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("itlSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("itlSearch")} aria-keyshortcuts="/" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("itlHosts")}>
        <button type="button" className="c4-chip" data-on={hostOn === "all" ? "1" : "0"} aria-pressed={hostOn === "all"} onClick={() => setHostFilter("all")}>{v4("itlAllHosts")}</button>
        <button type="button" className="c4-chip" data-on={hostOn === "blank" ? "1" : "0"} aria-pressed={hostOn === "blank"} onClick={() => setHostFilter(hostOn === "blank" ? "all" : "blank")}>{v4("itlBlankHost")}</button>
        {hosts.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hostOn === item ? "1" : "0"} aria-pressed={hostOn === item} onClick={() => setHostFilter(hostOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("itlRooms")}>
        <button type="button" className="c4-chip" data-on={roomOn === "all" ? "1" : "0"} aria-pressed={roomOn === "all"} onClick={() => setRoomFilter("all")}>{v4("itlAllRooms")}</button>
        <button type="button" className="c4-chip" data-on={roomOn === "blank" ? "1" : "0"} aria-pressed={roomOn === "blank"} onClick={() => setRoomFilter(roomOn === "blank" ? "all" : "blank")}>{v4("itlBlankRoom")}</button>
        {rooms.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={roomOn === item ? "1" : "0"} aria-pressed={roomOn === item} onClick={() => setRoomFilter(roomOn === item ? "all" : item)}>{roomName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("itlMarks")}>
        <button type="button" className="c4-chip" data-on={markOn === "all" ? "1" : "0"} aria-pressed={markOn === "all"} onClick={() => setMarkFilter("all")}>{v4("itlAllMarks")}</button>
        <button type="button" className="c4-chip" data-on={markOn === "blank" ? "1" : "0"} aria-pressed={markOn === "blank"} onClick={() => setMarkFilter(markOn === "blank" ? "all" : "blank")}>{v4("itlBlankMark")}</button>
        {marks.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={markOn === item ? "1" : "0"} aria-pressed={markOn === item} onClick={() => setMarkFilter(markOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("itlShades")}>
        <button type="button" className="c4-chip" data-on={shadeOn === "all" ? "1" : "0"} aria-pressed={shadeOn === "all"} onClick={() => setShadeFilter("all")}>{v4("itlAllShades")}</button>
        <button type="button" className="c4-chip" data-on={shadeOn === "blank" ? "1" : "0"} aria-pressed={shadeOn === "blank"} onClick={() => setShadeFilter(shadeOn === "blank" ? "all" : "blank")}>{v4("itlBlankShade")}</button>
        {shades.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shadeOn === item ? "1" : "0"} aria-pressed={shadeOn === item} onClick={() => setShadeFilter(shadeOn === item ? "all" : item)}>{shadeName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("itlHours")}>
        {(["all", "blank", "dawn", "noon", "dusk"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hourOn === item ? "1" : "0"} aria-pressed={hourOn === item} onClick={() => setHourFilter(item)}>
            {item === "all" ? v4("itlAllHours") : item === "blank" ? v4("itlBlankHour") : item === "dawn" ? v4("itlDawn") : item === "noon" ? v4("itlNoon") : v4("itlDusk")}
          </button>
        ))}
      </div>
      <form className="c4-itl-view" onSubmit={(event) => {
        event.preventDefault();
        const next = addInterludeView(views, {
          id: `view-${Date.now().toString(36)}`,
          name: viewName,
          tray,
          query,
          host: hostOn,
          room: roomOn,
          mark: markOn,
          shade: shadeOn,
          hour: hourOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("itlViewName")}</span>
          <input className="c4-field" aria-label={v4("itlViewName")} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("itlSaveView")}</button>
      </form>
      <section aria-label={v4("itlViews")}>
        <p className="c4-pay-kicker">{v4("itlViews")}</p>
        {!views.length && <p className="c4-meta">{v4("itlViewEmpty")}</p>}
        <ul className="c4-itl-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" onClick={() => storeViews(dropInterludeView(views, view.id))}>{v4("itlDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      <p className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkInterludePinned(cards, shown.map((card) => card.id), true))}>{v4("itlBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkInterludeDone(cards, shown.map((card) => card.id), true))}>{v4("itlBulkDone")}</button>
        <button type="button" className="c4-btn" onClick={() => download("interlude-cards.csv", interludesCsv(cards, desk))}>{v4("itlCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetInterludes())}>{v4("itlReset")}</button>
      </p>
      {board === "cards" && !shown.length && <p className="c4-itl-empty">{v4("itlEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-itl-rows">
          {shown.map((card) => {
            const band = hourBand(card.hour);
            const clashes = interludeClashIds(cards, card.id);
            const gap = hourGap(card.hour, desk);
            const roomLabel = roomOf(card.room);
            const shadeLabel = shadeOf(card.shade);
            return (
              <li key={card.id} data-band={band} data-room={roomLabel} data-shade={shadeLabel} data-late={gap !== null && gap > 0 && !card.held && !card.done ? "1" : "0"}>
                <span className="c4-itl-hour">{hourLabel(card.hour)}</span>
                <div>
                  <p className="c4-itl-pips" aria-label={v4("itlShade")}>
                    {(["ivory", "graphite", "gold"] as const).map((pip) => <i key={pip} data-on={shadeLabel === pip || (pip === "ivory" && shadeLabel === "graphite") || (pip !== "gold" && shadeLabel === "gold") ? "1" : "0"} />)}
                  </p>
                  {editing === card.id ? (
                    <form onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editInterlude(cards, card.id, draft));
                      setEditing("");
                      setDraft("");
                    }}>
                      <label className="c4-lab">
                        <span>{v4("itlEdit")}</span>
                        <input className="c4-field" aria-label={v4("itlEdit")} value={draft} maxLength={80} disabled={viewer} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
                          if (event.key !== "Escape") return;
                          event.preventDefault();
                          setEditing("");
                          setDraft("");
                        }} />
                      </label>
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("itlSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-itl-room">{roomName(v4, roomLabel)}</p>
                  <p className="c4-itl-shade">{shadeName(v4, shadeLabel)}</p>
                  {card.host ? <p className="c4-itl-host">{v4("itlAssign")} {card.host}</p> : null}
                  {card.mark ? <p className="c4-itl-mark">{card.mark}</p> : null}
                  {gap !== null ? <p className="c4-meta">{gap > 0 ? v4("itlLate") : gap < 0 ? v4("itlAhead") : v4("itlNow")} {gap === 0 ? "" : Math.abs(gap)}</p> : null}
                  <p className="c4-meta">{clashes.length ? `${v4("itlClash")} ${clashes.length}` : v4("itlClashNone")}</p>
                  {card.audit ? <p className="c4-meta">{v4("itlAudit")} {auditName(v4, card.audit)}</p> : null}
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("itlCopied") : v4("itlCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("itlEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepInterludeShade(cards, card.id, 1))}>{v4("itlRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepInterludeShade(cards, card.id, -1))}>{v4("itlLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setInterludePinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("itlUnpin") : v4("itlPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.held} onClick={() => store(setInterludeHeld(cards, card.id, !card.held))}>{card.held ? v4("itlRelease") : v4("itlHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.done} onClick={() => store(setInterludeDone(cards, card.id, !card.done))}>{card.done ? v4("itlReopen") : v4("itlDone")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-itl-time">
          {timeline.map((card) => (
            <li key={card.id} data-band={hourBand(card.hour)}>
              <span className="c4-itl-clock">{hourLabel(card.hour)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function RegistrationVintages({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenYears, setHiddenYears] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [kind, setKind] = useState("all");
  const [span, setSpan] = useState("all");
  const [season, setSeason] = useState("all");
  const [decade, setDecade] = useState("all");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || row.email || "").trim(),
      year: row.registrationDate,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = vintageLines(rows);
  const kinds = kindLines(rows);
  const spans = spanLines(rows);
  const seasons = seasonLines(rows);
  const decades = decadeLines(rows);
  const present = namedYears(rows);
  const presentKey = present.join("\n");
  const kindNames = namedKinds(rows);
  const spanNames = namedSpans(rows);
  const seasonNames = namedSeasons(rows);
  const decadeNames = namedDecades(rows);
  const blankCount = lines.find((line) => !line.year)?.count || 0;
  const blankDecade = decades.find((line) => !line.decade)?.count || 0;
  const lead = leadingYear(rows);
  const leadKind = leadingKind(rows);
  const leadSpan = leadingSpan(rows);
  const leadSeason = leadingSeason(rows);
  const leadDecade = leadingDecade(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenYears(readJson(VINTAGE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenYears(next);
    writeJson(VINTAGE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleYears(present, hiddenYears, showHidden);
  const year = activeYear(selected, chips);
  const kindOn = activeKind(kind, kindNames);
  const spanOn = activeSpan(span, spanNames);
  const seasonOn = activeSeason(season, seasonNames);
  const decadeOn = activeDecade(decade, decadeNames);
  const shown = visibleVintageCustomers(rows, year, blank, kindArg(kindOn), spanArg(spanOn), seasonArg(seasonOn), decadeArg(decadeOn), query);
  const widest = Math.max(1, ...kinds.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenYears(next);
    writeJson(VINTAGE_KEY, next);
    if (clear && activeYear(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-vnt" aria-label={v4("vntTitle")} data-vintage="1" data-interlude-salon="1">
      <header className="c4-vnt-head">
        <div>
          <p className="c4-pay-kicker">{v4("vntSub")}</p>
          <h2 className="c4-title">{v4("vntTitle")}</h2>
        </div>
        <p className="c4-itl-count">{v4("vntRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("vntHint")}</p>
      <p className="c4-meta">{v4("vntLocal")}</p>
      <p className="c4-meta">{v4("vntEscape")}</p>
      {lead ? <p className="c4-vnt-lead"><span>{v4("vntLead")}</span> {lead}</p> : null}
      {leadKind ? <p className="c4-vnt-lead"><span>{v4("vntLeadKind")}</span> {kindName(v4, leadKind)}</p> : null}
      {leadSpan ? <p className="c4-vnt-lead"><span>{v4("vntLeadSpan")}</span> {spanName(v4, leadSpan)}</p> : null}
      {leadSeason ? <p className="c4-vnt-lead"><span>{v4("vntLeadSeason")}</span> {seasonName(v4, leadSeason)}</p> : null}
      {leadDecade ? <p className="c4-vnt-lead"><span>{v4("vntLeadDecade")}</span> {leadDecade}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("vntBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("registration-vintages.csv", vintagesCsv(rows))}>{v4("vntCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("vntLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("vntFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-itl-empty">{v4("vntNone")}</p>}
      {kinds.length > 0 && (
        <section className="c4-vnt-chart" aria-label={v4("vntKind")}>
          {kinds.map((line) => {
            const share = vintageShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.kind || "blank";
            return (
              <p key={name} className="c4-vnt-col" data-kind={name}>
                <span>{kindName(v4, line.kind)}</span>
                <span className="c4-vnt-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("vntShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      {blankCount > 0 && (
        <button type="button" className="c4-vnt-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); setKind("all"); setSpan("all"); setSeason("all"); setDecade("all"); }}>
          <span>{v4("vntBlank")}</span>
          <span className="c4-itl-count">{blankCount}</span>
          <span className="c4-vnt-track" aria-hidden="true"><i style={{ width: `${vintageShare(blankCount, rows.length)}%` }} /></span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("vntKind")}>
        <button type="button" className="c4-chip" data-on={kindOn === "all" && !blank ? "1" : "0"} aria-pressed={kindOn === "all"} onClick={() => { setKind("all"); setBlank(false); }}>{v4("vntAllKind")}</button>
        {kinds.some((line) => !line.kind) && (
          <button type="button" className="c4-chip" data-on={kindOn === "blank" ? "1" : "0"} aria-pressed={kindOn === "blank"} onClick={() => { setKind(kindOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("vntBlankKind")}</button>
        )}
        {kindNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={kindOn === item ? "1" : "0"} aria-pressed={kindOn === item} onClick={() => { setBlank(false); setSelected(""); setKind(kindOn === item ? "all" : item); }}>{kindName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("vntSpans")}>
        <button type="button" className="c4-chip" data-on={spanOn === "all" && !blank ? "1" : "0"} aria-pressed={spanOn === "all"} onClick={() => { setSpan("all"); setBlank(false); }}>{v4("vntAllSpans")}</button>
        {spans.some((line) => !line.span) && (
          <button type="button" className="c4-chip" data-on={spanOn === "blank" ? "1" : "0"} aria-pressed={spanOn === "blank"} onClick={() => { setSpan(spanOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("vntBlankSpan")}</button>
        )}
        {spanNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={spanOn === item ? "1" : "0"} aria-pressed={spanOn === item} onClick={() => { setBlank(false); setSelected(""); setSpan(spanOn === item ? "all" : item); }}>{spanName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("vntSeasons")}>
        <button type="button" className="c4-chip" data-on={seasonOn === "all" && !blank ? "1" : "0"} aria-pressed={seasonOn === "all"} onClick={() => { setSeason("all"); setBlank(false); }}>{v4("vntAllSeasons")}</button>
        {seasons.some((line) => !line.season) && (
          <button type="button" className="c4-chip" data-on={seasonOn === "blank" ? "1" : "0"} aria-pressed={seasonOn === "blank"} onClick={() => { setSeason(seasonOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("vntBlankSeason")}</button>
        )}
        {seasonNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={seasonOn === item ? "1" : "0"} aria-pressed={seasonOn === item} onClick={() => { setBlank(false); setSelected(""); setSeason(seasonOn === item ? "all" : item); }}>{seasonName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("vntDecades")}>
        <button type="button" className="c4-chip" data-on={decadeOn === "all" && !blank ? "1" : "0"} aria-pressed={decadeOn === "all"} onClick={() => { setDecade("all"); setBlank(false); }}>{v4("vntAllDecades")}</button>
        {blankDecade > 0 && (
          <button type="button" className="c4-chip" data-on={decadeOn === "blank" ? "1" : "0"} aria-pressed={decadeOn === "blank"} onClick={() => { setDecade(decadeOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("vntBlankDecade")}</button>
        )}
        {decadeNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={decadeOn === item ? "1" : "0"} aria-pressed={decadeOn === item} onClick={() => { setBlank(false); setSelected(""); setDecade(decadeOn === item ? "all" : item); }}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("vntShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("vntShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("vntHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("vntTitle")}>
        <button type="button" className="c4-chip" data-on={!year && !blank && kindOn === "all" && spanOn === "all" && seasonOn === "all" && decadeOn === "all" ? "1" : "0"} aria-pressed={!year && !blank} onClick={() => { setSelected(""); setBlank(false); setKind("all"); setSpan("all"); setSeason("all"); setDecade("all"); }}>{v4("vntAll")}</button>
        {chips.map((item) => {
          const line = lines.find((row) => row.year === item);
          const count = line?.count || 0;
          const share = vintageShare(count, rows.length);
          const mark = decadeOf(item);
          const kindMark = kindOf(item) as VintageKind;
          const spanMark = spanOf(item) as VintageSpan;
          return (
            <span key={item} className="c4-vnt-pair" data-year={item}>
              <button type="button" className="c4-chip" data-on={year === item ? "1" : "0"} aria-pressed={year === item} onClick={() => { setBlank(false); setKind("all"); setSpan("all"); setSeason("all"); setDecade("all"); setSelected(year === item ? "" : item); }}>{item}</button>
              {kindMark ? <span className="c4-vnt-kind">{kindName(v4, kindMark)}</span> : null}
              {spanMark ? <span className="c4-vnt-span">{spanName(v4, spanMark)}</span> : null}
              {mark ? <span className="c4-vnt-decade">{v4("vntDecade")} {mark}</span> : null}
              <span className="c4-itl-count">{count}</span>
              <span className="c4-vnt-share">{v4("vntShare")} {share}%</span>
              <span className="c4-vnt-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleYear(hiddenYears, item, present), showHidden ? "" : item)}>{showHidden ? v4("vntShow") : v4("vntHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("vntSearch")}</span>
        <input className="c4-field" aria-label={v4("vntSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-itl-empty">{v4("vntEmpty")}</p>}
      <ul className="c4-vnt-rows">
        {shown.map((row) => {
          const name = vintageText(row.year);
          const mark = decadeOf(row.year);
          const kindMark = kindOf(row.year);
          const spanMark = spanOf(row.year);
          const seasonMark = seasonOf(row.year) as VintageSeason;
          return (
            <li key={row.id} data-year={name || "blank"}>
              <span className="c4-vnt-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("vntBlank")}</p>
              {kindMark ? <p className="c4-vnt-kind">{kindName(v4, kindMark)}</p> : null}
              {spanMark ? <p className="c4-vnt-span">{spanName(v4, spanMark)}</p> : null}
              {seasonMark ? <p className="c4-vnt-season">{seasonName(v4, seasonMark)}</p> : null}
              {mark ? <p className="c4-vnt-decade">{mark}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
