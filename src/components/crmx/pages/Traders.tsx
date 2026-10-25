"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { activeFilterCount, filterRows, queryString, uniqueSorted } from "@/lib/crmx/filters";
import { formatMoney, formatWhen } from "@/lib/crmx/format";
import { useI18n } from "@/lib/i18n/context";
import { crmxGet } from "../api";
import { ClassicLink, DataTable, EmptyState, ErrorNote, FactList, FilterDrawer, PageHead, StatusPill } from "../ui";

type Trader = {
  id: string;
  name?: string;
  email?: string;
  phone?: string | null;
  country?: string | null;
  desk?: string | null;
  saleStatus?: string | null;
  accountLoginId?: string | null;
  active?: boolean;
  balance?: number;
  equity?: number;
  currency?: string;
  lastLoginAt?: string | null;
  assigneeName?: string | null;
  ftd?: boolean;
};

type Note = { id: string; body?: string; authorName?: string | null; createdAt?: string };

export default function Traders({ selectedId }: { selectedId?: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const q = sp.get("q") || "";
  const status = sp.get("status") || "";
  const desk = sp.get("desk") || "";
  const [rows, setRows] = useState<Trader[]>([]);
  const [desks, setDesks] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [draft, setDraft] = useState({ q, status, desk });
  const [detail, setDetail] = useState<Trader | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  const load = useCallback(async (nextSkip: number, append: boolean) => {
    setLoading(true);
    try {
      const data = await crmxGet<{ users?: Trader[]; hasMore?: boolean; nextSkip?: number; desks?: string[] }>(
        `/api/admin/users${queryString({
          view: "table",
          take: 50,
          skip: nextSkip,
          meta: nextSkip === 0 ? 1 : 0,
          role: "TRADER",
          q,
          status,
          desk,
        })}`
      );
      const page = filterRows(data.users || [], q, (row) => [row.name, row.email, row.phone, row.accountLoginId, row.country, row.desk]);
      setRows((prev) => (append ? prev.concat(page) : page));
      setHasMore(Boolean(data.hasMore));
      setSkip(data.nextSkip || nextSkip + page.length);
      if (data.desks) setDesks(uniqueSorted(data.desks));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("crmx.error"));
    } finally {
      setLoading(false);
    }
  }, [q, status, desk, t]);

  useEffect(() => {
    void load(0, false);
  }, [load]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setNotes([]);
      return;
    }
    let live = true;
    void crmxGet<{ user?: Trader; notes?: Note[] }>(`/api/admin/users/${encodeURIComponent(selectedId)}?view=profile`)
      .then((data) => {
        if (!live) return;
        setDetail(data.user || null);
        setNotes(data.notes || []);
      })
      .catch((err) => {
        if (live) setError(err instanceof Error ? err.message : t("crmx.error"));
      });
    return () => {
      live = false;
    };
  }, [selectedId, t]);

  function openTrader(row: Trader) {
    const next = new URLSearchParams(sp.toString());
    const suffix = next.toString();
    router.push(suffix ? `/crmx/traders/${row.id}?${suffix}` : `/crmx/traders/${row.id}`);
  }

  const count = activeFilterCount({ q, status, desk }, ["q"]);

  return (
    <section>
      <PageHead title={t("crm.nav.traders")} lead={t("crmx.dash.lead")}>
        <button type="button" className="crmx-btn" onClick={() => { setDraft({ q, status, desk }); setDrawer(true); }}>
          {t("crmx.filters")} {count ? <span className="crmx-badge">{count}</span> : null}
        </button>
        <ClassicLink href={selectedId ? `/izcrm/traders/${selectedId}` : "/izcrm/traders"} />
      </PageHead>
      {error ? <ErrorNote message={error} onRetry={() => void load(0, false)} /> : null}
      <div className={`crmx-split${selectedId ? " is-detail" : ""}`}>
        <div className="crmx-list">
          {rows.length === 0 && !loading ? <EmptyState /> : null}
          {rows.length > 0 ? (
            <DataTable
              label={t("crm.nav.traders")}
              rows={rows}
              rowKey={(row) => row.id}
              selectedKey={selectedId}
              onRow={openTrader}
              cols={[
                { key: "name", header: t("crm.ui.name"), render: (row) => <Link href={`/crmx/traders/${row.id}`}>{row.name || "—"}</Link> },
                { key: "email", header: t("crm.ui.user"), render: (row) => row.email || "—" },
                { key: "login", header: t("crm.ui.account"), render: (row) => row.accountLoginId || "—" },
                { key: "balance", header: t("crm.ui.balance"), render: (row) => formatMoney(row.balance, row.currency, locale) },
                { key: "status", header: t("crm.ui.status"), render: (row) => <StatusPill status={row.active === false ? "FROZEN" : "ACTIVE"} /> },
              ]}
            />
          ) : null}
          {hasMore ? (
            <div className="crmx-pager">
              <button type="button" className="crmx-btn" onClick={() => void load(skip, true)}>{t("crm.ui.loadMore")}</button>
            </div>
          ) : null}
        </div>
        <aside className="crmx-detail" aria-label={t("crmx.profile")}>
          {selectedId ? (
            <button type="button" className="crmx-btn" onClick={() => router.push("/crmx/traders")}>{t("crmx.back")}</button>
          ) : null}
          {!detail ? <EmptyState label={t("crmx.detail.pick")} /> : (
            <>
              <h2 className="crmx-h1" style={{ fontSize: 18 }}>{detail.name || "—"}</h2>
              <p className="crmx-lead">{detail.email}</p>
              <FactList
                items={[
                  { label: t("crm.ui.account"), value: detail.accountLoginId || "—" },
                  { label: t("crm.ui.phone"), value: detail.phone || "—" },
                  { label: t("crm.ui.country"), value: detail.country || "—" },
                  { label: t("crm.ui.desk"), value: detail.desk || "—" },
                  { label: t("crm.ui.balance"), value: formatMoney(detail.balance, detail.currency, locale) },
                  { label: t("crm.ui.equity"), value: formatMoney(detail.equity, detail.currency, locale) },
                  { label: t("crm.ui.assignee"), value: detail.assigneeName || "—" },
                  { label: t("crm.ui.status"), value: detail.saleStatus || (detail.active === false ? "FROZEN" : "ACTIVE") },
                  { label: t("crm.ui.lastLogin"), value: formatWhen(detail.lastLoginAt, locale) },
                  { label: t("crm.ui.ftd"), value: detail.ftd ? t("crm.ui.yes") : t("crm.ui.no") },
                ]}
              />
              <h3 style={{ fontSize: 13, fontWeight: 500 }}>{t("crmx.notes")}</h3>
              {notes.length === 0 ? <p className="crmx-muted">{t("crm.ui.noComments")}</p> : notes.slice(0, 6).map((note) => (
                <div key={note.id} className="crmx-note">
                  <div>{note.body}</div>
                  <div className="crmx-muted">{note.authorName || ""} · {formatWhen(note.createdAt, locale)}</div>
                </div>
              ))}
              <div className="crmx-actions">
                <Link className="crmx-btn" href={`/crmx/positions?userId=${encodeURIComponent(detail.id)}`}>{t("crm.nav.positions")}</Link>
                <Link className="crmx-btn" href={`/crmx/transactions?userId=${encodeURIComponent(detail.id)}`}>{t("crm.nav.transactions")}</Link>
              </div>
            </>
          )}
        </aside>
      </div>
      <FilterDrawer
        open={drawer}
        title={t("crmx.filters")}
        onClose={() => setDrawer(false)}
        onClear={() => {
          setDraft({ q: "", status: "", desk: "" });
          router.push("/crmx/traders");
          setDrawer(false);
        }}
        onApply={() => {
          const next = new URLSearchParams();
          if (draft.q.trim()) next.set("q", draft.q.trim());
          if (draft.status) next.set("status", draft.status);
          if (draft.desk) next.set("desk", draft.desk);
          const suffix = next.toString();
          router.push(suffix ? `/crmx/traders?${suffix}` : "/crmx/traders");
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
            <option value="active">{t("crm.ui.active")}</option>
            <option value="frozen">{t("crm.ui.frozen")}</option>
          </select>
        </label>
        <label>
          {t("crm.ui.desk")}
          <select value={draft.desk} onChange={(event) => setDraft({ ...draft, desk: event.target.value })}>
            <option value="">{t("crm.ui.allDesks")}</option>
            {desks.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
      </FilterDrawer>
    </section>
  );
}
