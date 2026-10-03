"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/crm/StubPage";

type Tpl = {
  id: string;
  name: string;
  subject: string;
  body: string;
  deskName: string | null;
  active: boolean;
  updatedAt: string;
};

export default function MailPage() {
  const { i18n, deskName } = useCrmLabels();
  const [templates, setTemplates] = useState<Tpl[]>([]);
  const [form, setForm] = useState({ name: "", subject: "", body: "", deskName: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/mail");
    if (!res.ok) return;
    const data = await res.json();
    setTemplates(data.templates || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const payload = editId
        ? { action: "update", id: editId, ...form, active: true }
        : { action: "create", ...form };
      const res = await fetch("/api/admin/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setForm({ name: "", subject: "", body: "", deskName: "" });
      setEditId(null);
      setMsg(editId ? i18n("crm.mail.updated") : i18n("crm.mail.added"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await fetch("/api/admin/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  function startEdit(t: Tpl) {
    setEditId(t.id);
    setForm({ name: t.name, subject: t.subject, body: t.body, deskName: t.deskName || "" });
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">{i18n("crm.nav.mail")}</h1>
      <p className="mb-3 text-[11px] text-neutral-500">
        {i18n("crm.mail.intro")}
      </p>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <div key={t.id} className="rounded-lg border border-neutral-200 bg-[#ffffff] p-3">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold">{t.name}</h2>
                <StatusBadge status={t.active ? "ACTIVE" : "CLOSED"} />
              </div>
              <p className="text-[11px] text-neutral-500">{i18n("crm.mail.subject")}: {t.subject}</p>
              <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-[11px] text-neutral-600">{t.body}</p>
              <p className="mt-2 text-[10px] text-neutral-400">{i18n("crm.mail.desk")}: {deskName(t.deskName) === "—" ? (t.deskName || "—") : deskName(t.deskName)}</p>
              <div className="mt-2 flex gap-2 text-[10px]">
                <button type="button" onClick={() => startEdit(t)} className="text-sky-400 hover:underline">
                  {i18n("crm.ui.edit")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(t.id)}
                  className="text-red-400 hover:underline"
                >
                  {i18n("crm.ui.delete")}
                </button>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <p className="col-span-2 rounded-lg border border-dashed border-neutral-200 px-3 py-8 text-center text-xs text-neutral-500">
              {i18n("crm.mail.none")}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-neutral-200 bg-[#ffffff] p-3">
          <h2 className="mb-2 text-xs font-semibold text-neutral-600">
            {editId ? i18n("crm.mail.edit") : i18n("crm.mail.new")}
          </h2>
          <div className="space-y-2 text-xs">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={i18n("crm.ui.name")}
              className="w-full rounded border border-neutral-300 bg-[#fafafa] px-2 py-1.5"
            />
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder={i18n("crm.ui.subject")}
              className="w-full rounded border border-neutral-300 bg-[#fafafa] px-2 py-1.5"
            />
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={8}
              placeholder={i18n("crm.ui.body")}
              className="w-full rounded border border-neutral-300 bg-[#fafafa] px-2 py-1.5 font-mono text-[11px]"
            />
            <input
              value={form.deskName}
              onChange={(e) => setForm({ ...form, deskName: e.target.value })}
              placeholder={i18n("crm.mail.deskPh")}
              className="w-full rounded border border-neutral-300 bg-[#fafafa] px-2 py-1.5"
            />
            <button
              type="button"
              disabled={busy}
              onClick={save}
              className="w-full rounded bg-black text-white px-3 py-1.5 font-medium hover:bg-neutral-800 disabled:opacity-50"
            >
              {editId ? i18n("crm.ui.update") : i18n("crm.ui.save")}
            </button>
            {editId && (
              <button
                type="button"
                onClick={() => {
                  setEditId(null);
                  setForm({ name: "", subject: "", body: "", deskName: "" });
                }}
                className="w-full text-[11px] text-neutral-500 hover:text-neutral-700"
              >
                {i18n("crm.ui.cancel")}
              </button>
            )}
            {msg && <p className="text-[11px] text-neutral-500">{msg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
