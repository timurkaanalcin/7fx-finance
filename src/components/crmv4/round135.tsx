"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  HOST_KEY,
  HOST_VIEW_KEY,
  SERVER_KEY,
  activeHour,
  activeServer,
  activeWing,
  addHost,
  addView,
  bulkHostFolded,
  bulkHostPassed,
  dropView,
  editHost,
  hostCopy,
  hostCounts,
  hostHours,
  hostShare,
  hostText,
  hostTimeline,
  hostWings,
  hostsCsv,
  hourArg,
  leadingServer,
  namedServers,
  readHiddenServers,
  readHosts,
  readViews,
  resetHosts,
  serverLines,
  serverShare,
  serverText,
  serversCsv,
  setHostFolded,
  setHostPassed,
  setHostQuiet,
  stepHostRank,
  toggleServer,
  visibleHosts,
  visibleServerCustomers,
  visibleServers,
  wingArg,
  type HostCard,
  type HostTray,
  type HostView,
  type ServerRow,
} from "@/lib/crmv4/round135";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  tradingServer?: string | null;
};

type GlanceRow = ServerRow & { id: string };

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("hstAuditSave");
  if (audit === "edit") return v4("hstAuditEdit");
  if (audit === "raise") return v4("hstAuditRaise");
  if (audit === "lower") return v4("hstAuditLower");
  if (audit === "fold") return v4("hstAuditFold");
  if (audit === "unfold") return v4("hstAuditUnfold");
  if (audit === "pass") return v4("hstAuditPass");
  if (audit === "recall") return v4("hstAuditRecall");
  if (audit === "quiet") return v4("hstAuditQuiet");
  if (audit === "aloud") return v4("hstAuditAloud");
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

