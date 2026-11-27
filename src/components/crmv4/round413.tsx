"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  TLM_HIDE_KEY,
  TLM_REVIEW_KEY,
  CYD_DENSITY_KEY,
  CYD_KEY,
  CYD_PROFILES,
  CYD_VIEW_KEY,
  addCaryatid,
  addCaryatidTag,
  addCaryatidView,
  bedFocused,
  briskCaryatid,
  bulkTelamonReview,
  bulkCaryatidLinen,
  bulkCaryatidShelf,
  bulkCaryatidRaise,
  bulkCaryatidTag,
  busiestHand,
  dropCaryatidView,
  editCaryatid,
  editCaryatidNote,
  fairHand,
  telamonBlank,
  telamonCopy,
  telamonDigit,
  telamonEven,
  telamonFar,
  telamonHue,
  telamonLane,
  telamonLanes,
  telamonLanesCsv,
  telamonLength,
  telamonLetter,
  telamonDark,
  telamonDim,
  telamonFade,
  telamonLit,
  telamonOpen,
  telamonRowsCsv,
  telamonShare,
  telamonSlice,
  telamonStamp,
  telamonNear,
  telamonUpper,
  idleCaryatid,
  laneTelamonCount,
  lateCaryatid,
  leadingTelamon,
  leadingTelamonHue,
  graphiteQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveCaryatidFocus,
  caryatidBars,
  caryatidCopy,
  caryatidCounts,
  caryatidCsv,
  caryatidDensity,
  caryatidHands,
  caryatidTimeline,
  overdueCaryatid,
  pinCaryatidFocused,
  presentTelamonLanes,
  profileCool,
  profileWarm,
  rackCaryatidFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenTelamon,
  readReviewedTelamon,
  readCaryatidViews,
  readCaryatidList,
  reminderCaryatidList,
  restingCaryatid,
  setCaryatidFocused,
  setCaryatidBed,
  setCaryatidPin,
  setCaryatidRack,
  setCaryatidRaised,
  setCaryatidShelf,
  sortCaryatidList,
  suggestProfile,
  suggestCaryatidBed,
  suggestCaryatidHour,
  toggleTelamon,
  toggleTelamonReview,
  visibleTelamon,
  visibleTelamonLanes,
  visibleCaryatidList,
  type TelamonReview,
  type TelamonRow,
  type TelamonShape,
  type Caryatid,
  type CaryatidDensity,
  type CaryatidRack,
  type CaryatidSort,
  type CaryatidView,
} from "@/lib/crmv4/round413";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["2", "7", "11", "18"] as const;
const DEPTHS = ["4", "7", "11"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  caryatid: "cydCaryatid",
  baldachin: "cydBaldachin",
  cathedra: "cydCathedra",
  templon: "cydTemplon",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "cydAuditSave",
  edit: "cydAuditEdit",
  note: "cydAuditNote",
  bed: "cydAuditBed",
  raise: "cydAuditRaise",
  free: "cydAuditFree",
  press: "cydAuditPress",
  return: "cydAuditReturn",
  shelf: "cydAuditShelf",
  open: "cydAuditOpen",
  tag: "cydAuditTag",
  depth: "cydAuditDepth",
  hour: "cydAuditHour",
  lower: "cydAuditLower",
  pin: "cydAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "tlmLaneLive",
  code: "tlmLaneCode",
  short: "tlmLaneShort",
  long: "tlmLaneLong",
  hold: "tlmLaneHold",
  shut: "tlmLaneShut",
  blank: "tlmLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "tlmGilt",
  pearl: "tlmPearl",
  ash: "tlmAsh",
};

