"use client";

import { useEffect, useState } from "react";
import type { DragEvent } from "react";
import { SALE_STATUSES } from "@/lib/membership";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  HELP_TOPIC_IDS,
  OTHER_STAGE,
  boardStage,
  cardHit,
  countStages,
  hiddenCount,
  matchTopics,
  openTips,
  parseDensity,
  parseStageFilter,
  saveStage,
  stageTotal,
  visibleStages,
} from "@/lib/crmv4/round41";
import { useEscape } from "./round40";

export type V4 = (key: CrmV4CopyKey) => string;

const DENSITY_KEY = "crmv4-board-density";
const STAGE_KEY = "crmv4-board-stages";
const TIPS_KEY = "crmv4-board-tips";

const TOPIC_TITLE: Record<(typeof HELP_TOPIC_IDS)[number], CrmV4CopyKey> = {
  board: "htBoard",
  stage: "htStage",
  keys: "htKeys",
  money: "htMoney",
  local: "htLocal",
  other: "htOther",
};
const TOPIC_BODY: Record<(typeof HELP_TOPIC_IDS)[number], CrmV4CopyKey> = {
  board: "htBoardBody",
  stage: "htStageBody",
  keys: "htKeysBody",
  money: "htMoneyBody",
  local: "htLocalBody",
  other: "htOtherBody",
};
const TIP_COPY: Record<string, CrmV4CopyKey> = {
  board: "tpBoard",
  confirm: "tpConfirm",
  keys: "tpKeys",
};

type BoardRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  country?: string | null;
  assigneeName?: string | null;
  saleStatus?: string | null;
};

type Pending = { id: string; name: string; from: string; to: string };

function readTips(): string[] {
  const raw = readJson<unknown>(TIPS_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item));
}

export function useTips() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  useEffect(() => {
    const load = () => setDismissed(readTips());
    load();
    window.addEventListener("crmv4:board-tips", load);
    return () => window.removeEventListener("crmv4:board-tips", load);
  }, []);
  function publish(next: string[]) {
    writeJson(TIPS_KEY, next);
    setDismissed(next);
    window.dispatchEvent(new Event("crmv4:board-tips"));
  }
  return {
    open: openTips(dismissed),
    dismiss(id: string) {
      if (dismissed.includes(id)) return;
      publish([...dismissed, id]);
    },
    restore() {
      publish([]);
    },
  };
}

export function TipList({ v4 }: { v4: V4 }) {
  const tips = useTips();
  if (!tips.open.length) return null;
  return (
    <div className="c4-tip-list">
      {tips.open.map((id) => (
        <div key={id} className="c4-tip" data-tip={id}>
          <p>{v4(TIP_COPY[id] || "tpBoard")}</p>
          <button type="button" className="c4-btn" onClick={() => tips.dismiss(id)}>{v4("tpDismiss")}</button>
        </div>
      ))}
    </div>
  );
}

