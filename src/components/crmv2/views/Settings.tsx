"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { POTENTIAL_STATUSES, SALE_STATUSES } from "@/lib/membership";
import { Card, Chip, Lab, Msg, State, sendJson, useJson, type Tx } from "../kit";
import Ops from "./Ops";

const AREAS = ["general", "leads", "desks", "groups", "methods", "assets", "rates", "sponsors", "licenses", "calendar", "import"] as const;

export default function Settings({ tx }: { tx: Tx }) {
  const params = useSearchParams();
  const router = useRouter();
  const area = params.get("area") || "general";
  function setArea(next: string) {
    const p = new URLSearchParams(params.toString());
    if (next === "general") p.delete("area");
    else p.set("area", next);
    router.replace(`?${p.toString()}`);
  }
  return (
    <div className="cv-stack">
      <p className="cv-muted">{tx("settingsLead")}</p>
      <div className="cv-row">
        {AREAS.map((item) => (
          <Chip key={item} on={area === item} onClick={() => setArea(item)}>{tx(areaLabel(item))}</Chip>
        ))}
      </div>
      {area === "general" && <General tx={tx} />}
      {area === "leads" && <LeadMap tx={tx} />}
      {area !== "general" && area !== "leads" && <Ops tx={tx} area={area} />}
    </div>
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
        className="cv-form"
        style={{ padding: 16, maxWidth: 520 }}
        onSubmit={async (event) => {
          event.preventDefault();
          const res = await sendJson("/api/admin/settings", "PUT", { referralCode: code, referralRequired: required, terminalImpersonationEnabled: impersonation });
          setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
          if (res.ok) data.reload();
        }}
      >
        <State loading={data.loading} error={data.error} empty={false} tx={tx} onRetry={data.reload} />
        <Lab label={tx("referral")}><input value={code} onChange={(event) => setCode(event.target.value)} className="cv-field" /></Lab>
        <label className="cv-row"><input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} /> {tx("referralRequired")}</label>
        <label className="cv-row"><input type="checkbox" checked={impersonation} onChange={(event) => setImpersonation(event.target.checked)} /> {tx("impersonation")}</label>
        <button type="submit" className="cv-btn cv-btn-hot">{tx("save")}</button>
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
        className="cv-stack"
        style={{ padding: 16 }}
        onSubmit={async (event) => {
          event.preventDefault();
          const res = await sendJson("/api/admin/settings", "PUT", { leadStatusMapping: { valid, invalid, potential } });
          setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
          if (res.ok) data.reload();
        }}
      >
        <State loading={data.loading} error={data.error} empty={false} tx={tx} onRetry={data.reload} />
        <p className="cv-muted">{tx("leadIntro")}</p>
        <p className="cv-muted">{tx("bothBuckets")}</p>
        <h3 className="cv-title">{tx("validList")}</h3>
        <div className="cv-row">
          {SALE_STATUSES.map((item) => (
            <label key={`v-${item}`} className="cv-chip" data-on={valid.includes(item) ? "1" : "0"}>
              <input type="checkbox" checked={valid.includes(item)} onChange={(event) => bucket(valid, item, event.target.checked, invalid, setInvalid, setValid)} /> {item}
            </label>
          ))}
        </div>
        <h3 className="cv-title">{tx("invalidList")}</h3>
        <div className="cv-row">
          {SALE_STATUSES.map((item) => (
            <label key={`i-${item}`} className="cv-chip" data-on={invalid.includes(item) ? "1" : "0"}>
              <input type="checkbox" checked={invalid.includes(item)} onChange={(event) => bucket(invalid, item, event.target.checked, valid, setValid, setInvalid)} /> {item}
            </label>
          ))}
        </div>
        <h3 className="cv-title">{tx("potentialList")}</h3>
        <div className="cv-row">
          {POTENTIAL_STATUSES.map((item) => (
            <label key={item} className="cv-chip" data-on={potential.includes(item) ? "1" : "0"}>
              <input type="checkbox" checked={potential.includes(item)} onChange={(event) => setPotential(event.target.checked ? Array.from(new Set([...potential, item])) : potential.filter((row) => row !== item))} /> {item}
            </label>
          ))}
        </div>
        <button type="submit" className="cv-btn cv-btn-hot">{tx("saveMap")}</button>
        <Msg text={msg} />
      </form>
    </Card>
  );
}
