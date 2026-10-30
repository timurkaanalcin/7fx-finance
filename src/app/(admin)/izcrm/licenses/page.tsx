"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ListPlaceholder, listPhase } from "@/components/crm/CrmStates";
import { useCrmLabels } from "@/lib/i18n/crm-labels";

type L = {
  id: string;
  regulator: string;
  number: string;
  entity: string;
  registerUrl: string;
  logo: string | null;
  active: boolean;
  sortOrder: number;
  licenseType: string | null;
  jurisdiction: string | null;
  status: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
  scope: string | null;
  address: string | null;
};

function day(value: string | null | undefined): string {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return reject(new Error("type"));
    if (file.size > 500 * 1024) return reject(new Error("size"));
    const r = new FileReader();
    r.onerror = () => reject(new Error("read"));
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(file);
  });
}

function imgMessage(i18n: (key: string) => string, code: string): string {
  if (code === "type") return i18n("gap.img.type");
  if (code === "size") return i18n("gap.img.size");
  if (code === "read") return i18n("gap.img.read");
  return i18n("gap.err");
}

const empty = {
  regulator: "",
  number: "",
  entity: "",
  registerUrl: "",
  licenseType: "",
  jurisdiction: "",
  status: "",
  issuedOn: "",
  expiresOn: "",
  scope: "",
  address: "",
};
const inp = "mt-1 w-full rounded border border-neutral-200 px-2 py-1.5";
const cell = "w-full rounded border border-transparent px-1 py-0.5 hover:border-neutral-200";

