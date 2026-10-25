"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ListPlaceholder, listPhase } from "@/components/crm/CrmStates";
import { useCrmLabels } from "@/lib/i18n/crm-labels";

type Sponsor = {
  id: string;
  name: string;
  url: string | null;
  logo: string;
  logoW: number;
  logoH: number;
  priority: number;
  active: boolean;
  sortOrder: number;
};

function readImage(file: File): Promise<{ data: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return reject(new Error("type"));
    if (file.size > 500 * 1024) return reject(new Error("size"));
    const r = new FileReader();
    r.onerror = () => reject(new Error("read"));
    r.onload = () => {
      const data = String(r.result);
      const img = new Image();
      img.onload = () => resolve({ data, w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => reject(new Error("invalid"));
      img.src = data;
    };
    r.readAsDataURL(file);
  });
}

function imgMessage(i18n: (key: string) => string, code: string): string {
  if (code === "type") return i18n("gap.img.type");
  if (code === "size") return i18n("gap.img.size");
  if (code === "read") return i18n("gap.img.read");
  if (code === "invalid") return i18n("gap.img.invalid");
  return i18n("gap.err");
}

export default function AdminSponsorsPage() {
  const { i18n } = useCrmLabels();
  const [list, setList] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [priority, setPriority] = useState(5);
  const [logo, setLogo] = useState<{ data: string; w: number; h: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragId = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/sponsors", { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setFailed(true);
        setMsg(d.error || i18n("crm.ui.loadFailed"));
        return;
      }
      setList(d.sponsors || []);
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
      const r = await fetch(`/api/admin/sponsors${qs}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg(d.error || i18n("gap.err")); return null; }
      return d;
    } finally { setBusy(false); }
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    if (!name.trim() || !logo) return setMsg(i18n("gap.spon.need"));
    const d = await call("POST", { name, url, priority, logo: logo.data, logoW: logo.w, logoH: logo.h, active: true });
    if (d) {
      setName(""); setUrl(""); setPriority(5); setLogo(null);
      if (fileRef.current) fileRef.current.value = "";
      setMsg(i18n("gap.spon.added"));
      load();
    }
  }

  async function saveOrder(next: Sponsor[]) {
    setList(next);
    const d = await call("PATCH", { order: next.map((s) => s.id) });
    if (d) { setList(d.sponsors); setMsg(i18n("gap.spon.ordered")); }
  }

  function onDrop(targetId: string) {
    const from = dragId.current;
    dragId.current = null;
    if (!from || from === targetId) return;
    const next = [...list];
    const fi = next.findIndex((s) => s.id === from);
    const [moved] = next.splice(fi, 1);
    next.splice(next.findIndex((s) => s.id === targetId), 0, moved);
    saveOrder(next);
  }

  function move(id: string, dir: -1 | 1) {
    const i = list.findIndex((s) => s.id === id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    saveOrder(next);
  }

  async function aiSort() {
    const d = await call("PATCH", { ai: true });
    if (d) { setList(d.sponsors); setMsg(i18n("gap.spon.ai")); }
  }

  async function patch(id: string, data: Partial<Sponsor>) {
    const d = await call("PATCH", { id, ...data });
    if (d) setList((l) => l.map((s) => (s.id === id ? { ...s, ...d.sponsor } : s)));
  }

  async function remove(s: Sponsor) {
    if (!confirm(i18n("gap.spon.confirm").replace("{name}", s.name))) return;
    if (await call("DELETE", undefined, `?id=${encodeURIComponent(s.id)}`)) {
      setList((l) => l.filter((x) => x.id !== s.id));
      setMsg(i18n("gap.spon.deleted"));
    }
  }

  return (
    <div className="p-4 text-[#111111]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{i18n("gap.spon.title")}</h1>
          <p className="text-xs text-neutral-500">{i18n("gap.spon.lead")}</p>
        </div>
        <button
          type="button"
          onClick={aiSort}
          disabled={busy || list.length < 2}
          className="rounded-full bg-[#111111] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          {i18n("gap.spon.aiSort")}
        </button>
      </div>

      <form onSubmit={onAdd} className="mb-6 grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-[1fr_1fr_110px_1fr_auto] sm:items-end">
        <label className="text-xs">
          <span className="text-neutral-500">{i18n("gap.spon.name")}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded border border-neutral-200 px-2 py-1.5" />
        </label>
        <label className="text-xs">
          <span className="text-neutral-500">{i18n("gap.spon.url")}</span>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="mt-1 w-full rounded border border-neutral-200 px-2 py-1.5" />
        </label>
        <label className="text-xs">
          <span className="text-neutral-500">{i18n("gap.spon.priority")}</span>
          <input type="number" min={0} max={10} value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="mt-1 w-full rounded border border-neutral-200 px-2 py-1.5" />
        </label>
        <label className="text-xs">
          <span className="text-neutral-500">{i18n("gap.spon.logo")}</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return setLogo(null);
              try { setLogo(await readImage(f)); setMsg(""); } catch (err) { setLogo(null); setMsg(imgMessage(i18n, (err as Error).message)); }
            }}
            className="mt-1 w-full text-xs"
          />
        </label>
        <button disabled={busy} className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-40">
          {i18n("gap.spon.add")}
        </button>
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element -- static bitmap; next/image would change this layout
          <img src={logo.data} alt={i18n("gap.spon.preview")} className="h-10 w-auto object-contain sm:col-span-5" />
        )}
      </form>

      {msg && <p className="mb-3 text-xs text-neutral-600">{msg}</p>}

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center">
          <ListPlaceholder
            phase={listPhase(failed, loading)}
            empty={i18n("crm.spon.empty")}
            title={i18n("crm.ui.loadFailed")}
            retry={i18n("crm.ui.tryAgain")}
            loading={i18n("crm.ui.loading")}
            onRetry={() => void load()}
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((s, i) => (
            <li
              key={s.id}
              draggable
              onDragStart={() => (dragId.current = s.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(s.id)}
              className={`flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3 ${s.active ? "border-neutral-200" : "border-neutral-200 opacity-50"}`}
            >
              <span className="cursor-grab select-none text-neutral-400" title={i18n("gap.spon.drag")}>⋮⋮</span>
              <span className="w-6 text-xs tabular-nums text-neutral-500">{i + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element -- static bitmap; next/image would change this layout */}
              <img src={s.logo} alt={s.name} className="h-10 w-28 rounded bg-neutral-50 object-contain" />
              <div className="min-w-[140px] flex-1">
                <input
                  defaultValue={s.name}
                  onBlur={(e) => e.target.value.trim() !== s.name && patch(s.id, { name: e.target.value })}
                  className="w-full rounded border border-transparent px-1 py-0.5 text-sm font-semibold hover:border-neutral-200"
                />
                <input
                  defaultValue={s.url || ""}
                  placeholder={i18n("gap.spon.noUrl")}
                  onBlur={(e) => (e.target.value || "") !== (s.url || "") && patch(s.id, { url: e.target.value })}
                  className="w-full rounded border border-transparent px-1 py-0.5 text-xs text-neutral-500 hover:border-neutral-200"
                />
              </div>
              <label className="text-xs text-neutral-500">
                {i18n("gap.spon.priorityShort")}
                <input
                  type="number" min={0} max={10} defaultValue={s.priority}
                  onBlur={(e) => Number(e.target.value) !== s.priority && patch(s.id, { priority: Number(e.target.value) })}
                  className="ml-1 w-12 rounded border border-neutral-200 px-1 py-0.5"
                />
              </label>
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={s.active} onChange={(e) => patch(s.id, { active: e.target.checked })} />
                {i18n("gap.spon.active")}
              </label>
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
