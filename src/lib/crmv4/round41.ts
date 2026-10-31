/** Pure helpers for CRM v4 round 41. The board counts loaded rows only. */

import { SALE_STATUSES } from "@/lib/membership";

export const BOARD_STAGES = ["NEW", "NO_ANSWER", "CALLBACK", "INTERESTED", "DEPOSITED", "CONVERTED"] as const;
export const OTHER_STAGE = "OTHER";
export const TIP_IDS = ["board", "confirm", "keys"] as const;
export const HELP_TOPIC_IDS = ["board", "stage", "keys", "money", "local", "other"] as const;

const KNOWN = [...BOARD_STAGES, OTHER_STAGE];

export function boardStage(status: string | null | undefined): string {
  const raw = String(status || "NEW");
  if ((BOARD_STAGES as readonly string[]).includes(raw)) return raw;
  return OTHER_STAGE;
}

export function countStages(statuses: readonly (string | null | undefined)[]): { stage: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const stage of KNOWN) counts[stage] = 0;
  for (const status of statuses) counts[boardStage(status)] += 1;
  const out: { stage: string; count: number }[] = [];
  for (const stage of KNOWN) out.push({ stage, count: counts[stage] });
  return out;
}

export function stageTotal(counts: readonly { count: number }[]): number {
  let total = 0;
  for (const row of counts) total += row.count;
  return total;
}

export function parseStageFilter(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    const key = String(item);
    if (KNOWN.includes(key) && !out.includes(key)) out.push(key);
  }
  return out;
}

/** Empty means every stage. An unknown list falls back to every stage. */
export function visibleStages(filter: readonly string[]): string[] {
  const picked = parseStageFilter(filter);
  return picked.length ? picked : KNOWN.slice();
}

export function hiddenCount(statuses: readonly (string | null | undefined)[], visible: readonly string[]): number {
  if (!visible.length || visible.length >= KNOWN.length) return 0;
  let hidden = 0;
  for (const status of statuses) {
    if (!visible.includes(boardStage(status))) hidden += 1;
  }
  return hidden;
}

export function cardHit(query: string, name: string, email: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return `${name} ${email}`.toLowerCase().includes(needle);
}

/** A real sale status, different from the current one. Other is not saved. */
export function saveStage(from: string, to: string): { from: string; to: string } | null {
  if (!to || from === to) return null;
  if (!(SALE_STATUSES as readonly string[]).includes(to)) return null;
  return { from, to };
}

export function parseDensity(value: string | null | undefined): "comfortable" | "compact" {
  return value === "compact" ? "compact" : "comfortable";
}

export function openTips(dismissed: readonly string[]): string[] {
  const out: string[] = [];
  for (const id of TIP_IDS) {
    if (!dismissed.includes(id)) out.push(id);
  }
  return out;
}

export function matchTopics<T extends { title: string; body: string }>(query: string, topics: readonly T[]): T[] {
  const needle = query.trim().toLowerCase();
  const out: T[] = [];
  for (const topic of topics) {
    if (!needle || `${topic.title} ${topic.body}`.toLowerCase().includes(needle)) out.push(topic);
  }
  return out;
}

export function questionOpensSheet(key: string, typing: boolean): boolean {
  return key === "?" && !typing;
}
