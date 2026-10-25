"use client";

import { fmtCrmDate } from "@/lib/crm-format";
import { displayCrmMoney } from "@/lib/security/mask";

import Link from "next/link";
import { ACCOUNT_CURRENCIES, RETENTION_STATUSES, SALE_STATUSES } from "@/lib/membership";
import { dayEndIso, dayStartIso } from "@/lib/crm-api";
import {
  TRADER_TAKES,
  nextTraderSort,
  parseTraderListQuery,
  traderListSearchString,
  traderPageRange,
  traderPageSkip,
  type TraderListFilters,
} from "@/lib/crm-trader-query";
import { useCrmLabels } from "@/lib/i18n/crm-labels";
import { CRM_ROW_FOCUS, useCrmRowKeys } from "@/components/crm/CrmListRow";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVisiblePoll } from "@/lib/use-visible-poll";
import { LocationLabel, PresenceCell } from "@/components/crm/Presence";
import CopyButton from "@/components/crm/CopyButton";
import MultiSelect, { csvList, toggleCsv } from "@/components/crm/MultiSelect";
import {
  clearRecentClients,
  loadRecentClients,
  RECENT_CLIENTS_EVENT,
  RECENT_CLIENTS_KEY,
  recentAgo,
  removeRecentClient,
  type RecentClient,
} from "@/lib/crm-recent-clients";
import { CrmNotice } from "@/components/crm/CrmStates";
import Skeleton from "@/components/ui/Skeleton";

type DeskOpt = { id: string; name: string; code: string | null };

type UserRow = {
  id: string;
  email: string;
  accountLoginId?: string | null;
  name: string;
  role: string;
  active: boolean;
  tradingEnabled?: boolean;
  withdrawalsEnabled?: boolean;
  loginEnabled?: boolean;
  lastLoginAt: string | null;
  balance: number | null;
  equity: number | null;
  credit: number | null;
  bonus: number | null;
  currency: string;
  country: string | null;
  desk: string | null;
  saleStatus: string | null;
  retentionStatus: string | null;
  brokerName: string | null;
  assigneeName?: string | null;
  retentionFollowUpAt?: string | null;
  retentionNote?: string | null;
  lastContactAt?: string | null;
  ftd: boolean;
  phone: string | null;
  accountType: string;
  tradingAccountId?: string | null;
  lastSeenAt?: string | null;
  lastIp?: string | null;
  lastCountry?: string | null;
  lastCountryName?: string | null;
  lastRegion?: string | null;
  lastCity?: string | null;
  lastDevice?: string | null;
  lastBrowser?: string | null;
  lastOs?: string | null;
  createdAt?: string | null;
};

const REFRESH_MS = 20000;

/** Saved filter presets for the traders list — per browser (localStorage), no server/schema change. */
const SAVED_FILTERS_KEY = "7fx.crm.traderFilters.v1";
type TraderFilterState = {
  q: string;
  status: string;
  desk: string;
  country: string;
  saleStatus: string;
  accountType: string;
  dateFrom: string;
  dateTo: string;
  retentionStatus: string;
  presence: string;
  ftdOnly: boolean;
  followUp: string;
  lastContactFrom: string;
  lastContactTo: string;
  sort: string;
};
type SavedTraderFilter = { name: string; f: TraderFilterState };
const EMPTY_FILTERS: TraderFilterState = {
  q: "",
  status: "all",
  desk: "",
  country: "",
  saleStatus: "",
  accountType: "",
  dateFrom: "",
  dateTo: "",
  retentionStatus: "",
  presence: "",
  ftdOnly: false,
  followUp: "",
  lastContactFrom: "",
  lastContactTo: "",
  sort: "",
};
function readSavedFilters(): SavedTraderFilter[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED_FILTERS_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((x) => x && typeof x.name === "string" && x.f && typeof x.f === "object")
      .map((x) => ({ name: String(x.name).slice(0, 40), f: { ...EMPTY_FILTERS, ...x.f } }))
      .slice(0, 20);
  } catch {
    return [];
  }
}
function sameFilters(a: TraderFilterState, b: TraderFilterState): boolean {
  return (Object.keys(EMPTY_FILTERS) as (keyof TraderFilterState)[]).every((k) => a[k] === b[k]);
}

function sortMark(sort: string, field: string): string {
  if (sort === `${field}_desc`) return " ↓";
  if (sort === `${field}_asc`) return " ↑";
  return " ↕";
}

function ariaSort(sort: string, field: string): "ascending" | "descending" | "none" {
  if (sort === `${field}_asc`) return "ascending";
  if (sort === `${field}_desc`) return "descending";
  return "none";
}

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const emptyCreate = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  country: "TR",
  desk: "",
  brokerName: "",
  accountType: "STANDARD",
  balance: "0",
  currency: "USD",
};

