"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CARREL_ROOMS,
  CRL_DENSITY_KEY,
  CRL_KEY,
  CRL_VIEW_KEY,
  LGS_KEY,
  LGS_REVIEW_KEY,
  activeCloth,
  activeRoom,
  activeShelf,
  activeStay,
  activeTone,
  addCarrelSlip,
  addCarrelTag,
  addCarrelView,
  bulkCarrelArchive,
  bulkCarrelBright,
  bulkCarrelPin,
  bulkCarrelTag,
  bulkCarrelWool,
  bulkSealReview,
  busiestKeeper,
  carrelCopy,
  carrelCounts,
  carrelCsv,
  carrelDensity,
  carrelKeepers,
  carrelShare,
  carrelSort,
  carrelTimeline,
  clashRoomCount,
  cycleTone,
  dropCarrelView,
  editCarrel,
  editCarrelNote,
  fairKeeper,
  holdFocusedSlip,
  houseCloth,
  hueSealCount,
  idleSlip,
  idleSlips,
  laneSealCount,
  lateSlip,
  leadingSeal,
  leadingSealHue,
  lengthenFocusedSlip,
  lengthenStay,
  lowerFocusedSlip,
  lowerShelf,
  matchedSlips,
  moveCarrelFocus,
  neighborSlipCount,
  nextSlip,
  overdueSlip,
  pairKeeperCount,
  peakRoom,
  pinFocusedSlip,
  presentSealLanes,
  quietRoom,
  raiseFocusedSlip,
  raiseShelf,
  readCarrelSlips,
  readCarrelViews,
  readHiddenSeals,
  readReviewedSeals,
  reminderSlips,
  restingSlip,
  ribbonFocusedSlip,
  roomBand,
  rushSlip,
  sealBound,
  sealCopy,
  sealHue,
  sealJoin,
  sealLane,
  sealLanes,
  sealLanesCsv,
  sealNotch,
  sealRowsCsv,
  sealShare,
  sealStamp,
  sealState,
  sealStep,
  sealWide,
  setSlipArchive,
  setSlipCloth,
  setSlipHold,
  setSlipPin,
  setSlipRibbon,
  sharedSealCount,
  shelfLoad,
  shortenFocusedSlip,
  shortenStay,
  sortCarrel,
  stayClashCount,
  suggestCloth,
  suggestStay,
  tagFocusedSlip,
  toggleSeal,
  toggleSealReview,
  toneFocusedSlip,
  visibleCarrel,
  visibleSealLanes,
  visibleSeals,
  type CarrelSlip,
  type CarrelView,
  type SealReview,
  type SealRow,
  type SealShape,
  type SealValue,
  type SlipDensity,
  type SlipSort,
  type SlipTray,
} from "@/lib/crmv4/round248";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const CLOTHS = ["linen", "velvet", "wool"] as const;
const TONES = ["hush", "warm", "bright"] as const;
const STAYS = ["15", "30", "45"] as const;
const SHELVES = ["2", "4", "6", "8"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "crlAuditSave",
  edit: "crlAuditEdit",
  note: "crlAuditNote",
  tone: "crlAuditTone",
  pin: "crlAuditPin",
  unpin: "crlAuditUnpin",
  hold: "crlAuditHold",
  resume: "crlAuditResume",
  archive: "crlAuditArchive",
  open: "crlAuditOpen",
  wool: "crlAuditWool",
  tag: "crlAuditTag",
  shelf: "crlAuditShelf",
  stay: "crlAuditStay",
  short: "crlAuditShort",
  ribbon: "crlAuditRibbon",
};

