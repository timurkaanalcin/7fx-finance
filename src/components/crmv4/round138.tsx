"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  BROWSER_KEY,
  PLACE_KEY,
  PLACE_VIEW_KEY,
  activeBrowser,
  activeCourse,
  activeFamily,
  activeInitial,
  activeSeat,
  activeTable,
  activeTag,
  addPlace,
  addPlaceView,
  browserLines,
  browserShare,
  browserText,
  browsersCsv,
  bulkPlaceCleared,
  bulkPlaceSeated,
  courseArg,
  courseOf,
  dropPlaceView,
  editPlace,
  familyArg,
  familyLines,
  familyOf,
  initialArg,
  initialLines,
  initialOf,
  leadingBrowser,
  leadingFamily,
  leadingInitial,
  namedBrowsers,
  namedFamilies,
  namedInitials,
  nextPlace,
  placeClashIds,
  placeCopy,
  placeCounts,
  placeCourses,
  placeShare,
  placeTables,
  placeTags,
  placeTimeline,
  placesCsv,
  readHiddenBrowsers,
  readPlaceViews,
  readPlaces,
  resetPlaces,
  seatArg,
  seatBand,
  seatCounts,
  seatGap,
  setPlaceCleared,
  setPlaceHush,
  setPlaceSeated,
  stepPlaceRank,
  tableArg,
  tagArg,
  toggleBrowser,
  visibleBrowserCustomers,
  visibleBrowsers,
  visiblePlaces,
  type BrowserRow,
  type Course,
  type PlaceCard,
  type PlaceTray,
  type PlaceView,
} from "@/lib/crmv4/round138";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  lastBrowser?: string | null;
};

type GlanceRow = BrowserRow & { id: string };

function courseName(v4: V4, course: Course): string {
  if (course === "first") return v4("plcCourseFirst");
  if (course === "main") return v4("plcCourseMain");
  if (course === "last") return v4("plcCourseLast");
  return v4("plcBlankCourse");
}

