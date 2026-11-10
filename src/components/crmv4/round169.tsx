"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  NOTICE_KEY,
  PASS_KEY,
  PASS_VIEW_KEY,
  activeClose,
  activeGrade,
  activeLeaf,
  activeLength,
  activePost,
  activeReader,
  activeRoom,
  activeSeal,
  activeWeight,
  addPass,
  addPassView,
  bandCounts,
  bandOf,
  bulkPassDone,
  bulkPassPin,
  bulkPassRoom,
  clashPassCount,
  closeArg,
  closeLines,
  cyclePassGrade,
  dropPassView,
  editPass,
  editPassNote,
  gradeArg,
  gradeOf,
  leafArg,
  leafGap,
  latePass,
  leadingClose,
  leadingPost,
  lengthArg,
  lengthLines,
  namedCloses,
  namedLengths,
  namedPosts,
  nextPass,
  noticeClose,
  noticeLength,
  noticePost,
  noticeShare,
  passClashIds,
  passCopy,
  passCounts,
  passGrades,
  passReaders,
  passRooms,
  passSeals,
  passShare,
  passTimeline,
  passesCsv,
  postArg,
  postLines,
  presentNotices,
  readHiddenNotices,
  readPassViews,
  readPasses,
  readerArg,
  readerLoad,
  resetPasses,
  roomArg,
  roomOf,
  sealArg,
  setPassDone,
  setPassHeld,
  setPassPin,
  suggestReader,
  suggestRoom,
  toggleNotice,
  visibleNoticeCustomers,
  visibleNotices,
  visiblePasses,
  weightArg,
  weightClashCount,
  weightClashIds,
  noticesCsv,
  type NoticeClose,
  type NoticeLength,
  type NoticePost,
  type NoticeRow,
  type PassCard,
  type PassGrade,
  type PassRoom,
  type PassTray,
  type PassView,
} from "@/lib/crmv4/round169";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  loginBlockedMessage?: string | null;
};

type GlanceRow = NoticeRow & { id: string };

const BANDS = ["opening", "middle", "closing"] as const;

function roomName(v4: V4, room: PassRoom | string): string {
  if (room === "alcove") return v4("atpRoomAlcove");
  if (room === "nave") return v4("atpRoomNave");
  if (room === "choir") return v4("atpRoomChoir");
  if (room === "cloister") return v4("atpRoomCloister");
  return v4("atpBlankRoom");
}

function gradeName(v4: V4, grade: PassGrade): string {
  if (grade === "sketch") return v4("atpSketch");
  if (grade === "proof") return v4("atpProof");
  if (grade === "press") return v4("atpPress");
  return v4("atpBlankGrade");
}

function leafName(v4: V4, name: string): string {
  if (name === "opening") return v4("atpOpening");
  if (name === "middle") return v4("atpMiddle");
  if (name === "closing") return v4("atpClosing");
  if (name === "edge") return v4("atpEdge");
  if (name === "body") return v4("atpBody");
  if (/^(?:[1-9]|1[0-2])$/.test(name)) return name;
  return v4("atpBlankLeaf");
}

function weightName(v4: V4, weight: number | null): string {
  if (weight === 1) return v4("atpWeight1");
  if (weight === 2) return v4("atpWeight2");
  if (weight === 3) return v4("atpWeight3");
  if (weight === 4) return v4("atpWeight4");
  return v4("atpBlankWeight");
}

function postName(v4: V4, name: string): string {
  if (name === "set") return v4("nbmSet");
  if (name === "clear") return v4("nbmClear");
  return v4("nbmUnmarked");
}

function lengthName(v4: V4, name: string): string {
  if (name === "slip") return v4("nbmSlip");
  if (name === "card") return v4("nbmCard");
  if (name === "sheet") return v4("nbmSheet");
  return v4("nbmUnmarked");
}

