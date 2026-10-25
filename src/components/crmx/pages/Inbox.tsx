"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { filterRows, queryString } from "@/lib/crmx/filters";
import { formatWhen } from "@/lib/crmx/format";
import { useI18n } from "@/lib/i18n/context";
import { crmxGet, crmxPost } from "../api";
import { useCrmxAccess } from "../Shell";
import { ClassicLink, EmptyState, ErrorNote, PageHead } from "../ui";

type Message = { id: string; body?: string; workerName?: string | null; workerId?: string | null; createdAt?: string; automatic?: boolean };
type Thread = {
  traderId: string;
  trader?: string;
  traderEmail?: string;
  desk?: string | null;
  lastAt?: string;
  messageCount?: number;
  messages?: Message[];
};

export default function Inbox() {
  const { t, locale } = useI18n();
  const { readOnly } = useCrmxAccess();
  const router = useRouter();
  const sp = useSearchParams();
  const q = sp.get("q") || "";
  const selectedId = sp.get("id") || "";
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<Thread | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftQ, setDraftQ] = useState(q);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const loadThreads = useCallback(async () => {
    try {
      const data = await crmxGet<{ threads?: Thread[] }>(`/api/admin/chat${queryString({ take: 40, q })}`);
      setThreads(filterRows(data.threads || [], q, (row) => [row.trader, row.traderEmail, row.desk]));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("crmx.error"));
    }
  }, [q, t]);

  const loadThread = useCallback(async (id: string) => {
    try {
      const data = await crmxGet<{ threads?: Thread[] }>(`/api/admin/chat${queryString({ userId: id, take: 40 })}`);
      setActive((data.threads && data.threads[0]) || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("crmx.error"));
    }
  }, [t]);

  useEffect(() => {
    void loadThreads();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadThreads();
    }, 12000);
    return () => window.clearInterval(timer);
  }, [loadThreads]);

  useEffect(() => {
    if (!selectedId) {
      setActive(null);
      return;
    }
    void loadThread(selectedId);
  }, [selectedId, loadThread]);

  async function send() {
    const message = reply.trim();
    if (!selectedId || !message || readOnly) return;
    setBusy(true);
    try {
      await crmxPost("/api/admin/chat", { userId: selectedId, message });
      setReply("");
      await loadThread(selectedId);
      await loadThreads();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("crmx.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <PageHead title={t("crmx.nav.inbox")}>
        <ClassicLink href="/izcrm/chat" />
      </PageHead>
      {error ? <ErrorNote message={error} onRetry={() => void loadThreads()} /> : null}
      <div className={`crmx-split${selectedId ? " is-detail" : ""}`}>
        <div className="crmx-list crmx-card" style={{ padding: 8 }}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const next = new URLSearchParams(sp.toString());
              if (draftQ.trim()) next.set("q", draftQ.trim()); else next.delete("q");
              const suffix = next.toString();
              router.push(suffix ? `/crmx/chat?${suffix}` : "/crmx/chat");
            }}
          >
            <input aria-label={t("crm.ui.search")} value={draftQ} onChange={(event) => setDraftQ(event.target.value)} placeholder={t("crm.ui.search")} style={{ width: "100%", height: 36, padding: "0 10px" }} />
          </form>
          <div className="crmx-mini">
            {threads.length === 0 ? <EmptyState /> : null}
            {threads.map((thread) => (
              <button
                key={thread.traderId}
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(sp.toString());
                  next.set("id", thread.traderId);
                  router.push(`/crmx/chat?${next.toString()}`);
                }}
                aria-current={thread.traderId === selectedId ? "true" : undefined}
              >
                <span>{thread.trader || thread.traderEmail}</span>
                <span className="crmx-muted">{formatWhen(thread.lastAt, locale)}</span>
              </button>
            ))}
          </div>
        </div>
        <aside className="crmx-detail" aria-label={t("crmx.nav.inbox")}>
          {selectedId ? (
            <button type="button" className="crmx-btn" onClick={() => { const next = new URLSearchParams(sp.toString()); next.delete("id"); const suffix = next.toString(); router.push(suffix ? `/crmx/chat?${suffix}` : "/crmx/chat"); }}>{t("crmx.back")}</button>
          ) : null}
          {!active ? <EmptyState label={t("crmx.inbox.empty")} /> : (
            <>
              <h2 className="crmx-h1" style={{ fontSize: 18 }}>{active.trader}</h2>
              <p className="crmx-lead">{active.traderEmail}</p>
              <div className="crmx-thread" aria-live="polite">
                {(active.messages || []).map((message) => {
                  const staff = Boolean(message.workerId || message.workerName);
                  return (
                    <div key={message.id} className={`crmx-bubble${staff ? " is-staff" : ""}`}>
                      {message.body}
                      <time dateTime={message.createdAt}>{message.workerName || ""} {formatWhen(message.createdAt, locale)}</time>
                    </div>
                  );
                })}
              </div>
              {readOnly ? <p className="crmx-lead">{t("crmx.noApprove")}</p> : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void send();
                  }}
                >
                  <label className="crmx-field">
                    {t("crm.ui.reply")}
                    <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder={t("crmx.inbox.ph")} readOnly={busy} required={false} aria-required="false" />
                  </label>
                  <div className="crmx-actions">
                    <button type="submit" className="crmx-btn-primary" disabled={busy || !reply.trim()}>{t("crm.ui.send")}</button>
                  </div>
                </form>
              )}
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