function familyName(v4: V4, family: string): string {
  if (family === "chrome") return v4("brwChrome");
  if (family === "safari") return v4("brwSafari");
  if (family === "firefox") return v4("brwFirefox");
  if (family === "edge") return v4("brwEdge");
  if (family === "other") return v4("brwFamilyOther");
  return v4("brwBlankFamily");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("plcAuditSave");
  if (audit === "edit") return v4("plcAuditEdit");
  if (audit === "raise") return v4("plcAuditRaise");
  if (audit === "lower") return v4("plcAuditLower");
  if (audit === "seat") return v4("plcAuditSeat");
  if (audit === "unseat") return v4("plcAuditUnseat");
  if (audit === "clear") return v4("plcAuditClear");
  if (audit === "reopen") return v4("plcAuditReopen");
  if (audit === "hush") return v4("plcAuditHush");
  if (audit === "speak") return v4("plcAuditSpeak");
  return "";
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

export function PlaceCards({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<PlaceCard[]>([]);
  const [views, setViews] = useState<PlaceView[]>([]);
  const [text, setText] = useState("");
  const [table, setTable] = useState("");
  const [seat, setSeat] = useState("");
  const [course, setCourse] = useState("");
  const [tag, setTag] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<PlaceTray>("waiting");
  const [tableFilter, setTableFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [seatFilter, setSeatFilter] = useState("all");
  const [topOnly, setTopOnly] = useState(false);
  const [passedOnly, setPassedOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [desk, setDesk] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const next = readPlaces(readJson(PLACE_KEY, []));
    const saved = readPlaceViews(readJson(PLACE_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(PLACE_KEY, next);
    writeJson(PLACE_VIEW_KEY, saved);
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const tagName = (event.target as HTMLElement | null)?.tagName;
      if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const tables = placeTables(cards);
  const courses = placeCourses(cards);
  const tags = placeTags(cards);
  const chairs = seatCounts(cards);
  const tableOn = activeTable(tableFilter, tables);
  const courseOn = activeCourse(courseFilter, courses);
  const tagOn = activeTag(tagFilter, tags);
  const seatOn = activeSeat(seatFilter);
  const picked = seatArg(seatOn);
  const shown = visiblePlaces(
    cards,
    tray,
    query,
    tableArg(tableOn),
    courseArg(courseOn),
    tagArg(tagOn),
    picked.exact,
    picked.band,
    topOnly,
    passedOnly,
    desk,
  );
  const timeline = placeTimeline(cards, query);
  const counts = placeCounts(cards, desk);
  const total = cards.length;
  const nextId = nextPlace(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);

  function store(next: PlaceCard[]) {
    setCards(next);
    writeJson(PLACE_KEY, next);
  }

  function storeViews(next: PlaceView[]) {
    setViews(next);
    writeJson(PLACE_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setTable("");
    setSeat("");
    setCourse("");
    setTag("");
  }

  function copyCard(card: PlaceCard) {
    const body = placeCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: PlaceView) {
    setTray(view.tray);
    setQuery(view.query);
    setTableFilter(activeTable(view.table, placeTables(cards)));
    setCourseFilter(activeCourse(view.course, placeCourses(cards)));
    setTagFilter(activeTag(view.tag, placeTags(cards)));
    setSeatFilter(activeSeat(view.seat));
    setBoard("cards");
    setTopOnly(false);
    setPassedOnly(false);
  }

  return (
    <section className="c4-place" aria-label={v4("plcTitle")} data-place="1" data-folio="1">
      <header className="c4-plc-head">
        <p className="c4-plc-plate" data-logo="mono">{v4("plcLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("plcSub")}</p>
          <h2 className="c4-title">{v4("plcTitle")}</h2>
        </div>
        <p className="c4-plc-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("plcHint")}</p>
      <p className="c4-meta">{v4("plcLocal")}</p>
      <p className="c4-meta">{v4("plcBlank")}</p>
      <p className="c4-meta">{v4("plcTableBlank")}</p>
      <p className="c4-meta">{v4("plcSeatBlank")}</p>
      <p className="c4-meta">{v4("plcCourseBlank")}</p>
      <p className="c4-meta">{v4("plcTagBlank")}</p>
      <p className="c4-meta">{v4("plcEscape")}</p>
      <p className="c4-meta">{v4("plcSlash")}</p>
      <p className="c4-plc-notice" role="status">
        <span>{v4("plcNotice")}</span>
        <span className="c4-plc-count">{counts.passed}</span>
        <button type="button" className="c4-btn" aria-pressed={passedOnly} onClick={() => { setPassedOnly((value) => !value); setTray("waiting"); setBoard("cards"); }}>
          {passedOnly ? v4("plcNoticeAll") : v4("plcNoticeOpen")}
        </button>
      </p>
      <section className="c4-plc-kpi" aria-label={v4("plcKpi")}>
        <p className="c4-pay-kicker">{v4("plcKpi")}</p>
        {(["waiting", "seated", "cleared"] as const).map((key) => {
          const count = counts[key];
          const share = placeShare(count, total);
          const label = key === "waiting" ? v4("plcWaiting") : key === "seated" ? v4("plcSeated") : v4("plcCleared");
          return (
            <p key={key} className="c4-plc-meter" data-tray={key}>
              <span>{label}</span>
              <span>{count}</span>
              <span>{v4("plcShare")} {share}%</span>
              <span className="c4-plc-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-plc-chart" aria-label={v4("plcChart")}>
        {chairs.map((count, index) => {
          const number = String(index + 1);
          const on = seatOn === number;
          return (
            <button
              key={number}
              type="button"
              className="c4-plc-chair"
              data-on={on ? "1" : "0"}
              data-filled={count ? "1" : "0"}
              aria-pressed={on}
              onClick={() => setSeatFilter(on ? "all" : number)}
            >
              <span className="c4-plc-back" aria-hidden="true" />
              <span>{number}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-plc-next" onSubmit={(event) => event.preventDefault()}>
        <label className="c4-lab">
          <span>{v4("plcDeskSeat")}</span>
          <input className="c4-field" aria-label={v4("plcDeskSeat")} value={desk} maxLength={2} onChange={(event) => setDesk(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setDesk("");
          }} />
        </label>
        <p className="c4-plc-next-line">
          <span>{v4("plcNext")}</span>
          {nextCard ? <strong>{nextCard.seat} {nextCard.text}</strong> : <span>{seatArg(desk).exact ? v4("plcNextEmpty") : "—"}</span>}
        </p>
      </form>
      <form className="c4-plc-form" onSubmit={(event) => {
        event.preventDefault();
        const next = addPlace(cards, { id: `plc-${Date.now().toString(36)}`, text, table, seat, course, tag });
        if (next.length === cards.length) return;
        store(next);
        clearDraft();
      }} onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("plcText")}</span>
          <input className="c4-field" aria-label={v4("plcText")} value={text} maxLength={96} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("plcTable")}</span>
          <input className="c4-field" aria-label={v4("plcTable")} value={table} maxLength={16} onChange={(event) => setTable(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("plcSeat")}</span>
          <input className="c4-field" aria-label={v4("plcSeat")} value={seat} maxLength={2} onChange={(event) => setSeat(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("plcCourse")}</span>
          <input className="c4-field" aria-label={v4("plcCourse")} value={course} maxLength={8} onChange={(event) => setCourse(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("plcTag")}</span>
          <input className="c4-field" aria-label={v4("plcTag")} value={tag} maxLength={12} onChange={(event) => setTag(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("plcAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("plcTitle")}>
        {(["waiting", "seated", "cleared"] as const).map((key) => (
          <button key={key} type="button" className="c4-chip" data-on={tray === key ? "1" : "0"} aria-pressed={tray === key} onClick={() => { setTray(key); setBoard("cards"); if (key !== "waiting") setPassedOnly(false); }}>
            {key === "waiting" ? v4("plcWaiting") : key === "seated" ? v4("plcSeated") : v4("plcCleared")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard((value) => value === "timeline" ? "cards" : "timeline")}>{v4("plcTimeline")}</button>
        <button type="button" className="c4-chip" data-on={topOnly ? "1" : "0"} aria-pressed={topOnly} onClick={() => setTopOnly((value) => !value)}>{v4("plcTop")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("plcTables")}>
        <button type="button" className="c4-chip" data-on={tableOn === "all" ? "1" : "0"} aria-pressed={tableOn === "all"} onClick={() => setTableFilter("all")}>{v4("plcAllTables")}</button>
        <button type="button" className="c4-chip" data-on={tableOn === "blank" ? "1" : "0"} aria-pressed={tableOn === "blank"} onClick={() => setTableFilter(tableOn === "blank" ? "all" : "blank")}>{v4("plcBlankTable")}</button>
        {tables.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tableOn === item ? "1" : "0"} aria-pressed={tableOn === item} onClick={() => setTableFilter(tableOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("plcCourses")}>
        <button type="button" className="c4-chip" data-on={courseOn === "all" ? "1" : "0"} aria-pressed={courseOn === "all"} onClick={() => setCourseFilter("all")}>{v4("plcAllCourses")}</button>
        <button type="button" className="c4-chip" data-on={courseOn === "blank" ? "1" : "0"} aria-pressed={courseOn === "blank"} onClick={() => setCourseFilter(courseOn === "blank" ? "all" : "blank")}>{v4("plcBlankCourse")}</button>
        {courses.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={courseOn === item ? "1" : "0"} aria-pressed={courseOn === item} onClick={() => setCourseFilter(courseOn === item ? "all" : item)}>{courseName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("plcTags")}>
        <button type="button" className="c4-chip" data-on={tagOn === "all" ? "1" : "0"} aria-pressed={tagOn === "all"} onClick={() => setTagFilter("all")}>{v4("plcAllTags")}</button>
        <button type="button" className="c4-chip" data-on={tagOn === "blank" ? "1" : "0"} aria-pressed={tagOn === "blank"} onClick={() => setTagFilter(tagOn === "blank" ? "all" : "blank")}>{v4("plcBlankTag")}</button>
        {tags.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tagOn === item ? "1" : "0"} aria-pressed={tagOn === item} onClick={() => setTagFilter(tagOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("plcSeats")}>
        {(["all", "blank", "near", "far"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={seatOn === item ? "1" : "0"} aria-pressed={seatOn === item} onClick={() => setSeatFilter(item)}>
            {item === "all" ? v4("plcAllSeats") : item === "blank" ? v4("plcBlankSeat") : item === "near" ? v4("plcNear") : v4("plcFar")}
          </button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("plcSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("plcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <form className="c4-plc-view" onSubmit={(event) => {
        event.preventDefault();
        const next = addPlaceView(views, { id: `plv-${Date.now().toString(36)}`, name: viewName, tray, query, table: tableOn, course: courseOn, tag: tagOn, seat: seatOn });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("plcViewName")}</span>
          <input className="c4-field" aria-label={v4("plcViewName")} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("plcSaveView")}</button>
      </form>
      <section aria-label={v4("plcViews")}>
        <p className="c4-pay-kicker">{v4("plcViews")}</p>
        {!views.length && <p className="c4-meta">{v4("plcViewEmpty")}</p>}
        <ul className="c4-plc-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" onClick={() => storeViews(dropPlaceView(views, view.id))}>{v4("plcDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      <p className="c4-row">
        <button type="button" className="c4-btn" onClick={() => store(bulkPlaceSeated(cards, shown.map((card) => card.id), true))}>{v4("plcBulkSeat")}</button>
        <button type="button" className="c4-btn" onClick={() => store(bulkPlaceCleared(cards, shown.map((card) => card.id), true))}>{v4("plcBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("place-cards.csv", placesCsv(cards, desk))}>{v4("plcCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetPlaces())}>{v4("plcReset")}</button>
      </p>
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("plcEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-plc-rows">
          {shown.map((card) => {
            const band = seatBand(card.seat);
            const clashes = placeClashIds(cards, card.id);
            const gap = seatGap(card.seat, desk);
            const courseLabel = courseOf(card.course);
            return (
              <li key={card.id} data-band={band} data-passed={gap !== null && gap > 0 && !card.seated && !card.cleared ? "1" : "0"}>
                <span className="c4-plc-spine" aria-hidden="true" />
                <div>
                  <p className="c4-plc-pips" aria-label={v4("plcRank")}>
                    {[0, 1, 2].map((pip) => <i key={pip} data-on={card.rank > pip ? "1" : "0"} />)}
                  </p>
                  {editing === card.id ? (
                    <form onSubmit={(event) => {
                      event.preventDefault();
                      store(editPlace(cards, card.id, draft));
                      setEditing("");
                      setDraft("");
                    }}>
                      <label className="c4-lab">
                        <span>{v4("plcEdit")}</span>
                        <input className="c4-field" aria-label={v4("plcEdit")} value={draft} maxLength={96} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
                          if (event.key !== "Escape") return;
                          event.preventDefault();
                          setEditing("");
                          setDraft("");
                        }} />
                      </label>
                      <button type="submit" className="c4-btn">{v4("plcSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-plc-band">{courseName(v4, courseLabel)}</p>
                  {card.table ? <p className="c4-plc-table">{card.table}</p> : null}
                  {card.tag ? <p className="c4-plc-tag">{card.tag}</p> : null}
                  {card.seat ? <p className="c4-meta">{v4("plcSeat")} {card.seat}</p> : null}
                  {gap !== null ? <p className="c4-meta">{gap < 0 ? v4("plcAhead") : v4("plcPassed")} {Math.abs(gap)}</p> : null}
                  <p className="c4-meta">{clashes.length ? `${v4("plcClash")} ${clashes.length}` : v4("plcClashNone")}</p>
                  {card.audit ? <p className="c4-meta">{v4("plcAudit")} {auditName(v4, card.audit)}</p> : null}
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("plcCopied") : v4("plcCopy")}</button>
                  <button type="button" className="c4-btn" onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("plcEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => store(stepPlaceRank(cards, card.id, 1))}>{v4("plcRaise")}</button>
                  <button type="button" className="c4-btn" onClick={() => store(stepPlaceRank(cards, card.id, -1))}>{v4("plcLower")}</button>
                  <button type="button" className="c4-btn" aria-pressed={card.seated} onClick={() => store(setPlaceSeated(cards, card.id, !card.seated))}>{card.seated ? v4("plcUnseat") : v4("plcSeatOn")}</button>
                  <button type="button" className="c4-btn" aria-pressed={card.cleared} onClick={() => store(setPlaceCleared(cards, card.id, !card.cleared))}>{card.cleared ? v4("plcReopen") : v4("plcClear")}</button>
                  <button type="button" className="c4-btn" aria-pressed={card.hush} onClick={() => store(setPlaceHush(cards, card.id, !card.hush))}>{card.hush ? v4("plcSpeak") : v4("plcHush")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-plc-time">
          {timeline.map((card) => (
            <li key={card.id} data-band={seatBand(card.seat)}>
              <span className="c4-plc-hour">{card.seat || "—"}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function CustomerBrowsers({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenBrowsers, setHiddenBrowsers] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [family, setFamily] = useState("all");
  const [initial, setInitial] = useState("all");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || row.email || "").trim(),
      lastBrowser: row.lastBrowser,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = browserLines(rows);
  const families = familyLines(rows);
  const initials = initialLines(rows);
  const present = namedBrowsers(rows);
  const presentKey = present.join("\n");
  const familyNames = namedFamilies(rows);
  const initialNames = namedInitials(rows);
  const blankCount = lines.find((line) => !line.browser)?.count || 0;
  const blankInitial = initials.find((line) => !line.initial)?.count || 0;
  const lead = leadingBrowser(rows);
  const leadFamily = leadingFamily(rows);
  const leadInitial = leadingInitial(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenBrowsers(readJson(BROWSER_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenBrowsers(next);
    writeJson(BROWSER_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleBrowsers(present, hiddenBrowsers, showHidden);
  const browser = activeBrowser(selected, chips);
  const familyOn = activeFamily(family, familyNames);
  const initialOn = activeInitial(initial, initialNames);
  const shown = visibleBrowserCustomers(rows, browser, blank, familyArg(familyOn), initialArg(initialOn), query);
  const widest = Math.max(1, ...families.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenBrowsers(next);
    writeJson(BROWSER_KEY, next);
    if (clear && activeBrowser(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-browser" aria-label={v4("brwTitle")} data-browser="1" data-folio="1">
      <header className="c4-brw-head">
        <div>
          <p className="c4-pay-kicker">{v4("brwSub")}</p>
          <h2 className="c4-title">{v4("brwTitle")}</h2>
        </div>
        <p className="c4-plc-count">{v4("brwRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("brwHint")}</p>
      <p className="c4-meta">{v4("brwLocal")}</p>
      <p className="c4-meta">{v4("brwEscape")}</p>
      {lead ? <p className="c4-brw-lead"><span>{v4("brwLead")}</span> {lead}</p> : null}
      {leadFamily ? <p className="c4-brw-lead"><span>{v4("brwLeadFamily")}</span> {familyName(v4, leadFamily)}</p> : null}
      {leadInitial ? <p className="c4-brw-lead"><span>{v4("brwLeadInitial")}</span> {leadInitial}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("brwBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("customer-browsers.csv", browsersCsv(rows))}>{v4("brwCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("brwLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("brwFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("brwNone")}</p>}
      {families.length > 0 && (
        <section className="c4-brw-chart" aria-label={v4("brwFamilies")}>
          {families.map((line) => {
            const share = browserShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.family || "blank";
            return (
              <p key={name} className="c4-brw-col" data-family={name}>
                <span>{familyName(v4, line.family)}</span>
                <span className="c4-brw-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("brwShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      {blankCount > 0 && (
        <button type="button" className="c4-brw-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); setFamily("all"); setInitial("all"); }}>
          <span>{v4("brwBlank")}</span>
          <span className="c4-plc-count">{blankCount}</span>
          <span className="c4-brw-track" aria-hidden="true"><i style={{ width: `${browserShare(blankCount, rows.length)}%` }} /></span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("brwFamilies")}>
        <button type="button" className="c4-chip" data-on={familyOn === "all" && !blank ? "1" : "0"} aria-pressed={familyOn === "all"} onClick={() => { setFamily("all"); setBlank(false); }}>{v4("brwAllFamilies")}</button>
        {families.some((line) => !line.family) && (
          <button type="button" className="c4-chip" data-on={familyOn === "blank" ? "1" : "0"} aria-pressed={familyOn === "blank"} onClick={() => { setFamily(familyOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("brwBlankFamily")}</button>
        )}
        {familyNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={familyOn === item ? "1" : "0"} aria-pressed={familyOn === item} onClick={() => { setBlank(false); setSelected(""); setFamily(familyOn === item ? "all" : item); }}>{familyName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("brwInitials")}>
        <button type="button" className="c4-chip" data-on={initialOn === "all" && !blank ? "1" : "0"} aria-pressed={initialOn === "all"} onClick={() => { setInitial("all"); setBlank(false); }}>{v4("brwAllInitials")}</button>
        {blankInitial > 0 && (
          <button type="button" className="c4-chip" data-on={initialOn === "blank" ? "1" : "0"} aria-pressed={initialOn === "blank"} onClick={() => { setInitial(initialOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("brwBlankInitial")}</button>
        )}
        {initialNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={initialOn === item ? "1" : "0"} aria-pressed={initialOn === item} onClick={() => { setBlank(false); setSelected(""); setInitial(initialOn === item ? "all" : item); }}>{item === "#" ? v4("brwOther") : item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("brwShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("brwShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("brwHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("brwTitle")}>
        <button type="button" className="c4-chip" data-on={!browser && !blank && familyOn === "all" && initialOn === "all" ? "1" : "0"} aria-pressed={!browser && !blank} onClick={() => { setSelected(""); setBlank(false); setFamily("all"); setInitial("all"); }}>{v4("brwAll")}</button>
        {chips.map((item) => {
          const line = lines.find((row) => row.browser === item);
          const count = line?.count || 0;
          const share = browserShare(count, rows.length);
          const mark = initialOf(item);
          const familyMark = familyOf(item);
          return (
            <span key={item} className="c4-brw-pair" data-browser={item}>
              <button type="button" className="c4-chip" data-on={browser === item ? "1" : "0"} aria-pressed={browser === item} onClick={() => { setBlank(false); setFamily("all"); setInitial("all"); setSelected(browser === item ? "" : item); }}>{item}</button>
              {familyMark ? <span className="c4-brw-family">{familyName(v4, familyMark)}</span> : null}
              {mark ? <span className="c4-brw-initial">{v4("brwInitial")} {mark === "#" ? v4("brwOther") : mark}</span> : null}
              <span className="c4-plc-count">{count}</span>
              <span className="c4-brw-share">{v4("brwShare")} {share}%</span>
              <span className="c4-brw-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleBrowser(hiddenBrowsers, item, present), showHidden ? "" : item)}>{showHidden ? v4("brwShow") : v4("brwHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("brwSearch")}</span>
        <input className="c4-field" aria-label={v4("brwSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("brwEmpty")}</p>}
      <ul className="c4-brw-rows">
        {shown.map((row) => {
          const name = browserText(row.lastBrowser);
          const mark = initialOf(name);
          const familyMark = familyOf(name);
          return (
            <li key={row.id} data-browser={name || "blank"}>
              <span className="c4-brw-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("brwBlank")}</p>
              {familyMark ? <p className="c4-brw-family">{familyName(v4, familyMark)}</p> : null}
              {mark ? <p className="c4-brw-initial">{mark === "#" ? v4("brwOther") : mark}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