export default function AdminLicensesPage() {
  const { i18n } = useCrmLabels();
  const [list, setList] = useState<L[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [logo, setLogo] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragId = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/licenses", { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setFailed(true);
        setMsg(d.error || i18n("crm.ui.loadFailed"));
        return;
      }
      setList(d.licenses || []);
      setFailed(false);
    } catch {
      setFailed(true);
      setMsg(i18n("crm.ui.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [i18n]);
  useEffect(() => { load(); }, [load]);

  async function call(method: string, body?: unknown, qs = "") {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/licenses${qs}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg(d.error || i18n("gap.err")); return null; }
      return d;
    } finally { setBusy(false); }
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    if (!form.regulator.trim() || !form.number.trim() || !form.entity.trim()) return setMsg(i18n("gap.lic.need"));
    if (!/^https:\/\//i.test(form.registerUrl.trim())) return setMsg(i18n("gap.lic.https"));
    if (await call("POST", { ...form, logo, active: true })) {
      setForm({ ...empty }); setLogo(null);
      if (fileRef.current) fileRef.current.value = "";
      setMsg(i18n("gap.lic.added"));
      load();
    }
  }

  async function saveOrder(next: L[]) {
    setList(next);
    const d = await call("PATCH", { order: next.map((s) => s.id) });
    if (d) { setList(d.licenses); setMsg(i18n("gap.spon.ordered")); }
  }
  function onDrop(target: string) {
    const from = dragId.current; dragId.current = null;
    if (!from || from === target) return;
    const next = [...list];
    const [m] = next.splice(next.findIndex((s) => s.id === from), 1);
    next.splice(next.findIndex((s) => s.id === target), 0, m);
    saveOrder(next);
  }
  function move(id: string, dir: -1 | 1) {
    const i = list.findIndex((s) => s.id === id), j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list]; [next[i], next[j]] = [next[j], next[i]];
    saveOrder(next);
  }
  async function patch(id: string, data: Partial<L>) {
    const d = await call("PATCH", { id, ...data });
    if (d) setList((l) => l.map((s) => (s.id === id ? { ...s, ...d.license } : s)));
    else load();
  }
  async function remove(s: L) {
    if (!confirm(i18n("gap.lic.confirm").replace("{name}", `${s.regulator} ${s.number}`))) return;
    if (await call("DELETE", undefined, `?id=${encodeURIComponent(s.id)}`)) { setList((l) => l.filter((x) => x.id !== s.id)); setMsg(i18n("gap.spon.deleted")); }
  }

  return (
    <div className="p-4 text-[#111111]">
      <h1 className="text-lg font-semibold">{i18n("gap.lic.title")}</h1>
      <p className="mb-4 text-xs text-neutral-500">{i18n("gap.lic.lead")}</p>

      <form onSubmit={onAdd} className="mb-6 space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs"><span className="text-neutral-500">{i18n("gap.lic.regulator")}</span>
            <input value={form.regulator} onChange={(e) => setForm({ ...form, regulator: e.target.value })} className={inp} /></label>
          <label className="text-xs"><span className="text-neutral-500">{i18n("gap.lic.number")}</span>
            <input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className={inp} /></label>
          <label className="text-xs"><span className="text-neutral-500">{i18n("gap.lic.entity")}</span>
            <input value={form.entity} onChange={(e) => setForm({ ...form, entity: e.target.value })} className={inp} /></label>
          <label className="text-xs sm:col-span-2"><span className="text-neutral-500">{i18n("gap.lic.url")}</span>
            <input value={form.registerUrl} onChange={(e) => setForm({ ...form, registerUrl: e.target.value })} placeholder="https://" className={inp} /></label>
          <label className="text-xs"><span className="text-neutral-500">{i18n("gap.lic.logo")}</span>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="mt-1 w-full text-xs"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return setLogo(null);
                try { setLogo(await readImage(f)); setMsg(""); } catch (err) { setLogo(null); setMsg(imgMessage(i18n, (err as Error).message)); }
              }} /></label>
        </div>
        <p className="text-xs text-neutral-500">{i18n("gap.lic.optional")}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs"><span className="text-neutral-500">{i18n("gap.lic.status")}</span>
            <input value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inp} /></label>
          <label className="text-xs"><span className="text-neutral-500">{i18n("gap.lic.type")}</span>
            <input value={form.licenseType} onChange={(e) => setForm({ ...form, licenseType: e.target.value })} className={inp} /></label>
          <label className="text-xs"><span className="text-neutral-500">{i18n("gap.lic.jurisdiction")}</span>
            <input value={form.jurisdiction} onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })} className={inp} /></label>
          <label className="text-xs"><span className="text-neutral-500">{i18n("gap.lic.issued")}</span>
            <input type="date" value={form.issuedOn} onChange={(e) => setForm({ ...form, issuedOn: e.target.value })} className={inp} /></label>
          <label className="text-xs"><span className="text-neutral-500">{i18n("gap.lic.expires")}</span>
            <input type="date" value={form.expiresOn} onChange={(e) => setForm({ ...form, expiresOn: e.target.value })} className={inp} /></label>
          <label className="text-xs sm:col-span-2 lg:col-span-3"><span className="text-neutral-500">{i18n("gap.lic.scope")}</span>
            <textarea value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} rows={2} className={inp} /></label>
          <label className="text-xs sm:col-span-2 lg:col-span-3"><span className="text-neutral-500">{i18n("gap.lic.address")}</span>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className={inp} /></label>
        </div>
        <button disabled={busy} className="rounded-full bg-[#111111] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">{i18n("gap.spon.add")}</button>
      </form>

      {msg && <p className="mb-3 text-xs text-neutral-600">{msg}</p>}

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center">
          <ListPlaceholder
            phase={listPhase(failed, loading)}
            empty={i18n("crm.lic.empty")}
            title={i18n("crm.ui.loadFailed")}
            retry={i18n("crm.ui.tryAgain")}
            loading={i18n("crm.ui.loading")}
            onRetry={() => void load()}
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((s, i) => (
            <li key={s.id} draggable onDragStart={() => (dragId.current = s.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(s.id)}
              className={`flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 ${s.active ? "" : "opacity-50"}`}>
              <span className="cursor-grab select-none text-neutral-400" title={i18n("gap.spon.drag")}>⋮⋮</span>
              <span className="w-6 text-xs tabular-nums text-neutral-500">{i + 1}</span>
              <label className="flex h-10 w-24 cursor-pointer items-center justify-center rounded bg-neutral-50 text-[10px] text-neutral-400" title={i18n("gap.lic.changeLogo")}>
                {/* eslint-disable-next-line @next/next/no-img-element -- static bitmap; next/image would change this layout */}
                {s.logo ? <img src={s.logo} alt={s.regulator} className="h-10 w-24 object-contain" /> : i18n("gap.lic.noLogo")}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden"
                  onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { patch(s.id, { logo: await readImage(f) }); } catch (err) { setMsg(imgMessage(i18n, (err as Error).message)); } }} />
              </label>
              <div className="grid min-w-[260px] flex-1 gap-0.5 sm:grid-cols-3">
                <input defaultValue={s.regulator} onBlur={(e) => e.target.value.trim() !== s.regulator && patch(s.id, { regulator: e.target.value })} className={`${cell} text-sm font-semibold`} />
                <input defaultValue={s.number} onBlur={(e) => e.target.value.trim() !== s.number && patch(s.id, { number: e.target.value })} className={`${cell} text-sm`} />
                <input defaultValue={s.entity} onBlur={(e) => e.target.value.trim() !== s.entity && patch(s.id, { entity: e.target.value })} className={`${cell} text-sm`} />
                <input defaultValue={s.registerUrl} onBlur={(e) => e.target.value.trim() !== s.registerUrl && patch(s.id, { registerUrl: e.target.value })} className={`${cell} text-xs text-neutral-500 sm:col-span-3`} />
                <input defaultValue={s.status ?? ""} placeholder={i18n("gap.lic.status")} onBlur={(e) => e.target.value.trim() !== (s.status ?? "") && patch(s.id, { status: e.target.value })} className={`${cell} text-sm`} />
                <input defaultValue={s.licenseType ?? ""} placeholder={i18n("gap.lic.type")} onBlur={(e) => e.target.value.trim() !== (s.licenseType ?? "") && patch(s.id, { licenseType: e.target.value })} className={`${cell} text-sm`} />
                <input defaultValue={s.jurisdiction ?? ""} placeholder={i18n("gap.lic.jurisdiction")} onBlur={(e) => e.target.value.trim() !== (s.jurisdiction ?? "") && patch(s.id, { jurisdiction: e.target.value })} className={`${cell} text-sm`} />
                <label className="text-[11px] text-neutral-500">{i18n("gap.lic.issued")}
                  <input type="date" defaultValue={day(s.issuedOn)} onBlur={(e) => e.target.value !== day(s.issuedOn) && patch(s.id, { issuedOn: e.target.value })} className={cell} /></label>
                <label className="text-[11px] text-neutral-500">{i18n("gap.lic.expires")}
                  <input type="date" defaultValue={day(s.expiresOn)} onBlur={(e) => e.target.value !== day(s.expiresOn) && patch(s.id, { expiresOn: e.target.value })} className={cell} /></label>
                <textarea defaultValue={s.scope ?? ""} placeholder={i18n("gap.lic.scope")} rows={2} onBlur={(e) => e.target.value.trim() !== (s.scope ?? "") && patch(s.id, { scope: e.target.value })} className={`${cell} text-sm sm:col-span-3`} />
                <textarea defaultValue={s.address ?? ""} placeholder={i18n("gap.lic.address")} rows={2} onBlur={(e) => e.target.value.trim() !== (s.address ?? "") && patch(s.id, { address: e.target.value })} className={`${cell} text-sm sm:col-span-3`} />
              </div>
              {s.logo && <button type="button" onClick={() => patch(s.id, { logo: null })} className="text-[11px] text-neutral-500 underline">{i18n("gap.lic.removeLogo")}</button>}
              <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={s.active} onChange={(e) => patch(s.id, { active: e.target.checked })} />{i18n("gap.spon.active")}</label>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(s.id, -1)} disabled={busy || i === 0} className="rounded border border-neutral-200 px-2 py-1 text-xs disabled:opacity-30">↑</button>
                <button type="button" onClick={() => move(s.id, 1)} disabled={busy || i === list.length - 1} className="rounded border border-neutral-200 px-2 py-1 text-xs disabled:opacity-30">↓</button>
                <button type="button" onClick={() => remove(s)} disabled={busy} className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">{i18n("gap.spon.delete")}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
