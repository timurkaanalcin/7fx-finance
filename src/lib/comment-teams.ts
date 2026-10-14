/**
 * Sale / Retention comment areas (UserNote.team = "SALE" | "RET"; RET is shown as "Retention").
 *
 * Visibility & write rules (enforced server-side):
 *   - Sale staff (jobTitle sales_mgr | sales_manager): see + write SALE only; RET notes are hidden everywhere.
 *   - Retention staff (jobTitle retention_manager): see SALE + RET, write RET only.
 *   - Everyone else (admins, heads, owner, …): see + write both.
 */
export type CommentTeam = "SALE" | "RET";
export type StaffLike = { role?: string | null; jobTitle?: string | null } | null | undefined;

export const SALE_JOB_TITLES = ["sales_mgr", "sales_manager"] as const;
export const RETENTION_JOB_TITLES = ["retention_manager"] as const;

export type CommentRole = "SALE" | "RETENTION" | "ALL";
export function commentRoleOf(staff: StaffLike): CommentRole {
  const jt = String(staff?.jobTitle || "");
  if ((SALE_JOB_TITLES as readonly string[]).includes(jt)) return "SALE";
  if ((RETENTION_JOB_TITLES as readonly string[]).includes(jt)) return "RETENTION";
  return "ALL";
}

export function visibleTeams(staff: StaffLike): CommentTeam[] {
  return commentRoleOf(staff) === "SALE" ? ["SALE"] : ["SALE", "RET"];
}
export function writableTeams(staff: StaffLike): CommentTeam[] {
  const r = commentRoleOf(staff);
  return r === "SALE" ? ["SALE"] : r === "RETENTION" ? ["RET"] : ["SALE", "RET"];
}
export function canSeeTeam(staff: StaffLike, team: unknown): boolean {
  if (team == null || team === "") return true; // general (legacy) notes
  return (visibleTeams(staff) as string[]).includes(String(team));
}
/** Prisma where-fragment for UserNote rows the staff may see (undefined = no restriction). */
export function noteVisibilityWhere(staff: StaffLike): Record<string, unknown> | undefined {
  if (commentRoleOf(staff) !== "SALE") return undefined;
  return { OR: [{ team: null }, { team: { not: "RET" } }] };
}
export function filterNotes<T extends { team?: unknown }>(staff: StaffLike, notes: T[]): T[] {
  return notes.filter((n) => canSeeTeam(staff, n.team));
}