export function PipelineDesk({ rows, v4, onMove }: {
  rows: BoardRow[];
  v4: V4;
  onMove: (id: string, status: string) => Promise<void> | void;
}) {
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [stages, setStages] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setDensity(parseDensity(window.localStorage.getItem(DENSITY_KEY)));
    setStages(parseStageFilter(readJson<unknown>(STAGE_KEY, [])));
  }, []);

  const searched = rows.filter((row) => cardHit(query, row.name || "", row.email || ""));
  const shownStages = visibleStages(stages);
  const counts = countStages(searched.map((row) => row.saleStatus));
  const hidden = hiddenCount(searched.map((row) => row.saleStatus), shownStages);

  function storeStages(next: string[]) {
    setStages(next);
    writeJson(STAGE_KEY, next);
  }

  function toggleStage(stage: string) {
    const current = visibleStages(stages);
    if (current.includes(stage) && current.length === 1) return;
    const next = current.includes(stage) ? current.filter((item) => item !== stage) : [...current, stage];
    storeStages(next.length >= countStages([]).length ? [] : next);
  }

  function dropOn(event: DragEvent<HTMLElement>, stage: string) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    const move = saveStage(row.saleStatus || "NEW", stage);
    if (!move) return;
    setPending({ id: row.id, name: row.name || row.email || row.id, from: move.from, to: move.to });
  }

  async function confirmMove() {
    if (!pending || busy) return;
    setBusy(true);
    try {
      await onMove(pending.id, pending.to);
      setPending(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="c4-board c4-pipeline-gallery" data-board="" data-gallery="1" data-density={density} aria-label={v4("bdTitle")}>
      <header className="c4-pipeline-mast">
        <p className="c4-pipeline-seal" data-logo="mono">{v4("pipGalSeal")}</p>
        <div>
          <p className="c4-pipeline-kicker">{v4("pipGalKicker")}</p>
          <h3 className="c4-title c4-pipeline-title">{v4("bdTitle")}</h3>
          <p className="c4-pipeline-lead">{v4("pipGalLead")}</p>
        </div>
        <ol className="c4-pipeline-index" aria-label={v4("pipGalKicker")}>
          <li data-tone="ivory">{v4("pipGalIvory")}</li>
          <li data-tone="ink">{v4("pipGalGraphite")}</li>
          <li data-tone="gold">{v4("pipGalGold")}</li>
        </ol>
      </header>
      <header className="c4-board-head">
        <h3 className="c4-title">{v4("bdTitle")}</h3>
        <p className="c4-meta">{v4("bdHint")}</p>
        <p className="c4-meta" data-loaded={rows.length}>
          {v4("bdLoaded")} {rows.length} · {v4("bdShowing")} {stageTotal(counts) - hidden}
          {hidden > 0 ? ` · ${v4("bdHidden")} ${hidden}` : ""}
        </p>
      </header>
      <TipList v4={v4} />
      <div className="c4-row c4-board-tools">
        <input className="c4-field" value={query} aria-label={v4("bdSearch")} placeholder={v4("bdSearch")} onChange={(event) => setQuery(event.target.value)} />
        <button
          type="button"
          className="c4-chip"
          data-on={density === "compact" ? "1" : "0"}
          aria-label={v4("bdDensity")}
          onClick={() => {
            const next = density === "compact" ? "comfortable" : "compact";
            setDensity(next);
            window.localStorage.setItem(DENSITY_KEY, next);
          }}
        >
          {density === "compact" ? v4("bdCompact") : v4("bdComfort")}
        </button>
        <button type="button" className="c4-btn" data-on={stages.length ? "0" : "1"} onClick={() => storeStages([])}>{v4("bdAll")}</button>
      </div>
      <div className="c4-row" aria-label={v4("bdStages")}>
        {counts.map((item) => (
          <button key={item.stage} type="button" className="c4-chip" data-on={shownStages.includes(item.stage) ? "1" : "0"} onClick={() => toggleStage(item.stage)}>
            {item.stage === OTHER_STAGE ? v4("bdOther") : item.stage} <span className="c4-count">{item.count}</span>
          </button>
        ))}
      </div>
      {pending && (
        <section className="c4-board-confirm c4-pipeline-confirm" role="dialog" aria-label={v4("bdConfirmTitle")} data-confirm="1">
          <h4 className="c4-title">{v4("bdConfirmTitle")}</h4>
          <p>{pending.name}</p>
          <p className="c4-meta">{v4("bdFrom")} {pending.from} · {v4("bdTo")} {pending.to}</p>
          <p className="c4-meta">{v4("bdConfirmLead")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" disabled={busy} onClick={() => void confirmMove()}>{v4("bdConfirm")}</button>
            <button type="button" className="c4-btn" onClick={() => setPending(null)}>{v4("bdCancel")}</button>
          </div>
        </section>
      )}
      {!searched.length && <p className="c4-meta c4-pipeline-empty">{v4("bdNoMatch")}</p>}
      <div className="c4-board-cols">
        {counts.filter((item) => shownStages.includes(item.stage)).map((item) => (
          <section
            key={item.stage}
            className="c4-board-col c4-pipeline-column"
            data-stage={item.stage}
            data-count={item.count}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => dropOn(event, item.stage)}
          >
            <header className="c4-row c4-between">
              <h3>{item.stage === OTHER_STAGE ? v4("bdOther") : item.stage}</h3>
              <span className="c4-count">{item.count}</span>
            </header>
            {item.stage === OTHER_STAGE && <p className="c4-meta">{v4("bdOtherHint")}</p>}
            {!item.count && <p className="c4-meta c4-pipeline-empty">{v4("pipGalEmpty")}</p>}
            {searched.filter((row) => boardStage(row.saleStatus) === item.stage).map((row) => (
              <BoardCard key={row.id} row={row} density={density} v4={v4} onPropose={(next) => {
                const move = saveStage(row.saleStatus || "NEW", next);
                if (!move) return;
                setPending({ id: row.id, name: row.name || row.email || row.id, from: move.from, to: move.to });
              }} />
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}

function BoardCard({ row, density, v4, onPropose }: {
  row: BoardRow;
  density: "comfortable" | "compact";
  v4: V4;
  onPropose: (status: string) => void;
}) {
  const from = row.saleStatus || "NEW";
  const current = (SALE_STATUSES as readonly string[]).includes(from) ? from : "NEW";
  const [next, setNext] = useState(current);
  return (
    <article
      className="c4-board-card c4-pipeline-card"
      data-card={row.id}
      draggable
      onDragStart={(event) => event.dataTransfer.setData("text/plain", row.id)}
    >
      <strong>{row.name || row.email || row.id}</strong>
      {density === "comfortable" && (
        <>
          {row.email && <span className="c4-meta">{row.email}</span>}
          <span className="c4-meta">{v4("bdCountry")} {row.country || "—"}</span>
          <span className="c4-meta">{v4("bdAssignee")} {row.assigneeName || "—"}</span>
        </>
      )}
      <label className="c4-lab">
        <span className="c4-sr">{v4("bdMove")}</span>
        <select className="c4-select" aria-label={v4("bdMove")} value={next} onChange={(event) => setNext(event.target.value)}>
          {SALE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
      <button type="button" className="c4-btn" disabled={next === from} onClick={() => onPropose(next)}>{v4("bdMove")}</button>
    </article>
  );
}

const KEY_ROWS: [string, CrmV4CopyKey][] = [
  ["Ctrl/Cmd K", "helpPalette"],
  ["?", "hdOpenKeys"],
  ["Escape", "ksEscape"],
  ["g o c f p s m l e k x", "helpGo"],
  ["j / k", "helpMove"],
  ["Enter", "helpEnter"],
  ["x", "helpPick"],
];

export function ShortcutsSheet({ open, onClose, onHelp, v4, closeLabel }: {
  open: boolean;
  onClose: () => void;
  onHelp: () => void;
  v4: V4;
  closeLabel: string;
}) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="c4-palette-back" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={v4("ksTitle")} className="c4-palette c4-help-luxe c4-sheet-keys" data-shortcuts="" onClick={(event) => event.stopPropagation()}>
        <h2 className="c4-title">{v4("ksTitle")}</h2>
        <p className="c4-meta">{v4("ksHint")}</p>
        <TipList v4={v4} />
        <ul className="c4-shortcut-list">
          {KEY_ROWS.map(([key, label]) => (
            <li key={key}><kbd>{key}</kbd><span>{v4(label)}</span></li>
          ))}
        </ul>
        <div className="c4-row">
          <button type="button" className="c4-btn" onClick={onHelp}>{v4("hdTitle")}</button>
          <button type="button" className="c4-btn" onClick={onClose}>{closeLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function HelpDrawer({ open, onClose, onShortcuts, v4, closeLabel }: {
  open: boolean;
  onClose: () => void;
  onShortcuts: () => void;
  v4: V4;
  closeLabel: string;
}) {
  const [query, setQuery] = useState("");
  const tips = useTips();
  useEscape(open, onClose);
  if (!open) return null;
  const topics = HELP_TOPIC_IDS.map((id) => ({ id, title: v4(TOPIC_TITLE[id]), body: v4(TOPIC_BODY[id]) }));
  const found = matchTopics(query, topics);
  return (
    <div className="c4-palette-back" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={v4("hdTitle")} className="c4-palette c4-help-luxe c4-help-drawer" data-help-drawer="" onClick={(event) => event.stopPropagation()}>
        <h2 className="c4-title">{v4("hdTitle")}</h2>
        <input className="c4-field" data-help-q="" value={query} aria-label={v4("hdSearch")} placeholder={v4("hdSearch")} onChange={(event) => setQuery(event.target.value)} />
        <TipList v4={v4} />
        <div className="c4-row">
          <button type="button" className="c4-btn" onClick={onShortcuts}>{v4("hdOpenKeys")}</button>
          <button type="button" className="c4-btn" onClick={() => tips.restore()}>{v4("hdShowTips")}</button>
        </div>
        {found.map((topic) => (
          <article key={topic.id} className="c4-help-topic" data-topic={topic.id}>
            <h3>{topic.title}</h3>
            <p>{topic.body}</p>
          </article>
        ))}
        {!found.length && <p className="c4-meta">{v4("hdEmpty")}</p>}
        <button type="button" className="c4-btn" onClick={onClose}>{closeLabel}</button>
      </div>
    </div>
  );
}