export default function AdminUsersPage() {
  const { i18n, code, deskName } = useCrmLabels();
  const onRowKey = useCrmRowKeys();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [listPhase, setListPhase] = useState<"loading" | "ready" | "error">("loading");
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(50);
  const [filtersReady, setFiltersReady] = useState(false);
  const listGen = useRef(0);
  const appliedFilter = useRef("");
  const loadKey = useRef("");
  const searchRef = useRef<HTMLInputElement>(null);
  const countsSeen = useRef(false);
  const metaSeen = useRef(false);
  const [deskOptions, setDeskOptions] = useState<DeskOpt[]>([]);
  const [desksPartial, setDesksPartial] = useState(false);
  const [deskQ, setDeskQ] = useState("");
  const [deskHits, setDeskHits] = useState<DeskOpt[] | null>(null);
  const [deskSearchPartial, setDeskSearchPartial] = useState(false);
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [status, setStatus] = useState("all");
  const [desk, setDesk] = useState("");
  const [country, setCountry] = useState("");
  const [saleStatus, setSaleStatus] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [retentionStatus, setRetentionStatus] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [crmReadOnly, setCrmReadOnly] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [bulkDesk, setBulkDesk] = useState("");
  const [bulkBroker, setBulkBroker] = useState("");
  const [ftdOnly, setFtdOnly] = useState(false);

  const [presence, setPresence] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [lastContactFrom, setLastContactFrom] = useState("");
  const [lastContactTo, setLastContactTo] = useState("");
  const [sort, setSort] = useState("");
  const [followUpDue, setFollowUpDue] = useState<{ overdue: number; today: number }>({ overdue: 0, today: 0 });
  const [retentionCounts, setRetentionCounts] = useState<Record<string, number>>({});
  const [savedFilters, setSavedFilters] = useState<SavedTraderFilter[]>([]);
  useEffect(() => {
    setSavedFilters(readSavedFilters());
  }, []);
  // Recently viewed customers (per browser; name + login id only)
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  useEffect(() => {
    const sync = () => setRecentClients(loadRecentClients());
    sync();
    const onStorage = (e: StorageEvent) => {
      if (e.key === RECENT_CLIENTS_KEY) sync();
    };
    window.addEventListener(RECENT_CLIENTS_EVENT, sync);
    window.addEventListener("storage", onStorage);
    const tick = window.setInterval(sync, 60_000); // keep "5 dk" labels fresh
    return () => {
      window.removeEventListener(RECENT_CLIENTS_EVENT, sync);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(tick);
    };
  }, []);
  const currentFilters: TraderFilterState = {
    q,
    status,
    desk,
    country,
    saleStatus,
    accountType: accountTypeFilter,
    dateFrom,
    dateTo,
    retentionStatus,
    presence,
    ftdOnly,
    followUp,
    lastContactFrom,
    lastContactTo,
    sort,
  };
  const anyFilterActive = !sameFilters(currentFilters, EMPTY_FILTERS);
  const activePreset = savedFilters.find((p) => sameFilters(p.f, currentFilters))?.name ?? "";
  function applyFilters(f: TraderFilterState) {
    setQ(f.q);
    setStatus(f.status || "all");
    setDesk(f.desk);
    setCountry(f.country);
    setSaleStatus(f.saleStatus);
    setAccountTypeFilter(f.accountType);
    setDateFrom(f.dateFrom);
    setDateTo(f.dateTo);
    setRetentionStatus(f.retentionStatus);
    setPresence(f.presence);
    setFtdOnly(Boolean(f.ftdOnly));
    setFollowUp(f.followUp || "");
    setLastContactFrom(f.lastContactFrom || "");
    setLastContactTo(f.lastContactTo || "");
    setSort(f.sort || "");
    setQDebounced(f.q);
    setPage(1);
    setSelected(new Set());
  }
  function persistSaved(list: SavedTraderFilter[]) {
    setSavedFilters(list);
    try {
      localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(list));
    } catch { /* ignore */ }
  }
  function saveCurrentFilters() {
    const name = window.prompt(i18n("crm.savedFilters.namePrompt"), activePreset || "")?.trim().slice(0, 40);
    if (!name) return;
    const rest = savedFilters.filter((p) => p.name !== name);
    persistSaved([...rest, { name, f: { ...currentFilters } }].slice(-20));
  }
  function deleteActivePreset() {
    if (!activePreset) return;
    if (!window.confirm(`${i18n("crm.savedFilters.deleteConfirm")}: ${activePreset}`)) return;
    persistSaved(savedFilters.filter((p) => p.name !== activePreset));
  }
  const [now, setNow] = useState(() => Date.now());
  const skew = useRef(0);
  const filterSig = [
    qDebounced,
    status,
    desk,
    country,
    saleStatus,
    accountTypeFilter,
    dateFrom,
    dateTo,
    retentionStatus,
    presence,
    ftdOnly ? "1" : "0",
    followUp,
    lastContactFrom,
    lastContactTo,
    sort,
    String(take),
  ].join("\u0001");
  const listQuery: TraderListFilters = {
    q: qDebounced,
    status,
    desk,
    country,
    saleStatus,
    accountType: accountTypeFilter,
    dateFrom,
    dateTo,
    retentionStatus,
    presence,
    ftdOnly,
    followUp,
    lastContactFrom,
    lastContactTo,
    sort,
    page,
    take,
  };
  const range = traderPageRange(page, rows.length, take);

  const load = useCallback(async () => {
    const sig = filterSig;
    let usePage = page;
    if (appliedFilter.current && appliedFilter.current !== sig) {
      usePage = 1;
      if (page !== 1) setPage(1);
    }
    appliedFilter.current = sig;
    const params = new URLSearchParams();
    if (qDebounced) params.set("q", qDebounced);
    if (status && status !== "all") params.set("status", status);
    if (desk) params.set("desk", desk);
    if (country) params.set("country", country);
    if (saleStatus) params.set("saleStatus", saleStatus);
    if (accountTypeFilter) params.set("accountType", accountTypeFilter);
    const f = dayStartIso(dateFrom);
    const tt = dayEndIso(dateTo);
    if (f) params.set("from", f);
    if (tt) params.set("to", tt);
    if (retentionStatus) params.set("retentionStatus", retentionStatus);
    if (presence) params.set("presence", presence);
    if (followUp) params.set("followUp", followUp);
    const lcf = dayStartIso(lastContactFrom);
    const lct = dayEndIso(lastContactTo);
    if (lcf) params.set("lastContactFrom", lcf);
    if (lct) params.set("lastContactTo", lct);
    if (sort) params.set("sort", sort);
    if (ftdOnly) params.set("ftd", "1");
    params.set("tzo", String(new Date().getTimezoneOffset()));
    const requestKey = `${params.toString()}&page=${usePage}`;
    const gen = ++listGen.current;
    params.set("skip", String(traderPageSkip(usePage, take)));
    params.set("take", String(take));
    if (metaSeen.current) params.set("meta", "0");
    if (!countsSeen.current) params.set("counts", "1");
    params.set("view", "table");
    const previousKey = loadKey.current;
    loadKey.current = requestKey;
    if (previousKey && previousKey !== requestKey) {
      setRows([]);
      setListPhase("loading");
    }
    try {
      const res = await fetch(`/api/admin/users?${params}`, { cache: "no-store" });
      if (gen !== listGen.current) return;
      if (!res.ok) {
        setListPhase("error");
        return;
      }
      const data = await res.json();
      const st = new Date(data.serverTime).getTime();
      if (Number.isFinite(st)) skew.current = st - Date.now();
      setNow(Date.now() + skew.current);
      const list: UserRow[] = data.users || [];
      setRows(list);
      setHasMore(Boolean(data.hasMore));
      setTotal(typeof data.total === "number" ? data.total : null);
      if (data.deskOptions) {
        setDeskOptions(data.deskOptions);
        setDesksPartial(Boolean(data.desksPartial));
        metaSeen.current = true;
      }
      if (data.followUpDue) {
        setFollowUpDue({
          overdue: Number(data.followUpDue.overdue) || 0,
          today: Number(data.followUpDue.today) || 0,
        });
        countsSeen.current = true;
      }
      if (data.retentionCounts && typeof data.retentionCounts === "object") {
        setRetentionCounts(data.retentionCounts as Record<string, number>);
        countsSeen.current = true;
      }
      setListPhase("ready");
    } catch {
      if (gen === listGen.current) setListPhase("error");
    }
  }, [filterSig, page, take, qDebounced, status, desk, country, saleStatus, retentionStatus, ftdOnly, presence, accountTypeFilter, dateFrom, dateTo, followUp, lastContactFrom, lastContactTo, sort]);

  useEffect(() => {
    if (!filtersReady) return;
    void load();
  }, [load, filtersReady]);

  useEffect(() => {
    const query = deskQ.trim();
    if (!query) {
      setDeskHits(null);
      setDeskSearchPartial(false);
      return;
    }
    const ac = new AbortController();
    const timer = setTimeout(() => {
      void fetch(`/api/admin/users?lookup=desks&deskQ=${encodeURIComponent(query)}`, { signal: ac.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          setDeskHits(Array.isArray(data.deskOptions) ? data.deskOptions : []);
          setDeskSearchPartial(Boolean(data.desksPartial));
        })
        .catch(() => {
          /* aborted or offline */
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [deskQ]);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setCanManageUsers(Boolean(d.permissions?.canManageUsers));
        setCrmReadOnly(Boolean(d.permissions?.crmReadOnly));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const parsed = parseTraderListQuery(window.location.search);
    setQ(parsed.q);
    setQDebounced(parsed.q);
    setStatus(parsed.status || "all");
    setDesk(parsed.desk);
    setCountry(parsed.country);
    setSaleStatus(parsed.saleStatus);
    setAccountTypeFilter(parsed.accountType);
    setDateFrom(parsed.dateFrom);
    setDateTo(parsed.dateTo);
    setRetentionStatus(parsed.retentionStatus);
    setPresence(parsed.presence);
    setFtdOnly(parsed.ftdOnly);
    setFollowUp(parsed.followUp);
    setLastContactFrom(parsed.lastContactFrom);
    setLastContactTo(parsed.lastContactTo);
    setSort(parsed.sort);
    setPage(parsed.page);
    setTake(parsed.take);
    setFiltersReady(true);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setQDebounced(q), 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  const queryString = traderListSearchString(listQuery);
  useEffect(() => {
    if (!filtersReady) return;
    const path = window.location.pathname;
    const url = queryString ? `${path}?${queryString}` : path;
    if (url !== `${path}${window.location.search}`) window.history.replaceState(null, "", url);
  }, [filtersReady, queryString]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;
      e.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Auto-refresh presence/balances. Only row data is replaced — filters, selection and the
  // create form live in separate state, so typed input is never overwritten.
  useVisiblePoll(load, REFRESH_MS, filtersReady);

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAll() {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }

  async function bulk(bulkAction: string, extra: Record<string, unknown> = {}) {
    if (!selected.size) {
      setMsg(i18n("crm.ui.selectFirst"));
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk",
          bulkAction,
          userIds: Array.from(selected),
          ...extra,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || i18n("crm.ui.actionFailed"));
        return;
      }
      setMsg(`${i18n("crm.ui.bulkDone")}: ${data.count}`);
      setSelected(new Set());
      await load();
    } finally {
      setBusy(false);
    }
  }

  /**
   * CSV of the rows currently shown (after server + client filters). Client-side only,
   * but gated by the existing export-audit endpoint: it audits the export and rejects
   * read-only admins / scoped staff, so no new export capability is opened. Phone is
   * intentionally left out (contact data stays in the CRM).
   */
  const [csvBusy, setCsvBusy] = useState(false);
  async function downloadCsv() {
    if (rows.length === 0 || csvBusy) return;
    setCsvBusy(true);
    try {
      const audit = await fetch("/api/admin/export-audit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "traders_csv", path: "/izcrm/traders", rows: rows.length }),
      }).catch(() => null);
      if (!audit || !audit.ok) {
        setMsg(i18n("crm.ui.csvDenied"));
        return;
      }
      const header = [
        i18n("crm.ui.name"),
        i18n("crm.ui.email"),
        i18n("crm.ui.accountId"),
        "User ID",
        i18n("crm.ui.desk"),
        i18n("crm.ui.country"),
        i18n("crm.ui.status"),
        i18n("crm.ui.accountType"),
        "FTD",
        i18n("crm.ui.saleStatus"),
        i18n("crm.ui.retention"),
        i18n("crm.ui.assignee"),
        i18n("crm.ui.broker"),
        i18n("crm.ui.balance"),
        i18n("crm.ui.equity"),
        i18n("crm.ui.credit"),
        i18n("crm.ui.bonus"),
        i18n("crm.ui.currency"),
        i18n("crm.ui.lastLogin"),
        i18n("crm.ui.lastContact"),
        i18n("crm.ui.regDate"),
      ];
      const lines = [header.map(csvCell).join(",")];
      for (const u of rows) {
        lines.push(
          [
            u.name,
            u.email,
            u.accountLoginId ?? "",
            u.id,
            u.desk ? deskName(u.desk) : "",
            u.country ?? "",
            u.active ? i18n("crm.ui.active") : i18n("crm.ui.frozen"),
            u.accountType ? code("crm.accountType", u.accountType) : "",
            u.ftd ? "YES" : "NO",
            u.saleStatus ? code("crm.sale", u.saleStatus) : "",
            u.retentionStatus ? code("crm.retention", u.retentionStatus) : "",
            u.assigneeName ?? "",
            u.brokerName ?? "",
            Number.isFinite(u.balance) ? u.balance : "",
            Number.isFinite(u.equity) ? u.equity : "",
            Number.isFinite(u.credit) ? u.credit : "",
            Number.isFinite(u.bonus) ? u.bonus : "",
            u.currency ?? "",
            u.lastLoginAt ?? "",
            u.lastContactAt ?? "",
            u.createdAt ?? "",
          ]
            .map(csvCell)
            .join(","),
        );
      }
      const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `traders-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setCsvBusy(false);
    }
  }

  async function createMember(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          email: createForm.email,
          password: createForm.password,
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          phone: createForm.phone,
          country: createForm.country,
          desk: createForm.desk || null,
          brokerName: createForm.brokerName || null,
          accountType: createForm.accountType,
          balance: Number(createForm.balance),
          currency: createForm.currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || i18n("crm.ui.createFailed"));
        return;
      }
      setMsg(i18n("crm.ui.memberCreated"));
      setShowCreate(false);
      setCreateForm(emptyCreate);
      await load();
    } finally {
      setBusy(false);
    }
  }

  const deskPool = deskHits ?? deskOptions;
  const selectedDeskIds = desk ? desk.split(",").filter(Boolean) : [];
  const pinnedDesks = deskOptions.filter(
    (d) => selectedDeskIds.includes(d.code || d.id) && !deskPool.some((row) => row.id === d.id)
  );
  const deskShown = pinnedDesks.concat(deskPool);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{i18n("crm.nav.traders")}</h1>
        <button
          onClick={() => { if (!crmReadOnly && canManageUsers) setShowCreate(true); }}
          className="rounded-lg bg-black text-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-800"
        >
          {i18n("crm.ui.newMember")}
        </button>
        <div className="ml-auto w-full max-w-xs">
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={i18n("crm.ui.searchTraders")}
            aria-label={i18n("crm.ui.searchTraders")}
            aria-keyshortcuts="/"
            data-fx-trader-search=""
            autoComplete="off"
            className="min-h-10 w-full rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-3 text-base lg:text-sm"
          />
          <p className="mt-1 text-[11px] font-medium text-neutral-400">{i18n("crm.traders.searchKey")}</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <MultiSelect
          dataAttr="status"
          placeholder={i18n("crm.ui.allStatuses")}
          clearLabel={i18n("crm.fu.clear")}
          value={status === "all" ? "" : status}
          onChange={(v) => setStatus(v || "all")}
          options={[
            { value: "active", label: i18n("crm.ui.active") },
            { value: "frozen", label: i18n("crm.ui.frozen") },
            { value: "trade_off", label: i18n("crm.perms.filterTradeOff") },
            { value: "withdraw_off", label: i18n("crm.perms.filterWithdrawOff") },
            { value: "login_off", label: i18n("crm.perms.filterLoginOff") },
          ]}
        />
        <select
          value={presence}
          onChange={(e) => setPresence(e.target.value)}
          className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
        >
          <option value="">{i18n("crm.presence.allPresence")}</option>
          <option value="online">{i18n("crm.presence.filterOnline")}</option>
          <option value="recent">{i18n("crm.presence.filterRecent")}</option>
          <option value="offline">{i18n("crm.presence.filterOffline")}</option>
        </select>
        <input
          value={deskQ}
          onChange={(e) => setDeskQ(e.target.value)}
          placeholder={i18n("crm.desk.search")}
          className="w-36 rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
        />
        <MultiSelect
          dataAttr="desk"
          placeholder={i18n("crm.ui.allDesks")}
          clearLabel={i18n("crm.fu.clear")}
          value={desk}
          onChange={setDesk}
          options={deskShown.map((d) => ({ value: d.code || d.id, label: deskName(d) }))}
        />
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder={i18n("crm.ui.country")}
          className="w-20 rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
        />
        <MultiSelect
          dataAttr="saleStatus"
          placeholder={i18n("crm.ui.saleStatus")}
          clearLabel={i18n("crm.fu.clear")}
          value={saleStatus}
          onChange={setSaleStatus}
          options={SALE_STATUSES.map((x) => ({ value: x, label: code("crm.sale", x) }))}
        />
        <select
          value={accountTypeFilter}
          onChange={(e) => setAccountTypeFilter(e.target.value)}
          className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
        >
          <option value="">{i18n("crm.ui.type")}</option>
          {["STANDARD", "PRO", "VIP", "DEMO"].map((s) => (
            <option key={s} value={s}>
              {code("crm.accountType", s)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-neutral-500">
          <span>{i18n("crm.ui.from")}</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
          />
        </label>
        <label className="flex items-center gap-1 text-neutral-500">
          <span>{i18n("crm.ui.to")}</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
          />
        </label>
        <MultiSelect
          dataAttr="retentionStatus"
          placeholder={i18n("crm.ui.retention")}
          clearLabel={i18n("crm.fu.clear")}
          value={retentionStatus}
          onChange={setRetentionStatus}
          options={RETENTION_STATUSES.map((x) => ({ value: x, label: code("crm.retention", x) }))}
        />
        <MultiSelect
          dataAttr="followUp"
          placeholder={i18n("crm.fu.filter")}
          clearLabel={i18n("crm.fu.clear")}
          value={followUp}
          onChange={setFollowUp}
          options={(["overdue", "today", "week", "any"] as const).map((x) => ({ value: x, label: i18n(`crm.fu.${x}`) }))}
        />
        <label className="flex items-center gap-1 text-neutral-500" data-fx-last-contact-range>
          <span>{i18n("crm.ui.lastContact")}</span>
          <input
            type="date"
            value={lastContactFrom}
            onChange={(e) => setLastContactFrom(e.target.value)}
            aria-label={`${i18n("crm.ui.lastContact")} ${i18n("crm.ui.from")}`}
            className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
          />
          <span>–</span>
          <input
            type="date"
            value={lastContactTo}
            onChange={(e) => setLastContactTo(e.target.value)}
            aria-label={`${i18n("crm.ui.lastContact")} ${i18n("crm.ui.to")}`}
            className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
          />
        </label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
          aria-label={i18n("crm.ui.sort")}
          data-fx-sort
        >
          <option value="">{i18n("crm.ui.sortDefault")}</option>
          <option value="name_asc">{i18n("crm.traders.sortName")} ↑</option>
          <option value="name_desc">{i18n("crm.traders.sortName")} ↓</option>
          <option value="email_asc">{i18n("crm.traders.sortEmail")} ↑</option>
          <option value="email_desc">{i18n("crm.traders.sortEmail")} ↓</option>
          <option value="account_asc">{i18n("crm.traders.sortAccount")} ↑</option>
          <option value="account_desc">{i18n("crm.traders.sortAccount")} ↓</option>
          <option value="balance_desc">{i18n("crm.traders.sortBalance")} ↓</option>
          <option value="balance_asc">{i18n("crm.traders.sortBalance")} ↑</option>
          <option value="created_desc">{i18n("crm.traders.sortCreated")} ↓</option>
          <option value="created_asc">{i18n("crm.traders.sortCreated")} ↑</option>
          <option value="login_desc">{i18n("crm.traders.sortLogin")} ↓</option>
          <option value="login_asc">{i18n("crm.traders.sortLogin")} ↑</option>
          <option value="sale_asc">{i18n("crm.traders.sortSale")} ↑</option>
          <option value="sale_desc">{i18n("crm.traders.sortSale")} ↓</option>
          <option value="lastContact_desc">{i18n("crm.ui.sortLastContactDesc")}</option>
          <option value="lastContact_asc">{i18n("crm.ui.sortLastContactAsc")}</option>
        </select>
        <label className="flex items-center gap-1 text-neutral-500">
          <input
            type="checkbox"
            checked={ftdOnly}
            onChange={(e) => setFtdOnly(e.target.checked)}
          />
          FTD
        </label>
      </div>
      {(deskHits ? deskSearchPartial : desksPartial) && (
        <p className="mb-2 text-[11px] text-amber-700">
          {i18n(deskHits ? "crm.desk.searchPartial" : "crm.desk.partial")}
        </p>
      )}

      {(followUpDue.overdue > 0 || followUpDue.today > 0 || followUp) && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs" data-fx-followup-due aria-label={i18n("crm.fu.title")}>
          <span className="text-neutral-500">⏰ {i18n("crm.fu.title")}:</span>
          <button
            type="button"
            onClick={() => setFollowUp(toggleCsv(followUp, "overdue"))}
            aria-pressed={csvList(followUp).includes("overdue")}
            className={`rounded-full border px-2.5 py-1 tabular-nums ${
              csvList(followUp).includes("overdue")
                ? "border-red-500 bg-red-500 text-white"
                : followUpDue.overdue > 0
                  ? "border-red-300 bg-red-50 text-red-700"
                  : "border-[#e5e5e5] text-neutral-500"
            }`}
          >
            {i18n("crm.fu.overdue")} · {followUpDue.overdue}
          </button>
          <button
            type="button"
            onClick={() => setFollowUp(toggleCsv(followUp, "today"))}
            aria-pressed={csvList(followUp).includes("today")}
            className={`rounded-full border px-2.5 py-1 tabular-nums ${
              csvList(followUp).includes("today")
                ? "border-amber-500 bg-amber-500 text-white"
                : followUpDue.today > 0
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-[#e5e5e5] text-neutral-500"
            }`}
          >
            {i18n("crm.fu.todayLeft")} · {followUpDue.today}
          </button>
          {followUp && (
            <button
              type="button"
              onClick={() => setFollowUp("")}
              className="rounded-full border border-[#e5e5e5] px-2.5 py-1 text-neutral-500 hover:text-neutral-800"
            >
              ✕ {i18n("crm.fu.clear")}
            </button>
          )}
        </div>
      )}

      {/* Retention status distribution (scoped; click to filter) */}
      {(RETENTION_STATUSES.some((s) => (retentionCounts[s] || 0) > 0) || retentionStatus) && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs" data-fx-retention-dist aria-label={i18n("crm.ui.retention")}>
          <span className="text-neutral-500">{i18n("crm.ui.retention")}:</span>
          {RETENTION_STATUSES.map((s) => {
            const n = retentionCounts[s] || 0;
            const on = csvList(retentionStatus).includes(s);
            if (!n && !on) return null;
            const tone =
              s === "AT_RISK"
                ? "border-red-300 bg-red-50 text-red-700"
                : s === "VIP"
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : s === "ACTIVE"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-[#e5e5e5] text-neutral-600";
            return (
              <button
                key={s}
                type="button"
                onClick={() => setRetentionStatus(toggleCsv(retentionStatus, s))}
                aria-pressed={on}
                className={`rounded-full border px-2.5 py-1 tabular-nums ${on ? "border-black bg-black text-white" : tone}`}
              >
                {code("crm.retention", s)} · {n}
              </button>
            );
          })}
          {retentionStatus && (
            <button
              type="button"
              onClick={() => setRetentionStatus("")}
              className="rounded-full border border-[#e5e5e5] px-2.5 py-1 text-neutral-500 hover:text-neutral-800"
            >
              ✕ {i18n("crm.fu.clear")}
            </button>
          )}
        </div>
      )}

      {/* Saved filter presets (per browser) */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs" aria-label={i18n("crm.savedFilters.title")}>
        <span className="text-neutral-500">{i18n("crm.savedFilters.title")}:</span>
        {savedFilters.length === 0 && (
          <span className="text-neutral-400">{i18n("crm.savedFilters.empty")}</span>
        )}
        {savedFilters.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => applyFilters(p.f)}
            aria-pressed={activePreset === p.name}
            className={`rounded-full border px-2.5 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black ${
              activePreset === p.name
                ? "border-black bg-black text-white"
                : "border-[#e5e5e5] bg-[#ffffff] hover:bg-[#f5f5f5]"
            }`}
          >
            {p.name}
          </button>
        ))}
        <button
          type="button"
          onClick={saveCurrentFilters}
          disabled={!anyFilterActive}
          title={i18n("crm.savedFilters.saveHint")}
          className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2.5 py-1 hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-40"
        >
          + {i18n("crm.savedFilters.save")}
        </button>
        {activePreset && (
          <button
            type="button"
            onClick={deleteActivePreset}
            className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2.5 py-1 text-red-600 hover:bg-red-50"
          >
            {i18n("crm.savedFilters.delete")}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            applyFilters(EMPTY_FILTERS);
            setPage(1);
          }}
          disabled={!anyFilterActive && page === 1}
          data-fx-list-clear=""
          className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2.5 py-1 font-medium text-neutral-600 hover:bg-[#f5f5f5] disabled:opacity-40"
        >
          {i18n("crm.list.clear")}
        </button>
        <span className="ml-auto text-neutral-400 tabular-nums" data-fx-trader-count="">
          {range.from <= 0
            ? i18n("crm.list.none")
            : total == null
              ? `${rows.length} ${i18n("crm.savedFilters.results")}`
              : i18n("crm.list.showing")
                  .replace("{from}", String(range.from))
                  .replace("{to}", String(range.to))
                  .replace("{total}", String(total))}
        </span>
        {!crmReadOnly && (
          <button
            type="button"
            onClick={downloadCsv}
            disabled={rows.length === 0 || csvBusy}
            title={i18n("crm.ui.csvDownload")}
            className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2.5 py-1 font-medium hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-40"
          >
            CSV
          </button>
        )}
      </div>

      {recentClients.length > 0 && (
        <div
          className="mb-3 flex flex-wrap items-center gap-2 text-xs"
          role="region"
          aria-label={i18n("crm.recentClients.title")}
          data-fx-recent-clients
        >
          <span className="text-neutral-500">◷ {i18n("crm.recentClients.title")}:</span>
          {recentClients.map((r) => {
            const ago = recentAgo(r.at, {
              now: i18n("crm.recentClients.now"),
              min: i18n("crm.recentClients.min"),
              hour: i18n("crm.recentClients.hour"),
              day: i18n("crm.recentClients.day"),
            });
            return (
              <span
                key={r.href}
                className="inline-flex max-w-full items-center overflow-hidden rounded-full border border-[#e5e5e5] bg-[#ffffff]"
              >
                <Link
                  href={r.href}
                  className="inline-flex min-w-0 items-center gap-1.5 py-1 pl-2.5 pr-1 hover:bg-[#f5f5f5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
                  title={[r.title, r.sub, ago].filter(Boolean).join(" · ")}
                >
                  <span className="max-w-[160px] truncate font-medium text-neutral-800">{r.title}</span>
                  {r.sub && <span className="hidden text-neutral-400 sm:inline">{r.sub}</span>}
                  {ago && <span className="text-[10px] text-neutral-400 tabular-nums">{ago}</span>}
                </Link>
                <button
                  type="button"
                  onClick={() => removeRecentClient(r.href)}
                  aria-label={`${i18n("crm.recentClients.remove")}: ${r.title}`}
                  title={i18n("crm.recentClients.remove")}
                  className="px-1.5 py-1 text-neutral-300 hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
                >
                  ×
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={() => {
              if (window.confirm(i18n("crm.recentClients.clearConfirm"))) clearRecentClients();
            }}
            className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2.5 py-1 text-neutral-500 hover:bg-[#f5f5f5]"
          >
            {i18n("crm.recentClients.clear")}
          </button>
        </div>
      )}

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#e5e5e5] bg-[#ffffff] p-2 text-xs">
          <span className="text-neutral-500">{selected.size} {i18n("crm.ui.selected")}</span>
          {!crmReadOnly && (
            <>
          <button
            disabled={busy}
            onClick={() => bulk("freeze")}
            className="rounded bg-red-600/80 px-2 py-1 hover:bg-red-500"
          >
            {i18n("crm.ui.freeze")}
          </button>
          <button
            disabled={busy}
            onClick={() => bulk("activate")}
            className="rounded bg-emerald-600/80 px-2 py-1 hover:bg-emerald-500"
          >
            {i18n("crm.ui.activate")}
          </button>
          <select
            value={bulkDesk}
            onChange={(e) => setBulkDesk(e.target.value)}
            className="rounded border border-[#111111] bg-white px-2 py-1 text-sm text-[#111111]"
          >
            <option value="">{i18n("crm.ui.assignDesk")}</option>
            {deskShown.map((d) => (
              <option key={d.id} value={d.id}>
                {deskName(d)}
              </option>
            ))}
          </select>
          <button
            disabled={busy || !bulkDesk}
            onClick={() => {
              const picked = deskShown.find((d) => d.id === bulkDesk);
              bulk("assignDesk", {
                desk: picked?.name || bulkDesk,
                deskId: picked?.id || bulkDesk,
              });
            }}
            className="rounded bg-[#e5e5e5] px-2 py-1 hover:bg-[#f0f0f0]"
          >
            {i18n("crm.ui.assignDesk")}
          </button>
          <input
            value={bulkBroker}
            onChange={(e) => setBulkBroker(e.target.value)}
            placeholder={i18n("crm.ui.assignBroker")}
            className="w-28 rounded border border-[#111111] bg-white px-2 py-1 text-sm text-[#111111]"
          />
          <button
            disabled={busy}
            onClick={() => bulk("assignBroker", { brokerName: bulkBroker })}
            className="rounded bg-[#e5e5e5] px-2 py-1 hover:bg-[#f0f0f0]"
          >
            {i18n("crm.ui.assignBroker")}
          </button>
          <select
            disabled={busy}
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) void bulk("invalidReason", { reason: v === "__VALID" ? "" : v });
            }}
            className="rounded border border-red-700 bg-white px-2 py-1 text-sm text-red-800"
          >
            <option value="">⛔ Invalid / Невалид…</option>
            <option value="__VALID">✓ Valid / Валид</option>
            {SALE_STATUSES.filter((x) => x.startsWith("INV_")).map((x) => (
              <option key={x} value={x}>{code("crm.sale", x)}</option>
            ))}
          </select>
          {canManageUsers && (
            <button
              disabled={busy}
              onClick={() => {
                const n = selected.size;
                const ok = window.confirm(
                  i18n("crm.ui.bulkDeleteConfirm").replace("{count}", String(n))
                );
                if (ok) void bulk("delete");
              }}
              className="rounded bg-red-700 px-2 py-1 font-semibold text-white hover:bg-red-600"
            >
              {i18n("crm.ui.bulkDelete")}
            </button>
          )}
            </>
          )}
          {crmReadOnly && (
            <span className="text-[10px] text-amber-700">{i18n("crm.ui.readOnly")}</span>
          )}
        </div>
      )}

      {msg && <p className="mb-3 text-xs text-emerald-400">{msg}</p>}
      {listPhase === "error" && (
        <CrmNotice
          title={i18n("crm.ui.loadFailed")}
          body={i18n("crm.ui.loadFailedBody", "Check your connection and try again.")}
          action={i18n("crm.ui.tryAgain")}
          onAction={() => {
            setListPhase("loading");
            void load();
          }}
        />
      )}

      {listPhase === "loading" && rows.length === 0 && (
        <div className="mb-3 space-y-2 rounded-xl border border-[#e5e5e5] p-3" data-fx-traders-skeleton="" aria-busy="true">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} light className="h-8 w-full" />
          ))}
        </div>
      )}
      <div className={`overflow-x-auto rounded-xl border border-[#e5e5e5] ${listPhase === "loading" && rows.length === 0 ? "hidden" : ""}`}>
        <table className="fx-crm-table w-full text-left text-xs">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              <th className="px-2 py-2.5">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selected.size === rows.length}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-3 py-2.5" aria-sort={ariaSort(sort, "name")}>
                <button
                  type="button"
                  onClick={() => setSort(nextTraderSort(sort, "name"))}
                  className="font-medium hover:text-neutral-900"
                  data-fx-sort-col="name"
                >
                  {i18n("crm.ui.memberId")}
                  {sortMark(sort, "name")}
                </button>
              </th>
              <th className="px-3 py-2.5">{i18n("crm.presence.status")}</th>
              <th className="px-3 py-2.5">{i18n("crm.ui.phone")}</th>
              <th className="px-3 py-2.5">{i18n("crm.ui.desk")}</th>
              <th className="px-3 py-2.5">{i18n("crm.ui.country")}</th>
              <th className="px-3 py-2.5" aria-sort={ariaSort(sort, "sale")}>
                <button
                  type="button"
                  onClick={() => setSort(nextTraderSort(sort, "sale"))}
                  className="font-medium hover:text-neutral-900"
                  data-fx-sort-col="sale"
                >
                  {i18n("crm.ui.saleRet")}
                  {sortMark(sort, "sale")}
                </button>
              </th>
              <th className="px-3 py-2.5" aria-sort={ariaSort(sort, "balance")}>
                <button
                  type="button"
                  onClick={() => setSort(nextTraderSort(sort, "balance"))}
                  className="font-medium hover:text-neutral-900"
                  data-fx-sort-col="balance"
                >
                  {i18n("crm.ui.balance")}
                  {sortMark(sort, "balance")}
                </button>
              </th>
              <th className="px-3 py-2.5">{i18n("crm.ui.account")}</th>
              <th className="px-3 py-2.5">{i18n("crm.presence.accountStatus")}</th>
              <th className="px-3 py-2.5">{i18n("crm.ui.broker")}</th>
              <th className="px-3 py-2.5" aria-sort={ariaSort(sort, "login")}>
                <button
                  type="button"
                  onClick={() => setSort(nextTraderSort(sort, "login"))}
                  className="font-medium hover:text-neutral-900"
                  data-fx-sort-col="login"
                >
                  {i18n("crm.ui.lastLogin")}
                  {sortMark(sort, "login")}
                </button>
              </th>
              <th className="px-3 py-2.5" aria-sort={ariaSort(sort, "lastContact")}>
                <button
                  type="button"
                  onClick={() => setSort(nextTraderSort(sort, "lastContact"))}
                  className="font-medium hover:text-neutral-900"
                  title={i18n("crm.ui.sort")}
                  data-fx-sort-last-contact
                  data-fx-sort-col="lastContact"
                >
                  {i18n("crm.ui.lastContact")}
                  {sortMark(sort, "lastContact")}
                </button>
              </th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr
                key={u.id}
                tabIndex={0}
                data-fx-list-row=""
                onKeyDown={onRowKey(`/izcrm/traders/${u.id}`)}
                className={`border-t border-[#e5e5e5] hover:bg-[#ffffff]/60 ${CRM_ROW_FOCUS}`}
              >
                <td className="px-2 py-2.5">
                  <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} />
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-mono text-[9px] text-neutral-400">{u.id.slice(0, 8)}…</div>
                  <div className="font-normal">{u.name}</div>
                  <div className="text-neutral-500">{u.email}</div>
                  {u.accountLoginId && (
                    <div className="font-mono text-[10px] tracking-wide text-sky-600">
                      {i18n("crm.ui.accountId")}: {u.accountLoginId}
                      <CopyButton value={u.accountLoginId} title={i18n("crm.ui.copyAccountId")} className="ml-1" />
                    </div>
                  )}
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    <span
                      className={`rounded px-1 py-0.5 text-[9px] font-semibold ${
                        u.role === "ADMIN" ? "bg-amber-500/20 text-amber-700" : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {code("crm.role", u.role)}
                    </span>
                    <span className="rounded bg-neutral-100 px-1 py-0.5 text-[9px] text-neutral-500">
                      {code("crm.accountType", u.accountType)}
                    </span>
                    {u.ftd && (
                      <span className="rounded bg-emerald-500/20 px-1 py-0.5 text-[9px] text-emerald-300">
                        FTD
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <PresenceCell lastSeenAt={u.lastSeenAt ?? null} now={now} />
                  {(u.lastCountry || u.lastCity) && (
                    <div className="mt-0.5 max-w-[160px] truncate text-[10px] text-neutral-500">
                      <LocationLabel
                        country={u.lastCountry}
                        countryName={u.lastCountryName}
                        city={u.lastCity}
                      />
                    </div>
                  )}
                  {u.lastIp && <div className="font-mono text-[9px] text-neutral-400">{u.lastIp}</div>}
                </td>
                <td className="px-3 py-2.5 text-neutral-500">{u.phone || "—"}</td>
                <td className="px-3 py-2.5 text-neutral-600">{u.desk ? deskName(u.desk) : "—"}</td>
                <td className="px-3 py-2.5">{u.country || "—"}</td>
                <td className="px-3 py-2.5">
                  <div>{code("crm.sale", u.saleStatus)}</div>
                  <div className="text-neutral-500">{code("crm.retention", u.retentionStatus)}</div>
                  {u.retentionFollowUpAt ? (() => {
                    const t = new Date(u.retentionFollowUpAt).getTime();
                    if (!Number.isFinite(t)) return null;
                    const end = new Date(now);
                    end.setHours(24, 0, 0, 0);
                    const tone =
                      t < now
                        ? "bg-red-500/15 text-red-700"
                        : t < end.getTime()
                          ? "bg-amber-500/15 text-amber-800"
                          : "bg-neutral-500/10 text-neutral-500";
                    return (
                      <div
                        className={`mt-0.5 w-fit rounded px-1.5 py-0.5 text-[9px] tabular-nums ${tone}`}
                        title={i18n("crm.ret.followUp")}
                        data-fx-followup-badge
                      >
                        ⏰ {fmtCrmDate(u.retentionFollowUpAt)}
                        {t < now ? ` · ${i18n("crm.fu.late")}` : ""}
                      </div>
                    );
                  })() : null}
                  {(() => {
                    const note = (u.retentionNote || "").replace(/\s+/g, " ").trim();
                    if (!note) return null;
                    const short = note.length > 90 ? `${note.slice(0, 90).trimEnd()}…` : note;
                    return (
                      <div
                        className="mt-0.5 max-w-[220px] truncate text-[9px] italic text-neutral-400"
                        title={u.retentionNote || ""}
                        data-fx-retention-note-preview
                      >
                        📝 {short}
                      </div>
                    );
                  })()}
                </td>
                <td className="fx-crm-num px-3 py-2.5">
                  <div>
                    {displayCrmMoney(u.balance, u.currency || "USD")}
                  </div>
                  <div className="text-[9px] text-neutral-500">
                    {i18n("crm.ui.equity")} {displayCrmMoney(u.equity, u.currency || "USD")}
                  </div>
                </td>
                <td className="px-3 py-2.5 font-mono text-[9px] text-neutral-500">
                  {(u as { tradingAccountId?: string }).tradingAccountId?.slice(0, 10) || "—"}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span
                      className={`w-fit rounded px-1.5 py-0.5 text-[10px] ${
                        u.active ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {u.active ? i18n("crm.ui.active") : i18n("crm.ui.frozen")}
                    </span>
                    {u.tradingEnabled === false && (
                      <span className="w-fit rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-700">
                        {i18n("crm.perms.badgeTradeOff")}
                      </span>
                    )}
                    {u.withdrawalsEnabled === false && (
                      <span className="w-fit rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-700">
                        {i18n("crm.perms.badgeWithdrawOff")}
                      </span>
                    )}
                    {u.loginEnabled === false && (
                      <span className="w-fit rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-700">
                        {i18n("crm.perms.badgeLoginOff")}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-neutral-500">
                  {u.brokerName || "—"}
                  {u.assigneeName ? (
                    <div className="text-[9px] text-neutral-400" title={i18n("crm.ui.assignee")}>
                      {i18n("crm.ui.assignee")}: {u.assigneeName}
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 text-[10px] text-neutral-500">
                  {u.lastLoginAt ? fmtCrmDate(u.lastLoginAt) : "—"}
                </td>
                <td className="px-3 py-2.5 text-[10px] text-neutral-500" data-fx-last-contact>
                  {u.lastContactAt ? fmtCrmDate(u.lastContactAt) : "—"}
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/izcrm/traders/${u.id}`}
                    className="rounded bg-black text-white/80 px-2 py-1 hover:bg-neutral-800"
                  >
                    {i18n("crm.ui.detail")}
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={13} className="px-3 py-10 text-center text-neutral-500">
                  {i18n("crm.ui.noRecords")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs" data-fx-trader-pager="">
        <span className="tabular-nums text-neutral-500">
          {i18n("crm.traders.pageStatus").replace("{page}", String(page))}
          {total != null ? ` · ${total}` : ""}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-neutral-500">
            <span>{i18n("crm.list.pageSize")}</span>
            <select
              value={take}
              aria-label={i18n("crm.list.pageSize")}
              data-fx-list-take=""
              onChange={(e) => {
                setTake(Number(e.target.value));
                setPage(1);
              }}
              className="min-h-10 rounded-full border border-[#e5e5e5] bg-white px-2 font-medium text-neutral-800"
            >
              {TRADER_TAKES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((n) => Math.max(1, n - 1))}
            className="min-h-10 rounded-full border border-[#e5e5e5] px-3 font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
            data-fx-trader-prev=""
          >
            {i18n("crm.traders.prev")}
          </button>
          <button
            type="button"
            disabled={!hasMore}
            onClick={() => setPage((n) => n + 1)}
            className="min-h-10 rounded-full border border-[#e5e5e5] px-3 font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
            data-fx-trader-next=""
          >
            {i18n("crm.traders.next")}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={createMember}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-4"
          >
            <h2 className="mb-3 text-sm font-semibold">{i18n("crm.ui.createMember")}</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(
                [
                  ["email", i18n("crm.ui.emailStar"), "email"],
                  ["password", i18n("crm.ui.passwordStar"), "password"],
                  ["firstName", i18n("crm.ui.firstName"), "text"],
                  ["lastName", i18n("crm.ui.lastName"), "text"],
                  ["phone", i18n("crm.ui.phone"), "text"],
                  ["country", i18n("crm.ui.country"), "text"],
                  ["desk", i18n("crm.ui.desk"), "text"],
                  ["brokerName", i18n("crm.ui.broker"), "text"],
                  ["accountType", i18n("crm.ui.accountType"), "text"],
                  ["balance", i18n("crm.ui.startingBalance"), "number"],
                ] as const
              ).map(([key, label, type]) => (
                <label key={key} className="flex flex-col gap-1">
                  <span className="text-neutral-500">{label}</span>
                  <input
                    type={type}
                    required={key === "email" || key === "password"}
                    value={createForm[key]}
                    onChange={(e) => setCreateForm({ ...createForm, [key]: e.target.value })}
                    className="rounded border border-[#111111] bg-white px-2 py-1.5 text-sm text-[#111111]"
                  />
                </label>
              ))}
              <label className="flex flex-col gap-1">
                <span className="text-neutral-500">{i18n("crm.ui.currency")}</span>
                <select
                  value={createForm.currency}
                  onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
                  className="rounded border border-[#111111] bg-white px-2 py-1.5 text-sm text-[#111111]"
                >
                  {ACCOUNT_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={busy} className="rounded bg-black text-white px-3 py-1.5 text-sm">
                {i18n("crm.ui.create")}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded bg-[#e5e5e5] px-3 py-1.5 text-sm"
              >
                {i18n("crm.ui.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
