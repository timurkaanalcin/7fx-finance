"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { stageFor } from "@/lib/crmv4/round16";
import { manyWithdrawals, missingKyc, rapidDeposits } from "@/lib/crmv4/round19";
import {
  ALERT_DEFAULTS,
  followAlerts,
  largeAlerts,
  lastStamp,
  quietAlerts,
  sameCurrencyHigher,
  slaAlerts,
  visibleAlerts,
  type AlertHit,
  type AlertRule,
  type AlertSettings,
} from "@/lib/crmv4/round23";
import { crmv4Href } from "@/lib/crmv4/sections";
import { byCurrency } from "@/lib/crmv4/round21";
import { money, useJson, when, type UserRow } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const RULE_KEY = "crmv4-alert-rules";
const FOLLOW_KEY = "crmv4-lead-follow";
const HEAT_KEY = "crmv4-lead-heat";
const STAGE_KEY = "crmv4-lead-stage";
const CALL_KEY = "crmv4-call-log";
const RULES: AlertRule[] = ["large", "sla", "follow", "watch", "quiet"];
const LABEL: Record<AlertRule, CrmV4CopyKey> = {
  large: "alertLarge",
  sla: "alertSla",
  follow: "alertFollow",
  watch: "alertWatch",
  quiet: "alertQuiet",
};

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function AlertCenter({ base, v4 }: { base: string; v4: V4 }) {
  const people = useJson<{ users?: { id: string; name?: string | null; email?: string | null; documentsStatus?: string | null; createdAt?: string | null; retentionFollowUpAt?: string | null }[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const deposits = useJson<{ requests?: { id: string; amount?: number | null; createdAt?: string | null; userId?: string | null; user?: { id?: string | null; name?: string | null } | null }[] }>("/api/admin/deposits?take=80");
  const withdrawals = useJson<{ requests?: { id: string; amount?: number | null; createdAt?: string | null; userId?: string | null; user?: { id?: string | null; name?: string | null } | null }[] }>("/api/admin/withdrawals?take=80");
  const tickets = useJson<{ tickets?: { id: string; customer?: string | null; openedAt?: string | null; status?: string | null }[] }>("/api/admin/tickets");
  const [settings, setSettings] = useState<AlertSettings>(ALERT_DEFAULTS);
  const [followMap, setFollowMap] = useState<Record<string, string>>({});
  const [rule, setRule] = useState<"" | AlertRule>("");
  useEffect(() => {
    setSettings({ ...ALERT_DEFAULTS, ...readJson<Partial<AlertSettings>>(RULE_KEY, {}) });
    setFollowMap(readJson(FOLLOW_KEY, {}));
  }, []);
  function save(next: AlertSettings) {
    setSettings(next);
    writeJson(RULE_KEY, next);
  }
  const users = people.data?.users || [];
  const deps = deposits.data?.requests || [];
  const watch = [
    ...missingKyc(users).map((row) => ({ id: `watch:${row.id}`, rule: "watch" as const, name: row.name, detail: row.detail, userId: row.userId })),
    ...rapidDeposits(deps).map((row) => ({ id: `watch-rapid:${row.id}`, rule: "watch" as const, name: row.name, detail: row.detail, userId: row.userId })),
    ...manyWithdrawals(withdrawals.data?.requests || []).map((row) => ({ id: `watch-wd:${row.id}`, rule: "watch" as const, name: row.name, detail: row.detail, userId: row.userId })),
  ];
  const hits = visibleAlerts([
    ...largeAlerts(deps, settings.largeAt),
    ...slaAlerts(tickets.data?.tickets || [], settings.slaHours),
    ...followAlerts(users.map((row) => ({ id: row.id, name: row.name, follow: followMap[row.id] || row.retentionFollowUpAt || "" })), todayStamp()),
    ...watch,
    ...quietAlerts(users, deps),
  ], settings).filter((hit) => !rule || hit.rule === rule);
  return (
    <section className="c4-alert-luxe" aria-label={v4("alertCenter")}>
      <div className="c4-fin-hero">
        <div className="c4-fin-metric"><span>{v4("alertCenter")}</span><strong>{hits.length}</strong></div>
        <div className="c4-fin-metric"><span>{v4("alertOn")}</span><strong>{RULES.filter((item) => settings[item]).length}</strong></div>
      </div>
      <p className="c4-muted c4-pad">{v4("alertHint")}</p>
      <div className="c4-row c4-pad">
        {RULES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={settings[item] ? "1" : "0"} onClick={() => save({ ...settings, [item]: !settings[item] })}>{v4(LABEL[item])}</button>
        ))}
        <button type="button" className="c4-chip" data-on={rule === "" ? "1" : "0"} onClick={() => setRule("")}>{v4("alertOn")}</button>
        {RULES.map((item) => (
          <button key={`f-${item}`} type="button" className="c4-chip" data-on={rule === item ? "1" : "0"} onClick={() => setRule(item)}>{v4(LABEL[item])}</button>
        ))}
      </div>
      <div className="c4-row c4-pad">
        <label className="c4-lab"><span>{v4("alertLargeAt")}</span><input className="c4-field" inputMode="numeric" aria-label={v4("alertLargeAt")} value={String(settings.largeAt)} onChange={(event) => save({ ...settings, largeAt: Number(event.target.value) || 0 })} /></label>
        <label className="c4-lab"><span>{v4("alertSlaHours")}</span><input className="c4-field" inputMode="numeric" aria-label={v4("alertSlaHours")} value={String(settings.slaHours)} onChange={(event) => save({ ...settings, slaHours: Number(event.target.value) || 0 })} /></label>
      </div>
      <ul className="c4-alert-list">
        {hits.map((hit) => (
          <li key={hit.id} data-rule={hit.rule}>
            <strong>{v4(LABEL[hit.rule])}</strong>
            {hit.userId ? <Link href={crmv4Href(base, `customers/${hit.userId}`)}>{hit.name}</Link> : <span>{hit.name}</span>}
            <span className="c4-muted">{hit.detail}</span>
            <button type="button" className="c4-btn" onClick={() => save({ ...settings, muted: [...settings.muted, hit.id] })}>{v4("alertMute")}</button>
          </li>
        ))}
      </ul>
      {!hits.length && <p className="c4-empty-gold">{v4("alertEmpty")}</p>}
    </section>
  );
}

