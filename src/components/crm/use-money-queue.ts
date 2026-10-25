"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCrmLabels } from "@/lib/i18n/crm-labels";
import { useVisiblePoll } from "@/lib/use-visible-poll";
import {
  moneyQueueCsv,
  MONEY_QUEUE_TAKES,
  moneyQueueRange,
  moneyQueueSearchString,
  moneyQueueSkip,
  parseMoneyQueueQuery,
  type MoneyQueueFilters,
  type QueueCsvRow,
} from "@/lib/crm-money-queue";

export type MoneyQueueRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  note: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string; accountLoginId?: string | null };
  method?: { label?: string; type?: string } | string | null;
};

type Options = { take: string; kind: "deposit" | "withdrawal" };

function toCsv(row: MoneyQueueRow, kind: Options["kind"]): QueueCsvRow {
  const method =
    kind === "deposit" && row.method && typeof row.method === "object"
      ? [row.method.type, row.method.label].filter(Boolean).join(" · ")
      : String(row.method || "");
  return {
    createdAt: row.createdAt,
    name: row.user?.name || "",
    email: row.user?.email || "",
    accountLoginId: row.user?.accountLoginId,
    method,
    amount: Number(row.amount),
    currency: row.currency || "",
    note: row.note,
    status: row.status,
  };
}

export function useMoneyQueue<T extends MoneyQueueRow>(path: string, opts: Options) {
  const { i18n } = useCrmLabels();
  const [rows, setRows] = useState<T[]>([]);
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const [take, setTakeState] = useState(() => Number(opts.take) || 50);
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [csvBusy, setCsvBusy] = useState(false);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [filtersReady, setFiltersReady] = useState(false);
  const [msg, setMsg] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const listGen = useRef(0);
  const appliedFilter = useRef("");
  const loadKey = useRef("");

  const filterSig = [qDebounced, status, sort, take].join("\u0001");
  const listQuery: MoneyQueueFilters = { q: qDebounced, status, sort, page, take };
  const queryString = moneyQueueSearchString(listQuery);
  const range = moneyQueueRange(page, rows.length, take);

  const load = useCallback(async () => {
    const sig = filterSig;
    let usePage = page;
    if (appliedFilter.current && appliedFilter.current !== sig) {
      usePage = 1;
      if (page !== 1) setPage(1);
    }
    appliedFilter.current = sig;
    const params = new URLSearchParams({ take: String(take), skip: String(moneyQueueSkip(usePage, take)) });
    if (status && status !== "ALL") params.set("status", status);
    if (qDebounced) params.set("q", qDebounced);
    if (sort) params.set("sort", sort);
    const requestKey = params.toString();
    const gen = ++listGen.current;
    const previousKey = loadKey.current;
    loadKey.current = requestKey;
    if (previousKey && previousKey !== requestKey) setRows([]);
    setLoading(true);
    try {
      const res = await fetch(`${path}?${params}`, { cache: "no-store" });
      if (gen !== listGen.current) return;
      if (!res.ok) {
        setFailed(true);
        return;
      }
      const data = await res.json();
      setRows((data.requests || []) as T[]);
      setHasMore(Boolean(data.hasMore));
      setTotal(typeof data.total === "number" ? data.total : null);
      setLoadedAt(new Date());
      setFailed(false);
    } catch {
      if (gen === listGen.current) setFailed(true);
    } finally {
      if (gen === listGen.current) setLoading(false);
    }
  }, [filterSig, page, path, take, status, qDebounced, sort]);

  useEffect(() => {
    const parsed = parseMoneyQueueQuery(window.location.search);
    setQ(parsed.q);
    setQDebounced(parsed.q);
    setStatus(parsed.status);
    setSort(parsed.sort);
    setPage(parsed.page);
    setTakeState(parsed.take);
    setFiltersReady(true);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setQDebounced(q), 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    if (!filtersReady) return;
    void load();
  }, [load, filtersReady]);

  useEffect(() => {
    if (!filtersReady) return;
    const urlPath = window.location.pathname;
    const url = queryString ? `${urlPath}?${queryString}` : urlPath;
    if (url !== `${urlPath}${window.location.search}`) window.history.replaceState(null, "", url);
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

  useVisiblePoll(load, 30_000, filtersReady && status === "PENDING" && page === 1);

  const exportCsv = useCallback(async () => {
    setCsvBusy(true);
    setMsg("");
    try {
      const all: T[] = [];
      let skip = 0;
      for (let i = 0; i < 40; i++) {
        const params = new URLSearchParams({ take: String(take), skip: String(skip) });
        if (status && status !== "ALL") params.set("status", status);
        if (qDebounced) params.set("q", qDebounced);
        if (sort) params.set("sort", sort);
        const res = await fetch(`${path}?${params}`, { cache: "no-store" });
        if (!res.ok) {
          setMsg(i18n("crm.ui.loadFailed"));
          return;
        }
        const data = await res.json();
        const incoming = (data.requests || []) as T[];
        all.push(...incoming);
        if (!data.hasMore) break;
        const next = typeof data.nextSkip === "number" ? data.nextSkip : skip + incoming.length;
        if (next <= skip) break;
        skip = next;
      }
      const csv = moneyQueueCsv(all.map((row) => toCsv(row, opts.kind)));
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = opts.kind === "deposit" ? "deposits.csv" : "withdrawals.csv";
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setCsvBusy(false);
    }
  }, [i18n, opts.kind, path, qDebounced, sort, status, take]);

  const setTake = useCallback((next: number) => {
    if (!(MONEY_QUEUE_TAKES as readonly number[]).includes(next)) return;
    setTakeState(next);
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setQ("");
    setQDebounced("");
    setStatus("PENDING");
    setSort("");
    setPage(1);
  }, []);

  return {
    rows,
    q,
    setQ,
    status,
    setStatus,
    sort,
    setSort,
    page,
    setPage,
    take,
    setTake,
    clearFilters,
    total,
    hasMore,
    loading,
    failed,
    csvBusy,
    loadedAt,
    msg,
    setMsg,
    searchRef,
    range,
    load,
    patchRow: (id: string, patch: { status?: string }) => {
      setRows((list) => list.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    },
    exportCsv,
  };
}
