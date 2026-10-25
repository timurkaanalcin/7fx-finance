"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { activeFilterCount, filterRows, queryString } from "@/lib/crmx/filters";
import { formatMoney, formatWhen } from "@/lib/crmx/format";
import { useI18n } from "@/lib/i18n/context";
import { crmxGet } from "../api";
import { ApproveBar, ClassicLink, DataTable, EmptyState, ErrorNote, FactList, FilterDrawer, PageHead, StatusPill } from "../ui";

type Ticket = {
  id: string;
  kind?: string;
  amount?: number | null;
  currency?: string;
  status?: string;
  method?: string;
  note?: string | null;
  adminNote?: string | null;
  customer?: string;
  customerId?: string;
  customerEmail?: string;
  accountLoginId?: string | null;
  country?: string | null;
  openedAt?: string;
  reason?: string | null;
  approvalReason?: string | null;
};

function approveEndpoint(kind: string | undefined): string | null {
  if (kind === "DEPOSIT") return "/api/admin/deposits";
  if (kind === "WITHDRAW") return "/api/admin/withdrawals";
  if (kind === "MARGIN") return "/api/admin/balance-requests";
  return null;
}

export default function Tickets() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const q = sp.get("q") || "";
  const status = sp.get("status") || "";
  const kind = sp.get("kind") || "";
  const from = sp.get("from") || "";
  const to = sp.get("to") || "";
  const selectedId = sp.get("id") || "";
  const [rows, setRows] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [draft, setDraft] = useState({ q, status, kind, from, to });
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await crmxGet<{ tickets?: Ticket[] }>(
        `/api/admin/tickets${queryString({ take: 50, q, status, kind: kind || "all", from, to })}`
      );
      setRows(filterRows(data.tickets || [], q, (row) => [row.customer, row.customerEmail, row.accountLoginId, row.kind, row.method, row.status]));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("crmx.error"));
    } finally {
      setLoading(false);
    }
  }, [q, status, kind, from, to, t]);

  useEffect(() => {
    void load();
  }, [load, tick]);

  function pushParams(next: URLSearchParams) {
    const suffix = next.toString();
    router.push(suffix ? `/crmx/tickets?${suffix}` : "/crmx/tickets");
  }

  const selected = rows.find((row) => row.id === selectedId) || null;
  const endpoint = approveEndpoint(selected?.kind);
  const count = activeFilterCount({ q, status, kind, from, to }, ["q"]);

  return (
    <section>
      <PageHead title={t("crm.nav.tickets")} lead={t("crmx.nav.balance")}>
        <button type="button" className="crmx-btn" onClick={() => { setDraft({ q, status, kind, from, to }); setDrawer(true); }}>
          {t("crmx.filters")} {count ? <span className="crmx-badge">{count}</span> : null}
        </button>
        <ClassicLink href="/izcrm/tickets" />
        <ClassicLink href="/izcrm/balance-requests" label={t("crmx.nav.balance")} />
      </PageHead>
      {error ? <ErrorNote message={error} onRetry={() => void load()} /> : null}
      <div className={`crmx-split${selectedId ? " is-detail" : ""}`}>
        <div className="crmx-list">
          {rows.length === 0 && !loading ? <EmptyState /> : null}
          {rows.length > 0 ? (
            <DataTable
              label={t("crm.nav.tickets")}
              rows={rows}
              rowKey={(row) => `${row.kind}-${row.id}`}
              selectedKey={selected ? `${selected.kind}-${selected.id}` : ""}
              onRow={(row) => {
                const next = new URLSearchParams(sp.toString());
                next.set("id", row.id);
                pushParams(next);
              }}
              cols={[
                { key: "who", header: t("crm.ui.trader"), render: (row) => row.customerId ? <Link href={`/crmx/traders/${row.customerId}`}>{row.customer || "—"}</Link> : (row.customer || "—") },
                { key: "kind", header: t("crmx.kind"), render: (row) => row.kind || "—" },
                { key: "amount", header: t("crm.ui.amount"), render: (row) => formatMoney(row.amount, row.currency, locale) },
                { key: "status", header: t("crm.ui.status"), render: (row) => <StatusPill status={row.status} /> },
                { key: "when", header: t("crm.ui.date"), render: (row) => formatWhen(row.openedAt, locale) },
              ]}
            />
          ) : null}
        </div>
        <aside className="crmx-detail" aria-label={t("crm.ui.detail")}>
          {selectedId ? (
            <button type="button" className="crmx-btn" onClick={() => { const next = new URLSearchParams(sp.toString()); next.delete("id"); pushParams(next); }}>{t("crmx.back")}</button>
          ) : null}
          {!selected ? <EmptyState label={t("crmx.detail.pick")} /> : (
            <>
              <h2 className="crmx-h1" style={{ fontSize: 18 }}>{selected.customer || "—"}</h2>
              <p className="crmx-lead">{selected.kind} · {formatMoney(selected.amount, selected.currency, locale)}</p>
              <FactList
                items={[
                  { label: t("crm.ui.user"), value: selected.customerEmail || "—" },
                  { label: t("crm.ui.account"), value: selected.accountLoginId || "—" },
                  { label: t("crm.ui.method"), value: selected.method || "—" },
                  { label: t("crm.ui.country"), value: selected.country || "—" },
                  { label: t("crm.ui.status"), value: <StatusPill status={selected.status} /> },
                  { label: t("crm.ui.date"), value: formatWhen(selected.openedAt, locale) },
                  { label: t("crm.ui.note"), value: selected.note || selected.reason || "—" },
                  { label: t("crmx.reason"), value: selected.approvalReason || selected.adminNote || "—" },
                ]}
              />
              {endpoint ? (
                <ApproveBar id={selected.id} endpoint={endpoint} status={selected.status || ""} onDone={() => setTick((n) => n + 1)} />
              ) : null}
            </>
          )}
        </aside>
      </div>
      <FilterDrawer
        open={drawer}
        title={t("crmx.filters")}
        onClose={() => setDrawer(false)}
        onClear={() => { router.push("/crmx/tickets"); setDrawer(false); }}
        onApply={() => {
          const next = new URLSearchParams();
          if (draft.q.trim()) next.set("q", draft.q.trim());
          if (draft.status) next.set("status", draft.status);
          if (draft.kind) next.set("kind", draft.kind);
          if (draft.from) next.set("from", draft.from);
          if (draft.to) next.set("to", draft.to);
          pushParams(next);
          setDrawer(false);
        }}
      >
        <label>{t("crm.ui.search")}<input value={draft.q} onChange={(event) => setDraft({ ...draft, q: event.target.value })} /></label>
        <label>
          {t("crmx.kind")}
          <select value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value })}>
            <option value="">{t("crm.ui.all")}</option>
            <option value="deposit">DEPOSIT</option>
            <option value="withdraw">WITHDRAW</option>
            <option value="margin">MARGIN</option>
          </select>
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
        <label>{t("crmx.from")}<input type="date" value={draft.from} onChange={(event) => setDraft({ ...draft, from: event.target.value })} /></label>
        <label>{t("crmx.to")}<input type="date" value={draft.to} onChange={(event) => setDraft({ ...draft, to: event.target.value })} /></label>
      </FilterDrawer>
    </section>
  );
}
