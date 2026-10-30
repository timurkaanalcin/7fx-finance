"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import CrmI18n from "@/components/i18n/CrmI18n";
import { useI18n } from "@/lib/i18n/context";
import { crmv2Text, type CrmV2CopyKey } from "@/lib/crmv2/copy";
import { approvalBody, approvalEndpoint, ledgerBody } from "@/lib/crmv2/payload";
import { CRM_V2_SECTIONS, crmv2Href, type CrmV2SectionId } from "@/lib/crmv2/sections";
import BrandLogo from "@/components/landing/BrandLogo";

type Props = { base: string; section: string[]; name: string };

export default function CrmV2App(props: Props) {
  return (
    <CrmI18n>
      <Shell {...props} />
    </CrmI18n>
  );
}

function Shell({ base, section, name }: Props) {
  const { locale } = useI18n();
  const tx = useCallback((key: CrmV2CopyKey) => crmv2Text(locale, key), [locale]);
  const view = (section[0] || "overview") as CrmV2SectionId | string;
  const id = section[1] || "";
  const [more, setMore] = useState(false);
  const params = useSearchParams();
  const q = params.get("q") || "";

  const mainTabs: CrmV2SectionId[] = ["overview", "customers", "finance", "support"];
  const moreTabs: CrmV2SectionId[] = ["positions", "marketing", "settings", "logs"];

  return (
    <div data-crmv2-root="" data-crmv2-view={id ? `${view}/${id}` : view} className="min-h-screen bg-black font-normal text-neutral-200">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-white/10 bg-neutral-950 md:flex">
          <div className="flex items-center gap-2 px-4 py-5">
            <BrandLogo tone="paper" height={32} className="h-8 w-8" />
            <span className="text-sm font-normal tracking-tight text-white">CRM</span>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-2">
            {CRM_V2_SECTIONS.map((item) => (
              <Link
                key={item.id}
                href={crmv2Href(base, item.path)}
                data-nav={item.id}
                className={`rounded px-3 py-2 text-sm ${view === item.id || (item.id === "customers" && view === "customers") ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white"}`}
              >
                {tx(item.id)}
              </Link>
            ))}
          </nav>
          <form method="post" action="/api/auth/logout" className="m-3">
            <input type="hidden" name="nav" value="1" />
            <button type="submit" className="w-full rounded px-3 py-2 text-left text-sm text-red-300 hover:bg-white/5">
              {tx("signOut")}
            </button>
          </form>
          <p className="px-4 pb-4 text-xs text-neutral-500">
            {tx("session")}
            <span className="mt-1 block text-neutral-300">{name}</span>
          </p>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
          <header className="flex h-14 items-center gap-3 border-b border-white/10 px-4">
            <BrandLogo tone="paper" height={28} className="h-7 w-7 shrink-0 md:hidden" />
            <h1 className="hidden text-base font-normal text-white sm:block">{tx("panel")}</h1>
            <form action={crmv2Href(base, "customers")} className="relative min-w-0 flex-1 md:max-w-sm">
              <input
                name="q"
                defaultValue={q}
                placeholder={tx("search")}
                aria-label={tx("search")}
                className="w-full rounded-full border border-white/10 bg-white/5 py-1.5 pl-3 pr-3 text-sm font-normal text-white outline-none placeholder:text-neutral-500 focus:border-white/30"
              />
            </form>
            <LanguageSwitcher compact tone="crm" />
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {view === "overview" && <Overview base={base} tx={tx} locale={locale} />}
            {view === "customers" && !id && <Customers base={base} tx={tx} locale={locale} q={q} />}
            {view === "customers" && id && <CustomerDetail base={base} id={id} tx={tx} locale={locale} />}
            {view === "finance" && <Finance tx={tx} locale={locale} q={q} />}
            {view === "positions" && <Positions tx={tx} locale={locale} q={q} />}
            {view === "support" && <Support tx={tx} locale={locale} q={q} />}
            {view === "marketing" && <Marketing tx={tx} />}
            {view === "settings" && <Settings tx={tx} />}
            {view === "logs" && <Logs tx={tx} locale={locale} q={q} />}
            {!CRM_V2_SECTIONS.some((s) => s.id === view) && <Soon tx={tx} title={tx("comingSoon")} />}
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-white/10 bg-neutral-950 md:hidden" aria-label={tx("panel")}>
        {mainTabs.map((tab) => (
          <Link key={tab} href={crmv2Href(base, tab === "overview" ? "" : tab)} className={`flex-1 py-2 text-center text-[11px] ${view === tab ? "text-white" : "text-neutral-500"}`}>
            {tx(tab)}
          </Link>
        ))}
        <button type="button" className="flex-1 py-2 text-center text-[11px] text-neutral-500" onClick={() => setMore(true)}>
          {tx("more")}
        </button>
      </nav>
      {more && (
        <Sheet title={tx("more")} onClose={() => setMore(false)} closeLabel={tx("close")}>
          <div className="flex flex-col gap-1">
            {moreTabs.map((tab) => (
              <Link key={tab} href={crmv2Href(base, tab)} onClick={() => setMore(false)} className="rounded px-3 py-3 text-sm text-white hover:bg-white/5">
                {tx(tab)}
              </Link>
            ))}
            <form method="post" action="/api/auth/logout">
              <input type="hidden" name="nav" value="1" />
              <button type="submit" className="w-full rounded px-3 py-3 text-left text-sm text-red-300">
                {tx("signOut")}
              </button>
            </form>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function Overview({ base, tx, locale }: { base: string; tx: (k: CrmV2CopyKey) => string; locale: string }) {
  const stats = useJson<{ kpis?: { users?: number; totalVolume?: number; pendingDeposits?: number; pendingBalanceRequests?: number; openPositions?: number } }>("/api/admin/stats");
  const finance = useJson<{ kpis?: { totalEquity?: number; totalBalance?: number } }>("/api/admin/analytics/finance");
  const users = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=8&meta=0&role=TRADER");
  const [sheet, setSheet] = useState<null | "add" | "transfer">(null);
  const kpis = stats.data?.kpis;
  const pending = (kpis?.pendingDeposits || 0) + (kpis?.pendingBalanceRequests || 0);
  const aum = finance.data?.kpis?.totalEquity ?? finance.data?.kpis?.totalBalance;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={tx("totalCustomers")} value={fmtNum(kpis?.users, locale)} href={crmv2Href(base, "customers")} />
        <Kpi label={tx("aum")} value={money(aum, "USD", locale)} href={crmv2Href(base, "finance", { tab: "ledger" })} />
        <Kpi label={tx("volume")} value={fmtNum(kpis?.totalVolume, locale)} href={crmv2Href(base, "positions")} />
        <Kpi label={tx("pending")} value={fmtNum(pending, locale)} href={crmv2Href(base, "finance", { status: "PENDING" })} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <section className="xl:col-span-2 rounded-2xl border border-white/10 bg-neutral-950">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-normal text-white">{tx("recentCustomers")}</h2>
            <Link href={crmv2Href(base, "customers")} className="text-xs text-neutral-400 hover:text-white">{tx("seeAll")}</Link>
          </div>
          <State loading={users.loading} error={users.error} empty={!users.loading && !(users.data?.users || []).length} tx={tx} onRetry={users.reload} />
          <CustomerTable base={base} rows={users.data?.users || []} tx={tx} locale={locale} />
        </section>
        <div className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-neutral-950 p-4">
            <h2 className="mb-3 text-sm font-normal text-white">{tx("quick")}</h2>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={actionBtn} onClick={() => setSheet("add")}>{tx("addCustomer")}</button>
              <button type="button" className={actionBtn} onClick={() => downloadCsv("customers.csv", users.data?.users || [])}>{tx("export")}</button>
              <button type="button" className={actionBtn} onClick={() => setSheet("transfer")}>{tx("transfer")}</button>
              <Link href={crmv2Href(base, "marketing")} className={actionBtn}>{tx("mail")}</Link>
            </div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-neutral-950 p-4">
            <h2 className="mb-3 text-sm font-normal text-white">{tx("alerts")}</h2>
            {stats.loading && <p className="text-xs text-neutral-500">{tx("loading")}</p>}
            {!stats.loading && pending === 0 && <p className="text-xs text-neutral-500">{tx("noAlerts")}</p>}
            {pending > 0 && (
              <Link href={crmv2Href(base, "finance", { status: "PENDING" })} className="block rounded border-l-2 border-white/40 bg-white/5 px-3 py-2 text-xs text-neutral-200">
                {tx("pending")}: {pending}
              </Link>
            )}
          </section>
        </div>
      </div>
      {sheet === "add" && <AddCustomer tx={tx} onClose={() => setSheet(null)} onDone={users.reload} />}
      {sheet === "transfer" && <TransferSheet tx={tx} onClose={() => setSheet(null)} />}
    </div>
  );
}

function Customers({ base, tx, locale, q }: { base: string; tx: (k: CrmV2CopyKey) => string; locale: string; q: string }) {
  const data = useJson<{ users?: UserRow[] }>(`/api/admin/users?view=table&take=50&meta=0&role=TRADER&q=${encodeURIComponent(q)}`);
  return (
    <section className="rounded-2xl border border-white/10 bg-neutral-950">
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-normal text-white">{tx("customers")}</h2>
      </div>
      <State loading={data.loading} error={data.error} empty={!data.loading && !(data.data?.users || []).length} tx={tx} onRetry={data.reload} />
      <CustomerTable base={base} rows={data.data?.users || []} tx={tx} locale={locale} />
    </section>
  );
}

function CustomerDetail({ base, id, tx, locale }: { base: string; id: string; tx: (k: CrmV2CopyKey) => string; locale: string }) {
  const user = useJson<{ user?: UserRow }>(`/api/admin/users/${encodeURIComponent(id)}?view=profile`);
  const ledger = useJson<{ transactions?: LedgerRow[] }>(`/api/admin/transactions?userId=${encodeURIComponent(id)}&limit=20`);
  const u = user.data?.user;
  return (
    <div className="space-y-4">
      <Link href={crmv2Href(base, "customers")} className="text-xs text-neutral-400 hover:text-white">{tx("back")}</Link>
      <State loading={user.loading} error={user.error} empty={!user.loading && !u} tx={tx} onRetry={user.reload} />
      {u && (
        <section className="rounded-2xl border border-white/10 bg-neutral-950 p-4">
          <h2 className="text-lg font-normal text-white">{u.name || "—"}</h2>
          <p className="text-sm text-neutral-400">{u.email}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <Field label={tx("balance")} value={money(u.balance ?? u.account?.balance, u.currency || u.account?.currency, locale)} />
            <Field label={tx("equity")} value={money(u.equity ?? u.account?.equity, u.currency || u.account?.currency, locale)} />
            <Field label={tx("status")} value={u.active === false ? tx("frozen") : tx("active")} />
            <Field label={tx("country")} value={u.country || "—"} />
            <Field label={tx("desk")} value={u.desk || "—"} />
            <Field label={tx("registered")} value={when(u.createdAt, locale)} />
          </dl>
        </section>
      )}
      <section className="rounded-2xl border border-white/10 bg-neutral-950">
        <h2 className="border-b border-white/10 px-4 py-3 text-sm font-normal text-white">{tx("ledger")}</h2>
        <State loading={ledger.loading} error={ledger.error} empty={!ledger.loading && !(ledger.data?.transactions || []).length} tx={tx} onRetry={ledger.reload} />
        <LedgerList rows={ledger.data?.transactions || []} locale={locale} />
      </section>
    </div>
  );
}

function Finance({ tx, locale, q }: { tx: (k: CrmV2CopyKey) => string; locale: string; q: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") || "deposits";
  const status = params.get("status") || "";
  const [busy, setBusy] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | { id: string; kind: string; action: "approve" | "reject" }>(null);
  const endpoint = tab === "withdrawals" ? "/api/admin/withdrawals" : tab === "ledger" ? "/api/admin/transactions" : "/api/admin/deposits";
  const url = tab === "ledger"
    ? `/api/admin/transactions?limit=40&q=${encodeURIComponent(q)}`
    : `${endpoint}?take=40&q=${encodeURIComponent(q)}${status ? `&status=${encodeURIComponent(status)}` : ""}`;
  const data = useJson<Record<string, unknown>>(url);

  function setQuery(next: Record<string, string>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.replace(`?${p.toString()}`);
  }

  const rows = tab === "ledger"
    ? ((data.data?.transactions as LedgerRow[]) || [])
    : ((data.data?.requests as MoneyRow[]) || []);

  return (
    <section className="rounded-2xl border border-white/10 bg-neutral-950">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3">
        {(["deposits", "withdrawals", "ledger"] as const).map((item) => (
          <button key={item} type="button" onClick={() => setQuery({ tab: item === "deposits" ? "" : item })} className={chip(tab === item || (item === "deposits" && tab === "deposits"))}>
            {tx(item)}
          </button>
        ))}
        {tab !== "ledger" && (["", "PENDING", "APPROVED", "REJECTED"] as const).map((item) => (
          <button key={item || "all"} type="button" onClick={() => setQuery({ status: item })} className={chip(status === item)}>
            {tx(item === "" ? "all" : item === "PENDING" ? "pendingTab" : item === "APPROVED" ? "approved" : "rejected")}
          </button>
        ))}
      </div>
      <State loading={data.loading} error={data.error} empty={!data.loading && rows.length === 0} tx={tx} onRetry={data.reload} />
      {tab === "ledger" ? (
        <LedgerList rows={rows as LedgerRow[]} locale={locale} />
      ) : (
        <MoneyList
          rows={rows as MoneyRow[]}
          tx={tx}
          locale={locale}
          busy={busy}
          onAct={(row, action) => setSheet({ id: row.id, kind: tab === "withdrawals" ? "WITHDRAW" : "DEPOSIT", action })}
        />
      )}
      {sheet && (
        <ApproveSheet
          tx={tx}
          action={sheet.action}
          busy={busy === sheet.id}
          onClose={() => setSheet(null)}
          onSubmit={async (reason) => {
            setBusy(sheet.id);
            const res = await fetch(approvalEndpoint(sheet.kind), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(approvalBody(sheet.id, sheet.action, reason)),
            });
            setBusy(null);
            if (res.ok) {
              setSheet(null);
              data.reload();
            }
          }}
        />
      )}
    </section>
  );
}

function Positions({ tx, locale, q }: { tx: (k: CrmV2CopyKey) => string; locale: string; q: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const status = (params.get("status") || "OPEN").toUpperCase();
  const data = useJson<{ positions?: PositionRow[] }>(`/api/admin/positions?status=${encodeURIComponent(status)}&take=40&q=${encodeURIComponent(q)}`);
  function setStatus(next: string) {
    const p = new URLSearchParams(params.toString());
    p.set("status", next);
    router.replace(`?${p.toString()}`);
  }
  const rows = data.data?.positions || [];
  return (
    <section className="rounded-2xl border border-white/10 bg-neutral-950">
      <div className="flex gap-2 border-b border-white/10 px-4 py-3">
        {["OPEN", "CLOSED", "ALL"].map((item) => (
          <button key={item} type="button" className={chip(status === item)} onClick={() => setStatus(item)}>
            {tx(item === "OPEN" ? "open" : item === "CLOSED" ? "closed" : "all")}
          </button>
        ))}
      </div>
      <State loading={data.loading} error={data.error} empty={!data.loading && rows.length === 0} tx={tx} onRetry={data.reload} />
      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-normal">{tx("customer")}</th>
              <th className="px-4 py-3 font-normal">{tx("symbol")}</th>
              <th className="px-4 py-3 font-normal">{tx("side")}</th>
              <th className="px-4 py-3 font-normal">{tx("amount")}</th>
              <th className="px-4 py-3 font-normal">{tx("profit")}</th>
              <th className="px-4 py-3 font-normal">{tx("status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-white/5">
                <td className="px-4 py-3">{row.traderName || row.user?.name || "—"}</td>
                <td className="px-4 py-3">{row.symbol}</td>
                <td className="px-4 py-3">{row.side}</td>
                <td className="px-4 py-3">{fmtNum(row.volume, locale)}</td>
                <td className="px-4 py-3">{money(row.profit, "USD", locale)}</td>
                <td className="px-4 py-3">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-white/5 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="px-4 py-3 text-sm">
            <p className="text-white">{row.symbol} · {row.side}</p>
            <p className="text-neutral-400">{row.traderName || row.user?.name || "—"}</p>
            <p>{money(row.profit, "USD", locale)} · {row.status}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Support({ tx, locale, q }: { tx: (k: CrmV2CopyKey) => string; locale: string; q: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") || "tickets";
  const status = params.get("status") || "PENDING";
  const tickets = useJson<{ tickets?: TicketRow[] }>(tab === "tickets" ? `/api/admin/tickets?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}` : null);
  const chat = useJson<{ threads?: ChatThread[] }>(tab === "chat" ? `/api/admin/chat?take=30&q=${encodeURIComponent(q)}` : null);
  const [sheet, setSheet] = useState<null | { id: string; kind: string; action: "approve" | "reject" }>(null);
  const [busy, setBusy] = useState(false);

  function setQuery(next: Record<string, string>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.replace(`?${p.toString()}`);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-neutral-950">
      <div className="flex flex-wrap gap-2 border-b border-white/10 px-4 py-3">
        <button type="button" className={chip(tab === "tickets")} onClick={() => setQuery({ tab: "" })}>{tx("tickets")}</button>
        <button type="button" className={chip(tab === "chat")} onClick={() => setQuery({ tab: "chat" })}>{tx("chat")}</button>
        {tab === "tickets" && ["PENDING", "APPROVED", "REJECTED", ""].map((item) => (
          <button key={item || "all"} type="button" className={chip(status === item || (item === "" && status === ""))} onClick={() => setQuery({ status: item })}>
            {tx(item === "" ? "all" : item === "PENDING" ? "pendingTab" : item === "APPROVED" ? "approved" : "rejected")}
          </button>
        ))}
      </div>
      {tab === "tickets" && (
        <>
          <State loading={tickets.loading} error={tickets.error} empty={!tickets.loading && !(tickets.data?.tickets || []).length} tx={tx} onRetry={tickets.reload} />
          <ul className="divide-y divide-white/5">
            {(tickets.data?.tickets || []).map((row) => (
              <li key={`${row.kind}-${row.id}`} className="flex flex-col gap-2 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-white">{row.customer || "—"} · {row.kind}</p>
                  <p className="text-neutral-400">{money(row.amount, row.currency, locale)} · {row.status} · {when(row.openedAt, locale)}</p>
                </div>
                {row.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button type="button" className={actionBtn} onClick={() => setSheet({ id: row.id, kind: row.kind, action: "approve" })}>{tx("approve")}</button>
                    <button type="button" className={actionBtn} onClick={() => setSheet({ id: row.id, kind: row.kind, action: "reject" })}>{tx("reject")}</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {tab === "chat" && (
        <>
          <State loading={chat.loading} error={chat.error} empty={!chat.loading && !(chat.data?.threads || []).length} tx={tx} onRetry={chat.reload} />
          <ul className="divide-y divide-white/5">
            {(chat.data?.threads || []).map((row) => (
              <li key={row.traderId || row.id} className="px-4 py-3 text-sm">
                <p className="text-white">{row.traderName || row.name || row.traderId}</p>
                <p className="text-neutral-400">{row.lastText || row.preview || ""}</p>
              </li>
            ))}
          </ul>
        </>
      )}
      {sheet && (
        <ApproveSheet
          tx={tx}
          action={sheet.action}
          busy={busy}
          onClose={() => setSheet(null)}
          onSubmit={async (reason) => {
            setBusy(true);
            const res = await fetch(approvalEndpoint(sheet.kind), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(approvalBody(sheet.id, sheet.action, reason)),
            });
            setBusy(false);
            if (res.ok) {
              setSheet(null);
              tickets.reload();
            }
          }}
        />
      )}
    </section>
  );
}

function Marketing({ tx }: { tx: (k: CrmV2CopyKey) => string }) {
  const aff = useJson<{ rows?: { name?: string; leads?: number; valid?: number; invalid?: number; deposits?: number }[] }>("/api/admin/analytics/affiliates?period=month");
  const mail = useJson<{ templates?: { id: string; name?: string; subject?: string; active?: boolean }[] }>("/api/admin/mail");
  const rows = aff.data?.rows || [];
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-neutral-950">
        <h2 className="border-b border-white/10 px-4 py-3 text-sm font-normal text-white">{tx("affiliates")}</h2>
        <State loading={aff.loading} error={aff.error} empty={!aff.loading && rows.length === 0} tx={tx} onRetry={aff.reload} />
        <ul className="divide-y divide-white/5">
          {rows.map((row) => (
            <li key={row.name} className="grid grid-cols-2 gap-2 px-4 py-3 text-sm md:grid-cols-5">
              <span className="text-white">{row.name || "—"}</span>
              <span>{tx("leads")}: {row.leads ?? 0}</span>
              <span>{tx("valid")}: {row.valid ?? 0}</span>
              <span>{tx("invalid")}: {row.invalid ?? 0}</span>
              <span>{tx("deposits")}: {row.deposits ?? 0}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-4">
        <h2 className="mb-3 text-sm font-normal text-white">{tx("templates")}</h2>
        <State loading={mail.loading} error={mail.error} empty={!mail.loading && !(mail.data?.templates || []).length} tx={tx} onRetry={mail.reload} />
        <ul className="mb-4 divide-y divide-white/5">
          {(mail.data?.templates || []).map((row) => (
            <li key={row.id} className="py-2 text-sm">
              <span className="text-white">{row.name}</span>
              <span className="ml-2 text-neutral-400">{row.subject}</span>
            </li>
          ))}
        </ul>
        <TemplateForm tx={tx} onDone={mail.reload} />
      </section>
      <Soon tx={tx} title={tx("campaignSend")} />
    </div>
  );
}

function Settings({ tx }: { tx: (k: CrmV2CopyKey) => string }) {
  const data = useJson<{ referralCode?: string; referralRequired?: boolean; terminalImpersonationEnabled?: boolean }>("/api/admin/settings");
  const [code, setCode] = useState("");
  const [required, setRequired] = useState(false);
  const [impersonation, setImpersonation] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!data.data) return;
    setCode(data.data.referralCode || "");
    setRequired(data.data.referralRequired !== false);
    setImpersonation(data.data.terminalImpersonationEnabled !== false);
  }, [data.data]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralCode: code, referralRequired: required, terminalImpersonationEnabled: impersonation }),
    });
    setMsg(res.ok ? tx("save") : tx("error"));
    if (res.ok) data.reload();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="max-w-lg space-y-3 rounded-2xl border border-white/10 bg-neutral-950 p-4">
        <State loading={data.loading} error={data.error} empty={false} tx={tx} onRetry={data.reload} />
        <label className="block text-xs text-neutral-400">{tx("referral")}
          <input value={code} onChange={(e) => setCode(e.target.value)} className={fieldCls} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
          {tx("referralRequired")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={impersonation} onChange={(e) => setImpersonation(e.target.checked)} />
          {tx("impersonation")}
        </label>
        <button type="submit" className={actionBtn}>{tx("save")}</button>
        {msg && <p className="text-xs text-neutral-400">{msg}</p>}
      </form>
      <Soon tx={tx} title={tx("leadMapping")} />
    </div>
  );
}

function Logs({ tx, locale, q }: { tx: (k: CrmV2CopyKey) => string; locale: string; q: string }) {
  const data = useJson<{ items?: CommRow[]; communications?: CommRow[] }>(`/api/admin/communications?take=40&q=${encodeURIComponent(q)}`);
  const rows = data.data?.items || data.data?.communications || [];
  return (
    <section className="rounded-2xl border border-white/10 bg-neutral-950">
      <h2 className="border-b border-white/10 px-4 py-3 text-sm font-normal text-white">{tx("logs")}</h2>
      <State loading={data.loading} error={data.error} empty={!data.loading && rows.length === 0} tx={tx} onRetry={data.reload} />
      <ul className="divide-y divide-white/5">
        {rows.map((row) => (
          <li key={row.id} className="px-4 py-3 text-sm">
            <p className="text-white">{row.type} · {row.user?.name || row.title || "—"}</p>
            <p className="text-neutral-400">{row.description || row.title}</p>
            <p className="text-xs text-neutral-500">{when(row.createdAt, locale)} · {row.workerName || ""}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AddCustomer({ tx, onClose, onDone }: { tx: (k: CrmV2CopyKey) => string; onClose: () => void; onDone: () => void }) {
  const [err, setErr] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fd.get("name"), email: fd.get("email"), password: fd.get("password"), role: "TRADER" }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setErr(String(body.error || tx("error")));
      return;
    }
    onDone();
    onClose();
  }
  return (
    <Sheet title={tx("addCustomer")} onClose={onClose} closeLabel={tx("close")}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-xs text-neutral-400">{tx("name")}<input name="name" required className={fieldCls} /></label>
        <label className="block text-xs text-neutral-400">{tx("email")}<input name="email" type="email" required className={fieldCls} /></label>
        <label className="block text-xs text-neutral-400">{tx("password")}<input name="password" type="password" required minLength={6} className={fieldCls} /></label>
        {err && <p className="text-xs text-red-300">{err}</p>}
        <button type="submit" className={actionBtn}>{tx("save")}</button>
      </form>
    </Sheet>
  );
}

function TransferSheet({ tx, onClose }: { tx: (k: CrmV2CopyKey) => string; onClose: () => void }) {
  const [err, setErr] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const userId = String(fd.get("userId") || "").trim();
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ledgerBody({
        type: "TRANSFER",
        amount: String(fd.get("amount") || ""),
        sourceUserId: String(fd.get("sourceUserId") || ""),
        comment: String(fd.get("comment") || ""),
      })),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setErr(String(body.error || tx("error")));
      return;
    }
    onClose();
  }
  return (
    <Sheet title={tx("transfer")} onClose={onClose} closeLabel={tx("close")}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-xs text-neutral-400">{tx("customer")}<input name="userId" required className={fieldCls} /></label>
        <label className="block text-xs text-neutral-400">{tx("sourceAccount")} <span className="text-neutral-500">({tx("optional")})</span>
          <input name="sourceUserId" className={fieldCls} aria-required={false} />
        </label>
        <label className="block text-xs text-neutral-400">{tx("amount")}<input name="amount" inputMode="decimal" required className={fieldCls} /></label>
        <label className="block text-xs text-neutral-400">{tx("comment")} <span className="text-neutral-500">({tx("optional")})</span>
          <input name="comment" className={fieldCls} />
        </label>
        {err && <p className="text-xs text-red-300">{err}</p>}
        <button type="submit" className={actionBtn}>{tx("save")}</button>
      </form>
    </Sheet>
  );
}

function TemplateForm({ tx, onDone }: { tx: (k: CrmV2CopyKey) => string; onDone: () => void }) {
  const [err, setErr] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name: fd.get("name"), subject: fd.get("subject"), body: fd.get("body") }),
    });
    if (!res.ok) {
      setErr(tx("error"));
      return;
    }
    e.currentTarget.reset();
    onDone();
  }
  return (
    <form onSubmit={submit} className="grid gap-2 md:grid-cols-2">
      <input name="name" required placeholder={tx("name")} aria-label={tx("name")} className={fieldCls} />
      <input name="subject" required placeholder={tx("subject")} aria-label={tx("subject")} className={fieldCls} />
      <textarea name="body" required placeholder={tx("body")} aria-label={tx("body")} className={`${fieldCls} md:col-span-2`} rows={3} />
      {err && <p className="text-xs text-red-300 md:col-span-2">{err}</p>}
      <button type="submit" className={actionBtn}>{tx("createTemplate")}</button>
    </form>
  );
}

function ApproveSheet({
  tx,
  action,
  busy,
  onClose,
  onSubmit,
}: {
  tx: (k: CrmV2CopyKey) => string;
  action: "approve" | "reject";
  busy: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <Sheet title={action === "approve" ? tx("approve") : tx("reject")} onClose={onClose} closeLabel={tx("close")}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(reason);
        }}
        className="space-y-3"
      >
        <label className="block text-xs text-neutral-400">
          {tx("reason")} <span className="text-neutral-500">({tx("optional")})</span>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} aria-required={false} rows={3} className={fieldCls} />
        </label>
        <button type="submit" disabled={busy} className={actionBtn}>{busy ? tx("loading") : tx("save")}</button>
      </form>
    </Sheet>
  );
}

function Soon({ tx, title }: { tx: (k: CrmV2CopyKey) => string; title: string }) {
  return (
    <section data-coming-soon="" className="rounded-2xl border border-dashed border-white/15 bg-neutral-950 p-4">
      <h2 className="text-sm font-normal text-white">{title}</h2>
      <p className="mt-1 text-sm text-neutral-400">{tx("comingSoon")}. {tx("comingSoonBody")}</p>
    </section>
  );
}

function Sheet({ title, onClose, closeLabel, children }: { title: string; onClose: () => void; closeLabel: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 md:items-center" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-neutral-950 p-4 md:max-w-md md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-normal text-white">{title}</h2>
          <button type="button" onClick={onClose} className="text-xs text-neutral-400">{closeLabel}</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CustomerTable({ base, rows, tx, locale }: { base: string; rows: UserRow[]; tx: (k: CrmV2CopyKey) => string; locale: string }) {
  if (!rows.length) return null;
  return (
    <>
      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-normal">{tx("customer")}</th>
              <th className="px-4 py-3 font-normal">{tx("registered")}</th>
              <th className="px-4 py-3 font-normal">{tx("balance")}</th>
              <th className="px-4 py-3 font-normal">{tx("status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-white/5">
                <td className="px-4 py-3">
                  <Link href={crmv2Href(base, `customers/${row.id}`)} className="text-white hover:underline">{row.name || "—"}</Link>
                  <p className="text-xs text-neutral-500">{row.email}</p>
                </td>
                <td className="px-4 py-3 text-neutral-400">{when(row.createdAt, locale)}</td>
                <td className="px-4 py-3">{money(row.balance ?? row.account?.balance, row.currency || row.account?.currency, locale)}</td>
                <td className="px-4 py-3">{row.active === false ? tx("frozen") : tx("active")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-white/5 md:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <Link href={crmv2Href(base, `customers/${row.id}`)} className="block px-4 py-3">
              <p className="text-sm text-white">{row.name || "—"}</p>
              <p className="text-xs text-neutral-500">{row.email}</p>
              <p className="text-sm">{money(row.balance ?? row.account?.balance, row.currency || row.account?.currency, locale)} · {row.active === false ? tx("frozen") : tx("active")}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function LedgerList({ rows, locale }: { rows: LedgerRow[]; locale: string }) {
  if (!rows.length) return null;
  return (
    <ul className="divide-y divide-white/5">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
          <div>
            <p className="text-white">{row.trader || "—"} · {row.type}</p>
            <p className="text-xs text-neutral-500">{when(row.createdAt, locale)}</p>
          </div>
          <span>{money(row.amount, row.currency, locale)}</span>
        </li>
      ))}
    </ul>
  );
}

function MoneyList({
  rows,
  tx,
  locale,
  busy,
  onAct,
}: {
  rows: MoneyRow[];
  tx: (k: CrmV2CopyKey) => string;
  locale: string;
  busy: string | null;
  onAct: (row: MoneyRow, action: "approve" | "reject") => void;
}) {
  if (!rows.length) return null;
  return (
    <ul className="divide-y divide-white/5">
      {rows.map((row) => (
        <li key={row.id} className="flex flex-col gap-2 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-white">{row.user?.name || "—"}</p>
            <p className="text-neutral-400">{money(row.amount, row.currency, locale)} · {row.status} · {when(row.createdAt, locale)}</p>
          </div>
          {row.status === "PENDING" && (
            <div className="flex gap-2">
              <button type="button" disabled={busy === row.id} className={actionBtn} onClick={() => onAct(row, "approve")}>{tx("approve")}</button>
              <button type="button" disabled={busy === row.id} className={actionBtn} onClick={() => onAct(row, "reject")}>{tx("reject")}</button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="text-white">{value}</dd>
    </div>
  );
}

function State({
  loading,
  error,
  empty,
  tx,
  onRetry,
}: {
  loading: boolean;
  error: string;
  empty: boolean;
  tx: (k: CrmV2CopyKey) => string;
  onRetry: () => void;
}) {
  if (loading) return <p className="px-4 py-6 text-sm text-neutral-500">{tx("loading")}</p>;
  if (error) {
    return (
      <div className="px-4 py-6 text-sm">
        <p className="text-red-300">{tx("error")}</p>
        <button type="button" onClick={onRetry} className="mt-2 text-xs text-white underline">{tx("retry")}</button>
      </div>
    );
  }
  if (empty) return <p className="px-4 py-6 text-sm text-neutral-500">{tx("empty")}</p>;
  return null;
}

function Kpi({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-white/10 bg-neutral-950 p-4 hover:border-white/30">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-normal tracking-tight text-white">{value}</p>
    </Link>
  );
}

function useJson<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(url));
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);
  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    setError("");
    fetch(url, { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/login";
          return null;
        }
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<T>;
      })
      .then((body) => {
        if (live && body) setData(body);
      })
      .catch(() => {
        if (live) setError("load");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [url, tick]);
  return useMemo(() => ({ data, error, loading, reload }), [data, error, loading, reload]);
}

function downloadCsv(filename: string, rows: UserRow[]) {
  const header = ["name", "email", "balance", "active"];
  const lines = [header.join(",")].concat(rows.map((row) => [row.name, row.email, row.balance ?? row.account?.balance ?? "", row.active === false ? "frozen" : "active"].map(csv).join(",")));
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csv(value: unknown): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function fmtNum(value: unknown, locale: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(localeTag(locale), { maximumFractionDigits: 2 }).format(n);
}

function money(value: unknown, currency: string | undefined, locale: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const code = currency && currency.length === 3 ? currency : "USD";
  try {
    return new Intl.NumberFormat(localeTag(locale), { style: "currency", currency: code, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${n.toFixed(2)} ${code}`;
  }
}

function when(value: unknown, locale: string): string {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium" }).format(d);
}

function localeTag(locale: string): string {
  if (locale === "tr") return "tr-TR";
  if (locale === "de") return "de-DE";
  if (locale === "ru") return "ru-RU";
  if (locale === "ar") return "ar";
  return "en-GB";
}

const actionBtn = "rounded border border-white/10 bg-white/5 px-3 py-2 text-center text-xs text-white hover:bg-white/10";
const fieldCls = "mt-1 w-full rounded border border-white/10 bg-black px-2 py-1.5 text-sm font-normal text-white outline-none focus:border-white/30";

function chip(on: boolean): string {
  return `rounded-full border px-3 py-1 text-xs ${on ? "border-white bg-white text-black" : "border-white/10 text-neutral-300"}`;
}

type UserRow = {
  id: string;
  name?: string;
  email?: string;
  active?: boolean;
  createdAt?: string;
  country?: string | null;
  desk?: string | null;
  balance?: number;
  equity?: number;
  currency?: string;
  account?: { balance?: number; equity?: number; currency?: string } | null;
};

type LedgerRow = { id: string; amount?: number; type?: string; currency?: string; trader?: string; createdAt?: string };
type MoneyRow = { id: string; amount?: number; currency?: string; status?: string; createdAt?: string; user?: { name?: string } };
type PositionRow = { id: string; symbol?: string; side?: string; volume?: number; profit?: number; status?: string; traderName?: string; user?: { name?: string } };
type TicketRow = { id: string; kind: string; amount?: number; currency?: string; status?: string; customer?: string; openedAt?: string };
type ChatThread = { id?: string; traderId?: string; traderName?: string; name?: string; lastText?: string; preview?: string };
type CommRow = { id: string; type?: string; title?: string; description?: string; createdAt?: string; workerName?: string; user?: { name?: string } };
