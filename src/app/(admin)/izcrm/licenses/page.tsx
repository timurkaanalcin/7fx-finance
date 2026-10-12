"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type L = { id: string; regulator: string; number: string; entity: string; registerUrl: string; logo: string | null; active: boolean; sortOrder: number };

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return reject(new Error("PNG, JPG, WEBP veya GIF seçin"));
    if (file.size > 500 * 1024) return reject(new Error("Logo en fazla 500 KB olmalı"));
    const r = new FileReader();
    r.onerror = () => reject(new Error("Dosya okunamadı"));
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(file);
  });
}

const empty = { regulator: "", number: "", entity: "", registerUrl: "" };
const inp = "mt-1 w-full rounded border border-neutral-200 px-2 py-1.5";
const cell = "w-full rounded border border-transparent px-1 py-0.5 hover:border-neutral-200";

export default function AdminLicensesPage() {
  const [list, setList] = useState<L[]>([]);
  const [form, setForm] = useState({ ...empty });
  const [logo, setLogo] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragId = useRef<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/licenses", { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d.error || "Yüklenemedi");
    setList(d.licenses || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function call(method: string, body?: unknown, qs = "") {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/licenses${qs}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg(d.error || "Hata"); return null; }
      return d;
    } finally { setBusy(false); }
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    if (!form.regulator.trim() || !form.number.trim() || !form.entity.trim()) return setMsg("Kurum, lisans no ve şirket adı gerekli");
    if (!/^https:\/\//i.test(form.registerUrl.trim())) return setMsg("Resmi kayıt URL'si https:// ile başlamalı");
    if (await call("POST", { ...form, logo, active: true })) {
      setForm({ ...empty }); setLogo(null);
      if (fileRef.current) fileRef.current.value = "";
      setMsg("Lisans eklendi");
      load();
    }
  }

  async function saveOrder(next: L[]) {
    setList(next);
    const d = await call("PATCH", { order: next.map((s) => s.id) });
    if (d) { setList(d.licenses); setMsg("Sıralama kaydedildi"); }
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
    if (!confirm(`"${s.regulator} ${s.number}" silinsin mi?`)) return;
    if (await call("DELETE", undefined, `?id=${encodeURIComponent(s.id)}`)) { setList((l) => l.filter((x) => x.id !== s.id)); setMsg("Silindi"); }
  }

  return (
    <div className="p-4 text-[#111111]">
      <h1 className="text-lg font-semibold">Lisanslar</h1>
      <p className="mb-4 text-xs text-neutral-500">
        Yalnızca gerçek ve doğrulanabilir lisansları ekleyin. Aktif olanlar ana sayfada bu sırayla, resmi kayıt bağlantısıyla gösterilir. Aktif lisans yoksa bölüm gizlenir.
      </p>

      <form onSubmit={onAdd} className="mb-6 grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.3fr_1fr_auto] lg:items-end">
        <label className="text-xs"><span className="text-neutral-500">Düzenleyici kurum *</span>
          <input value={form.regulator} onChange={(e) => setForm({ ...form, regulator: e.target.value })} className={inp} /></label>
        <label className="text-xs"><span className="text-neutral-500">Lisans no *</span>
          <input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className={inp} /></label>
        <label className="text-xs"><span className="text-neutral-500">Tüzel kişi (şirket) *</span>
          <input value={form.entity} onChange={(e) => setForm({ ...form, entity: e.target.value })} className={inp} /></label>
        <label className="text-xs"><span className="text-neutral-500">Resmi kayıt URL&apos;si (https) *</span>
          <input value={form.registerUrl} onChange={(e) => setForm({ ...form, registerUrl: e.target.value })} placeholder="https://" className={inp} /></label>
        <label className="text-xs"><span className="text-neutral-500">Logo (opsiyonel, ≤500 KB)</span>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="mt-1 w-full text-xs"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return setLogo(null);
              try { setLogo(await readImage(f)); setMsg(""); } catch (err) { setLogo(null); setMsg((err as Error).message); }
            }} /></label>
        <button disabled={busy} className="rounded-full bg-[#111111] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">Ekle</button>
      </form>

      {msg && <p className="mb-3 text-xs text-neutral-600">{msg}</p>}

      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">Henüz lisans yok. Ana sayfadaki Lisanslar bölümü gizli.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((s, i) => (
            <li key={s.id} draggable onDragStart={() => (dragId.current = s.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(s.id)}
              className={`flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 ${s.active ? "" : "opacity-50"}`}>
              <span className="cursor-grab select-none text-neutral-400" title="Sürükle">⋮⋮</span>
              <span className="w-6 text-xs tabular-nums text-neutral-500">{i + 1}</span>
              <label className="flex h-10 w-24 cursor-pointer items-center justify-center rounded bg-neutral-50 text-[10px] text-neutral-400" title="Logoyu değiştir">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {s.logo ? <img src={s.logo} alt={s.regulator} className="h-10 w-24 object-contain" /> : "Logo yok"}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden"
                  onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { patch(s.id, { logo: await readImage(f) }); } catch (err) { setMsg((err as Error).message); } }} />
              </label>
              <div className="grid min-w-[260px] flex-1 gap-0.5 sm:grid-cols-3">
                <input defaultValue={s.regulator} onBlur={(e) => e.target.value.trim() !== s.regulator && patch(s.id, { regulator: e.target.value })} className={`${cell} text-sm font-semibold`} />
                <input defaultValue={s.number} onBlur={(e) => e.target.value.trim() !== s.number && patch(s.id, { number: e.target.value })} className={`${cell} text-sm`} />
                <input defaultValue={s.entity} onBlur={(e) => e.target.value.trim() !== s.entity && patch(s.id, { entity: e.target.value })} className={`${cell} text-sm`} />
                <input defaultValue={s.registerUrl} onBlur={(e) => e.target.value.trim() !== s.registerUrl && patch(s.id, { registerUrl: e.target.value })} className={`${cell} text-xs text-neutral-500 sm:col-span-3`} />
              </div>
              {s.logo && <button type="button" onClick={() => patch(s.id, { logo: null })} className="text-[11px] text-neutral-500 underline">Logoyu kaldır</button>}
              <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={s.active} onChange={(e) => patch(s.id, { active: e.target.checked })} />Aktif</label>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(s.id, -1)} disabled={busy || i === 0} className="rounded border border-neutral-200 px-2 py-1 text-xs disabled:opacity-30">↑</button>
                <button type="button" onClick={() => move(s.id, 1)} disabled={busy || i === list.length - 1} className="rounded border border-neutral-200 px-2 py-1 text-xs disabled:opacity-30">↓</button>
                <button type="button" onClick={() => remove(s)} disabled={busy} className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">Sil</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