const ROOM_KEY: Record<string, CrmV4CopyKey> = {
  bay: "crlBay",
  nook: "crlNook",
  ledge: "crlLedge",
  stack: "crlStack",
  mezz: "crlMezz",
  crown: "crlCrown",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  accountLoginId?: string | null;
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

function clothLabel(v4: V4, cloth: string): string {
  if (cloth === "LINEN" || cloth === "linen") return v4("crlLinen");
  if (cloth === "VELVET" || cloth === "velvet") return v4("crlVelvet");
  if (cloth === "WOOL" || cloth === "wool") return v4("crlWool");
  return v4("crlBlankWool");
}

function toneLabel(v4: V4, tone: string): string {
  if (tone === "hush") return v4("crlHush");
  if (tone === "warm") return v4("crlWarm");
  if (tone === "bright") return v4("crlBright");
  return v4("crlBlankTone");
}

function roomLabel(v4: V4, room: string): string {
  const key = ROOM_KEY[room];
  return key ? v4(key) : v4("crlBlank");
}

function bandLabel(v4: V4, band: string): string {
  if (band === "early") return v4("crlEarly");
  if (band === "mid") return v4("crlMid");
  if (band === "late") return v4("crlLateBand");
  return v4("crlBlank");
}

function laneLabel(v4: V4, lane: string): string {
  if (lane === "twin") return v4("lgsTwin");
  if (lane === "zero") return v4("lgsZero");
  if (lane === "low") return v4("lgsLow");
  if (lane === "high") return v4("lgsHigh");
  if (lane === "short") return v4("lgsShort");
  if (lane === "full") return v4("lgsFull");
  if (lane === "even") return v4("lgsEven");
  if (lane === "plain") return v4("lgsPlain");
  return v4("lgsUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  if (hue === "gilt") return v4("lgsGilt");
  if (hue === "slate") return v4("lgsSlate");
  if (hue === "sand") return v4("lgsSand");
  if (hue === "clay") return v4("lgsClay");
  if (hue === "soot") return v4("lgsSoot");
  if (hue === "pearl") return v4("lgsPearl");
  if (hue === "mist") return v4("lgsMist");
  return v4("lgsUnmarked");
}

export function CarrelSlips({ base, v4 }: { base: string; v4: V4 }) {
  const [slips, setSlips] = useState<CarrelSlip[]>([]);
  const [views, setViews] = useState<CarrelView[]>([]);
  const [density, setDensity] = useState<SlipDensity>("airy");
  const [sort, setSort] = useState<SlipSort>("room");
  const [tray, setTray] = useState<SlipTray>("open");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [clothFilter, setClothFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [stayFilter, setStayFilter] = useState("all");
  const [shelfFilter, setShelfFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("nook");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [room, setRoom] = useState("");
  const [cloth, setCloth] = useState("");
  const [tone, setTone] = useState("");
  const [stayMin, setStayMin] = useState("");
  const [shelf, setShelf] = useState("2");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [board, setBoard] = useState<"hall" | "index">("hall");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    setSlips(readCarrelSlips(readJson(CRL_KEY, [])));
    setViews(readCarrelViews(readJson(CRL_VIEW_KEY, [])));
    setDensity(carrelDensity(readJson(CRL_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortCarrel(visibleCarrel(slips, tray, query, keeperFilter, clothFilter, toneFilter, roomFilter, stayFilter, shelfFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = carrelCounts(slips, shown, desk);
  const timeline = carrelTimeline(slips);
  const reminders = reminderSlips(slips);
  const idling = idleSlips(slips);
  const keepers = carrelKeepers(slips);
  const focused = shown[focusAt];
  const ids = shown.map((slip) => slip.id);
  function store(next: CarrelSlip[]) {
    const saved = readCarrelSlips(next);
    setSlips(saved);
    writeJson(CRL_KEY, saved);
  }
  function storeViews(next: CarrelView[]) {
    const saved = readCarrelViews(next);
    setViews(saved);
    writeJson(CRL_VIEW_KEY, saved);
  }
  function storeDensity(next: SlipDensity) {
    setDensity(next);
    writeJson(CRL_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: CarrelView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper || "all");
    setClothFilter(view.cloth);
    setToneFilter(view.tone);
    setRoomFilter(view.room);
    setStayFilter(view.stay);
    setShelfFilter(view.shelf);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setRoom("");
        setCloth("");
        setTone("");
        setStayMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveCarrelFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveCarrelFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(holdFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        if (!viewer) store(toneFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        if (!viewer) store(lengthenFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(shortenFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        if (!viewer) store(tagFocusedSlip(slips, ids, focusAt, "x"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(ribbonFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        if (!viewer) store(raiseFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(lowerFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        setBoard((value) => value === "hall" ? "index" : "hall");
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const bars = CARREL_ROOMS.map((item) => ({ room: item, count: slips.filter((slip) => !slip.archived && !slip.held && slip.room === item).length }));
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const suggested = suggestCloth(slips);
  const suggestedStay = suggestStay(slips, new Date().getUTCHours());
  const fair = fairKeeper(slips, keepers.join(", "));
  return (
    <section className="c4-crl" aria-label={v4("crlTitle")} data-slips="1" data-desk="carrel" data-role={role} data-density={density}>
      <header className="c4-crl-mast">
        <p className="c4-crl-seal" data-logo="mono">{v4("crlLogo")}</p>
        <div className="c4-crl-rule" aria-hidden="true"><i /><i /><i /><i /></div>
        <div>
          <p className="c4-crl-kicker">{v4("crlSub")}</p>
          <h2 className="c4-title">{v4("crlTitle")}</h2>
        </div>
        <ol className="c4-crl-index" aria-label={v4("crlTitle")}>
          <li data-tone="gold">{v4("crlChampagne")}</li>
          <li data-tone="ink">{v4("crlGraphite")}</li>
          <li data-tone="ivory">{v4("crlIvory")}</li>
        </ol>
      </header>
      <p className="c4-crl-links">
        <Link href={crmv4Href(base, "lgs")}>{v4("lgsTitle")}</Link>
        <Link href={crmv4Href(base, "quiet")}>{v4("crlQuietDesk")}</Link>
        <Link href={crmv4Href(base, "scratch")}>{v4("crlScratch")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("crlCustomers")}</Link>
      </p>
      {viewer && <p className="c4-crl-note">{v4("crlViewer")}</p>}
      <p className="c4-crl-lead">{v4("crlHint")}</p>
      <p className="c4-crl-meta">{v4("crlLocal")} · {v4("crlKeys")} · {v4("crlHoldKey")} · {v4("crlPinKey")} · {v4("crlStayKey")} · {v4("crlShortKey")} · {v4("crlTagKey")} · {v4("crlBoardKey")} · {v4("crlShelfKey")} · {v4("crlLowerKey")} · {v4("crlToneKey")} · {v4("crlRibbonKey")} · {v4("crlEscape")}</p>
      <ul className="c4-crl-kpis" aria-label={v4("crlKpi")}>
        <li><span>{v4("crlOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("crlHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("crlArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("crlPin")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("crlPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("crlQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("crlSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("crlLoad")}</span><strong>{counts.shelf}</strong></li>
        <li><span>{v4("crlHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("crlStay")}</span><strong>{counts.stay}</strong></li>
        <li><span>{v4("crlMatched")}</span><strong>{counts.matched}</strong></li>
        <li><span>{v4("crlRibbon")}</span><strong>{counts.ribbon}</strong></li>
        <li><span>{v4("crlIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("crlRush")}</span><strong>{counts.rush}</strong></li>
        <li><span>{v4("crlResting")}</span><strong>{counts.resting}</strong></li>
        <li><span>{v4("crlOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("crlLateShare")}</span><strong>{carrelShare(shown.filter((slip) => lateSlip(slip, desk)).length, Math.max(1, shown.length))}%</strong></li>
        <li><span>{v4("crlShare")}</span><strong>{carrelShare(counts.house, Math.max(1, counts.open))}%</strong></li>
        <li><span>{v4("crlNeighbors")}</span><strong>{neighborSlipCount(slips)}</strong></li>
        <li><span>{v4("crlClash")}</span><strong>{clashRoomCount(slips)}</strong></li>
        <li><span>{v4("crlStayClash")}</span><strong>{stayClashCount(slips)}</strong></li>
      </ul>
      <div className="c4-crl-bars" aria-label={v4("crlChart")}>
        {bars.map((bar) => (
          <div key={bar.room} className="c4-crl-bar" data-room={bar.room}>
            <span>{roomLabel(v4, bar.room)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-crl-meta">{v4("crlSuggest")} {clothLabel(v4, suggested)} · {v4("crlStay")} {suggestedStay} · {fair ? `${v4("crlAssign")} ${fair}` : v4("crlBlankKeeper")} · {busiestKeeper(slips) ? `${v4("crlBusiest")} ${busiestKeeper(slips)}` : v4("crlBusiestNone")}</p>
      <form className="c4-crl-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addCarrelSlip(slips, { id: `crl-${Date.now()}`, title, note, keeper, room, cloth, tone, stay: stayMin, shelf, tags });
        if (next.length === slips.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
        titleRef.current?.focus();
      }}>
        <label className="c4-lab"><span>{v4("crlTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("crlTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("crlNote")}</span><input className="c4-field" aria-label={v4("crlNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("crlKeeper")}</span><input className="c4-field" aria-label={v4("crlKeeper")} value={keeper} onChange={(event) => setKeeper(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("crlRoom")}</span>
          <select className="c4-field" aria-label={v4("crlRoom")} value={room} onChange={(event) => setRoom(event.target.value)}>
            <option value="">{v4("crlBlank")}</option>
            {CARREL_ROOMS.map((item) => <option key={item} value={item}>{roomLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("crlCloth")}</span>
          <select className="c4-field" aria-label={v4("crlCloth")} value={cloth} onChange={(event) => setCloth(event.target.value)}>
            <option value="">{v4("crlBlankWool")}</option>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("crlTone")}</span>
          <select className="c4-field" aria-label={v4("crlTone")} value={tone} onChange={(event) => setTone(event.target.value)}>
            <option value="">{v4("crlBlankTone")}</option>
            {TONES.map((item) => <option key={item} value={item}>{toneLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("crlStay")}</span>
          <select className="c4-field" aria-label={v4("crlStay")} value={stayMin} onChange={(event) => setStayMin(event.target.value)}>
            <option value="">{v4("crlBlankStay")}</option>
            {STAYS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("crlShelf")}</span>
          <select className="c4-field" aria-label={v4("crlShelf")} value={shelf} onChange={(event) => setShelf(event.target.value)}>
            {SHELVES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("crlTag")}</span><input className="c4-field" aria-label={v4("crlTag")} value={tags} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("crlAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => { setCloth(suggested === "VELVET" ? "velvet" : suggested === "WOOL" ? "wool" : "linen"); setStayMin(String(suggestedStay)); if (fair) setKeeper(fair); }}>{v4("crlSuggest")}</button>
      </form>
      <div className="c4-crl-tools">
        <label className="c4-lab"><span>{v4("crlSearch")}</span><input ref={searchRef} className="c4-field c4-crl-search" aria-label={v4("crlSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("crlDesk")}</span>
          <select className="c4-field" aria-label={v4("crlDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {CARREL_ROOMS.map((item) => <option key={item} value={item}>{roomLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" onClick={() => download("carrel-slips.csv", carrelCsv(slips, desk))}>{v4("crlCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={density === "tight"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("crlDensityTight") : v4("crlDensityAiry")}</button>
        <button type="button" className="c4-btn" aria-pressed={sort === "keeper"} onClick={() => setSort(carrelSort(sort === "room" ? "keeper" : "room"))}>{sort === "room" ? v4("crlSortKeeper") : v4("crlSortRoom")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCarrelPin(slips, picked))}>{v4("crlBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCarrelArchive(slips, picked))}>{v4("crlBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCarrelBright(slips, picked))}>{v4("crlBulkBright")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCarrelTag(slips, picked, "y"))}>{v4("crlBulkTag")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCarrelWool(slips, picked, "wool"))}>{v4("crlBulkWool")}</button>
      </div>
      <div className="c4-crl-tools" role="group" aria-label={v4("crlTray")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("crlOpen") : item === "held" ? v4("crlHeld") : v4("crlArchived")}</button>
        ))}
        {(["hall", "index"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={board === item ? "1" : "0"} onClick={() => setBoard(item)}>{item === "hall" ? v4("crlBoardHall") : v4("crlBoardIndex")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} aria-pressed={houseOnly} onClick={() => setHouseOnly((value) => !value)}>{v4("crlHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} aria-pressed={peakOnly} onClick={() => setPeakOnly((value) => !value)}>{v4("crlPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} aria-pressed={quietOnly} onClick={() => setQuietOnly((value) => !value)}>{v4("crlQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={keeperFilter === "all" ? "1" : "0"} onClick={() => setKeeperFilter("all")}>{v4("crlAll")}</button>
        {keepers.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={keeperFilter === item ? "1" : "0"} onClick={() => setKeeperFilter(item)}>{item}</button>
        ))}
        {CLOTHS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={clothFilter === item ? "1" : "0"} onClick={() => setClothFilter(activeCloth(clothFilter) === item ? "all" : item)}>{clothLabel(v4, item)}</button>
        ))}
        {TONES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toneFilter === item ? "1" : "0"} onClick={() => setToneFilter(activeTone(toneFilter, TONES) === item ? "all" : item)}>{toneLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-chip" data-on={roomFilter === "all" ? "1" : "0"} onClick={() => setRoomFilter("all")}>{v4("crlAll")}</button>
        <button type="button" className="c4-chip" data-on={roomFilter === "peak" ? "1" : "0"} onClick={() => setRoomFilter("peak")}>{v4("crlPeak")}</button>
        <button type="button" className="c4-chip" data-on={roomFilter === "quiet" ? "1" : "0"} onClick={() => setRoomFilter("quiet")}>{v4("crlQuiet")}</button>
        {CARREL_ROOMS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={roomFilter === item ? "1" : "0"} onClick={() => setRoomFilter(activeRoom(roomFilter) === item ? "all" : item)}>{roomLabel(v4, item)}</button>
        ))}
        {STAYS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={stayFilter === item ? "1" : "0"} onClick={() => setStayFilter(activeStay(stayFilter) === item ? "all" : item)}>{item}</button>
        ))}
        {SHELVES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shelfFilter === item ? "1" : "0"} onClick={() => setShelfFilter(activeShelf(shelfFilter) === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <form className="c4-crl-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addCarrelView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, keeper: keeperFilter, cloth: clothFilter, tone: toneFilter, room: roomFilter, stay: stayFilter, shelf: shelfFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("crlViewName")}</span><input className="c4-field" aria-label={v4("crlViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("crlSaveView")}</button>
      </form>
      <ul className="c4-crl-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("crlApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropCarrelView(views, view.id))}>{v4("crlDropView")}</button>
          </li>
        ))}
      </ul>
      {board === "hall" ? (
        <ol className="c4-crl-board">
          {!shown.length && <li className="c4-crl-empty"><span className="c4-crl-rule" aria-hidden="true"><i /><i /><i /><i /></span>{v4("crlEmpty")}</li>}
          {shown.map((slip, index) => {
            const gap = roomGapSafe(slip, desk);
            return (
              <li key={slip.id} className="c4-crl-card" data-on={index === focusAt ? "1" : "0"} data-pinned={slip.pinned ? "1" : "0"} data-ribbon={slip.ribbon ? "1" : "0"} data-cloth={slip.cloth || "blank"} data-late={lateSlip(slip, desk) ? "1" : "0"} data-idle={idleSlip(slip) ? "1" : "0"} data-rush={rushSlip(slip) ? "1" : "0"} data-resting={restingSlip(slip) ? "1" : "0"} data-overdue={overdueSlip(slip) ? "1" : "0"}>
                <p className="c4-crl-dial" aria-hidden="true">{slip.shelf}</p>
                <label className="c4-lab"><span>{v4("crlSelect")}</span><input type="checkbox" aria-label={v4("crlSelect")} checked={picked.includes(slip.id)} onChange={() => togglePick(slip.id)} /></label>
                <input className="c4-field" aria-label={v4("crlEdit")} value={slip.title} disabled={viewer} onChange={(event) => { if (!viewer) store(editCarrel(slips, slip.id, event.target.value)); }} />
                <input className="c4-field" aria-label={v4("crlEditNote")} value={slip.note} disabled={viewer} onChange={(event) => { if (!viewer) store(editCarrelNote(slips, slip.id, event.target.value)); }} />
                <p className="c4-crl-meta">{slip.keeper || v4("crlBlankKeeper")} · {roomLabel(v4, slip.room)} · {clothLabel(v4, slip.cloth)} · {toneLabel(v4, slip.tone)} · {slip.stay ?? v4("crlBlankStay")} · {v4("crlShelf")} {slip.shelf} · {slip.tags.join(" ") || v4("crlBlank")} · {bandLabel(v4, roomBand(slip.room))}{peakRoom(slip.room) ? ` · ${v4("crlPeak")}` : ""}{quietRoom(slip.room) ? ` · ${v4("crlQuiet")}` : ""}{houseCloth(slip.cloth) ? ` · ${v4("crlHouse")}` : ""}{idleSlip(slip) ? ` · ${v4("crlIdle")}` : ""}{rushSlip(slip) ? ` · ${v4("crlRush")}` : ""}{restingSlip(slip) ? ` · ${v4("crlResting")}` : ""}{overdueSlip(slip) ? ` · ${v4("crlOverdue")}` : ""}</p>
                <p className="c4-crl-meta">{gap === null ? v4("crlBlank") : gap > 0 ? `${v4("crlPast")} ${gap}` : gap < 0 ? `${v4("crlAhead")} ${Math.abs(gap)}` : v4("crlDue")} · {AUDIT_KEY[slip.audit] ? v4(AUDIT_KEY[slip.audit]) : v4("crlBlank")} · {nextSlip(slips, slip.id) ? `${v4("crlNext")} ${nextSlip(slips, slip.id)?.title}` : v4("crlNextNone")}</p>
                <div className="c4-crl-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleTone(slips, slip.id))}>{v4("crlTone")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipPin(slips, slip.id, !slip.pinned))}>{slip.pinned ? v4("crlUnpin") : v4("crlPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || slip.archived} onClick={() => store(setSlipHold(slips, slip.id, !slip.held))}>{slip.held ? v4("crlResume") : v4("crlHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipArchive(slips, slip.id, !slip.archived))}>{slip.archived ? v4("crlReopen") : v4("crlArchive")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipRibbon(slips, slip.id, !slip.ribbon))}>{slip.ribbon ? v4("crlUnribbon") : v4("crlRibbon")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenStay(slips, slip.id))}>{v4("crlStay")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenStay(slips, slip.id))}>{v4("crlShorten")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseShelf(slips, slip.id))}>{v4("crlRaised")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerShelf(slips, slip.id))}>{v4("crlLowered")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipCloth(slips, slip.id, slip.cloth === "WOOL" ? "linen" : slip.cloth === "VELVET" ? "wool" : "velvet"))}>{v4("crlCloth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCarrelTag(slips, slip.id, "z"))}>{v4("crlTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard.writeText(carrelCopy(slip)).catch(() => undefined); setCopied(slip.id); }}>{copied === slip.id ? v4("crlCopied") : v4("crlCopy")}</button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className="c4-crl-timeline">
          {!timeline.length && <li className="c4-crl-empty">{v4("crlEmpty")}</li>}
          {timeline.map((lane) => <li key={lane.shelf}><span>{lane.shelf}</span><strong>{lane.titles.join(" · ")}</strong></li>)}
        </ol>
      )}
      <aside className="c4-crl-side" aria-label={v4("crlReminders")}>
        <h3 className="c4-title">{v4("crlReminders")}</h3>
        {!reminders.length && <p>{v4("crlEmpty")}</p>}
        <ul>{reminders.map((slip) => <li key={slip.id}>{slip.title} · {lateSlip(slip, desk) ? v4("crlLate") : v4("crlSame")}</li>)}</ul>
        <h3 className="c4-title">{v4("crlIdle")}</h3>
        {!idling.length && <p>{v4("crlIdleEmpty")}</p>}
        <ul>{idling.map((slip) => <li key={slip.id}>{slip.title}</li>)}</ul>
        {focused && <p>{v4("crlFocus")} {focused.title} · {carrelShare(counts.house, Math.max(1, counts.open))}%</p>}
        <p>{clashRoomCount(slips) ? v4("crlClash") : v4("crlClashNone")} · {pairKeeperCount(slips) ? v4("crlPair") : v4("crlPairNone")} · {shelfLoad(slips)} · {matchedSlips(slips, desk).length}</p>
      </aside>
    </section>
  );
}

function roomGapSafe(slip: CarrelSlip, desk: string): number | null {
  return lateSlip(slip, desk) || slip.room ? gapOf(slip.room, desk) : null;
}

function gapOf(room: string, desk: string): number | null {
  const from = CARREL_ROOMS.indexOf(room as (typeof CARREL_ROOMS)[number]);
  const to = CARREL_ROOMS.indexOf(desk as (typeof CARREL_ROOMS)[number]);
  if (from < 0 || to < 0) return null;
  return to - from;
}

function markNote(row: TraderRow): SealValue {
  return { login: textField(row.accountLoginId), accountLoginId: textField(row.accountLoginId) };
}

export function LoginSeals({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [review, setReview] = useState<SealReview>("all");
  const [shape, setShape] = useState<SealShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const rows = useMemo<SealRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `trader-${row.id}` : `trader-${index}`,
    label: textField(row.name),
    note: markNote(row),
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
    const present = presentSealLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenSeals(readJson(LGS_KEY, []), present);
    const nextReviewed = readReviewedSeals(readJson(LGS_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(LGS_KEY, nextHidden);
    writeJson(LGS_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentSealLanes(rows);
  const lanes = visibleSealLanes(present, hidden, showHidden);
  const shown = visibleSeals(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = sealLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  useEffect(() => {
    reviewRef.current = () => {
      if (viewer) return;
      const row = shown[focusAt];
      if (!row) return;
      const next = toggleSealReview(reviewed, row.id);
      setReviewed(next);
      writeJson(LGS_REVIEW_KEY, next);
    };
  });
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveCarrelFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveCarrelFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        reviewRef.current();
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        setShowHidden((value) => !value);
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        const order: SealShape[] = ["all", "twin", "wide", "bound", "notch", "low"];
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
  const lead = leadingSeal(rows);
  const hueLead = leadingSealHue(rows);
  const shared = sharedSealCount(rows);
  const bound = rows.filter((row) => sealBound(row.note)).length;
  const bars = sealLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((row) => row.id);
  const known = rows.filter((row) => sealState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(LGS_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedSeals(next, rows.map((row) => row.id));
    setReviewed(saved);
    writeJson(LGS_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-lgs" aria-label={v4("lgsTitle")} data-seals="1" data-desk="seal" data-traders={queue.data?.users?.length ? "1" : "0"} data-role={role} data-keyed={bound ? "1" : "0"}>
      <header className="c4-lgs-mast">
        <p className="c4-lgs-seal" data-logo="mono">{v4("lgsLogo")}</p>
        <div>
          <p className="c4-lgs-kicker">{v4("lgsSub")}</p>
          <h2 className="c4-title">{v4("lgsTitle")}</h2>
        </div>
        <ol className="c4-lgs-index" aria-label={v4("lgsTitle")}>
          <li data-tone="gold">{v4("lgsChampagne")}</li>
          <li data-tone="ink">{v4("lgsGraphite")}</li>
          <li data-tone="ivory">{v4("lgsIvory")}</li>
        </ol>
      </header>
      <p className="c4-lgs-links">
        <Link href={crmv4Href(base, "crl")}>{v4("lgsGallery")}</Link>
        <Link href={crmv4Href(base, "quiet")}>{v4("crlQuietDesk")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("crlCustomers")}</Link>
      </p>
      {viewer && <p className="c4-lgs-note">{v4("lgsViewer")}</p>}
      <p className="c4-lgs-lead">{v4("lgsHint")}</p>
      <ul className="c4-lgs-kpis" aria-label={v4("lgsRules")}>
        <li><span>{v4("lgsSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("lgsClear")}</span><strong>{rows.filter((row) => sealState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("lgsTwin")}</span><strong>{laneSealCount(rows, "twin")}</strong></li>
        <li><span>{v4("lgsZero")}</span><strong>{laneSealCount(rows, "zero")}</strong></li>
        <li><span>{v4("lgsLow")}</span><strong>{laneSealCount(rows, "low")}</strong></li>
        <li><span>{v4("lgsHigh")}</span><strong>{laneSealCount(rows, "high")}</strong></li>
        <li><span>{v4("lgsShort")}</span><strong>{laneSealCount(rows, "short")}</strong></li>
        <li><span>{v4("lgsFull")}</span><strong>{laneSealCount(rows, "full")}</strong></li>
        <li><span>{v4("lgsEven")}</span><strong>{laneSealCount(rows, "even")}</strong></li>
        <li><span>{v4("lgsPlain")}</span><strong>{laneSealCount(rows, "plain")}</strong></li>
        <li><span>{v4("lgsGilt")}</span><strong>{hueSealCount(rows, "gilt")}</strong></li>
        <li><span>{v4("lgsNotch")}</span><strong>{rows.filter((row) => sealNotch(row.note)).length}</strong></li>
        <li><span>{v4("lgsWide")}</span><strong>{rows.filter((row) => sealWide(row.note)).length}</strong></li>
        <li><span>{v4("lgsJoin")}</span><strong>{rows.filter((row) => sealJoin(row.note)).length}</strong></li>
        <li><span>{v4("lgsShare")}</span><strong>{sealShare(bound, Math.max(1, known))}%</strong></li>
        <li><span>{v4("lgsShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-lgs-bars" aria-label={v4("lgsLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-lgs-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-lgs-meta">{lead ? `${v4("lgsLead")} ${laneLabel(v4, lead)}` : v4("lgsEmpty")} · {hueLead ? `${v4("lgsToneLead")} ${hueLabel(v4, hueLead)}` : v4("lgsUnmarked")}</p>
      <div className="c4-lgs-tools">
        <label className="c4-lab"><span>{v4("lgsSearch")}</span><input ref={searchRef} className="c4-field c4-lgs-search" aria-label={v4("lgsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => download("login-seals.csv", sealLanesCsv(rows))}>{v4("lgsCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("login-seal-rows.csv", sealRowsCsv(rows, reviewed))}>{v4("lgsRowCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={showHidden} onClick={() => setShowHidden((value) => !value)}>{v4("lgsShow")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSealReview(reviewed, ids, true))}>{v4("lgsBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSealReview(reviewed, ids, false))}>{v4("lgsBulkClear")}</button>
      </div>
      <div className="c4-lgs-tools" role="group" aria-label={v4("lgsAll")}>
        <button type="button" className="c4-chip" data-on={lane === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("lgsAll")}</button>
        {lanes.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={lane === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
        {(["gilt", "slate", "sand", "clay", "soot", "pearl", "mist"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(hue === item ? "all" : item)}>{hueLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("lgsAll") : item === "reviewed" ? v4("lgsReviewed") : v4("lgsUnreviewed")}</button>
        ))}
        {(["all", "twin", "wide", "bound", "notch", "low"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("lgsShapeAll") : item === "twin" ? v4("lgsShapeTwin") : item === "wide" ? v4("lgsShapeWide") : item === "bound" ? v4("lgsShapeBound") : item === "notch" ? v4("lgsShapeNotch") : v4("lgsShapeLow")}</button>
        ))}
      </div>
      {!shown.length && <p className="c4-lgs-empty">{v4("lgsEmpty")}</p>}
      <ol className="c4-lgs-board">
        {shown.map((row, index) => {
          const current = sealLane(row.note);
          const hueName = sealHue(row.note);
          return (
            <li key={row.id} className="c4-lgs-card" data-on={index === focusAt ? "1" : "0"} data-lane={current || "blank"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-wide={sealWide(row.note) ? "1" : "0"} data-join={sealJoin(row.note) ? "1" : "0"} data-notch={sealNotch(row.note) ? "1" : "0"} data-bound={sealBound(row.note) ? "1" : "0"}>
              <strong>{row.label || v4("lgsClear")}</strong>
              <p className="c4-lgs-meta">{v4("lgsMarkWord")} {sealStamp(row.note) || v4("lgsUnmarked")} · {laneLabel(v4, current)} · {hueLabel(v4, hueName)} · {v4("lgsStep")} {sealStep(row.note)} · {v4("lgsLogin")}</p>
              <div className="c4-lgs-tools">
                <button type="button" className="c4-btn" disabled={viewer || !current} onClick={() => storeHidden(toggleSeal(hidden, current))}>{hidden.includes(current) ? v4("lgsShow") : v4("lgsHide")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSealReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("lgsReviewed") : v4("lgsReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = sealCopy(row.note); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(row.id); }}>{copied === row.id ? v4("lgsCopied") : v4("lgsCopy")}</button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
