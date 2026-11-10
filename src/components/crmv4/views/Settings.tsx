"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { POTENTIAL_STATUSES, SALE_STATUSES } from "@/lib/membership";
import { crmv4Text } from "@/lib/crmv4/copy";
import { useI18n } from "@/lib/i18n/context";
import { densityMode, storeDensity } from "../round2";
import { toastHistory } from "../round3";
import { AccentPicker, AnnounceEditor } from "../round4";
import { FocusButton, FormatRules, RolePreview, ZebraToggle } from "../round5";
import { CallTarget, CategoryRules, DecimalPref, MotionPref } from "../round6";
import { SoundToggle, TicketAlertToggle } from "../round7";
import { DeskPrefs } from "../round8";
import { BrandField, HolidayEditor, KpiPicker, ScoreEditor, ThemePresets } from "../round10";
import { LocalData } from "../round20";
import { sysSection } from "@/lib/crmv4/round39";
import { PhoneSheet, SystemDesk } from "../round39";
import { Card, Lab, Msg, State, sendJson, useJson, type Tx } from "../kit";
import Ops from "./Ops";

const AREAS = ["general", "leads", "desks", "groups", "methods", "assets", "rates", "sponsors", "licenses", "calendar", "import"] as const;

export default function Settings({ tx }: { tx: Tx }) {
  const params = useSearchParams();
  const router = useRouter();
  const { locale } = useI18n();
  const v4 = (key: Parameters<typeof crmv4Text>[1]) => crmv4Text(locale, key);
  const area = params.get("area") || "general";
  const system = area === "methods" || area === "desks" || area === "currencies" ? sysSection(area) : null;
  function setArea(next: string) {
    const p = new URLSearchParams(params.toString());
    if (next === "general") p.delete("area");
    else p.set("area", next);
    router.replace(`?${p.toString()}`);
  }
  return (
    <div className="c4-stack c4-settings-luxe c4-settings-atelier">
      <header className="c4-settings-mast">
        <div>
          <p className="c4-settings-kicker">{tx("settingsLead")}</p>
          <h2 className="c4-settings-title">{tx("settings")}</h2>
        </div>
        <p className="c4-settings-plate" data-logo="mono">7FX</p>
      </header>
      <div className="c4-with-side">
        <PhoneSheet title={v4("sysTitle")} v4={v4}>
        <nav className="c4-side" aria-label={tx("settings")}>
          {AREAS.map((item) => (
            <button key={item} type="button" data-on={area === item ? "1" : "0"} onClick={() => setArea(item)}>{tx(areaLabel(item))}</button>
          ))}
          <button type="button" data-on={area === "currencies" ? "1" : "0"} onClick={() => setArea("currencies")}>{v4("sysCurrencies")}</button>
        </nav>
        </PhoneSheet>
        <div className="c4-stack">
          {area === "general" && <><General tx={tx} /><LocalPrefs /></>}
          {area === "leads" && <LeadMap tx={tx} />}
          {system && <SystemDesk area={system} tx={tx} v4={v4} />}
          {area !== "general" && area !== "leads" && !system && <Ops tx={tx} area={area} />}
        </div>
      </div>
    </div>
  );
}

function LocalPrefs() {
  const { locale } = useI18n();
  const v4 = (key: Parameters<typeof crmv4Text>[1]) => crmv4Text(locale, key);
  const [mode, setMode] = useState<"comfortable" | "compact">("comfortable");
  const [history, setHistory] = useState<{ id: number; text: string }[]>([]);
  useEffect(() => {
    setMode(densityMode());
    setHistory(toastHistory());
  }, []);
  return (
    <Card title={v4("localPrefs")}>
      <div className="c4-form" style={{ padding: 16 }}>
        <p>{v4("density")}: {mode === "compact" ? v4("compact") : v4("comfortable")}</p>
        <button type="button" className="c4-btn" onClick={() => { const next = mode === "compact" ? "comfortable" : "compact"; setMode(next); storeDensity(next); }}>{v4("density")}</button>
        <button type="button" className="c4-btn" onClick={() => window.print()}>{v4("printDesk")}</button>
        <AccentPicker v4={v4} />
        <AnnounceEditor v4={v4} />
        <RolePreview v4={v4} />
        <ZebraToggle v4={v4} />
        <FormatRules v4={v4} />
        <FocusButton v4={v4} />
        <CallTarget v4={v4} />
        <DecimalPref v4={v4} />
        <MotionPref v4={v4} />
        <CategoryRules v4={v4} />
        <SoundToggle v4={v4} />
        <TicketAlertToggle v4={v4} />
        <DeskPrefs v4={v4} />
        <ScoreEditor v4={v4} />
        <BrandField v4={v4} />
        <LocalData v4={v4} />
        <ThemePresets v4={v4} />
        <KpiPicker v4={v4} />
        <HolidayEditor v4={v4} />
        <h3 className="c4-title">{v4("toastHistory")}</h3>
        <ul>{history.map((row) => <li key={row.id}>{row.text}</li>)}</ul>
        {!history.length && <p className="c4-muted">{v4("toastHistory")}</p>}
      </div>
    </Card>
  );
}

