"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { activeFilterCount, filterRows, queryString, uniqueSorted } from "@/lib/crmx/filters";
import { formatMoney, formatWhen } from "@/lib/crmx/format";
import { useI18n } from "@/lib/i18n/context";
import { crmxGet } from "../api";
import { ClassicLink, DataTable, EmptyState, ErrorNote, FactList, FilterDrawer, PageHead, StatusPill } from "../ui";

type Tx = {
  id: string;
  amount?: number;
  type?: string;
  currency?: string;
  trader?: string;
  traderId?: string;
  traderEmail?: string;
  accountLoginId?: string | null;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  comment?: string | null;
  createdByName?: string | null;
  createdAt?: string;
};

export default function Transactions() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const q = sp.get("q") || "";
  const type = sp.get("type") || "";
  const from = sp.get("from") || "";
  const to = sp.get("to") || "";
  const userId = sp.get("userId") || "";
  const selectedId = sp.get("id") || "";
  const [rows, setRows] = useState<Tx[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [draft, setDraft] = useState({ q, type, from, to });

  const load = useCallback(async (nextSkip: number, append: boolean) => {
    setLoading(true);
    try {
      const data = await crmxGet<{ transactions?: Tx[]; hasMore?: boolean; nextSkip?: number }>(
        `/api/admin/transactions${queryString({ take: 50, skip: nextSkip, q, type, from, to, userId })}`
      );
      const page = filterRows(data.transactions || [], q, (row) => [row.trader, row.traderEmail, row.accountLoginId, row.type, row.comment]);
      setRows((prev) => {
        const next = append ? prev.concat(page) : page;
        setTypes(uniqueSorted(next.map((row) => row.type || "")));
        return next;
      });
      setHasMore(Boolean(data.hasMore));
      setSkip(data.nextSkip || nextSkip + page.length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("crmx.error"));
    } finally {
      setLoading(false);
    }
  }, [q, type, from, to, userId, t]);

  useEffect(() => {
    void load(0, false);
  }, [load]);

  function pushParams(next: URLSearchParams) {
    if (userId) next.set("userId", userId);
    const suffix = next.toString();
    router.push(suffix ? `/crmx/transactions?${suffix}` : "/crmx/transactions");
  }

  const selected = rows.find((row) => row.id === selectedId) || null;
  const count = activeFilterCount({ q, type, from, to }, ["q"]);

  return (
    <section>
      <PageHead title={t("crm.nav.transactions")}>
        <button type="button" className="crmx-btn" onClick={() => { setDraft({ q, type, from, to }); setDrawer(true); }}>
          {t("crmx.filters")} {count ? <span className="crmx-badge">{count}</span> : null}
        </button>
        <ClassicLink href="/izcrm/transactions" />
      </PageHead>
      {error ? <ErrorNote message={error} onRetry={() => void load(0, false)} /> : null}
      <div className={`crmx-split${selectedId ? " is-detail" : ""}`}>
        <div className="crmx-list">
          {rows.length === 0 && !loading ? <EmptyState /> : null}
          {rows.length > 0 ? (
            <DataTable
              label={t("crm.nav.transactions")}
              rows={rows}
              rowKey={(row) => row.id}
              selectedKey={selectedId}
              onRow={(row) => {
                const next = new URLSearchParams(sp.toString());
                next.set("id", row.id);
                pushParams(next);
              }}
              cols={[
                { key: "who", header: t("crm.ui.trader"), render: (row) => row.traderId ? <Link href={`/crmx/traders/${row.traderId}`}>{row.trader || "—"}</Link> : (row.trader || "—") },
                { key: "type", header: t("crm.ui.type"), render: (row) => <StatusPill status={row.type} /> },
                { key: "amount", header: t("crm.ui.amount"), render: (row) => <span className={Number(row.amount) < 0 ? "crmx-sell" : "crmx-buy"}>{formatMoney(row.amount, row.currency, locale)}</span> },
                { key: "when", header: t("crm.ui.date"), render: (row) => formatWhen(row.createdAt, locale) },
              ]}
            />
          ) : null}
          {hasMore ? <div className="crmx-pager"><button type="button" className="crmx-btn" onClick={() => void load(skip, true)}>{t("crm.ui.loadMore")}</button></div> : null}
        </div>
        <aside className="crmx-detail" aria-label={t("crm.ui.detail")}>
          {selectedId ? <button type="button" className="crmx-btn" onClick={() => { const next = new URLSearchParams(sp.toString()); next.delete("id"); pushParams(next); }}>{t("crmx.back")}</button> : null}
          {!selected ? <EmptyState label={t("crmx.detail.pick")} /> : (
            <>
              <h2 className="crmx-h1" style={{ fontSize: 18 }}>{formatMoney(selected.amount, selected.currency, locale)}</h2>
              <FactList
                items={[
                  { label: t("crm.ui.trader"), value: selected.trader || "—" },
                  { label: t("crm.ui.user"), value: selected.traderEmail || "—" },
                  { label: t("crm.ui.account"), value: selected.accountLoginId || "—" },
                  { label: t("crm.ui.type"), value: selected.type || "—" },
                  { label: t("crm.ui.balance"), value: `${formatMoney(selected.balanceBefore, selected.currency, locale)} → ${formatMoney(selected.balanceAfter, selected.currency, locale)}` },
                  { label: t("crm.ui.worker"), value: selected.createdByName || "—" },
                  { label: t("crm.ui.date"), value: formatWhen(selected.createdAt, locale) },
                  { label: t("crm.ui.note"), value: selected.comment || "—" },
                ]}
              />
            </>
          )}
        </aside>
      </div>
      <FilterDrawer
        open={drawer}
        title={t("crmx.filters")}
        onClose={() => setDrawer(false)}
        onClear={() => { router.push(userId ? `/crmx/transactions?userId=${encodeURIComponent(userId)}` : "/crmx/transactions"); setDrawer(false); }}
        onApply={() => {
          const next = new URLSearchParams();
          if (draft.q.trim()) next.set("q", draft.q.trim());
          if (draft.type) next.set("type", draft.type);
          if (draft.from) next.set("from", draft.from);
          if (draft.to) next.set("to", draft.to);
          pushParams(next);
          setDrawer(false);
        }}
      >
        <label>{t("crm.ui.search")}<input value={draft.q} onChange={(event) => setDraft({ ...draft, q: event.target.value })} /></label>
        <label>
          {t("crm.ui.type")}
          <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>
            <option value="">{t("crm.ui.allTypes")}</option>
            {types.map((name) => <option key={name} value={name}>{name}</option>)}
            {type && types.indexOf(type) === -1 ? <option value={type}>{type}</option> : null}
          </select>
        </label>
        <label>{t("crmx.from")}<input type="date" value={draft.from} onChange={(event) => setDraft({ ...draft, from: event.target.value })} /></label>
        <label>{t("crmx.to")}<input type="date" value={draft.to} onChange={(event) => setDraft({ ...draft, to: event.target.value })} /></label>
      </FilterDrawer>
    </section>
  );
}