type Cash = { id: string; amount?: number | null; currency?: string | null; createdAt?: string | null; userId?: string | null; user?: { id?: string | null } | null };

export function CompareDesk({ rows, base, v4, locale }: { rows: UserRow[]; base: string; v4: V4; locale: string }) {
  const picked = rows.slice(0, 3);
  const deposits = useJson<{ requests?: Cash[] }>("/api/admin/deposits?take=80");
  const withdrawals = useJson<{ requests?: Cash[] }>("/api/admin/withdrawals?take=80");
  const [stages, setStages] = useState<Record<string, string>>({});
  const [heat, setHeat] = useState<Record<string, string>>({});
  const [calls, setCalls] = useState<Record<string, { at?: string }[]>>({});
  useEffect(() => {
    setStages(readJson(STAGE_KEY, {}));
    setHeat(readJson(HEAT_KEY, {}));
    setCalls(readJson(CALL_KEY, {}));
  }, []);
  if (picked.length < 2) return null;
  const higher = sameCurrencyHigher(picked);
  return (
    <section className="c4-compare-luxe" aria-label={v4("compareDesk")}>
      <h3 className="c4-title">{v4("compareDesk")}</h3>
      <p className="c4-muted">{v4("compareHint")}</p>
      <p className="c4-muted c4-phone-only">{v4("compareSwipe")}</p>
      <div className="c4-compare-row">
        {picked.map((row) => {
          const id = row.id;
          const mine = (list: Cash[]) => list.filter((item) => String(item.user?.id || item.userId || "") === id);
          const deps = mine(deposits.data?.requests || []);
          const wds = mine(withdrawals.data?.requests || []);
          const stage = stageFor({ id, saleStatus: row.saleStatus }, stages);
          const last = lastStamp([
            (row as UserRow & { lastContactAt?: string | null }).lastContactAt,
            ...(calls[id] || []).map((item) => item.at),
          ]);
          return (
            <CompareCard
              key={id}
              row={row}
              base={base}
              v4={v4}
              locale={locale}
              higher={higher === id}
              stage={stage}
              heat={heat[id] || "—"}
              last={last}
              deposits={deps}
              withdrawals={wds}
            />
          );
        })}
      </div>
    </section>
  );
}

function CompareCard({ row, base, v4, locale, higher, stage, heat, last, deposits, withdrawals }: {
  row: UserRow;
  base: string;
  v4: V4;
  locale: string;
  higher: boolean;
  stage: string;
  heat: string;
  last: string;
  deposits: Cash[];
  withdrawals: Cash[];
}) {
  const book = useJson<{ positions?: { id: string }[] }>(`/api/admin/users/${encodeURIComponent(row.id)}?view=positions&take=20`);
  const positions = book.data?.positions || [];
  return (
    <article className="c4-compare-card" data-top={higher ? "1" : "0"}>
      <h4><Link href={crmv4Href(base, `customers/${row.id}`)}>{row.name || row.email || row.id}</Link></h4>
      {higher && <span className="c4-status" data-tone="ok">{v4("compareHigher")}</span>}
      <p>{v4("compareBalance")} {money(row.balance ?? row.account?.balance, row.currency || row.account?.currency, locale)}</p>
      <p>{v4("compareCash")} {byCurrency([...deposits, ...withdrawals]).map((item) => `${item.currency} ${item.total}`).join(" · ") || "—"}</p>
      <p>{v4("comparePositions")} {positions.length}</p>
      <p>{v4("compareStage")} {stage}</p>
      <p>{v4("compareHeat")} {heat}</p>
      <p>{v4("compareLast")} {last ? when(last, locale) : "—"}</p>
    </article>
  );
}

export type { AlertHit };
