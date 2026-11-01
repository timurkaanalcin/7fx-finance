"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

type Stream = { id: string; name: string; declaredSource: string; landingUrl: string | null; active: boolean; note: string | null };
type Lead = {
  id: string;
  name: string;
  email: string;
  declared: string | null;
  detected: string | null;
  mismatch: boolean;
  fraudFlag: boolean;
  referrer: string | null;
  landingUrl: string | null;
  fbclid: string | null;
  gclid: string | null;
  ttclid: string | null;
  msclkid: string | null;
  inApp: string | null;
  ip: string | null;
  country: string | null;
  city: string | null;
  invalid: boolean;
  reason: string;
  ftd: boolean;
  deposits: number;
};
type Stats = { leads: number; valid: number; invalid: number; deposits: number; ftd: number; mismatch: number; tracked: number; reasons?: Record<string, number> };

const PERIODS = ["day", "week", "month", "m3", "m6", "year", "all"] as const;
const inputCls = "mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-[11px]";
const btn = "rounded border border-neutral-300 px-2 py-1 text-[11px]";

const pct = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(1) : "0.0");

function clicks(l: Lead) {
  return [
    l.fbclid ? "fbclid" : "",
    l.gclid ? "gclid" : "",
    l.ttclid ? "ttclid" : "",
    l.msclkid ? "msclkid" : "",
  ].filter(Boolean).join(", ");
}