function areaLabel(area: (typeof AREAS)[number]) {
  if (area === "general") return "general" as const;
  if (area === "leads") return "leadsMap" as const;
  if (area === "desks") return "desks" as const;
  if (area === "groups") return "groups" as const;
  if (area === "methods") return "methods" as const;
  if (area === "assets") return "assets" as const;
  if (area === "rates") return "rates" as const;
  if (area === "sponsors") return "sponsors" as const;
  if (area === "licenses") return "licenses" as const;
  if (area === "calendar") return "calendar" as const;
  return "importLeads" as const;
}

function General({ tx }: { tx: Tx }) {
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
  return (
    <Card title={tx("general")}>
      <form
        className="c4-form"
        style={{ padding: 16, maxWidth: 520 }}
        onSubmit={async (event) => {
          event.preventDefault();
          const res = await sendJson("/api/admin/settings", "PUT", { referralCode: code, referralRequired: required, terminalImpersonationEnabled: impersonation });
          setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
          if (res.ok) data.reload();
        }}
      >
        <State loading={data.loading} error={data.error} empty={false} tx={tx} onRetry={data.reload} />
        <Lab label={tx("referral")}><input value={code} onChange={(event) => setCode(event.target.value)} className="c4-field" /></Lab>
        <label className="c4-row"><input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} /> {tx("referralRequired")}</label>
        <label className="c4-row"><input type="checkbox" checked={impersonation} onChange={(event) => setImpersonation(event.target.checked)} /> {tx("impersonation")}</label>
        <button type="submit" className="c4-btn c4-btn-hot">{tx("save")}</button>
        <Msg text={msg} />
      </form>
    </Card>
  );
}

type Mapping = { valid?: string[]; invalid?: string[]; potential?: string[] };

function LeadMap({ tx }: { tx: Tx }) {
  const data = useJson<{ leadStatusMapping?: Mapping }>("/api/admin/settings");
  const [valid, setValid] = useState<string[]>([]);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [potential, setPotential] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const map = data.data?.leadStatusMapping;
    if (!map) return;
    setValid(map.valid || []);
    setInvalid(map.invalid || []);
    setPotential(map.potential || []);
  }, [data.data]);
  function bucket(list: string[], value: string, on: boolean, other: string[], setOther: (next: string[]) => void, setList: (next: string[]) => void) {
    if (on) {
      setList(Array.from(new Set([...list, value])));
      setOther(other.filter((item) => item !== value));
    } else setList(list.filter((item) => item !== value));
  }
  return (
    <Card title={tx("leadMapping")}>
      <form
        className="c4-stack"
        style={{ padding: 16 }}
        onSubmit={async (event) => {
          event.preventDefault();
          const res = await sendJson("/api/admin/settings", "PUT", { leadStatusMapping: { valid, invalid, potential } });
          setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
          if (res.ok) data.reload();
        }}
      >
        <State loading={data.loading} error={data.error} empty={false} tx={tx} onRetry={data.reload} />
        <p className="c4-muted">{tx("leadIntro")}</p>
        <p className="c4-muted">{tx("bothBuckets")}</p>
        <h3 className="c4-title">{tx("validList")}</h3>
        <div className="c4-row">
          {SALE_STATUSES.map((item) => (
            <label key={`v-${item}`} className="c4-chip" data-on={valid.includes(item) ? "1" : "0"}>
              <input type="checkbox" checked={valid.includes(item)} onChange={(event) => bucket(valid, item, event.target.checked, invalid, setInvalid, setValid)} /> {item}
            </label>
          ))}
        </div>
        <h3 className="c4-title">{tx("invalidList")}</h3>
        <div className="c4-row">
          {SALE_STATUSES.map((item) => (
            <label key={`i-${item}`} className="c4-chip" data-on={invalid.includes(item) ? "1" : "0"}>
              <input type="checkbox" checked={invalid.includes(item)} onChange={(event) => bucket(invalid, item, event.target.checked, valid, setValid, setInvalid)} /> {item}
            </label>
          ))}
        </div>
        <h3 className="c4-title">{tx("potentialList")}</h3>
        <div className="c4-row">
          {POTENTIAL_STATUSES.map((item) => (
            <label key={item} className="c4-chip" data-on={potential.includes(item) ? "1" : "0"}>
              <input type="checkbox" checked={potential.includes(item)} onChange={(event) => setPotential(event.target.checked ? Array.from(new Set([...potential, item])) : potential.filter((row) => row !== item))} /> {item}
            </label>
          ))}
        </div>
        <button type="submit" className="c4-btn c4-btn-hot">{tx("saveMap")}</button>
        <Msg text={msg} />
      </form>
    </Card>
  );
}
