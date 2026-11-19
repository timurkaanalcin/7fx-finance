"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  GROMA_ARMS,
  GRM_DENSITY_KEY,
  GRM_KEY,
  GRM_VIEW_KEY,
  ZNP_KEY,
  ZNP_REVIEW_KEY,
  addGroma,
  addGromaTag,
  addGromaView,
  briskGroma,
  bulkGromaChampagne,
  bulkGromaCrypt,
  bulkGromaSquare,
  bulkGromaTag,
  bulkZoneReview,
  busiestGromaRodman,
  chestGromaFocused,
  cycleFinish,
  dropGromaView,
  editGroma,
  editGromaNote,
  fairGromaRodman,
  finishFocused,
  gromaBars,
  gromaCopy,
  gromaCounts,
  gromaCsv,
  gromaDensity,
  gromaRodmen,
  gromaTimeline,
  idleGroma,
  innerArm,
  laneZoneCount,
  lateGroma,
  leadingZone,
  leadingZoneHue,
  liftSpanFocused,
  lowerCordFocused,
  lowerSpanFocused,
  moveGromaFocus,
  outerArm,
  overdueGroma,
  presentZoneLanes,
  raiseCordFocused,
  readGromaViews,
  readGromas,
  readHiddenZone,
  readReviewedZone,
  reminderGromas,
  restingGroma,
  setGromaChest,
  setGromaCrypt,
  setGromaFinish,
  setGromaSquared,
  setGromaStar,
  sortGromas,
  squareGromaFocused,
  starGromaFocused,
  suggestArm,
  suggestGromaFinish,
  suggestSpan,
  tagGromaFocused,
  toggleZone,
  toggleZoneReview,
  visibleGromas,
  visibleZone,
  visibleZoneLanes,
  zoneCapital,
  zoneCopy,
  zoneDigit,
  zoneEven,
  zoneFirst,
  zoneHeld,
  zoneHouse,
  zoneHue,
  zoneJoin,
  zoneLane,
  zoneLanes,
  zoneLanesCsv,
  zoneLength,
  zoneLetter,
  zoneLower,
  zoneMark,
  zoneMixed,
  zoneNest,
  zoneOpen,
  zonePost,
  zoneRegion,
  zoneRowsCsv,
  zoneShare,
  zoneSlash,
  zoneSoon,
  zoneSpace,
  zoneSpark,
  zoneStamp,
  zoneTail,
  zoneUpper,
  zoneVowel,
  type Groma,
  type GromaDensity,
  type GromaSort,
  type GromaTray,
  type GromaView,
  type ZoneReview,
  type ZoneRow,
  type ZoneShape,
  type ZoneValue,
} from "@/lib/crmv4/round298";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FINISHES = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const SPANS = ["4", "8", "12", "16"] as const;
const CORDS = ["2", "4", "6"] as const;
const ARM_KEY: Record<string, CrmV4CopyKey> = {
  cardo: "grmCardo",
  decumanus: "grmDecumanus",
  bias: "grmBias",
  skew: "grmSkew",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "grmAuditSave",
  edit: "grmAuditEdit",
  note: "grmAuditNote",
  finish: "grmAuditFinish",
  square: "grmAuditSquare",
  clear: "grmAuditClear",
  chest: "grmAuditChest",
  resume: "grmAuditResume",
  crypt: "grmAuditCrypt",
  open: "grmAuditOpen",
  tag: "grmAuditTag",
  cord: "grmAuditCord",
  span: "grmAuditSpan",
  lower: "grmAuditLower",
  star: "grmAuditStar",
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
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function textField(raw: unknown): string {
  return String(raw ?? "").replace(/\s+/g, " ").trim();
}

function armLabel(v4: V4, arm: string): string {
  const key = ARM_KEY[arm];
  return key ? v4(key) : v4("grmBlankArm");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "IVORY") return v4("grmIvory");
  if (finish === "GRAPHITE") return v4("grmGraphite");
  if (finish === "CHAMPAGNE") return v4("grmChampagne");
  return v4("grmAll");
}

