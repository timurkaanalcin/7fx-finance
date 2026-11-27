"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  IMB_HIDE_KEY,
  IMB_REVIEW_KEY,
  KRP_DENSITY_KEY,
  KRP_KEY,
  KRP_PROFILES,
  KRP_VIEW_KEY,
  addKrepis,
  addKrepisTag,
  addKrepisView,
  bedFocused,
  briskKrepis,
  bulkImbrexReview,
  bulkKrepisLinen,
  bulkKrepisShelf,
  bulkKrepisRaise,
  bulkKrepisTag,
  busiestHand,
  dropKrepisView,
  editKrepis,
  editKrepisNote,
  fairHand,
  imbrexBlank,
  imbrexCopy,
  imbrexDigit,
  imbrexEven,
  imbrexFar,
  imbrexHue,
  imbrexLane,
  imbrexLanes,
  imbrexLanesCsv,
  imbrexLength,
  imbrexLetter,
  imbrexDark,
  imbrexDim,
  imbrexFade,
  imbrexLit,
  imbrexOpen,
  imbrexRowsCsv,
  imbrexShare,
  imbrexSlice,
  imbrexStamp,
  imbrexNear,
  imbrexUpper,
  idleKrepis,
  laneImbrexCount,
  lateKrepis,
  leadingImbrex,
  leadingImbrexHue,
  graphiteQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveKrepisFocus,
  krepisBars,
  krepisCopy,
  krepisCounts,
  krepisCsv,
  krepisDensity,
  krepisHands,
  krepisTimeline,
  overdueKrepis,
  pinKrepisFocused,
  presentImbrexLanes,
  profileCool,
  profileWarm,
  rackKrepisFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenImbrex,
  readReviewedImbrex,
  readKrepisViews,
  readKrepisList,
  reminderKrepisList,
  restingKrepis,
  setKrepisFocused,
  setKrepisBed,
  setKrepisPin,
  setKrepisRack,
  setKrepisRaised,
  setKrepisShelf,
  sortKrepisList,
  suggestProfile,
  suggestKrepisBed,
  suggestKrepisHour,
  toggleImbrex,
  toggleImbrexReview,
  visibleImbrex,
  visibleImbrexLanes,
  visibleKrepisList,
  type ImbrexReview,
  type ImbrexRow,
  type ImbrexShape,
  type Krepis,
  type KrepisDensity,
  type KrepisRack,
  type KrepisSort,
  type KrepisView,
} from "@/lib/crmv4/round408";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["4", "8", "12", "20"] as const;
const DEPTHS = ["2", "6", "10"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  krepis: "krpKrepis",
  tegula: "krpTegula",
  campana: "krpCampana",
  oculus: "krpOculus",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "krpAuditSave",
  edit: "krpAuditEdit",
  note: "krpAuditNote",
  bed: "krpAuditBed",
  raise: "krpAuditRaise",
  free: "krpAuditFree",
  press: "krpAuditPress",
  return: "krpAuditReturn",
  shelf: "krpAuditShelf",
  open: "krpAuditOpen",
  tag: "krpAuditTag",
  depth: "krpAuditDepth",
  hour: "krpAuditHour",
  lower: "krpAuditLower",
  pin: "krpAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "imbLaneLive",
  code: "imbLaneCode",
  short: "imbLaneShort",
  long: "imbLaneLong",
  hold: "imbLaneHold",
  shut: "imbLaneShut",
  blank: "imbLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "imbGilt",
  pearl: "imbPearl",
  ash: "imbAsh",
};

