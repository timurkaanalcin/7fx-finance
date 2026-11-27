"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CRN_HIDE_KEY,
  CRN_REVIEW_KEY,
  TAE_DENSITY_KEY,
  TAE_KEY,
  TAE_PROFILES,
  TAE_VIEW_KEY,
  addTaenia,
  addTaeniaTag,
  addTaeniaView,
  bedFocused,
  briskTaenia,
  bulkCoronaReview,
  bulkTaeniaLinen,
  bulkTaeniaShelf,
  bulkTaeniaRaise,
  bulkTaeniaTag,
  busiestHand,
  dropTaeniaView,
  editTaenia,
  editTaeniaNote,
  fairHand,
  coronaBlank,
  coronaCopy,
  coronaDigit,
  coronaEven,
  coronaFar,
  coronaHue,
  coronaLane,
  coronaLanes,
  coronaLanesCsv,
  coronaLength,
  coronaLetter,
  coronaDark,
  coronaDim,
  coronaFade,
  coronaLit,
  coronaOpen,
  coronaRowsCsv,
  coronaShare,
  coronaStamp,
  coronaNear,
  coronaUpper,
  idleTaenia,
  laneCoronaCount,
  lateTaenia,
  leadingCorona,
  leadingCoronaHue,
  giltQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveTaeniaFocus,
  taeniaBars,
  taeniaCopy,
  taeniaCounts,
  taeniaCsv,
  taeniaDensity,
  taeniaHands,
  taeniaTimeline,
  overdueTaenia,
  pinTaeniaFocused,
  presentCoronaLanes,
  profileCool,
  profileWarm,
  rackTaeniaFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenCorona,
  readReviewedCorona,
  readTaeniaViews,
  readTaeniaList,
  reminderTaeniaList,
  restingTaenia,
  setTaeniaFocused,
  setTaeniaBed,
  setTaeniaPin,
  setTaeniaRack,
  setTaeniaRaised,
  setTaeniaShelf,
  sortTaeniaList,
  suggestProfile,
  suggestTaeniaBed,
  suggestTaeniaHour,
  toggleCorona,
  toggleCoronaReview,
  visibleCorona,
  visibleCoronaLanes,
  visibleTaeniaList,
  type CoronaReview,
  type CoronaRow,
  type CoronaShape,
  type CoronaValue,
  type Taenia,
  type TaeniaDensity,
  type TaeniaRack,
  type TaeniaSort,
  type TaeniaView,
} from "@/lib/crmv4/round401";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["3", "6", "9", "12"] as const;
const DEPTHS = ["3", "6", "9"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  taenia: "taeTaenia",
  mutule: "taeMutule",
  astragal: "taeAstragal",
  annulet: "taeAnnulet",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "taeAuditSave",
  edit: "taeAuditEdit",
  note: "taeAuditNote",
  bed: "taeAuditBed",
  raise: "taeAuditRaise",
  free: "taeAuditFree",
  press: "taeAuditPress",
  return: "taeAuditReturn",
  shelf: "taeAuditShelf",
  open: "taeAuditOpen",
  tag: "taeAuditTag",
  depth: "taeAuditDepth",
  hour: "taeAuditHour",
  lower: "taeAuditLower",
  pin: "taeAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  grant: "crnLaneGrant",
  code: "crnLaneCode",
  short: "crnLaneShort",
  long: "crnLaneLong",
  hold: "crnLaneHold",
  shut: "crnLaneShut",
  blank: "crnLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "crnGilt",
  pearl: "crnPearl",
  ash: "crnAsh",
};

