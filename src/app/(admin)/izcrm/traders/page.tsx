"use client";

import { fmtCrmDate } from "@/lib/crm-format";

import Link from "next/link";
import { ACCOUNT_CURRENCIES, RETENTION_STATUSES, SALE_STATUSES } from "@/lib/membership";
import { useCrmLabels } from "@/lib/i18n/crm-labels";
import { useCallback, useEffect, useRef, useState } from "react";
import { LocationLabel, PresenceCell } from "@/components/crm/Presence";

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
  balance: number;
  equity: number;
  credit: number;
  bonus: number;
  currency: string;
  country: string | null;
  desk: string | null;
  saleStatus: string | null;
  retentionStatus: string | null;
  brokerName: string | null;
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
};

const REFRESH_MS = 20000;

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
  const [rows, setRows] = useState<UserRow[]>([]);
  const [deskOptions, setDeskOptions] = useState<DeskOpt[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [desk, setDesk] = useState("");
  const [country, setCountry] = useState("");
  const [saleStatus, setSaleStatus] = useState("");
  const [retentionStatus, setRetentionStatus] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [bulkDesk, setBulkDesk] = useState("");
  const [bulkBroker, setBulkBroker] = useState("");
  const [ftdOnly, setFtdOnly] = useState(false);
  const [presence, setPresence] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const skew = useRef(0);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status !== "all") params.set("status", status);
    if (desk) params.set("desk", desk);
    if (country) params.set("country", country);
    if (saleStatus) params.set("saleStatus", saleStatus);
    if (retentionStatus) params.set("retentionStatus", retentionStatus);
    if (presence) params.set("presence", presence);
    const res = await fetch(`/api/admin/users?${params}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    const st = new Date(data.serverTime).getTime();
    if (Number.isFinite(st)) skew.current = st - Date.now();
    setNow(Date.now() + skew.current);
    let list = data.users || [];
    if (ftdOnly) list = list.filter((u: UserRow) => u.ftd);
    setRows(list);
    setDeskOptions(data.deskOptions || []);
  }, [q, status, desk, country, saleStatus, retentionStatus, ftdOnly, presence]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh presence/balances. Only row data is replaced — filters, selection and the
  // create form live in separate state, so typed input is never overwritten.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

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

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{i18n("crm.nav.traders")}</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-black text-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-800"
        >
          {i18n("crm.ui.newMember")}
        </button>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={i18n("crm.ui.searchTraders")}
          className="ml-auto w-full max-w-xs rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-3 py-1.5 text-sm"
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
        >
          <option value="all">{i18n("crm.ui.allStatuses")}</option>
          <option value="active">{i18n("crm.ui.active")}</option>
          <option value="frozen">{i18n("crm.ui.frozen")}</option>
          <option value="trade_off">{i18n("crm.perms.filterTradeOff")}</option>
          <option value="withdraw_off">{i18n("crm.perms.filterWithdrawOff")}</option>
          <option value="login_off">{i18n("crm.perms.filterLoginOff")}</option>
        </select>
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
        <select
          value={desk}
          onChange={(e) => setDesk(e.target.value)}
          className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
        >
          <option value="">{i18n("crm.ui.allDesks")}</option>
          {deskOptions.map((d) => (
            <option key={d.id} value={d.code || d.id}>
              {deskName(d)}
            </option>
          ))}
        </select>
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder={i18n("crm.ui.country")}
          className="w-20 rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
        />
        <select
          value={saleStatus}
          onChange={(e) => setSaleStatus(e.target.value)}
          className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
        >
          <option value="">{i18n("crm.ui.saleStatus")}</option>
          {SALE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {code("crm.sale", s)}
            </option>
          ))}
        </select>
        <select
          value={retentionStatus}
          onChange={(e) => setRetentionStatus(e.target.value)}
          className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
        >
          <option value="">{i18n("crm.ui.retention")}</option>
          {RETENTION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {code("crm.retention", s)}
            </option>
          ))}
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

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#e5e5e5] bg-[#ffffff] p-2 text-xs">
          <span className="text-neutral-500">{selected.size} {i18n("crm.ui.selected")}</span>
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
            {deskOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {deskName(d)}
              </option>
            ))}
          </select>
          <button
            disabled={busy || !bulkDesk}
            onClick={() => {
              const picked = deskOptions.find((d) => d.id === bulkDesk);
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
        </div>
      )}

      {msg && <p className="mb-3 text-xs text-emerald-400">{msg}</p>}

      <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              <th className="px-2 py-2.5">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selected.size === rows.length}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-3 py-2.5">{i18n("crm.ui.memberId")}</th>
              <th className="px-3 py-2.5">{i18n("crm.presence.status")}</th>
              <th className="px-3 py-2.5">{i18n("crm.ui.phone")}</th>
              <th className="px-3 py-2.5">{i18n("crm.ui.desk")}</th>
              <th className="px-3 py-2.5">{i18n("crm.ui.country")}</th>
              <th className="px-3 py-2.5">{i18n("crm.ui.saleRet")}</th>
              <th className="px-3 py-2.5">{i18n("crm.ui.balance")}</th>
              <th className="px-3 py-2.5">{i18n("crm.ui.account")}</th>
              <th className="px-3 py-2.5">{i18n("crm.presence.accountStatus")}</th>
              <th className="px-3 py-2.5">{i18n("crm.ui.broker")}</th>
              <th className="px-3 py-2.5">{i18n("crm.ui.lastLogin")}</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-[#e5e5e5] hover:bg-[#ffffff]/60">
                <td className="px-2 py-2.5">
                  <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} />
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-mono text-[9px] text-neutral-400">{u.id.slice(0, 8)}…</div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-neutral-500">{u.email}</div>
                  {u.accountLoginId && (
                    <div className="font-mono text-[10px] tracking-wide text-sky-600">
                      {i18n("crm.ui.accountId")}: {u.accountLoginId}
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
                </td>
                <td className="px-3 py-2.5 tabular-nums">
                  <div>
                    {u.balance.toLocaleString("en-US", {
                      style: "currency",
                      currency: u.currency || "USD",
                    })}
                  </div>
                  <div className="text-[9px] text-neutral-500">
                    {i18n("crm.ui.equity")}{" "}
                    {u.equity.toLocaleString("en-US", {
                      style: "currency",
                      currency: u.currency || "USD",
                    })}
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
                <td className="px-3 py-2.5 text-neutral-500">{u.brokerName || "—"}</td>
                <td className="px-3 py-2.5 text-[10px] text-neutral-500">
                  {u.lastLoginAt ? fmtCrmDate(u.lastLoginAt) : "—"}
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