const SHAPE_KEY: Record<TelamonShape, CrmV4CopyKey> = {
  all: "tlmShapeAll",
  live: "tlmShapeLive",
  code: "tlmShapeCode",
  short: "tlmShapeShort",
  long: "tlmShapeLong",
  hold: "tlmShapeHold",
  shut: "tlmShapeShut",
  blank: "tlmShapeBlank",
  open: "tlmShapeOpen",
  digit: "tlmShapeDigit",
  letter: "tlmShapeLetter",
  even: "tlmShapeEven",
  upper: "tlmShapeUpper",
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
  return key ? v4(key) : v4("cydBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("cydLinen");
  if (bed === "GRAPHITE") return v4("cydSlate");
  if (bed === "GILT") return v4("cydGilt");
  return v4("cydAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("tlmBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("tlmBlank");
}

export function CaryatidCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Caryatid[]>([]);
  const [views, setViews] = useState<CaryatidView[]>([]);
  const [density, setDensity] = useState<CaryatidDensity>("open");
  const [rack, setRack] = useState<CaryatidRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<CaryatidSort>("profile");
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
  const [station, setStation] = useState("caryatid");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readCaryatidList(readJson(CYD_KEY, [])));
    setViews(readCaryatidViews(readJson(CYD_VIEW_KEY, [])));
    setDensity(caryatidDensity(readJson(CYD_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Caryatid[]) {
    setCards(next);
    writeJson(CYD_KEY, next);
  }
  function storeViews(next: CaryatidView[]) {
    setViews(next);
    writeJson(CYD_VIEW_KEY, next);
  }
  function storeDensity(next: CaryatidDensity) {
    setDensity(next);
    writeJson(CYD_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortCaryatidList(visibleCaryatidList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = caryatidCounts(cards, shown, station);
  const bars = caryatidBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = caryatidTimeline(cards);
  const reminders = reminderCaryatidList(cards);
  const hands = caryatidHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestCaryatidBed(cards);
  const suggestedHour = suggestCaryatidHour(cards, clock);
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
        download("caryatid-courses.csv", caryatidCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveCaryatidFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveCaryatidFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addCaryatid(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-cyd413" aria-label={v4("cydTitle")} data-cyd413="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-cyd413-mast">
        <p className="c4-cyd413-seal" data-logo="mono">{v4("cydLogo")}</p>
        <div>
          <p className="c4-cyd413-kicker">{v4("cydSub")}</p>
          <h2 className="c4-title">{v4("cydTitle")}</h2>
        </div>
        <p className="c4-cyd413-count">{shown.length}</p>
      </header>
      <p className="c4-cyd413-links">
        <Link href={crmv4Href(base, "tlm")}>{v4("tlmTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("cydCustomers")}</Link>
      </p>
      <p className="c4-cyd413-hint">{v4("cydHint")}</p>
      {viewer && <p className="c4-cyd413-note">{v4("cydViewer")}</p>}
      <p className="c4-cyd413-meta">{v4("cydFair")} {fair || "—"} · {v4("cydBusy")} {busy || "—"} · {v4("cydSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-cyd413-index" aria-label={v4("cydRemind")}>
        <li data-tone="gold">{v4("cydOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("cydIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("cydBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("cydResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-cyd413-remind c4-cyd413-notices" role="status" aria-label={v4("cydRemind")}>
          {reminders.map((name) => <li key={name}>{v4("cydOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-cyd413-chart" aria-label={v4("cydChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-cyd413-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-cyd413-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("cydEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("cydEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("cydNote")}<input className="c4-field" aria-label={v4("cydNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("cydHand")}<input className="c4-field" aria-label={v4("cydHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("cydProfile")}<select className="c4-field" aria-label={v4("cydProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("cydBlankProfile")}</option>{CYD_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("cydBed")}<select className="c4-field" aria-label={v4("cydBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("cydAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("cydHour")}<select className="c4-field" aria-label={v4("cydHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("cydAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("cydDepth")}<select className="c4-field" aria-label={v4("cydDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("cydAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("cydTag")}<input className="c4-field" aria-label={v4("cydTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("cydAdd")}</button>
      </form>
      <div className="c4-cyd413-tools">
        <input ref={searchRef} className="c4-field c4-cyd413-search" aria-label={v4("cydSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("cydSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "cydYard" : item === "press" ? "cydPress" : "cydShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("cydWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("cydCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("cydSortHand") : v4("cydSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("cydTight") : v4("cydOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("cydTimeline")}</button>
        <label className="c4-lab">{v4("cydDesk")}<select className="c4-field" aria-label={v4("cydDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{CYD_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-cyd413-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addCaryatidView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("cydViewName")}<input className="c4-field" aria-label={v4("cydViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("cydSaveView")}</button>
      </form>
      <ul className="c4-cyd413-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("cydApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropCaryatidView(views, view.id))}>{v4("cydDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-cyd413-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCaryatidRaise(cards, picked))}>{v4("cydBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCaryatidShelf(cards, picked))}>{v4("cydBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCaryatidLinen(cards, picked))}>{v4("cydBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCaryatidTag(cards, picked))}>{v4("cydBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("caryatid-courses.csv", caryatidCsv(shown, station))}>{v4("cydCsv")}</button>
        <p className="c4-cyd413-meta">{v4("cydKeys")} / c x a j k · {v4("cydQuiet")} {counts.quiet} · {v4("cydWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-cyd413-time" aria-label={v4("cydTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("cydEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-cyd413-list">
          {shown.map((card) => {
            const late = lateCaryatid(card, station);
            return (
              <li key={card.id} className="c4-cyd413-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleCaryatid(card) ? "1" : "0"} data-brisk={briskCaryatid(card) ? "1" : "0"} data-overdue={overdueCaryatid(card) ? "1" : "0"} data-resting={restingCaryatid(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={graphiteQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-cyd413-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCaryatid(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("cydEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("cydApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCaryatidNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("cydNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-cyd413-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "cydAuditSave")}` : ""}{late ? ` · ${v4("cydOverdue")}` : ""}</p>
                </div>
                <div className="c4-cyd413-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("cydEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCaryatidRaised(cards, card.id, !card.raised))}>{card.raised ? v4("cydFree") : v4("cydRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCaryatidBed(cards, card.id, suggestedBed))}>{v4("cydSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCaryatidRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("cydUnpress") : v4("cydPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCaryatidShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("cydUnshelf") : v4("cydShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCaryatidPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("cydUnpin") : v4("cydPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCaryatidTag(cards, card.id, "m"))}>{v4("cydTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("cydRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("cydLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("cydDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("cydDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("cydBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCaryatidFocused(cards, card.id))}>{v4("cydRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackCaryatidFocused(cards, card.id))}>{v4("cydPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinCaryatidFocused(cards, card.id))}>{v4("cydPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(caryatidCopy(card))}>{v4("cydCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; language?: unknown };

export function TelamonPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<TelamonShape>("all");
  const [review, setReview] = useState<TelamonReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): TelamonRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: telamonSlice(row),
    };
  }).filter((row): row is TelamonRow => Boolean(row));
  const present = presentTelamonLanes(rows);
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
    const next = readHiddenTelamon(readJson(TLM_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(TLM_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedTelamon(readJson(TLM_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(TLM_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleTelamonLanes(present, hidden, showHidden);
  const shown = visibleTelamon(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = telamonLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = telamonLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingTelamon(rows);
  const leadHue = leadingTelamonHue(rows);
  const whole = rows.filter((row) => telamonLane(row.code)).length;
  const share = telamonShare(laneTelamonCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("telamon-language-lanes.csv", telamonLanesCsv(rows));
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
    writeJson(TLM_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(TLM_REVIEW_KEY, next);
  }

  return (
    <section className="c4-tlm413" aria-label={v4("tlmTitle")} data-tlm413="1" data-role={role} data-language="1">
      <header className="c4-tlm413-mast">
        <p className="c4-tlm413-seal" data-logo="mono">{v4("tlmLogo")}</p>
        <div>
          <p className="c4-tlm413-kicker">{v4("tlmSub")}</p>
          <h2 className="c4-title">{v4("tlmTitle")}</h2>
        </div>
        <p className="c4-tlm413-count">{shown.length}</p>
      </header>
      <p className="c4-tlm413-links">
        <Link href={crmv4Href(base, "cyd")}>{v4("cydTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("tlmCustomer")}</Link>
      </p>
      <p className="c4-tlm413-hint">{v4("tlmHint")}</p>
      {viewer && <p className="c4-tlm413-note">{v4("tlmViewer")}</p>}
      {queue.loading && <p className="c4-tlm413-meta">{v4("tlmLoading")}</p>}
      {queue.error && <p className="c4-tlm413-meta">{v4("tlmFailed")}</p>}
      <p className="c4-tlm413-meta">{v4("tlmLead")} {laneLabel(v4, lead)} · {v4("tlmToneLead")} {hueLabel(v4, leadHue)} · {v4("tlmShare")} {share}</p>
      <div className="c4-tlm413-chart" aria-label={v4("tlmChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-tlm413-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ width: `${Math.max(18, Math.round((line.count / peak) * 100))}%` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-tlm413-tools">
        <input ref={searchRef} className="c4-field c4-tlm413-search" aria-label={v4("tlmSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("tlmSearch")} />
        <label className="c4-lab">{v4("tlmChart")}<select className="c4-field" aria-label={v4("tlmChart")} value={shape} onChange={(event) => setShape(event.target.value as TelamonShape)}>{(Object.keys(SHAPE_KEY) as TelamonShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("tlmGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("tlmPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("tlmAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("tlmFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("tlmReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("tlmShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleTelamon(hidden, lane))}>{v4("tlmHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-tlm413-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkTelamonReview(reviewed, picked, true))}>{v4("tlmBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkTelamonReview(reviewed, picked, false))}>{v4("tlmBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("telamon-language-rows.csv", telamonRowsCsv(shown, reviewed))}>{v4("tlmRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("telamon-language-marks.csv", telamonLanesCsv(rows))}>{v4("tlmCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("tlmEmpty")}</p>}
      <ul className="c4-tlm413-list">
        {shown.map((row) => {
          const tone = telamonHue(row.code);
          const name = telamonCopy(row.code);
          return (
            <li key={row.id} className="c4-tlm413-card" data-mail={telamonLane(row.code) || "open"} data-hue={tone || "none"} data-lit={telamonLit(row.code) ? "1" : "0"} data-figure={telamonNear(row.code) ? "1" : "0"} data-short={telamonFar(row.code) ? "1" : "0"} data-long={telamonFade(row.code) ? "1" : "0"} data-dark={telamonDark(row.code) ? "1" : "0"} data-dim={telamonDim(row.code) ? "1" : "0"} data-blank={telamonBlank(row.code) ? "1" : "0"} data-open={telamonOpen(row.code) ? "1" : "0"} data-even={telamonEven(row.code) ? "1" : "0"} data-digit={telamonDigit(row.code) ? "1" : "0"} data-letter={telamonLetter(row.code) ? "1" : "0"} data-upper={telamonUpper(row.code) ? "1" : "0"}>
              <label className="c4-tlm413-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-tlm413-meta">{name || v4("tlmOpen")} · {telamonStamp(row.code) || "—"} · {telamonLength(row.code) ?? "—"} · {laneLabel(v4, telamonLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-tlm413-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleTelamonReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("tlmReviewed") : v4("tlmReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(telamonCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("tlmCopied") : v4("tlmCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("tlmCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
