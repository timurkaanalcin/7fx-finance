"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

type Row = {
  id: string | null;
  sourceKey: string;
  name: string;
  surname: string | null;
  email: string | null;
  token: string | null;
  active: boolean | null;
  checkOnFraud: boolean | null;
  registered: boolean;
  leads: number;
  ftd: number;
  mismatch: number;
  tracked: number;
};

const PERIODS = ["day", "week", "month", "m3", "m6", "year", "all"] as const;
const inputCls = "rounded border border-neutral-300 bg-white px-2 py-1 text-[11px]";
const btn = "rounded border border-neutral-300 px-2 py-1 text-[11px]";

function pct(mismatch: number, tracked: number) {
  if (!tracked) return "—";
  return `${((mismatch / tracked) * 100).toFixed(1)}%`;
}

export default function AffiliateAccountsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [period, setPeriod] = useState("month");
  const [rows, setRows] = useState<Row[]>([]);
  const [unlinked, setUnlinked] = useState<{ detected: string; leads: number }[]>([]);
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState("");
  const [canWrite, setCanWrite] = useState(false);
  const [sourceKey, setSourceKey] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState("");

  const periodLabel: Record<string, string> = {
    day: t("crm.aff.day"),
    week: t("crm.aff.week"),
    month: t("crm.aff.month"),
    m3: t("crm.aff.m3"),
    m6: t("crm.aff.m6"),
    year: t("crm.aff.year"),
    all: t("crm.aff.all"),
  };

  const load = () => {
    fetch(`/api/admin/analytics/affiliates/accounts?period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.rows || []);
        setUnlinked(d.unlinked || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    setFocus(new URLSearchParams(window.location.search).get("source") || "");
    fetch("/api/auth/me?scope=admin")
      .then((r) => r.json())
      .then((d) => setCanWrite(!d.permissions?.scoped && !d.permissions?.crmReadOnly && !d.permissions?.readOnly))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps -- load closes over period

  useEffect(() => {
    if (!focus) return;
    const hit = rows.find((r) => r.registered && (r.sourceKey === focus || r.name === focus));
    if (!hit && focus !== "—") {
      setSourceKey(focus);
      setName(focus);
    }
    const el = document.getElementById("aff-focus");
    el?.scrollIntoView({ block: "center" });
  }, [focus, rows]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => `${r.name} ${r.surname || ""} ${r.email || ""} ${r.sourceKey}`.toLowerCase().includes(s));
  }, [rows, q]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const r = await fetch("/api/admin/analytics/affiliates/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceKey, name: name || sourceKey, email }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d.error || "Error");
    if (d.id) router.push(`/izcrm/analytics/affiliates/accounts/${d.id}`);
  }

  async function createSource(source: string) {
    setMsg("");
    const r = await fetch("/api/admin/analytics/affiliates/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceKey: source, name: source }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d.error || "Error");
    if (d.id) router.push(`/izcrm/analytics/affiliates/accounts/${d.id}`);
  }

  async function remove(row: Row) {
    if (!row.id) return;
    if (!window.confirm(t("crm.aff.confirmDelete"))) return;
    setMsg("");
    const r = await fetch(`/api/admin/analytics/affiliates/accounts/${row.id}`, { method: "DELETE" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d.error || "Error");
    load();
  }

  async function copyToken(token: string) {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(token);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* ignore */
    }
  }

  const yes = t("crm.ui.yes");
  const no = t("crm.ui.no");

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
        <Link href="/izcrm/analytics/affiliates" className="rounded border border-neutral-300 px-2 py-1">← {t("crm.aff.backReport")}</Link>
        <Link href="/izcrm/analytics/affiliates/docs" className="rounded border border-neutral-300 px-2 py-1">{t("crm.aff.apiDocs")}</Link>
      </div>
      <h1 className="mb-1 text-lg font-semibold">{t("crm.aff.accounts")}</h1>
      <p className="mb-1 text-[11px] text-neutral-500">{t("crm.aff.accountsHint")}</p>
      <p className="mb-3 text-[11px] text-neutral-500">{t("crm.aff.periodNote")}</p>
      {focus && focus !== "—" && (
        <p className="mb-3 text-[11px] text-neutral-600">{t("crm.aff.open")}: <b>{focus}</b></p>
      )}
      <div className="mb-3 flex flex-wrap items-center gap-1 text-[11px]">
        <span className="mr-1 text-neutral-500">{t("crm.aff.period")}:</span>
        {PERIODS.map((p) => (
          <button key={p} type="button" onClick={() => setPeriod(p)} className={`rounded border px-2 py-1 ${period === p ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`}>
            {periodLabel[p]}
          </button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("crm.aff.search")} className={`ml-2 ${inputCls}`} />
      </div>
      {canWrite && (
        <form onSubmit={create} className="mb-3 flex flex-wrap items-end gap-2 rounded-lg border border-neutral-200 p-3 text-[11px]">
          <label>{t("crm.aff.sourceKey")}<br /><input required value={sourceKey} onChange={(e) => setSourceKey(e.target.value)} className={inputCls} /></label>
          <label>{t("crm.aff.name")}<br /><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></label>
          <label>{t("crm.aff.email")}<br /><input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></label>
          <button type="submit" className="rounded bg-neutral-900 px-3 py-1 text-white">{t("crm.aff.create")}</button>
          {msg && <span className="text-neutral-600">{msg}</span>}
        </form>
      )}
      {!canWrite && msg && <p className="mb-2 text-[11px] text-neutral-600">{msg}</p>}
      {unlinked.length > 0 && (
        <div className="mb-3 rounded-lg border border-neutral-200 p-3 text-[11px]">
          <div className="mb-1 text-neutral-500">{t("crm.aff.unlinked")}</div>
          <div className="flex flex-wrap gap-1.5">
            {unlinked.map((u) => (
              <span key={u.detected} className="rounded border border-neutral-200 bg-white px-2 py-0.5">{u.detected}: <b>{u.leads}</b></span>
            ))}
          </div>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              {[t("crm.aff.name"), t("crm.aff.email"), t("crm.aff.leads"), t("crm.aff.leadsFtd"), t("crm.aff.token"), t("crm.aff.apiDocs"), t("crm.aff.fraud"), t("crm.aff.active"), t("crm.aff.mismatch"), t("crm.aff.actions")].map((h) => (
                <th key={h} className="whitespace-nowrap px-2 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const focused = focus && (r.sourceKey === focus || r.name === focus);
              const label = [r.name, r.surname].filter(Boolean).join(" ");
              return (
                <tr key={r.id || r.sourceKey} id={focused ? "aff-focus" : undefined} className={`border-t border-neutral-100 ${focused ? "bg-neutral-100" : "hover:bg-neutral-50"}`}>
                  <td className="whitespace-nowrap px-2 py-1.5 font-medium">
                    {r.registered && r.id ? (
                      <Link href={`/izcrm/analytics/affiliates/accounts/${r.id}`} className="underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900">{label}</Link>
                    ) : label}
                    {!r.registered && <div className="text-[10px] font-normal text-neutral-500">{t("crm.aff.unregistered")}</div>}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5">{r.email || "—"}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 tabular-nums">{r.leads}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 tabular-nums">{r.ftd}</td>
                  <td className="max-w-[180px] px-2 py-1.5">
                    {r.token ? (
                      <button type="button" onClick={() => copyToken(r.token!)} className="block max-w-[160px] truncate text-left font-mono text-[10px] underline decoration-neutral-300" title={r.token}>
                        {copied === r.token ? t("crm.aff.copied") : r.token}
                      </button>
                    ) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5">
                    <Link href="/izcrm/analytics/affiliates/docs" className="underline decoration-neutral-300 underline-offset-2">{t("crm.aff.apiDocs")}</Link>
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5">
                    {r.checkOnFraud == null ? "—" : (
                      <span className={`inline-block rounded border px-1.5 py-0.5 ${r.checkOnFraud ? "border-red-200 bg-red-50/40" : "border-neutral-200 bg-white text-neutral-600"}`}>
                        {r.checkOnFraud ? yes : no}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5">
                    {r.active == null ? "—" : (
                      <span className={`inline-block rounded border px-1.5 py-0.5 ${r.active ? "border-neutral-300 bg-white" : "border-red-200 bg-red-50/40"}`}>
                        {r.active ? yes : no}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5">
                    <span className={`inline-block rounded border px-1.5 py-0.5 ${r.tracked && r.mismatch ? "border-red-200 bg-red-50/40" : "border-neutral-200 bg-white"}`}>
                      {pct(r.mismatch, r.tracked)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5">
                    <div className="flex flex-wrap gap-1">
                      {r.registered && r.id ? (
                        <>
                          <Link href={`/izcrm/analytics/affiliates/accounts/${r.id}`} className={btn}>{t("crm.aff.view")}</Link>
                          <Link href={`/izcrm/analytics/affiliates/accounts/${r.id}#streams`} className={btn}>{t("crm.aff.streams")}</Link>
                          {canWrite && <button type="button" onClick={() => remove(r)} className="rounded border border-red-300 px-2 py-1 text-red-700">{t("crm.aff.delete")}</button>}
                        </>
                      ) : canWrite ? (
                        <button type="button" onClick={() => createSource(r.sourceKey)} className="rounded bg-neutral-900 px-2 py-1 text-white">{t("crm.aff.create")}</button>
                      ) : "—"}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!shown.length && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-neutral-500">{t("crm.aff.emptyAccounts")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
