"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ACCOUNT_TYPES, POTENTIAL_STATUSES, RETENTION_STATUSES, SALE_STATUSES, VALIDATION_STATUSES } from "@/lib/membership";
import { crmv4Text, type CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { moveItem, type FilterRule } from "@/lib/crmv4/round1";
import { crmv4Href } from "@/lib/crmv4/sections";
import { FilterBuilder, ReviewDialog, rememberCustomer, useDeskMemory, visibleCustomers, type Col as DeskCol } from "../round1";
import { Customer360, DuplicateScreen, RetentionForm, RoundRobinPreview, StatementView } from "../round2";
import { ContactLine, DocumentsCenter, LocalTime, NoteTemplates, PresenceBadge, TradingOverview, columnPreset, parseOperators } from "../round3";
import { PipelineDesk } from "../round41";
import { QuickChips, ValueSpark, WorkspaceTabs, pushWorkspace } from "../round4";
import { CompareDesk } from "../round23";
import { BirthdayList, BulkNote, CallbackButton, DeskSwitch, JourneyMap, SearchHistory, WinLossCard, customerSegment, notePinned, rememberSearch, toggleNotePin } from "../round5";
import { AgingBoard, ConversionStat, DepositorBoard, DocGallery, DomainBoard, EquityCurve, ExpiryNote, StreakBoard, TeamThread, WeeklyDigest, copyFilterLink } from "../round6";
import { CompletenessMeter, ImportPreview, InlineProfile, LangBadge, SourceBoard, StaleList, StatusWatch, TagCloud } from "../round7";
import { fuzzyHit } from "@/lib/crmv4/round8";
import { RatioCard, toggleWatch, watchIds } from "../round8";
import { DocStage, FREEZE_PRESETS, OnboardTrack, RichNote, WelcomeList } from "../round9";
import { CallWindow, CustomerQr, ExportColumns, PresenceFacts, nextCallId, scoreOf } from "../round10";
import { BulkRemind, EditLog, EmailHintLine, HandoffNote, NoteCloud, SimilarList } from "../round11";
import { BulkUntag, ContactSummary, DncFlag, DocAsk, Fold, KeyFacts, LiveBook, MarginGauge, MiniNav, MonthStatement, PreferTime, ProfileList, QuickSwitch, ShareViewButton, TagManager, TxMini, isDnc } from "../round12";
import { DocDesk } from "../round15";
import { LeadDesk } from "../round16";
import { ContactFeed, EntryQuality, applySplit, emailOk } from "../round17";
import { StatementSheet } from "../round21";
import { CohortBoard, OnboardCard } from "../round24";
import { ListDesk, RecordHead, applyList, useLists } from "../round31";
import { TradeBook } from "../round33";
import { LuxList, NoteStudio } from "../round34";
import { FinanceBook } from "../round36";
import { KycStudio } from "../round37";
import { Dossier, useEscape } from "../round40";
import { toggleOne, togglePage } from "@/lib/crmv4/round42";
import { BulkDock, RecordThread } from "../round42";
import { rememberView } from "../round25";
import { LifeLine } from "../round26";
import { sameEntry } from "@/lib/crmv4/round17";
import { countActive, decodeView, headerHit, inDateRange, inNumberRange, multiSort } from "@/lib/crmv4/round12";
import { Card, Chip, Field, Lab, Msg, Pager, State, SwipeRow, TAKE, auditExport, downloadCsv, money, plClass, sendJson, useJson, when, type Tx, type UserRow } from "../kit";

const COLUMNS = ["customer", "country", "desk", "sale", "retention", "balance", "status"] as const;
type Col = DeskCol;
type Preset = { id: string; name: string; values: Record<string, string> };
const PRESET_KEY = "crmv4-customer-presets";
const COLUMN_KEY = "crmv4-customer-columns";
const DENSE_KEY = "crmv4-dense-rows";
const IDS_KEY = "crmv4-customer-ids";

export function Customers({ base, tx, locale, q }: { base: string; tx: Tx; locale: string; q: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const status = params.get("status") || "";
  const saleStatus = params.get("saleStatus") || "";
  const retentionStatus = params.get("retentionStatus") || "";
  const country = params.get("country") || "";
  const presence = params.get("presence") || "";
  const ftd = params.get("ftd") || "";
  const followUp = params.get("followUp") || "";
  const skip = Number(params.get("skip") || 0) || 0;
  const sort = params.get("sort") || "";
  const sort2 = params.get("sort2") || "";
  const minBal = params.get("minBal") || "";
  const maxBal = params.get("maxBal") || "";
  const minEq = params.get("minEq") || "";
  const maxEq = params.get("maxEq") || "";
  const fromReg = params.get("fromReg") || "";
  const toReg = params.get("toReg") || "";
  const takeRaw = Number(params.get("take") || TAKE);
  const take = takeRaw === 20 || takeRaw === 80 ? takeRaw : TAKE;
  const query = new URLSearchParams({ view: "table", take: String(take), skip: String(skip), meta: "0", role: "TRADER", q });
  if (status) query.set("status", status);
  if (saleStatus) query.set("saleStatus", saleStatus);
  if (retentionStatus) query.set("retentionStatus", retentionStatus);
  if (country) query.set("country", country);
  if (presence) query.set("presence", presence);
  if (ftd) query.set("ftd", ftd);
  if (followUp) query.set("followUp", followUp);
  const data = useJson<{ users?: UserRow[]; hasMore?: boolean; total?: number }>(`/api/admin/users?${query.toString()}`);
  const rows = data.data?.users || [];
  const sorted = multiSort(rows, [sort, sort2], (row, key) => {
    if (key === "name") return String(row.name || "");
    if (key === "balance") return Number(row.balance ?? row.account?.balance ?? 0);
    if (key === "equity") return Number((row as UserRow & { equity?: number }).equity ?? row.account?.equity ?? 0);
    if (key === "score") return scoreOf(row);
    if (key === "created") return String(row.createdAt || "");
    return "";
  });
  const [filtersOpen, setFiltersOpen] = useState(true);
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setFiltersOpen(false);
  }, []);
  useEscape(filtersOpen, () => setFiltersOpen(false));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [columns, setColumns] = useState<Col[]>([...COLUMNS]);
  const [dense, setDense] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [renameId, setRenameId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [relative, setRelative] = useState(false);
  const [viewName, setViewName] = useState("");
  const [inspectId, setInspectId] = useState("");
  const [pipelineOn, setPipelineOn] = useState(false);
  const [ops, setOps] = useState("");
  const [deskPick, setDeskPick] = useState("");
  const [vipOnly, setVipOnly] = useState(false);
  const [tagPick, setTagPick] = useState("");
  const [fuzzy, setFuzzy] = useState("");
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [tagManagerOn, setTagManagerOn] = useState(false);
  const shared = useRef(false);
  const memory = useDeskMemory();
  const [smartLists] = useLists();
  const v4 = (key: CrmV4CopyKey) => crmv4Text(locale, key);
  const parsed = parseOperators(ops);
  const operated = sorted.filter((row) => {
    const bag = row as unknown as Record<string, unknown>;
    const aliases: Record<string, string> = { sale: "saleStatus", retention: "retentionStatus" };
    const opsOk = Object.entries(parsed.ops).every(([key, value]) => String(bag[aliases[key] || key] ?? "").toLowerCase().includes(value.toLowerCase()));
    if (!opsOk) return false;
    if (!parsed.text) return true;
    return `${row.name || ""} ${row.email || ""}`.toLowerCase().includes(parsed.text.toLowerCase());
  });
  const listed = visibleCustomers(operated, rules, memory.tags, memory.pins, pinnedOnly);
  const shown = listed.filter((row) => {
    if (deskPick && (row.desk || "—") !== deskPick) return false;
    if (vipOnly && customerSegment(row) !== "vip") return false;
    if (tagPick && !(memory.tags[row.id] || []).includes(tagPick)) return false;
    if (fuzzy && !fuzzyHit(fuzzy, `${row.name || ""} ${row.email || ""}`)) return false;
    if (!headerHit(row, headers)) return false;
    const balance = Number(row.balance ?? row.account?.balance ?? 0);
    const equity = Number((row as UserRow & { equity?: number }).equity ?? row.account?.equity ?? balance);
    if (!inNumberRange(balance, minBal, maxBal)) return false;
    if (!inNumberRange(equity, minEq, maxEq)) return false;
    if (!inDateRange(row.createdAt, fromReg, toReg)) return false;
    return true;
  });
  const listId = params.get("list") || "";
  const tableRows = listId ? applyList(shown, smartLists, listId) : shown;
  const deskNames: string[] = [];
  for (const row of listed) {
    const name = row.desk || "";
    if (name && !deskNames.includes(name)) deskNames.push(name);
  }

  useEffect(() => {
    const stored = readJson<Col[]>(COLUMN_KEY, [...COLUMNS]).filter((item) => (COLUMNS as readonly string[]).includes(item));
    setColumns(stored.length ? stored : [...COLUMNS]);
    setDense(window.localStorage.getItem(DENSE_KEY) === "1");
    setPresets(readJson<Preset[]>(PRESET_KEY, []));
  }, []);

  useEffect(() => { if (q) rememberSearch(q); }, [q]);

  const idKey = shown.map((row) => row.id).join(",");
  useEffect(() => {
    window.sessionStorage.setItem(IDS_KEY, JSON.stringify(idKey ? idKey.split(",") : []));
  }, [idKey]);

  useEffect(() => {
    if (shared.current) return;
    const raw = params.get("sv");
    if (!raw) return;
    shared.current = true;
    const decoded = decodeView(raw);
    if (!decoded) return;
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(decoded)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("sv");
    next.delete("skip");
    router.replace(`?${next.toString()}`);
  }, [params, router]);

  function setQuery(next: Record<string, string>) {
    const p = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) p.set(key, value);
      else p.delete(key);
    }
    if (!("skip" in next)) p.delete("skip");
    router.replace(`?${p.toString()}`);
  }

  function savePresets(next: Preset[]) {
    setPresets(next);
    writeJson(PRESET_KEY, next);
  }

  function currentFilters(): Record<string, string> {
    return { status, saleStatus, retentionStatus, country, presence, ftd, sort };
  }

  return (
    <div className="c4-stack c4-cust-cloak c4-cust-nook">
      <p className="c4-muted">{tx("customersLead")}</p>
      <Card title={tx("customers")} extra={<span className="c4-muted">{typeof data.data?.total === "number" ? `${tx("totalRows")} ${data.data.total}` : ""}</span>}>
        <CohortBoard v4={v4} />
        <ListDesk v4={v4} activeId={listId} />
        <LeadDesk rows={tableRows} v4={v4} base={base} selected={selected} onSelect={setSelected} />
        <div className="c4-presets" data-presets="">
          {presets.map((preset) => (
            <span key={preset.id} className="c4-chip" data-on="0">
              {renameId === preset.id ? (
                <input
                  aria-label={v4("editPreset")}
                  defaultValue={preset.name}
                  className="c4-field"
                  onBlur={(event) => {
                    savePresets(presets.map((item) => item.id === preset.id ? { ...item, name: event.target.value || item.name } : item));
                    setRenameId("");
                  }}
                />
              ) : (
                <button type="button" className="c4-preset-x" onClick={() => setQuery(preset.values)}>{preset.name}</button>
              )}
              <button type="button" className="c4-preset-x" aria-label={v4("editPreset")} onClick={() => setRenameId(preset.id)}>✎</button>
              <button type="button" className="c4-preset-x" aria-label={v4("deletePreset")} onClick={() => savePresets(presets.filter((item) => item.id !== preset.id))}>×</button>
            </span>
          ))}
          <input value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder={v4("presetName")} aria-label={v4("presetName")} className="c4-field" style={{ maxWidth: 160 }} />
          <button
            type="button"
            className="c4-btn"
            onClick={() => {
              const name = presetName.trim();
              if (!name) return;
              savePresets([...presets, { id: String(Date.now()), name, values: currentFilters() }]);
              setPresetName("");
            }}
          >
            {v4("savePreset")}
          </button>
          <p className="c4-muted c4-meta">{v4("localOnly")}</p>
        </div>
        <div className="c4-tools">
          <button type="button" className="c4-btn c4-sheet-toggle" onClick={() => setFiltersOpen((open) => !open)}>{filtersOpen ? v4("hideFilters") : v4("filterSheet")}</button>
          <button type="button" className="c4-chip" data-on={vipOnly ? "1" : "0"} onClick={() => setVipOnly((on) => !on)}>{v4("vipOnly")}</button>
          <button type="button" className="c4-btn" onClick={() => setBuilderOpen((open) => !open)}>{builderOpen ? v4("hideBuilder") : v4("builder")}</button>
          <button type="button" className="c4-chip" data-on={pipelineOn ? "1" : "0"} onClick={() => setPipelineOn((on) => !on)}>{v4("pipeline")}</button>
          <input className="c4-field" style={{ maxWidth: 220 }} value={ops} aria-label={v4("operatorSearch")} placeholder="email:ada country:TR" onChange={(event) => setOps(event.target.value)} />
          <QuickChips saleStatus={saleStatus} v4={v4} onPick={(status) => setQuery({ saleStatus: status })} />
          <DeskSwitch desks={deskNames} current={deskPick} v4={v4} onPick={setDeskPick} />
          <SearchHistory v4={v4} onPick={(query) => setQuery({ q: query })} />
          <input className="c4-field" style={{ maxWidth: 180 }} value={fuzzy} aria-label={v4("fuzzy")} placeholder={v4("fuzzy")} onChange={(event) => setFuzzy(event.target.value)} />
          <button type="button" className="c4-chip" data-on={followUp === "overdue" ? "1" : "0"} onClick={() => setQuery({ followUp: followUp === "overdue" ? "" : "overdue" })}>{v4("followUpDue")}</button>
          <button type="button" className="c4-chip" data-on={pinnedOnly ? "1" : "0"} onClick={() => setPinnedOnly((on) => !on)}>{v4("pinnedOnly")}</button>
          <button type="button" className="c4-btn" onClick={() => setQuery({ status: "", saleStatus: "", retentionStatus: "", country: "", presence: "", ftd: "", sort: "", sort2: "", followUp: "", minBal: "", maxBal: "", minEq: "", maxEq: "", fromReg: "", toReg: "" })}>{v4("clearFilters")}</button>
          {countActive({ status, saleStatus, retentionStatus, country, presence, ftd, followUp, sort, sort2, minBal, maxBal, minEq, maxEq, fromReg, toReg, ...headers }) > 0 && (
            <button type="button" className="c4-chip" onClick={() => { setHeaders({}); setQuery({ status: "", saleStatus: "", retentionStatus: "", country: "", presence: "", ftd: "", sort: "", sort2: "", followUp: "", minBal: "", maxBal: "", minEq: "", maxEq: "", fromReg: "", toReg: "" }); }}>
              {v4("clearAll")} <span className="c4-count">{countActive({ status, saleStatus, retentionStatus, country, presence, ftd, followUp, sort, sort2, minBal, maxBal, minEq, maxEq, fromReg, toReg, ...headers })}</span>
            </button>
          )}
          <button type="button" className="c4-btn" onClick={() => void copyFilterLink({ status, saleStatus, retentionStatus, country, presence, ftd, sort, q })}>{v4("shareFilters")}</button>
          <button type="button" className="c4-btn" aria-expanded={settingsOpen} onClick={() => setSettingsOpen((open) => !open)}>{v4("tableSettings")}</button>
          <button type="button" className="c4-btn" onClick={() => setQuery({ sort: sort === "name" ? "" : "name" })}>{v4("sortName")}</button>
          <button type="button" className="c4-btn" onClick={() => setQuery({ sort: sort === "balance" ? "" : "balance" })}>{v4("sortBalance")}</button>
          <button type="button" className="c4-btn" onClick={() => setQuery({ sort: sort === "score" ? "" : "score" })}>{v4("sortScore")}</button>
          <button type="button" className="c4-btn" onClick={() => setQuery({ sort2: sort2 === "name" ? "created" : sort2 === "created" ? "" : "name" })}>{v4("sortThen")} {sort2 || "—"}</button>
          <label className="c4-lab"><span>{v4("balanceRange")}</span><input className="c4-field" aria-label={v4("balanceRange")} defaultValue={minBal} onBlur={(event) => setQuery({ minBal: event.target.value })} /></label>
          <input className="c4-field" aria-label={v4("balanceRange")} defaultValue={maxBal} onBlur={(event) => setQuery({ maxBal: event.target.value })} />
          <label className="c4-lab"><span>{v4("equityRange")}</span><input className="c4-field" aria-label={v4("equityRange")} defaultValue={minEq} onBlur={(event) => setQuery({ minEq: event.target.value })} /></label>
          <input className="c4-field" aria-label={v4("equityRange")} defaultValue={maxEq} onBlur={(event) => setQuery({ maxEq: event.target.value })} />
          <label className="c4-lab"><span>{v4("registeredRange")}</span><input className="c4-field" type="date" aria-label={v4("registeredRange")} defaultValue={fromReg} onBlur={(event) => setQuery({ fromReg: event.target.value })} /></label>
          <input className="c4-field" type="date" aria-label={v4("registeredRange")} defaultValue={toReg} onBlur={(event) => setQuery({ toReg: event.target.value })} />
          <ShareViewButton v4={v4} payload={{ status, saleStatus, retentionStatus, country, presence, ftd, sort, sort2, followUp, minBal, maxBal, minEq, maxEq, fromReg, toReg }} />
          <BulkUntag ids={selected} tags={memory.tags} onChange={memory.setTags} v4={v4} />
          <button type="button" className="c4-btn" onClick={() => setTagManagerOn((on) => !on)}>{v4("tagManager")}</button>
          {nextCallId(shown) && <Link className="c4-btn" href={crmv4Href(base, `customers/${nextCallId(shown)}`)}>{v4("nextCall")}</Link>}
          <label className="c4-lab">
            <span>{v4("perPage")}</span>
            <select aria-label={v4("perPage")} className="c4-select" value={String(take)} onChange={(event) => setQuery({ take: event.target.value === String(TAKE) ? "" : event.target.value })}>
              {[20, 40, 80].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <button type="button" className="c4-btn" onClick={() => void exportRows(selected.length ? shown.filter((row) => selected.includes(row.id)) : shown)}>{selected.length ? v4("bulkExport") : tx("quickExport")}</button>
          <ExportColumns v4={v4} onExport={(cols) => void exportRows(selected.length ? shown.filter((row) => selected.includes(row.id)) : shown, cols)} />
          <BulkRemind rows={shown.filter((row) => selected.includes(row.id))} v4={v4} />
          <button type="button" className="c4-btn" onClick={() => void exportLeads()}>{tx("exportLeads")}</button>
        </div>
        {settingsOpen && (
          <div className="c4-tools" data-table-settings="">
            <span className="c4-muted">{v4("columns")}</span>
            {COLUMNS.map((col) => (
              <label key={col} className="c4-chip" data-on={columns.includes(col) ? "1" : "0"}>
                <input
                  type="checkbox"
                  checked={columns.includes(col)}
                  onChange={(event) => {
                    const next = event.target.checked ? [...columns, col] : columns.filter((item) => item !== col);
                    const safe = next.length ? next : [col];
                    setColumns(safe);
                    writeJson(COLUMN_KEY, safe);
                  }}
                />
                {columnLabel(col, tx)}
              </label>
            ))}
            <label className="c4-chip" data-on={dense ? "1" : "0"}>
              <input
                type="checkbox"
                checked={dense}
                onChange={(event) => {
                  setDense(event.target.checked);
                  window.localStorage.setItem(DENSE_KEY, event.target.checked ? "1" : "0");
                }}
              />
              {v4("denseRows")}
            </label>
            <button type="button" className="c4-btn" onClick={() => { const next = columnPreset("sales") as Col[]; setColumns(next); writeJson(COLUMN_KEY, next); }}>{v4("presetSales")}</button>
            <button type="button" className="c4-btn" onClick={() => { const next = columnPreset("retention") as Col[]; setColumns(next); writeJson(COLUMN_KEY, next); }}>{v4("presetRetention")}</button>
            <label className="c4-chip" data-on={relative ? "1" : "0"}>
              <input type="checkbox" checked={relative} onChange={(event) => setRelative(event.target.checked)} />
              {v4("relativeTime")}
            </label>
            {COLUMNS.map((col) => (
              <span key={`move-${col}`} className="c4-row">
                <button type="button" className="c4-btn" aria-label={v4("moveLeft")} onClick={() => { const next = moveItem(columns, col, -1); setColumns(next); writeJson(COLUMN_KEY, next); }}>{v4("moveLeft")}</button>
                <button type="button" className="c4-btn" aria-label={v4("moveRight")} onClick={() => { const next = moveItem(columns, col, 1); setColumns(next); writeJson(COLUMN_KEY, next); }}>{v4("moveRight")}</button>
              </span>
            ))}
          </div>
        )}
        {builderOpen && <FilterBuilder rules={rules} onChange={setRules} v4={v4} />}
        <div className="c4-tools">
          <input className="c4-field" style={{ maxWidth: 180 }} value={viewName} aria-label={v4("savedView")} placeholder={v4("savedView")} onChange={(event) => setViewName(event.target.value)} />
          <button type="button" className="c4-btn" onClick={() => {
            const name = viewName.trim();
            if (!name) return;
            memory.setViews([...memory.views, { id: String(Date.now()), name, rules, sort, columns }]);
            setViewName("");
          }}>{v4("saveView")}</button>
          {memory.views.map((view) => (
            <button key={view.id} type="button" className="c4-chip" onClick={() => { setRules(view.rules); setColumns(view.columns); setQuery({ sort: view.sort }); }}>{view.name}</button>
          ))}
        </div>
        {memory.recent.length > 0 && (
          <div className="c4-presets">
            <span className="c4-muted">{v4("recent")}</span>
            {memory.recent.map((row) => <Link key={row.id} className="c4-tag" href={crmv4Href(base, `customers/${row.id}`)}>{row.name || row.email}</Link>)}
          </div>
        )}
        <BulkDock rows={tableRows} selected={selected} lists={smartLists} v4={v4} tx={tx} onReload={() => data.reload()} onClear={() => setSelected([])} />
        <BulkNote ids={selected} v4={v4} tx={tx} onDone={() => { setSelected([]); data.reload(); }} />
        <div className="c4-row c4-pad">
          {FREEZE_PRESETS.map((preset) => (
            <button key={preset} type="button" className="c4-chip" onClick={async () => {
              if (!selected.length) return;
              for (const item of selected) await sendJson(`/api/admin/users/${encodeURIComponent(item)}`, "PATCH", { addNote: preset });
              await sendJson("/api/admin/users", "POST", { action: "bulk", bulkAction: "freeze", userIds: selected });
              setSelected([]);
              data.reload();
            }}>{preset}</button>
          ))}
        </div>
        <BirthdayList rows={shown} v4={v4} />
        <ConversionStat rows={shown} v4={v4} />
        <div className="c4-book-grid">
          <AgingBoard rows={shown} v4={v4} />
          <DomainBoard rows={shown} v4={v4} />
          <DepositorBoard rows={shown} v4={v4} locale={locale} />
          <WeeklyDigest rows={shown} v4={v4} tx={tx} />
        </div>
        <StreakBoard v4={v4} />
        <TagCloud v4={v4} onPick={setTagPick} />
        <StatusWatch rows={shown} v4={v4} />
        <StaleList rows={shown} v4={v4} />
        <SourceBoard rows={shown} v4={v4} />
        <ImportPreview known={shown.map((row) => row.email || "")} v4={v4} />
        <form
          key={`${saleStatus}|${retentionStatus}|${country}|${presence}|${ftd}`}
          className="c4-filters c4-filter-sheet"
          data-open={filtersOpen ? "1" : "0"}
          onSubmit={(event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            setQuery({
              country: String(fd.get("country") || ""),
              saleStatus: String(fd.get("saleStatus") || ""),
              retentionStatus: String(fd.get("retentionStatus") || ""),
              presence: String(fd.get("presence") || ""),
              ftd: fd.get("ftd") ? "1" : "",
            });
          }}
        >
          <div className="c4-filter-span c4-row">
            <Chip on={status === ""} onClick={() => setQuery({ status: "" })}>{tx("anyStatus")}</Chip>
            <Chip on={status === "active"} onClick={() => setQuery({ status: "active" })}>{tx("activeOnly")}</Chip>
            <Chip on={status === "frozen"} onClick={() => setQuery({ status: "frozen" })}>{tx("frozenOnly")}</Chip>
          </div>
          <select name="saleStatus" defaultValue={saleStatus} className="c4-select" aria-label={tx("sale")}>
            <option value="">{tx("sale")}</option>
            {SALE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select name="retentionStatus" defaultValue={retentionStatus} className="c4-select" aria-label={tx("retention")}>
            <option value="">{tx("retention")}</option>
            {RETENTION_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select name="presence" defaultValue={presence} className="c4-select" aria-label={tx("presence")}>
            <option value="">{tx("anyPresence")}</option>
            <option value="online">{tx("online")}</option>
            <option value="recent">{tx("recent")}</option>
            <option value="offline">{tx("offline")}</option>
          </select>
          <input name="country" defaultValue={country} placeholder={tx("filterCountry")} aria-label={tx("filterCountry")} className="c4-field" />
          <label className="c4-row"><input type="checkbox" name="ftd" defaultChecked={ftd === "1"} /> {tx("ftdOnly")}</label>
          <button type="submit" className="c4-btn c4-btn-hot">{tx("applyWord")}</button>
        </form>
        <State loading={data.loading} error={data.error} empty={!data.loading && tableRows.length === 0} tx={tx} onRetry={data.reload} hint={rows.length ? v4("emptyHint") : undefined} />
        <LuxList
          base={base}
          rows={tableRows}
          tx={tx}
          locale={locale}
          v4={v4}
          selected={selected}
          onToggle={(id) => setSelected((current) => toggleOne(current, id))}
          onTogglePage={() => setSelected((current) => togglePage(tableRows.map((row) => row.id), current))}
        />
        {tagManagerOn && <TagManager tags={memory.tags} onChange={memory.setTags} v4={v4} />}
        {selected.length >= 2 && <CompareDesk rows={shown.filter((row) => selected.includes(row.id))} base={base} v4={v4} locale={locale} />}
        {pipelineOn && <PipelineDesk rows={shown} v4={v4} onMove={async (id, status) => { await sendJson(`/api/admin/users/${encodeURIComponent(id)}`, "PATCH", { saleStatus: status }); data.reload(); }} />}
        <RoundRobinPreview ids={selected} v4={v4} tx={tx} onApplied={() => { setSelected([]); data.reload(); }} />
        <DuplicateScreen v4={v4} tx={tx} />
        {inspectId && <Customer360 base={base} id={inspectId} tx={tx} v4={v4} locale={locale} onClose={() => setInspectId("")} />}
        <Pager skip={skip} take={take} hasMore={Boolean(data.data?.hasMore)} total={data.data?.total} tx={tx} onPage={(next) => setQuery({ skip: next ? String(next) : "" })} />
      </Card>
    </div>
  );
}

function columnLabel(col: Col, tx: Tx) {
  if (col === "customer") return tx("customer");
  if (col === "country") return tx("country");
  if (col === "desk") return tx("desk");
  if (col === "sale") return tx("saleWord");
  if (col === "retention") return tx("retentionWord");
  if (col === "balance") return tx("balance");
  return tx("status");
}

const EXPORT_FIELDS: Record<string, (row: UserRow) => string> = {
  name: (row) => String(row.name || ""),
  email: (row) => String(row.email || ""),
  country: (row) => String(row.country || ""),
  desk: (row) => String(row.desk || ""),
  sale: (row) => String(row.saleStatus || ""),
  balance: (row) => String(row.balance ?? row.account?.balance ?? ""),
};

async function exportRows(rows: UserRow[], cols = ["name", "email", "country", "desk", "sale", "balance"]) {
  const ok = await auditExport("customers-page", rows.length, "/crmv4/customers");
  if (!ok) return;
  const fields = cols.filter((col) => EXPORT_FIELDS[col]);
  const picked = fields.length ? fields : Object.keys(EXPORT_FIELDS);
  downloadCsv("customers.csv", picked, rows.map((row) => picked.map((col) => EXPORT_FIELDS[col](row))));
}

async function exportLeads() {
  const res = await fetch("/api/admin/leads/export");
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leads.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

const PARTS = ["profile", "notes", "money", "trades", "files", "access", "activity"] as const;

export function CustomerDetail({ base, id, tx, locale }: { base: string; id: string; tx: Tx; locale: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const part = (params.get("part") || "profile") as (typeof PARTS)[number];
  const user = useJson<{ user?: UserRow; notes?: NoteRow[]; activityEvents?: ActivityRow[] }>(`/api/admin/users/${encodeURIComponent(id)}?view=profile`);
  const u = user.data?.user;
  const [quickMsg, setQuickMsg] = useState("");
  const [watching, setWatching] = useState(false);
  const [neighbors, setNeighbors] = useState({ prev: "", next: "" });
  const [shareUrl, setShareUrl] = useState("");
  useEffect(() => {
    setNeighbors(readNeighborIds(id));
    setWatching(watchIds().includes(id));
    setShareUrl(window.location.href);
  }, [id]);
  useEffect(() => {
    if (u) {
      rememberCustomer(u);
      pushWorkspace({ id: u.id, name: u.name || u.email || u.id });
      rememberView({ kind: "customer", id: u.id, title: u.name || u.email || u.id, href: crmv4Href(base, `customers/${u.id}`) });
    }
  }, [u, base]);
  function setPart(next: string) {
    const p = new URLSearchParams(params.toString());
    if (next && next !== "profile") p.set("part", next);
    else p.delete("part");
    router.replace(`?${p.toString()}`);
  }
  const v4 = (key: CrmV4CopyKey) => crmv4Text(locale, key);
  const margin = (u as (UserRow & { margin?: number }) | undefined)?.margin;
  return (
    <div className="c4-profile-split">
      <ProfileList base={base} current={id} v4={v4} />
      <div className="c4-stack c4-profile-main">
      <QuickSwitch base={base} id={id} />
      <WorkspaceTabs base={base} current={id} v4={v4} />
      <MiniNav v4={v4} />
      <State loading={user.loading} error={user.error} empty={!user.loading && !u} tx={tx} onRetry={user.reload} />
      {u && part === "profile" && (
        <Dossier
          base={base}
          user={u}
          notes={user.data?.notes || []}
          events={user.data?.activityEvents || []}
          v4={v4}
          tx={tx}
          locale={locale}
        />
      )}
      {u && part === "profile" && <RecordThread userId={id} v4={v4} tx={tx} locale={locale} />}
      {u && (
        <RecordHead
          base={base}
          user={u}
          locale={locale}
          tx={tx}
          v4={v4}
          quickMsg={quickMsg}
          onView={() => void openTerminal(id, tx, setQuickMsg)}
          onLink={() => void makeLink(id, tx, setQuickMsg)}
          onCopy={async () => {
            try { await navigator.clipboard.writeText(u.id); setQuickMsg(v4("copied")); } catch { setQuickMsg(u.id); }
          }}
        />
      )}
      {part === "money" && <FinanceBook id={id} v4={v4} locale={locale} tx={tx} />}
      {part === "files" && <Files id={id} email={u?.email || ""} tx={tx} locale={locale} />}
      {u && <TradeBook id={id} v4={v4} locale={locale} />}
      {u && (
        <div className="c4-record-tools">
          <Link href={crmv4Href(base, "customers")} className="c4-btn c4-pill">{tx("back")}</Link>
          <button type="button" className="c4-btn" aria-label={v4("prevCustomer")} disabled={!neighbors.prev} onClick={() => neighbors.prev && router.push(crmv4Href(base, `customers/${neighbors.prev}`))}>‹</button>
          <button type="button" className="c4-btn" aria-label={v4("nextCustomer")} disabled={!neighbors.next} onClick={() => neighbors.next && router.push(crmv4Href(base, `customers/${neighbors.next}`))}>›</button>
          {isDnc(id) && <span className="c4-status" data-tone="bad">{v4("doNotCall")}</span>}
          <ContactLine email={u.email} phone={u.phone} v4={v4} />
          <EmailHintLine email={u.email} v4={v4} />
          <LangBadge language={u.language} v4={v4} />
          <button type="button" className="c4-btn" onClick={() => { toggleWatch(id); setWatching(watchIds().includes(id)); }}>{watching ? v4("watchlist") : v4("watchAdd")}</button>
          <PresenceBadge lastSeen={(u as UserRow & { lastSeenAt?: string | null }).lastSeenAt} lastLogin={(u as UserRow & { lastLoginAt?: string | null }).lastLoginAt} v4={v4} locale={locale} />
          <LocalTime country={u.country} v4={v4} />
          <Field label={tx("registered")} value={when(u.createdAt, locale)} />
          <button type="button" className="c4-btn" onClick={async () => {
            const link = window.location.href;
            try { await navigator.clipboard.writeText(link); setQuickMsg(v4("shareLink")); } catch { setQuickMsg(link); }
          }}>{v4("shareLink")}</button>
          <button type="button" className="c4-btn" onClick={() => window.print()}>{v4("printProfile")}</button>
        </div>
      )}
      {u && (
        <LifeLine id={id} email={u.email || ""} notes={user.data?.notes || []} v4={v4} locale={locale} />
      )}
      {u && (
        <OnboardCard
          id={id}
          email={u.email || ""}
          createdAt={u.createdAt}
          documentsStatus={u.documentsStatus}
          v4={v4}
          locale={locale}
        />
      )}
      {u && (
        <StatementSheet
          id={id}
          name={u.name || ""}
          email={u.email || ""}
          country={u.country || "—"}
          desk={u.desk || "—"}
          balance={money(u.balance ?? u.account?.balance, u.currency || u.account?.currency, locale)}
          equity={money(u.equity ?? u.account?.equity, u.currency || u.account?.currency, locale)}
          sale={u.saleStatus || "—"}
          notes={user.data?.notes || []}
          v4={v4}
          locale={locale}
        />
      )}
      {u && (
        <Fold section="facts" title={v4("keyFacts")}>
          <KeyFacts row={u} locale={locale} v4={v4} balance={money(u.balance ?? u.account?.balance, u.currency || u.account?.currency, locale)} equity={money(u.equity ?? u.account?.equity, u.currency || u.account?.currency, locale)} country={u.country || "—"} desk={u.desk || "—"} sale={u.saleStatus || "—"} />
          <MarginGauge equity={u.equity ?? u.account?.equity} margin={margin} v4={v4} />
        <div className="c4-form c4-form-2">
          <Field label={tx("balance")} value={money(u.balance ?? u.account?.balance, u.currency || u.account?.currency, locale)} />
          <Field label={tx("equity")} value={money(u.equity ?? u.account?.equity, u.currency || u.account?.currency, locale)} />
          <Field label={tx("country")} value={u.country || "—"} />
          <Field label={tx("desk")} value={u.desk || "—"} />
          <Field label={tx("sale")} value={u.saleStatus || "—"} />
          <Field label={tx("assignee")} value={u.assigneeName || tx("unassigned")} />
          <Field label={tx("ftd")} value={u.ftd ? tx("yes") : tx("no")} />
        </div>
        </Fold>
      )}
      <Fold section="money" title={v4("recentTx")}>
        <TxMini id={id} locale={locale} v4={v4} />
        <MonthStatement id={id} locale={locale} v4={v4} />
      </Fold>
      <Fold section="book" title={v4("liveBook")}>
        <LiveBook id={id} locale={locale} v4={v4} />
      </Fold>
      <Fold section="docs" title={v4("docAsk")} openByDefault={false}>
        <DocAsk v4={v4} />
      </Fold>
      <Fold section="contact" title={v4("contactCounts")}>
        <ContactSummary email={u?.email} id={id} v4={v4} />
        <DncFlag id={id} v4={v4} />
        <PreferTime id={id} v4={v4} />
      </Fold>
      {u && <Fold section="tools" title={v4("fold")} openByDefault={false}><div className="c4-detail-tools"><SimilarList row={u} v4={v4} /><HandoffNote id={id} v4={v4} tx={tx} /><NoteCloud notes={user.data?.notes || []} v4={v4} /><EditLog id={id} v4={v4} /><PresenceFacts row={u} v4={v4} /><CallWindow country={u.country} v4={v4} /><CustomerQr url={shareUrl} v4={v4} /><RatioCard id={id} v4={v4} /><OnboardTrack row={u} v4={v4} /><WelcomeList id={id} v4={v4} /><ExpiryNote expiresAt={(u as UserRow & { expiresAt?: string | null }).expiresAt} v4={v4} /><CompletenessMeter row={u} v4={v4} /><InlineProfile id={id} user={u} tx={tx} v4={v4} onDone={user.reload} /><JourneyMap id={id} v4={v4} /><WinLossCard id={id} v4={v4} /><EquityCurve id={id} v4={v4} /><DocGallery id={id} v4={v4} /><TeamThread id={id} name="" v4={v4} tx={tx} /><CallbackButton id={id} name={u.name || u.email || ""} v4={v4} tx={tx} /><ValueSpark id={id} tx={tx} v4={v4} locale={locale} /><RetentionForm id={id} tx={tx} v4={v4} onDone={user.reload} /><StatementView id={id} tx={tx} v4={v4} locale={locale} /><NoteTemplates v4={v4} onUse={async (body) => { await sendJson(`/api/admin/users/${encodeURIComponent(id)}`, "PATCH", { addNote: body }); user.reload(); }} /><DocumentsCenter id={id} email={u.email || ""} tx={tx} v4={v4} locale={locale} /><TradingOverview id={id} tx={tx} v4={v4} locale={locale} /></div></Fold>}
      <div className="c4-with-side c4-detail-luxe">
        <nav className="c4-side" aria-label={tx("customers")}>
          {PARTS.map((item) => (
            <button key={item} type="button" data-on={part === item ? "1" : "0"} onClick={() => setPart(item)}>{tx(partKey(item))}</button>
          ))}
        </nav>
        <div className="c4-stack">
          {u && part === "profile" && <ProfileForm id={id} user={u} tx={tx} locale={locale} onDone={user.reload} />}
          {part === "notes" && <Notes id={id} notes={user.data?.notes || []} tx={tx} locale={locale} onDone={user.reload} />}
          {part === "trades" && <Trades id={id} tx={tx} locale={locale} />}
          {u && part === "access" && <Access id={id} user={u} tx={tx} onDone={user.reload} />}
          {part === "activity" && <ContactFeed id={id} notes={user.data?.notes || []} events={user.data?.activityEvents || []} v4={v4} locale={locale} />}
        </div>
      </div>
      <nav className="c4-record-foot" aria-label={v4("phoneFoot")}>
        <button type="button" className="c4-btn" data-on={part === "notes" ? "1" : "0"} onClick={() => setPart("notes")}>{tx("notesTab")}</button>
        <button type="button" className="c4-btn" data-on={part === "money" ? "1" : "0"} onClick={() => setPart("money")}>{tx("moneyTab")}</button>
        <button type="button" className="c4-btn" data-on={part === "files" ? "1" : "0"} onClick={() => setPart("files")}>{tx("filesTab")}</button>
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{tx("back")}</Link>
      </nav>
      </div>
    </div>
  );
}

function readNeighborIds(id: string): { prev: string; next: string } {
  if (typeof window === "undefined") return { prev: "", next: "" };
  try {
    const ids = JSON.parse(window.sessionStorage.getItem(IDS_KEY) || "[]") as string[];
    const index = ids.indexOf(id);
    if (index < 0) return { prev: "", next: "" };
    return { prev: ids[index - 1] || "", next: ids[index + 1] || "" };
  } catch {
    return { prev: "", next: "" };
  }
}

function partKey(part: (typeof PARTS)[number]) {
  if (part === "profile") return "profileTab" as const;
  if (part === "notes") return "notesTab" as const;
  if (part === "money") return "moneyTab" as const;
  if (part === "trades") return "tradeTab" as const;
  if (part === "files") return "filesTab" as const;
  if (part === "access") return "accessTab" as const;
  return "activityTab" as const;
}

function ProfileForm({ id, user, tx, locale, onDone }: { id: string; user: UserRow; tx: Tx; locale: string; onDone: () => void }) {
  const staff = useJson<{ workers?: { id: string; name?: string }[] }>("/api/admin/workers?take=100");
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const v4 = (key: CrmV4CopyKey) => crmv4Text(locale, key);
  const initial = { name: user.name || "", email: user.email || "", phone: user.phone || "", country: user.country || "" };
  const [live, setLive] = useState(initial);
  function readLive() {
    const node = formRef.current;
    if (!node) return;
    const fd = new FormData(node);
    setLive({
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      country: String(fd.get("country") || ""),
    });
  }
  function closeForm() {
    if (!sameEntry(live, initial) && !window.confirm(v4("discardEdit"))) return;
    setOpen(false);
  }
  if (!open) return <button type="button" className="c4-btn c4-btn-hot" onClick={() => setOpen(true)}>{v4("openForm")}</button>;
  return (
    <div className="c4-entry-luxe">
    <button type="button" className="c4-btn c4-phone-only" onClick={closeForm}>{v4("closeForm")}</button>
    <Card title={tx("profile")}>
      <EntryQuality fields={live} initial={initial} v4={v4} />
      <form
        ref={formRef}
        className="c4-form c4-form-2 c4-entry-form"
        style={{ padding: 16 }}
        onInput={readLive}
        onSubmit={async (event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          const assigneeId = String(fd.get("assigneeId") || "");
          const res = await sendJson(`/api/admin/users/${encodeURIComponent(id)}`, "PATCH", {
            name: fd.get("name"),
            email: fd.get("email"),
            phone: fd.get("phone"),
            firstName: fd.get("firstName"),
            lastName: fd.get("lastName"),
            country: fd.get("country"),
            language: fd.get("language"),
            accountType: fd.get("accountType"),
            desk: fd.get("desk"),
            saleStatus: fd.get("saleStatus"),
            retentionStatus: fd.get("retentionStatus"),
            potentialStatus: fd.get("potentialStatus"),
            validationStatus: fd.get("validationStatus"),
            documentsStatus: fd.get("documentsStatus"),
            campaign: fd.get("campaign"),
            affiliateA: fd.get("affiliateA"),
            affiliateB: fd.get("affiliateB"),
            affiliateC: fd.get("affiliateC"),
            brokerName: fd.get("brokerName"),
            tradingGroup: fd.get("tradingGroup"),
            tradingServer: fd.get("tradingServer"),
            address: fd.get("address"),
            retentionNote: fd.get("retentionNote"),
            retentionFollowUpAt: fd.get("retentionFollowUpAt"),
            assigneeId,
            active: fd.get("active") === "1",
          });
          setMsg(res.ok ? tx("customerSaved") : res.error || tx("failed"));
          if (res.ok) onDone();
        }}
      >
        <div className="c4-entry-block">
        <h3 className="c4-title">{v4("identityBlock")}</h3>
        <Lab label={tx("name")}><input name="name" defaultValue={user.name || ""} className="c4-field" /></Lab>
        <Lab label={tx("email")}><input name="email" defaultValue={user.email || ""} className="c4-field" /></Lab>
        <Lab label={tx("firstName")}><input name="firstName" defaultValue={user.firstName || ""} className="c4-field" /></Lab>
        <Lab label={tx("lastName")}><input name="lastName" defaultValue={user.lastName || ""} className="c4-field" /></Lab>
        <Lab label={tx("phone")}><input name="phone" defaultValue={user.phone || ""} className="c4-field" /></Lab>
        <Lab label={tx("country")}><input name="country" defaultValue={user.country || ""} className="c4-field" /></Lab>
        <Lab label={tx("language")}><input name="language" defaultValue={user.language || ""} className="c4-field" /></Lab>
        <button type="button" className="c4-btn" onClick={() => applySplit(live.name, formRef.current?.elements.namedItem("firstName") as HTMLInputElement | null, formRef.current?.elements.namedItem("lastName") as HTMLInputElement | null)}>{v4("splitName")}</button>
        </div>
        <div className="c4-entry-block">
        <h3 className="c4-title">{v4("deskBlock")}</h3>
        <Lab label={tx("desk")}><input name="desk" defaultValue={user.desk || ""} className="c4-field" /></Lab>
        <Lab label={tx("accountType")}>
          <select name="accountType" defaultValue={user.accountType || "STANDARD"} className="c4-select">
            {ACCOUNT_TYPES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        </div>
        <div className="c4-entry-block">
        <h3 className="c4-title">{v4("statusBlock")}</h3>
        <Lab label={tx("sale")}>
          <select name="saleStatus" defaultValue={user.saleStatus || ""} className="c4-select">
            <option value="" />
            {SALE_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("retention")}>
          <select name="retentionStatus" defaultValue={user.retentionStatus || ""} className="c4-select">
            <option value="" />
            {RETENTION_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("potential")}>
          <select name="potentialStatus" defaultValue={user.potentialStatus || ""} className="c4-select">
            <option value="" />
            {POTENTIAL_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("validation")}>
          <select name="validationStatus" defaultValue={user.validationStatus || ""} className="c4-select">
            <option value="" />
            {VALIDATION_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("documentsWord")}>
          <select name="documentsStatus" defaultValue={user.documentsStatus || "NONE"} className="c4-select">
            {["NONE", "PENDING", "APPROVED", "REJECTED"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("assignee")}>
          <select name="assigneeId" defaultValue={user.assigneeId || ""} className="c4-select">
            <option value="">{tx("unassigned")}</option>
            {(staff.data?.workers || []).map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}
          </select>
        </Lab>
        <Lab label={tx("campaign")}><input name="campaign" defaultValue={user.campaign || ""} className="c4-field" /></Lab>
        <Lab label={tx("affiliateA")}><input name="affiliateA" defaultValue={user.affiliateA || ""} className="c4-field" /></Lab>
        <Lab label={tx("affiliateB")}><input name="affiliateB" defaultValue={user.affiliateB || ""} className="c4-field" /></Lab>
        <Lab label={tx("affiliateC")}><input name="affiliateC" defaultValue={user.affiliateC || ""} className="c4-field" /></Lab>
        <Lab label={tx("broker")}><input name="brokerName" defaultValue={user.brokerName || ""} className="c4-field" /></Lab>
        <Lab label={tx("group")}><input name="tradingGroup" defaultValue={user.tradingGroup || ""} className="c4-field" /></Lab>
        <Lab label={tx("server")}><input name="tradingServer" defaultValue={user.tradingServer || ""} className="c4-field" /></Lab>
        <Lab label={tx("followUpAt")}><input name="retentionFollowUpAt" type="datetime-local" defaultValue={localDate(user.retentionFollowUpAt)} className="c4-field" /></Lab>
        <Lab label={tx("status")}>
          <select name="active" defaultValue={user.active === false ? "0" : "1"} className="c4-select">
            <option value="1">{tx("active")}</option>
            <option value="0">{tx("frozen")}</option>
          </select>
        </Lab>
        <Lab label={tx("addressLine")}><input name="address" defaultValue={user.address || ""} className="c4-field" /></Lab>
        <Lab label={tx("retentionNote")}><textarea name="retentionNote" defaultValue={user.retentionNote || ""} className="c4-field" rows={3} /></Lab>
        </div>
        <div className="c4-row c4-entry-span">
          <button type="submit" className="c4-btn c4-btn-hot" disabled={Boolean(live.email) && !emailOk(live.email)}>{tx("saveProfile")}</button>
          <button type="button" className="c4-btn" onClick={() => void openTerminal(id, tx, setMsg)}>{tx("viewAs")}</button>
          <button type="button" className="c4-btn" onClick={() => void makeLink(id, tx, setMsg)}>{tx("loginLink")}</button>
        </div>
        <Msg text={msg} />
      </form>
    </Card>
    </div>
  );
}

function localDate(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function openTerminal(id: string, tx: Tx, setMsg: (v: string) => void) {
  const res = await sendJson("/api/admin/impersonate", "POST", { userId: id, returnTo: `/izcrm/crmv4/customers/${id}` });
  if (!res.ok) {
    setMsg(res.error || tx("failed"));
    return;
  }
  const redirect = String(res.data.redirect || "/trade");
  window.location.href = redirect;
}

async function makeLink(id: string, tx: Tx, setMsg: (v: string) => void) {
  const res = await sendJson(`/api/admin/users/${encodeURIComponent(id)}/login-link`, "POST", { expiresInMinutes: 60, forcePasswordReset: false });
  const url = String(res.data.url || "");
  if (!res.ok || !url) {
    setMsg(res.error || tx("linkFailed"));
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    setMsg(tx("linkReady"));
  } catch {
    setMsg(url);
  }
}

type NoteRow = { id: string; body?: string; authorName?: string | null; createdAt?: string; team?: string | null };

function Notes({ id, notes, tx, locale, onDone }: { id: string; notes: NoteRow[]; tx: Tx; locale: string; onDone: () => void }) {
  const teams = useJson<{ notes?: NoteRow[]; writableTeams?: string[] }>(`/api/admin/users/${encodeURIComponent(id)}/team-notes?take=50`);
  const [msg, setMsg] = useState("");
  const [showTeam, setShowTeam] = useState(true);
  const teamNotes = teams.data?.notes || [];
  const v4 = (key: CrmV4CopyKey) => crmv4Text(locale, key);
  useEffect(() => { setShowTeam(readJson<boolean>("crmv4-show-agent-notes", true) !== false); }, []);
  return (
    <div className="c4-split-even c4-split">
      <button type="button" className="c4-chip" data-on={showTeam ? "1" : "0"} onClick={() => {
        const next = !showTeam;
        setShowTeam(next);
        writeJson("crmv4-show-agent-notes", next);
      }}>{v4("agentNotes")}</button>
      <Card title={tx("generalNote")}>
        <div className="c4-note-luxe">
          <NoteStudio id={id} notes={notes} tx={tx} locale={locale} v4={v4} onSaved={onDone} />
          <Msg text={msg} />
        </div>
      </Card>
      {showTeam && <Card title={tx("team")}>
        <NoteForm tx={tx} team={(teams.data?.writableTeams || ["SALE"])[0] || "SALE"} teams={teams.data?.writableTeams || []} onSubmit={async (body, team) => {
          const res = await sendJson(`/api/admin/users/${encodeURIComponent(id)}/team-notes`, "POST", { team, body });
          setMsg(res.ok ? tx("noteSaved") : res.error || tx("failed"));
          if (res.ok) teams.reload();
        }} />
        <NoteList rows={teamNotes} tx={tx} locale={locale} />
      </Card>}
    </div>
  );
}

function NoteForm({ tx, team, teams, onSubmit }: { tx: Tx; team?: string; teams?: string[]; onSubmit: (body: string, team?: string) => Promise<void> }) {
  return (
    <form
      className="c4-form"
      style={{ padding: 16 }}
      onSubmit={async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        await onSubmit(String(fd.get("body") || ""), String(fd.get("team") || team || ""));
        event.currentTarget.reset();
      }}
    >
      {teams && teams.length > 0 && (
        <Lab label={tx("team")}>
          <select name="team" defaultValue={team} className="c4-select">
            {teams.map((item) => <option key={item} value={item}>{item === "RET" ? tx("retTeam") : tx("saleTeam")}</option>)}
          </select>
        </Lab>
      )}
      <Lab label={tx("writeNote")}><textarea name="body" required rows={3} className="c4-field" /></Lab>
      <button type="submit" className="c4-btn c4-btn-hot">{tx("addNote")}</button>
    </form>
  );
}

function NoteList({ rows, tx, locale }: { rows: NoteRow[]; tx: Tx; locale: string }) {
  const [pinTick, setPinTick] = useState(0);
  if (!rows.length) return <p className="c4-muted" style={{ padding: 16 }}>{tx("emptyNotes")}</p>;
  const pins = rows.filter((row) => notePinned(row.id)).map((row) => row.id);
  const ordered = [...rows].sort((a, b) => Number(pins.includes(b.id)) - Number(pins.includes(a.id)));
  const v4 = (key: CrmV4CopyKey) => crmv4Text(locale, key);
  return (
    <ul data-pins={pinTick}>
      {ordered.map((row) => (
        <li key={row.id} style={{ padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }} data-pinned={pins.includes(row.id) ? "1" : "0"}>
          <RichNote body={row.body || ""} />
          <div className="c4-row">
            <span className="c4-muted">{row.authorName || "—"} · {row.team || tx("generalNote")} · {when(row.createdAt, locale)}</span>
            <button type="button" className="c4-btn" onClick={() => { toggleNotePin(row.id); setPinTick((n) => n + 1); }}>{pins.includes(row.id) ? v4("unpinNote") : v4("pinNote")}</button>
          </div>
        </li>
      ))}
    </ul>
  );
}


function Trades({ id, tx, locale }: { id: string; tx: Tx; locale: string }) {
  const data = useJson<{ positions?: Position[]; orders?: OrderRow[] }>(`/api/admin/users/${encodeURIComponent(id)}?view=positions&take=30`);
  const positions = data.data?.positions || [];
  const orders = data.data?.orders || [];
  return (
    <div className="c4-stack">
      <Card title={tx("positions")}>
        <State loading={data.loading} error={data.error} empty={!data.loading && positions.length === 0} tx={tx} onRetry={data.reload} />
        <PositionRows rows={positions} tx={tx} locale={locale} onDone={data.reload} />
      </Card>
      <Card title={tx("orders")}>
        {orders.length === 0 && !data.loading ? <p className="c4-muted" style={{ padding: 16 }}>{tx("noOrders")}</p> : null}
        <ul>
          {orders.map((row) => (
            <li key={row.id} className="c4-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
              <span>{row.symbol} · {row.side} · {row.type}</span>
              <span className="c4-muted">{row.status} · {when(row.createdAt, locale)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

type Position = { id: string; symbol?: string; side?: string; volume?: number; profit?: number; status?: string; openPrice?: number; closePrice?: number; openedAt?: string };
type OrderRow = { id: string; symbol?: string; side?: string; type?: string; status?: string; createdAt?: string };

export function PositionRows({ rows, tx, locale, onDone }: { rows: Position[]; tx: Tx; locale: string; onDone?: () => void }) {
  const [msg, setMsg] = useState("");
  if (!rows.length) return null;
  return (
    <>
      <ul>
        {rows.map((row) => (
          <li key={row.id}>
            <SwipeRow
              actions={row.status === "OPEN" && onDone ? [{
                key: "close",
                label: tx("closePosition"),
                tone: "bad",
                onClick: async () => {
                  if (!window.confirm(tx("confirmClose"))) return;
                  const res = await sendJson("/api/admin/positions", "PATCH", { id: row.id, status: "CLOSED", applyToBalance: false });
                  setMsg(res.ok ? tx("positionClosed") : res.error || tx("failed"));
                  if (res.ok) onDone();
                },
              }] : []}
            >
              <div className="c4-swipe-link">
                <div className="c4-row c4-between">
                  <span>{row.symbol} · {row.side} · {tx("volume")} {row.volume}</span>
                  <span className={plClass(row.profit)}>{money(row.profit, "USD", locale)}</span>
                </div>
                <div className="c4-muted">{when(row.openedAt, locale)} · {row.status}</div>
              </div>
            </SwipeRow>
          </li>
        ))}
      </ul>
      <p className="c4-muted" style={{ padding: "0 16px 8px" }}>{tx("closePositionHint")}</p>
      <Msg text={msg} />
    </>
  );
}

function Files({ id, email, tx, locale }: { id: string; email: string; tx: Tx; locale: string }) {
  const docs = useJson<{ documents?: DocRow[] }>(email ? `/api/admin/documents?q=${encodeURIComponent(email)}&take=40` : null);
  const files = useJson<{ documents?: FileRow[] }>(`/api/admin/customer-documents?userId=${encodeURIComponent(id)}&take=40`);
  const [msg, setMsg] = useState("");
  const [zoom, setZoom] = useState<null | { title: string; src?: string; pdf?: boolean }>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const v4 = (key: CrmV4CopyKey) => crmv4Text(locale, key);
  const mine = (docs.data?.documents || []).filter((row) => row.traderId === id);
  return (
    <div className="c4-stack c4-doc-luxe">
      <KycStudio id={id} rows={mine} loading={docs.loading} error={docs.error} onRetry={docs.reload} uploads={files.data?.documents || []} filesLoading={files.loading} tx={tx} locale={locale} v4={v4} />
      <DocDesk rows={mine} v4={v4} />
      <Card title={tx("kyc")}>
        <form
          className="c4-form c4-form-2"
          style={{ padding: 16 }}
          onSubmit={async (event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            const res = await sendJson("/api/admin/documents", "POST", { action: "create", userId: id, name: fd.get("name"), docType: fd.get("docType"), note: fd.get("note") });
            setMsg(res.ok ? tx("docReviewed") : res.error || tx("failed"));
            if (res.ok) docs.reload();
          }}
        >
          <Lab label={tx("name")}><input name="name" required className="c4-field" /></Lab>
          <Lab label={tx("docType")}>
            <select name="docType" className="c4-select">
              <option value="ID">{tx("docId")}</option>
              <option value="ADDRESS">{tx("docAddress")}</option>
              <option value="SELFIE">{tx("docSelfie")}</option>
              <option value="OTHER">{tx("docOther")}</option>
            </select>
          </Lab>
          <Lab label={tx("noteOptional")}><input name="note" className="c4-field" /></Lab>
          <button type="submit" className="c4-btn c4-btn-hot">{tx("createDoc")}</button>
        </form>
        <Msg text={msg} />
      </Card>
      <Card title={tx("evrak")}>
        <form
          className="c4-form"
          style={{ padding: 16 }}
          onSubmit={async (event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            fd.set("userId", id);
            const res = await fetch("/api/admin/customer-documents", { method: "POST", body: fd });
            const body = await res.json().catch(() => ({}));
            setMsg(res.ok ? tx("fileUploaded") : String((body as { error?: string }).error || tx("failed")));
            if (res.ok) files.reload();
          }}
        >
          <Lab label={tx("title")}><input name="title" className="c4-field" /></Lab>
          <Lab label={tx("chooseFile")}><input name="file" type="file" required accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" /></Lab>
          <button type="submit" className="c4-btn c4-btn-hot">{tx("upload")}</button>
        </form>
        <ul>
          {(files.data?.documents || []).map((row) => (
            <li key={row.id} className="c4-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
              <span>{row.title || row.fileName}</span>
              <button type="button" className="c4-btn" onClick={() => setZoom({ title: row.title || row.fileName || "", src: `/api/admin/customer-documents/${row.id}`, pdf: String(row.mime || row.fileName || "").toLowerCase().includes("pdf") })}>{v4("zoom")}</button>
              <button type="button" className="c4-btn" onClick={() => setCompare((list) => list.includes(row.id) ? list.filter((item) => item !== row.id) : [...list, row.id].slice(-2))}>{v4("compareDocs")}</button>
              <a href={`/api/admin/customer-documents/${row.id}`}>{tx("download")}</a>
            </li>
          ))}
        </ul>
        {compare.length > 0 && (
          <div className="c4-compare-grid">
            {compare.map((fileId) => <DocStage key={fileId} src={`/api/admin/customer-documents/${fileId}`} pdf={String((files.data?.documents || []).find((row) => row.id === fileId)?.fileName || "").includes("pdf")} v4={v4} />)}
          </div>
        )}
        {zoom && (
          <ReviewDialog title={zoom.title} src={zoom.src} pdf={zoom.pdf} v4={v4} tx={tx} onClose={() => setZoom(null)} />
        )}
      </Card>
    </div>
  );
}

type DocRow = { id: string; name?: string; docType?: string; status?: string; traderId?: string; createdAt?: string };
type FileRow = { id: string; title?: string; fileName?: string; mime?: string };

function Access({ id, user, tx, onDone }: { id: string; user: UserRow; tx: Tx; onDone: () => void }) {
  const perms = useJson<{ permissions?: { tradingEnabled?: boolean; withdrawalsEnabled?: boolean; loginEnabled?: boolean; loginBlockedMessage?: string | null } }>(`/api/admin/users/${encodeURIComponent(id)}/permissions`);
  const flags = perms.data?.permissions;
  const [msg, setMsg] = useState("");
  return (
    <Card title={tx("access")}>
      <State loading={perms.loading} error={perms.error} empty={false} tx={tx} onRetry={perms.reload} />
      <form
        key={flags ? "ready" : "wait"}
        className="c4-form"
        style={{ padding: 16 }}
        onSubmit={async (event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          const res = await sendJson(`/api/admin/users/${encodeURIComponent(id)}/permissions`, "PATCH", {
            tradingEnabled: fd.get("trading") === "1",
            withdrawalsEnabled: fd.get("withdrawals") === "1",
            loginEnabled: fd.get("login") === "1",
            loginBlockedMessage: fd.get("loginBlockedMessage"),
          });
          setMsg(res.ok ? tx("accessSaved") : res.error || tx("noPermission"));
          if (res.ok) {
            onDone();
            perms.reload();
          }
        }}
      >
        <Lab label={tx("trading")}>
          <select name="trading" defaultValue={flags?.tradingEnabled === false ? "0" : "1"} className="c4-select">
            <option value="1">{tx("tradingOn")}</option>
            <option value="0">{tx("tradingOff")}</option>
          </select>
        </Lab>
        <Lab label={tx("withdrawalsFlag")}>
          <select name="withdrawals" defaultValue={flags?.withdrawalsEnabled === false ? "0" : "1"} className="c4-select">
            <option value="1">{tx("withdrawOn")}</option>
            <option value="0">{tx("withdrawOff")}</option>
          </select>
        </Lab>
        <Lab label={tx("loginFlag")}>
          <select name="login" defaultValue={flags?.loginEnabled === false ? "0" : "1"} className="c4-select">
            <option value="1">{tx("loginOn")}</option>
            <option value="0">{tx("loginOff")}</option>
          </select>
        </Lab>
        <Lab label={tx("blockedMessage")}><textarea name="loginBlockedMessage" defaultValue={flags?.loginBlockedMessage || user.loginBlockedMessage || ""} className="c4-field" rows={2} /></Lab>
        <button type="submit" className="c4-btn c4-btn-hot">{tx("saveAccess")}</button>
        <Msg text={msg} />
      </form>
    </Card>
  );
}

type ActivityRow = { id: string; kind?: string; path?: string | null; createdAt?: string };