const SHAPE_KEY: Record<ImbrexShape, CrmV4CopyKey> = {
  all: "imbShapeAll",
  live: "imbShapeLive",
  code: "imbShapeCode",
  short: "imbShapeShort",
  long: "imbShapeLong",
  hold: "imbShapeHold",
  shut: "imbShapeShut",
  blank: "imbShapeBlank",
  open: "imbShapeOpen",
  digit: "imbShapeDigit",
  letter: "imbShapeLetter",
  even: "imbShapeEven",
  upper: "imbShapeUpper",
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
  return key ? v4(key) : v4("krpBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("krpLinen");
  if (bed === "GRAPHITE") return v4("krpSlate");
  if (bed === "GILT") return v4("krpGilt");
  return v4("krpAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("imbBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("imbBlank");
}

export function KrepisCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Krepis[]>([]);
  const [views, setViews] = useState<KrepisView[]>([]);
  const [density, setDensity] = useState<KrepisDensity>("open");
  const [rack, setRack] = useState<KrepisRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<KrepisSort>("profile");
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
  const [station, setStation] = useState("krepis");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readKrepisList(readJson(KRP_KEY, [])));
    setViews(readKrepisViews(readJson(KRP_VIEW_KEY, [])));
    setDensity(krepisDensity(readJson(KRP_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Krepis[]) {
    setCards(next);
    writeJson(KRP_KEY, next);
  }
  function storeViews(next: KrepisView[]) {
    setViews(next);
    writeJson(KRP_VIEW_KEY, next);
  }
  function storeDensity(next: KrepisDensity) {
    setDensity(next);
    writeJson(KRP_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortKrepisList(visibleKrepisList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = krepisCounts(cards, shown, station);
  const bars = krepisBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = krepisTimeline(cards);
  const reminders = reminderKrepisList(cards);
  const hands = krepisHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestKrepisBed(cards);
  const suggestedHour = suggestKrepisHour(cards, clock);
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
        download("krepis-courses.csv", krepisCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveKrepisFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveKrepisFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addKrepis(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-krepis" aria-label={v4("krpTitle")} data-krepis="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-krepis-mast">
        <p className="c4-krepis-seal" data-logo="mono">{v4("krpLogo")}</p>
        <div>
          <p className="c4-krepis-kicker">{v4("krpSub")}</p>
          <h2 className="c4-title">{v4("krpTitle")}</h2>
        </div>
        <p className="c4-krepis-count">{shown.length}</p>
      </header>
      <p className="c4-krepis-links">
        <Link href={crmv4Href(base, "imb")}>{v4("imbTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("krpCustomers")}</Link>
      </p>
      <p className="c4-krepis-hint">{v4("krpHint")}</p>
      {viewer && <p className="c4-krepis-note">{v4("krpViewer")}</p>}
      <p className="c4-krepis-meta">{v4("krpFair")} {fair || "—"} · {v4("krpBusy")} {busy || "—"} · {v4("krpSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-krepis-index" aria-label={v4("krpRemind")}>
        <li data-tone="gold">{v4("krpOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("krpIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("krpBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("krpResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-krepis-remind c4-krepis-notices" role="status" aria-label={v4("krpRemind")}>
          {reminders.map((name) => <li key={name}>{v4("krpOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-krepis-chart" aria-label={v4("krpChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-krepis-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-krepis-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("krpEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("krpEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("krpNote")}<input className="c4-field" aria-label={v4("krpNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("krpHand")}<input className="c4-field" aria-label={v4("krpHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("krpProfile")}<select className="c4-field" aria-label={v4("krpProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("krpBlankProfile")}</option>{KRP_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("krpBed")}<select className="c4-field" aria-label={v4("krpBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("krpAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("krpHour")}<select className="c4-field" aria-label={v4("krpHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("krpAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("krpDepth")}<select className="c4-field" aria-label={v4("krpDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("krpAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("krpTag")}<input className="c4-field" aria-label={v4("krpTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("krpAdd")}</button>
      </form>
      <div className="c4-krepis-tools">
        <input ref={searchRef} className="c4-field c4-krepis-search" aria-label={v4("krpSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("krpSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "krpYard" : item === "press" ? "krpPress" : "krpShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("krpWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("krpCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("krpSortHand") : v4("krpSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("krpTight") : v4("krpOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("krpTimeline")}</button>
        <label className="c4-lab">{v4("krpDesk")}<select className="c4-field" aria-label={v4("krpDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{KRP_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-krepis-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addKrepisView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("krpViewName")}<input className="c4-field" aria-label={v4("krpViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("krpSaveView")}</button>
      </form>
      <ul className="c4-krepis-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("krpApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropKrepisView(views, view.id))}>{v4("krpDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-krepis-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKrepisRaise(cards, picked))}>{v4("krpBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKrepisShelf(cards, picked))}>{v4("krpBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKrepisLinen(cards, picked))}>{v4("krpBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKrepisTag(cards, picked))}>{v4("krpBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("krepis-courses.csv", krepisCsv(shown, station))}>{v4("krpCsv")}</button>
        <p className="c4-krepis-meta">{v4("krpKeys")} / c x a j k · {v4("krpQuiet")} {counts.quiet} · {v4("krpWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-krepis-time" aria-label={v4("krpTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("krpEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-krepis-list">
          {shown.map((card) => {
            const late = lateKrepis(card, station);
            return (
              <li key={card.id} className="c4-krepis-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleKrepis(card) ? "1" : "0"} data-brisk={briskKrepis(card) ? "1" : "0"} data-overdue={overdueKrepis(card) ? "1" : "0"} data-resting={restingKrepis(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={graphiteQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-krepis-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editKrepis(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("krpEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("krpApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editKrepisNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("krpNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-krepis-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "krpAuditSave")}` : ""}{late ? ` · ${v4("krpOverdue")}` : ""}</p>
                </div>
                <div className="c4-krepis-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("krpEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKrepisRaised(cards, card.id, !card.raised))}>{card.raised ? v4("krpFree") : v4("krpRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKrepisBed(cards, card.id, suggestedBed))}>{v4("krpSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKrepisRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("krpUnpress") : v4("krpPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKrepisShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("krpUnshelf") : v4("krpShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKrepisPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("krpUnpin") : v4("krpPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addKrepisTag(cards, card.id, "k"))}>{v4("krpTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("krpRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("krpLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("krpDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("krpDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("krpBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKrepisFocused(cards, card.id))}>{v4("krpRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackKrepisFocused(cards, card.id))}>{v4("krpPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinKrepisFocused(cards, card.id))}>{v4("krpPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(krepisCopy(card))}>{v4("krpCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; lastName?: unknown };

export function ImbrexPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<ImbrexShape>("all");
  const [review, setReview] = useState<ImbrexReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): ImbrexRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: imbrexSlice(row),
    };
  }).filter((row): row is ImbrexRow => Boolean(row));
  const present = presentImbrexLanes(rows);
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
    const next = readHiddenImbrex(readJson(IMB_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(IMB_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedImbrex(readJson(IMB_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(IMB_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleImbrexLanes(present, hidden, showHidden);
  const shown = visibleImbrex(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = imbrexLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = imbrexLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingImbrex(rows);
  const leadHue = leadingImbrexHue(rows);
  const whole = rows.filter((row) => imbrexLane(row.code)).length;
  const share = imbrexShare(laneImbrexCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("imbrex-surname-lanes.csv", imbrexLanesCsv(rows));
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
    writeJson(IMB_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(IMB_REVIEW_KEY, next);
  }

  return (
    <section className="c4-imbrex" aria-label={v4("imbTitle")} data-imbrex="1" data-role={role} data-surname="1">
      <header className="c4-imbrex-mast">
        <p className="c4-imbrex-seal" data-logo="mono">{v4("imbLogo")}</p>
        <div>
          <p className="c4-imbrex-kicker">{v4("imbSub")}</p>
          <h2 className="c4-title">{v4("imbTitle")}</h2>
        </div>
        <p className="c4-imbrex-count">{shown.length}</p>
      </header>
      <p className="c4-imbrex-links">
        <Link href={crmv4Href(base, "krp")}>{v4("krpTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("imbCustomer")}</Link>
      </p>
      <p className="c4-imbrex-hint">{v4("imbHint")}</p>
      {viewer && <p className="c4-imbrex-note">{v4("imbViewer")}</p>}
      {queue.loading && <p className="c4-imbrex-meta">{v4("imbLoading")}</p>}
      {queue.error && <p className="c4-imbrex-meta">{v4("imbFailed")}</p>}
      <p className="c4-imbrex-meta">{v4("imbLead")} {laneLabel(v4, lead)} · {v4("imbToneLead")} {hueLabel(v4, leadHue)} · {v4("imbShare")} {share}</p>
      <div className="c4-imbrex-chart" aria-label={v4("imbChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-imbrex-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ width: `${Math.max(18, Math.round((line.count / peak) * 100))}%` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-imbrex-tools">
        <input ref={searchRef} className="c4-field c4-imbrex-search" aria-label={v4("imbSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("imbSearch")} />
        <label className="c4-lab">{v4("imbChart")}<select className="c4-field" aria-label={v4("imbChart")} value={shape} onChange={(event) => setShape(event.target.value as ImbrexShape)}>{(Object.keys(SHAPE_KEY) as ImbrexShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("imbGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("imbPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("imbAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("imbFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("imbReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("imbShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleImbrex(hidden, lane))}>{v4("imbHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-imbrex-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkImbrexReview(reviewed, picked, true))}>{v4("imbBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkImbrexReview(reviewed, picked, false))}>{v4("imbBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("imbrex-surnames.csv", imbrexRowsCsv(shown, reviewed))}>{v4("imbRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("imbrex-surname-marks.csv", imbrexLanesCsv(rows))}>{v4("imbCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("imbEmpty")}</p>}
      <ul className="c4-imbrex-list">
        {shown.map((row) => {
          const tone = imbrexHue(row.code);
          const name = imbrexCopy(row.code);
          return (
            <li key={row.id} className="c4-imbrex-card" data-mail={imbrexLane(row.code) || "open"} data-hue={tone || "none"} data-lit={imbrexLit(row.code) ? "1" : "0"} data-figure={imbrexNear(row.code) ? "1" : "0"} data-short={imbrexFar(row.code) ? "1" : "0"} data-long={imbrexFade(row.code) ? "1" : "0"} data-dark={imbrexDark(row.code) ? "1" : "0"} data-dim={imbrexDim(row.code) ? "1" : "0"} data-blank={imbrexBlank(row.code) ? "1" : "0"} data-open={imbrexOpen(row.code) ? "1" : "0"} data-even={imbrexEven(row.code) ? "1" : "0"} data-digit={imbrexDigit(row.code) ? "1" : "0"} data-letter={imbrexLetter(row.code) ? "1" : "0"} data-upper={imbrexUpper(row.code) ? "1" : "0"}>
              <label className="c4-imbrex-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-imbrex-meta">{name || v4("imbOpen")} · {imbrexStamp(row.code) || "—"} · {imbrexLength(row.code) ?? "—"} · {laneLabel(v4, imbrexLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-imbrex-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleImbrexReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("imbReviewed") : v4("imbReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(imbrexCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("imbCopied") : v4("imbCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("imbCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