export function HostCards({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<HostCard[]>([]);
  const [views, setViews] = useState<HostView[]>([]);
  const [text, setText] = useState("");
  const [wing, setWing] = useState("");
  const [hour, setHour] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<HostTray>("open");
  const [wingFilter, setWingFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [firstOnly, setFirstOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const next = readHosts(readJson(HOST_KEY, []));
    const saved = readViews(readJson(HOST_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(HOST_KEY, next);
    writeJson(HOST_VIEW_KEY, saved);
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
  const wings = hostWings(cards);
  const hours = hostHours(cards);
  const wingOn = activeWing(wingFilter, wings);
  const hourOn = activeHour(hourFilter, hours);
  const shown = visibleHosts(cards, tray, query, wingArg(wingOn), hourArg(hourOn), firstOnly);
  const timeline = hostTimeline(cards, query);
  const counts = hostCounts(cards);
  const total = cards.length;

  function store(next: HostCard[]) {
    setCards(next);
    writeJson(HOST_KEY, next);
  }

  function storeViews(next: HostView[]) {
    setViews(next);
    writeJson(HOST_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setWing("");
    setHour("");
  }

  function copyCard(card: HostCard) {
    const body = hostCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: HostView) {
    setTray(view.tray);
    setQuery(view.query);
    setWingFilter(activeWing(view.wing, hostWings(cards)));
    setHourFilter(activeHour(view.hour, hostHours(cards)));
    setBoard("cards");
    setFirstOnly(false);
  }

  return (
    <section className="c4-host" aria-label={v4("hstTitle")} data-host="1" data-folio="1">
      <header className="c4-hst-head">
        <p className="c4-hst-plate" data-logo="mono">{v4("hstLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("hstSub")}</p>
          <h2 className="c4-title">{v4("hstTitle")}</h2>
        </div>
        <p className="c4-hst-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("hstHint")}</p>
      <p className="c4-meta">{v4("hstLocal")}</p>
      <p className="c4-meta">{v4("hstBlank")}</p>
      <p className="c4-meta">{v4("hstWingBlank")}</p>
      <p className="c4-meta">{v4("hstHourBlank")}</p>
      <p className="c4-meta">{v4("hstEscape")}</p>
      <p className="c4-meta">{v4("hstSlash")}</p>
      <p className="c4-hst-notice" role="status">
        <span>{v4("hstNotice")}</span>
        <span className="c4-hst-count">{counts.firstOpen}</span>
        <button type="button" className="c4-btn" aria-pressed={firstOnly} onClick={() => { setFirstOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {firstOnly ? v4("hstNoticeAll") : v4("hstNoticeOpen")}
        </button>
      </p>
      <section className="c4-hst-kpi" aria-label={v4("hstKpi")}>
        <p className="c4-pay-kicker">{v4("hstKpi")}</p>
        {(["open", "folded", "passed"] as const).map((key) => {
          const count = counts[key];
          const share = hostShare(count, total);
          const label = key === "open" ? v4("hstOpen") : key === "folded" ? v4("hstFolded") : v4("hstPassed");
          return (
            <p key={key} className="c4-hst-meter">
              <span>{label}</span>
              <span>{count}</span>
              <span>{v4("hstShare")} {share}%</span>
              <span className="c4-hst-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <form className="c4-hst-form" onSubmit={(event) => {
        event.preventDefault();
        const next = addHost(cards, { id: `hst-${Date.now().toString(36)}`, text, wing, hour });
        if (next.length === cards.length) return;
        store(next);
        clearDraft();
      }} onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("hstText")}</span>
          <input className="c4-field" aria-label={v4("hstText")} value={text} maxLength={96} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("hstWing")}</span>
          <input className="c4-field" aria-label={v4("hstWing")} value={wing} maxLength={14} onChange={(event) => setWing(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("hstHour")}</span>
          <input className="c4-field" aria-label={v4("hstHour")} value={hour} maxLength={5} onChange={(event) => setHour(event.target.value)} />
        </label>
        <div className="c4-row">
          <button type="submit" className="c4-btn">{v4("hstAdd")}</button>
          <button type="button" className="c4-btn" onClick={() => download("host-cards.csv", hostsCsv(cards))}>{v4("hstCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => store(bulkHostFolded(cards, shown.map((card) => card.id), true))}>{v4("hstBulkFold")}</button>
          <button type="button" className="c4-btn" onClick={() => store(bulkHostPassed(cards, shown.map((card) => card.id), true))}>{v4("hstBulkPass")}</button>
          <button type="button" className="c4-btn" onClick={() => store(resetHosts())}>{v4("hstReset")}</button>
        </div>
      </form>
      <form className="c4-hst-form" onSubmit={(event) => {
        event.preventDefault();
        const next = addView(views, { id: `hstv-${Date.now().toString(36)}`, name: viewName, tray, query, wing: wingOn, hour: hourOn });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("hstViewName")}</span>
          <input className="c4-field" aria-label={v4("hstViewName")} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("hstSaveView")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("hstViews")}>
        {!views.length && <p className="c4-meta">{v4("hstViewEmpty")}</p>}
        {views.map((view) => (
          <span key={view.id} className="c4-hst-view">
            <button type="button" className="c4-chip" onClick={() => applyView(view)}>{view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropView(views, view.id))}>{v4("hstDropView")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("hstSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("hstSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("hstTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => { setTray("open"); setBoard("cards"); }}>{v4("hstOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "folded" ? "1" : "0"} aria-pressed={tray === "folded"} onClick={() => { setTray("folded"); setBoard("cards"); }}>{v4("hstFolded")}</button>
        <button type="button" className="c4-chip" data-on={tray === "passed" ? "1" : "0"} aria-pressed={tray === "passed"} onClick={() => { setTray("passed"); setBoard("cards"); }}>{v4("hstPassed")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("hstTimeline")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("hstWings")}>
        <button type="button" className="c4-chip" data-on={wingOn === "all" ? "1" : "0"} aria-pressed={wingOn === "all"} onClick={() => setWingFilter("all")}>{v4("hstAllWings")}</button>
        <button type="button" className="c4-chip" data-on={wingOn === "blank" ? "1" : "0"} aria-pressed={wingOn === "blank"} onClick={() => setWingFilter("blank")}>{v4("hstBlankWing")}</button>
        {wings.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={wingOn === item ? "1" : "0"} aria-pressed={wingOn === item} onClick={() => setWingFilter(wingOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("hstHours")}>
        <button type="button" className="c4-chip" data-on={hourOn === "all" ? "1" : "0"} aria-pressed={hourOn === "all"} onClick={() => setHourFilter("all")}>{v4("hstAllHours")}</button>
        <button type="button" className="c4-chip" data-on={hourOn === "blank" ? "1" : "0"} aria-pressed={hourOn === "blank"} onClick={() => setHourFilter("blank")}>{v4("hstBlankHour")}</button>
        {hours.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hourOn === item ? "1" : "0"} aria-pressed={hourOn === item} onClick={() => setHourFilter(hourOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("hstEmpty")}</p>}
      {board === "timeline" && !timeline.length && <p className="c4-pay-empty">{v4("hstEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-hst-rows">
          {shown.map((card) => (
            <li key={card.id} data-rank={card.rank} data-folded={card.folded ? "1" : "0"} data-passed={card.passed ? "1" : "0"} data-quiet={card.quiet ? "1" : "0"}>
              <span className="c4-hst-pips" aria-label={`${v4("hstRank")} ${card.rank}`}>
                {[1, 2].map((pip) => <i key={pip} data-on={card.rank >= pip ? "1" : "0"} />)}
              </span>
              <div>
                {editing === card.id ? (
                  <form className="c4-hst-edit" onSubmit={(event) => {
                    event.preventDefault();
                    const next = editHost(cards, card.id, draft);
                    store(next);
                    if (next.find((item) => item.id === card.id)?.text === hostText(draft)) {
                      setEditing("");
                      setDraft("");
                    }
                  }}>
                    <label className="c4-lab">
                      <span>{v4("hstEdit")}</span>
                      <input className="c4-field" aria-label={v4("hstEdit")} value={draft} maxLength={96} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
                        if (event.key !== "Escape") return;
                        event.preventDefault();
                        setEditing("");
                        setDraft("");
                      }} />
                    </label>
                    <button type="submit" className="c4-btn">{v4("hstSaveEdit")}</button>
                  </form>
                ) : <p>{card.text}</p>}
                {card.wing ? <p className="c4-hst-wing">{card.wing}</p> : null}
                {card.hour ? <p className="c4-meta">{v4("hstHour")} {card.hour}</p> : null}
                {card.audit ? <p className="c4-meta">{v4("hstAudit")} {auditName(v4, card.audit)}</p> : null}
              </div>
              <div className="c4-row">
                <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("hstCopied") : v4("hstCopy")}</button>
                <button type="button" className="c4-btn" onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("hstEdit")}</button>
                <button type="button" className="c4-btn" onClick={() => store(stepHostRank(cards, card.id, 1))}>{v4("hstRaise")}</button>
                <button type="button" className="c4-btn" onClick={() => store(stepHostRank(cards, card.id, -1))}>{v4("hstLower")}</button>
                <button type="button" className="c4-btn" aria-pressed={card.folded} onClick={() => store(setHostFolded(cards, card.id, !card.folded))}>{card.folded ? v4("hstUnfold") : v4("hstFold")}</button>
                <button type="button" className="c4-btn" aria-pressed={card.passed} onClick={() => store(setHostPassed(cards, card.id, !card.passed))}>{card.passed ? v4("hstRecall") : v4("hstPass")}</button>
                <button type="button" className="c4-btn" aria-pressed={card.quiet} onClick={() => store(setHostQuiet(cards, card.id, !card.quiet))}>{card.quiet ? v4("hstAloud") : v4("hstQuiet")}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-hst-time">
          {timeline.map((card) => (
            <li key={card.id}>
              <span className="c4-hst-hour">{card.hour || "—"}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function TradingServers({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenServers, setHiddenServers] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || row.email || "").trim(),
      tradingServer: row.tradingServer,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = serverLines(rows);
  const present = namedServers(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.tradingServer)?.count || 0;
  const lead = leadingServer(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenServers(readJson(SERVER_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenServers(next);
    writeJson(SERVER_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleServers(present, hiddenServers, showHidden);
  const tradingServer = activeServer(selected, chips);
  const shown = visibleServerCustomers(rows, tradingServer, blank, query);

  function store(next: string[], clear: string) {
    setHiddenServers(next);
    writeJson(SERVER_KEY, next);
    if (clear && activeServer(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-server" aria-label={v4("tsvTitle")} data-server="1" data-folio="1">
      <header className="c4-tsv-head">
        <div>
          <p className="c4-pay-kicker">{v4("tsvSub")}</p>
          <h2 className="c4-title">{v4("tsvTitle")}</h2>
        </div>
        <p className="c4-hst-count">{v4("tsvRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("tsvHint")}</p>
      <p className="c4-meta">{v4("tsvLocal")}</p>
      <p className="c4-meta">{v4("tsvEscape")}</p>
      {lead ? <p className="c4-tsv-lead"><span>{v4("tsvLead")}</span> {lead}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("tsvBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("trading-servers.csv", serversCsv(rows))}>{v4("tsvCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("tsvLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("tsvFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("tsvNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-tsv-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("tsvBlank")}</span>
          <span className="c4-hst-count">{blankCount}</span>
          <span className="c4-tsv-track" aria-hidden="true"><i style={{ width: `${serverShare(blankCount, rows.length)}%` }} /></span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("tsvShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("tsvShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("tsvHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("tsvTitle")}>
        <button type="button" className="c4-chip" data-on={!tradingServer && !blank ? "1" : "0"} aria-pressed={!tradingServer && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("tsvAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.tradingServer === item)?.count || 0;
          const share = serverShare(count, rows.length);
          return (
            <span key={item} className="c4-tsv-pair" data-server={item}>
              <button type="button" className="c4-chip" data-on={tradingServer === item ? "1" : "0"} aria-pressed={tradingServer === item} onClick={() => { setBlank(false); setSelected(tradingServer === item ? "" : item); }}>{item}</button>
              <span className="c4-hst-count">{count}</span>
              <span className="c4-tsv-share">{v4("tsvShare")} {share}%</span>
              <span className="c4-tsv-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleServer(hiddenServers, item, present), showHidden ? "" : item)}>{showHidden ? v4("tsvShow") : v4("tsvHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("tsvSearch")}</span>
        <input className="c4-field" aria-label={v4("tsvSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("tsvEmpty")}</p>}
      <ul className="c4-tsv-rows">
        {shown.map((row) => {
          const name = serverText(row.tradingServer);
          return (
            <li key={row.id} data-server={name || "blank"}>
              <span className="c4-tsv-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("tsvBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