const SHAPE_KEY: Record<CoronaShape, CrmV4CopyKey> = {
  all: "crnShapeAll",
  grant: "crnShapeGrant",
  code: "crnShapeCode",
  short: "crnShapeShort",
  long: "crnShapeLong",
  hold: "crnShapeHold",
  shut: "crnShapeShut",
  blank: "crnShapeBlank",
  open: "crnShapeOpen",
  digit: "crnShapeDigit",
  letter: "crnShapeLetter",
  even: "crnShapeEven",
  upper: "crnShapeUpper",
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

function profileLabel(v4: V4, profile: string): string {
  const key = PROFILE_KEY[profile];
  return key ? v4(key) : v4("taeBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("taeLinen");
  if (bed === "GRAPHITE") return v4("taeSlate");
  if (bed === "GILT") return v4("taeGilt");
  return v4("taeAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("crnBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("crnBlank");
}

export function TaeniaCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Taenia[]>([]);
  const [views, setViews] = useState<TaeniaView[]>([]);
  const [density, setDensity] = useState<TaeniaDensity>("open");
  const [rack, setRack] = useState<TaeniaRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<TaeniaSort>("profile");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [hand, setHand] = useState("");
  const [profile, setProfile] = useState("");
  const [bed, setBed] = useState("");
  const [hourNo, setHourNo] = useState("");
  const [depthNo, setDepthNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [station, setStation] = useState("taenia");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readTaeniaList(readJson(TAE_KEY, [])));
    setViews(readTaeniaViews(readJson(TAE_VIEW_KEY, [])));
    setDensity(taeniaDensity(readJson(TAE_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Taenia[]) {
    setCards(next);
    writeJson(TAE_KEY, next);
  }
  function storeViews(next: TaeniaView[]) {
    setViews(next);
    writeJson(TAE_VIEW_KEY, next);
  }
  function storeDensity(next: TaeniaDensity) {
    setDensity(next);
    writeJson(TAE_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortTaeniaList(visibleTaeniaList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = taeniaCounts(cards, shown, station);
  const bars = taeniaBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = taeniaTimeline(cards);
  const reminders = reminderTaeniaList(cards);
  const hands = taeniaHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestTaeniaBed(cards);
  const suggestedHour = suggestTaeniaHour(cards, clock);
  const suggestedProfile = suggestProfile(clock);
  const focused = shown[Math.min(focusAt, Math.max(0, shown.length - 1))];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "/" && !typingTarget(event)) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (typingTarget(event) || viewer) return;
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("taenia-courses.csv", taeniaCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveTaeniaFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveTaeniaFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addTaenia(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-taenia" aria-label={v4("taeTitle")} data-taenia="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-taenia-mast">
        <p className="c4-taenia-seal" data-logo="mono">{v4("taeLogo")}</p>
        <div>
          <p className="c4-taenia-kicker">{v4("taeSub")}</p>
          <h2 className="c4-title">{v4("taeTitle")}</h2>
        </div>
        <p className="c4-taenia-count">{shown.length}</p>
      </header>
      <p className="c4-taenia-links">
        <Link href={crmv4Href(base, "crn")}>{v4("crnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("taeCustomers")}</Link>
      </p>
      <p className="c4-taenia-hint">{v4("taeHint")}</p>
      {viewer && <p className="c4-taenia-note">{v4("taeViewer")}</p>}
      <p className="c4-taenia-meta">{v4("taeFair")} {fair || "—"} · {v4("taeBusy")} {busy || "—"} · {v4("taeSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-taenia-index" aria-label={v4("taeRemind")}>
        <li data-tone="gold">{v4("taeOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("taeIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("taeBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("taeResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-taenia-remind c4-taenia-notices" role="status" aria-label={v4("taeRemind")}>
          {reminders.map((name) => <li key={name}>{v4("taeOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-taenia-chart" aria-label={v4("taeChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-taenia-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-taenia-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("taeEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("taeEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("taeNote")}<input className="c4-field" aria-label={v4("taeNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("taeHand")}<input className="c4-field" aria-label={v4("taeHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("taeProfile")}<select className="c4-field" aria-label={v4("taeProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("taeBlankProfile")}</option>{TAE_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("taeBed")}<select className="c4-field" aria-label={v4("taeBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("taeAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("taeHour")}<select className="c4-field" aria-label={v4("taeHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("taeAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("taeDepth")}<select className="c4-field" aria-label={v4("taeDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("taeAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("taeTag")}<input className="c4-field" aria-label={v4("taeTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("taeAdd")}</button>
      </form>
      <div className="c4-taenia-tools">
        <input ref={searchRef} className="c4-field c4-taenia-search" aria-label={v4("taeSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("taeSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "taeYard" : item === "press" ? "taePress" : "taeShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("taeWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("taeCool")}</button>
        {BEDS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={bedFilter === item ? "1" : "0"} onClick={() => setBedFilter(bedFilter === item ? "all" : item)}>{bedLabel(v4, item)}</button>
        ))}
        {HOURS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hourFilter === item ? "1" : "0"} onClick={() => setHourFilter(hourFilter === item ? "all" : item)}>{item}</button>
        ))}
        {DEPTHS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={depthFilter === item ? "1" : "0"} onClick={() => setDepthFilter(depthFilter === item ? "all" : item)}>{item}</button>
        ))}
        {hands.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={handFilter === name ? "1" : "0"} onClick={() => setHandFilter(handFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("taeSortHand") : v4("taeSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("taeTight") : v4("taeOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("taeTimeline")}</button>
        <label className="c4-lab">{v4("taeDesk")}<select className="c4-field" aria-label={v4("taeDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{TAE_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-taenia-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addTaeniaView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("taeViewName")}<input className="c4-field" aria-label={v4("taeViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("taeSaveView")}</button>
      </form>
      <ul className="c4-taenia-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("taeApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropTaeniaView(views, view.id))}>{v4("taeDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-taenia-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTaeniaRaise(cards, picked))}>{v4("taeBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTaeniaShelf(cards, picked))}>{v4("taeBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTaeniaLinen(cards, picked))}>{v4("taeBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTaeniaTag(cards, picked))}>{v4("taeBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("taenia-courses.csv", taeniaCsv(shown, station))}>{v4("taeCsv")}</button>
        <p className="c4-taenia-meta">{v4("taeKeys")} / c x a j k · {v4("taeQuiet")} {counts.quiet} · {v4("taeWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-taenia-time" aria-label={v4("taeTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("taeEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-taenia-list">
          {shown.map((card) => {
            const late = lateTaenia(card, station);
            return (
              <li key={card.id} className="c4-taenia-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleTaenia(card) ? "1" : "0"} data-brisk={briskTaenia(card) ? "1" : "0"} data-overdue={overdueTaenia(card) ? "1" : "0"} data-resting={restingTaenia(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={giltQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-taenia-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editTaenia(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("taeEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("taeApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editTaeniaNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("taeNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-taenia-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "taeAuditSave")}` : ""}{late ? ` · ${v4("taeOverdue")}` : ""}</p>
                </div>
                <div className="c4-taenia-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("taeEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTaeniaRaised(cards, card.id, !card.raised))}>{card.raised ? v4("taeFree") : v4("taeRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTaeniaBed(cards, card.id, suggestedBed))}>{v4("taeSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTaeniaRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("taeUnpress") : v4("taePressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTaeniaShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("taeUnshelf") : v4("taeShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTaeniaPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("taeUnpin") : v4("taePin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addTaeniaTag(cards, card.id, "t"))}>{v4("taeTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("taeRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("taeLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("taeDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("taeDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("taeBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTaeniaFocused(cards, card.id))}>{v4("taeRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackTaeniaFocused(cards, card.id))}>{v4("taePress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinTaeniaFocused(cards, card.id))}>{v4("taePin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(taeniaCopy(card))}>{v4("taeCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; canApproveDeposits?: boolean | string | number | null };

export function CoronaPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<CoronaShape>("all");
  const [review, setReview] = useState<CoronaReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): CoronaRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { canApproveDeposits: textField(row.canApproveDeposits) } satisfies CoronaValue,
    };
  }).filter((row): row is CoronaRow => Boolean(row));
  const present = presentCoronaLanes(rows);
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
    const next = readHiddenCorona(readJson(CRN_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(CRN_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedCorona(readJson(CRN_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(CRN_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleCoronaLanes(present, hidden, showHidden);
  const shown = visibleCorona(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = coronaLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = coronaLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingCorona(rows);
  const leadHue = leadingCoronaHue(rows);
  const whole = rows.filter((row) => coronaLane(row.code)).length;
  const share = coronaShare(laneCoronaCount(rows, "grant"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("corona-grant-lanes.csv", coronaLanesCsv(rows));
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
    writeJson(CRN_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(CRN_REVIEW_KEY, next);
  }

  return (
    <section className="c4-corona" aria-label={v4("crnTitle")} data-corona="1" data-role={role} data-desk="1">
      <header className="c4-corona-mast">
        <p className="c4-corona-seal" data-logo="mono">{v4("crnLogo")}</p>
        <div>
          <p className="c4-corona-kicker">{v4("crnSub")}</p>
          <h2 className="c4-title">{v4("crnTitle")}</h2>
        </div>
        <p className="c4-corona-count">{shown.length}</p>
      </header>
      <p className="c4-corona-links">
        <Link href={crmv4Href(base, "tae")}>{v4("taeTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("crnCustomer")}</Link>
      </p>
      <p className="c4-corona-hint">{v4("crnHint")}</p>
      {viewer && <p className="c4-corona-note">{v4("crnViewer")}</p>}
      {queue.loading && <p className="c4-corona-meta">{v4("crnLoading")}</p>}
      {queue.error && <p className="c4-corona-meta">{v4("crnFailed")}</p>}
      <p className="c4-corona-meta">{v4("crnLead")} {laneLabel(v4, lead)} · {v4("crnToneLead")} {hueLabel(v4, leadHue)} · {v4("crnShare")} {share}</p>
      <div className="c4-corona-chart" aria-label={v4("crnChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-corona-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-corona-tools">
        <input ref={searchRef} className="c4-field c4-corona-search" aria-label={v4("crnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("crnSearch")} />
        <label className="c4-lab">{v4("crnChart")}<select className="c4-field" aria-label={v4("crnChart")} value={shape} onChange={(event) => setShape(event.target.value as CoronaShape)}>{(Object.keys(SHAPE_KEY) as CoronaShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("crnGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("crnPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("crnAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("crnFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("crnReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("crnShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleCorona(hidden, lane))}>{v4("crnHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-corona-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkCoronaReview(reviewed, picked, true))}>{v4("crnBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkCoronaReview(reviewed, picked, false))}>{v4("crnBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("corona-grants.csv", coronaRowsCsv(shown, reviewed))}>{v4("crnRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("corona-grant-lanes.csv", coronaLanesCsv(rows))}>{v4("crnCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("crnEmpty")}</p>}
      <ul className="c4-corona-list">
        {shown.map((row) => {
          const tone = coronaHue(row.code);
          const name = coronaCopy(row.code);
          return (
            <li key={row.id} className="c4-corona-card" data-mail={coronaLane(row.code) || "open"} data-hue={tone || "none"} data-lit={coronaLit(row.code) ? "1" : "0"} data-figure={coronaNear(row.code) ? "1" : "0"} data-short={coronaFar(row.code) ? "1" : "0"} data-long={coronaFade(row.code) ? "1" : "0"} data-dark={coronaDark(row.code) ? "1" : "0"} data-dim={coronaDim(row.code) ? "1" : "0"} data-blank={coronaBlank(row.code) ? "1" : "0"} data-open={coronaOpen(row.code) ? "1" : "0"} data-even={coronaEven(row.code) ? "1" : "0"} data-digit={coronaDigit(row.code) ? "1" : "0"} data-letter={coronaLetter(row.code) ? "1" : "0"} data-upper={coronaUpper(row.code) ? "1" : "0"}>
              <label className="c4-corona-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-corona-meta">{name || v4("crnOpen")} · {coronaStamp(row.code) || "—"} · {coronaLength(row.code) ?? "—"} · {laneLabel(v4, coronaLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-corona-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCoronaReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("crnReviewed") : v4("crnReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(coronaCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("crnCopied") : v4("crnCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("crnCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
