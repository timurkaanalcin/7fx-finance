/** Pure helpers for CRM v4 round 9. Rich notes stay as tokens, never raw HTML. */

export type NoteToken =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "item"; text: string }
  | { type: "link"; label: string; href: string }
  | { type: "image"; href: string };

export function noteTokens(body: string): NoteToken[] {
  const tokens: NoteToken[] = [];
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      tokens.push({ type: "item", text: trimmed.slice(2) });
      continue;
    }
    let rest = line;
    while (rest) {
      const found = rest.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
      if (!found || found.index == null) {
        tokens.push(...boldTokens(rest));
        break;
      }
      if (found.index > 0) tokens.push(...boldTokens(rest.slice(0, found.index)));
      const href = found[2];
      if (/\.(png|jpe?g|gif|webp)(\?|$)/i.test(href)) tokens.push({ type: "image", href });
      else tokens.push({ type: "link", label: found[1], href });
      rest = rest.slice(found.index + found[0].length);
    }
  }
  return tokens;
}

function boldTokens(text: string): NoteToken[] {
  const tokens: NoteToken[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((part) => part.length > 0);
  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) tokens.push({ type: "bold", text: part.slice(2, -2) });
    else tokens.push({ type: "text", text: part });
  }
  return tokens;
}

export function fillReply(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (_all, key: string) => vars[key] ?? "");
}

export function responseMinutes(messages: { workerId?: string | null; createdAt?: string }[]): number | null {
  const times: number[] = [];
  for (let i = 0; i < messages.length; i += 1) {
    const row = messages[i];
    if (row.workerId) continue;
    const start = row.createdAt ? new Date(row.createdAt).getTime() : 0;
    if (!start) continue;
    const next = messages.slice(i + 1).find((item) => item.workerId && item.createdAt);
    if (!next?.createdAt) continue;
    const end = new Date(next.createdAt).getTime();
    if (end >= start) times.push((end - start) / 60000);
  }
  if (!times.length) return null;
  return Math.round(times.reduce((sum, value) => sum + value, 0) / times.length);
}

export function firstResponseAge(openedAt?: string | null, now = Date.now()): string {
  const start = openedAt ? new Date(openedAt).getTime() : 0;
  if (!start) return "—";
  const minutes = Math.max(0, Math.round((now - start) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest}m` : `${rest}m`;
}

export function csatMix(scores: number[]): number[] {
  const buckets = [0, 0, 0, 0, 0];
  for (const score of scores) {
    const index = Math.round(score) - 1;
    if (index >= 0 && index < 5) buckets[index] += 1;
  }
  return buckets;
}

export function workStreak(days: string[], today = new Date().toISOString().slice(0, 10)): number {
  const set = new Set(days);
  let streak = 0;
  const cursor = new Date(`${today}T00:00:00Z`);
  while (streak < 60) {
    const key = cursor.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function onboardingStage(row: { documentsStatus?: string | null; ftd?: boolean; phone?: string | null }): "welcome" | "kyc" | "funded" | "live" {
  if (row.ftd) return "live";
  if (String(row.documentsStatus || "").toUpperCase() === "APPROVED") return "funded";
  if (row.phone) return "kyc";
  return "welcome";
}
