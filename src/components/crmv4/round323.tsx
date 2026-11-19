"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  KRS_DENSITY_KEY,
  KRS_KEY,
  KRS_PARTS,
  KRS_VIEW_KEY,
  LXD_KEY,
  LXD_REVIEW_KEY,
  addKarrusel,
  addKarruselTag,
  addKarruselView,
  briskKarrusel,
  bulkKarruselGraphite,
  bulkKarruselTag,
  bulkKarruselVault,
  bulkKarruselWind,
  bulkLoxodromeReview,
  busiestKeeper,
  dropKarruselView,
  editKarrusel,
  editKarruselNote,
  fairKeeper,
  idleKarrusel,
  inkFocused,
  karruselBars,
  karruselCopy,
  karruselCounts,
  karruselCsv,
  karruselDensity,
  karruselInner,
  karruselKeepers,
  karruselOuter,
  karruselTimeline,
  laneLoxodromeCount,
  lateKarrusel,
  leadingLoxodrome,
  leadingLoxodromeHue,
  liftToothFocused,
  lowerBeatFocused,
  lowerToothFocused,
  moveKarruselFocus,
  overdueKarrusel,
  hookKarruselFocused,
  loxodromeCopy,
  loxodromeDigit,
  loxodromeEven,
  loxodromeFamily,
  loxodromeFirst,
  loxodromeGap,
  loxodromeHeld,
  loxodromeHue,
  loxodromeLane,
  loxodromeLanes,
  loxodromeLanesCsv,
  loxodromeLength,
  loxodromeLetter,
  loxodromeLower,
  loxodromeMixed,
  loxodromeOpen,
  loxodromeRowsCsv,
  loxodromeShare,
  loxodromeSlash,
  loxodromeSpace,
  loxodromeStamp,
  loxodromeTail,
  loxodromeUpper,
  loxodromeVowel,
  presentLoxodromeLanes,
  raiseBeatFocused,
  readHiddenLoxodrome,
  readKarruselRules,
  readKarruselViews,
  readReviewedLoxodrome,
  reminderKarruselRules,
  restingKarrusel,
  setKarruselFocused,
  setKarruselHook,
  setKarruselInk,
  setKarruselStar,
  setKarruselVault,
  setKarruselWind,
  sortKarruselRules,
  starKarruselFocused,
  suggestInk,
  suggestPart,
  suggestTooth,
  toggleLoxodrome,
  toggleLoxodromeReview,
  visibleKarruselRules,
  visibleLoxodrome,
  visibleLoxodromeLanes,
  type Karrusel,
  type KarruselDensity,
  type KarruselSort,
  type KarruselTray,
  type KarruselView,
  type LoxodromeReview,
  type LoxodromeRow,
  type LoxodromeShape,
  type LoxodromeValue,
} from "@/lib/crmv4/round323";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const INKS = ["GILT", "IVORY", "GRAPHITE"] as const;
const TEETH = ["1", "4", "7", "10"] as const;
const BEATS = ["4", "8", "12"] as const;

const PART_KEY: Record<string, CrmV4CopyKey> = {
  carriage: "krsCarriage",
  arbor: "krsArbor",
  platform: "krsPlatform",
  collet: "krsCollet",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "krsAuditSave",
  edit: "krsAuditEdit",
  note: "krsAuditNote",
  ink: "krsAuditInk",
  set: "krsAuditSet",
  clear: "krsAuditClear",
  hook: "krsAuditHook",
  resume: "krsAuditResume",
  vault: "krsAuditVault",
  open: "krsAuditOpen",
  tag: "krsAuditTag",
  beat: "krsAuditBeat",
  tooth: "krsAuditTooth",
  lower: "krsAuditLower",
  star: "krsAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  day: "lxdDay",
  slash: "lxdSlash",
  gap: "lxdGap",
  mark: "lxdMark",
  stub: "lxdStub",
  scroll: "lxdScroll",
  vowel: "lxdVowel",
  path: "lxdPath",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "lxdChampagne",
  ivory: "lxdIvory",
  graphite: "lxdGraphite",
};

