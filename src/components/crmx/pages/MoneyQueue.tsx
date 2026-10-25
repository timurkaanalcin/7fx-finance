"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { activeFilterCount, filterRows, queryString } from "@/lib/crmx/filters";
import { formatMoney, formatWhen } from "@/lib/crmx/format";
import { useI18n } from "@/lib/i18n/context";
import { crmxGet } from "../api";
import { ApproveBar, ClassicLink, DataTable, EmptyState, ErrorNote, FactList, FilterDrawer, PageHead, StatusPill } from "../ui";

type User = { id: string; name?: string; email?: string; accountLoginId?: string | null };
type Row = {
  id: string;
  amount?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
  reviewedAt?: string | null;
  note?: string | null;
  adminNote?: string | null;
  method?: { label?: string } | string | null;
  user?: User;
};

function methodLabel(method: Row["method"]): string {
  if (!method) return "—";
  if (typeof method === "string") return method;
  return method.label || "—";
}

export default function MoneyQueue({ kind }: { kind: "deposit" | "withdrawal" }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname() || (kind === "deposit" ? "/crmx/deposits" : "/crmx/withdrawals");
  const sp = useSearchParams();
  const q = sp.get("q") || "";
  const status = sp.get("status") || "";
  const selectedId = sp.get("id") || "";
  const [rows, setRows] = useState<Row[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [draft, setDraft] = useState({ q, status });
  const [tick, setTick] = useState(0);

  const endpoint = kind === "deposit" ? "/api/admin/deposits" : "/api/admin/withdrawals";
  const title = kind === "deposit" ? t("crmx.nav.deposits") : t("crmx.nav.withdrawals");
  const classic = kind === "deposit" ? "/izcrm/deposits" : "/izcrm/withdrawals";

  const load = useCallback(async (nextSkip: number, append: boolean) => {
    setLoading(true);
    try {
      const data = await crmxGet<{ requests?: Row[]; hasMore?: boolean; nextSkip?: number }>(
        `${endpoint}${queryString({ take: 50, skip: nextSkip, q, status })}`
      );
      const page = filterRows(data.requests || [], q, (row) => [
        row.user?.name,
        row.user?.email,
        row.user?.accountLoginId,
        row.status,
        row.note,
        methodLabel(row.method),
      ]);
      setRows((prev) => (append ? prev.concat(page) : page));
      setHasMore(Boolean(data.hasMore));
      setSkip(data.nextSkip || nextSkip + page.length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("crmx.error"));
    } finally {
      setLoading(false);
    }
  }, [endpoint, q, status, t]);

  useEffect(() => {
    void load(0, false);
  }, [load, tick]);

  function pushParams(next: URLSearchParams) {
    const suffix = next.toString();
    router.push(suffix ? `${pathname}?${suffix}` : pathname);
  }

  function select(row: Row) {
    const next = new URLSearchParams(sp.toString());
    next.set("id", row.id);
    pushParams(next);
  }

  const selected = rows.find((row) => row.id === selectedId) || null;
  const count = activeFilterCount({ q, status }, ["q"]);

  return (
    <section>
      <PageHead title={title}>
        <button type="button" className="crmx-btn" onClick={() => { setDraft({ q, status }); setDrawer(true); }}>
          {t("crmx.filters")} {count ? <span className="crmx-badge">{count}</span> : null}
        </button>
        <ClassicLink href={classic} />
      </PageHead>
      {error ? <ErrorNote message={error} onRetry={() => void load(0, false)} /> : null}
      <div className={`crmx-split${selectedId ? " is-detail" : ""}`}>
        <div className="crmx-list">
          {rows.length === 0 && !loading ? <EmptyState /> : null}
          {rows.length > 0 ? (
            <DataTable
              label={title}
              rows={rows}
              rowKey={(row) => row.id}
              selectedKey={selectedId}
              onRow={select}
              cols={[
                { key: "who", header: t("crm.ui.trader"), render: (row) => row.user?.id ? <Link href={`/crmx/traders/${row.user.id}`}>{row.user.name || row.user.email}</Link> : "—" },
                { key: "amount", header: t("crm.ui.amount"), render: (row) => formatMoney(row.amount, row.currency, locale) },
                { key: "method", header: t("crm.ui.method"), render: (row) => methodLabel(row.method) },
                { key: "status", header: t("crm.ui.status"), render: (row) => <StatusPill status={row.status} /> },
                { key: "when", header: t("crm.ui.date"), render: (row) => formatWhen(row.createdAt, locale) },
              ]}
            />
          ) : null}
          {hasMore ? (
            <div className="crmx-pager">
              <button type="button" className="crmx-btn" onClick={() => void load(skip, true)}>{t("crm.ui.loadMore")}</button>
            </div>
          ) : null}
        </div>
        <aside className="crmx-detail" aria-label={t("crm.ui.detail")}>
          {selectedId ? (
            <button type="button" className="crmx-btn" onClick={() => { const next = new URLSearchParams(sp.toString()); next.delete("id"); pushParams(next); }}>{t("crmx.back")}</button>
          ) : null}
          {!selected ? <EmptyState label={t("crmx.detail.pick")} /> : (
            <>
              <h2 className="crmx-h1" style={{ fontSize: 18 }}>{formatMoney(selected.amount, selected.currency, locale)}</h2>
              <FactList
                items={[
                  { label: t("crm.ui.trader"), value: selected.user?.name || "—" },
                  { label: t("crm.ui.user"), value: selected.user?.email || "—" },
                  { label: t("crm.ui.account"), value: selected.user?.accountLoginId || "—" },
                  { label: t("crm.ui.method"), value: methodLabel(selected.method) },
                  { label: t("crm.ui.status"), value: <StatusPill status={selected.status} /> },
                  { label: t("crm.ui.date"), value: formatWhen(selected.createdAt, locale) },
                  { label: t("crm.ui.note"), value: selected.note || "—" },
                  { label: t("crmx.reason"), value: selected.adminNote || "—" },
                ]}
              />
              <ApproveBar id={selected.id} endpoint={endpoint} status={selected.status || ""} onDone={() => setTick((n) => n + 1)} />
            </>
          )}
        </aside>
      </div>
      <FilterDrawer
        open={drawer}
        title={t("crmx.filters")}
        onClose={() => setDrawer(false)}
        onClear={() => { setDraft({ q: "", status: "" }); router.push(pathname); setDrawer(false); }}
        onApply={() => {
          const next = new URLSearchParams();
          if (draft.q.trim()) next.set("q", draft.q.trim());
          if (draft.status) next.set("status", draft.status);
          pushParams(next);
          setDrawer(false);
        }}
      >
        <label>
          {t("crm.ui.search")}
          <input value={draft.q} onChange={(event) => setDraft({ ...draft, q: event.target.value })} />
        </label>
        <label>
          {t("crm.ui.status")}
          <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
            <option value="">{t("crm.ui.allStatuses")}</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </label>
      </FilterDrawer>
    </section>
  );
}