export function GromaCrosses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Groma[]>([]);
  const [views, setViews] = useState<GromaView[]>([]);
  const [density, setDensity] = useState<GromaDensity>("broad");
  const [tray, setTray] = useState<GromaTray>("yard");
  const [query, setQuery] = useState("");
  const [rodmanFilter, setRodmanFilter] = useState("");
  const [finishFilter, setFinishFilter] = useState("all");
  const [armFilter, setArmFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [cordFilter, setCordFilter] = useState("all");
  const [sort, setSort] = useState<GromaSort>("arm");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [rodman, setRodman] = useState("");
  const [arm, setArm] = useState("");
  const [finish, setFinish] = useState("");
  const [spanNo, setSpanNo] = useState("");
  const [cordNo, setCordNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("cardo");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readGromas(readJson(GRM_KEY, [])));
    setViews(readGromaViews(readJson(GRM_VIEW_KEY, [])));
    setDensity(gromaDensity(readJson(GRM_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Groma[]) {
    setCards(next);
    writeJson(GRM_KEY, next);
  }
  function storeViews(next: GromaView[]) {
    setViews(next);
    writeJson(GRM_VIEW_KEY, next);
  }
  function storeDensity(next: GromaDensity) {
    setDensity(next);
    writeJson(GRM_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortGromas(visibleGromas(cards, tray, query, rodmanFilter, finishFilter, armFilter, spanFilter, cordFilter), sort),
    [cards, tray, query, rodmanFilter, finishFilter, armFilter, spanFilter, cordFilter, sort],
  );
  const counts = gromaCounts(cards, shown, desk);
  const bars = gromaBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = gromaTimeline(cards);
  const rodmen = gromaRodmen(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestGromaFinish(cards);
  const fair = fairGromaRodman(cards, rodmen.join(","));
  const busy = busiestGromaRodman(cards);
  const reminders = reminderGromas(cards);
  const spanHint = suggestSpan(cards, clock);
  const armHint = suggestArm(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setRodman("");
        setArm("");
        setFinish("");
        setSpanNo("");
        setCordNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveGromaFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveGromaFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "q" || event.key === "Q") {
        event.preventDefault();
        store(liftSpanFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setGromaCrypt(cards, id, !shown[focusAt]?.crypt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        store(finishFocused(cards, id));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        store(chestGromaFocused(cards, id));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        store(squareGromaFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("groma-crosses.csv", gromaCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starGromaFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raiseCordFocused(cards, id));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        store(lowerCordFocused(cards, id));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        store(lowerSpanFocused(cards, id));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards, desk, focusAt, shown, viewer]);

  return (
    <section className="c4-groma" aria-label={v4("grmTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-groma-mast">
        <p className="c4-groma-seal" data-logo="mono">{v4("grmLogo")}</p>
        <div>
          <p className="c4-groma-kicker">{v4("grmSub")}</p>
          <h2 className="c4-title">{v4("grmTitle")}</h2>
        </div>
        <ol className="c4-groma-index" aria-label={v4("grmTitle")}>
          <li data-tone="gold">{v4("grmYard")}</li>
          <li data-tone="ink">{v4("grmChest")}</li>
          <li data-tone="ivory">{v4("grmCrypt")}</li>
        </ol>
      </header>
      <p className="c4-groma-links">
        <Link href={crmv4Href(base, "znp")}>{v4("znpTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("grmCustomers")}</Link>
        <Link href={crmv4Href(base, "countryglance")}>{v4("cyCloisterKicker")}</Link>
        <Link href={crmv4Href(base, "langglance")}>{v4("lgNaveKicker")}</Link>
      </p>
      <p className="c4-groma-hint">{v4("grmHint")}</p>
      {viewer && <p className="c4-groma-note">{v4("grmViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-groma-notice" role="status">{v4("grmOverdue")} {counts.overdue}</p>}
      <ol className="c4-groma-dials" aria-label={v4("grmChart")}>
        <li><span>{v4("grmInner")}</span><strong>{counts.inner}</strong></li>
        <li><span>{v4("grmOuter")}</span><strong>{counts.outer}</strong></li>
        <li><span>{v4("grmSquare")}</span><strong>{counts.squared}</strong></li>
        <li><span>{v4("grmWide")}</span><strong>{counts.wide}</strong></li>
        <li><span>{v4("grmHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("grmIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("grmBrisk")}</span><strong>{counts.brisk}</strong></li>
        <li><span>{v4("grmMatched")}</span><strong>{counts.matched}</strong></li>
      </ol>
      <div className="c4-groma-chart" aria-label={v4("grmChart")}>
        {bars.map((bar) => (
          <button key={bar.arm} type="button" className="c4-groma-column" data-on={armFilter === bar.arm ? "1" : "0"} data-arm={bar.arm} onClick={() => setArmFilter(armFilter === bar.arm ? "all" : bar.arm)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{armLabel(v4, bar.arm)}</span>
          </button>
        ))}
      </div>
      <div className="c4-groma-tools">
        <input ref={searchRef} className="c4-field c4-groma-search" aria-label={v4("grmSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("grmSearch")} />
        <select className="c4-select" aria-label={v4("grmRodman")} value={rodmanFilter} onChange={(event) => setRodmanFilter(event.target.value)}>
          <option value="">{v4("grmRodman")}</option>
          {rodmen.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        {(["yard", "chest", "crypt"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "yard" ? "grmYard" : item === "chest" ? "grmChest" : "grmCrypt")}</button>
        ))}
        {(["all", "inner", "outer", ...GROMA_ARMS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={armFilter === item ? "1" : "0"} onClick={() => setArmFilter(item)}>{item === "all" ? v4("grmAll") : item === "inner" ? v4("grmInner") : item === "outer" ? v4("grmOuter") : armLabel(v4, item)}</button>
        ))}
        {["all", ...FINISHES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={finishFilter === item ? "1" : "0"} onClick={() => setFinishFilter(item)}>{item === "all" ? v4("grmFinish") : finishLabel(v4, item)}</button>
        ))}
        {["all", ...SPANS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={spanFilter === item ? "1" : "0"} onClick={() => setSpanFilter(item)}>{item === "all" ? v4("grmSpan") : item}</button>
        ))}
        {["all", ...CORDS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={cordFilter === item ? "1" : "0"} onClick={() => setCordFilter(item)}>{item === "all" ? v4("grmCord") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "rodman" ? "1" : "0"} onClick={() => setSort(sort === "arm" ? "rodman" : "arm")}>{sort === "arm" ? v4("grmSortArm") : v4("grmSortRodman")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "broad" ? "tight" : "broad")}>{density === "broad" ? v4("grmBroad") : v4("grmTight")}</button>
        <button type="button" className="c4-btn" onClick={() => download("groma-crosses.csv", gromaCsv(shown, desk))}>{v4("grmCsv")}</button>
      </div>
      <div className="c4-groma-tools" role="group" aria-label={v4("grmDesk")}>
        {GROMA_ARMS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("grmDesk")} {armLabel(v4, item)}</button>
        ))}
        <span className="c4-groma-meta">{v4("grmSuggest")} {finishLabel(v4, suggested)} · {spanHint} · {armLabel(v4, armHint)}</span>
        <span className="c4-groma-meta">{v4("grmFair")} {fair || "·"} · {v4("grmBusy")} {busy || "·"}</span>
      </div>
      <form className="c4-groma-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addGroma(cards, { title, note, rodman, arm, finish: finish || suggested, span: spanNo, cord: cordNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("grmEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("grmTitle")} />
        <input className="c4-field" aria-label={v4("grmNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("grmNote")} />
        <input className="c4-field" aria-label={v4("grmRodman")} aria-required={false} value={rodman} disabled={viewer} onChange={(event) => setRodman(event.target.value)} placeholder={v4("grmRodman")} />
        <select className="c4-select" aria-label={v4("grmDesk")} value={arm} disabled={viewer} onChange={(event) => setArm(event.target.value)}>
          <option value="">{v4("grmBlankArm")}</option>
          {GROMA_ARMS.map((item) => <option key={item} value={item}>{armLabel(v4, item)}</option>)}
        </select>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("grmAdd")}</button>
      </form>
      <form className="c4-groma-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addGromaView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, rodman: rodmanFilter, finish: finishFilter, arm: armFilter, span: spanFilter, cord: cordFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("grmViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("grmViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("grmSaveView")}</button>
      </form>
      <ul className="c4-groma-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setRodmanFilter(view.rodman); setFinishFilter(view.finish); setArmFilter(view.arm); setSpanFilter(view.span); setCordFilter(view.cord); }}>{v4("grmApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropGromaView(views, view.id))}>{v4("grmDrop")}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-groma-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkGromaChampagne(cards, picked))}>{v4("grmBulkChampagne")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkGromaSquare(cards, picked))}>{v4("grmBulkSquare")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkGromaCrypt(cards, picked))}>{v4("grmBulkCrypt")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkGromaTag(cards, picked))}>{v4("grmBulkTag")}</button>
        </div>
      )}
      <p className="c4-groma-meta">{v4("grmKeys")} · j k n l g v s f q u y x /</p>
      {timeline.length > 0 && (
        <ol className="c4-groma-time" aria-label={v4("grmTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.span}><span>{v4("grmSpan")} {lane.span}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
        </ol>
      )}
      {reminders.length > 0 && <p className="c4-groma-meta">{v4("grmRemind")} {reminders.join(" · ")}</p>}
      {!shown.length && <p className="c4-groma-empty">{v4("grmEmpty")}</p>}
      <ol className="c4-groma-board">
        {shown.map((card, index) => {
          const on = index === focusAt;
          return (
            <li key={card.id} className="c4-groma-card" data-on={on ? "1" : "0"} data-overdue={overdueGroma(card) ? "1" : "0"} data-idle={idleGroma(card) ? "1" : "0"} data-brisk={briskGroma(card) ? "1" : "0"} data-resting={restingGroma(card) ? "1" : "0"} data-late={lateGroma(card, desk) ? "1" : "0"} data-outer={outerArm(card.arm) ? "1" : "0"} data-inner={innerArm(card.arm) ? "1" : "0"} data-star={card.flagged ? "1" : "0"}>
              <label className="c4-groma-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((current) => (current.includes(card.id) ? current.filter((item) => item !== card.id) : [...current, card.id]))} /></label>
              <div>
                {on ? (
                  <input className="c4-field" aria-label={v4("grmEdit")} aria-required={false} value={card.title} onChange={(event) => store(editGroma(cards, card.id, event.target.value))} />
                ) : (
                  <strong>{card.title}</strong>
                )}
                <p className="c4-groma-meta">{card.rodman || v4("grmRodman")} · {armLabel(v4, card.arm)} · {finishLabel(v4, card.finish)} · {card.span ?? "·"} · {v4("grmCord")} {card.cord}{card.tags.length ? ` · ${card.tags.join("")}` : ""}{card.audit ? ` · ${AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : card.audit}` : ""}</p>
                {on ? (
                  <input className="c4-field" aria-label={v4("grmNote")} aria-required={false} value={card.note} onChange={(event) => store(editGromaNote(cards, card.id, event.target.value))} />
                ) : (
                  card.note && <p className="c4-groma-meta">{card.note}</p>
                )}
                <div className="c4-groma-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGromaSquared(cards, card.id, !card.squared))}>{card.squared ? v4("grmClear") : v4("grmSquare")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGromaChest(cards, card.id, !card.chested))}>{card.chested ? v4("grmUnchest") : v4("grmChestIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGromaCrypt(cards, card.id, !card.crypt))}>{card.crypt ? v4("grmUncrypt") : v4("grmCryptIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGromaStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("grmUnstar") : v4("grmStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGromaFinish(cards, card.id, cycleFinish(card.finish)))}>{v4("grmFinish")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftSpanFocused(cards, card.id))}>{v4("grmLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerSpanFocused(cards, card.id))}>{v4("grmLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addGromaTag(cards, card.id, "a"))}>{v4("grmTag")} a</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(tagGromaFocused(cards, card.id))}>{v4("grmTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(gromaCopy(card)); }}>{v4("grmCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="c4-groma-meta">{v4("grmMatched")} {counts.matched} · {ids.length}</p>
    </section>
  );
}

const ZONE_SHAPES: ZoneShape[] = ["all", "mark", "spark", "join", "nest", "house", "post", "open", "soon", "letter", "mixed", "upper", "lower", "space", "even", "odd", "vowel", "tail", "digit", "first", "held", "slash"];

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  mark: "znpMark",
  spark: "znpSpark",
  join: "znpJoin",
  nest: "znpNest",
  house: "znpHouse",
  post: "znpPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "znpIvory",
  graphite: "znpGraphite",
  champagne: "znpChampagne",
};

const SHAPE_KEY: Record<ZoneShape, CrmV4CopyKey> = {
  all: "znpShapeAll",
  mark: "znpShapeMark",
  spark: "znpShapeSpark",
  join: "znpShapeJoin",
  nest: "znpShapeNest",
  house: "znpShapeHouse",
  post: "znpShapePost",
  open: "znpShapeOpen",
  soon: "znpShapeSoon",
  letter: "znpShapeLetter",
  mixed: "znpShapeMixed",
  upper: "znpShapeUpper",
  lower: "znpShapeLower",
  space: "znpShapeSpace",
  even: "znpShapeEven",
  odd: "znpShapeOdd",
  vowel: "znpShapeVowel",
  tail: "znpShapeTail",
  digit: "znpShapeDigit",
  first: "znpShapeFirst",
  held: "znpShapeHeld",
  slash: "znpShapeSlash",
};

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("znpUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("znpUnmarked");
}

type ZoneUser = { id?: string; name?: string | null; timezone?: string | null };

export function ZonePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: ZoneUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<ZoneShape>("all");
  const [review, setReview] = useState<ZoneReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";

  useEffect(() => {
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  const rows = useMemo<ZoneRow[]>(() => {
    return (queue.data?.users || []).map((row, index) => ({
      id: textField(row.id) || `c${index}`,
      label: textField(row.name),
      handle: { timezone: textField(row.timezone) } satisfies ZoneValue,
    }));
  }, [queue.data]);

  useEffect(() => {
    const ids = rows.map((row) => row.id);
    setHidden(readHiddenZone(readJson(ZNP_KEY, []), presentZoneLanes(rows)));
    setReviewed(readReviewedZone(readJson(ZNP_REVIEW_KEY, []), ids));
  }, [rows]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(ZNP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(ZNP_REVIEW_KEY, next);
  }

  const lanes = visibleZoneLanes(presentZoneLanes(rows), hidden, showHidden);
  const shown = visibleZone(rows, lane, hue, query, review, reviewed, shape).filter((row) => !hidden.includes(zoneLane(row.handle)) || showHidden);
  const bars = zoneLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingZone(rows);
  const leadHue = leadingZoneHue(rows);
  const soon = rows.filter((row) => zoneSoon(row.handle)).length;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveGromaFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveGromaFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        if (viewer) return;
        const id = shown[focusAt]?.id;
        if (id) storeReviewed(toggleZoneReview(reviewed, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("zone-rows.csv", zoneRowsCsv(rows, reviewed));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusAt, reviewed, rows, shown, viewer]);

  return (
    <section className="c4-zone" aria-label={v4("znpTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-zone-mast">
        <p className="c4-zone-seal" data-logo="mono">{v4("znpLogo")}</p>
        <div>
          <p className="c4-zone-kicker">{v4("znpSub")}</p>
          <h2 className="c4-title">{v4("znpTitle")}</h2>
        </div>
      </header>
      <ol className="c4-zone-index" aria-label={v4("znpTitle")}>
        <li data-tone="gold">{v4("znpSpark")}</li>
        <li data-tone="ink">{v4("znpJoin")}</li>
        <li data-tone="ivory">{v4("znpHouse")}</li>
        <li data-tone="mist">{v4("znpPost")}</li>
        <li data-tone="line">{v4("znpNest")}</li>
      </ol>
      <p className="c4-zone-links">
        <Link href={crmv4Href(base, "grm")}>{v4("grmTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("grmCustomers")}</Link>
        <Link href={crmv4Href(base, "countryglance")}>{v4("cyCloisterKicker")}</Link>
      </p>
      <p className="c4-zone-hint">{v4("znpHint")}</p>
      {viewer && <p className="c4-zone-note">{v4("znpViewer")}</p>}
      {soon > 0 && <p className="c4-zone-notice" role="status">{v4("znpSoon")} {soon}</p>}
      {queue.loading && <p className="c4-zone-meta">{v4("znpEmpty")}</p>}
      {queue.error && <p className="c4-zone-meta">{queue.error}</p>}
      <ul className="c4-zone-kpis" aria-label={v4("znpRules")}>
        <li><span>{v4("znpLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("znpUnmarked")}</strong></li>
        <li><span>{v4("znpToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("znpUnmarked")}</strong></li>
        <li><span>{v4("znpSpark")}</span><strong>{laneZoneCount(rows, "spark")}</strong></li>
        <li><span>{v4("znpHouse")}</span><strong>{laneZoneCount(rows, "house")}</strong></li>
        <li><span>{v4("znpShare")}</span><strong>{zoneShare(laneZoneCount(rows, "house"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("znpOpen")}</span><strong>{rows.filter((row) => zoneOpen(row.handle)).length}</strong></li>
        <li><span>{v4("znpHeld")}</span><strong>{rows.filter((row) => zoneHeld(row.handle)).length}</strong></li>
        <li><span>{v4("znpNest")}</span><strong>{rows.filter((row) => zoneNest(row.handle)).length}</strong></li>
      </ul>
      <div className="c4-zone-chart" aria-label={v4("znpRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-zone-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / maxBar) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-zone-tools">
        <input ref={searchRef} className="c4-field c4-zone-search" aria-label={v4("znpSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("znpSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("znpAll") : hueLabel(v4, item)}</button>
        ))}
        {ZONE_SHAPES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("znpAll") : item === "reviewed" ? v4("znpReviewed") : v4("znpFresh")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("znpShow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("zone-lanes.csv", zoneLanesCsv(rows))}>{v4("znpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("zone-rows.csv", zoneRowsCsv(rows, reviewed))}>{v4("znpRowCsv")}</button>
      </div>
      <ul className="c4-zone-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleZone(hidden, item))}>{hidden.includes(item) ? v4("znpShow") : v4("znpHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-zone-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkZoneReview(reviewed, picked, true))}>{v4("znpBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkZoneReview(reviewed, picked, false))}>{v4("znpBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-zone-empty">{v4("znpEmpty")}</p>}
      <ol className="c4-zone-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          const length = zoneLength(row.handle);
          const region = zoneRegion(row.handle);
          return (
            <li key={row.id} className="c4-zone-card" data-on={index === focusAt ? "1" : "0"} data-lane={zoneLane(row.handle)} data-hue={zoneHue(row.handle)} data-reviewed={seen ? "1" : "0"} data-spark={zoneSpark(row.handle) ? "1" : "0"} data-join={zoneJoin(row.handle) ? "1" : "0"} data-house={zoneHouse(row.handle) ? "1" : "0"} data-soon={zoneSoon(row.handle) ? "1" : "0"}>
              <p className="c4-zone-stamp">{zoneStamp(row.handle) || "·"}</p>
              <label className="c4-zone-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("znpUnmarked")}</strong>
                <p className="c4-zone-meta">{laneLabel(v4, zoneLane(row.handle))} · {hueLabel(v4, zoneHue(row.handle))}{region ? ` · ${region}` : ""}{length !== null ? ` · ${length}` : ""}{zoneDigit(row.handle) ? ` · ${v4("znpDigit")}` : ""}{zoneLetter(row.handle) ? ` · ${v4("znpLetter")}` : ""}{zoneMixed(row.handle) ? ` · ${v4("znpMixed")}` : ""}{zoneUpper(row.handle) ? ` · ${v4("znpUpper")}` : ""}{zoneLower(row.handle) ? ` · ${v4("znpLower")}` : ""}{zoneEven(row.handle) ? ` · ${v4("znpEven")}` : ""}{zoneVowel(row.handle) ? ` · ${v4("znpVowel")}` : ""}{zoneFirst(row.handle) ? ` · ${v4("znpFirst")}` : ""}{zoneTail(row.handle) ? ` · ${v4("znpTail")}` : ""}{zoneCapital(row.handle) ? ` · ${v4("znpCapital")}` : ""}{zoneSpace(row.handle) ? ` · ${v4("znpSpace")}` : ""}{zoneSlash(row.handle) ? ` · ${v4("znpSlash")}` : ""}{zonePost(row.handle) ? ` · ${v4("znpPost")}` : ""}{zoneHeld(row.handle) ? ` · ${v4("znpHeld")}` : ""}{zoneSoon(row.handle) ? ` · ${v4("znpSoon")}` : ""}{zoneOpen(row.handle) ? ` · ${v4("znpOpen")}` : ""}{zoneMark(row.handle) ? ` · ${v4("znpMark")}` : ""}</p>
                <div className="c4-zone-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleZoneReview(reviewed, row.id))}>{seen ? v4("znpReviewed") : v4("znpReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(zoneCopy(row.handle)); setCopied(row.id); }}>{copied === row.id ? v4("znpCopied") : v4("znpCopy")}</button>
                  <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("grmCustomers")}</Link>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