export default function AffiliateAccountPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");
  const [period, setPeriod] = useState("month");
  const [canWrite, setCanWrite] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [breakdown, setBreakdown] = useState<{ declared: string; detected: string; leads: number; mismatches: number }[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [form, setForm] = useState({
    sourceKey: "",
    name: "",
    surname: "",
    email: "",
    token: "",
    active: true,
    checkOnFraud: false,
    allowDuplicatePhones: false,
    allowedIps: "",
    allowedSources: "",
    note: "",
    callbackUrl: "",
  });
  const [streamForm, setStreamForm] = useState({ name: "", declaredSource: "", landingUrl: "" });

  const periodLabel: Record<string, string> = {
    day: t("crm.aff.day"),
    week: t("crm.aff.week"),
    month: t("crm.aff.month"),
    m3: t("crm.aff.m3"),
    m6: t("crm.aff.m6"),
    year: t("crm.aff.year"),
    all: t("crm.aff.all"),
  };

  const load = useCallback(() => {
    if (!id) return;
    fetch(`/api/admin/analytics/affiliates/accounts/${id}?period=${period}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) {
          setMsg(d.error || "Error");
          return;
        }
        const p = d.partner || {};
        setForm({
          sourceKey: p.sourceKey || "",
          name: p.name || "",
          surname: p.surname || "",
          email: p.email || "",
          token: p.token || "",
          active: p.active !== false,
          checkOnFraud: Boolean(p.checkOnFraud),
          allowDuplicatePhones: Boolean(p.allowDuplicatePhones),
          allowedIps: p.allowedIps || "",
          allowedSources: p.allowedSources || "",
          note: p.note || "",
          callbackUrl: p.callbackUrl || "",
        });
        setStats(d.stats || null);
        setLeads(d.leads || []);
        setTruncated(Boolean(d.leadsTruncated));
        setBreakdown(d.breakdown || []);
        setStreams(d.streams || []);
      })
      .catch(() => {});
  }, [id, period]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    document.querySelector(hash)?.scrollIntoView();
  }, [streams.length, form.sourceKey]);

  useEffect(() => {
    fetch("/api/auth/me?scope=admin")
      .then((r) => r.json())
      .then((d) => setCanWrite(!d.permissions?.scoped && !d.permissions?.crmReadOnly && !d.permissions?.readOnly))
      .catch(() => {});
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const r = await fetch(`/api/admin/analytics/affiliates/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceKey: form.sourceKey,
        name: form.name,
        surname: form.surname,
        email: form.email,
        active: form.active,
        checkOnFraud: form.checkOnFraud,
        allowDuplicatePhones: form.allowDuplicatePhones,
        allowedIps: form.allowedIps,
        allowedSources: form.allowedSources,
        note: form.note,
        callbackUrl: form.callbackUrl,
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d.error || "Error");
    setMsg(t("crm.aff.saved"));
    load();
  }

  async function regen() {
    setMsg("");
    const r = await fetch(`/api/admin/analytics/affiliates/accounts/${id}/token`, { method: "POST" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d.error || "Error");
    if (d.token) set("token", d.token);
  }

  async function copyToken() {
    try {
      await navigator.clipboard.writeText(form.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  async function removeAccount() {
    if (!window.confirm(t("crm.aff.confirmDelete"))) return;
    const r = await fetch(`/api/admin/analytics/affiliates/accounts/${id}`, { method: "DELETE" });
    if (r.ok) router.push("/izcrm/analytics/affiliates/accounts");
  }

  async function addStream(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const r = await fetch(`/api/admin/analytics/affiliates/accounts/${id}/streams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(streamForm),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d.error || "Error");
    setStreamForm({ name: "", declaredSource: "", landingUrl: "" });
    load();
  }

  async function removeStream(streamId: string) {
    if (!window.confirm(t("crm.aff.confirmDeleteStream"))) return;
    const r = await fetch(`/api/admin/analytics/affiliates/accounts/${id}/streams/${streamId}`, { method: "DELETE" });
    if (r.ok) load();
  }

  const yesNo = (value: boolean, onChange: (v: boolean) => void) => (
    <select disabled={!canWrite} value={value ? "yes" : "no"} onChange={(e) => onChange(e.target.value === "yes")} className={inputCls}>
      <option value="yes">{t("crm.ui.yes")}</option>
      <option value="no">{t("crm.ui.no")}</option>
    </select>
  );

  const tiles: [string, string | number][] = stats
    ? [
        [t("crm.aff.leads"), stats.leads],
        [t("crm.aff.valid"), stats.valid],
        [t("crm.aff.invalid"), stats.invalid],
        [t("crm.aff.deposits"), stats.deposits],
        [t("crm.aff.leadsFtd"), stats.ftd],
        [t("crm.aff.conv"), pct(stats.deposits, stats.leads)],
        [t("crm.aff.mismatch"), stats.tracked ? `${pct(stats.mismatch, stats.tracked)}%` : "—"],
        [t("crm.aff.tracked"), stats.tracked],
      ]
    : [];

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
        <Link href="/izcrm/analytics/affiliates/accounts" className={btn}>← {t("crm.aff.backAccounts")}</Link>
        <Link href="/izcrm/analytics/affiliates" className={btn}>{t("crm.aff.backReport")}</Link>
        <Link href="/izcrm/analytics/affiliates/docs" className="ml-auto underline decoration-neutral-300 underline-offset-2">{t("crm.aff.apiDocs")}</Link>
      </div>
      <h1 className="mb-1 text-lg font-semibold">{[form.name, form.surname].filter(Boolean).join(" ") || t("crm.aff.accounts")}</h1>
      <p className="mb-3 text-[11px] text-neutral-500">{form.email || form.sourceKey}</p>
      <div className="flex flex-col gap-3 lg:flex-row">
        <aside className="h-fit w-full shrink-0 rounded-lg border border-neutral-200 p-2 text-[11px] lg:w-44">
          <div className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-wider text-neutral-500">{t("crm.aff.quick")}</div>
          <a href="#personal" className="block rounded px-2 py-1 hover:bg-neutral-50">{t("crm.aff.personal")}</a>
          <a href="#account" className="block rounded px-2 py-1 hover:bg-neutral-50">{t("crm.aff.accountMgmt")}</a>
          <a href="#streams" className="block rounded px-2 py-1 hover:bg-neutral-50">{t("crm.aff.streams")}</a>
          <a href="#origin" className="block rounded px-2 py-1 hover:bg-neutral-50">{t("crm.aff.origin")}</a>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-1 text-[11px]">
            <span className="mr-1 text-neutral-500">{t("crm.aff.period")}:</span>
            {PERIODS.map((p) => (
              <button key={p} type="button" onClick={() => setPeriod(p)} className={`rounded border px-2 py-1 ${period === p ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`}>
                {periodLabel[p]}
              </button>
            ))}
          </div>
          <p className="mb-2 text-[11px] text-neutral-500">{t("crm.aff.metricsNote")}</p>
          <div className="mb-3 flex flex-wrap gap-1.5 text-[11px]">
            {tiles.map(([label, value]) => (
              <span key={label} className="rounded border border-neutral-200 bg-white px-2 py-1">{label}: <b>{value}</b></span>
            ))}
          </div>
          <form onSubmit={save} className="space-y-3">
            <section id="personal" className="rounded-lg border border-neutral-200 p-3">
              <h2 className="mb-3 text-[13px] font-semibold">{t("crm.aff.personalData")}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block text-[11px] text-neutral-500">{t("crm.aff.name")}<input disabled={!canWrite} value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} /></label>
                <label className="block text-[11px] text-neutral-500">{t("crm.aff.surname")}<input disabled={!canWrite} value={form.surname} onChange={(e) => set("surname", e.target.value)} className={inputCls} /></label>
                <label className="block text-[11px] text-neutral-500">{t("crm.aff.email")}<input disabled={!canWrite} value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} /></label>
                <label className="block text-[11px] text-neutral-500">{t("crm.aff.sourceKey")}<input disabled={!canWrite} value={form.sourceKey} onChange={(e) => set("sourceKey", e.target.value)} className={inputCls} /></label>
              </div>
            </section>
            <section id="account" className="rounded-lg border border-neutral-200 p-3">
              <h2 className="mb-3 text-[13px] font-semibold">{t("crm.aff.accountMgmt")}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block text-[11px] text-neutral-500 sm:col-span-2">
                  {t("crm.aff.token")}
                  <div className="mt-1 flex gap-1">
                    <input readOnly value={form.token} className={`${inputCls} font-mono`} />
                    <button type="button" onClick={copyToken} className={btn}>{copied ? t("crm.aff.copied") : t("crm.aff.copy")}</button>
                    {canWrite && <button type="button" onClick={regen} className={btn}>{t("crm.aff.regenerate")}</button>}
                  </div>
                </label>
                <label className="block text-[11px] text-neutral-500">{t("crm.aff.active")}{yesNo(form.active, (v) => set("active", v))}</label>
                <label className="block text-[11px] text-neutral-500">{t("crm.aff.allowDup")}{yesNo(form.allowDuplicatePhones, (v) => set("allowDuplicatePhones", v))}</label>
                <label className="block text-[11px] text-neutral-500">{t("crm.aff.fraud")}{yesNo(form.checkOnFraud, (v) => set("checkOnFraud", v))}</label>
                <label className="block text-[11px] text-neutral-500 sm:col-span-2 lg:col-span-3">
                  {t("crm.aff.allowedIps")}
                  <textarea disabled={!canWrite} value={form.allowedIps} onChange={(e) => set("allowedIps", e.target.value)} rows={3} className={`${inputCls} font-mono`} />
                  <span className="mt-1 block text-neutral-400">{t("crm.aff.ipHint")}</span>
                </label>
                <label className="block text-[11px] text-neutral-500 sm:col-span-2 lg:col-span-3">
                  {t("crm.aff.allowedSources")}
                  <textarea disabled={!canWrite} value={form.allowedSources} onChange={(e) => set("allowedSources", e.target.value)} rows={2} className={inputCls} />
                  <span className="mt-1 block text-neutral-400">{t("crm.aff.sourcesHint")}</span>
                </label>
                <label className="block text-[11px] text-neutral-500 sm:col-span-2 lg:col-span-3">
                  {t("crm.aff.note")}
                  <textarea disabled={!canWrite} value={form.note} onChange={(e) => set("note", e.target.value)} rows={3} className={inputCls} />
                </label>
                <label className="block text-[11px] text-neutral-500 sm:col-span-2 lg:col-span-3">
                  {t("crm.aff.callback")}
                  <input disabled={!canWrite} value={form.callbackUrl} onChange={(e) => set("callbackUrl", e.target.value)} className={inputCls} placeholder="https://your-tracker.com/postback?uuid={uuid}&event={event}&status={status}&ftd={ftd}" />
                  <span className="mt-1 block text-neutral-400">{t("crm.aff.callbackHint")}</span>
                </label>
              </div>
              {canWrite && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="submit" className="rounded bg-neutral-900 px-3 py-1 text-[11px] text-white">{t("crm.ui.save")}</button>
                  <button type="button" onClick={removeAccount} className="rounded bg-red-600 px-3 py-1 text-[11px] text-white">{t("crm.aff.delete")}</button>
                  {msg && <span className="text-[11px] text-neutral-600">{msg}</span>}
                </div>
              )}
              {!canWrite && msg && <p className="mt-2 text-[11px] text-neutral-600">{msg}</p>}
            </section>
          </form>
          <section id="streams" className="mt-3 rounded-lg border border-neutral-200 p-3">
            <h2 className="mb-3 text-[13px] font-semibold">{t("crm.aff.streams")}</h2>
            {canWrite && (
              <form onSubmit={addStream} className="mb-3 flex flex-wrap items-end gap-2 text-[11px]">
                <label>{t("crm.aff.streamName")}<br /><input required value={streamForm.name} onChange={(e) => setStreamForm({ ...streamForm, name: e.target.value })} className="rounded border border-neutral-300 px-2 py-1" /></label>
                <label>{t("crm.aff.streamSource")}<br /><input required value={streamForm.declaredSource} onChange={(e) => setStreamForm({ ...streamForm, declaredSource: e.target.value })} placeholder="google" className="rounded border border-neutral-300 px-2 py-1" /></label>
                <label>{t("crm.aff.landing")}<br /><input value={streamForm.landingUrl} onChange={(e) => setStreamForm({ ...streamForm, landingUrl: e.target.value })} className="w-56 rounded border border-neutral-300 px-2 py-1" /></label>
                <button type="submit" className="rounded bg-neutral-900 px-3 py-1 text-white">{t("crm.aff.addStream")}</button>
              </form>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-neutral-50 text-neutral-500">
                  <tr>
                    <th className="px-2 py-2">{t("crm.aff.streamName")}</th>
                    <th className="px-2 py-2">{t("crm.aff.declared")}</th>
                    <th className="px-2 py-2">{t("crm.aff.landing")}</th>
                    <th className="px-2 py-2">{t("crm.aff.active")}</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {streams.map((s) => (
                    <tr key={s.id} className="border-t border-neutral-100">
                      <td className="px-2 py-1.5">{s.name}</td>
                      <td className="px-2 py-1.5">{s.declaredSource}</td>
                      <td className="max-w-[240px] truncate px-2 py-1.5" title={s.landingUrl || ""}>{s.landingUrl || "—"}</td>
                      <td className="px-2 py-1.5">{s.active ? t("crm.ui.yes") : t("crm.ui.no")}</td>
                      <td className="px-2 py-1.5">{canWrite && <button type="button" onClick={() => removeStream(s.id)} className="rounded border border-red-300 px-2 py-1 text-red-700">{t("crm.aff.delete")}</button>}</td>
                    </tr>
                  ))}
                  {!streams.length && (
                    <tr><td colSpan={5} className="px-2 py-4 text-center text-neutral-500">{t("crm.aff.emptyStreams")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <section id="origin" className="mt-3 rounded-lg border border-neutral-200 p-3">
            <h2 className="mb-3 text-[13px] font-semibold">{t("crm.aff.origin")}</h2>
            <h3 className="mb-2 text-[11px] font-semibold text-neutral-500">{t("crm.aff.breakdown")}</h3>
            <div className="mb-4 overflow-x-auto rounded-lg border border-neutral-200">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-neutral-50 text-neutral-500">
                  <tr>
                    <th className="px-2 py-2">{t("crm.aff.declared")}</th>
                    <th className="px-2 py-2">{t("crm.aff.detected")}</th>
                    <th className="px-2 py-2">{t("crm.aff.leads")}</th>
                    <th className="px-2 py-2">{t("crm.aff.mismatch")}</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((b) => (
                    <tr key={`${b.declared}-${b.detected}`} className="border-t border-neutral-100">
                      <td className="px-2 py-1.5">{b.declared}</td>
                      <td className="px-2 py-1.5">{b.detected}</td>
                      <td className="px-2 py-1.5 tabular-nums">{b.leads}</td>
                      <td className="px-2 py-1.5">
                        <span className={`inline-block rounded border px-1.5 py-0.5 ${b.mismatches ? "border-red-200 bg-red-50/40" : "border-neutral-200 bg-white"}`}>
                          {b.mismatches} ({pct(b.mismatches, b.leads)}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!breakdown.length && <tr><td colSpan={4} className="px-2 py-4 text-center text-neutral-500">{t("crm.aff.noLeads")}</td></tr>}
                </tbody>
              </table>
            </div>
            <h3 className="mb-2 text-[11px] font-semibold text-neutral-500">{t("crm.aff.perLead")}</h3>
            {truncated && <p className="mb-2 text-[11px] text-neutral-500">{t("crm.aff.truncated")}</p>}
            <div className="overflow-x-auto rounded-lg border border-neutral-200">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-neutral-50 text-neutral-500">
                  <tr>
                    {[t("crm.aff.name"), t("crm.aff.email"), t("crm.aff.declared"), t("crm.aff.detected"), t("crm.aff.mismatch"), t("crm.aff.valid"), t("crm.aff.leadsFtd"), t("crm.aff.referrer"), t("crm.aff.inApp"), t("crm.aff.geo")].map((h) => (
                      <th key={h} className="whitespace-nowrap px-2 py-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} className="border-t border-neutral-100 align-top">
                      <td className="whitespace-nowrap px-2 py-1.5">
                        <Link href={`/izcrm/traders/${l.id}`} className="underline decoration-neutral-300 underline-offset-2">{l.name || "—"}</Link>
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5">{l.email || "—"}</td>
                      <td className="whitespace-nowrap px-2 py-1.5">{l.declared || "—"}</td>
                      <td className="whitespace-nowrap px-2 py-1.5">
                        {l.detected || "—"}
                        {clicks(l) && <div className="text-[10px] text-neutral-500">{clicks(l)}</div>}
                        {l.fraudFlag && <div className="text-[10px] text-red-700">{t("crm.aff.fraudLead")}</div>}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5">
                        <span className={`inline-block rounded border px-1.5 py-0.5 ${l.mismatch ? "border-red-200 bg-red-50/40" : "border-neutral-200 bg-white"}`}>
                          {l.mismatch ? t("crm.ui.yes") : t("crm.ui.no")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5">{l.invalid ? t("crm.aff.invalid") : t("crm.aff.valid")}{l.invalid && l.reason ? ` · ${l.reason}` : ""}</td>
                      <td className="whitespace-nowrap px-2 py-1.5">{l.ftd ? t("crm.ui.yes") : t("crm.ui.no")}</td>
                      <td className="max-w-[180px] truncate px-2 py-1.5" title={l.referrer || ""}>{l.referrer || "—"}</td>
                      <td className="whitespace-nowrap px-2 py-1.5">{l.inApp || "—"}</td>
                      <td className="whitespace-nowrap px-2 py-1.5">{[l.ip, l.country, l.city].filter(Boolean).join(" · ") || "—"}</td>
                    </tr>
                  ))}
                  {!leads.length && <tr><td colSpan={10} className="px-2 py-4 text-center text-neutral-500">{t("crm.aff.noLeads")}</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