const SHAPE_KEY: Record<LoxodromeShape, CrmV4CopyKey> = {
  all: "lxdShapeAll",
  day: "lxdShapeDay",
  slash: "lxdShapeSlash",
  gap: "lxdShapeGap",
  mark: "lxdShapeMark",
  stub: "lxdShapeStub",
  scroll: "lxdShapeScroll",
  vowel: "lxdShapeVowel",
  path: "lxdShapePath",
  open: "lxdShapeOpen",
  soon: "lxdShapeOpen",
  letter: "lxdShapePath",
  mixed: "lxdShapeMark",
  upper: "lxdShapeDay",
  lower: "lxdShapePath",
  space: "lxdShapeGap",
  even: "lxdShapeEven",
  odd: "lxdShapeEven",
  tail: "lxdShapeMark",
  first: "lxdShapePath",
  held: "lxdShapeScroll",
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

function partLabel(v4: V4, part: string): string {
  const key = PART_KEY[part];
  return key ? v4(key) : v4("krsBlankPart");
}

function inkLabel(v4: V4, ink: string): string {
  if (ink === "GILT") return v4("krsGilt");
  if (ink === "IVORY") return v4("krsIvory");
  if (ink === "GRAPHITE") return v4("krsGraphite");
  return v4("krsAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("lxdBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("lxdBlank");
}

export function KarruselRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Karrusel[]>([]);
  const [views, setViews] = useState<KarruselView[]>([]);
  const [density, setDensity] = useState<KarruselDensity>("broad");
  const [tray, setTray] = useState<KarruselTray>("bench");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("");
  const [inkFilter, setInkFilter] = useState("all");
  const [partFilter, setPartFilter] = useState("all");
  const [toothFilter, setToothFilter] = useState("all");
  const [beatFilter, setBeatFilter] = useState("all");
  const [sort, setSort] = useState<KarruselSort>("part");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [part, setPart] = useState("");
  const [ink, setInk] = useState("");
  const [toothNo, setToothNo] = useState("");
  const [beatNo, setBeatNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("carriage");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readKarruselRules(readJson(KRS_KEY, [])));
    setViews(readKarruselViews(readJson(KRS_VIEW_KEY, [])));
    setDensity(karruselDensity(readJson(KRS_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Karrusel[]) {
    setCards(next);
    writeJson(KRS_KEY, next);
  }
  function storeViews(next: KarruselView[]) {
    setViews(next);
    writeJson(KRS_VIEW_KEY, next);
  }
  function storeDensity(next: KarruselDensity) {
    setDensity(next);
    writeJson(KRS_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortKarruselRules(visibleKarruselRules(cards, tray, query, keeperFilter, inkFilter, partFilter, toothFilter, beatFilter), sort),
    [cards, tray, query, keeperFilter, inkFilter, partFilter, toothFilter, beatFilter, sort],
  );
  const counts = karruselCounts(cards, shown, desk);
  const bars = karruselBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = karruselTimeline(cards);
  const reminders = reminderKarruselRules(cards);
  const keepers = karruselKeepers(cards);
  const busy = busiestKeeper(cards);
  const fair = fairKeeper(cards, keepers.join(","));
  const suggestedInk = suggestInk(cards);
  const suggestedTooth = suggestTooth(cards, clock);
  const suggestedPart = suggestPart(clock);
  const focused = shown[Math.min(focusAt, Math.max(0, shown.length - 1))];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "/" && !typingTarget(event)) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (typingTarget(event) || viewer) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("karrusel-rules.csv", karruselCsv(shown, desk));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveKarruselFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveKarruselFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, desk]);

  function saveCard() {
    if (viewer) return;
    store(addKarrusel(cards, { title, note, keeper, part, tooth: toothNo, ink, beat: beatNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-karrusel" aria-label={v4("krsTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-karrusel-mast">
        <p className="c4-karrusel-seal" data-logo="mono">{v4("krsLogo")}</p>
        <div>
          <p className="c4-karrusel-kicker">{v4("krsSub")}</p>
          <h2 className="c4-title">{v4("krsTitle")}</h2>
        </div>
        <p className="c4-karrusel-count">{shown.length}</p>
      </header>
      <p className="c4-karrusel-links">
        <Link href={crmv4Href(base, "lxd")}>{v4("lxdTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("krsCustomers")}</Link>
      </p>
      <p className="c4-karrusel-hint">{v4("krsHint")}</p>
      {viewer && <p className="c4-karrusel-note">{v4("krsViewer")}</p>}
      <p className="c4-karrusel-meta">{v4("krsFair")} {fair || "—"} · {v4("krsBusy")} {busy || "—"} · {v4("krsSuggest")} {partLabel(v4, suggestedPart)} · {inkLabel(v4, suggestedInk)} · {suggestedTooth}</p>
      <ol className="c4-karrusel-index" aria-label={v4("krsRemind")}>
        <li data-tone="gold">{v4("krsOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("krsIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("krsBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("krsResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-karrusel-remind" aria-label={v4("krsRemind")}>
          {reminders.map((name) => <li key={name}>{v4("krsOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-karrusel-chart" aria-label={v4("krsChart")}>
        {bars.map((bar) => (
          <button key={bar.part} type="button" className="c4-karrusel-column" data-on={partFilter === bar.part ? "1" : "0"} onClick={() => setPartFilter(partFilter === bar.part ? "all" : bar.part)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{partLabel(v4, bar.part)}</span>
          </button>
        ))}
      </div>
      <form className="c4-karrusel-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("krsEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("krsEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("krsNote")}<input className="c4-field" aria-label={v4("krsNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("krsKeeper")}<input className="c4-field" aria-label={v4("krsKeeper")} aria-required={false} value={keeper} maxLength={24} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} /></label>
        <label className="c4-lab">{v4("krsCarriage")}<select className="c4-field" aria-label={v4("krsCarriage")} value={part} disabled={viewer} onChange={(event) => setPart(event.target.value)}><option value="">{v4("krsBlankPart")}</option>{KRS_PARTS.map((item) => <option key={item} value={item}>{partLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("krsInk")}<select className="c4-field" aria-label={v4("krsInk")} value={ink} disabled={viewer} onChange={(event) => setInk(event.target.value)}><option value="">{v4("krsAll")}</option>{INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("krsTooth")}<select className="c4-field" aria-label={v4("krsTooth")} value={toothNo} disabled={viewer} onChange={(event) => setToothNo(event.target.value)}><option value="">{v4("krsAll")}</option>{TEETH.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("krsBeat")}<select className="c4-field" aria-label={v4("krsBeat")} value={beatNo} disabled={viewer} onChange={(event) => setBeatNo(event.target.value)}><option value="">{v4("krsAll")}</option>{BEATS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("krsTag")}<input className="c4-field" aria-label={v4("krsTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("krsAdd")}</button>
      </form>
      <div className="c4-karrusel-tools">
        <input ref={searchRef} className="c4-field c4-karrusel-search" aria-label={v4("krsSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("krsSearch")} />
        {(["bench", "hook", "vault"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bench" ? "krsBench" : item === "hook" ? "krsHook" : "krsVault")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={partFilter === "inner" ? "1" : "0"} onClick={() => setPartFilter(partFilter === "inner" ? "all" : "inner")}>{v4("krsInner")}</button>
        <button type="button" className="c4-chip" data-on={partFilter === "outer" ? "1" : "0"} onClick={() => setPartFilter(partFilter === "outer" ? "all" : "outer")}>{v4("krsOuter")}</button>
        {INKS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={inkFilter === item ? "1" : "0"} onClick={() => setInkFilter(inkFilter === item ? "all" : item)}>{inkLabel(v4, item)}</button>
        ))}
        {TEETH.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toothFilter === item ? "1" : "0"} onClick={() => setToothFilter(toothFilter === item ? "all" : item)}>{item}</button>
        ))}
        {BEATS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={beatFilter === item ? "1" : "0"} onClick={() => setBeatFilter(beatFilter === item ? "all" : item)}>{item}</button>
        ))}
        {keepers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={keeperFilter === name ? "1" : "0"} onClick={() => setKeeperFilter(keeperFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort(sort === "keeper" ? "part" : "keeper")}>{sort === "keeper" ? v4("krsSortKeeper") : v4("krsSortPart")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("krsTight") : v4("krsBroad")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("krsTimeline")}</button>
        <label className="c4-lab">{v4("krsDesk")}<select className="c4-field" aria-label={v4("krsDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>{KRS_PARTS.map((item) => <option key={item} value={item}>{partLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-karrusel-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addKarruselView(views, { id, name: viewName, tray, query, keeper: keeperFilter, ink: inkFilter, part: partFilter, tooth: toothFilter, beat: beatFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("krsViewName")}<input className="c4-field" aria-label={v4("krsViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("krsSaveView")}</button>
      </form>
      <ul className="c4-karrusel-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setKeeperFilter(view.keeper); setInkFilter(view.ink); setPartFilter(view.part); setToothFilter(view.tooth); setBeatFilter(view.beat); }}>{v4("krsApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropKarruselView(views, view.id))}>{v4("krsDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-karrusel-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKarruselWind(cards, picked))}>{v4("krsBulkWind")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKarruselVault(cards, picked))}>{v4("krsBulkVault")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKarruselGraphite(cards, picked))}>{v4("krsBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKarruselTag(cards, picked))}>{v4("krsBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("karrusel-rules.csv", karruselCsv(shown, desk))}>{v4("krsCsv")}</button>
        <p className="c4-karrusel-meta">{v4("krsKeys")} / n x a j k · {v4("krsQuiet")} {counts.quiet} · {v4("krsInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-karrusel-time" aria-label={v4("krsTimeline")}>
          {timeline.map((lane) => <li key={lane.tooth}><span>{lane.tooth}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("krsEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-karrusel-list">
          {shown.map((card) => {
            const late = lateKarrusel(card, desk);
            return (
              <li key={card.id} className="c4-karrusel-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleKarrusel(card) ? "1" : "0"} data-brisk={briskKarrusel(card) ? "1" : "0"} data-overdue={overdueKarrusel(card) ? "1" : "0"} data-resting={restingKarrusel(card) ? "1" : "0"} data-inner={karruselInner(card.part) ? "1" : "0"} data-outer={karruselOuter(card.part) ? "1" : "0"}>
                <label className="c4-karrusel-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editKarrusel(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("krsEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("krsApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editKarruselNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("krsNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-karrusel-meta">{partLabel(v4, card.part)} · {inkLabel(v4, card.ink)} · {card.tooth ?? "—"} · {card.beat} · {card.keeper || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "krsAuditSave")}` : ""}{late ? ` · ${v4("krsOverdue")}` : ""}</p>
                </div>
                <div className="c4-karrusel-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("krsEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKarruselWind(cards, card.id, !card.wound))}>{card.wound ? v4("krsClear") : v4("krsWind")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKarruselInk(cards, card.id, suggestedInk))}>{v4("krsSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKarruselHook(cards, card.id, !card.hooked))}>{card.hooked ? v4("krsUnhook") : v4("krsHookIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKarruselVault(cards, card.id, !card.vaulted))}>{card.vaulted ? v4("krsUnvault") : v4("krsVaultIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKarruselStar(cards, card.id, !card.starred))}>{card.starred ? v4("krsUnstar") : v4("krsStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addKarruselTag(cards, card.id, "k"))}>{v4("krsTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftToothFocused(cards, card.id))}>{v4("krsLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerToothFocused(cards, card.id))}>{v4("krsLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBeatFocused(cards, card.id))}>{v4("krsBeat")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBeatFocused(cards, card.id))}>{v4("krsBeat")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(inkFocused(cards, card.id))}>{v4("krsInk")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKarruselFocused(cards, card.id))}>{v4("krsWind")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(hookKarruselFocused(cards, card.id))}>{v4("krsHook")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starKarruselFocused(cards, card.id))}>{v4("krsStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(karruselCopy(card))}>{v4("krsCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type LoxodromeUser = { id?: string; name?: string | null; desk?: string | null };

export function LoxodromePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: LoxodromeUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<LoxodromeShape>("all");
  const [review, setReview] = useState<LoxodromeReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): LoxodromeRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { desk: textField(row.desk) } satisfies LoxodromeValue,
    };
  }).filter((row): row is LoxodromeRow => Boolean(row));
  const present = presentLoxodromeLanes(rows);
  const presentKey = present.join("\n");
  const idKey = rows.map((row) => row.id).join("\n");

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
    if (queue.loading || queue.error) return;
    const next = readHiddenLoxodrome(readJson(LXD_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(LXD_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedLoxodrome(readJson(LXD_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(LXD_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleLoxodromeLanes(present, hidden, showHidden);
  const shown = visibleLoxodrome(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = loxodromeLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = loxodromeLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingLoxodrome(rows);
  const leadHue = leadingLoxodromeHue(rows);
  const whole = rows.filter((row) => loxodromeLane(row.code)).length;
  const share = loxodromeShare(laneLoxodromeCount(rows, "day"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("loxodrome-lanes.csv", loxodromeLanesCsv(rows));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((row) => row.id));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows, shown]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(LXD_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(LXD_REVIEW_KEY, next);
  }

  return (
    <section className="c4-loxodrome" aria-label={v4("lxdTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-loxodrome-mast">
        <p className="c4-loxodrome-seal" data-logo="mono">{v4("lxdLogo")}</p>
        <div>
          <p className="c4-loxodrome-kicker">{v4("lxdSub")}</p>
          <h2 className="c4-title">{v4("lxdTitle")}</h2>
        </div>
        <p className="c4-loxodrome-count">{shown.length}</p>
      </header>
      <p className="c4-loxodrome-links">
        <Link href={crmv4Href(base, "krs")}>{v4("krsTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("lxdCustomer")}</Link>
      </p>
      <p className="c4-loxodrome-hint">{v4("lxdHint")}</p>
      {viewer && <p className="c4-loxodrome-note">{v4("lxdViewer")}</p>}
      <p className="c4-loxodrome-meta">{v4("lxdLead")} {laneLabel(v4, lead)} · {v4("lxdToneLead")} {hueLabel(v4, leadHue)} · {v4("lxdShare")} {share}</p>
      <div className="c4-loxodrome-chart" aria-label={v4("lxdChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-loxodrome-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-loxodrome-tools">
        <input ref={searchRef} className="c4-field c4-loxodrome-search" aria-label={v4("lxdSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("lxdSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("lxdShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "lxdAll" : item === "reviewed" ? "lxdReviewed" : "lxdFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("lxdAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as LoxodromeShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleLoxodrome(hidden, item))}>{hidden.includes(item) ? v4("lxdShow") : v4("lxdHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-loxodrome-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkLoxodromeReview(reviewed, picked, true))}>{v4("lxdBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkLoxodromeReview(reviewed, picked, false))}>{v4("lxdBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("loxodrome-lanes.csv", loxodromeLanesCsv(rows))}>{v4("lxdCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("loxodrome-rows.csv", loxodromeRowsCsv(shown, reviewed))}>{v4("lxdRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("lxdLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("lxdFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("lxdEmpty")}</p>}
      <ul className="c4-loxodrome-list">
        {shown.map((row) => {
          const name = loxodromeCopy(row.code);
          const tone = loxodromeHue(row.code);
          return (
            <li key={row.id} className="c4-loxodrome-card" data-lane={loxodromeLane(row.code) || "open"} data-hue={tone || "none"} data-day={loxodromeLane(row.code) === "day" ? "1" : "0"} data-open={loxodromeOpen(row.code) ? "1" : "0"} data-even={loxodromeEven(row.code) ? "1" : "0"} data-digit={loxodromeDigit(row.code) ? "1" : "0"} data-letter={loxodromeLetter(row.code) ? "1" : "0"} data-mixed={loxodromeMixed(row.code) ? "1" : "0"} data-upper={loxodromeUpper(row.code) ? "1" : "0"} data-lower={loxodromeLower(row.code) ? "1" : "0"} data-space={loxodromeSpace(row.code) ? "1" : "0"} data-vowel={loxodromeVowel(row.code) ? "1" : "0"} data-tail={loxodromeTail(row.code) ? "1" : "0"} data-first={loxodromeFirst(row.code) ? "1" : "0"} data-held={loxodromeHeld(row.code) ? "1" : "0"} data-slash={loxodromeSlash(row.code) ? "1" : "0"} data-gap={loxodromeGap(row.code) ? "1" : "0"}>
              <label className="c4-loxodrome-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-loxodrome-meta">{name || v4("lxdOpen")} · {loxodromeStamp(row.code) || "—"} · {loxodromeFamily(row.code) || "—"} · {loxodromeLength(row.code) ?? "—"} · {laneLabel(v4, loxodromeLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-loxodrome-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleLoxodromeReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("lxdReviewed") : v4("lxdReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = loxodromeCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("lxdCopied") : v4("lxdCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("lxdCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