function closeName(v4: V4, name: string): string {
  if (name === "stop") return v4("nbmStop");
  if (name === "ask") return v4("nbmAsk");
  if (name === "open") return v4("nbmOpen");
  return v4("nbmUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "atpAuditSave",
    edit: "atpAuditEdit",
    grade: "atpAuditGrade",
    pin: "atpAuditPin",
    unpin: "atpAuditUnpin",
    hold: "atpAuditHold",
    release: "atpAuditRelease",
    done: "atpAuditDone",
    reopen: "atpAuditReopen",
    room: "atpAuditRoom",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function leafLabel(leaf: number | null): string {
  return leaf === null ? "—" : String(leaf);
}

function gapLabel(v4: V4, leaf: number | null, desk: string): string {
  const gap = leafGap(leaf, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("atpPast")} ${gap}`;
  if (gap < 0) return `${v4("atpAhead")} ${Math.abs(gap)}`;
  return v4("atpDue");
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

function sameCards(left: readonly PassCard[], right: readonly PassCard[]): boolean {
  return left.length === right.length && left.every((card, index) => card.id === right[index]?.id && card.title === right[index]?.title && card.note === right[index]?.note && card.audit === right[index]?.audit);
}

export function AtelierPasses({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<PassCard[]>([]);
  const [views, setViews] = useState<PassView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [reader, setReader] = useState("");
  const [leaf, setLeaf] = useState("");
  const [room, setRoom] = useState("");
  const [seal, setSeal] = useState("");
  const [grade, setGrade] = useState("");
  const [weight, setWeight] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<PassTray>("open");
  const [readerFilter, setReaderFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [sealFilter, setSealFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [leafFilter, setLeafFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [pressOnly, setPressOnly] = useState(false);
  const [edgeOnly, setEdgeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveRoom, setMoveRoom] = useState("alcove");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readPasses(readJson(PASS_KEY, []));
    const saved = readPassViews(readJson(PASS_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(PASS_KEY, next);
    writeJson(PASS_VIEW_KEY, saved);
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
  const readers = passReaders(cards);
  const rooms = passRooms(cards);
  const seals = passSeals(cards);
  const grades = passGrades(cards);
  const bars = bandCounts(cards);
  const readerOn = activeReader(readerFilter, readers);
  const roomOn = activeRoom(roomFilter, rooms);
  const sealOn = activeSeal(sealFilter, seals);
  const gradeOn = activeGrade(gradeFilter, grades);
  const leafOn = activeLeaf(leafFilter);
  const weightOn = activeWeight(weightFilter);
  const picked = leafArg(leafOn);
  const shown = visiblePasses(
    cards,
    tray,
    query,
    readerArg(readerOn),
    roomArg(roomOn),
    sealArg(sealOn),
    gradeArg(gradeOn),
    picked.exact,
    picked.pick,
    weightArg(weightOn),
    pressOnly,
    edgeOnly,
  );
  const timeline = passTimeline(cards, query);
  const counts = passCounts(cards, desk);
  const clashes = clashPassCount(cards);
  const weightClashes = weightClashCount(cards);
  const total = cards.length;
  const nextId = nextPass(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);
  const load = readerLoad(cards, reader);
  const suggested = suggestRoom(cards);
  const lightReader = suggestReader(cards);

  function store(next: PassCard[]) {
    setCards(next);
    writeJson(PASS_KEY, next);
  }

  function storeViews(next: PassView[]) {
    setViews(next);
    writeJson(PASS_VIEW_KEY, next);
  }

  function clearDraft() {
    setTitle("");
    setNote("");
    setReader("");
    setLeaf("");
    setRoom("");
    setSeal("");
    setGrade("");
    setWeight("");
  }

  function copyCard(card: PassCard) {
    const body = passCopy(card.title);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: PassView) {
    setTray(view.tray);
    setQuery(view.query);
    setReaderFilter(activeReader(view.reader, passReaders(cards)));
    setRoomFilter(activeRoom(view.room, passRooms(cards)));
    setSealFilter(activeSeal(view.seal, passSeals(cards)));
    setGradeFilter(activeGrade(view.grade, passGrades(cards)));
    setLeafFilter(activeLeaf(view.leaf));
    setWeightFilter(activeWeight(view.weight));
    setBoard("cards");
    setPressOnly(false);
    setEdgeOnly(false);
  }

  return (
    <section className="c4-atp" aria-label={v4("atpTitle")} data-passes="1" data-role={role}>
      <header className="c4-atp-head">
        <p className="c4-atp-plate" data-logo="mono">{v4("atpLogo")}</p>
        <div>
          <p className="c4-atp-kicker">{v4("atpSub")}</p>
          <h2 className="c4-title">{v4("atpTitle")}</h2>
        </div>
        <p className="c4-atp-count">{shown.length}</p>
      </header>
      <details className="c4-atp-rules">
        <summary>{v4("atpRules")}</summary>
        <p className="c4-meta">{v4("atpHint")}</p>
        <p className="c4-meta">{v4("atpLocal")}</p>
        <p className="c4-meta">{v4("atpBlank")}</p>
        <p className="c4-meta">{v4("atpReaderBlank")}</p>
        <p className="c4-meta">{v4("atpLeafBlank")}</p>
        <p className="c4-meta">{v4("atpRoomBlank")}</p>
        <p className="c4-meta">{v4("atpSealBlank")}</p>
        <p className="c4-meta">{v4("atpGradeBlank")}</p>
        <p className="c4-meta">{v4("atpWeightBlank")}</p>
        <p className="c4-meta">{v4("atpNoteBlank")}</p>
        <p className="c4-meta">{v4("atpEscape")}</p>
        <p className="c4-meta">{v4("atpSlash")}</p>
        <p className="c4-meta">{v4("atpNew")}</p>
      </details>
      {viewer ? <p className="c4-atp-notice" role="status">{v4("atpViewer")}</p> : null}
      <p className="c4-atp-notice" role="status">
        <span>{v4("atpNotice")}</span>
        <span className="c4-atp-count">{counts.edge}</span>
        <button type="button" className="c4-btn" aria-pressed={edgeOnly} onClick={() => { setEdgeOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {edgeOnly ? v4("atpNoticeAll") : v4("atpNoticeEdge")}
        </button>
      </p>
      <p className="c4-atp-notice" role="status">
        <span>{v4("atpLate")}</span>
        <span className="c4-atp-count">{counts.late}</span>
      </p>
      <p className="c4-atp-notice" role="status">
        <span>{v4("atpClash")}</span>
        <span className="c4-atp-count">{clashes}</span>
      </p>
      <p className="c4-atp-notice" role="status">
        <span>{v4("atpWeightClash")}</span>
        <span className="c4-atp-count">{weightClashes}</span>
      </p>
      <p className="c4-atp-suggest" role="status">
        <span>{v4("atpSuggest")}</span>
        <strong>{roomName(v4, suggested)}</strong>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setRoom(suggested)}>{v4("atpUseRoom")}</button>
      </p>
      <p className="c4-atp-suggest" role="status">
        <span>{v4("atpSuggestReader")}</span>
        <strong>{lightReader || v4("atpBlankReader")}</strong>
        <button type="button" className="c4-btn" disabled={viewer || !lightReader} onClick={() => setReader(lightReader)}>{v4("atpUseReader")}</button>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-atp-pins" aria-label={v4("atpPinned")}>
          {pinned.map((card) => (
            <li key={card.id}>
              <button type="button" className="c4-chip" onClick={() => { setQuery(card.title); setBoard("cards"); }}>{card.title}</button>
            </li>
          ))}
        </ul>
      )}
      <section className="c4-atp-kpi" aria-label={v4("atpKpi")}>
        {(["open", "held", "done", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = passShare(count, total);
          const label = key === "open" ? v4("atpOpen") : key === "held" ? v4("atpHeld") : key === "done" ? v4("atpFiled") : v4("atpPin");
          return (
            <p key={key} className="c4-atp-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("atpShare")} {share}%</span>
              <span className="c4-atp-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-atp-chart" aria-label={v4("atpChart")}>
        <p className="c4-atp-kicker">{v4("atpChart")}</p>
        {BANDS.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-atp-col" data-on={leafOn === name ? "1" : "0"} aria-pressed={leafOn === name} onClick={() => setLeafFilter(leafOn === name ? "all" : name)}>
              <span>{leafName(v4, name)}</span>
              <span className="c4-atp-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-atp-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addPass(cards, { id: `atp-${Date.now()}`, title, note, reader, leaf, room, seal, grade, weight });
        if (sameCards(next, cards)) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("atpLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("atpLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("atpNote")}</span>
          <input className="c4-field" aria-label={v4("atpNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("atpReader")}</span>
          <input className="c4-field" aria-label={v4("atpReader")} value={reader} disabled={viewer} onChange={(event) => setReader(event.target.value)} />
        </label>
        <p className="c4-meta" role="status">{v4("atpLoad")} {load}</p>
        <label className="c4-lab">
          <span>{v4("atpLeaf")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("atpLeaf")} value={leaf} disabled={viewer} onChange={(event) => setLeaf(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("atpRoom")}</span>
          <select className="c4-select" aria-label={v4("atpRoom")} value={room} disabled={viewer} onChange={(event) => setRoom(event.target.value)}>
            <option value="">{v4("atpBlankRoom")}</option>
            <option value="alcove">{v4("atpRoomAlcove")}</option>
            <option value="nave">{v4("atpRoomNave")}</option>
            <option value="choir">{v4("atpRoomChoir")}</option>
            <option value="cloister">{v4("atpRoomCloister")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("atpSeal")}</span>
          <input className="c4-field" aria-label={v4("atpSeal")} value={seal} disabled={viewer} onChange={(event) => setSeal(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("atpGrade")}</span>
          <select className="c4-select" aria-label={v4("atpGrade")} value={grade} disabled={viewer} onChange={(event) => setGrade(event.target.value)}>
            <option value="">{v4("atpBlankGrade")}</option>
            <option value="sketch">{v4("atpSketch")}</option>
            <option value="proof">{v4("atpProof")}</option>
            <option value="press">{v4("atpPress")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("atpWeight")}</span>
          <select className="c4-select" aria-label={v4("atpWeight")} value={weight} disabled={viewer} onChange={(event) => setWeight(event.target.value)}>
            <option value="">{v4("atpBlankWeight")}</option>
            <option value="1">{v4("atpWeight1")}</option>
            <option value="2">{v4("atpWeight2")}</option>
            <option value="3">{v4("atpWeight3")}</option>
            <option value="4">{v4("atpWeight4")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("atpAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("atpTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("atpOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} aria-pressed={tray === "held"} onClick={() => setTray("held")}>{v4("atpHeld")}</button>
        <button type="button" className="c4-chip" data-on={tray === "done" ? "1" : "0"} aria-pressed={tray === "done"} onClick={() => setTray("done")}>{v4("atpFiled")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("atpTimeline")}</button>
        <button type="button" className="c4-chip" data-on={pressOnly ? "1" : "0"} aria-pressed={pressOnly} onClick={() => setPressOnly((value) => !value)}>{v4("atpPressOnly")}</button>
        <button type="button" className="c4-chip" data-on={edgeOnly ? "1" : "0"} aria-pressed={edgeOnly} onClick={() => { setEdgeOnly((value) => !value); setTray("open"); }}>{v4("atpEdgeOnly")}</button>
        <button type="button" className="c4-btn" onClick={() => download("atelier-passes.csv", passesCsv(cards, desk))}>{v4("atpCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkPassPin(cards, shown.map((card) => card.id), true))}>{v4("atpBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkPassDone(cards, shown.map((card) => card.id), true))}>{v4("atpBulkDone")}</button>
        <label className="c4-lab">
          <span>{v4("atpBulkRoom")}</span>
          <select className="c4-select" aria-label={v4("atpBulkRoom")} value={moveRoom} disabled={viewer} onChange={(event) => setMoveRoom(event.target.value)}>
            <option value="alcove">{v4("atpRoomAlcove")}</option>
            <option value="nave">{v4("atpRoomNave")}</option>
            <option value="choir">{v4("atpRoomChoir")}</option>
            <option value="cloister">{v4("atpRoomCloister")}</option>
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkPassRoom(cards, shown.map((card) => card.id), moveRoom))}>{v4("atpBulkRoom")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetPasses())}>{v4("atpReset")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("atpSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("atpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <label className="c4-lab">
        <span>{v4("atpDesk")}</span>
        <input className="c4-field" inputMode="numeric" aria-label={v4("atpDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
      </label>
      <p className="c4-meta" role="status">
        {v4("atpNext")} {nextCard ? nextCard.title : v4("atpNextNone")}
      </p>
      <div className="c4-row" role="group" aria-label={v4("atpReaders")}>
        <button type="button" className="c4-chip" data-on={readerOn === "all" ? "1" : "0"} aria-pressed={readerOn === "all"} onClick={() => setReaderFilter("all")}>{v4("atpAllReaders")}</button>
        <button type="button" className="c4-chip" data-on={readerOn === "blank" ? "1" : "0"} aria-pressed={readerOn === "blank"} onClick={() => setReaderFilter("blank")}>{v4("atpBlankReader")}</button>
        {readers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={readerOn === name ? "1" : "0"} aria-pressed={readerOn === name} onClick={() => setReaderFilter(name)}>{name}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("atpRooms")}>
        <button type="button" className="c4-chip" data-on={roomOn === "all" ? "1" : "0"} aria-pressed={roomOn === "all"} onClick={() => setRoomFilter("all")}>{v4("atpAllRooms")}</button>
        <button type="button" className="c4-chip" data-on={roomOn === "blank" ? "1" : "0"} aria-pressed={roomOn === "blank"} onClick={() => setRoomFilter("blank")}>{v4("atpBlankRoom")}</button>
        {rooms.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={roomOn === name ? "1" : "0"} aria-pressed={roomOn === name} onClick={() => setRoomFilter(name)}>{roomName(v4, name)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("atpSeals")}>
        <button type="button" className="c4-chip" data-on={sealOn === "all" ? "1" : "0"} aria-pressed={sealOn === "all"} onClick={() => setSealFilter("all")}>{v4("atpAllSeals")}</button>
        <button type="button" className="c4-chip" data-on={sealOn === "blank" ? "1" : "0"} aria-pressed={sealOn === "blank"} onClick={() => setSealFilter("blank")}>{v4("atpBlankSeal")}</button>
        {seals.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={sealOn === name ? "1" : "0"} aria-pressed={sealOn === name} onClick={() => setSealFilter(name)}>{name}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("atpGrades")}>
        <button type="button" className="c4-chip" data-on={gradeOn === "all" ? "1" : "0"} aria-pressed={gradeOn === "all"} onClick={() => setGradeFilter("all")}>{v4("atpAllGrades")}</button>
        <button type="button" className="c4-chip" data-on={gradeOn === "blank" ? "1" : "0"} aria-pressed={gradeOn === "blank"} onClick={() => setGradeFilter("blank")}>{v4("atpBlankGrade")}</button>
        {grades.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={gradeOn === name ? "1" : "0"} aria-pressed={gradeOn === name} onClick={() => setGradeFilter(name)}>{gradeName(v4, name)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("atpLeaves")}>
        {(["all", "blank", "opening", "middle", "closing", "edge", "body"] as const).map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={leafOn === name ? "1" : "0"} aria-pressed={leafOn === name} onClick={() => setLeafFilter(name)}>
            {name === "all" ? v4("atpAllLeaves") : leafName(v4, name)}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("atpWeights")}>
        {(["all", "blank", "1", "2", "3", "4"] as const).map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={weightOn === name ? "1" : "0"} aria-pressed={weightOn === name} onClick={() => setWeightFilter(name)}>
            {name === "all" ? v4("atpAllWeights") : name === "blank" ? v4("atpBlankWeight") : weightName(v4, Number(name))}
          </button>
        ))}
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addPassView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          reader: readerOn,
          room: roomOn,
          seal: sealOn,
          grade: gradeOn,
          leaf: leafOn,
          weight: weightOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("atpViewName")}</span>
          <input className="c4-field" aria-label={v4("atpViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("atpSaveView")}</button>
      </form>
      <section aria-label={v4("atpViews")}>
        <p className="c4-atp-kicker">{v4("atpViews")}</p>
        {!views.length && <p className="c4-atp-empty">{v4("atpViewEmpty")}</p>}
        <ul className="c4-atp-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropPassView(views, view.id))}>{v4("atpDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-atp-empty">{v4("atpEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-atp-rows">
          {shown.map((card) => {
            const clashesOn = passClashIds(cards, card.id);
            const weightsOn = weightClashIds(cards, card.id);
            const gap = gapLabel(v4, card.leaf, desk);
            const band = bandOf(card.leaf);
            const editingCard = editing === card.id;
            const late = latePass(card, desk);
            return (
              <li key={card.id} data-grade={card.grade || "blank"} data-room={card.room || "blank"} data-band={band} data-late={late ? "1" : "0"}>
                <span className="c4-atp-mark" aria-hidden="true">{leafLabel(card.leaf)}</span>
                <div>
                  {editingCard ? (
                    <form className="c4-row" onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      const titled = editPass(cards, card.id, draft);
                      store(editPassNote(titled, card.id, noteDraft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("atpEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("atpNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("atpSaveEdit")}</button>
                    </form>
                  ) : (
                    <>
                      <p>{card.title}</p>
                      {card.note ? <p className="c4-meta">{card.note}</p> : null}
                    </>
                  )}
                  <p className="c4-meta">
                    {card.reader || v4("atpBlankReader")}
                    {" · "}
                    {leafLabel(card.leaf)}
                    {" · "}
                    {roomName(v4, roomOf(card.room))}
                    {" · "}
                    {card.seal || v4("atpBlankSeal")}
                    {" · "}
                    {gradeName(v4, gradeOf(card.grade))}
                    {" · "}
                    {weightName(v4, card.weight)}
                    {band === "blank" ? "" : ` · ${leafName(v4, band)}`}
                    {gap ? ` · ${gap}` : ""}
                    {late ? ` · ${v4("atpLate")}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("atpAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashesOn.length ? `${v4("atpClash")} ${clashesOn.length}` : v4("atpClashNone")}
                    {" · "}
                    {weightsOn.length ? `${v4("atpWeightClash")} ${weightsOn.length}` : v4("atpWeightClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("atpCopied") : v4("atpCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); setNoteDraft(card.note); }}>{v4("atpEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePassGrade(cards, card.id))}>{v4("atpGradeUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setPassPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("atpUnpin") : v4("atpPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.held} onClick={() => store(setPassHeld(cards, card.id, !card.held))}>{card.held ? v4("atpRelease") : v4("atpHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.done} onClick={() => store(setPassDone(cards, card.id, !card.done))}>{card.done ? v4("atpReopen") : v4("atpDone")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-atp-time">
          {timeline.map((card) => (
            <li key={card.id} data-band={bandOf(card.leaf)}>
              <span className="c4-atp-clock">{leafLabel(card.leaf)}</span>
              <p>{card.title}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function BlockNotices({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenNotices, setHiddenNotices] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [length, setLength] = useState("all");
  const [close, setClose] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      notice: row.loginBlockedMessage,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const postsOn = postLines(rows);
  const lengths = lengthLines(rows);
  const closes = closeLines(rows);
  const present = presentNotices(rows);
  const presentKey = present.join("\n");
  const postNames = namedPosts(rows);
  const lengthNames = namedLengths(rows);
  const closeNames = namedCloses(rows);
  const leadPost = leadingPost(rows);
  const leadClose = leadingClose(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenNotices(readJson(NOTICE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenNotices(next);
    writeJson(NOTICE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleNotices(present, hiddenNotices, showHidden);
  const lengthOn = activeLength(length, lengthNames);
  const closeOn = activeClose(close, closeNames);
  const postOn = selected ? activePost(selected, postNames) : "all";
  const shown = visibleNoticeCustomers(
    rows,
    selected ? postArg(postOn === "all" && selected === "blank" ? "blank" : postOn) : null,
    lengthArg(lengthOn),
    closeArg(closeOn),
    query,
  );
  const widest = Math.max(1, ...postsOn.map((line) => line.count));
  const setCount = postsOn.find((line) => line.post === "set")?.count || 0;

  function store(next: string[], clear: string) {
    setHiddenNotices(next);
    writeJson(NOTICE_KEY, next);
    if (clear && selected === clear) setSelected("");
  }

  return (
    <section className="c4-nbm" aria-label={v4("nbmTitle")} data-notices="1">
      <header className="c4-nbm-head">
        <div>
          <p className="c4-atp-kicker">{v4("nbmSub")}</p>
          <h2 className="c4-title">{v4("nbmTitle")}</h2>
        </div>
        <p className="c4-atp-count">{v4("nbmRows")} {rows.length}</p>
      </header>
      <details className="c4-atp-rules">
        <summary>{v4("nbmRules")}</summary>
        <p className="c4-meta">{v4("nbmHint")}</p>
        <p className="c4-meta">{v4("nbmLocal")}</p>
        <p className="c4-meta">{v4("nbmEscape")}</p>
      </details>
      <p className="c4-atp-notice" role="status">
        <span>{v4("nbmSetNotice")}</span>
        <span className="c4-atp-count">{setCount}</span>
      </p>
      {leadPost ? <p className="c4-nbm-lead"><span>{v4("nbmLeadPost")}</span> {postName(v4, leadPost)}</p> : null}
      {leadClose ? <p className="c4-nbm-lead"><span>{v4("nbmLeadClose")}</span> {closeName(v4, leadClose)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("nbmBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("block-notices.csv", noticesCsv(rows))}>{v4("nbmCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("nbmLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("nbmFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-atp-empty">{v4("nbmNone")}</p>}
      {postsOn.length > 0 && (
        <section className="c4-nbm-chart" aria-label={v4("nbmAllPosts")}>
          {postsOn.map((line) => {
            const share = noticeShare(line.count, rows.length);
            const bar = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.post || "blank";
            return (
              <p key={name} className="c4-nbm-col" data-post={name}>
                <span>{postName(v4, line.post)}</span>
                <span className="c4-atp-track" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("nbmShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("nbmShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("nbmShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("nbmHidden")}</button>
      </div>
      <div className="c4-nbm-bands" role="group" aria-label={v4("nbmAllPosts")}>
        <button type="button" className="c4-nbm-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("nbmAllPosts")}</span>
          <span className="c4-atp-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const count = rows.filter((row) => (noticePost(row.notice) || "blank") === item).length;
          const share = noticeShare(count, rows.length);
          return (
            <span key={item} className="c4-nbm-pair">
              <button type="button" className="c4-nbm-band" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => setSelected(selected === item ? "" : item)}>
                <span>{postName(v4, item === "blank" ? "" : item)}</span>
                <span className="c4-atp-count">{count}</span>
                <span>{v4("nbmShare")} {share}%</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleNotice(hiddenNotices, item, present), showHidden ? "" : item)}>{showHidden ? v4("nbmShow") : v4("nbmHide")}</button>
            </span>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("nbmLengths")}>
        <button type="button" className="c4-chip" data-on={lengthOn === "all" ? "1" : "0"} aria-pressed={lengthOn === "all"} onClick={() => setLength("all")}>{v4("nbmAllLengths")}</button>
        {lengths.filter((line) => line.length).map((line) => (
          <button key={line.length} type="button" className="c4-chip" data-on={lengthOn === line.length ? "1" : "0"} aria-pressed={lengthOn === line.length} onClick={() => setLength(lengthOn === line.length ? "all" : line.length)}>
            {lengthName(v4, line.length)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("nbmCloses")}>
        <button type="button" className="c4-chip" data-on={closeOn === "all" ? "1" : "0"} aria-pressed={closeOn === "all"} onClick={() => setClose("all")}>{v4("nbmAllCloses")}</button>
        {closes.filter((line) => line.close).map((line) => (
          <button key={line.close} type="button" className="c4-chip" data-on={closeOn === line.close ? "1" : "0"} aria-pressed={closeOn === line.close} onClick={() => setClose(closeOn === line.close ? "all" : line.close)}>
            {closeName(v4, line.close)} {line.count}
          </button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("nbmSearch")}</span>
        <input className="c4-field" aria-label={v4("nbmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-atp-empty">{v4("nbmEmpty")}</p>}
      <ul className="c4-nbm-rows">
        {shown.map((row) => {
          const post = noticePost(row.notice) as NoticePost;
          const lengthMark = noticeLength(row.notice) as NoticeLength;
          const closeMark = noticeClose(row.notice) as NoticeClose;
          return (
            <li key={row.id} data-post={post || "blank"} data-length={lengthMark || "blank"} data-close={closeMark || "blank"}>
              <span className="c4-nbm-face" aria-hidden="true">{post ? post.slice(0, 1).toUpperCase() : "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {postName(v4, post)}
                {" · "}
                {lengthName(v4, lengthMark)}
                {" · "}
                {closeName(v4, closeMark)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
